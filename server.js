const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    // Habilitar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Ruta de API para guardar la configuración directamente al disco
    if (req.method === 'POST' && req.url === '/api/save-config') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const configData = JSON.parse(body);
                
                // Guardar config.js
                const configJsContent = `// Configuración de Carrera autogenerada por el Panel Administrativo\nwindow.RACE_CONFIG = ${JSON.stringify(configData, null, 2)};\n`;
                fs.writeFileSync(path.join(PUBLIC_DIR, 'config.js'), configJsContent, 'utf8');
                
                // Guardar config.json por compatibilidad
                fs.writeFileSync(path.join(PUBLIC_DIR, 'config.json'), JSON.stringify(configData, null, 2), 'utf8');

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', message: 'Configuración guardada exitosamente.' }));
                console.log('[API] Configuración guardada en disco.');
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: err.message }));
                console.error('[API] Error al guardar configuración:', err);
            }
        });
        return;
    }

    // Ruta de API para subir archivos (imágenes, GPX, PDF, KML) y guardarlos en la carpeta IMAGENES
    if (req.method === 'POST' && req.url === '/api/upload-file') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const payload = JSON.parse(body);
                const { fileName, fileData } = payload;
                
                if (!fileName || !fileData) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ status: 'error', message: 'Nombre de archivo o datos faltantes.' }));
                    return;
                }

                // Convertir Base64 a buffer
                const base64Data = fileData.replace(/^data:.*?;base64,/, "");
                const buffer = Buffer.from(base64Data, 'base64');

                // Asegurar que exista la carpeta IMAGENES
                const destDir = path.join(PUBLIC_DIR, 'IMAGENES');
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir);
                }

                // Guardar archivo
                const destPath = path.join(destDir, fileName);
                fs.writeFileSync(destPath, buffer);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    status: 'success', 
                    message: 'Archivo guardado en el servidor local con éxito.',
                    filePath: `./IMAGENES/${fileName}`
                }));
                console.log(`[API] Archivo guardado con éxito en: ${destPath}`);
            } catch (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: err.message }));
                console.error('[API] Error al guardar archivo subido:', err);
            }
        });
        return;
    }

    // Servidor de archivos estáticos básico
    const decodedUrl = decodeURIComponent(req.url);
    let filePath = path.join(PUBLIC_DIR, decodedUrl === '/' || decodedUrl === '' ? 'index.html' : decodedUrl);
    
    // Validar seguridad de ruta (evitar directory traversal)
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n==================================================`);
    console.log(`Servidor local de Trail Running Portal corriendo en:`);
    console.log(`👉 http://localhost:${PORT}/index.html (Formulario Público)`);
    console.log(`👉 http://localhost:${PORT}/admin.html (Panel de Control)`);
    console.log(`==================================================\n`);
});

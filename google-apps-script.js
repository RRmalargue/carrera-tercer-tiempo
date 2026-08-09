/**
 * GOOGLE APPS SCRIPT - INTEGRACIÓN CON PLANILLA Y GOOGLE DRIVE
 * 
 * INSTRUCCIONES DE CONFIGURACIÓN:
 * 1. Ve a Google Drive (https://drive.google.com) y crea una nueva Hoja de Cálculo (Google Sheets).
 * 2. Ponle un nombre a tu planilla (ej: "Inscripciones Trail Alpa Chiri 2026").
 * 3. En la barra de menú superior de la hoja, ve a Extensiones -> Apps Script.
 * 4. Borra todo el código que aparezca en el editor y pega este archivo completo.
 * 5. Guarda el proyecto haciendo clic en el icono del disco (Guardar).
 * 6. Haz clic en el botón "Implementar" (arriba a la derecha) -> "Nueva implementación".
 * 7. Selecciona el tipo: "Aplicación web" (haciendo clic en la rueda dentada).
 * 8. Configura los parámetros:
 *    - Descripción: "Inscripciones Trail"
 *    - Ejecutar como: "Yo" (tu cuenta de Google)
 *    - Quién tiene acceso: "Cualquiera" (IMPORTANTE para permitir que el formulario público envíe los datos).
 * 9. Haz clic en "Implementar". Te pedirá "Autorizar acceso". Otorga todos los permisos solicitados.
 * 10. Copia la "URL de la aplicación web" que te proporciona (ej: https://script.google.com/macros/s/XXXXX/exec).
 * 11. Abre el archivo `app.js` de tu proyecto y reemplaza 'TU_SCRIPT_URL_AQUI' por esta URL copiada.
 * ¡Listo! Tu portal ya está conectado en vivo a tu planilla y Google Drive.
 */

// Función principal que recibe las peticiones POST del formulario
function doPost(e) {
  try {
    // 1. Parsear el contenido recibido
    var requestData = JSON.parse(e.postData.contents);
    
    // 2. Obtener o crear carpeta en Google Drive para guardar los comprobantes
    var folderName = "Comprobantes_" + (requestData.raceName || "Carrera_Trail").replace(/[^a-zA-Z0-9_]/g, "_");
    var folder = getOrCreateFolder(folderName);
    
    // 3. Subir el archivo de comprobante de pago a Google Drive
    var fileUrl = "";
    if (requestData.comprobante_base64 && requestData.comprobante_nombre) {
      fileUrl = saveFileToDrive(
        folder, 
        requestData.comprobante_base64, 
        requestData.comprobante_tipo, 
        requestData.comprobante_nombre,
        requestData.nombre + "_" + requestData.apellido + "_" + requestData.cuil
      );
    }
    
    // 4. Escribir los datos del corredor en Google Sheets
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Si la hoja está totalmente vacía, crear los encabezados
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Fecha de Registro", 
        "Nombre", 
        "Apellido", 
        "CUIL", 
        "Fecha Nacimiento", 
        "Edad", 
        "Género", 
        "Categoría", 
        "Teléfono", 
        "Talle Remera", 
        "Team o Lugar de Origen",
        "Distancia", 
        "Costo Abonado ($)", 
        "Enlace Comprobante (Drive)"
      ];
      sheet.appendRow(headers);
      
      // Dar formato a los encabezados (Negrita, fondo gris oscuro, letras blancas)
      sheet.getRange(1, 1, 1, headers.length)
           .setFontWeight("bold")
           .setBackground("#1f2937")
           .setFontColor("#ffffff")
           .setHorizontalAlignment("center");
      
      // Autoajustar el tamaño de las columnas
      sheet.autoResizeColumns(1, headers.length);
    }
    
    // Fila con los datos del corredor
    var rowData = [
      formatDate(requestData.timestamp),
      requestData.nombre,
      requestData.apellido,
      formatCUIL(requestData.cuil),
      requestData.fecha_nacimiento,
      requestData.edad,
      requestData.genero,
      requestData.categoria,
      requestData.telefono,
      requestData.talle_remera,
      requestData.team_origen || '',
      requestData.distancia,
      Number(requestData.costo),
      fileUrl
    ];
    
    sheet.appendRow(rowData);
    
    // Retornar éxito a la aplicación web
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Registro procesado exitosamente"
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log("Error: " + error.toString());
    // Retornar el error para debuggear
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Busca o crea la carpeta de almacenamiento de comprobantes en Drive
function getOrCreateFolder(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return DriveApp.createFolder(folderName);
  }
}

// Guarda un archivo decodificado en Base64 directamente a Drive y retorna su URL
function saveFileToDrive(folder, base64Data, contentType, fileName, runnerName) {
  // Decodificar Base64
  var decoded = Utilities.base64Decode(base64Data);
  
  // Obtener la extensión del archivo
  var ext = "";
  var parts = fileName.split('.');
  if (parts.length > 1) {
    ext = "." + parts.pop();
  }
  
  // Crear nuevo nombre del archivo: "Nombre_Apellido_CUIL_Comprobante.ext"
  var newFileName = runnerName + "_Comprobante" + ext;
  
  // Crear el blob del archivo
  var blob = Utilities.newBlob(decoded, contentType, newFileName);
  
  // Guardar en la carpeta
  var file = folder.createFile(blob);
  
  // Cambiar permisos para que cualquiera con el enlace lo vea (facilita al organizador revisarlo desde la planilla)
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

// Formatear CUIL numérico de 11 dígitos a XX-XXXXXXXX-X
function formatCUIL(cuil) {
  if (!cuil || cuil.length !== 11) return cuil;
  return cuil.substring(0, 2) + "-" + cuil.substring(2, 10) + "-" + cuil.substring(10);
}

// Formatear fecha y hora UTC a formato legible local
function formatDate(isoString) {
  if (!isoString) return new Date().toLocaleString();
  var date = new Date(isoString);
  // Restamos 3 horas para huso horario de Argentina (opcional si tu servidor de GAS está en otra zona horaria)
  return Utilities.formatDate(date, "GMT-3", "dd/MM/yyyy HH:mm:ss");
}

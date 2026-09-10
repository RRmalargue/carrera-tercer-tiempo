// sw.js - Service Worker para habilitar la instalación de la PWA y actualizaciones inmediatas
const CACHE_NAME = 'trail-portal-v4.4';
const ASSETS = [
    './index.html',
    './index.css?v=4.4',
    './app.js?v=4.4',
    './config.js?v=4.4',
    './manifest.json',
    './IMAGENES/LOGO.jpg'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS).catch((err) => {
                console.warn('Fallo al precargar recursos en caché del SW:', err);
            });
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) {
                            return caches.delete(key);
                        }
                    })
                );
            })
        ])
    );
});

// Estrategia Network-First: Siempre busca la versión más reciente en internet.
// Si no hay conexión o falla la red, utiliza la versión guardada en caché.
self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
        return;
    }

    e.respondWith(
        fetch(e.request)
            .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            })
            .catch(() => {
                return caches.match(e.request);
            })
    );
});

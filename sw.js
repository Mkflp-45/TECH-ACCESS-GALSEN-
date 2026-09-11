// Service worker minimal — sert uniquement à satisfaire les critères
// d'installabilité PWA des navigateurs (Chrome/Android notamment).
//
// ⚠️ Volontairement, il ne met RIEN en cache : ce site affiche des prix, un
// stock et des promotions en temps réel via Firestore. Mettre ça en cache
// pourrait faire voir à un client un prix ou un stock périmé. Toutes les
// requêtes passent donc simplement au réseau, sans interception.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

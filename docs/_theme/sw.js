// L'application (PWA) était servie ici (GitHub Pages) avant d'être publiée sur Cloudflare uniquement.
// Ce service worker remplace l'ancien : il vide les caches, se désinscrit et recharge les pages ouvertes,
// pour que les appareils qui avaient installé l'ancienne version voient la documentation, puis suivent le lien vers l'application.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      for (const client of clients) client.navigate(client.url);
    })(),
  );
});

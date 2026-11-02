/* Imported into the Workbox-generated service worker (see `workbox.importScripts` in vite.config.ts). */

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url ?? './', self.registration.scope).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const client = windows.find((candidate) => candidate.url.startsWith(self.registration.scope));
      if (client) {
        await client.focus();
        client.postMessage({ type: 'notification-click', url });
        return;
      }
      await self.clients.openWindow(url);
    })(),
  );
});

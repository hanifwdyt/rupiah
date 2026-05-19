// Rupiah Tracker — Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = { title: "Rupiah Tracker", body: "Update kurs terbaru.", url: "/" };
  try {
    payload = { ...payload, ...event.data.json() };
  } catch (_) {
    payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: payload.tag || "rupiah-update",
      data: { url: payload.url || "/" },
      requireInteraction: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        try {
          const url = new URL(client.url);
          const target = new URL(targetUrl, self.location.origin);
          if (url.origin === target.origin) {
            client.focus();
            client.navigate(target.toString());
            return;
          }
        } catch (_) {}
      }
      await self.clients.openWindow(targetUrl);
    })(),
  );
});

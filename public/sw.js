/* UbiDely Service Worker — Web Push API, Background Notifications & Resilient Media Cache */

const MEDIA_CACHE_NAME = 'ubidely-media-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  const cleanupCaches =
    typeof caches !== 'undefined'
      ? caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith('ubidely-media-') && key !== MEDIA_CACHE_NAME)
                .map((key) => caches.delete(key))
            )
          )
          .catch(() => undefined)
      : Promise.resolve();

  event.waitUntil(Promise.all([self.clients.claim(), cleanupCaches]));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isMenuMedia =
    request.destination === 'image' ||
    url.pathname.startsWith('/src/assets/images/') ||
    (url.pathname.startsWith('/assets/') && /\.(jpe?g|png|webp|avif|svg)$/i.test(url.pathname));

  if (!isMenuMedia || typeof caches === 'undefined') return;

  // Normalize cache key by stripping transient retry query parameters
  const cacheUrl = new URL(url.href);
  cacheUrl.searchParams.delete('retry');

  event.respondWith(
    caches
      .open(MEDIA_CACHE_NAME)
      .then(async (cache) => {
        const cached = await cache.match(cacheUrl.href);
        const networkPromise = fetch(request)
          .then((response) => {
            if (response && response.ok && response.type === 'basic') {
              void cache.put(cacheUrl.href, response.clone());
            }
            return response;
          })
          .catch(() => null);

        if (cached) {
          event.waitUntil(networkPromise);
          return cached;
        }

        const networkResponse = await networkPromise;
        if (networkResponse) {
          return networkResponse;
        }
        return Response.error();
      })
      .catch(() => fetch(request))
  );
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'UbiDely · Actualización de servicio',
    body: 'Tienes una actualización en el estado de tu viaje o pedido.',
    tag: 'ubidely-status',
    category: 'ride',
    url: '/',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
      };
    } catch {
      const text = event.data.text();
      if (text) {
        payload.body = text;
      }
    }
  }

  // Ensure relative same-origin navigation path only
  const safeUrl =
    typeof payload.url === 'string' && payload.url.startsWith('/') ? payload.url : '/';

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || 'ubidely-status',
    renotify: true,
    vibrate: [180, 90, 180],
    data: {
      url: safeUrl,
      category: payload.category,
      dispatchId: payload.dispatchId || null,
    },
    actions: [
      { action: 'open-track', title: 'Ver rastreo' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const rawUrl = event.notification?.data?.url;
  const targetPath = typeof rawUrl === 'string' && rawUrl.startsWith('/') ? rawUrl : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'PUSH_NOTIFICATION_CLICK',
            data: event.notification.data,
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});

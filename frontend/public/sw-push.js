/**
 * Push notification event handlers for the Insurons PWA service worker.
 * This file is imported by the Workbox-generated SW via importScripts.
 */

// Handle incoming push messages
self.addEventListener('push', function (event) {
  if (!event.data) return;

  var payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: 'Insurons', body: event.data.text() };
  }

  var title = payload.title || 'Insurons';
  var options = {
    body: payload.body || '',
    icon: '/shield-192.png',
    badge: '/favicon-32.png',
    tag: payload.tag || 'insurons-notification',
    data: {
      url: payload.action_url || payload.url || '/notifications',
    },
    actions: payload.actions || [],
    vibrate: [100, 50, 100],
    requireInteraction: payload.requireInteraction || false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification click — open the target URL
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : '/notifications';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Focus existing window if open
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

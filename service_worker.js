const CACHE_NAME = 'focusflow-cache-v3';
const OFFLINE_URL = './index.html';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
];

const localTimers = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch((error) => {
      console.error('[Service Worker] Failed to cache during install:', error);
    }),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(OFFLINE_URL));
    }),
  );
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (!type) return;

  if (type === 'SCHEDULE_NOTIFICATION') {
    scheduleLocalNotification(payload || {});
  } else if (type === 'CANCEL_NOTIFICATION') {
    cancelLocalNotification(payload?.tag);
  }
});

function scheduleLocalNotification({ delay = 0, title = 'FocusFlow', options = {}, tag = 'pomodoro-timer', data = {} }) {
  const normalizedDelay = Math.max(0, Number(delay) || 0);
  clearTimeout(localTimers.get(tag));

  const timerId = setTimeout(() => {
    const notificationOptions = {
      renotify: true,
      requireInteraction: false,
      tag,
      icon: options.icon || './favicon.ico',
      badge: options.badge || './favicon.ico',
      ...options,
      data: {
        ...(options.data || {}),
        ...data,
      },
      actions:
        options.actions || [
          { action: 'pause', title: 'Pause' },
          { action: 'resume', title: 'Resume' },
          { action: 'stop', title: 'Stop' },
        ],
    };

    self.registration.getNotifications({ tag }).then((notifications) => {
      notifications.forEach((notification) => notification.close());
    });

    self.registration
      .showNotification(title, notificationOptions)
      .then(() => {
        if (data.newState && data.oldState) {
          notifyClients({ type: 'TIMER_ENDED', newState: data.newState, oldState: data.oldState });
        }
      })
      .catch((error) => console.error('[Service Worker] Error showing notification:', error));

    localTimers.delete(tag);
  }, normalizedDelay);

  localTimers.set(tag, timerId);
}

function cancelLocalNotification(tag = 'pomodoro-timer') {
  if (localTimers.has(tag)) {
    clearTimeout(localTimers.get(tag));
    localTimers.delete(tag);
  }
  self.registration.getNotifications({ tag }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const visibleClient = clientsArr.find((client) => client.visibilityState === 'visible');
      const targetClient = visibleClient || clientsArr[0];
      if (targetClient) {
        return targetClient.focus().then(() => {
          if (action) {
            targetClient.postMessage({ type: 'notification_action', action, data: event.notification.data || {} });
          }
        });
      }
      if (!visibleClient) {
        return self.clients.openWindow('./');
      }
      return undefined;
    }),
  );
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = { body: event.data?.text() };
  }

  const title = payload.title || 'FocusFlow';
  const options = {
    body: payload.body || '',
    icon: payload.icon || './favicon.ico',
    badge: payload.badge || './favicon.ico',
    tag: payload.tag || 'focusflow-push',
    renotify: true,
    actions:
      payload.actions || [
        { action: 'pause', title: 'Pause' },
        { action: 'resume', title: 'Resume' },
        { action: 'stop', title: 'Stop' },
      ],
    data: payload.data || {},
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        if (options.data.newState && options.data.oldState) {
          notifyClients({ type: 'TIMER_ENDED', newState: options.data.newState, oldState: options.data.oldState });
        }
      })
      .catch((error) => console.error('[Service Worker] Error displaying push notification:', error)),
  );
});

self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      clientsArr.forEach((client) => client.postMessage({ type: 'pushsubscriptionchange' }));
    }),
  );
});

function notifyClients(message) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
    clientsArr.forEach((client) => client.postMessage(message));
  });
}

// FocusFlow Service Worker with push notification support
// Version 2.0.0

const CACHE_NAME = 'focusflow-cache-v3';
const OFFLINE_URL = './offline.html';
const POMODORO_ALARM_ID = 'pomodoro-timer';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './pomodoro-worker.js',
  './icons/pause.png',
  './icons/play.png',
  './icons/stop.png',
  OFFLINE_URL,
];

const scheduledAlarms = new Map();

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.all(
        urlsToCache.map(async (url) => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(`[SW] Failed to cache ${url}:`, error);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(
      (cachedResponse) =>
        cachedResponse ||
        fetch(event.request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch((error) => {
              console.warn('[SW] Failed to cache response:', error);
            });
            return networkResponse;
          })
          .catch(() => caches.match(OFFLINE_URL))
    )
  );
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  if (type === 'SCHEDULE_ALARM') {
    scheduleLocalNotification(payload);
  } else if (type === 'CANCEL_ALARM') {
    cancelLocalNotification(payload?.timerId);
  }
});

function scheduleLocalNotification(payload = {}) {
  const {
    delay = 0,
    timerId = POMODORO_ALARM_ID,
    transitionMessage = {},
  } = payload;

  if (!transitionMessage || !transitionMessage.title) {
    return;
  }

  const { title, options = {} } = transitionMessage;
  const notificationOptions = {
    ...options,
    tag: options.tag || timerId,
    renotify: true,
    actions: [
      { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
      { action: 'resume', title: 'Resume', icon: './icons/play.png' },
      { action: 'stop', title: 'Stop', icon: './icons/stop.png' },
    ],
  };

  clearScheduledAlarm(timerId);
  self.registration.getNotifications({ tag: notificationOptions.tag }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });

  const timeoutId = setTimeout(() => {
    scheduledAlarms.delete(timerId);
    self.registration
      .showNotification(title, notificationOptions)
      .then(() => notifyClients(transitionMessage))
      .catch((error) => console.error('[SW] Local notification failed:', error));
  }, Math.max(0, delay));

  scheduledAlarms.set(timerId, timeoutId);
}

function cancelLocalNotification(timerId = POMODORO_ALARM_ID) {
  clearScheduledAlarm(timerId);
  self.registration.getNotifications({ tag: timerId }).then((notifications) => {
    notifications.forEach((notification) => notification.close());
  });
}

function clearScheduledAlarm(timerId) {
  const timeoutId = scheduledAlarms.get(timerId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    scheduledAlarms.delete(timerId);
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) {
    console.warn('[SW] Push event without payload.');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch (error) {
    console.warn('[SW] Failed to parse push payload as JSON:', error);
    payload = { title: 'FocusFlow', body: event.data.text() };
  }

  const title = payload.title || 'FocusFlow';
  const options = {
    body: payload.body || '',
    tag: payload.tag || 'focusflow-push',
    renotify: payload.renotify ?? true,
    icon: payload.icon || './icons/play.png',
    badge: payload.badge || './icons/play.png',
    data: payload.data || {},
    actions: payload.actions || [],
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => notifyClients({ type: 'PUSH_NOTIFICATION', payload }))
      .catch((error) => console.error('[SW] Push notification failed:', error))
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const focused = clients.find((client) => client.visibilityState === 'visible') || clients[0];
        if (focused) {
          focused.focus();
          focused.postMessage({ type: 'notification_action', action, data: event.notification.data });
        } else {
          self.clients.openWindow('./');
        }
      })
  );
});

function notifyClients(message) {
  return self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((clients) => {
      clients.forEach((client) => client.postMessage(message));
    })
    .catch((error) => console.error('[SW] notifyClients failed:', error));
}

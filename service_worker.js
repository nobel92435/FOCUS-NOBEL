const CACHE_NAME = 'focusflow-cache-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico'
];

const notificationActions = [
  { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
  { action: 'resume', title: 'Resume', icon: './icons/play.png' },
  { action: 'stop', title: 'Stop', icon: './icons/stop.png' }
];

let vapidPublicKey = null;
const pendingTimeouts = new Map();

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)).catch(err => {
      console.warn('[Service Worker] Failed to pre-cache assets:', err);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(hit => {
      if (hit) return hit;
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', event => {
  const { type, payload } = event.data || {};
  if (!type) return;

  switch (type) {
    case 'SCHEDULE_ALARM':
    case 'SCHEDULE_NOTIFICATION':
      scheduleLocalNotification(payload || {});
      break;
    case 'CANCEL_ALARM':
      clearScheduledNotification(payload?.timerId);
      break;
    case 'SET_VAPID_KEY':
      vapidPublicKey = typeof payload === 'string' ? payload : null;
      break;
    default:
      break;
  }
});

function scheduleLocalNotification({
  delay = 0,
  title,
  options = {},
  transitionMessage = null,
  timerId = 'pomodoro-transition'
} = {}) {
  const tag = options.tag || timerId || 'pomodoro-transition';
  if (pendingTimeouts.has(tag)) {
    clearTimeout(pendingTimeouts.get(tag));
    pendingTimeouts.delete(tag);
  }

  const notificationTitle = title || transitionMessage?.title || 'FocusFlow';
  const notificationOptions = {
    renotify: true,
    tag,
    actions: Array.isArray(options.actions) && options.actions.length > 0 ? options.actions : notificationActions,
    ...options
  };

  const timeoutId = setTimeout(() => {
    pendingTimeouts.delete(tag);
    self.registration.showNotification(notificationTitle, notificationOptions).then(() => {
      if (!transitionMessage) return;
      notifyClients(transitionMessage);
    });
  }, Math.max(0, delay));

  pendingTimeouts.set(tag, timeoutId);
}

function clearScheduledNotification(timerId) {
  const tag = timerId || 'pomodoro-transition';
  if (pendingTimeouts.has(tag)) {
    clearTimeout(pendingTimeouts.get(tag));
    pendingTimeouts.delete(tag);
  }
  self.registration.getNotifications({ tag }).then(notifications => {
    notifications.forEach(notification => notification.close());
  });
}

self.addEventListener('push', event => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'FocusFlow', body: event.data.text() };
  }

  const {
    title = 'FocusFlow',
    body = '',
    data,
    actions,
    transitionMessage = null,
    tag = 'pomodoro-push',
    ...rest
  } = payload || {};

  const options = {
    body,
    data,
    renotify: true,
    tag,
    actions: Array.isArray(actions) && actions.length > 0 ? actions : notificationActions,
    ...rest
  };

  event.waitUntil(
    self.registration.showNotification(title, options).then(() => {
      if (!transitionMessage) return;
      return notifyClients(transitionMessage);
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const action = event.action;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const focused = clients.find(client => client.visibilityState === 'visible') || clients[0];
      if (focused) {
        return focused.focus().then(() => {
          focused.postMessage({ type: 'notification_action', action });
        });
      }
      return self.clients.openWindow('./');
    })
  );
});

self.addEventListener('pushsubscriptionchange', event => {
  if (!vapidPublicKey) return;

  const applicationServerKey = base64ToUint8Array(vapidPublicKey);
  event.waitUntil(
    self.registration.pushManager
      .subscribe({ userVisibleOnly: true, applicationServerKey })
      .then(subscription =>
        notifyClients({ type: 'push_subscription_changed', subscription: subscription.toJSON() })
      )
  );
});

function notifyClients(message) {
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage(message));
  });
}

function base64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

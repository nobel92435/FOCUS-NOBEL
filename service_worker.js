// HYBRID Service Worker for FocusFlow
// Version 1.0.2 (updated for timer reliability and notification options fix)

const CACHE_NAME = 'focusflow-cache-v2'; // Increment cache version for updates
const OFFLINE_URL = './offline.html'; // Path to your dedicated offline page

// These paths should be relative to the root of the Service Worker's scope.
const urlsToCache = [
    './', // Represents the root of your app
    './index.html',
    './manifest.json',
    './pomodoro-worker.js', // This worker is for the main app, not the SW
    './icons/pause.png',
    './icons/play.png',
    './icons/stop.png',
    OFFLINE_URL, // Add the offline page to cache
    'https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192',
    'https://placehold.co/512x512/0a0a0a/e0e0e0?text=Flow+512',
];

// --- Service Worker Lifecycle Events ---

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching essential app shell assets:', urlsToCache);
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Failed to cache during install:', error);
            })
    );
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request).then(networkResponse => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }

                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });
                return networkResponse;
            }).catch(error => {
                console.error('[Service Worker] Fetch failed:', event.request.url, error);
                return caches.match(OFFLINE_URL);
            });
        })
    );
});

// --- Service Worker Timer/Notification Logic ---

let notificationTag = 'pomodoro-timer';

self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SCHEDULE_ALARM':
        case 'SCHEDULE_NOTIFICATION':
            scheduleNotification(payload);
            break;
        case 'CANCEL_ALARM':
            cancelAlarm(payload?.timerId);
            break;
    }
});

function scheduleNotification(payload = {}) {
    const delay = typeof payload.delay === 'number' ? payload.delay : 0;
    const transitionMessage = payload.transitionMessage || {};
    const { title, options = {} } = transitionMessage;

    if (!title) {
        console.warn('[Service Worker] Missing notification title, skipping schedule.');
        return;
    }
    
    options.tag = options.tag || notificationTag;
    options.renotify = options.renotify ?? true;
    options.data = {
        ...options.data,
        transitionMessage
    };

    self.registration.getNotifications({ tag: options.tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
    });

    setTimeout(() => {
        self.registration.showNotification(title, options)
            .catch(err => console.error('Error showing notification:', err));
    }, Math.max(delay, 0));
}

function cancelAlarm(timerId) {
    if (timerId === 'pomodoro-transition') {
        self.registration.getNotifications({ tag: notificationTag }).then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    }
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const transitionMessage = event.notification?.data?.transitionMessage;

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            const client = clients.find(c => c.visibilityState === 'visible') || clients[0];
            if (client) {
                client.postMessage(transitionMessage);
                return client.focus();
            }
        })
    );
});

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('[Service Worker] Push event received without data.');
        return;
    }

    let payload = {};
    try {
        payload = event.data.json();
    } catch (error) {
        payload = { body: event.data.text() };
    }

    const title = payload.title || 'FocusFlow';
    const options = { ...(payload.options || {}) };
    const fallbackBody = typeof payload.body === 'string' ? payload.body : undefined;
    if (fallbackBody && !options.body) {
        options.body = fallbackBody;
    }

    const defaultIcon = 'https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192';
    options.icon = options.icon || payload.icon || defaultIcon;
    options.badge = options.badge || payload.badge;
    options.vibrate = options.vibrate || payload.vibrate || [100, 50, 100];
    options.tag = options.tag || notificationTag;
    options.data = {
        ...(options.data || {}),
        dateOfArrival: Date.now(),
        primaryKey: 1,
        payload
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

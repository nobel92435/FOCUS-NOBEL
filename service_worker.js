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

const DEFAULT_NOTIFICATION_ICON = 'https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192';
const DEFAULT_NOTIFICATION_BADGE = 'https://placehold.co/96x96/0a0a0a/e0e0e0?text=Flow';
const DEFAULT_NOTIFICATION_VIBRATE = [200, 100, 200, 100, 200];

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

const pendingNotifications = new Map();

self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SCHEDULE_ALARM':
        case 'SCHEDULE_NOTIFICATION':
            if (typeof event.waitUntil === 'function') {
                event.waitUntil(scheduleNotification(payload));
            } else {
                scheduleNotification(payload);
            }
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
        return Promise.resolve();
    }

    options.tag = options.tag || notificationTag;
    options.renotify = options.renotify ?? true;
    options.requireInteraction = options.requireInteraction ?? true;
    options.icon = options.icon || DEFAULT_NOTIFICATION_ICON;
    options.badge = options.badge || DEFAULT_NOTIFICATION_BADGE;
    options.vibrate = options.vibrate || DEFAULT_NOTIFICATION_VIBRATE;
    options.timestamp = options.timestamp || Date.now();
    options.data = {
        ...options.data,
        transitionMessage
    };

    const timerKey = payload.timerId || options.tag || notificationTag;
    const existingController = pendingNotifications.get(timerKey);
    if (existingController) {
        existingController.abort();
        pendingNotifications.delete(timerKey);
    }

    const controller = new AbortController();
    pendingNotifications.set(timerKey, controller);

    return (async () => {
        try {
            await closeExistingNotifications(options.tag);

            if (delay > 0) {
                await waitForDelay(delay, controller.signal);
            }

            if (controller.signal.aborted) {
                return;
            }

            await self.registration.showNotification(title, options);
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Error showing scheduled notification:', err);
            }
        } finally {
            const stored = pendingNotifications.get(timerKey);
            if (stored === controller) {
                pendingNotifications.delete(timerKey);
            }
        }
    })();
}

function waitForDelay(delay, signal) {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            signal.removeEventListener('abort', onAbort);
            resolve();
        }, Math.max(delay, 0));

        function onAbort() {
            clearTimeout(timeoutId);
            signal.removeEventListener('abort', onAbort);
            reject(new DOMException('Notification scheduling aborted', 'AbortError'));
        }

        signal.addEventListener('abort', onAbort);
    });
}

function closeExistingNotifications(tag) {
    return self.registration.getNotifications(tag ? { tag } : {}).then(notifications => {
        notifications.forEach(notification => notification.close());
    });
}

function cancelAlarm(timerId) {
    const key = timerId || notificationTag;
    const controller = pendingNotifications.get(key);
    if (controller) {
        controller.abort();
        pendingNotifications.delete(key);
    }

    if (timerId) {
        closeExistingNotifications(timerId);
    } else {
        closeExistingNotifications(notificationTag);
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

function firstNonEmptyString(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
            return value;
        }
    }
    return undefined;
}

function normalizePushPayload(incoming) {
    if (typeof incoming === 'string') {
        return {
            title: 'FocusFlow',
            options: {
                body: incoming,
                icon: DEFAULT_NOTIFICATION_ICON,
                badge: DEFAULT_NOTIFICATION_BADGE,
                vibrate: DEFAULT_NOTIFICATION_VIBRATE,
                requireInteraction: true,
                renotify: true,
                timestamp: Date.now(),
                tag: notificationTag,
                data: {
                    rawPayload: incoming
                }
            }
        };
    }

    if (!incoming || typeof incoming !== 'object') {
        return {
            title: 'FocusFlow',
            options: {
                icon: DEFAULT_NOTIFICATION_ICON,
                badge: DEFAULT_NOTIFICATION_BADGE,
                vibrate: DEFAULT_NOTIFICATION_VIBRATE,
                requireInteraction: true,
                renotify: true,
                timestamp: Date.now(),
                tag: notificationTag,
                data: {
                    rawPayload: incoming
                }
            }
        };
    }

    const visited = new Set();
    let base = incoming;
    while (base && typeof base === 'object' && base.payload && typeof base.payload === 'object' && !visited.has(base.payload)) {
        visited.add(base);
        base = base.payload;
    }

    const baseObject = base && typeof base === 'object' ? base : {};

    const optionsSources = [incoming.options, baseObject.options];
    const mergedOptions = Object.assign({}, ...optionsSources.filter(opt => opt && typeof opt === 'object'));

    const title = firstNonEmptyString(
        baseObject.title,
        incoming.title,
        'FocusFlow'
    );

    const body = firstNonEmptyString(
        mergedOptions.body,
        baseObject.body,
        incoming.body
    );
    if (body) {
        mergedOptions.body = body;
    }

    mergedOptions.icon = mergedOptions.icon || baseObject.icon || incoming.icon || DEFAULT_NOTIFICATION_ICON;
    mergedOptions.badge = mergedOptions.badge || baseObject.badge || incoming.badge || DEFAULT_NOTIFICATION_BADGE;
    mergedOptions.vibrate = mergedOptions.vibrate || baseObject.vibrate || incoming.vibrate || DEFAULT_NOTIFICATION_VIBRATE;
    mergedOptions.requireInteraction = mergedOptions.requireInteraction ?? baseObject.requireInteraction ?? incoming.requireInteraction ?? true;
    mergedOptions.renotify = mergedOptions.renotify ?? baseObject.renotify ?? incoming.renotify ?? true;
    mergedOptions.timestamp = mergedOptions.timestamp || baseObject.timestamp || incoming.timestamp || Date.now();
    mergedOptions.tag = mergedOptions.tag || baseObject.tag || incoming.tag || notificationTag;

    const dataSources = [
        typeof mergedOptions.data === 'object' ? mergedOptions.data : null,
        typeof baseObject.data === 'object' ? baseObject.data : null,
        typeof incoming.data === 'object' ? incoming.data : null
    ].filter(Boolean);

    const mergedData = Object.assign({}, ...dataSources);

    mergedOptions.data = {
        ...mergedData,
        rawPayload: incoming,
        payload: baseObject
    };

    return {
        title,
        options: mergedOptions
    };
}

self.addEventListener('push', (event) => {
    if (!event.data) {
        console.warn('[Service Worker] Push event received without data.');
        return;
    }

    let parsedPayload;
    try {
        parsedPayload = event.data.json();
    } catch (error) {
        parsedPayload = event.data.text();
    }

    const { title, options } = normalizePushPayload(parsedPayload);
    event.waitUntil(self.registration.showNotification(title, options));
});

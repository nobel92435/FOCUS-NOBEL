// HYBRID Service Worker for FocusFlow
// Version 1.0.2 (updated for timer reliability and notification options fix)

const CACHE_NAME = 'focusflow-cache-v3'; // Increment cache version for updates
const OFFLINE_URL = './index.html'; // Use the main page as the offline fallback

// IMPORTANT: These paths should be relative to the root of the Service Worker's scope.
// If your service-worker.js is at /Focus-Clock/service-worker.js, then './' refers to /Focus-Clock/
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    OFFLINE_URL,
];

// --- Service Worker Lifecycle Events ---

// Install event: Pre-cache essential assets and skip waiting
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    // Force the waiting service worker to become the active service worker immediately
    self.skipWaiting(); 

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching essential app shell assets:', urlsToCache);
                // Ensure all cache operations are part of the waitUntil promise
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[Service Worker] Failed to cache during install:', error);
            })
    );
});

// Activate event: Clean up old caches and take control of existing clients
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME) // Filter out the current cache
                    .map(cacheName => {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName); // Delete old caches
                    })
            );
        }).then(() => self.clients.claim()) // Take control of all clients immediately
    );
});

// Fetch event handler: Cache-first, then Network, with offline fallback
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            // If a response is found in cache, return it immediately
            if (cachedResponse) {
                return cachedResponse;
            }

            // Otherwise, fetch from the network
            return fetch(event.request).then(networkResponse => {
                // Check if we received a valid response to cache
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse; // Don't cache invalid responses
                }

                // IMPORTANT: Clone the response. A response is a stream and can only be consumed once.
                // We're consuming it once to cache it, and once to return it.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache); // Add response to cache
                });

                return networkResponse;
            }).catch(error => {
                // This catch block handles network errors (e.g., when offline)
                console.error('[Service Worker] Fetch failed:', event.request.url, error);
                // Serve the pre-cached offline page as a fallback
                return caches.match(OFFLINE_URL);
            });
        })
    );
});

// --- Service Worker Timer/Notification Logic ---

let notificationTag = 'pomodoro-timer'; // A tag for notifications to group them

// Listen for messages from the main page
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SCHEDULE_ALARM':
            scheduleNotification(payload);
            break;
        case 'SCHEDULE_NOTIFICATION':
            scheduleNotification({
                delay: payload?.delay,
                timerId: payload?.timerId,
                transitionMessage: payload?.transitionMessage || {
                    type: payload?.type || 'TIMER_ENDED',
                    newState: payload?.newState,
                    oldState: payload?.oldState,
                    title: payload?.title,
                    options: payload?.options
                }
            });
            break;
        case 'CANCEL_ALARM':
            cancelAlarm(payload?.timerId);
            break;
    }
});

// --- Notification Scheduling ---
function scheduleNotification(payload = {}) {
    const delay = typeof payload.delay === 'number' ? payload.delay : 0;
    const timerId = payload.timerId || 'pomodoro-transition';
    const transitionMessage = payload.transitionMessage || {
        type: payload.type || 'TIMER_ENDED',
        newState: payload.newState,
        oldState: payload.oldState,
        title: payload.title,
        options: payload.options
    };

    if (!transitionMessage || !transitionMessage.title) {
        console.warn('[Service Worker] Missing notification title, skipping schedule.');
        return;
    }

    const { title, options = {} } = transitionMessage;
    const notificationOptions = { ...options };

    notificationOptions.tag = notificationOptions.tag || notificationTag;
    notificationOptions.renotify = notificationOptions.renotify ?? true;

    if (!notificationOptions.actions || notificationOptions.actions.length === 0) {
        notificationOptions.actions = [
            { action: 'pause', title: 'Pause', icon: './favicon.ico' },
            { action: 'resume', title: 'Resume', icon: './favicon.ico' },
            { action: 'stop', title: 'Stop', icon: './favicon.ico' }
        ];
    }

    self.registration.getNotifications({ tag: notificationOptions.tag }).then(notifications => {
        notifications.forEach(notification => notification.close());
    });

    setTimeout(() => {
        self.registration.showNotification(title, notificationOptions)
            .then(() => {
                console.log(`[Service Worker]: Notification "${title}" shown for timerId ${timerId}.`);
                self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
                    const visibleClients = clients.filter(client => client.visibilityState === 'visible');
                    if (visibleClients.length > 0) {
                        visibleClients.forEach(client => client.postMessage(transitionMessage));
                    } else if (clients.length > 0) {
                        clients[0].focus().then(client => client.postMessage(transitionMessage));
                    } else {
                        console.log('[Service Worker] No clients to send TIMER_ENDED message to.');
                    }
                });
            })
            .catch(error => {
                console.error('[Service Worker] Error showing notification:', error);
            });

    }, delay);
}

function cancelAlarm(timerId) {
    if (timerId === 'pomodoro-transition') {
        self.registration.getNotifications({ tag: notificationTag }).then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    }
    // Add logic for other timerIds if needed in the future
}

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification after click

    const action = event.action; // Get the action clicked (e.g., 'pause', 'resume', 'stop')

    // Find all window clients (tabs/windows) that this Service Worker controls
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        let clientToFocus = clients.find(client => client.visibilityState === 'visible') || clients[0];

        if (clientToFocus) {
            clientToFocus.focus().then(() => {
                clientToFocus.postMessage({ type: 'notification_action', action: action });
            });
        } else {
            console.warn('[Service Worker] No client found to handle notification action.');
        }
    });
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
    const options = payload.options ? { ...payload.options } : {};
    if (payload.body && !options.body) {
        options.body = payload.body;
    }

    options.tag = options.tag || notificationTag;
    options.renotify = options.renotify ?? true;

    if (!options.actions || options.actions.length === 0) {
        options.actions = [
            { action: 'pause', title: 'Pause', icon: './favicon.ico' },
            { action: 'resume', title: 'Resume', icon: './favicon.ico' },
            { action: 'stop', title: 'Stop', icon: './favicon.ico' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

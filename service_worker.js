// HYBRID Service Worker for FocusFlow
// Version 1.0.2 (updated for timer reliability and notification options fix)

const CACHE_NAME = 'focusflow-cache-v2'; // Increment cache version for updates
const OFFLINE_URL = './offline.html'; // Path to your dedicated offline page

// IMPORTANT: These paths should be relative to the root of the Service Worker's scope.
// If your service-worker.js is at /Focus-Clock/service-worker.js, then './' refers to /Focus-Clock/
const urlsToCache = [
    './', // Represents /Focus-Clock/
    './index.html',
    './fina.html',
    './manifest.json',
    './pomodoro-worker.js', // This worker is for the main app, not the SW
    './icons/pause.png', // Ensure these paths are correct
    './icons/play.png',
    './icons/stop.png',
    OFFLINE_URL, // Add the offline page to cache
    'https://placehold.co/192x192/0a0a0a/e0e0e0?text=Flow+192',
    'https://placehold.co/512x512/0a0a0a/e0e0e0?text=Flow+512',
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

    let taskPromise = null;

    switch (type) {
        case 'SCHEDULE_ALARM':
            taskPromise = scheduleNotification(payload);
            break;
        case 'SCHEDULE_NOTIFICATION':
            taskPromise = scheduleNotification({
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

    if (taskPromise && typeof event.waitUntil === 'function') {
        event.waitUntil(taskPromise);
    }
});

// --- Notification Scheduling ---
const scheduledTimers = new Map();

function scheduleNotification(payload = {}) {
    const delay = typeof payload.delay === 'number' ? payload.delay : 0;
    const timerId = payload?.timerId || 'pomodoro-transition';
    const transitionMessage = payload.transitionMessage || {
        type: payload.type || 'TIMER_ENDED',
        newState: payload.newState,
        oldState: payload.oldState,
        title: payload.title,
        options: payload.options
    };

    if (!transitionMessage || !transitionMessage.title) {
        console.warn('[Service Worker] Missing notification title, skipping schedule.');
        return Promise.resolve();
    }

    const { title, options = {} } = transitionMessage;
    const notificationOptions = { ...options };

    notificationOptions.tag = notificationOptions.tag || notificationTag;
    notificationOptions.renotify = notificationOptions.renotify ?? true;

    if (!notificationOptions.actions || notificationOptions.actions.length === 0) {
        notificationOptions.actions = [
            { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
            { action: 'resume', title: 'Resume', icon: './icons/play.png' },
            { action: 'stop', title: 'Stop', icon: './icons/stop.png' }
        ];
    }

    // Clear any existing timer with the same ID before scheduling a new one
    const existingTimer = scheduledTimers.get(timerId);
    if (existingTimer) {
        clearTimeout(existingTimer.timeoutId);
        scheduledTimers.delete(timerId);
    }

    const promise = (async () => {
        const notificationList = await self.registration.getNotifications({ tag: notificationOptions.tag });
        notificationList.forEach(notification => notification.close());

        await new Promise((resolve, reject) => {
            const timeoutId = setTimeout(async () => {
                try {
                    await self.registration.showNotification(title, notificationOptions);
                    console.log(`[Service Worker]: Notification "${title}" shown for timerId ${timerId}.`);

                    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
                    const visibleClients = clients.filter(client => client.visibilityState === 'visible');

                    if (visibleClients.length > 0) {
                        visibleClients.forEach(client => client.postMessage(transitionMessage));
                    } else if (clients.length > 0) {
                        const [client] = clients;
                        try {
                            await client.focus();
                            client.postMessage(transitionMessage);
                        } catch (focusError) {
                            console.warn('[Service Worker] Could not focus client:', focusError);
                            client.postMessage(transitionMessage);
                        }
                    } else {
                        console.log('[Service Worker] No clients to send TIMER_ENDED message to.');
                    }

                    resolve();
                } catch (error) {
                    console.error('[Service Worker] Error showing notification:', error);
                    reject(error);
                } finally {
                    scheduledTimers.delete(timerId);
                }
            }, Math.max(0, delay));

            scheduledTimers.set(timerId, { timeoutId, transitionMessage });
        });
    })();

    return promise;
}

function cancelAlarm(timerId) {
    if (timerId === 'pomodoro-transition') {
        self.registration.getNotifications({ tag: notificationTag }).then(notifications => {
            notifications.forEach(notification => notification.close());
        });
    }
    const scheduled = scheduledTimers.get(timerId);
    if (scheduled) {
        clearTimeout(scheduled.timeoutId);
        scheduledTimers.delete(timerId);
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
            { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
            { action: 'resume', title: 'Resume', icon: './icons/play.png' },
            { action: 'stop', title: 'Stop', icon: './icons/stop.png' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

// HYBRID Service Worker for FocusFlow
// Version 1.1.0 (adds push notification support and subscription recovery)

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

    switch (type) {
        case 'SCHEDULE_ALARM':
            scheduleNotification(payload);
            break;
        case 'SCHEDULE_NOTIFICATION':
            scheduleNotification(payload);
            break;
        case 'CANCEL_ALARM':
            cancelAlarm(payload.timerId);
            break;
        case 'CANCEL_NOTIFICATION':
            cancelAlarm(payload?.timerId);
            break;
    }
});

// --- Notification Scheduling ---
function scheduleNotification(payload) {
    // payload here is { delay: ..., timerId: ..., transitionMessage: { type, newState, oldState, title, options } }

    const { delay, transitionMessage } = payload; // Extract delay and the transitionMessage object
    const { title, options } = transitionMessage; // Now extract title and options from transitionMessage

    // Ensure options is an object, even if empty, before trying to set properties
    const notificationOptions = options || {};

    notificationOptions.tag = notificationTag; // This should now work
    notificationOptions.renotify = true; // Ensures new notification if one with same tag exists

    // Actions for notification buttons - ensure icons are accessible
    // These paths are relative to the Service Worker's scope
    notificationOptions.actions = notificationOptions.actions || [
        { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
        { action: 'resume', title: 'Resume', icon: './icons/play.png' },
        { action: 'stop', title: 'Stop', icon: './icons/stop.png' }
    ];

    // Clear any existing notifications with the same tag before scheduling a new one
    self.registration.getNotifications({ tag: notificationTag }).then(notifications => {
        notifications.forEach(notification => notification.close());
    });

    // Schedule the notification to appear after 'delay' milliseconds
    // Note: setTimeout in Service Workers is not fully reliable for long background periods.
    // However, it is the intended mechanism in your current design for local alarms.
    setTimeout(() => {
        self.registration.showNotification(title, notificationOptions) // Use notificationOptions here
            .then(() => {
                console.log(`[Service Worker]: Notification "${title}" shown.`);
                // Send message to all visible clients, or attempt to focus if none are visible
                broadcastMessageToClients(transitionMessage, true);
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
    broadcastMessageToClients({ type: 'notification_action', action }, true, true);
});

// Listen for push notifications from the server (Supabase Edge Functions)
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push event received.');

    const dataText = event.data ? event.data.text() : null;
    let payload = {};

    if (dataText) {
        try {
            payload = JSON.parse(dataText);
        } catch (error) {
            console.warn('[Service Worker] Failed to parse push payload as JSON, using text body.', error);
            payload = { body: dataText };
        }
    }

    const title = payload.title || 'FocusFlow';
    const options = Object.assign({}, payload.options || {});
    options.body = options.body || payload.body || '';
    options.tag = options.tag || notificationTag;
    options.renotify = options.renotify ?? true;
    options.icon = options.icon || './favicon.ico';
    options.badge = options.badge || './favicon.ico';
    options.actions = options.actions || [
        { action: 'pause', title: 'Pause', icon: './icons/pause.png' },
        { action: 'resume', title: 'Resume', icon: './icons/play.png' },
        { action: 'stop', title: 'Stop', icon: './icons/stop.png' }
    ];

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => {
                broadcastMessageToClients({ type: 'SERVER_PUSH_NOTIFICATION', payload });
            })
            .catch(error => {
                console.error('[Service Worker] Error showing push notification:', error);
            })
    );
});

// Notify clients if the push subscription changes so the app can resubscribe
self.addEventListener('pushsubscriptionchange', (event) => {
    console.log('[Service Worker] pushsubscriptionchange detected.');
    event.waitUntil(broadcastMessageToClients({ type: 'PUSH_SUBSCRIPTION_EXPIRED' }));
});

function broadcastMessageToClients(message, focusClient = false, notifyIfNoClients = false) {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        if (clients.length === 0) {
            if (notifyIfNoClients) {
                console.warn('[Service Worker] No clients available to receive message:', message);
            }
            return;
        }

        let target = clients.find(client => client.visibilityState === 'visible') || clients[0];

        if (focusClient && target && 'focus' in target) {
            return target.focus().then(() => {
                target.postMessage(message);
            });
        }

        clients.forEach(client => client.postMessage(message));
    }).catch(error => {
        console.error('[Service Worker] Failed to broadcast message to clients:', error);
    });
}

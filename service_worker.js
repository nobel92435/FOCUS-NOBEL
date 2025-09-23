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
const CLIENT_MESSAGE_TYPES = Object.freeze({
    POMODORO_PUSH: 'POMODORO_PUSH'
});

async function broadcastClientMessage(message) {
    try {
        const clients = await self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        });
        for (const client of clients) {
            client.postMessage(message);
        }
    } catch (error) {
        console.error('[Service Worker] Failed to broadcast message to clients:', error);
    }
}

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
    const action = event.action;
    const transitionMessage = event.notification?.data?.transitionMessage;

    if (action === 'snooze-5m') {
        event.waitUntil(handleSnoozeAction(event.notification));
        return;
    }

    event.waitUntil(focusClientWindow(transitionMessage));
});

function focusClientWindow(transitionMessage) {
    return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
        const client = clients.find(c => c.visibilityState === 'visible') || clients[0];
        if (client) {
            if (transitionMessage) {
                client.postMessage(transitionMessage);
            }
            return client.focus();
        }
    });
}

function cloneNotificationOptions(source = {}) {
    const cloned = { ...source };
    if (source.data && typeof source.data === 'object') {
        cloned.data = { ...source.data };
    }
    if (Array.isArray(source.actions)) {
        cloned.actions = source.actions.map(action => ({ ...action }));
    }
    return cloned;
}

function ensureDefaultActions(options) {
    if (!Array.isArray(options.actions) || options.actions.length === 0) {
        options.actions = [
            { action: 'open', title: 'Open' },
            { action: 'snooze-5m', title: 'Snooze 5m' }
        ];
    }
    return options.actions;
}

function labelForStateName(state) {
    if (typeof state !== 'string') {
        return 'session';
    }
    if (state.includes('long')) {
        return 'long break';
    }
    if (state.includes('short')) {
        return 'short break';
    }
    if (state.includes('break')) {
        return 'break';
    }
    return 'focus';
}

function determineTransitionDirection(transition = {}) {
    const newState = transition.newState || transition.new_state;
    if (typeof newState === 'string' && newState.includes('break')) {
        return 'toBreak';
    }
    return 'toFocus';
}

function formatSecondsShort(value) {
    const seconds = Math.abs(Number(value) || 0);
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remaining = seconds % 60;
        if (remaining === 0) {
            return `${minutes}m`;
        }
        return `${minutes}m ${remaining}s`;
    }
    return `${seconds}s`;
}

function buildTimingAwareCopy({
    originalTitle,
    originalBody,
    diffSeconds,
    direction,
    label,
    type
}) {
    let title = originalTitle;
    let body = originalBody;
    const secondsLabel = formatSecondsShort(diffSeconds);
    const suffix = diffSeconds < 0
        ? `${formatSecondsShort(diffSeconds)} ago`
        : `in ${secondsLabel}`;

    if (type === 'HEADS_UP') {
        if (diffSeconds > 1) {
            title = `${direction === 'toFocus' ? 'Focus' : 'Break'} starts in ${secondsLabel}`;
            body = `Your ${label} ${direction === 'toFocus' ? 'ends' : 'begins'} in ${secondsLabel}.`;
        } else if (diffSeconds >= -1) {
            title = `${direction === 'toFocus' ? 'Focus' : 'Break'} starting now`;
            body = `Your ${label} ${direction === 'toFocus' ? 'is ending now.' : 'is starting now.'}`;
        } else {
            title = `${direction === 'toFocus' ? 'Focus' : 'Break'} started`;
            body = `Your ${label} ${direction === 'toFocus' ? 'ended' : 'began'} ${suffix}.`;
        }
    } else if (type === 'FINAL') {
        if (diffSeconds > 1) {
            title = originalTitle || `${direction === 'toFocus' ? 'Focus' : 'Break'} time`;
            body = originalBody || `Your ${label} starts in ${secondsLabel}.`;
        } else if (diffSeconds >= -1) {
            title = originalTitle || `${direction === 'toFocus' ? 'Focus' : 'Break'} time`;
            body = originalBody || `Your ${label} is starting now.`;
        } else {
            title = originalTitle || `${direction === 'toFocus' ? 'Focus' : 'Break'} time`;
            body = originalBody || `Your ${label} ${direction === 'toFocus' ? 'started' : 'began'} ${suffix}.`;
        }
    }

    return { title, body };
}

function resolveSessionEndTimestamp(session = {}) {
    if (typeof session.endTimestamp === 'number') {
        return session.endTimestamp;
    }
    if (typeof session.endAt === 'string') {
        const parsed = Date.parse(session.endAt);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
}

function normalizePushType(value) {
    if (typeof value !== 'string') {
        return '';
    }
    const normalized = value.trim().toUpperCase();
    if (normalized.includes('HEADS')) {
        return 'HEADS_UP';
    }
    if (normalized.includes('TIMER_ENDED') || normalized.includes('FINAL')) {
        return 'FINAL';
    }
    return normalized;
}

function applyTimingToNotification(payload, options) {
    const baseTitle = payload.title || 'FocusFlow';
    const baseBody = options.body || payload.body || '';
    const data = options.data || {};
    const session = payload.session || data.session || {};
    const transition = data.transition || payload.transition || {};
    const type = normalizePushType(payload.type || data.type);
    const endTimestamp = resolveSessionEndTimestamp(session);

    if (!endTimestamp) {
        if (!options.body && payload.body) {
            options.body = payload.body;
        }
        return { title: baseTitle, body: options.body || baseBody };
    }

    const diffSeconds = Math.round((endTimestamp - Date.now()) / 1000);
    const direction = determineTransitionDirection(transition);
    const label = labelForStateName(direction === 'toBreak' ? transition.newState : transition.oldState);
    const { title, body } = buildTimingAwareCopy({
        originalTitle: baseTitle,
        originalBody: baseBody,
        diffSeconds,
        direction,
        label,
        type
    });

    options.body = body;
    options.data = {
        ...data,
        session: {
            ...session,
            computedDiffSeconds: diffSeconds,
            computedAt: Date.now()
        }
    };

    return { title, body };
}

function handleSnoozeAction(notification) {
    const snoozeMs = 5 * 60 * 1000;
    const payload = notification.data?.payload || {};
    const baseOptions = payload.options || {};
    const clonedOptions = cloneNotificationOptions(baseOptions);
    clonedOptions.tag = clonedOptions.tag || notification.tag || notificationTag;
    clonedOptions.renotify = true;
    clonedOptions.requireInteraction = clonedOptions.requireInteraction ?? true;
    clonedOptions.body = clonedOptions.body || payload.body || notification.body;
    clonedOptions.data = {
        ...(clonedOptions.data || {}),
        snoozed: true,
        snoozedAt: Date.now(),
        originalPayload: payload
    };
    ensureDefaultActions(clonedOptions);

    const title = payload.title || notification.title || 'FocusFlow';

    return new Promise((resolve) => {
        setTimeout(() => {
            self.registration.showNotification(title, clonedOptions).finally(resolve);
        }, snoozeMs);
    }).then(() => focusClientWindow(notification.data?.transitionMessage));
}

async function handleIncomingPush(payload) {
    const options = { ...(payload.options || {}) };
    const fallbackBody = typeof payload.body === 'string' ? payload.body : undefined;
    if (fallbackBody && !options.body) {
        options.body = fallbackBody;
    }

    options.icon = options.icon || payload.icon || DEFAULT_NOTIFICATION_ICON;
    options.badge = options.badge || payload.badge || DEFAULT_NOTIFICATION_BADGE;
    options.vibrate = options.vibrate || payload.vibrate || DEFAULT_NOTIFICATION_VIBRATE;
    options.requireInteraction = options.requireInteraction ?? true;
    options.renotify = options.renotify ?? true;
    options.timestamp = options.timestamp || Date.now();
    options.tag = options.tag || notificationTag;
    options.data = {
        ...(options.data || {}),
        dateOfArrival: Date.now(),
        primaryKey: 1,
        payload
    };

    ensureDefaultActions(options);

    const { title } = applyTimingToNotification(payload, options);

    await self.registration.showNotification(title, options);
    await broadcastClientMessage({
        type: CLIENT_MESSAGE_TYPES.POMODORO_PUSH,
        payload,
        options,
        title
    });
}

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

    event.waitUntil(handleIncomingPush(payload));
});

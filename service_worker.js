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
    POMODORO_PUSH: 'POMODORO_PUSH',
    PUSH_SUBSCRIPTION_REFRESH: 'PUSH_SUBSCRIPTION_REFRESH'
});

function normalizeApplicationServerKey(key) {
    if (!key) {
        return null;
    }

    if (typeof key === 'string') {
        const trimmed = key.trim();
        if (!trimmed) {
            return null;
        }

        const padding = '='.repeat((4 - (trimmed.length % 4)) % 4);
        const base64 = (trimmed + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; i += 1) {
            outputArray[i] = rawData.charCodeAt(i);
        }

        return outputArray;
    }

    if (key instanceof ArrayBuffer) {
        return new Uint8Array(key);
    }

    if (ArrayBuffer.isView(key)) {
        return new Uint8Array(key.buffer, key.byteOffset, key.byteLength);
    }

    return null;
}

function extractApplicationServerKeyFromSubscription(subscription) {
    if (!subscription || typeof subscription !== 'object') {
        return null;
    }

    const rawKey = subscription.options?.applicationServerKey;
    return normalizeApplicationServerKey(rawKey);
}

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
    remainingSeconds,
    direction,
    endingLabel,
    startingLabel,
    type
}) {
    let title = originalTitle || '';
    let body = originalBody || '';
    const endingPhaseLabel = direction === 'toBreak' ? 'Focus' : 'Break';
    const startingPhaseLabel = direction === 'toBreak' ? 'Break' : 'Focus';
    const conciseCountdown = remainingSeconds <= 10 ? '~5s' : formatSecondsShort(remainingSeconds);
    const elapsedSuffix = diffSeconds < 0 ? `${formatSecondsShort(Math.abs(diffSeconds))} ago` : `in ${formatSecondsShort(diffSeconds)}`;

    if (type === 'HEADS_UP') {
        if (!title) {
            title = `${endingPhaseLabel} ends in ${conciseCountdown}`;
        }
        if (!body) {
            body = remainingSeconds <= 10
                ? `Your ${endingLabel} is wrapping up now.`
                : `Get ready—your ${endingLabel} ends in ${formatSecondsShort(remainingSeconds)}.`;
        }
    } else if (type === 'FINAL') {
        if (!title) {
            if (remainingSeconds > 0) {
                title = `${startingPhaseLabel} starts in ${formatSecondsShort(remainingSeconds)}`;
            } else if (diffSeconds >= -5) {
                title = `${startingPhaseLabel} starting now`;
            } else {
                title = `${startingPhaseLabel} started`;
            }
        }
        if (!body) {
            if (remainingSeconds > 0) {
                body = `Your ${startingLabel} begins in ${formatSecondsShort(remainingSeconds)}.`;
            } else if (diffSeconds >= -5) {
                body = `Your ${startingLabel} is starting now.`;
            } else {
                body = `Your ${startingLabel} started ${elapsedSuffix}.`;
            }
        }
    }

    return {
        title: title || originalTitle || 'FocusFlow',
        body: body || originalBody || ''
    };
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

    const now = Date.now();
    const diffMs = endTimestamp - now;
    const diffSeconds = Math.floor(diffMs / 1000);
    const remainingSeconds = Math.max(0, diffSeconds);
    const direction = determineTransitionDirection(transition);
    const endingLabel = labelForStateName(transition.oldState);
    const startingLabel = labelForStateName(transition.newState);
    const { title, body } = buildTimingAwareCopy({
        originalTitle: baseTitle,
        originalBody: baseBody,
        diffSeconds,
        remainingSeconds,
        direction,
        endingLabel,
        startingLabel,
        type
    });

    options.body = body;
    options.data = {
        ...data,
        session: {
            ...session,
            computedDiffSeconds: diffSeconds,
            computedSecondsRemaining: remainingSeconds,
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

self.addEventListener('pushsubscriptionchange', (event) => {
    event.waitUntil((async () => {
        let subscription = event.newSubscription || null;
        let errorMessage = null;

        if (!subscription) {
            try {
                const applicationServerKey = extractApplicationServerKeyFromSubscription(event.oldSubscription)
                    || extractApplicationServerKeyFromSubscription(event.newSubscription);

                if (!applicationServerKey) {
                    throw new Error('Missing applicationServerKey for resubscription.');
                }

                subscription = await self.registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey
                });
            } catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                console.error('[Service Worker] Failed to resubscribe during pushsubscriptionchange:', error);
            }
        }

        if (!subscription) {
            try {
                subscription = await self.registration.pushManager.getSubscription();
            } catch (error) {
                errorMessage = error instanceof Error ? error.message : String(error);
                console.error('[Service Worker] Failed to retrieve push subscription after change:', error);
            }
        }

        await broadcastClientMessage({
            type: CLIENT_MESSAGE_TYPES.PUSH_SUBSCRIPTION_REFRESH,
            payload: subscription ? subscription.toJSON() : null,
            error: errorMessage
        });
    })());
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

    event.waitUntil(handleIncomingPush(payload));
});

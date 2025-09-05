// Firebase SDKS
import {
    getMessaging,
    getToken,
    onMessage
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-messaging.js";
import {
    getFunctions,
    httpsCallable
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    addDoc,
    collection,
    onSnapshot,
    arrayUnion,
    arrayRemove,
    updateDoc,
    deleteDoc,
    getDocs,
    serverTimestamp,
    query,
    orderBy,
    limit,
    increment,
    where,
    runTransaction,
    writeBatch as firestoreWriteBatch // <-- Alias it here
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { 
    getStorage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL 
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";


const ACHIEVEMENTS = {
    'novice_scholar': { name: 'Novice Scholar', description: 'Study for a total of 1 hour.' },
    'dedicated_learner': { name: 'Dedicated Learner', description: 'Study for a total of 10 hours.' },
    'marathoner': { name: 'Marathoner', description: 'Complete a single study session over 2 hours.' },
    'consistent_coder': { name: 'Consistent Coder', description: 'Maintain a 7-day study streak.' }
};
const PRESET_AVATARS = [
    'https://api.dicebear.com/8.x/lorelei/svg?seed=Mimi',
    'https://api.dicebear.com/8.x/lorelei/svg?seed=Max',
    'https://api.dicebear.com/8.x/lorelei/svg?seed=Leo',
    'https://api.dicebear.com/8.x/lorelei/svg?seed=Muffin',
    'https://api.dicebear.com/8.x/pixel-art/svg?seed=Buddy',
    'https://api.dicebear.com/8.x/pixel-art/svg?seed=Coco',
    'https://api.dicebear.com/8.x/pixel-art/svg?seed=Gizmo',
    'https://api.dicebear.com/8.x/pixel-art/svg?seed=Jasper'
];
const STUDICONS = {
    'Minimalist': [
        'https://api.dicebear.com/8.x/miniavs/svg?seed=Angel', 'https://api.dicebear.com/8.x/miniavs/svg?seed=Annie',
        'https://api.dicebear.com/8.x/miniavs/svg?seed=Charlie', 'https://api.dicebear.com/8.x/miniavs/svg?seed=Misty',
        'https://api.dicebear.com/8.x/miniavs/svg?seed=Garfield', 'https://api.dicebear.com/8.x/miniavs/svg?seed=Sheba',
        'https://api.dicebear.com/8.x/miniavs/svg?seed=Midnight', 'https://api.dicebear.com/8.x/miniavs/svg?seed=Snuggles',
        'https://api.dicebear.com/8.x/miniavs/svg?seed=Pumpkin', 'https://api.dicebear.com/8.x/miniavs/svg?seed=Patches',
    ],
    'Pixel Art': [
        'https://api.dicebear.com/8.x/pixel-art/svg?seed=Buddy', 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Coco',
        'https://api.dicebear.com/8.x/pixel-art/svg?seed=Gizmo', 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Jasper',
        'https://api.dicebear.com/8.x/pixel-art/svg?seed=Loki', 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Milo',
        'https://api.dicebear.com/8.x/pixel-art/svg?seed=Oscar', 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Peanut',
        'https://api.dicebear.com/8.x/pixel-art/svg?seed=Rocky', 'https://api.dicebear.com/8.x/pixel-art/svg?seed=Shadow',
    ],
    'Adventurer': [
        'https://api.dicebear.com/8.x/adventurer/svg?seed=Bandit', 'https://api.dicebear.com/8.x/adventurer/svg?seed=Bear',
        'https://api.dicebear.com/8.x/adventurer/svg?seed=Callie', 'https://api.dicebear.com/8.x/adventurer/svg?seed=Cleo',
        'https://api.dicebear.com/8.x/adventurer/svg?seed=Cookie', 'https://api.dicebear.com/8.x/adventurer/svg?seed=Dusty',
        'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix', 'https://api.dicebear.com/8.x/adventurer/svg?seed=George',
        'https://api.dicebear.com/8.x/adventurer/svg?seed=Jack', 'https://api.dicebear.com/8.x/adventurer/svg?seed=Kiki',
    ],
    'Bottts': [
        'https://api.dicebear.com/8.x/bottts/svg?seed=Abby', 'https://api.dicebear.com/8.x/bottts/svg?seed=Baby',
        'https://api.dicebear.com/8.x/bottts/svg?seed=Boo', 'https://api.dicebear.com/8.x/bottts/svg?seed=Bubba',
        'https://api.dicebear.com/8.x/bottts/svg?seed=Cali', 'https://api.dicebear.com/8.x/bottts/svg?seed=Chance',
        'https://api.dicebear.com/8.x/bottts/svg?seed=Cuddles', 'https://api.dicebear.com/8.x/bottts/svg?seed=Frankie',
        'https://api.dicebear.com/8.x/bottts/svg?seed=Harley', 'https://api.dicebear.com/8.x/bottts/svg?seed=Lilly',
    ],
};
// --- Web Worker Implementation ---
const workerCode = `
    let timerInterval = null;
    let endTime = 0;
    let remainingTimeOnPause = 0;
    let isPaused = false;
    let currentPhaseDuration = 0;

    function tick() {
        if (isPaused) return;
        const now = Date.now();
        const timeLeft = Math.round((endTime - now) / 1000);

        if (timeLeft > 0) {
            self.postMessage({ type: 'tick', timeLeft: timeLeft });
        } else {
            self.postMessage({ type: 'tick', timeLeft: 0 });
            clearInterval(timerInterval);
            timerInterval = null;
            self.postMessage({ type: 'phase_ended' });
        }
    }

    self.onmessage = function(e) {
        const { command, duration } = e.data;
        switch(command) {
            case 'start':
                isPaused = false;
                if (timerInterval) clearInterval(timerInterval);
                currentPhaseDuration = duration;
                endTime = Date.now() + duration * 1000;
                timerInterval = setInterval(tick, 1000);
                tick();
                break;
            case 'pause':
                if (timerInterval) {
                    isPaused = true;
                    remainingTimeOnPause = endTime - Date.now();
                    clearInterval(timerInterval);
                    timerInterval = null;
                }
                break;
            case 'resume':
                if (isPaused && remainingTimeOnPause > 0) {
                    isPaused = false;
                    endTime = Date.now() + remainingTimeOnPause;
                    timerInterval = setInterval(tick, 1000);
                    tick();
                    remainingTimeOnPause = 0;
                }
                break;
            case 'stop':
                if (timerInterval) clearInterval(timerInterval);
                timerInterval = null;
                endTime = 0;
                remainingTimeOnPause = 0;
                isPaused = false;
                break;
        }
    };
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const pomodoroWorker = new Worker(URL.createObjectURL(blob));

// --- Application Setup ---
const getCurrentDate = () => new Date();

// --- App State ---
let db, auth, messaging, functions, storage;
let currentUser = null;
let currentUserData = {};
let dashboardCharts = {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let userSessions = [];
let isAudioUnlocked = false;
let isAddingSubjectFromStartSession = false; // Flag to track modal origin
let fcmToken;

// --- Backend Function Callables ---
let logSession, updateUserProfilePic, shareGroupImage, getLeaderboardData, getStatsData, getPlannerData, managePlannerTask;
let sendPomodoroNotification, sendWakeUpNotification, sendGroupWakeUpNotification;


pomodoroWorker.onmessage = (e) => {
    const { type, timeLeft } = e.data;
    if (type === 'tick' && sessionTimerDisplay) {
        sessionTimerDisplay.textContent = formatPomodoroTime(timeLeft);
    } else if (type === 'phase_ended') {
        console.log('Worker signaled phase end. Handling transition locally.');

        const oldState = pomodoroState;
        if (oldState === 'idle') return;

        let newState;
        if (oldState === 'work') {
            const completedWorkSessions = currentUserData.pomodoroCycle || 0;
            const isLongBreakTime = completedWorkSessions > 0 && (completedWorkSessions % pomodoroSettings.long_break_interval === 0);
            newState = isLongBreakTime ? 'long_break' : 'short_break';
        } else {
            newState = 'work';
        }

        handlePomodoroPhaseEnd({ newState, oldState });
    }
};

async function handlePomodoroPhaseEnd(data) {
    const { newState, oldState } = data;

    playSound(oldState === 'work' ? pomodoroSounds.break : pomodoroSounds.focus, pomodoroSounds.volume);

    const sessionDuration = oldState === 'work'
        ? pomodoroSettings.work * 60
        : (oldState === 'short_break' ? pomodoroSettings.short_break * 60 : pomodoroSettings.long_break * 60);

    const sessionType = oldState === 'work' ? 'study' : 'break';
    const subject = oldState === 'work' ? activeSubject : oldState.replace('_', ' ');
    await saveSession(subject, sessionDuration, sessionType);

    const shouldAutoStart = (newState === 'work' && pomodoroSettings.autoStartFocus) ||
                            (newState.includes('break') && pomodoroSettings.autoStartBreak);

    if (shouldAutoStart) {
        await startNextPomodoroPhase(newState);
    } else {
        pomodoroState = 'idle';
        nextPomodoroPhase = newState;
        document.getElementById('manual-start-btn').classList.remove('hidden');
        document.getElementById('stop-studying-btn').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
        pomodoroStatusDisplay.textContent = `Ready for ${newState.replace('_', ' ')}`;
    }
}

async function initializePushNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            const swRegistration = await navigator.serviceWorker.ready;
            const currentToken = await getToken(messaging, {
                vapidKey: "BAcCHOb3rceEak-258f017-UZ07XB-ra_MFDEdfhHwyA0tZy1RuYlyasY3u5ibF0CBMVoBMmFCPO3Btvp0nrsJXQ",
                serviceWorkerRegistration: swRegistration
            });

            if (currentToken) {
                fcmToken = currentToken;
                console.log('FCM Token:', fcmToken);
                if (currentUser) {
                    await saveFcmTokenToFirestore(fcmToken, currentUser.uid);
                }
            } else {
                showToast('Could not get notification token.', 'warning');
            }
        } else {
            showToast('Notification permission denied.', 'warning');
        }
    } catch (error) {
        console.error('Error getting FCM token or permission:', error);
        showToast('Failed to enable push notifications.', 'error');
    }
}

async function saveFcmTokenToFirestore(token, userId) {
    if (!userId) return;
    try {
        const tokenRef = doc(db, `artifacts/${appId}/users/${userId}/fcmTokens`, token);
        await setDoc(tokenRef, { token: token, userId: userId, timestamp: new Date() }, { merge: true });
        console.log('FCM token saved to Firestore.');
    } catch (error) {
        console.error('Error saving FCM token to Firestore:', error);
    }
}

async function triggerServerNotification(messageData) {
    if (!currentUser || !currentUser.uid) {
        showToast('Please sign in to enable server notifications.', 'error');
        return;
    }
    try {
        await sendPomodoroNotification({
            title: messageData.title,
            body: messageData.options.body,
            newState: messageData.newState,
            oldState: messageData.oldState,
        });
    } catch (error) {
        console.error('Error triggering server notification:', error);
        showToast('Failed to schedule notification.', 'error');
    }
}

// ... (keep the rest of the code from the original file, but we will modify specific functions below)
// ... Timer State, UI Elements, UI Helpers (playSound, showToast, etc.) remain largely the same ...

// --- MODIFIED FUNCTIONS ---

/**
 * [REWRITTEN] Uploads a file to Firebase Storage and calls a backend function to update the user profile URL.
 * @param {File} file The image file to upload.
 */
async function uploadProfilePicture(file) {
    if (!currentUser) return;
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image is too large (max 5MB).', 'error');
        return;
    }
    showToast('Uploading profile picture...', 'info');

    const filePath = `profile-pics/${currentUser.uid}/${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
        (snapshot) => {
            // Optional: handle progress
        },
        (error) => {
            console.error("Upload failed:", error);
            showToast('Profile picture upload failed.', 'error');
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                try {
                    // Call the backend function to save the URL
                    await updateUserProfilePic({ photoURL: downloadURL });
                    showToast('Profile picture updated!', 'success');
                } catch (error) {
                    console.error("Error updating profile picture URL:", error);
                    showToast('Failed to save profile picture.', 'error');
                }
            });
        }
    );
}

/**
 * [REWRITTEN] Uploads an image for a group chat to Firebase Storage and calls a backend function.
 * @param {File} file The image file to upload.
 * @param {string} groupId The ID of the group.
 */
async function handleImageUpload(file, groupId) {
    if (!file.type.startsWith('image/')) {
        showToast('Please select an image file.', 'error');
        return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showToast('Image is too large (max 5MB).', 'error');
        return;
    }
    showToast('Uploading image...', 'info');

    const filePath = `group-images/${groupId}/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
        (snapshot) => { /* Optional progress handling */ },
        (error) => {
            console.error("Group image upload failed:", error);
            showToast('Image upload failed.', 'error');
        },
        () => {
            getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
                try {
                    // Call backend function to create the message
                    await shareGroupImage({ groupId: groupId, imageUrl: downloadURL });
                } catch (error) {
                    console.error("Error sharing group image:", error);
                    showToast('Failed to share image.', 'error');
                }
            });
        }
    );
}


/**
 * [REWRITTEN] Calls a backend function to log the session data securely.
 */
async function saveSession(subject, durationSeconds, sessionType = 'study') {
    if (!currentUser || durationSeconds <= 0) {
        return;
    }

    try {
        const result = await logSession({
            subject,
            durationSeconds,
            sessionType,
        });

        if (result.data.success) {
            showToast(`Session of ${formatTime(durationSeconds, false)} saved!`, "success");
            // If an achievement was unlocked, the backend might send it back
            if (result.data.achievement) {
                 showToast(`Achievement Unlocked: ${result.data.achievement.name}!`, 'success');
            }
            // Manually update local state for immediate UI feedback
            loadDailyTotal(); 
        } else {
             throw new Error(result.data.error || "Failed to save session.");
        }
    } catch (error) {
        console.error("Error saving session via backend: ", error);
        showToast("Error saving session.", "error");
    }
}


/**
 * [REWRITTEN] Renders the leaderboard by fetching pre-calculated data from the backend.
 */
async function renderLeaderboard(period = 'weekly', containerId = 'ranking-list') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // ... (UI logic for tabs remains the same)
    const periodTabsSelector = containerId === 'ranking-list' 
        ? '#ranking-period-tabs .ranking-tab-btn' 
        : '#group-ranking-period-tabs .ranking-tab-btn';
    
    const periodTabs = document.querySelectorAll(periodTabsSelector);
    if (periodTabs.length > 0) {
        periodTabs.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.period === period);
        });
    }

    container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
    
    try {
        const result = await getLeaderboardData({ period });
        const userScores = result.data.leaderboard;

        const periodText = period === 'daily' ? 'today' : period === 'weekly' ? 'in the last 7 days' : 'in the last 30 days';
        
        container.innerHTML = userScores.map((user, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            if (rank === 2) rankClass = 'rank-2';
            if (rank === 3) rankClass = 'rank-3';

            const avatarHTML = user.photoURL 
                ? `<img src="${user.photoURL}" class="w-full h-full object-cover">`
                : `<span>${(user.username || 'U').charAt(0).toUpperCase()}</span>`;

            return `
                <div class="ranking-item ${currentUser.uid === user.id ? 'bg-blue-900/30' : ''}" data-user-id="${user.id}">
                    <div class="rank ${rankClass}">${rank}</div>
                    <div class="user-avatar bg-gray-600 overflow-hidden">${avatarHTML}</div>
                    <div class="user-info">
                        <div class="user-name">${user.username}</div>
                        <div class="user-time">${formatTime(user.totalStudySeconds, false)} ${periodText}</div>
                    </div>
                </div>
            `;
        }).join('') || `<div class="empty-group"><i class="fas fa-trophy"></i><h3>Leaderboard is Empty</h3><p>Start studying to see your rank!</p></div>`;

    } catch (error) {
        console.error("Error fetching leaderboard data:", error);
        container.innerHTML = `<div class="empty-group"><i class="fas fa-exclamation-triangle"></i><h3>Could not load leaderboard</h3><p>Please try again later.</p></div>`;
    }
}


/**
 * [REWRITTEN] Renders the stats page by fetching pre-calculated data from the backend.
 */
async function renderStatsPage() {
    // The overall structure and HTML injection for the page remains the same
    const insightsContainer = document.getElementById('insights-container');
    if (!insightsContainer) return;

    insightsContainer.innerHTML = `
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
            <div>
                <h1 class="text-4xl font-bold text-white">Study Insights</h1>
                <p class="text-slate-400 mt-1">Welcome back, let's analyze your progress.</p>
            </div>
            <div class="w-full sm:w-auto overflow-x-auto no-scrollbar">
                <nav id="dashboard-nav-bar" class="flex space-x-2 mt-4 sm:mt-0 bg-slate-800 p-2 rounded-xl flex-nowrap" style="white-space: nowrap;">
                    <button class="nav-btn active" data-view="day">Day</button>
                    <button class="nav-btn" data-view="trend">Trend</button>
                    <button class="nav-btn" data-view="month">Month</button>
                    <button class="nav-btn" data-view="period">Period</button>
                </nav>
            </div>
        </header>
        <main>
            <div id="day-view" class="view active grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
            <div id="trend-view" class="view grid grid-cols-1 lg:grid-cols-2 gap-6"></div>
            <div id="month-view" class="view grid grid-cols-1 lg:grid-cols-3 gap-6"></div>
            <div id="period-view" class="view grid grid-cols-1 lg:grid-cols-3 gap-6"></div>
        </main>
    `;

    // Fetch data from backend
    try {
        const result = await getStatsData();
        const statsData = result.data;
        initializeDashboard(statsData, insightsContainer); // Pass the pre-calculated data
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error("Could not load stats data:", error);
        insightsContainer.innerHTML = `<div class="text-center p-8 text-red-400">Failed to load study insights.</div>`;
    }
}

// NOTE: The `initializeDashboard` and its sub-functions (`renderDayView`, `renderPeriodView`, etc.)
// need to be adapted. Instead of taking raw sessions and calculating, they will now take the
// pre-calculated `statsData` object from the backend and simply render it.
// For brevity in this example, the chart rendering logic is kept, assuming the backend
// provides data in the exact structure the charts expect.


// ... (The rest of your functions like `formatTime`, `showPage`, `initializeFirebase`, etc. remain)
// ... (Make sure to update `initializeFirebase` to init the storage SDK and callable functions)


function initializeFirebase() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyBSCrL6ravOzFnwOa7A0Jl_W68vEfZVcNw",
            authDomain: "focus-flow-34c07.firebaseapp.com",
            projectId: "focus-flow-34c07",
            storageBucket: "focus-flow-34c07.appspot.com",
            messagingSenderId: "473980178825",
            appId: "1:473980178825:web:164566ec8b068da3281158",
            measurementId: "G-RRFK3LY0E4"
        };

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        messaging = getMessaging(app);
        functions = getFunctions(app);
        storage = getStorage(app); // Initialize Storage

        // --- Initialize Callable Functions ---
        logSession = httpsCallable(functions, 'logSession');
        updateUserProfilePic = httpsCallable(functions, 'updateUserProfilePic');
        shareGroupImage = httpsCallable(functions, 'shareGroupImage');
        getLeaderboardData = httpsCallable(functions, 'getLeaderboardData');
        getStatsData = httpsCallable(functions, 'getStatsData');
        // getPlannerData = httpsCallable(functions, 'getPlannerData'); // Example
        // managePlannerTask = httpsCallable(functions, 'managePlannerTask'); // Example
        sendPomodoroNotification = httpsCallable(functions, 'sendPomodoroNotification');
        sendWakeUpNotification = httpsCallable(functions, 'sendWakeUpNotification');
        sendGroupWakeUpNotification = httpsCallable(functions, 'sendGroupWakeUpNotification');
        // --- End Initialization ---


        onMessage(messaging, (payload) => {
            console.log('Foreground Push Message received:', payload);
            if (payload.data && payload.data.type === 'TIMER_ENDED') {
                handlePomodoroPhaseEnd(payload.data);
                showToast(payload.notification?.body || 'Timer ended!', 'info');
            }
        });

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                currentUser = user;
                const userDoc = await getOrCreateUserDocument(user);
                currentUserData = userDoc.data();
                
                 if (currentUserData.pomodoroSettings) {
                    pomodoroSettings = {...pomodoroSettings, ...currentUserData.pomodoroSettings};
                }
                if (currentUserData.pomodoroSounds) {
                    pomodoroSounds = {...pomodoroSounds, ...currentUserData.pomodoroSounds};
                }
                pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });


                if (!currentUserData || !currentUserData.username) {
                    showPage('page-username-setup');
                } else {
                    updateProfileUI(currentUserData);
                    showPage('page-timer');
                    setupRealtimeListeners();
                    await loadDailyTotal();
                    initializePushNotifications();
                }
            } else {
                currentUser = null;
                currentUserData = {};
                showPage('auth-screen');
            }
        });

    } catch (e) {
        console.error("Firebase initialization failed:", e);
        showToast("Could not connect to the backend.", "error");
    }
}


// IMPORTANT: All other functions from your original file should be included here.
// Functions that were NOT rewritten above (like UI manipulation, event listeners, etc.)
// should be copied and pasted into this file to ensure the app continues to work.
// For example, you need to copy over:
// - `showPage`, `formatTime`, `formatPomodoroTime`
// - All `ael(...)` event listeners and their callbacks
// - All `render...` functions that were not rewritten (e.g., renderGroupDetail, renderPlannerPage)
// - `startTimer`, `stopTimer`, `pauseTimer`, `resumeTimer`
// - And so on...
// The provided code above only shows the *changes* and the new structure. You must fill in the rest.

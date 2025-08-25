import {
    // Only import necessary functions, not getFirestore itself if db is imported
    doc,
    collection,
    onSnapshot,
    query,
    orderBy,
    getDocs,
    updateDoc,
    serverTimestamp,
    deleteDoc,
    limit,
    increment
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Import Firebase app and services from the new firebase.js file ---
import { app, db, auth } from './firebase.js';

import {
    initializeAuth, setupAuthListeners, handleLogin, handleSignup, handleGoogleSignIn, handleSignOut, handleUsernameSetup
} from './auth.js';
import {
    initUI, showToast, showConfirmationModal, showPage, formatTime, formatPomodoroTime, updateTotalTimeDisplay, updateProfileUI,
    renderJoinedGroups, renderAvailableGroups, renderSubjectSelectionList, renderPlanner, renderGroupDetail,
    setupGroupMemberListeners, renderGroupSubPage, renderGroupMembers, renderGroupLeaderboard, renderLeaderboard, initializeDashboard,
    updateUIUserReferences // New function to update user references in UI module
} from './ui.js';
import {
    ACHIEVEMENTS, availableSounds, playSound, unlockAudio, scheduleSWAlarm, cancelSWAlarm,
    getCurrentDate, saveSession, loadDailyTotal, checkAndAwardAchievements, joinGroup,
    updateSubjectOrderInFirestore, deleteSession, setUtilsGlobals, updatePomodoroSettingsInUtils, updatePomodoroSoundsInUtils, updateDailyTotalsInUtils
} from './utils.js';

// --- Application Setup ---
// Removed firebaseConfig definition as it's now in firebase.js
// Removed initializeApp(firebaseConfig) and getAnalytics(app) as they are now in firebase.js

// --- App State ---
// db and auth are now imported from firebase.js
let currentUser = null;
let currentUserData = {};
let dashboardCharts = {};
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let userSessions = [];
let isAudioUnlocked = false;
let isAddingSubjectFromStartSession = false; // Flag to track modal origin

// Timer State
let isPaused = false;
let pauseStartTime = 0;
let timerInterval = null;
let sessionStartTime = 0;
let totalTimeTodayInSeconds = 0;
let totalBreakTimeTodayInSeconds = 0;
let activeSubject = '';
let groupDetailUnsubscribers = [];
let memberTimerIntervals = [];
let currentGroupId = null;
let groupRealtimeData = {
    members: {},
    sessions: {}
};

// Break Timer State
let breakTimerInterval = null;
let breakStartTime = 0;

// Drag & Drop State
let draggedItem = null;

// Pomodoro State
let timerMode = 'normal'; // 'normal' or 'pomodoro'
let pomodoroState = 'idle'; // 'work', 'short_break', 'long_break', 'idle'
let nextPomodoroPhase = null; // To store the next phase for manual start
let pomodoroSettings = {
    work: 25,
    short_break: 5,
    long_break: 15,
    long_break_interval: 4,
    autoStartBreak: true,
    autoStartFocus: true
};
let pomodoroSounds = {
    start: "tone_simple_beep",
    focus: "tone_chime_chord",
    break: "tone_metal_bell",
    volume: 1.0
};

// Attendance State
let attendanceMonth = getCurrentDate().getMonth();
let attendanceYear = getCurrentDate().getFullYear();
window.attendanceMonth = attendanceMonth;
window.attendanceYear = attendanceYear;

// UI Elements (references populated in window.onload)
let authError, sessionTimerDisplay, totalTimeDisplay, totalBreakTimeDisplay, activeSubjectDisplay, pomodoroStatusDisplay;

async function getOrCreateUserDocument(user) {
    const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
    let userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        const initialData = {
            email: user.email,
            username: user.displayName,
            joinedGroups: [],
            createdAt: serverTimestamp(),
            totalStudySeconds: 0,
            totalBreakSeconds: 0,
            currentStreak: 0,
            lastStudyDay: '',
            unlockedAchievements: [],
            studying: null,
            studyGoalHours: 4,
            pomodoroSettings: {
                work: 25,
                short_break: 5,
                long_break: 15,
                long_break_interval: 4,
                autoStartBreak: true,
                autoStartFocus: true
            },
            pomodoroSounds: {
                start: "tone_simple_beep",
                focus: "tone_chime_chord",
                break: "tone_metal_bell",
                volume: 1.0
            },
            totalTimeToday: {
                date: getCurrentDate().toISOString().split('T')[0],
                seconds: 0
            },
            totalBreakTimeToday: {
                date: getCurrentDate().toISOString().split('T')[0],
                seconds: 0
            }
        };
        await setDoc(userDocRef, initialData);
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
            username: user.displayName,
            email: user.email,
            totalStudySeconds: 0,
            totalBreakSeconds: 0
        });
        userDoc = await getDoc(userDocRef);
    }
    return userDoc;
}

function setupRealtimeListeners() {
    if (!currentUser) return;
    const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
    const usersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    const subjectsCollectionRef = query(collection(userDocRef, 'subjects'), orderBy('order', 'asc'));
    const sessionsCollectionRef = collection(userDocRef, 'sessions');
    const plannerTasksRef = collection(userDocRef, 'plannerTasks');

    onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            currentUserData = data;
            updateCurrentUserAndData(currentUser, currentUserData);

            const todayStr = getCurrentDate().toISOString().split('T')[0];
            if (!data.totalTimeToday || data.totalTimeToday.date !== todayStr || !data.totalBreakTimeToday || data.totalBreakTimeToday.date !== todayStr) {
                loadDailyTotal();
            } else {
                totalTimeTodayInSeconds = data.totalTimeToday.seconds;
                totalBreakTimeTodayInSeconds = data.totalBreakTimeToday.seconds;
                updateTotalTimeDisplay(totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds);
            }

            if (data.pomodoroSettings) {
                pomodoroSettings = { ...pomodoroSettings, ...data.pomodoroSettings };
                updatePomodoroSettingsInUtils(pomodoroSettings);
                pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });
            }
            if (data.pomodoroSounds) {
                pomodoroSounds = { ...pomodoroSounds, ...data.pomodoroSounds };
                updatePomodoroSoundsInUtils(pomodoroSounds);
            }
            updateProfileUI(data);
            renderJoinedGroups();
        }
    });

    onSnapshot(groupsCollectionRef, () => {
        if (document.getElementById('page-my-groups').classList.contains('active') || document.getElementById('page-find-groups').classList.contains('active')) {
            renderAvailableGroups();
            renderJoinedGroups();
        }
    });

    onSnapshot(subjectsCollectionRef, (snapshot) => {
        const subjects = [];
        snapshot.forEach(doc => subjects.push({ id: doc.id, ...doc.data() }));
        renderSubjectSelectionList(subjects);
    });

    onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'users'), () => { // Corrected collection reference
        if (document.getElementById('page-ranking').classList.contains('active')) {
            const activeTab = document.querySelector('#ranking-period-tabs .ranking-tab-btn.active');
            renderLeaderboard(activeTab ? activeTab.dataset.period : 'weekly');
        }
    });

    onSnapshot(query(sessionsCollectionRef, orderBy("endedAt", "desc")), (snapshot) => {
        userSessions = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                endedAt: data.endedAt && typeof data.endedAt.toDate === 'function' ? data.endedAt.toDate() : null,
                type: data.type || 'study'
            };
        });
        if (document.getElementById('page-stats').classList.contains('active')) {
            initializeDashboard(userSessions);
        }
        if (document.getElementById('page-ranking').classList.contains('active')) {
            const activeTab = document.querySelector('#ranking-period-tabs .ranking-tab-btn.active');
            renderLeaderboard(activeTab ? activeTab.dataset.period : 'weekly');
        }
    });

    onSnapshot(query(plannerTasksRef, orderBy("date")), (snapshot) => {
        if (document.getElementById('page-planner').classList.contains('active')) {
            const tasks = [];
            snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
            renderPlanner(tasks);
        }
    });
}

// --- Web Worker Implementation ---
const workerCode = `
    let timerInterval = null;
    let endTime = 0;
    let remainingTimeOnPause = 0;
    let isPaused = false;
    let currentPhaseDuration = 0;
    let workerPomodoroSettings = {
        work: 25, short_break: 5, long_break: 15, long_break_interval: 4,
        autoStartBreak: true, autoStartFocus: true
    }; // Internal settings for the worker

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
        const { command, duration, newSettings } = e.data;
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
            case 'updateSettings': // NEW: Handle settings update for the worker
                workerPomodoroSettings = { ...workerPomodoroSettings, ...newSettings };
                break;
        }
    };
`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
const pomodoroWorker = new Worker(URL.createObjectURL(blob));


// --- Application Logic Functions ---

async function startTimer(subject) {
    if (!subject) {
        showToast("Please select a subject first.", "error");
        return;
    }
    unlockAudio();

    if (timerInterval) clearInterval(timerInterval);

    activeSubject = subject;
    activeSubjectDisplay.textContent = activeSubject;

    if (currentUser) {
        const sessionsRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'sessions');
        const q = query(sessionsRef, orderBy('endedAt', 'desc'), limit(1));
        const lastSessionSnapshot = await getDocs(q);

        if (!lastSessionSnapshot.empty) {
            const lastSessionData = lastSessionSnapshot.docs[0].data();
            const lastSessionEndedAt = lastSessionData.endedAt && typeof lastSessionData.endedAt.toDate === 'function'
                ? lastSessionData.endedAt.toDate()
                : null;
            const now = Date.now();

            if (lastSessionData.type === 'study' && lastSessionEndedAt && lastSessionEndedAt < now) {
                const idleDurationSeconds = Math.floor((now - lastSessionEndedAt) / 1000);
                if (idleDurationSeconds > 0) {
                    await saveSession('Idle Break', idleDurationSeconds, 'break');
                }
            }
        }
    }

    if (timerMode === 'normal') {
        sessionStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            sessionTimerDisplay.textContent = formatTime(elapsedSeconds);
        }, 1000);
    } else { // Pomodoro Mode
        pomodoroState = 'work';
        playSound(pomodoroSounds.start, pomodoroSounds.volume);

        const workDurationSeconds = pomodoroSettings.work * 60;
        pomodoroWorker.postMessage({ command: 'start', duration: workDurationSeconds });

        scheduleSWAlarm({
            delay: workDurationSeconds * 1000,
            timerId: 'pomodoro-transition',
            transitionMessage: {
                type: 'TIMER_ENDED',
                newState: 'short_break',
                oldState: 'work',
                title: 'Focus complete!',
                options: { body: `Time for a short break.`, tag: 'pomodoro-transition' }
            }
        });

        pomodoroStatusDisplay.textContent = `Work (1/${pomodoroSettings.long_break_interval})`;
        pomodoroStatusDisplay.style.color = '#3b82f6';
    }

    document.getElementById('start-studying-btn').classList.add('hidden');
    document.getElementById('stop-studying-btn').classList.remove('hidden');
    document.getElementById('pause-btn').classList.remove('hidden');
    document.getElementById('manual-start-btn').classList.add('hidden');

    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    await updateDoc(userRef, { studying: { subject: activeSubject, startTime: serverTimestamp(), type: 'study' } });
}

async function stopTimer() {
    pomodoroWorker.postMessage({ command: 'stop' });

    isPaused = false;
    pauseStartTime = 0;

    if (timerMode === 'pomodoro' && pomodoroState !== 'idle') {
        const workDuration = pomodoroSettings.work * 60;
        const displayTime = sessionTimerDisplay.textContent;
        const timeLeftInSeconds = (parseInt(displayTime.split(':')[0], 10) * 60) + parseInt(displayTime.split(':')[1], 10);
        const elapsedSeconds = workDuration - timeLeftInSeconds;

        if (pomodoroState === 'work' && elapsedSeconds > 0) {
            await saveSession(activeSubject, elapsedSeconds, 'study');
        }

        cancelSWAlarm('pomodoro-transition');
    }
    else if (timerMode === 'normal' && timerInterval) {
        clearInterval(timerInterval);
        const elapsedMillis = Date.now() - sessionStartTime;
        const sessionDurationSeconds = Math.floor(elapsedMillis / 1000);
        if (sessionDurationSeconds > 0) {
            await saveSession(activeSubject, sessionDurationSeconds, 'study');
        }
    }

    timerInterval = null;
    pomodoroState = 'idle';
    activeSubjectDisplay.textContent = '';
    sessionTimerDisplay.textContent = timerMode === 'pomodoro' ? formatPomodoroTime(pomodoroSettings.work * 60) : formatTime(0);
    pomodoroStatusDisplay.textContent = timerMode === 'pomodoro' ? 'Ready for Pomodoro' : '';
    pomodoroStatusDisplay.style.color = '#9ca3af';

    document.getElementById('start-studying-btn').classList.remove('hidden');
    document.getElementById('stop-studying-btn').classList.add('hidden');
    document.getElementById('pause-btn').classList.add('hidden');
    document.getElementById('resume-btn').classList.add('hidden');
    document.getElementById('manual-start-btn').classList.add('hidden');

    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    await updateDoc(userRef, { studying: null });
}

function pauseTimer() {
    if (timerMode === 'normal' && timerInterval) {
        clearInterval(timerInterval);
        isPaused = true;
        pauseStartTime = Date.now();
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('resume-btn').classList.remove('hidden');
    } else if (timerMode === 'pomodoro' && pomodoroState !== 'idle') {
        pomodoroWorker.postMessage({ command: 'pause' });
        cancelSWAlarm('pomodoro-transition');
        isPaused = true;
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('resume-btn').classList.remove('hidden');
    }
}

function resumeTimer() {
    if (timerMode === 'normal' && isPaused) {
        const pauseDuration = Date.now() - pauseStartTime;
        sessionStartTime += pauseDuration;
        isPaused = false;
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            sessionTimerDisplay.textContent = formatTime(elapsedSeconds);
        }, 1000);
        document.getElementById('pause-btn').classList.remove('hidden');
        document.getElementById('resume-btn').classList.add('hidden');
    } else if (timerMode === 'pomodoro' && isPaused) {
        pomodoroWorker.postMessage({ command: 'resume' });
        isPaused = false;
        document.getElementById('pause-btn').classList.remove('hidden');
        document.getElementById('resume-btn').classList.add('hidden');
    }
}

function startNextPomodoroPhase(state) {
    pomodoroState = state;

    let durationSeconds = 0;
    let statusText = '';
    let transitionMessage = {};

    const currentCycle = Math.floor((currentUserData.pomodoroCycle || 0) / 2);

    if (state === 'work') {
        durationSeconds = pomodoroSettings.work * 60;
        const nextState = ((currentCycle + 1) % pomodoroSettings.long_break_interval === 0) ? 'long_break' : 'short_break';
        statusText = `Work (${currentCycle + 1}/${pomodoroSettings.long_break_interval})`;
        transitionMessage = {
            type: 'TIMER_ENDED',
            newState: nextState,
            oldState: 'work',
            title: 'Focus complete!',
            options: { body: `Time for a ${nextState.replace('_', ' ')}.`, tag: 'pomodoro-transition' }
        };
    } else { // It's a break
        durationSeconds = state === 'short_break' ? pomodoroSettings.short_break * 60 : pomodoroSettings.long_break * 60;
        statusText = state.replace('_', ' ');
        transitionMessage = {
            type: 'TIMER_ENDED',
            newState: 'work',
            oldState: state,
            title: 'Break is over!',
            options: { body: 'Time to get back to focus.', tag: 'pomodoro-transition' }
        };
    }

    pomodoroWorker.postMessage({ command: 'start', duration: durationSeconds });
    pomodoroStatusDisplay.textContent = statusText;
    pomodoroStatusDisplay.style.color = state.includes('break') ? '#f59e0b' : '#3b82f6';

    scheduleSWAlarm({
        delay: durationSeconds * 1000,
        timerId: 'pomodoro-transition',
        transitionMessage: transitionMessage
    });

    if (state === 'work') {
        const newCycleCount = (currentUserData.pomodoroCycle || 0) + 1;
        updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid), { pomodoroCycle: newCycleCount });
    }
}

async function handlePomodoroPhaseEnd({ newState, oldState }) {
    if (oldState === 'work') {
        await saveSession(activeSubject, pomodoroSettings.work * 60, 'study');
    } else { // It was a break
        const breakDuration = oldState === 'short_break' ? pomodoroSettings.short_break * 60 : pomodoroSettings.long_break * 60;
        await saveSession('Break', breakDuration, 'break');
    }

    const soundToPlay = oldState === 'work' ? pomodoroSounds.break : pomodoroSounds.focus;
    playSound(soundToPlay, pomodoroSounds.volume);

    const shouldAutoStart = (newState === 'work' && pomodoroSettings.autoStartFocus) || (newState.includes('break') && pomodoroSettings.autoStartBreak);

    if (shouldAutoStart) {
        startNextPomodoroPhase(newState);
    } else {
        pomodoroWorker.postMessage({ command: 'stop' });
        pomodoroState = 'idle';
        nextPomodoroPhase = newState;

        const manualStartBtn = document.getElementById('manual-start-btn');
        manualStartBtn.textContent = `Start ${newState.replace('_', ' ')}`;
        manualStartBtn.classList.remove('hidden');

        document.getElementById('stop-studying-btn').classList.add('hidden');
        document.getElementById('pause-btn').classList.add('hidden');
        document.getElementById('resume-btn').classList.add('hidden');

        pomodoroStatusDisplay.textContent = `Ready for ${newState.replace('_', ' ')}`;

        let nextDuration = 0;
        if (newState === 'work') {
            nextDuration = pomodoroSettings.work * 60;
        } else if (newState === 'short_break') {
            nextDuration = pomodoroSettings.short_break * 60;
        } else {
            nextDuration = pomodoroSettings.long_break * 60;
        }
        sessionTimerDisplay.textContent = formatPomodoroTime(nextDuration);
    }
}

// --- Event Listeners Helper ---
const ael = (id, event, callback) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener(event, callback);
};

// --- DOM Ready ---
window.onload = async () => {
    appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    // Firebase app, db, auth are now imported directly from firebase.js
    // No need for initializeApp(firebaseConfig) or getFirestore(app) here.

    // Initialize Auth module with the imported 'app', 'db', and 'auth' instances
    initializeAuth(app, db, document.getElementById('auth-error'), appId);

    initUI(
        {
            sessionTimerDisplay: document.getElementById('session-timer'),
            totalTimeDisplay: document.getElementById('total-time-display'),
            totalBreakTimeTodayDisplay: document.getElementById('total-break-time-display'),
            activeSubjectDisplay: document.getElementById('active-subject-display'),
            pomodoroStatusDisplay: document.getElementById('pomodoro-status'),
            authErrorElement: document.getElementById('auth-error')
        },
        db,
        currentUser, // Passed by reference, will be updated by onAuthStateChanged
        currentUserData, // Passed by reference
        appId,
        userSessions,
        groupRealtimeData
    );

    // Initial setup for utils globals
    setUtilsGlobals(db, currentUser, appId, pomodoroSettings, pomodoroSounds, totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds);


    setupAuthListeners(auth, { // Pass the imported 'auth' instance
        onUserLoggedIn: async (user, userData) => {
            currentUser = user; // Update local state in main.js
            currentUserData = userData; // Update local state in main.js
            updateCurrentUserAndData(user, userData); // Update UI and Utils modules

            if (currentUserData.pomodoroSettings) {
                pomodoroSettings = { ...pomodoroSettings, ...currentUserData.pomodoroSettings };
                updatePomodoroSettingsInUtils(pomodoroSettings);
            }
            if (currentUserData.pomodoroSounds) {
                pomodoroSounds = { ...pomodoroSounds, ...currentUserData.pomodoroSounds };
                updatePomodoroSoundsInUtils(pomodoroSounds);
            }
            pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });

            if (!currentUserData || !currentUserData.username) {
                showPage('page-username-setup');
            } else {
                updateProfileUI(currentUserData);
                showPage('page-timer');
                setupRealtimeListeners();
                const dailyTotals = await loadDailyTotal();
                totalTimeTodayInSeconds = dailyTotals.totalStudy;
                totalBreakTimeTodayInSeconds = dailyTotals.totalBreak;
                updateDailyTotalsInUtils(totalTimeTodayInSeconds, totalBreakTimeTodayInSeconds);
            }
        },
        onUserLoggedOut: () => {
            currentUser = null;
            currentUserData = {};
            updateCurrentUserAndData(null, {}); // Update UI and Utils modules to clear user references
            showPage('auth-screen');
        }
    });

    // Auth Event Listeners
    ael('login-form', 'submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        await handleLogin(email, password);
    });

    ael('signup-form', 'submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        await handleSignup(email, password);
    });

    ael('google-signin-btn', 'click', async () => {
        await handleGoogleSignIn();
    });

    ael('auth-toggle-btn', 'click', () => {
        const isLogin = !document.getElementById('login-form').classList.contains('hidden');
        document.getElementById('login-form').classList.toggle('hidden', isLogin);
        document.getElementById('signup-form').classList.toggle('hidden', !isLogin);
        document.getElementById('auth-toggle-btn').textContent = isLogin ? 'Sign In' : 'Sign Up';
        document.getElementById('login-toggle-text').textContent = isLogin ? 'Already have an account?' : "Don't have an account?";
        if (document.getElementById('auth-error')) document.getElementById('auth-error').textContent = '';
    });

    ael('sign-out-btn', 'click', async () => {
        await handleSignOut();
    });

    ael('username-setup-form', 'submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('username-input');
        const usernameError = document.getElementById('username-error');
        const username = usernameInput.value.trim();

        if (username.length < 3) {
            usernameError.textContent = "Username must be at least 3 characters.";
            return;
        }
        usernameError.textContent = '';
        await handleUsernameSetup(currentUser, username);
    });

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', function () {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const pageName = this.dataset.page;
        showPage(`page-${pageName}`);
    }));

    document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', function () {
        const targetPage = this.getAttribute('data-target');
        showPage(`page-${targetPage}`);
        const navItem = document.querySelector(`.nav-item[data-page="${targetPage}"]`);
        if (navItem) {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            navItem.classList.add('active');
        }
    }));

    ael('groups-btn', 'click', () => { renderJoinedGroups(); showPage('page-my-groups'); });
    ael('go-to-find-groups-btn', 'click', () => { renderAvailableGroups(); showPage('page-find-groups'); });
    ael('go-to-create-group-btn', 'click', () => { showPage('page-create-group'); });
    ael('profile-btn', 'click', () => { showPage('page-profile'); });

    // Group Creation
    ael('create-group-done-btn', 'click', async () => {
        const form = document.getElementById('create-group-form');
        if (!form.checkValidity()) {
            showToast('Please fill out all required fields.', 'error');
            form.reportValidity();
            return;
        }
        const btn = document.getElementById('create-group-done-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

        try {
            const username = currentUserData.username;

            const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
            const newGroup = {
                name: document.getElementById('group-name-input').value.trim(),
                password: document.getElementById('group-password-input').value,
                category: document.querySelector('.category-option.selected').textContent,
                timeGoal: parseInt(document.querySelector('.time-option.selected').textContent),
                capacity: parseInt(document.getElementById('capacity-value').textContent),
                description: document.getElementById('group-description-input').value.trim(),
                leaderId: currentUser.uid,
                leaderName: username,
                members: [currentUser.uid],
                createdAt: serverTimestamp()
            };
            const docRef = await addDoc(groupsCollectionRef, newGroup);
            await joinGroup(docRef.id);
            renderJoinedGroups();
            showPage('page-my-groups');
            showToast('Group created successfully!', 'success');
        } catch (error) {
            console.error("Error creating group: ", error);
            showToast("Failed to create group.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = 'Done';
        }
    });

    // Other UI
    document.querySelectorAll('.category-option, .time-option').forEach(option => {
        option.addEventListener('click', () => {
            const parent = option.parentElement;
            parent.querySelectorAll(`.${option.classList[0]}`).forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    let capacity = 15;
    ael('increase-capacity', 'click', () => { if (capacity < 100) { document.getElementById('capacity-value').textContent = ++capacity; } else showToast('Maximum capacity is 100', 'info'); });
    ael('decrease-capacity', 'click', () => { if (capacity > 2) { document.getElementById('capacity-value').textContent = --capacity; } else showToast('Minimum capacity is 2', 'info'); });

    // Modals
    const addSubjectModal = document.getElementById('add-subject-modal');
    const startSessionModal = document.getElementById('start-session-modal');

    ael('add-subject-btn', 'click', () => {
        isAddingSubjectFromStartSession = false;
        addSubjectModal.classList.add('active');
    });
    addSubjectModal.querySelector('.close-modal').addEventListener('click', () => { addSubjectModal.classList.remove('active'); });

    addSubjectModal.querySelectorAll('.color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            addSubjectModal.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
            dot.classList.add('selected');
        });
    });

    ael('add-subject-form', 'submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const name = document.getElementById('add-subject-name').value.trim();
        const selectedColorDot = addSubjectModal.querySelector('.color-dot.selected');
        const color = selectedColorDot ? selectedColorDot.dataset.color : 'bg-blue-500';

        if (!name) {
            showToast("Please provide a name for the subject.", "error");
            return;
        }

        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const subjectsRef = collection(userRef, 'subjects');

        const subjectsSnapshot = await getDocs(subjectsRef);
        const order = subjectsSnapshot.size;

        await addDoc(subjectsRef, { name, color, order });

        addSubjectModal.classList.remove('active');
        document.getElementById('add-subject-form').reset();
        addSubjectModal.querySelector('.color-dot.selected')?.classList.remove('selected');
        addSubjectModal.querySelector('.color-dot[data-color="bg-blue-500"]')?.classList.add('selected');

        const updatedSubjectsSnapshot = await getDocs(query(subjectsRef, orderBy('order', 'asc')));
        const subjects = [];
        updatedSubjectsSnapshot.forEach(doc => subjects.push({ id: doc.id, ...doc.data() }));
        renderSubjectSelectionList(subjects, name);

        showToast("Subject added!", "success");

        if (isAddingSubjectFromStartSession) {
            startSessionModal.classList.add('active');
            isAddingSubjectFromStartSession = false;
        }
    });

    ael('edit-subject-form', 'submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;

        const modal = document.getElementById('edit-subject-modal');
        const subjectId = document.getElementById('edit-subject-id').value;
        const newName = document.getElementById('edit-subject-name').value.trim();
        const selectedColorDot = document.querySelector('#edit-subject-color-picker .color-dot.selected');

        if (!newName) {
            showToast("Subject name cannot be empty.", "error");
            return;
        }

        if (!selectedColorDot) {
            showToast("Please select a color for the subject.", "error");
            return;
        }

        const newColor = selectedColorDot.dataset.color;

        try {
            const subjectRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'subjects', subjectId);
            await updateDoc(subjectRef, {
                name: newName,
                color: newColor
            });

            modal.classList.remove('active');
            showToast("Subject updated successfully!", "success");
        } catch (error) {
            console.error("Error updating subject:", error);
            showToast("Failed to update subject.", "error");
        }
    });

    ael('start-studying-btn', 'click', () => { startSessionModal.classList.add('active'); });
    ael('close-start-session-modal', 'click', () => { startSessionModal.classList.remove('active'); });

    ael('open-add-subject-modal-from-start', 'click', () => {
        isAddingSubjectFromStartSession = true;
        startSessionModal.classList.remove('active');
        addSubjectModal.classList.add('active');
    });

    ael('start-session-form', 'submit', (e) => {
        e.preventDefault();
        const selectedSubjectEl = document.querySelector('#subject-selection-list .subject-item.selected');
        if (!selectedSubjectEl) {
            showToast("Please select a subject to start studying.", "error");
            return;
        }
        const subject = selectedSubjectEl.dataset.subjectName;
        startSessionModal.classList.remove('active');
        startTimer(subject);
    });

    ael('stop-studying-btn', 'click', stopTimer);
    ael('pause-btn', 'click', pauseTimer);
    ael('resume-btn', 'click', resumeTimer);

    ael('manual-start-btn', 'click', () => {
        if (nextPomodoroPhase) {
            playSound(pomodoroSounds.start, pomodoroSounds.volume);
            startNextPomodoroPhase(nextPomodoroPhase);
            nextPomodoroPhase = null;

            document.getElementById('manual-start-btn').classList.add('hidden');
            document.getElementById('stop-studying-btn').classList.remove('hidden');
            document.getElementById('pause-btn').classList.add('hidden');
        }
    });

    // Timer Switch Logic
    const normalTimerBtn = document.getElementById('normal-timer-btn');
    const pomodoroTimerBtn = document.getElementById('pomodoro-timer-btn');

    ael('normal-timer-btn', 'click', () => {
        if (timerMode === 'normal') return;
        if (timerInterval || pomodoroState !== 'idle') stopTimer();
        timerMode = 'normal';
        normalTimerBtn.classList.add('active');
        pomodoroTimerBtn.classList.remove('active');
        sessionTimerDisplay.textContent = formatTime(0);
        pomodoroStatusDisplay.textContent = '';
    });

    ael('pomodoro-timer-btn', 'click', () => {
        if (timerMode === 'pomodoro') return;
        if (timerInterval || pomodoroState !== 'idle') stopTimer();
        timerMode = 'pomodoro';
        pomodoroTimerBtn.classList.add('active');
        normalTimerBtn.classList.remove('active');
        pomodoroStatusDisplay.textContent = 'Ready for Pomodoro';
        pomodoroStatusDisplay.style.color = '#9ca3af';
        sessionTimerDisplay.textContent = formatPomodoroTime(pomodoroSettings.work * 60);

        if ("Notification" in window) {
            if (Notification.permission === 'default') {
                showConfirmationModal(
                    'Enable Notifications?',
                    'To get alerts when your Pomodoro sessions end, please click "Confirm" to allow notifications.',
                    () => {
                        Notification.requestPermission().then(permission => {
                            if (permission === 'granted') {
                                showToast('Notifications have been enabled!', 'success');
                            } else {
                                showToast('Notifications were not enabled. You can change this in your browser settings.', 'info');
                            }
                        });
                    }
                );
            } else if (Notification.permission === 'denied') {
                showToast('Notifications are blocked. Please allow them in your browser settings.', 'info', 5000);
            }
        }
    });

    // Worker Message Handling
    pomodoroWorker.onmessage = (e) => {
        const { type, timeLeft } = e.data;
        if (type === 'tick') {
            sessionTimerDisplay.textContent = formatPomodoroTime(timeLeft);
        } else if (type === 'phase_ended') {
            const oldState = pomodoroState;
            const currentCycle = Math.floor((currentUserData.pomodoroCycle || 0) / 2);
            let newState;

            if (oldState === 'work') {
                newState = ((currentCycle + 1) % pomodoroSettings.long_break_interval === 0) ? 'long_break' : 'short_break';
            } else {
                newState = 'work';
            }
            handlePomodoroPhaseEnd({ newState, oldState });
        }
    };

    // Service Worker Message Listener
    navigator.serviceWorker.addEventListener('message', async (event) => {
        if (event.data && event.data.type === 'TIMER_ENDED') {
            handlePomodoroPhaseEnd(event.data);
        }
    });

    // Drag and Drop Functionality for Subjects
    const subjectListContainer = document.getElementById('subject-selection-list');
    let draggedItem = null;

    subjectListContainer.addEventListener('dragstart', (e) => {
        const targetItem = e.target.closest('.subject-item');
        if (targetItem) {
            draggedItem = targetItem;
            e.dataTransfer.effectAllowed = 'move';
            const img = new Image();
            img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            e.dataTransfer.setDragImage(img, 0, 0);
            setTimeout(() => {
                draggedItem.classList.add('dragging');
            }, 0);
        }
    });

    subjectListContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const targetItem = e.target.closest('.subject-item');
        if (targetItem && targetItem !== draggedItem) {
            const rect = targetItem.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const isAfter = offsetY > rect.height / 2;

            Array.from(subjectListContainer.children).forEach(item => item.classList.remove('drag-over'));

            if (isAfter) {
                targetItem.classList.add('drag-over');
            } else {
                targetItem.classList.add('drag-over');
            }
        }
    });

    subjectListContainer.addEventListener('dragenter', (e) => {
        e.preventDefault();
        const targetItem = e.target.closest('.subject-item');
        if (targetItem && targetItem !== draggedItem) {
            targetItem.classList.add('drag-over');
        }
    });

    subjectListContainer.addEventListener('dragleave', (e) => {
        const targetItem = e.target.closest('.subject-item');
        if (targetItem) {
            targetItem.classList.remove('drag-over');
        }
    });

    subjectListContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        const targetItem = e.target.closest('.subject-item');

        Array.from(subjectListContainer.children).forEach(item => item.classList.remove('drag-over'));

        if (draggedItem && targetItem && draggedItem !== targetItem) {
            const allItems = Array.from(subjectListContainer.children);
            let newIndex = allItems.indexOf(targetItem);

            const rect = targetItem.getBoundingClientRect();
            const offsetY = e.clientY - rect.top;
            const isAfter = offsetY > rect.height / 2;

            if (isAfter && newIndex < allItems.length - 1) {
                subjectListContainer.insertBefore(draggedItem, targetItem.nextSibling);
                newIndex++;
            } else {
                subjectListContainer.insertBefore(draggedItem, targetItem);
            }

            await updateSubjectOrderInFirestore(subjectListContainer, currentUser, appId);
        }
    });

    subjectListContainer.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }
        Array.from(subjectListContainer.children).forEach(item => item.classList.remove('drag-over'));
        draggedItem = null;
    });


    document.getElementById('subject-selection-list').addEventListener('click', async (e) => {
        e.stopPropagation();
        const optionsBtn = e.target.closest('.subject-options-btn');
        const subjectItem = e.target.closest('.subject-item');

        if (optionsBtn) {
            const menu = optionsBtn.nextElementSibling;
            document.querySelectorAll('.subject-options-menu').forEach(m => {
                if (m !== menu) m.classList.remove('active');
            });
            menu.classList.toggle('active');
            return;
        }

        if (subjectItem) {
            document.querySelectorAll('#subject-selection-list .subject-item').forEach(i => i.classList.remove('selected'));
            subjectItem.classList.add('selected');
        }

        if (e.target.classList.contains('delete-subject-btn')) {
            const itemToDelete = e.target.closest('.subject-item');
            const subjectId = itemToDelete.dataset.subjectId;
            const subjectName = itemToDelete.dataset.subjectName;
            showConfirmationModal(
                'Delete Subject?',
                `Are you sure you want to delete "${subjectName}"? This cannot be undone.`,
                async () => {
                    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                    await deleteDoc(doc(userRef, 'subjects', subjectId));
                    await updateSubjectOrderInFirestore(subjectListContainer, currentUser, appId);
                    showToast(`Deleted "${subjectName}"`, 'success');
                }
            );
        }

        if (e.target.classList.contains('edit-subject-btn')) {
            const itemToEdit = e.target.closest('.subject-item');
            const subjectId = itemToEdit.dataset.subjectId;
            const subjectName = itemToEdit.dataset.subjectName;
            const subjectColorClass = Array.from(itemToEdit.querySelector('.w-4.h-4').classList).find(c => c.startsWith('bg-'));

            const modal = document.getElementById('edit-subject-modal');
            document.getElementById('edit-subject-id').value = subjectId;
            document.getElementById('edit-subject-name').value = subjectName;

            const colorPicker = document.getElementById('edit-subject-color-picker');
            const addSubjectColorPicker = document.querySelector('#add-subject-modal .subject-color-picker');
            if (addSubjectColorPicker) {
                colorPicker.innerHTML = addSubjectColorPicker.innerHTML;
            } else {
                console.warn('Source color picker not found for copying. Populating with default colors.');
                colorPicker.innerHTML = `
                    <div class="color-dot bg-blue-500 selected" data-color="bg-blue-500"></div>
                    <div class="color-dot bg-green-500" data-color="bg-green-500"></div>
                    <div class="color-dot bg-red-500" data-color="bg-red-500"></div>
                    <div class="color-dot bg-yellow-500" data-color="bg-yellow-500"></div>
                    <div class="color-dot bg-purple-500" data-color="bg-purple-500"></div>
                `;
            }

            colorPicker.querySelectorAll('.color-dot').forEach(dot => {
                dot.classList.remove('selected');
                if (dot.dataset.color === subjectColorClass) {
                    dot.classList.add('selected');
                }
                dot.addEventListener('click', () => {
                    colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                    dot.classList.add('selected');
                });
            });

            modal.classList.add('active');
        }
    });

    const addTaskModal = document.getElementById('add-task-modal');
    ael('add-task-btn', 'click', () => { addTaskModal.classList.add('active'); });
    addTaskModal.querySelector('.close-modal').addEventListener('click', () => { addTaskModal.classList.remove('active'); });

    ael('add-task-form', 'submit', async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        const name = document.getElementById('add-task-name').value.trim();
        const date = document.getElementById('add-task-date').value;
        if (!name || !date) {
            showToast("Please provide a name and date for the task.", "error");
            return;
        }
        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const plannerTasksRef = collection(userRef, 'plannerTasks');
        await addDoc(plannerTasksRef, { name, date, completed: false });

        addTaskModal.classList.remove('active');
        document.getElementById('add-task-form').reset();
        showToast("Task added!", "success");
    });

    document.getElementById('planner-list').addEventListener('change', async (e) => {
        if (e.target.classList.contains('task-checkbox')) {
            const taskId = e.target.dataset.taskId;
            const isCompleted = e.target.checked;
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const taskRef = doc(userRef, 'plannerTasks', taskId);
            await updateDoc(taskRef, { completed: isCompleted });
        }
    });

    document.getElementById('ranking-period-tabs').addEventListener('click', (e) => {
        if (e.target.classList.contains('ranking-tab-btn')) {
            const period = e.target.dataset.period;
            document.querySelectorAll('#ranking-period-tabs .ranking-tab-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            renderLeaderboard(period);
        }
    });

    document.getElementById('my-groups-list').addEventListener('click', (e) => {
        const groupCard = e.target.closest('.group-card');
        if (groupCard) {
            const groupId = groupCard.dataset.groupId;
            showPage('page-group-detail');
            renderGroupDetail(groupId, currentGroupId, groupDetailUnsubscribers, memberTimerIntervals);
        }
    });

    document.getElementById('all-groups-list')?.addEventListener('click', async (e) => {
        const joinBtn = e.target.closest('.join-btn');
        if (joinBtn && !joinBtn.disabled) {
            const groupId = joinBtn.dataset.id;
            const isPrivate = joinBtn.dataset.private === 'true';

            if (isPrivate) {
                const modal = document.getElementById('password-prompt-modal');
                modal.classList.add('active');
                document.getElementById('password-prompt-form').onsubmit = async (ev) => {
                    ev.preventDefault();
                    const password = document.getElementById('group-password-prompt-input').value;
                    const groupDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId));
                    if (password !== groupDoc.data().password) {
                        showToast('Incorrect password', 'error');
                        return;
                    }
                    modal.classList.remove('active');
                    await joinGroup(groupId);
                };
            } else {
                await joinGroup(groupId);
            }
        }
    });

    document.getElementById('group-detail-nav').addEventListener('click', (e) => {
        const navItem = e.target.closest('.group-nav-item');
        if (navItem) {
            document.querySelectorAll('.group-nav-item').forEach(item => item.classList.remove('active'));
            navItem.classList.add('active');
            renderGroupSubPage(navItem.dataset.subpage, currentGroupId);
        }
    });

    // Profile Settings Modals
    const editProfileModal = document.getElementById('edit-profile-modal');
    ael('settings-account', 'click', () => {
        document.getElementById('edit-username-input').value = currentUserData.username || '';
        editProfileModal.classList.add('active');
    });

    const studyGoalModal = document.getElementById('study-goal-modal');
    ael('settings-study-goal', 'click', () => {
        document.getElementById('study-goal-input').value = currentUserData.studyGoalHours || '';
        studyGoalModal.classList.add('active');
    });

    const pomodoroSettingsModal = document.getElementById('pomodoro-settings-modal');
    ael('settings-pomodoro', 'click', () => {
        document.getElementById('pomodoro-work-duration').value = pomodoroSettings.work;
        document.getElementById('pomodoro-short-break-duration').value = pomodoroSettings.short_break;
        document.getElementById('pomodoro-long-break-duration').value = pomodoroSettings.long_break;
        document.getElementById('pomodoro-long-break-interval').value = pomodoroSettings.long_break_interval;
        document.getElementById('pomodoro-auto-start-focus').checked = pomodoroSettings.autoStartFocus;
        document.getElementById('pomodoro-auto-start-break').checked = pomodoroSettings.autoStartBreak;
        document.getElementById('pomodoro-volume').value = pomodoroSounds.volume;

        const soundDropdowns = [
            { id: 'pomodoro-start-sound', key: 'start' },
            { id: 'pomodoro-focus-sound', key: 'focus' },
            { id: 'pomodoro-break-sound', key: 'break' }
        ];
        soundDropdowns.forEach(dd => {
            const selectEl = document.getElementById(dd.id);
            selectEl.innerHTML = '';
            const availableSounds = { 'None': '', 'Simple Beep': 'tone_simple_beep', 'Chime Chord': 'tone_chime_chord', 'Metal Bell': 'tone_metal_bell' };

            for (const [name, url] of Object.entries(availableSounds)) {
                const option = document.createElement('option');
                option.value = url;
                option.textContent = name;
                if (url === pomodoroSounds[dd.key]) {
                    option.selected = true;
                }
                selectEl.appendChild(option);
            }
        });

        pomodoroSettingsModal.classList.add('active');
    });

    ael('edit-profile-form', 'submit', async (e) => {
        e.preventDefault();
        const newUsername = document.getElementById('edit-username-input').value.trim();
        if (newUsername.length < 3) {
            showToast("Username must be at least 3 characters.", "error");
            return;
        }
        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
        await updateDoc(userRef, { username: newUsername });
        await updateDoc(publicUserRef, { username: newUsername });

        editProfileModal.classList.remove('active');
        showToast("Profile updated!", "success");
    });

    ael('study-goal-form', 'submit', async (e) => {
        e.preventDefault();
        const goal = parseInt(document.getElementById('study-goal-input').value, 10);
        if (isNaN(goal) || goal < 1 || goal > 24) {
            showToast("Please enter a valid number of hours (1-24).", "error");
            return;
        }
        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        await updateDoc(userRef, { studyGoalHours: goal });

        studyGoalModal.classList.remove('active');
        showToast("Study goal updated!", "success");
    });

    ael('pomodoro-settings-form', 'submit', async (e) => {
        e.preventDefault();
        const newSettings = {
            work: parseInt(document.getElementById('pomodoro-work-duration').value, 10),
            short_break: parseInt(document.getElementById('pomodoro-short-break-duration').value, 10),
            long_break: parseInt(document.getElementById('pomodoro-long-break-duration').value, 10),
            long_break_interval: parseInt(document.getElementById('pomodoro-long-break-interval').value, 10),
            autoStartFocus: document.getElementById('pomodoro-auto-start-focus').checked,
            autoStartBreak: document.getElementById('pomodoro-auto-start-break').checked,
        };
        const newSounds = {
            start: document.getElementById('pomodoro-start-sound').value,
            focus: document.getElementById('pomodoro-focus-sound').value,
            break: document.getElementById('pomodoro-break-sound').value,
            volume: parseFloat(document.getElementById('pomodoro-volume').value)
        };

        if (Object.values(newSettings).some(v => typeof v === 'number' && (isNaN(v) || v < 1))) {
            showToast("Please enter valid, positive numbers for all duration settings.", "error");
            return;
        }

        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        await updateDoc(userRef, {
            pomodoroSettings: newSettings,
            pomodoroSounds: newSounds
        });

        pomodoroSettings = newSettings;
        pomodoroSounds = newSounds;
        updatePomodoroSettingsInUtils(pomodoroSettings);
        updatePomodoroSoundsInUtils(pomodoroSounds);
        pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });
        pomodoroSettingsModal.classList.remove('active');
        showToast("Pomodoro settings saved!", "success");
    });

    ael('edit-session-form', 'submit', async (e) => {
        e.preventDefault();
        const modal = document.getElementById('edit-session-modal');
        const sessionId = document.getElementById('edit-session-id').value;
        const newDurationMinutes = parseInt(document.getElementById('edit-session-duration').value, 10);
        const oldDurationSeconds = parseInt(document.getElementById('edit-session-old-duration').value, 10);
        const endedAt = new Date(document.getElementById('edit-session-ended-at').value);

        if (isNaN(newDurationMinutes) || newDurationMinutes < 1) {
            showToast('Please enter a valid duration.', 'error');
            return;
        }

        const newDurationSeconds = newDurationMinutes * 60;
        const durationDifference = newDurationSeconds - oldDurationSeconds;

        const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
        const sessionRef = doc(userRef, 'sessions', sessionId);

        try {
            const sessionDoc = await getDoc(sessionRef);
            const sessionType = sessionDoc.exists() ? sessionDoc.data().type || 'study' : 'study';

            await updateDoc(sessionRef, { durationSeconds: newDurationSeconds });

            if (sessionType === 'study') {
                await updateDoc(userRef, { totalStudySeconds: increment(durationDifference) });
                await updateDoc(publicUserRef, { totalStudySeconds: increment(durationDifference) });
            } else {
                await updateDoc(userRef, { totalBreakSeconds: increment(durationDifference) });
                await updateDoc(publicUserRef, { totalBreakSeconds: increment(durationDifference) });
            }

            const sessionDateStr = endedAt.toISOString().split('T')[0];
            const todayStr = getCurrentDate().toISOString().split('T')[0];
            if (sessionDateStr === todayStr) {
                if (sessionType === 'study') {
                    totalTimeTodayInSeconds += durationDifference;
                    if (totalTimeTodayInSeconds < 0) totalTimeTodayInSeconds = 0;
                    await updateDoc(userRef, {
                        totalTimeToday: {
                            date: todayStr,
                            seconds: totalTimeTodayInSeconds
                        }
                    });
                } else {
                    totalBreakTimeTodayInSeconds += durationDifference;
                    if (totalBreakTimeTodayInSeconds < 0) totalBreakTimeTodayInSeconds = 0;
                    await updateDoc(userRef, {
                        totalBreakTimeToday: {
                            date: todayStr,
                            seconds: totalBreakTimeTodayInSeconds
                        }
                    });
                }
            }

            modal.classList.remove('active');
            showToast("Session updated successfully!", "success");
        } catch (error) {
            console.error("Error updating session:", error);
            showToast("Failed to update session.", "error");
        }
    });

    // Ranking Scope Switch Listeners
    ael('group-ranking-scope-btn', 'click', () => {
        if (!document.getElementById('group-ranking-scope-btn').classList.contains('active')) {
            document.getElementById('global-ranking-scope-btn').classList.remove('active');
            document.getElementById('group-ranking-scope-btn').classList.add('active');
            const activePeriod = document.querySelector('#group-ranking-period-tabs .ranking-tab-btn.active')?.dataset.period || 'weekly';
            renderGroupLeaderboard(activePeriod);
        }
    });

    ael('global-ranking-scope-btn', 'click', () => {
        if (!document.getElementById('global-ranking-scope-btn').classList.contains('active')) {
            document.getElementById('group-ranking-scope-btn').classList.remove('active');
            document.getElementById('global-ranking-scope-btn').classList.add('active');
            const activePeriod = document.querySelector('#group-ranking-period-tabs .ranking-tab-btn.active')?.dataset.period || 'weekly';
            renderLeaderboard(activePeriod, 'group-ranking-list');
        }
    });


    window.addEventListener('click', (e) => {
        if (!e.target.closest('.subject-options-btn')) {
            document.querySelectorAll('.subject-options-menu').forEach(m => m.classList.remove('active'));
        }
        if (!e.target.closest('.log-options-btn')) {
            document.querySelectorAll('.log-options-menu').forEach(m => m.classList.remove('active'));
        }
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
        modal.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => { modal.classList.remove('active'); });
        });
    });

    const pomodoroSettingsForm = document.getElementById('pomodoro-settings-form');
    if (pomodoroSettingsForm) {
        pomodoroSettingsForm.addEventListener('change', (e) => {
            const target = e.target;
            if (target.matches('select[id^="pomodoro-"]')) {
                const soundUrl = target.value;
                const volume = parseFloat(document.getElementById('pomodoro-volume').value);
                playSound(soundUrl, volume);
            } else if (target.id === 'pomodoro-volume') {
                const sampleSoundUrl = document.getElementById('pomodoro-focus-sound').value;
                const volume = parseFloat(target.value);
                playSound(sampleSoundUrl, volume);
            }
        });
    }

    ael('group-study-timer-btn', 'click', async () => {
        if (currentUserData.joinedGroups && currentUserData.joinedGroups.length > 0) {
            const targetGroupId = currentGroupId && currentUserData.joinedGroups.includes(currentGroupId) ? currentGroupId : currentUserData.joinedGroups[0];
            currentGroupId = targetGroupId;
            showPage('page-group-detail');
            renderGroupDetail(targetGroupId, currentGroupId, groupDetailUnsubscribers, memberTimerIntervals);
        } else {
            showPage('page-my-groups');
        }
    });

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
            navigator.serviceWorker
                .register('./service-worker.js', { scope: './' })
                .then(registration => {
                    console.log('Service Worker registered successfully with scope:', registration.scope);
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        showToast('New version available! Refresh for updates.', 'info', 5000);
                                        console.log('New content is available; please refresh.');
                                    } else {
                                        console.log('Content is cached for offline use.');
                                    }
                                }
                            };
                        }
                    };
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });

            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New service worker activated, reloading page for latest content.');
                window.location.reload();
            });
        } else {
            console.warn('Service Worker not registered. This feature requires a secure context (HTTPS or localhost). The Pomodoro timer will be less reliable in the background.');
        }
    }
};

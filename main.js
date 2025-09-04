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
                    // The main thread will handle the transition via the Service Worker alarm
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
                            clearInterval(timerInterval); // Stop the interval when paused
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

        // --- FIX START: Listen for messages from the Pomodoro Web Worker ---
        pomodoroWorker.onmessage = (e) => {
            const { type, timeLeft } = e.data;
            if (type === 'tick' && sessionTimerDisplay) {
                // Update the timer display on every tick from the worker
                sessionTimerDisplay.textContent = formatPomodoroTime(timeLeft);
            } else if (type === 'phase_ended') {
                // This is a local trigger from the worker when a phase ends.
                // It's the primary way the UI transitions when the app is in the foreground.
                console.log('Worker signaled phase end. Handling transition locally.');
                
                const oldState = pomodoroState;
                if (oldState === 'idle') return; // Safety check, don't transition if already stopped

                let newState;
                if (oldState === 'work') {
                    // A work session just finished. Check if it's time for a long break.
                    const completedWorkSessions = currentUserData.pomodoroCycle || 0;
                    const isLongBreakTime = completedWorkSessions > 0 && (completedWorkSessions % pomodoroSettings.long_break_interval === 0);
                    newState = isLongBreakTime ? 'long_break' : 'short_break';
                } else {
                    // A break just finished. Time to get back to work.
                    newState = 'work';
                }

                // Call the existing handler function to manage the transition.
                handlePomodoroPhaseEnd({ newState, oldState });
            }
        };
        // --- FIX END ---

        // --- Service Worker Communication Functions ---
        function scheduleSWAlarm(payload) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'SCHEDULE_ALARM',
                    payload: payload
                });
            }
        }

        function cancelSWAlarm(timerId) {
            if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                navigator.serviceWorker.controller.postMessage({
                    type: 'CANCEL_ALARM',
                    payload: { timerId: timerId }
                });
            }
        }


        // --- Application Setup ---
        const getCurrentDate = () => new Date();

        // --- App State ---
        let db, auth, messaging, functions;
        let currentUser = null;
        let currentUserData = {};
        let dashboardCharts = {};
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        let userSessions = []; 
        let isAudioUnlocked = false;
        let isAddingSubjectFromStartSession = false; // Flag to track modal origin
        let fcmToken;
        let getLeaderboard;
        let getGroupRankings;
        let joinGroupCloudFunction;
        // --- ADD THESE LINES ---
        let getStats;
        let getPlannerData;
        let addPlannerItem;
        let updatePlannerItem;
        let deletePlannerItem;
        // --- END ADDED LINES ---
        let sendPomodoroNotification;
        let sendWakeUpNotification;
        let sendGroupWakeUpNotification;
// ... existing code ... -->
        getLeaderboard = httpsCallable(functions, 'getLeaderboard');
        getGroupRankings = httpsCallable(functions, 'getGroupRankings');
        joinGroupCloudFunction = httpsCallable(functions, 'joinGroup');
        // --- ADD THESE LINES ---
        getStats = httpsCallable(functions, 'getStats');
        getPlannerData = httpsCallable(functions, 'getPlannerData');
        addPlannerItem = httpsCallable(functions, 'addPlannerItem');
        updatePlannerItem = httpsCallable(functions, 'updatePlannerItem');
        deletePlannerItem = httpsCallable(functions, 'deletePlannerItem');
        // --- END ADDED LINES ---

        sendPomodoroNotification = httpsCallable(functions, 'sendPomodoroNotification'); // Assign callable function
        sendWakeUpNotification = httpsCallable(functions, 'sendWakeUpNotification');
        sendGroupWakeUpNotification = httpsCallable(functions, 'sendGroupWakeUpNotification');
// ... existing code ... -->
            // --- MODIFICATION START: Call the Cloud Function ---
            try {
                const result = await getStats({ appId: appId });
                
                if (!result.data.success) {
                    throw new Error('Failed to fetch stats from cloud function.');
                }
                const stats = result.data.stats;
                
                // Now use the pre-calculated stats to render the page
                document.getElementById('total-focus-time').textContent = formatTime(stats.totalFocusTime);
                document.getElementById('total-sessions-count').textContent = stats.totalSessions;
                document.getElementById('average-session-length').textContent = formatTime(stats.averageSessionLength);
                document.getElementById('longest-session-duration').textContent = formatTime(stats.longestSession);
                document.getElementById('consistency-streak-days').textContent = stats.consistencyStreak;

                // Render subject breakdown chart
                const subjectData = Object.entries(stats.sessionsBySubject).map(([label, value]) => ({
                    label,
                    value: (value / 3600).toFixed(2), // convert to hours
                    rawSeconds: value
                })).sort((a, b) => b.rawSeconds - a.rawSeconds);

                renderPieChart(subjectData, 'subject-breakdown-chart');

                // Render daily focus chart
                if (stats.dailyFocusData.length > 0) {
                    renderBarChart(stats.dailyFocusData, 'daily-focus-chart');
                } else {
                    const chartContainer = document.getElementById('daily-focus-chart');
                    if(chartContainer) {
                        chartContainer.innerHTML = `<div class="empty-chart"><i class="fas fa-chart-bar"></i><p>No study data yet to display.</p></div>`;
                    }
                }
                 if(insightsContainer) {
                    insightsContainer.innerHTML = generateInsights(stats);
                 }


            } catch(error) {
                console.error("Error fetching stats:", error);
                const statsPage = document.getElementById('stats-page');
                if(statsPage) {
                    statsPage.innerHTML = `<div class="p-8 text-center text-gray-400"><i class="fas fa-exclamation-triangle fa-2x mb-4"></i><p>Could not load your statistics. Please try again later.</p></div>`;
                }
            }
            // --- MODIFICATION END ---
        }

        function generateInsights(stats) {
            let insights = [];
            if (stats.totalFocusTime === 0) {
// ... existing code ... -->


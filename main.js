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
        let sendPomodoroNotification;
        let sendWakeUpNotification;
        let sendGroupWakeUpNotification;
        let getPremiumData;

        // --- FIX START: Add the function to handle Pomodoro phase transitions ---
        async function handlePomodoroPhaseEnd(data) {
            const { newState, oldState } = data;
        
            // Play the appropriate sound for the end of the phase
            playSound(oldState === 'work' ? pomodoroSounds.break : pomodoroSounds.focus, pomodoroSounds.volume);
        
            // Save the session that just ended
            const sessionDuration = oldState === 'work' 
                ? pomodoroSettings.work * 60
                : (oldState === 'short_break' ? pomodoroSettings.short_break * 60 : pomodoroSettings.long_break * 60);
        
            const sessionType = oldState === 'work' ? 'study' : 'break';
            const subject = oldState === 'work' ? activeSubject : oldState.replace('_', ' ');
            await saveSession(subject, sessionDuration, sessionType);
        
            // Check auto-start settings to decide what to do next
            const shouldAutoStart = (newState === 'work' && pomodoroSettings.autoStartFocus) || 
                                    (newState.includes('break') && pomodoroSettings.autoStartBreak);
        
            if (shouldAutoStart) {
                await startNextPomodoroPhase(newState);
            } else {
                // If not auto-starting, show the manual start button
                pomodoroState = 'idle'; 
                nextPomodoroPhase = newState;
                document.getElementById('manual-start-btn').classList.remove('hidden');
                document.getElementById('stop-studying-btn').classList.add('hidden');
                document.getElementById('pause-btn').classList.add('hidden');
                pomodoroStatusDisplay.textContent = `Ready for ${newState.replace('_', ' ')}`;
            }
        }
        // --- FIX END ---

/**
 * Initializes push notifications: requests permission, gets FCM token, and saves it to Firestore.
 */
async function initializePushNotifications() {
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            console.log('Notification permission granted.');

            // Use the service worker registration that is already active.
            const swRegistration = await navigator.serviceWorker.ready;
            console.log('Using active Service Worker registration:', swRegistration);

            // Get the FCM token, passing in the service worker registration.
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
                console.log('No registration token available. Request permission to generate one.');
                showToast('Could not get notification token.', 'warning');
            }
        } else {
            console.log('Unable to get permission to notify.');
            showToast('Notification permission denied.', 'warning');
        }
    } catch (error) {
        console.error('Error getting FCM token or permission:', error);
        showToast('Failed to enable push notifications.', 'error');
    }
}


/**
 * Saves the FCM registration token to Firestore for the current user.
 * @param {string} token - The FCM registration token.
 * @param {string} userId - The ID of the current user.
 */
async function saveFcmTokenToFirestore(token, userId) {
    if (!userId) {
        console.error('Cannot save FCM token: User ID is null.');
        return;
    }
    try {
        // Store token in a user-specific collection
        const tokenRef = doc(db, `artifacts/${appId}/users/${userId}/fcmTokens`, token);
        await setDoc(tokenRef, { token: token, userId: userId, timestamp: new Date() }, { merge: true });
        console.log('FCM token saved to Firestore.');
    } catch (error) {
        console.error('Error saving FCM token to Firestore:', error);
        showToast('Failed to save notification preferences.', 'error');
    }
}

// Listen for incoming messages while the app is in the foreground
// MOVED this block inside initializeFirebase()

/**
 * Helper function to trigger the Cloud Function for sending Pomodoro notifications.
 * This replaces your local `scheduleSWAlarm` for Pomodoro transitions.
 * @param {object} messageData - Data to send to the Cloud Function, includes title, body, newState, oldState.
 */
async function triggerServerNotification(messageData) {
    if (!currentUser || !currentUser.uid) {
        console.error('User not authenticated, cannot send server notification.');
        showToast('Please sign in to enable server notifications.', 'error');
        return;
    }
    try {
        // Call the Cloud Function
        const result = await sendPomodoroNotification({
            userId: currentUser.uid, // Required by your Cloud Function
            appId: appId,            // Required by your Cloud Function to build Firestore path
            title: messageData.title,
            body: messageData.options.body, // Use 'options.body' as FCM notification body
            newState: messageData.newState,
            oldState: messageData.oldState,
            // Any other data you want to send and retrieve in the notification click handler
        });
        console.log('Server notification triggered:', result.data);
    } catch (error) {
        console.error('Error triggering server notification:', error);
        showToast('Failed to schedule notification.', 'error');
    }
}

        // Timer State
        // Add these lines
let isPaused = false;
let pauseStartTime = 0;
        let timerInterval = null;
        let sessionStartTime = 0;
        let totalTimeTodayInSeconds = 0;
        let totalBreakTimeTodayInSeconds = 0; // New: Track total break time today
        let activeSubject = '';
        let groupDetailUnsubscribers = [];
        let memberTimerIntervals = [];
        let currentGroupId = null;
        let groupRealtimeData = {
            members: {},
            sessions: {}
        };
        
        // Break Timer State (for idle time)
        let breakTimerInterval = null;
        let breakStartTime = 0;

        // Drag & Drop State
        let draggedItem = null;

        // --- Pomodoro State ---
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
        const availableSounds = {
            'None': '',
            '8-Bit Powerup': 'tone_powerup',
            'Alarm Beep': 'tone_alarm_beep',
            'Alien Signal': 'tone_alien_signal',
            'Arcade Hit': 'tone_arcade_hit',
            'Bass Drop': 'tone_bass_drop',
            'Beep Sequence': 'tone_beep_sequence',
            'Bell': 'tone_metal_bell',
            'Bird': 'tone_bird',
            'Bubble Pop': 'tone_bubble_pop',
            'Bubbles': 'tone_bubbles',
            'Buzzer': 'tone_buzzer',
            'Cat Purr': 'tone_purr',
            'Celesta': 'tone_celesta',
            'Chime Chord': 'tone_chime_chord',
            'Chimes': 'tone_chimes',
            'Chiptune Arp': 'tone_chiptune_arp',
            'Choir Aah': 'tone_choir_aah',
            'Clock Tick': 'tone_clock_tick',
            'Coin Collect': 'tone_coin_collect',
            'Computer Voice': 'tone_computer_voice',
            'Cosmic Ping': 'tone_cosmic_ping',
            'Cosmic Rumble': 'tone_cosmic_rumble',
            'Crickets': 'tone_crickets',
            'Crystal': 'tone_crystal',
            'Cybernetic': 'tone_cybernetic',
            'Data Stream': 'tone_data_stream',
            'Deep Drone': 'tone_deep_drone',
            'Dial-up': 'tone_dial_up',
            'Digital': 'tone_digital',
            'Digital Sweep': 'tone_digital_sweep',
            'Disintegrate': 'tone_disintegrate',
            'Dreamy Arp': 'tone_dreamy_arp',
            'Drone Pulse': 'tone_drone_pulse',
            'Electric Piano': 'tone_electric_piano',
            'Energy Charge': 'tone_energy_charge',
            'Engine Start': 'tone_engine_start',
            'Error Beep': 'tone_error_beep',
            'Explosion': 'tone_explosion',
            'Fairy Twinkle': 'tone_fairy_twinkle',
            'Flute': 'tone_flute',
            'Forcefield': 'tone_forcefield',
            'Game Over': 'tone_game_over',
            'Glass Tap': 'tone_glass_tap',
            'Glitch': 'tone_glitch',
            'Gong': 'tone_gong',
            'Guitar Harmonic': 'tone_guitar_harmonic',
            'Harp': 'tone_harp',
            'Heartbeat': 'tone_heartbeat',
            'High Score': 'tone_high_score',
            'Hologram': 'tone_hologram',
            'Hyperspace': 'tone_hyperspace',
            'Kalimba': 'tone_kalimba',
            'Keyboard Click': 'tone_keyboard',
            'Kitchen': 'tone_kitchen',
            'Laser': 'tone_laser',
            'Low Battery': 'tone_low_battery',
            'Mechanical': 'tone_mechanical',
            'Metal Bell': 'tone_metal_bell',
            'Modem': 'tone_modem',
            'Morse Code': 'tone_morse',
            'Music Box': 'tone_music_box',
            'Noise Alarm': 'tone_noise_alarm',
            'Notification Pop': 'tone_notification_pop',
            'Ocean Wave': 'tone_ocean',
            'Ominous Drone': 'tone_ominous_drone',
            'Page Turn': 'tone_page_turn',
            'Phase Shift': 'tone_phase_shift',
            'Pluck': 'tone_pluck',
            'Portal': 'tone_portal',
            'Power Down': 'tone_power_down',
            'Rain on Window': 'tone_rain_on_window',
            'Rainfall': 'tone_rainfall',
            'Retro Game': 'tone_retro_game',
            'Riser': 'tone_riser',
            'Robot Beep': 'tone_robot_beep',
            'Scanner': 'tone_scanner',
            'Sci-Fi Pad': 'tone_sci_fi_pad',
            'Simple Beep': 'tone_simple_beep',
            'Singing Bowl': 'tone_singing_bowl',
            'Soft Marimba': 'tone_soft_marimba',
            'Sonar Ping': 'tone_sonar',
            'Starship Hum': 'tone_starship_hum',
            'Static': 'tone_static',
            'Steam Train': 'tone_steam_train',
            'Steel Drum': 'tone_steel_drum',
            'Strummed Chord': 'tone_strummed_chord',
            'Stutter': 'tone_stutter',
            'Subtle Beep': 'tone_subtle_beep',
            'Synth Pluck': 'tone_synth_pluck',
            'Synthwave': 'tone_synthwave',
            'Teleporter': 'tone_teleporter',
            'Thunder': 'tone_thunder',
            'Tibetan Bowl': 'tone_tibetan_bowl',
            'Typewriter': 'tone_typewriter',
            'UI Confirm': 'tone_ui_confirm',
            'Vibrating Bell': 'tone_vibrating_bell',
            'Vinyl Crackles': 'tone_vinyl_crackles',
            'Violin Pizzicato': 'tone_pizzicato',
            'Warning Horn': 'tone_warning_horn',
            'Water Drop': 'tone_water_drop',
            'Wind Chimes': 'tone_wind_chimes',
            'Wobble': 'tone_wobble',
            'Wood': 'tone_wood',
            'Xylophone': 'tone_xylophone',
            'Zen Garden': 'tone_zen_garden',
        };

        // Attendance State
        let attendanceMonth = getCurrentDate().getMonth();
        let attendanceYear = getCurrentDate().getFullYear();

        // --- UI Elements ---
        const authError = document.getElementById('auth-error');
        const sessionTimerDisplay = document.getElementById('session-timer');
        const totalTimeDisplay = document.getElementById('total-time-display');
        const totalBreakTimeDisplay = document.getElementById('total-break-time-display');
        const activeSubjectDisplay = document.getElementById('active-subject-display');
        const pomodoroStatusDisplay = document.getElementById('pomodoro-status');

        window.viewImage = function(src) {
            const modal = document.getElementById('image-view-modal');
            const img = document.getElementById('fullscreen-image');
            if (modal && img) {
                img.src = src;
                modal.classList.add('active');
            }
        }

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

            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 400; // Smaller size for profile pics
                        let width = img.width;
                        let height = img.height;

                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Use JPEG for smaller size
                    };
                };
                reader.onerror = error => reject(error);
            });

            try {
                const base64Image = await toBase64(file);
                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                
                const batch = firestoreWriteBatch(db);
                batch.update(userRef, { photoURL: base64Image });
                batch.update(publicUserRef, { photoURL: base64Image });
                await batch.commit();

                showToast('Profile picture updated!', 'success');
            } catch (error) {
                console.error("Error uploading profile picture:", error);
                showToast('Profile picture upload failed.', 'error');
            }
        }


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

            const toBase64 = file => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const img = new Image();
                    img.src = reader.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800;
                        let width = img.width;
                        let height = img.height;

                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve(canvas.toDataURL('image/jpeg', 0.8));
                    };
                };
                reader.onerror = error => reject(error);
            });

            try {
                const base64Image = await toBase64(file);
                const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups', groupId, 'messages');
                const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid));
                
                await addDoc(messagesRef, {
                    imageUrl: base64Image,
                    text: '',
                    senderId: currentUser.uid,
                    senderName: userDoc.data().username,
                    timestamp: serverTimestamp()
                });
            } catch (error) {
                console.error("Error uploading image:", error);
                showToast('Image upload failed.', 'error');
            }
        }

        // --- UI Helper Functions ---
        
        /**
         * Sends a message to the Service Worker to schedule a notification.
         * This is the key to reliable background timers on mobile.
         * @param {number} delayInMs - The delay in milliseconds until the notification should be shown.
         * @param {string} title - The title of the notification.
         * @param {object} options - The options for the notification (e.g., body, icon, tag).
         */
        function scheduleTransitionNotification(delayInMs, title, options) {
            // First, make sure Service Workers and Notifications are supported.
            if (!('serviceWorker' in navigator) || !('Notification' in window)) {
                console.warn('Service Workers or Notifications are not supported in this browser.');
                return;
            }

            // Ask for permission if we don't have it yet.
            // This should ideally be done upon a clear user action, like enabling Pomodoro mode.
            if (Notification.permission === 'default') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        // Permission granted, now schedule.
                        scheduleNow(delayInMs, title, options);
                    }
                });
            } else if (Notification.permission === 'granted') {
                scheduleNow(delayInMs, title, options);
            }
            
            function scheduleNow(delay, title, opts) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.active.postMessage({
                        type: 'SCHEDULE_NOTIFICATION',
                        payload: {
                            delay: delay,
                            title: title,
                            options: opts
                        }
                    });
                });
            }
        }


        async function playSound(soundId, volume) {
            if (!soundId || soundId.trim() === '') return;
            
            await Tone.start();

            try {
                if (soundId.startsWith('tone_')) {
                    const now = Tone.now();
                    const settings = { volume: Tone.gainToDb(volume) };
                    
                    // Helper to create, trigger, and dispose of a synth to prevent memory leaks
                    const triggerSynth = (synthType, options, note, duration, connection) => {
                        const s = new synthType(options);
                        if (connection) {
                            s.connect(connection);
                        } else {
                            s.toDestination();
                        }
                        s.triggerAttackRelease(note, duration, now);
                        // Dispose after the sound has finished playing
                        const durationSeconds = Tone.Time(duration).toSeconds();
                        setTimeout(() => s.dispose(), (durationSeconds + 0.5) * 1000);
                    };
                    
                     const triggerPolySynth = (synthType, options, notes, duration) => {
                        const poly = new Tone.PolySynth(synthType, options).toDestination();
                        poly.triggerAttackRelease(notes, duration, now);
                        const durationSeconds = Tone.Time(duration).toSeconds();
                        setTimeout(() => poly.dispose(), (durationSeconds + 1) * 1000);
                    };

                    switch (soundId) {
                        // --- Simple Tones & Beeps ---
                        case 'tone_simple_beep':
                            triggerSynth(Tone.Oscillator, { ...settings, type: "sine", frequency: "C5" }, "C5", 0.2);
                            break;
                        case 'tone_subtle_beep':
                            triggerSynth(Tone.Oscillator, { volume: Tone.gainToDb(volume * 0.5), type: "sine", frequency: "A5" }, "A5", 0.15);
                            break;
                        case 'tone_alarm_beep':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "F#5", "0.2s");
                            break;
                        case 'tone_buzzer':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sawtooth' } }, "C3", "0.3s");
                            break;
                        case 'tone_error_beep':
                            const errorSynth = new Tone.Synth({ ...settings, oscillator: { type: 'triangle' } }).toDestination();
                            errorSynth.triggerAttackRelease("B4", "16n", now);
                            errorSynth.triggerAttackRelease("F4", "16n", now + 0.2);
                            setTimeout(() => errorSynth.dispose(), 600);
                            break;
                        case 'tone_ui_confirm':
                            const confirmSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sine' } }).toDestination();
                            confirmSynth.triggerAttackRelease("C5", "16n", now);
                            confirmSynth.triggerAttackRelease("G5", "16n", now + 0.1);
                            setTimeout(() => confirmSynth.dispose(), 500);
                            break;
                        case 'tone_warning_horn':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sawtooth' } }, "A3", "1s");
                            break;
                        case 'tone_beep_sequence':
                            const seqSynth = new Tone.Synth(settings).toDestination();
                            seqSynth.triggerAttackRelease("C5", "16n", now);
                            seqSynth.triggerAttackRelease("E5", "16n", now + 0.15);
                            seqSynth.triggerAttackRelease("G5", "16n", now + 0.3);
                            setTimeout(() => seqSynth.dispose(), 800);
                            break;
                        case 'tone_low_battery':
                            const lowBattSynth = new Tone.Synth(settings).toDestination();
                            lowBattSynth.triggerAttackRelease("G4", "8n", now);
                            lowBattSynth.triggerAttackRelease("E4", "8n", now + 0.2);
                            lowBattSynth.triggerAttackRelease("C4", "8n", now + 0.4);
                            setTimeout(() => lowBattSynth.dispose(), 1000);
                            break;
                        case 'tone_robot_beep':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "A4", "16n");
                            break;
                        case 'tone_computer_voice':
                            const compSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                            compSynth.triggerAttackRelease("A3", "16n", now);
                            compSynth.triggerAttackRelease("D4", "16n", now + 0.15);
                            compSynth.triggerAttackRelease("F4", "16n", now + 0.3);
                            setTimeout(() => compSynth.dispose(), 800);
                            break;
                        case 'tone_digital':
                             triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 3, modulationIndex: 10 }, "C6", "32n");
                             break;

                        // --- Melodic & Chords ---
                        case 'tone_chime_chord':
                            triggerPolySynth(Tone.Synth, { volume: settings.volume, oscillator: {type: 'sine'} }, ["C5", "E5", "G5"], "0.5s");
                            break;
                        case 'tone_chimes':
                            triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 8, resonance: 800, octaves: 1.5 }, ["C5", "E5", "G5", "B5"], "1s");
                            break;
                        case 'tone_synth_pluck':
                            triggerSynth(Tone.Synth, settings, "C4", "8n");
                            break;
                        case 'tone_pluck':
                            triggerSynth(Tone.PluckSynth, settings, "C4", "4n");
                            break;
                        case 'tone_music_box':
                            const mbSynth = new Tone.PluckSynth({ ...settings, attackNoise: 0.5, dampening: 4000, resonance: 0.9 }).toDestination();
                            const mbReverb = new Tone.Reverb(1.5).toDestination();
                            mbSynth.connect(mbReverb);
                            mbSynth.triggerAttackRelease("C5", "1n", now);
                            mbSynth.triggerAttackRelease("G5", "1n", now + 0.5);
                            mbSynth.triggerAttackRelease("E5", "1n", now + 1);
                            setTimeout(() => { mbSynth.dispose(); mbReverb.dispose(); }, 2500);
                            break;
                         case 'tone_xylophone':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 1, dampening: 7000, resonance: 0.98 }, "C5", "4n");
                            break;
                        case 'tone_celesta':
                            triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 7, resonance: 900, octaves: 2 }, "C5", "1s");
                            break;
                        case 'tone_chiptune_arp':
                            const arpSynth = new Tone.Synth({ ...settings, oscillator: { type: 'pulse', width: 0.4 } }).toDestination();
                            const notes = ["C4", "E4", "G4", "C5", "G4", "E4"];
                            notes.forEach((note, i) => arpSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                            setTimeout(() => arpSynth.dispose(), 1000);
                            break;
                        case 'tone_dreamy_arp':
                            const dreamSynth = new Tone.FMSynth({ ...settings, harmonicity: 1.5, modulationIndex: 5 }).toDestination();
                            const dreamReverb = new Tone.Reverb(3).toDestination();
                            dreamSynth.connect(dreamReverb);
                            const dreamNotes = ["C4", "G4", "B4", "E5"];
                            dreamNotes.forEach((note, i) => dreamSynth.triggerAttackRelease(note, "4n", now + i * 0.3));
                            setTimeout(() => { dreamSynth.dispose(); dreamReverb.dispose(); }, 2500);
                            break;
                        case 'tone_electric_piano':
                            triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 3, modulationIndex: 10, envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.8 } }, "C4", "2n");
                            break;
                        case 'tone_flute':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.1, decay: 0.2, sustain: 0.3, release: 0.5 } }, "C5", "1s");
                            break;
                        case 'tone_guitar_harmonic':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.1, dampening: 8000, resonance: 0.95 }, "C5", "1n");
                            break;
                        case 'tone_harp':
                             triggerPolySynth(Tone.PluckSynth, { volume: settings.volume, attackNoise: 0.2, dampening: 5000, resonance: 0.9 }, ["C4", "E4", "G4", "B4", "D5"], "1n");
                            break;
                        case 'tone_kalimba':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.8, dampening: 3000, resonance: 0.8 }, "C4", "4n");
                            break;
                        case 'tone_pizzicato':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.05, dampening: 1500, resonance: 0.5 }, "C4", "8n");
                            break;
                        case 'tone_soft_marimba':
                             triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.8, sustain: 0, release: 0.1 } }, "C4", "2n");
                            break;
                        case 'tone_steel_drum':
                            triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 3.5, modulationIndex: 20, resonance: 1000 }, "C4", "2n");
                            break;
                        case 'tone_strummed_chord':
                            const strumSynth = new Tone.PolySynth(Tone.PluckSynth, { volume: settings.volume, attackNoise: 0.1, dampening: 4000 }).toDestination();
                            const chord = ["C4", "E4", "G4", "C5"];
                            chord.forEach((note, i) => strumSynth.triggerAttack(note, now + i * 0.03));
                            strumSynth.releaseAll(now + 1);
                            setTimeout(() => strumSynth.dispose(), 1500);
                            break;
                        case 'tone_synthwave':
                            triggerPolySynth(Tone.Synth, { volume: settings.volume, oscillator: {type: 'fatsawtooth'}, envelope: {attack: 0.1, decay: 0.5, sustain: 0.3, release: 1} }, ["C3", "E3", "G3"], "1s");
                            break;
                        
                        // --- Game & UI Sounds ---
                        case 'tone_arcade_hit':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.1, sustain: 0 } }, null, "8n");
                            break;
                        case 'tone_coin_collect':
                            const coinSynth = new Tone.Synth({ ...settings }).toDestination();
                            coinSynth.triggerAttackRelease("E6", "16n", now);
                            coinSynth.triggerAttackRelease("G6", "16n", now + 0.1);
                            setTimeout(() => coinSynth.dispose(), 500);
                            break;
                        case 'tone_laser':
                            const laserSynth = new Tone.Synth(settings).toDestination();
                            laserSynth.frequency.rampTo("C4", 0.1, now);
                            laserSynth.triggerAttackRelease("A5", "8n", now);
                            setTimeout(() => laserSynth.dispose(), 500);
                            break;
                        case 'tone_powerup':
                            const powerupSynth = new Tone.Synth(settings).toDestination();
                            const p_notes = ["C5", "E5", "G5", "C6"];
                            p_notes.forEach((note, i) => powerupSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                            setTimeout(() => powerupSynth.dispose(), 800);
                            break;
                        case 'tone_game_over':
                            const goSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sawtooth' } }).toDestination();
                            const go_notes = [{n: "C4", t: 0}, {n: "G3", t: 0.2}, {n: "E3", t: 0.4}, {n: "C3", t: 0.6}];
                            go_notes.forEach(note => goSynth.triggerAttackRelease(note.n, "8n", now + note.t));
                            setTimeout(() => goSynth.dispose(), 1200);
                            break;
                        case 'tone_high_score':
                            const hsSynth = new Tone.Synth(settings).toDestination();
                            const hs_notes = ["A4", "C5", "E5", "A5", "E5"];
                            hs_notes.forEach((note, i) => hsSynth.triggerAttackRelease(note, "16n", now + i * 0.1));
                            setTimeout(() => hsSynth.dispose(), 1000);
                            break;
                        case 'tone_notification_pop':
                            triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 4 }, "G5", "32n");
                            break;
                        case 'tone_retro_game':
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'square' } }, "A4", "16n");
                            break;
                        case 'tone_stutter':
                            const stutterSynth = new Tone.Synth(settings).toDestination();
                            for (let i = 0; i < 4; i++) {
                                stutterSynth.triggerAttackRelease("C5", "32n", now + i * 0.05);
                            }
                            setTimeout(() => stutterSynth.dispose(), 500);
                            break;
                            
                        // --- Percussive & Effects ---
                        case 'tone_metal_bell':
                            triggerSynth(Tone.MetalSynth, { ...settings, envelope: { decay: 1.2 } }, "C5", "1s");
                            break;
                        case 'tone_noise_alarm':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: "pink" }, envelope: { attack: 0.1, decay: 0.5, sustain: 0.1, release: 0.8 } }, null, "1s");
                            break;
                        case 'tone_wobble':
                            const wobbleSynth = new Tone.Synth({ ...settings, oscillator: { type: "fmsquare", modulationType: "sawtooth", modulationIndex: 2 } }).toDestination();
                            wobbleSynth.triggerAttackRelease("C3", "4n", now);
                            setTimeout(() => wobbleSynth.dispose(), 1000);
                            break;
                        case 'tone_bird':
                            const birdSynth = new Tone.Synth({ ...settings, oscillator: { type: 'sine' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 } }).toDestination();
                            birdSynth.frequency.setValueAtTime("G5", now);
                            birdSynth.frequency.linearRampToValueAtTime("A5", now + 0.1);
                            birdSynth.frequency.linearRampToValueAtTime("G5", now + 0.2);
                            birdSynth.triggerAttack(now).triggerRelease(now + 0.2);
                            setTimeout(() => birdSynth.dispose(), 500);
                            break;
                        case 'tone_bubble_pop':
                            triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 4 }, "C4", "32n");
                            break;
                        case 'tone_bubbles':
                            const bubbleSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.02, octaves: 5 }).toDestination();
                            for (let i = 0; i < 5; i++) {
                                bubbleSynth.triggerAttackRelease(`C${4+i}`, "16n", now + i * 0.1);
                            }
                            setTimeout(() => bubbleSynth.dispose(), 1000);
                            break;
                        case 'tone_explosion':
                            const exSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 1, sustain: 0, release: 0.5 } }).toDestination();
                            const exFilter = new Tone.Filter(1000, "lowpass").toDestination();
                            exSynth.connect(exFilter);
                            exFilter.frequency.rampTo(100, 1, now);
                            exSynth.triggerAttackRelease("1s", now);
                            setTimeout(() => { exSynth.dispose(); exFilter.dispose(); }, 1500);
                            break;
                        case 'tone_gong':
                            triggerSynth(Tone.MetalSynth, { ...settings, frequency: 150, harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5, envelope: { attack: 0.01, decay: 2.5, release: 1 } }, "C2", "2s");
                            break;
                        case 'tone_water_drop':
                            triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.05, octaves: 10, oscillator: { type: 'sine' }, envelope: { attack: 0.001, decay: 0.14, sustain: 0.01, release: 0.2 } }, "C7", "8n");
                            break;
                        case 'tone_bass_drop':
                            const bdSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.8, octaves: 4, envelope: { attack: 0.1, decay: 1, sustain: 0.5, release: 1 } }).toDestination();
                            bdSynth.triggerAttackRelease("C1", "1n", now);
                            setTimeout(() => bdSynth.dispose(), 2000);
                            break;
                        case 'tone_crickets':
                            const cricketSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.05, sustain: 0 } }).toDestination();
                            const cricketFilter = new Tone.Filter(8000, "bandpass").toDestination();
                            cricketSynth.connect(cricketFilter);
                            for (let i = 0; i < 5; i++) {
                                cricketSynth.triggerAttack(now + i * 0.2);
                            }
                            setTimeout(() => { cricketSynth.dispose(); cricketFilter.dispose(); }, 1500);
                            break;
                        case 'tone_disintegrate':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink', fadeOut: 0.5 }, envelope: { attack: 0.01, decay: 0.5, sustain: 0 } }, null, "0.5s");
                            break;
                        case 'tone_engine_start':
                            const engineSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                            const engineFilter = new Tone.Filter(100, "lowpass").toDestination();
                            engineSynth.connect(engineFilter);
                            engineFilter.frequency.rampTo(1000, 1, now);
                            engineSynth.triggerAttackRelease("1s", now);
                            setTimeout(() => { engineSynth.dispose(); engineFilter.dispose(); }, 1500);
                            break;
                        case 'tone_glass_tap':
                            triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 12, resonance: 1200, octaves: 1, envelope: { attack: 0.001, decay: 0.1, release: 0.1 } }, "C6", "16n");
                            break;
                        case 'tone_glitch':
                            const glitchSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                            for (let i = 0; i < 5; i++) {
                                glitchSynth.triggerAttackRelease(Math.random() * 1000 + 500, "32n", now + Math.random() * 0.2);
                            }
                            setTimeout(() => glitchSynth.dispose(), 500);
                            break;
                        case 'tone_heartbeat':
                            const hbSynth = new Tone.MembraneSynth({ ...settings, pitchDecay: 0.2, octaves: 2 }).toDestination();
                            hbSynth.triggerAttackRelease("C2", "8n", now);
                            hbSynth.triggerAttackRelease("C2", "8n", now + 0.3);
                            setTimeout(() => hbSynth.dispose(), 800);
                            break;
                        case 'tone_hyperspace':
                            const hsNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                            const hsFilter = new Tone.Filter(200, "highpass").toDestination();
                            hsNoise.connect(hsFilter);
                            hsFilter.frequency.rampTo(5000, 0.5, now);
                            hsNoise.triggerAttackRelease("0.5s", now);
                            setTimeout(() => { hsNoise.dispose(); hsFilter.dispose(); }, 1000);
                            break;
                        case 'tone_keyboard':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0 } }, null, "32n");
                            break;
                        case 'tone_kitchen':
                            triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 15, resonance: 1000, octaves: 1 }, ["C5", "G5", "A5"], "16n");
                            break;
                        case 'tone_mechanical':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.1 } }, null, "8n");
                            break;
                        case 'tone_morse':
                            const morseSynth = new Tone.Synth(settings).toDestination();
                            morseSynth.triggerAttackRelease("C5", "32n", now); // S
                            morseSynth.triggerAttackRelease("C5", "32n", now + 0.1);
                            morseSynth.triggerAttackRelease("C5", "32n", now + 0.2);
                            morseSynth.triggerAttackRelease("C5", "16n", now + 0.4); // O
                            morseSynth.triggerAttackRelease("C5", "16n", now + 0.6);
                            morseSynth.triggerAttackRelease("C5", "16n", now + 0.8);
                            morseSynth.triggerAttackRelease("C5", "32n", now + 1.1); // S
                            morseSynth.triggerAttackRelease("C5", "32n", now + 1.2);
                            morseSynth.triggerAttackRelease("C5", "32n", now + 1.3);
                            setTimeout(() => morseSynth.dispose(), 1800);
                            break;
                        case 'tone_ocean':
                            const oceanNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                            const oceanFilter = new Tone.AutoFilter("4n").toDestination().start();
                            oceanNoise.connect(oceanFilter);
                            oceanNoise.triggerAttack(now);
                            setTimeout(() => { oceanNoise.dispose(); oceanFilter.dispose(); }, 2000);
                            break;
                        case 'tone_page_turn':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' }, envelope: { attack: 0.01, decay: 0.2, sustain: 0 } }, null, "8n");
                            break;
                        case 'tone_power_down':
                            const pdSynth = new Tone.Synth(settings).toDestination();
                            pdSynth.frequency.rampTo("C2", 0.5, now);
                            pdSynth.triggerAttackRelease("C4", "0.5s", now);
                            setTimeout(() => pdSynth.dispose(), 1000);
                            break;
                        case 'tone_purr':
                            const purrNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'brown' } }).toDestination();
                            const purrLFO = new Tone.LFO("20hz", -15, 0).start();
                            purrLFO.connect(purrNoise.volume);
                            purrNoise.triggerAttack(now);
                            setTimeout(() => { purrNoise.dispose(); purrLFO.dispose(); }, 1500);
                            break;
                        case 'tone_rain_on_window':
                        case 'tone_rainfall':
                             triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink' }, envelope: { attack: 0.5, decay: 1, sustain: 1, release: 1 } }, null, "2s");
                            break;
                        case 'tone_riser':
                            const riserNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                            const riserFilter = new Tone.Filter(200, "lowpass").toDestination();
                            riserNoise.connect(riserFilter);
                            riserFilter.frequency.rampTo(5000, 1, now);
                            riserNoise.triggerAttackRelease("1s", now);
                            setTimeout(() => { riserNoise.dispose(); riserFilter.dispose(); }, 1500);
                            break;
                        case 'tone_scanner':
                            const scanSynth = new Tone.Synth(settings).toDestination();
                            const scanLFO = new Tone.LFO("2hz", 400, 1000).start();
                            scanLFO.connect(scanSynth.frequency);
                            scanSynth.triggerAttack(now);
                            setTimeout(() => { scanSynth.dispose(); scanLFO.dispose(); }, 1000);
                            break;
                        case 'tone_singing_bowl':
                        case 'tone_tibetan_bowl':
                             triggerSynth(Tone.MetalSynth, { ...settings, harmonicity: 1.2, resonance: 1200, octaves: 1.5, envelope: { attack: 0.1, decay: 3, release: 0.5 } }, "C3", "3s");
                            break;
                        case 'tone_static':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'white' } }, null, "1s");
                            break;
                        case 'tone_steam_train':
                            const steamSynth = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' }, envelope: { attack: 0.05, decay: 0.2, sustain: 0 } }).toDestination();
                            for (let i = 0; i < 4; i++) {
                                steamSynth.triggerAttack(now + i * 0.3);
                            }
                            setTimeout(() => steamSynth.dispose(), 1500);
                            break;
                        case 'tone_teleporter':
                            const teleSynth = new Tone.FMSynth({ ...settings, modulationIndex: 20 }).toDestination();
                            teleSynth.frequency.rampTo(2000, 0.3, now);
                            teleSynth.triggerAttackRelease("0.3s", now);
                            setTimeout(() => teleSynth.dispose(), 800);
                            break;
                        case 'tone_thunder':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'brown' }, envelope: { attack: 0.1, decay: 2, sustain: 0 } }, null, "2s");
                            break;
                        case 'tone_typewriter':
                            const twSynth = new Tone.PluckSynth({ ...settings, attackNoise: 0.5, dampening: 1000 }).toDestination();
                            twSynth.triggerAttackRelease("C5", "32n", now);
                            setTimeout(() => twSynth.dispose(), 300);
                            break;
                        case 'tone_vibrating_bell':
                            triggerSynth(Tone.MetalSynth, { ...settings, vibratoAmount: 0.5, vibratoRate: 5, envelope: { decay: 2 } }, "C4", "2s");
                            break;
                        case 'tone_vinyl_crackles':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'pink' }, envelope: { attack: 0.2, decay: 1, sustain: 1 } }, null, "2s");
                            break;
                        case 'tone_wind_chimes':
                            triggerPolySynth(Tone.MetalSynth, { volume: settings.volume, harmonicity: 5, resonance: 1000, octaves: 2 }, ["C5", "E5", "G5", "A5", "C6"], "2n");
                            break;
                        case 'tone_wood':
                            triggerSynth(Tone.MembraneSynth, { ...settings, pitchDecay: 0.01, octaves: 1 }, "C3", "16n");
                            break;
                        case 'tone_xylophone':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 1, dampening: 7000, resonance: 0.98 }, "C5", "4n");
                            break;
                        case 'tone_zen_garden':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.1, dampening: 3000, resonance: 0.9, release: 2 }, "C5", "1n");
                            break;
                        
                        // --- Sci-Fi & Ambient ---
                        case 'tone_alien_signal':
                            triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 1.5, modulationIndex: 10, modulation: { type: 'sine' } }, "A4", "1s");
                            break;
                        case 'tone_choir_aah':
                            triggerPolySynth(Tone.AMSynth, { volume: settings.volume, harmonicity: 1.5, envelope: { attack: 0.5, decay: 1, sustain: 0.5, release: 1 } }, ["C4", "E4", "G4"], "2s");
                            break;
                        case 'tone_cosmic_ping':
                            const pingSynth = new Tone.Synth(settings).toDestination();
                            const pingReverb = new Tone.Reverb(2).toDestination();
                            pingSynth.connect(pingReverb);
                            pingSynth.triggerAttackRelease("G5", "16n", now);
                            setTimeout(() => { pingSynth.dispose(); pingReverb.dispose(); }, 2500);
                            break;
                        case 'tone_cosmic_rumble':
                            triggerSynth(Tone.NoiseSynth, { ...settings, noise: { type: 'brown' }, envelope: { attack: 1, decay: 2, sustain: 1 } }, null, "3s");
                            break;
                        case 'tone_crystal':
                            triggerSynth(Tone.PluckSynth, { ...settings, attackNoise: 0.2, dampening: 6000, resonance: 0.98, release: 2 }, "C6", "1n");
                            break;
                        case 'tone_cybernetic':
                            triggerSynth(Tone.FMSynth, { ...settings, harmonicity: 2, modulationIndex: 15, envelope: { attack: 0.1, decay: 0.5 } }, "G3", "1s");
                            break;
                        case 'tone_data_stream':
                            const dsSynth = new Tone.Synth({ ...settings, oscillator: { type: 'square' } }).toDestination();
                            for (let i = 0; i < 8; i++) {
                                dsSynth.triggerAttackRelease(Math.random() * 500 + 800, "32n", now + i * 0.05);
                            }
                            setTimeout(() => dsSynth.dispose(), 800);
                            break;
                        case 'tone_deep_drone':
                            triggerSynth(Tone.Oscillator, { ...settings, frequency: "C2", type: 'sawtooth' }, "C2", "3s");
                            break;
                        case 'tone_dial_up':
                            const dialSynth = new Tone.Synth(settings).toDestination();
                            const dialNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'white' } }).toDestination();
                            dialSynth.triggerAttackRelease("F5", "0.2s", now);
                            dialSynth.triggerAttackRelease("A5", "0.2s", now + 0.3);
                            dialNoise.triggerAttackRelease("0.5s", now + 0.6);
                            setTimeout(() => { dialSynth.dispose(); dialNoise.dispose(); }, 1500);
                            break;
                        case 'tone_digital_sweep':
                            const sweepSynth = new Tone.Synth(settings).toDestination();
                            sweepSynth.frequency.rampTo(2000, 0.5, now);
                            sweepSynth.triggerAttackRelease("C4", "0.5s", now);
                            setTimeout(() => sweepSynth.dispose(), 1000);
                            break;
                        case 'tone_drone_pulse':
                            const dpSynth = new Tone.AMSynth(settings).toDestination();
                            const dpLFO = new Tone.LFO("2hz", -10, 0).start();
                            dpLFO.connect(dpSynth.volume);
                            dpSynth.triggerAttackRelease("A2", "2s", now);
                            setTimeout(() => { dpSynth.dispose(); dpLFO.dispose(); }, 2500);
                            break;
                        case 'tone_energy_charge':
                            const ecSynth = new Tone.Synth(settings).toDestination();
                            ecSynth.frequency.rampTo("C6", 1, now);
                            ecSynth.triggerAttack("C4", now);
                            ecSynth.triggerRelease(now + 1);
                            setTimeout(() => ecSynth.dispose(), 1500);
                            break;
                        case 'tone_fairy_twinkle':
                            triggerPolySynth(Tone.PluckSynth, { volume: settings.volume, resonance: 0.9 }, ["C6", "E6", "G6", "B6"], "8n");
                            break;
                        case 'tone_forcefield':
                            const ffSynth = new Tone.AMSynth({ ...settings, harmonicity: 5 }).toDestination();
                            const ffLFO = new Tone.LFO("8hz", -20, 0).start();
                            ffLFO.connect(ffSynth.volume);
                            ffSynth.triggerAttackRelease("C4", "2s", now);
                            setTimeout(() => { ffSynth.dispose(); ffLFO.dispose(); }, 2500);
                            break;
                        case 'tone_hologram':
                            const holoSynth = new Tone.FMSynth({ ...settings, harmonicity: 1.5 }).toDestination();
                            const holoFilter = new Tone.AutoFilter("1n").toDestination().start();
                            holoSynth.connect(holoFilter);
                            holoSynth.triggerAttackRelease("C4", "2s", now);
                            setTimeout(() => { holoSynth.dispose(); holoFilter.dispose(); }, 2500);
                            break;
                        case 'tone_modem':
                             const modemSynth = new Tone.FMSynth({ ...settings, harmonicity: 5, modulationIndex: 10 }).toDestination();
                             modemSynth.triggerAttackRelease("A4", "0.5s", now);
                             setTimeout(() => modemSynth.dispose(), 1000);
                            break;
                        case 'tone_ominous_drone':
                            triggerSynth(Tone.AMSynth, { ...settings, harmonicity: 0.5 }, "C2", "3s");
                            break;
                        case 'tone_phase_shift':
                            const psSynth = new Tone.Synth(settings).toDestination();
                            const phaser = new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }).toDestination();
                            psSynth.connect(phaser);
                            psSynth.triggerAttackRelease("C4", "2s", now);
                            setTimeout(() => { psSynth.dispose(); phaser.dispose(); }, 2500);
                            break;
                        case 'tone_portal':
                            const portalNoise = new Tone.NoiseSynth({ ...settings, noise: { type: 'pink' } }).toDestination();
                            const portalFilter = new Tone.AutoFilter("0.5s").toDestination().start();
                            portalNoise.connect(portalFilter);
                            portalNoise.triggerAttackRelease("2s", now);
                            setTimeout(() => { portalNoise.dispose(); portalFilter.dispose(); }, 2500);
                            break;
                        case 'tone_sci_fi_pad':
                            triggerPolySynth(Tone.FMSynth, { volume: settings.volume, harmonicity: 0.5, modulationIndex: 2, envelope: { attack: 1, release: 1 } }, ["C3", "G3", "Bb3"], "3s");
                            break;
                        case 'tone_sonar':
                            const sonarSynth = new Tone.Synth(settings).toDestination();
                            const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toDestination();
                            sonarSynth.connect(feedbackDelay);
                            sonarSynth.triggerAttackRelease("C5", "16n", now);
                            setTimeout(() => { sonarSynth.dispose(); feedbackDelay.dispose(); }, 1500);
                            break;
                        case 'tone_starship_hum':
                            triggerSynth(Tone.AMSynth, { ...settings, harmonicity: 0.8 }, "A1", "3s");
                            break;

                        default:
                            console.warn(`Sound not found: ${soundId}. Playing default.`);
                            triggerSynth(Tone.Synth, { ...settings, oscillator: { type: 'triangle' } }, "C5", "8n");
                            break;
                    }
                } else {
                    // Fallback for any non-tone sounds (legacy or future additions)
                    const audio = new Audio(soundId);
                    audio.volume = volume;
                    audio.play().catch(error => console.warn(`Could not play sound: ${soundId}. Error: ${error.message}`));
                }
            } catch (e) {
                console.warn("Error playing sound:", e);
            }
        }


        function unlockAudio() {
            if (isAudioUnlocked) return;
            // Attempt to start Tone.js audio context
            Tone.start().then(() => {
                isAudioUnlocked = true;
                console.log("Tone.js audio context started.");
            }).catch(e => console.warn("Tone.js audio context failed to start:", e));

            // Also play a silent audio for broader browser compatibility
            const silentAudio = new Audio('data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=');
            silentAudio.play().then(() => {
                // This part might not be strictly necessary if Tone.start() is successful,
                // but it's a robust fallback for general audio unlock.
            }).catch(e => console.warn("Silent audio unlock failed.", e));
        }

        function showToast(message, type = 'info', duration = 3000) {
            const container = document.getElementById('toast-container');
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.textContent = message;
            container.appendChild(toast);

            setTimeout(() => {
                toast.classList.add('show');
            }, 10);

            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(toast)) {
                       container.removeChild(toast);
                    }
                }, 300);
            }, duration);
        }

        function showConfirmationModal(title, message, onConfirm) {
            const modal = document.getElementById('confirmation-modal');
            modal.querySelector('#confirmation-modal-title').textContent = title;
            modal.querySelector('#confirmation-modal-message').textContent = message;
            modal.classList.add('active');

            const confirmBtn = modal.querySelector('#confirm-btn');
            const cancelBtn = modal.querySelector('#cancel-btn');
            const closeModalBtns = modal.querySelectorAll('.close-modal');

            const cleanup = () => {
                modal.classList.remove('active');
                confirmBtn.replaceWith(confirmBtn.cloneNode(true));
                cancelBtn.replaceWith(cancelBtn.cloneNode(true));
            };

            confirmBtn.onclick = () => {
                onConfirm();
                cleanup();
            };
            cancelBtn.onclick = cleanup;
            closeModalBtns.forEach(btn => btn.onclick = cleanup);
        }

        async function showUserProfileModal(userId) {
            if (!userId) return;
            
            const modal = document.getElementById('user-profile-modal');
            const loadingEl = document.getElementById('user-profile-loading');
            const detailsEl = document.getElementById('user-profile-details');
            
            modal.classList.add('active');
            loadingEl.classList.remove('hidden');
            detailsEl.classList.add('hidden');

            try {
                // Fetch public and private data in parallel
                const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', userId);
                const privateUserRef = doc(db, 'artifacts', appId, 'users', userId);
                
                const [publicUserSnap, privateUserSnap] = await Promise.all([
                    getDoc(publicUserRef),
                    getDoc(privateUserRef)
                ]);

                if (!publicUserSnap.exists() || !privateUserSnap.exists()) {
                    throw new Error("User data not found.");
                }

                const publicData = publicUserSnap.data();
                const privateData = privateUserSnap.data();

                // Fetch last session for last active time
                const sessionsRef = collection(privateUserRef, 'sessions');
                const q = query(sessionsRef, orderBy('endedAt', 'desc'), limit(1));
                const lastSessionSnapshot = await getDocs(q);
                
                let lastActiveText = "No sessions yet";
                if (!lastSessionSnapshot.empty) {
                    const lastSessionData = lastSessionSnapshot.docs[0].data();
                    const endedAt = lastSessionData.endedAt?.toDate();
                    if (endedAt) {
                         lastActiveText = timeSince(endedAt) + ' ago';
                    }
                }
                
                // Calculate total time today
                const todayStr = getCurrentDate().toISOString().split('T')[0];
                let totalTodaySeconds = 0;
                if (privateData.totalTimeToday && privateData.totalTimeToday.date === todayStr) {
                    totalTodaySeconds = privateData.totalTimeToday.seconds || 0;
                }

                // Update UI
                const avatarEl = document.getElementById('user-profile-avatar');
                if (publicData.photoURL) {
                    avatarEl.innerHTML = `<img src="${publicData.photoURL}" alt="${publicData.username}" class="w-full h-full object-cover">`;
                } else {
                    const initial = publicData.username ? publicData.username.charAt(0).toUpperCase() : 'U';
                    avatarEl.innerHTML = `<span>${initial}</span>`;
                }
                
                document.getElementById('user-profile-name').textContent = publicData.username || 'Anonymous';
                document.getElementById('user-profile-total-today').textContent = formatTime(totalTodaySeconds);
                document.getElementById('user-profile-total-overall').textContent = formatTime(publicData.totalStudySeconds || 0, false);
                document.getElementById('user-profile-last-active').textContent = lastActiveText;

                loadingEl.classList.add('hidden');
                detailsEl.classList.remove('hidden');

            } catch (error) {
                console.error("Error fetching user profile:", error);
                modal.classList.remove('active');
                showToast('Could not load user profile.', 'error');
            }
        }

        // --- Firebase Initialization ---
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

                console.log("Initializing Firebase with config:", firebaseConfig); // Add this line for debugging

                const app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = getFirestore(app);

                messaging = getMessaging(app); // Initialize Firebase Messaging service
        functions = getFunctions(app); // Initialize Firebase Functions service

        // --- PASTE THE onMessage LISTENER HERE ---
        onMessage(messaging, (payload) => {
            console.log('Foreground Push Message received:', payload);
            // If a foreground message signals a timer end, handle it.
            // This is useful if the server sends a message that also impacts the UI immediately.
            if (payload.data && payload.data.type === 'TIMER_ENDED') {
                handlePomodoroPhaseEnd(payload.data);
                showToast(payload.notification?.body || 'Timer ended!', 'info');
            }
            // You can handle other types of foreground messages here
        });

        // --- MOVE THESE TWO LINES HERE ---
        
        sendPomodoroNotification = httpsCallable(functions, 'sendPomodoroNotification'); // Assign callable function
        sendWakeUpNotification = httpsCallable(functions, 'sendWakeUpNotification');
        sendGroupWakeUpNotification = httpsCallable(functions, 'sendGroupWakeUpNotification');
        getPremiumData = httpsCallable(functions, 'getPremiumData'); // <-- ADD THIS LINE
        // ---------------------------------

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

        // --- Page Navigation ---
        function showPage(pageId) {
            if (!pageId) return;
            
            if (pageId === 'page-planner') {
                plannerState.calendarYear = new Date().getFullYear();
                plannerState.calendarMonth = new Date().getMonth();
            }

            if (pageId !== 'page-group-detail') {
                groupDetailUnsubscribers.forEach(unsub => unsub());
                groupDetailUnsubscribers = [];
                memberTimerIntervals.forEach(clearInterval);
                memberTimerIntervals = [];
                groupRealtimeData = { members: {}, sessions: {} };
            }

            document.getElementById('auth-screen').classList.remove('active');
            document.getElementById('app-container').classList.remove('active', 'flex');
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            
            if (pageId.startsWith('page-')) {
                 document.getElementById('app-container').classList.add('active', 'flex');
                 const targetPage = document.getElementById(pageId);
                 if(targetPage) targetPage.classList.add('active');
            } else {
                 const targetScreen = document.getElementById(pageId);
                 if(targetScreen) targetScreen.classList.add('active');
            }
            
            const mainNav = document.getElementById('main-nav');
            const groupNav = document.getElementById('group-detail-nav');
            const mainNavPages = ['page-timer', 'page-stats', 'page-ranking', 'page-planner'];

            mainNav.style.display = 'none';
            if (groupNav) groupNav.style.display = 'none';

            if (mainNavPages.includes(pageId)) {
                mainNav.style.display = 'grid';
            } else if (pageId === 'page-group-detail') {
                if (groupNav) groupNav.style.display = 'grid';
            }
            
            if (pageId === 'page-stats') {
                renderStatsPage(userSessions);
            }
        }

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            const pageName = this.dataset.page;
            
            // --- PREMIUM FEATURE CHECK ---
            const premiumFeatures = ['stats', 'planner'];
            if (premiumFeatures.includes(pageName) && (!currentUserData || !currentUserData.premium)) {
                document.getElementById('premium-modal').classList.add('active');
                // De-select the premium nav item if user isn't premium
                const previouslyActive = document.querySelector(`.nav-item[data-page="${lastActivePage}"]`) || document.querySelector('.nav-item[data-page="timer"]');
                if(previouslyActive) previouslyActive.classList.add('active');
            } else {
                this.classList.add('active');
                lastActivePage = pageName;
                showPage(`page-${pageName}`);
            }
        }));

        document.querySelectorAll('.back-button').forEach(button => button.addEventListener('click', function() {
            const targetPage = this.getAttribute('data-target');
            showPage(`page-${targetPage}`);
            const navItem = document.querySelector(`.nav-item[data-page="${targetPage}"]`);
            if (navItem) {
                 document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                 navItem.classList.add('active');
            }
        }));

        ael('groups-btn', 'click', () => { renderJoinedGroups(); showPage('page-my-groups'); });
        ael('go-to-find-groups-btn', 'click', () => { renderGroupRankings(); showPage('page-find-groups'); });
        ael('go-to-create-group-btn', 'click', () => { showPage('page-create-group'); });
        ael('profile-btn', 'click', () => { showPage('page-profile'); });
        
        // --- FIXES START HERE ---

        // Timer Controls
        ael('start-studying-btn', 'click', () => {
            document.getElementById('start-session-modal').classList.add('active');
        });
        
        ael('stop-studying-btn', 'click', () => {
             showConfirmationModal(
                'Stop Studying?',
                'Are you sure you want to end this study session?',
                () => stopTimer()
            );
        });

        ael('pause-btn', 'click', pauseTimer);
        ael('resume-btn', 'click', resumeTimer);
        
        ael('start-session-form', 'submit', (e) => {
            e.preventDefault();
            const selectedSubjectEl = document.querySelector('#subject-selection-list .subject-item.selected');
            if (selectedSubjectEl) {
                const subjectName = selectedSubjectEl.dataset.subjectName;
                startTimer(subjectName);
                document.getElementById('start-session-modal').classList.remove('active');
            } else {
                showToast("Please select a subject to start studying.", "error");
            }
        });

        ael('subject-selection-list', 'click', (e) => {
            const subjectItem = e.target.closest('.subject-item');
            if (subjectItem && !e.target.closest('button')) {
                document.querySelectorAll('#subject-selection-list .subject-item.selected').forEach(el => el.classList.remove('selected'));
                subjectItem.classList.add('selected');
            }
        });

        // Timer Mode Switch
        function switchTimerMode(mode) {
            if (timerMode === mode || pomodoroState !== 'idle') {
                if (pomodoroState !== 'idle') {
                    showToast('Cannot switch modes during an active session.', 'error');
                }
                return;
            }


        async function renderLeaderboard(period = 'weekly', containerId = 'ranking-list') {
            const container = document.getElementById(containerId);
            if (!container) return;
            
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
        
            // --- PREMIUM FEATURE CHECK FOR MONTHLY RANKING ---
            if (period === 'monthly' && (!currentUserData || !currentUserData.premium)) {
                container.innerHTML = `
                    <div class="empty-group text-center p-8">
                        <i class="fas fa-gem text-4xl text-cyan-400 mb-4"></i>
                        <h3 class="text-xl font-bold">Unlock 30-Day Rankings</h3>
                        <p class="text-gray-400 mt-2">See how you stack up against others over the entire month. Upgrade to Premium to access this feature!</p>
                        <button id="ranking-upgrade-btn" class="mt-4 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-6 rounded-lg transition">
                            Go Premium
                        </button>
                    </div>`;
                return; // Stop execution for non-premium users
            }
        
            let userScores = [];
        
            // --- SECURE DATA FETCHING FOR PREMIUM ---
            if (period === 'monthly') {
                try {
                    const result = await getPremiumData({ 
                        userId: currentUser.uid, 
                        appId: appId, 
                        feature: 'ranking_30_day' 
                    });
                    if (result.data.success) {
                        // The backend already calculates totalStudySeconds for the period
                        userScores = result.data.data; 
                    } else {
                        throw new Error("Failed to fetch premium ranking data.");
                    }
                } catch (error) {
                    console.error("Error fetching premium leaderboard:", error);
                    showToast("Could not load 30-day leaderboard.", "error");
                    container.innerHTML = `<div class="empty-group"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>Could not load the leaderboard.</p></div>`;
                    return;
                }
            } else { // Free tiers (daily, weekly)
                const usersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
                const usersSnapshot = await getDocs(usersCollectionRef);
        
                const userPromises = usersSnapshot.docs.map(async (userDoc) => {
                    const userData = userDoc.data();
                    const userRef = doc(db, 'artifacts', appId, 'users', userDoc.id);
                    const sessionsRef = collection(userRef, 'sessions');
        
                    const now = getCurrentDate();
                    let startDate;
                    switch (period) {
                        case 'daily':
                            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                            break;
                        case 'weekly':
                        default:
                            startDate = new Date(now);
                            startDate.setDate(now.getDate() - 7);
                            break;
                    }
                    startDate.setHours(0,0,0,0);
        
                    const q = query(sessionsRef, where("endedAt", ">=", startDate));
                    const sessionsSnapshot = await getDocs(q);
                    
                    let totalSeconds = 0;
                    sessionsSnapshot.forEach(sessionDoc => {
                        if (sessionDoc.data().type === 'study') {
                            totalSeconds += sessionDoc.data().durationSeconds;
                        }
                    });
                    
                    return {
                        id: userDoc.id,
                        username: userData.username || 'Anonymous',
                        photoURL: userData.photoURL,
                        totalStudySeconds: totalSeconds
                    };
                });
        
                userScores = await Promise.all(userPromises);
                userScores.sort((a, b) => b.totalStudySeconds - a.totalStudySeconds);
            }
        
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
        }

        function renderStatsPage(focusSessions) {
            const insightsContainer = document.getElementById('insights-container');
                        renderPlannerPage();
                    }
                    return;
                }

                // Task details panel buttons
                const detailsPanel = target.closest('#planner-task-details');
                if(detailsPanel) {
                    const taskId = plannerState.selectedTaskId;
                    if (!taskId) {return};
                    
                    // Priority menu toggle
                    if (target.closest('#task-detail-priority-btn')) {
                        const menu = detailsPanel.querySelector('#task-priority-menu');
                        if (menu) menu.classList.toggle('hidden');
                        return; 
                    }

                    // Priority menu item selection
                    if (target.closest('#task-priority-menu a')) {
                        e.preventDefault();
                        const newPriority = target.closest('a').dataset.priority;
                        updatePlannerTask(taskId, { priority: newPriority });
                        detailsPanel.querySelector('#task-priority-menu').classList.add('hidden');
                        return;
                    }

                    // Start Timer Buttons (Normal or Pomodoro)
                    if (target.closest('#task-detail-start-btn') || target.closest('#task-detail-pomodoro-btn')) {
                        const task = plannerState.tasks.find(t => t.id === taskId);
                        if (task) {
                            const subjectName = task.title;
                            showPage('page-timer');
                            const navItem = document.querySelector(`.nav-item[data-page="timer"]`);
                            if (navItem) {
                                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                                navItem.classList.add('active');
                            }

                            const pomodoroBtnClicked = target.closest('#task-detail-pomodoro-btn');
                            if (pomodoroBtnClicked) {
                                switchTimerMode('pomodoro');
                            } else {
                                switchTimerMode('normal');
                            }
                            startTimer(subjectName);
                        }
                        return;
                    }

                    // Project button click
                    if (target.closest('#task-detail-project-btn')) {
                        const modal = document.getElementById('project-select-modal');
                        const listContainer = document.getElementById('project-select-list');
                        const selectedTask = plannerState.tasks.find(t => t.id === taskId);
                        
                        listContainer.innerHTML = `
                            <div class="planner-sidebar-item cursor-pointer ${selectedTask.listId === 'inbox' ? 'active' : ''}" data-list-id="inbox">
                                <i class="fas fa-inbox w-5 mr-3"></i>
                                <span>Inbox</span>
                            </div>
                            ${plannerState.lists.map(list => `
                                <div class="planner-sidebar-item cursor-pointer ${selectedTask.listId === list.id ? 'active' : ''}" data-list-id="${list.id}">
                                    <i class="fas fa-folder w-5 mr-3"></i>
                                    <span>${list.name}</span>
                                </div>
                            `).join('')}
                        `;
                        modal.classList.add('active');
                        return;
                    }

                    // Repeat button click
                    if (target.closest('#task-detail-repeat-btn')) {
                        const modal = document.getElementById('repeat-settings-modal');
                        const select = document.getElementById('repeat-type-select');
                        const selectedTask = plannerState.tasks.find(t => t.id === taskId);
                        
                        select.value = selectedTask.repeat?.type || 'none';
                        
                        modal.classList.add('active');
                        return;
                    }

                    if (target.closest('#close-task-details')) {
                        plannerState.selectedTaskId = null;
                        renderPlannerTaskDetails(); 
                    }
                    else if (target.closest('#delete-task-btn')) {
                        showConfirmationModal('Delete Task?', 'This task will be permanently deleted.', () => deletePlannerTask(taskId));
                    }
                }

                 // Hide priority menu if clicking outside
                const priorityMenu = document.getElementById('task-priority-menu');
                if (priorityMenu && !priorityMenu.classList.contains('hidden') && !target.closest('#task-detail-priority-btn')) {
                    priorityMenu.classList.add('hidden');
                }
            });

            // Handler for form inputs that change value
            plannerPage.addEventListener('change', e => {
                const target = e.target;

                // Task checkbox in list view
                if (target.classList.contains('task-checkbox-planner')) {
                    const taskId = target.closest('.task-item, #planner-task-details').dataset.taskId || plannerState.selectedTaskId;
                    if (taskId) {
                        const isCompleted = target.checked;
                        updatePlannerTask(taskId, {
                            completed: isCompleted,
                            completedAt: isCompleted ? serverTimestamp() : null
                        });
                    }
                }
                
                // Due date change in details panel
                if (target.matches('#task-detail-due-date')) {
                    const taskId = plannerState.selectedTaskId;
                    if (taskId) {
                        const newDate = target.value ? new Date(target.value + 'T00:00:00') : null;
                        updatePlannerTask(taskId, { dueDate: newDate });
                    }
                }
            });

            // Handler for form inputs that change value
            plannerPage.addEventListener('change', e => {
                const target = e.target;

                // Task checkbox in list view
                if (target.classList.contains('task-checkbox-planner')) {
                    const taskId = target.closest('.task-item').dataset.taskId;
                    const isCompleted = target.checked;
                    updatePlannerTask(taskId, {
                        completed: isCompleted,
                        completedAt: isCompleted ? serverTimestamp() : null // Add/remove completion timestamp
                    });
                }
            });

            // Handler for form inputs that change value
            plannerPage.addEventListener('change', e => {
                const target = e.target;
                if(target.closest('#planner-task-details')) {
                    const taskId = plannerState.selectedTaskId;
                    if (!taskId) return;

                    if (target.matches('#task-detail-title, #task-detail-notes')) {
                        clearTimeout(detailUpdateDebounceTimer);
                        detailUpdateDebounceTimer = setTimeout(() => {
                            const updateData = {};
                            if (target.id === 'task-detail-title') updateData.title = target.value;
                            if (target.id === 'task-detail-notes') updateData.notes = target.value;
                            updatePlannerTask(taskId, updateData);
                        }, 750); // Debounce by 750ms
                    }
                }
            });
        }
        // --- END OF UNIFIED PLANNER LISTENERS ---

        ael('quick-add-task-form', 'submit', async (e) => {
            e.preventDefault();
            const modal = document.getElementById('quick-add-task-modal');
            const titleInput = document.getElementById('quick-add-task-title-input');
            const dateInput = document.getElementById('quick-add-task-date-input');
            
            const title = titleInput.value.trim();
            const date = dateInput.value;

            if (title && date) {
                await addPlannerTask(title, date);
                titleInput.value = '';
                modal.classList.remove('active');
            } else {
                showToast('Please enter a title for the task.', 'error');
            }
        });

        // Add Subject Modal
        ael('add-subject-btn', 'click', () => {
            isAddingSubjectFromStartSession = false; // Reset flag
            document.getElementById('add-subject-form').reset();
            document.getElementById('add-subject-modal').classList.add('active');
        });

        ael('open-add-subject-modal-from-start', 'click', () => {
            isAddingSubjectFromStartSession = true; // Set flag
            document.getElementById('start-session-modal').classList.remove('active');
            document.getElementById('add-subject-form').reset();
            document.getElementById('add-subject-modal').classList.add('active');
        });

        ael('add-subject-form', 'submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const modal = document.getElementById('add-subject-modal');
            const subjectNameInput = document.getElementById('add-subject-name');
            const subjectName = subjectNameInput.value.trim();
            const colorEl = document.querySelector('#add-subject-modal .color-dot.selected');
            
            if (!subjectName || !colorEl) {
                showToast('Please provide a name and select a color.', 'error');
                return;
            }
            const color = colorEl.dataset.color;

            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const subjectsRef = collection(userRef, 'subjects');
            const q = query(subjectsRef, orderBy('order', 'desc'), limit(1));
            const lastSubjectSnap = await getDocs(q);
            const lastOrder = lastSubjectSnap.empty ? -1 : lastSubjectSnap.docs[0].data().order;

            await addDoc(subjectsRef, { name: subjectName, color: color, order: lastOrder + 1 });
            
            subjectNameInput.value = '';
            modal.classList.remove('active');
            showToast(`Subject "${subjectName}" added!`, 'success');

            if (isAddingSubjectFromStartSession) {
                setTimeout(() => {
                    document.getElementById('start-session-modal').classList.add('active');
                    // The onSnapshot listener will automatically re-render the list.
                    // This logic selects the newly added item.
                    const newSubjectEl = Array.from(document.querySelectorAll('#subject-selection-list .subject-item')).find(el => el.dataset.subjectName === subjectName);
                    if(newSubjectEl) {
                        document.querySelectorAll('#subject-selection-list .subject-item').forEach(el => el.classList.remove('selected'));
                        newSubjectEl.classList.add('selected');
                    }
                }, 300); 
            }
        });
        
        // Add Subject Modal Color Picker
        ael('add-subject-modal', 'click', (e) => {
            if (e.target.classList.contains('color-dot')) {
                document.querySelectorAll('#add-subject-modal .color-dot').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });


        // NEW: Project Selection Modal
        ael('project-select-modal', 'click', (e) => {
            const projectItem = e.target.closest('.planner-sidebar-item');
            if (projectItem) {
                const newListId = projectItem.dataset.listId;
                const taskId = plannerState.selectedTaskId;
                if (taskId && newListId) {
                    updatePlannerTask(taskId, { listId: newListId });
                    document.getElementById('project-select-modal').classList.remove('active');
                }
            }
        });

        // NEW: Repeat Settings Form
        ael('repeat-settings-form', 'submit', (e) => {
            e.preventDefault();
            const taskId = plannerState.selectedTaskId;
            const repeatType = document.getElementById('repeat-type-select').value;
            
            if (taskId) {
                const newRepeatValue = repeatType === 'none' ? null : { type: repeatType };
                updatePlannerTask(taskId, { repeat: newRepeatValue });
                document.getElementById('repeat-settings-modal').classList.remove('active');
            }
        });


        // Create Group Controls
        ael('create-group-done-btn', 'click', async () => {
            const form = document.getElementById('create-group-form');
            const nameInput = document.getElementById('group-name-input');
            const descriptionInput = document.getElementById('group-description-input');
            
            if (!nameInput.value.trim() || !descriptionInput.value.trim()) {
                showToast('Group Name and Description are required.', 'error');
                if (!nameInput.value.trim()) nameInput.focus();
                else if (!descriptionInput.value.trim()) descriptionInput.focus();
                return;
            }
        
            const name = nameInput.value.trim();
            const password = document.getElementById('group-password-input').value.trim();
            const category = form.querySelector('.category-option.selected').textContent;
            const timeGoal = parseInt(form.querySelector('.time-option.selected').textContent, 10);
            const capacity = parseInt(document.getElementById('capacity-value').textContent, 10);
            const description = descriptionInput.value.trim();
            
            const doneBtn = document.getElementById('create-group-done-btn');
            doneBtn.disabled = true;
            doneBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        
            try {
                const newGroupRef = await addDoc(collection(db, `artifacts/${appId}/public/data/groups`), {
                    name, password: password || null, category, timeGoal, capacity, description,
                    leaderId: currentUser.uid, leaderName: currentUserData.username,
                    members: [currentUser.uid], createdAt: serverTimestamp(),
                    avgTime: '0h 0m', attendance: 0
                });
        
                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                await updateDoc(userRef, { joinedGroups: arrayUnion(newGroupRef.id) });
        
                showToast('Group created successfully!', 'success');
                renderGroupRankings();
                showPage('page-find-groups');
                form.reset();
            } catch (error) {
                console.error('Error creating group:', error);
                showToast('Failed to create group.', 'error');
            } finally {
                doneBtn.disabled = false;
                doneBtn.textContent = 'Done';
            }
        });

        ael('create-group-form', 'click', (e) => {
            if (e.target.classList.contains('category-option')) {
                document.querySelectorAll('#create-group-form .category-option').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
            }
            if (e.target.classList.contains('time-option')) {
                document.querySelectorAll('#create-group-form .time-option').forEach(el => el.classList.remove('selected'));
                e.target.classList.add('selected');
            }
        });
        
        ael('increase-capacity', 'click', () => {
            const capacityEl = document.getElementById('capacity-value');
            let current = parseInt(capacityEl.textContent, 10);
            if (current < 100) capacityEl.textContent = current + 1;
        });
        
        ael('decrease-capacity', 'click', () => {
            const capacityEl = document.getElementById('capacity-value');
            let current = parseInt(capacityEl.textContent, 10);
            if (current > 2) capacityEl.textContent = current - 1;
        });

        // --- FIXES END HERE ---

        ael('page-my-groups', 'click', (e) => {
            // Handle clicking on a group card to enter the detail view
            const groupCard = e.target.closest('.group-card');
            if (groupCard) {
                const groupId = groupCard.dataset.groupId;
                if (groupId) {
                    renderGroupDetail(groupId); // Render first to have content when page shows
                    showPage('page-group-detail');
                }
            }

            // Handle the "Explore Groups" button on the empty state
            if (e.target.id === 'explore-groups-btn') {
                renderGroupRankings(); 
                showPage('page-find-groups');
            }
        });
        
        // Profile Settings Modals
        const editProfileModal = document.getElementById('edit-profile-modal');
        ael('settings-account', 'click', () => {
            document.getElementById('edit-username-input').value = currentUserData.username || '';
            const profileAvatarContainer = document.querySelector('.profile-header .profile-avatar');
            profileAvatarContainer.style.cursor = 'pointer';
            
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
        
        async function openEditGroupInfoModal() {
            if (!currentGroupId) return;
            const modal = document.getElementById('edit-group-info-modal');
            const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', currentGroupId);
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
                const groupData = groupSnap.data();
                document.getElementById('edit-group-id-input').value = currentGroupId;
                document.getElementById('edit-group-name').value = groupData.name;
                document.getElementById('edit-group-description').value = groupData.description;
                document.getElementById('edit-group-category').value = groupData.category;
                document.getElementById('edit-group-goal').value = groupData.timeGoal;
                document.getElementById('edit-group-capacity').value = groupData.capacity;
                document.getElementById('edit-group-password').value = groupData.password || '';
                modal.classList.add('active');
            } else {
                showToast('Could not load group data.', 'error');
            }
        }

        ael('study-goal-form', 'submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const goal = parseInt(document.getElementById('study-goal-input').value, 10);
            if (isNaN(goal) || goal < 1 || goal > 24) {
                showToast('Please enter a valid goal between 1 and 24.', 'error');
                return;
            }
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            await updateDoc(userRef, { studyGoalHours: goal });

            studyGoalModal.classList.remove('active');
            showToast("Study goal updated!", "success");
        });

        ael('page-find-groups', 'click', (e) => {
            const sortBtn = e.target.closest('#group-ranking-sort-tabs .group-filter-btn');
            if (sortBtn && !sortBtn.classList.contains('active')) {
                document.querySelectorAll('#group-ranking-sort-tabs .group-filter-btn').forEach(btn => btn.classList.remove('active'));
                sortBtn.classList.add('active');
                renderGroupRankings();
            }
            const filterCheckbox = e.target.closest('#group-ranking-filters input[type="checkbox"]');
            if (filterCheckbox) {
                renderGroupRankings();
            }
        });

        ael('group-detail-nav', 'click', (e) => {
            const navItem = e.target.closest('.group-nav-item');
            if (navItem && !navItem.classList.contains('active')) {
                const subpage = navItem.dataset.subpage;
                renderGroupSubPage(subpage);
            }
        });
        
        ael('page-group-detail', 'click', async e => {
            const settingsBtn = e.target.closest('#group-settings-btn, #group-settings-btn-mobile');
            if (settingsBtn) {
                const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', currentGroupId);
                const groupSnap = await getDoc(groupRef);
                if (groupSnap.exists()) {
                    openGroupSettingsModal(groupSnap.data());
                }
                return;
            }

            const rulesBtn = e.target.closest('#group-rules-header-btn');
            if (rulesBtn) {
                openGroupRulesModal();
                return;
            }

            const wakeUpBtn = e.target.closest('.wake-up-btn');
            if (wakeUpBtn && !wakeUpBtn.disabled) {
                const targetUserId = wakeUpBtn.dataset.targetUserId;
                const targetUserName = wakeUpBtn.dataset.targetUserName;
                
                showConfirmationModal(
                    `Send Wake Up Call?`,
                    `This will send a notification to ${targetUserName}.`,
                    async () => {
                        try {
                            wakeUpBtn.disabled = true;
                            wakeUpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
                            
                            const result = await sendWakeUpNotification({
                                targetUserId: targetUserId,
                                senderName: currentUserData.username,
                                appId: appId
                            });
                            
                            if (result.data.success) {
                                showToast(`Wake up call sent to ${targetUserName}!`, 'success');
                            } else {
                                showToast(result.data.message || 'Could not send wake up call.', 'error');
                            }
                        } catch (error) {
                            console.error("Error sending wake up call:", error);
                            showToast('An error occurred.', 'error');
                        } finally {
                            wakeUpBtn.disabled = false;
                            wakeUpBtn.innerHTML = '<i class="fas fa-bell"></i> Wake Up';
                        }
                    }
                );
                return;
            }

            // Studicon Store Button
            const storeBtn = e.target.closest('#studicon-store-btn, #studicon-store-btn-mobile');
            if (storeBtn) {
                openStudiconStore();
                return;
            }

            // View Switcher Button
            const viewBtn = e.target.closest('[data-view-target]');
            if (viewBtn && !viewBtn.classList.contains('active')) {
                const targetView = viewBtn.dataset.viewTarget;

                // Update both desktop and mobile switches to stay in sync
                document.querySelectorAll('[data-view-target]').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.viewTarget === targetView);
                });

                renderGroupSubPage('home'); // Re-render the home subpage with the new view
                return;
            }
            
            const attachBtn = e.target.closest('#chat-attach-btn');
            if (attachBtn) {
                document.getElementById('chat-attachment-menu').classList.toggle('hidden');
            } else if (!e.target.closest('#chat-attachment-menu')) {
                 const menu = document.getElementById('chat-attachment-menu');
                 if(menu) menu.classList.add('hidden');
            }

            const chatAction = e.target.closest('[data-chat-action]');
            if (chatAction) {
                const action = chatAction.dataset.chatAction;
                if (action === 'album') {
                    document.getElementById('image-upload-input').click();
                } else {
                    showToast(`${action.charAt(0).toUpperCase() + action.slice(1)} upload coming soon!`, 'info');
                }
                 document.getElementById('chat-attachment-menu').classList.add('hidden');
            }

            const userProfileTrigger = e.target.closest('.member-profile-link, .studicon-member-card');
            if (userProfileTrigger) {
                const userId = userProfileTrigger.closest('[data-user-id]').dataset.userId;
                if (userId && userId !== currentUser.uid) {
                    showUserProfileModal(userId);
                }
            }
        });

        function openGroupSettingsModal(groupData) {
            const modal = document.getElementById('group-settings-modal');
            const isLeader = currentUser.uid === groupData.leaderId;

            modal.querySelectorAll('.group-settings-item').forEach(item => {
                const action = item.dataset.action;
                const leaderActions = ['edit-info', 'kick-member', 'promote-member', 'member-logs', 'group-settings', 'wake-up-group'];
                
                if (leaderActions.includes(action) && !isLeader) {
                    item.style.opacity = '0.5';
                    item.style.cursor = 'not-allowed';
                    item.dataset.disabled = 'true';
                } else {
                    item.style.opacity = '1';
                    item.style.cursor = 'pointer';
                    item.dataset.disabled = 'false';
                }
            });
            
            modal.classList.add('active');
        }

        async function openGroupRulesModal() {
            if (!currentGroupId) return;

            const modal = document.getElementById('group-rules-modal');
            const displayEl = document.getElementById('group-rules-display');
            const editContainer = document.getElementById('group-rules-edit-container');
            const textarea = document.getElementById('group-rules-textarea');
            const controlsEl = document.getElementById('group-rules-controls');
            const saveBtn = document.getElementById('save-group-rules-btn');

            try {
                const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', currentGroupId);
                const groupSnap = await getDoc(groupRef);

                if (!groupSnap.exists()) {
                    showToast('Could not load group rules.', 'error');
                    return;
                }

                const groupData = groupSnap.data();
                const rules = groupData.rules || 'No rules have been set for this group yet.';
                const isLeader = currentUser.uid === groupData.leaderId;

                // Reset state
                displayEl.textContent = rules;
                textarea.value = rules;
                displayEl.classList.remove('hidden');
                editContainer.classList.add('hidden');
                controlsEl.innerHTML = '';

                if (isLeader) {
                    controlsEl.innerHTML = '<button id="edit-group-rules-btn" class="text-sm text-blue-400 hover:text-blue-300 font-semibold">Edit</button>';
                    
                    const editBtn = document.getElementById('edit-group-rules-btn');
                    editBtn.onclick = () => {
                        displayEl.classList.add('hidden');
                        editContainer.classList.remove('hidden');
                        editBtn.classList.add('hidden');
                    };
                }

                saveBtn.onclick = async () => {
                    const newRules = textarea.value.trim();
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
                    
                    try {
                        await updateDoc(groupRef, { rules: newRules });
                        showToast('Group rules updated!', 'success');
                        modal.classList.remove('active');
                    } catch (error) {
                        console.error("Error saving group rules:", error);
                        showToast('Failed to save rules.', 'error');
                    } finally {
                        saveBtn.disabled = false;
                        saveBtn.textContent = 'Save Rules';
                    }
                };

                modal.classList.add('active');

            } catch (error) {
                console.error("Error opening group rules modal:", error);
                showToast('An error occurred.', 'error');
            }
        }

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
            pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });
            pomodoroSettingsModal.classList.remove('active');
                showToast("Pomodoro settings saved!", "success");
        });
        
        function renderStudiconPicker(category) {
            const pickerContainer = document.getElementById('studicon-picker');
            if (!pickerContainer) return;
            
            pickerContainer.innerHTML = STUDICONS[category].map(url => `
                <div class="avatar-option" data-url="${url}">
                    <img src="${url}" alt="Studicon">
                </div>
            `).join('');
            
            const currentStudicon = (currentUserData && groupRealtimeData.members[currentUser.uid]) ? groupRealtimeData.members[currentUser.uid].studiconURL : null;

            if (currentStudicon) {
                const selectedOption = pickerContainer.querySelector(`.avatar-option[data-url="${currentStudicon}"]`);
                if (selectedOption) {
                    selectedOption.classList.add('selected');
                }
            }
        }

        function openStudiconStore() {
            const modal = document.getElementById('studicon-store-modal');
            const categoryTabsContainer = document.getElementById('studicon-category-tabs');
            const categories = Object.keys(STUDICONS);
            
            categoryTabsContainer.innerHTML = categories.map((cat, index) => `
                <button class="studicon-category-tab flex-1 py-2 px-4 rounded-t-lg font-semibold text-sm ${index === 0 ? 'ranking-tab-btn active' : 'ranking-tab-btn'}" data-category="${cat}">${cat}</button>
            `).join('');
            
            renderStudiconPicker(categories[0]);
            modal.classList.add('active');
        }
        
        ael('studicon-store-modal', 'click', async (e) => {
            const tab = e.target.closest('.studicon-category-tab');
            if (tab && !tab.classList.contains('active')) {
                document.querySelectorAll('.studicon-category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderStudiconPicker(tab.dataset.category);
                return;
            }
            
            const option = e.target.closest('.avatar-option');
            if (option) {
                document.querySelectorAll('#studicon-picker .avatar-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                return;
            }

            const saveBtn = e.target.closest('#save-studicon-btn');
            if (saveBtn) {
                const selectedStudicon = document.querySelector('#studicon-picker .avatar-option.selected')?.dataset.url;
                if (selectedStudicon && currentUser) {
                    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                    const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                    try {
                        const batch = firestoreWriteBatch(db);
                        batch.update(userRef, { studiconURL: selectedStudicon });
                        batch.update(publicUserRef, { studiconURL: selectedStudicon });
                        await batch.commit();
                        document.getElementById('studicon-store-modal').classList.remove('active');
                        showToast('Studicon updated!', 'success');
                    } catch (error) {
                        console.error("Studicon update failed:", error);
                        showToast('Failed to update studicon.', 'error');
                    }
                } else {
                    showToast('Please select a studicon.', 'info');
                }
            }
        });

        ael('edit-group-info-form', 'submit', async (e) => {
            e.preventDefault();
            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            const groupId = document.getElementById('edit-group-id-input').value;
            const updatedData = {
                name: document.getElementById('edit-group-name').value.trim(),
                description: document.getElementById('edit-group-description').value.trim(),
                category: document.getElementById('edit-group-category').value,
                timeGoal: parseInt(document.getElementById('edit-group-goal').value, 10),
                capacity: parseInt(document.getElementById('edit-group-capacity').value, 10),
                password: document.getElementById('edit-group-password').value.trim()
            };

            try {
                const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
                await updateDoc(groupRef, updatedData);
                showToast('Group info updated successfully!', 'success');
                document.getElementById('edit-group-info-modal').classList.remove('active');
            } catch (error) {
                console.error('Error updating group info:', error);
                showToast('Failed to update group info.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Save Changes';
            }
        });

        ael('edit-profile-form', 'submit', async(e) => {
             e.preventDefault();
            if (!currentUser) return;
            const newUsername = document.getElementById('edit-username-input').value.trim();
            if (newUsername.length < 3) {
                showToast('Username must be at least 3 characters long.', 'error');
                return;
            }

            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
            
            try {
                await updateDoc(userRef, { username: newUsername });
                await updateDoc(publicUserRef, { username: newUsername });
                editProfileModal.classList.remove('active');
                showToast('Profile updated!', 'success');
            } catch (error) {
                console.error("Error updating profile: ", error);
                showToast('Failed to update profile.', 'error');
            }
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
                // Determine if the session being edited is a study or break session
                const sessionDoc = await getDoc(sessionRef);
                const sessionType = sessionDoc.exists() ? sessionDoc.data().type || 'study' : 'study'; // Default to 'study' if type is missing

                await updateDoc(sessionRef, { durationSeconds: newDurationSeconds });
                
                if (sessionType === 'study') {
                    await updateDoc(userRef, { totalStudySeconds: increment(durationDifference) });
                    await updateDoc(publicUserRef, { totalStudySeconds: increment(durationDifference) });
                } else { // 'break'
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
                    } else { // 'break'
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

        ael('study-goal-form', 'submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;
            const goal = parseInt(document.getElementById('study-goal-input').value, 10);
            if (isNaN(goal) || goal < 1 || goal > 24) {
                showToast('Please enter a valid goal between 1 and 24.', 'error');
                return;
            }
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            await updateDoc(userRef, { studyGoalHours: goal });

            studyGoalModal.classList.remove('active');
            showToast("Study goal updated!", "success");
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

        ael('group-settings-modal', 'click', async (e) => {
            const item = e.target.closest('.group-settings-item');
            if (!item) return;

            if (item.dataset.disabled === 'true') {
                showToast('Only the group leader can access this setting.', 'info');
                return;
            }

            const action = item.dataset.action;
            const modal = document.getElementById('group-settings-modal');

            switch(action) {
                case 'leave-group':
                    modal.classList.remove('active'); // Close settings modal first
                    showConfirmationModal(
                        'Leave Group?',
                        'Are you sure you want to leave this group? This action cannot be undone.',
                        async () => {
                            if (!currentUser || !currentGroupId) return;
                            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                            const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', currentGroupId);
                            
                            const groupSnap = await getDoc(groupRef);
                            if (groupSnap.exists()) {
                                const groupData = groupSnap.data();
                                if (groupData.leaderId === currentUser.uid && groupData.members.length > 1) {
                                    showToast('Please transfer leadership or kick all members before leaving.', 'error');
                                    return;
                                }
                            }

                            try {
                                const batch = firestoreWriteBatch(db);
                                batch.update(userRef, { joinedGroups: arrayRemove(currentGroupId) });
                                batch.update(groupRef, { members: arrayRemove(currentUser.uid) });
                                await batch.commit();

                                showToast('You have left the group.', 'success');
                                renderJoinedGroups();
                                showPage('page-my-groups');
                            } catch (error) {
                                console.error("Error leaving group:", error);
                                showToast("Failed to leave the group.", "error");
                            }
                        }
                    );
                    break;
                case 'wake-up-group':
                    modal.classList.remove('active');
                    showConfirmationModal(
                        'Wake Up All Idle Members?',
                        'This will send a notification to every member who is not currently studying.',
                        async () => {
                            try {
                                const result = await sendGroupWakeUpNotification({
                                    groupId: currentGroupId,
                                    senderId: currentUser.uid,
                                    appId: appId
                                });
                                if (result.data.success) {
                                    showToast(`Wake up call sent to ${result.data.sentCount} members.`, 'success');
                                } else {
                                    showToast(result.data.message || 'Could not send wake up call.', 'error');
                                }
                            } catch (error) {
                                console.error("Error sending group wake up call:", error);
                                showToast('An error occurred.', 'error');
                            }
                        }
                    );
                    break;
                case 'edit-info':
                    openEditGroupInfoModal();
                    modal.classList.remove('active');
                    break;
                case 'group-rules':
                    openGroupRulesModal();
                    modal.classList.remove('active');
                    break;
                default:
                    showToast(`'${item.textContent.trim()}' feature is coming soon!`, 'info');
                    modal.classList.remove('active');
                    break;
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

        window.onload = () => {
            initializeFirebase();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

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
                    renderGroupDetail(targetGroupId);
                } else {
                    showPage('page-my-groups');
                }
            });

            // Handler for form submissions
            plannerPage.addEventListener('submit', e => {
                 if (e.target.id === 'category-add-task-form') {
                    e.preventDefault();
                    const input = document.getElementById('category-add-task-input');
                    const title = input.value.trim();
                    if (title) {
                        let dueDate = null;
                        const today = new Date();
                        if (plannerState.activeCategory === 'today') {
                            dueDate = today;
                        } else if (plannerState.activeCategory === 'tomorrow') {
                            const tomorrow = new Date();
                            tomorrow.setDate(today.getDate() + 1);
                            dueDate = tomorrow;
                        }
                        
                        addPlannerTask(title, dueDate ? dueDate.toISOString().split('T')[0] : null);
                        input.value = '';
                    }
                }
            });

        // --- END OF UNIFIED PLANNER LISTENERS ---

        ael('quick-add-task-form', 'submit', async (e) => {
            e.preventDefault();
                if (!currentUser) return;
                const modal = document.getElementById('add-subject-modal');
                const subjectName = document.getElementById('add-subject-name').value.trim();
                const colorEl = document.querySelector('#add-subject-modal .color-dot.selected');
                
                if (!subjectName || !colorEl) {
                    showToast('Please provide a name and select a color.', 'error');
                    return;
                }
                const color = colorEl.dataset.color;

                const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                const subjectsRef = collection(userRef, 'subjects');
                // Get the highest current order value to append the new subject at the end
                const q = query(subjectsRef, orderBy('order', 'desc'), limit(1));
                const lastSubjectSnap = await getDocs(q);
                const lastOrder = lastSubjectSnap.empty ? -1 : lastSubjectSnap.docs[0].data().order;

                await addDoc(subjectsRef, { name: subjectName, color: color, order: lastOrder + 1 });
                modal.classList.remove('active');
                showToast(`Subject "${subjectName}" added!`, 'success');
            });

            // Ranking Page Tabs
            ael('page-ranking', 'click', (e) => {
                const tab = e.target.closest('.ranking-tab-btn');
                if (tab) {
                    const period = tab.dataset.period;
                    renderLeaderboard(period);
                    return;
                }

                const upgradeBtn = e.target.closest('#ranking-upgrade-btn');
                if (upgradeBtn) {
                    document.getElementById('premium-modal').classList.add('active');
                    return;
                }
        
                const rankingItem = e.target.closest('.ranking-item[data-user-id]');
                if (rankingItem) {
                    const userId = rankingItem.dataset.userId;
                    if (userId && userId !== currentUser.uid) {
                        showUserProfileModal(userId);
                    }
                }
            });

            // Planner Page Form Submission (Delegated)
            ael('page-planner', 'submit', (e) => {
                if (e.target.id === 'add-planner-task-form') {
                    e.preventDefault();
                    const input = document.getElementById('add-planner-task-input');
                    const title = input.value.trim();
                    if (title) {
                        addPlannerTask(title);
                        input.value = '';
                    }
                }
            });
            
            // Group Settings Modal Actions (Delegated)
            const groupSettingsModal = document.getElementById('group-settings-modal');
            if (groupSettingsModal) {
                groupSettingsModal.addEventListener('click', (e) => {
                    const item = e.target.closest('.group-settings-item');
                    if (item) {
                        const action = item.dataset.action;
                        switch(action) {
                            case 'edit-info':
                                openEditGroupInfoModal();
                                break;
                            default:
                                showToast(`'${item.textContent}' feature is coming soon!`, 'info');
                                break;
                        }
                        groupSettingsModal.classList.remove('active');
                    }
                });
            }

            // --- END: ADDED EVENT LISTENERS ---

            // --- Service Worker Registration (Robust Version) ---
        if ('serviceWorker' in navigator) {
            // Service Workers require a secure context (HTTPS or localhost) to register.
            // This check prevents the registration error in unsupported environments (like 'blob:').
            if (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                // IMPORTANT CHANGE HERE: Use './service-worker.js' or '/Focus-Clock/service-worker.js'
                // if your app is hosted in a subfolder like /Focus-Clock/
                // './service-worker.js' is generally preferred for relative paths.
                navigator.serviceWorker
                    .register('./service-worker.js', { scope: './' }) // Updated path and added scope
                    .then(registration => {
                        console.log('Service Worker registered successfully with scope:', registration.scope);
                        // --- START NEW CODE FOR SERVICE WORKER UPDATES ---
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
                        // --- END NEW CODE FOR SERVICE WORKER UPDATES ---
                    })
                    .catch(error => {
                        console.error('Service Worker registration failed:', error);
                    });

                // --- START NEW CODE TO RELOAD PAGE ON CONTROLLER CHANGE ---
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('New service worker activated, reloading page for latest content.');
                    window.location.reload();
                });
                // --- END NEW CODE TO RELOAD PAGE ON CONTROLLER CHANGE ---

            } else {
                console.warn('Service Worker not registered. This feature requires a secure context (HTTPS or localhost). The Pomodoro timer will be less reliable in the background.');
            }
        }
    };

    document.addEventListener('DOMContentLoaded', () => {
        const usernameAvatarPicker = document.getElementById('username-avatar-picker');
            if (usernameAvatarPicker) {
                usernameAvatarPicker.innerHTML = PRESET_AVATARS.map((url, index) => `
                    <div class="avatar-option ${index === 0 ? 'selected' : ''}">
                        <img src="${url}" alt="Avatar ${index + 1}">
                    </div>
                `).join('');
                
                usernameAvatarPicker.addEventListener('click', e => {
                    const option = e.target.closest('.avatar-option');
                    if (option) {
                        usernameAvatarPicker.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                    }
                });
            }

            const profileAvatar = document.getElementById('profile-page-avatar');
            if (profileAvatar) {
                profileAvatar.addEventListener('click', () => {
                     showConfirmationModal(
                        'Change the profile image', 
                        '', // No message needed, buttons are the options
                        () => { // On Confirm (Choose from Album)
                            document.getElementById('profile-picture-upload').click();
                        },
                        () => { // On Cancel (Choose Character)
                            const characterPickerModal = document.getElementById('avatar-character-modal');
                            const picker = document.getElementById('avatar-character-picker');
                            picker.innerHTML = PRESET_AVATARS.map(url => {
                                const isSelected = currentUserData.photoURL === url;
                                return `<div class="avatar-option ${isSelected ? 'selected' : ''}"><img src="${url}" alt="Character"></div>`
                            }).join('');
                            characterPickerModal.classList.add('active');
                        },
                        'Choose image from the album', // Confirm button text
                        'Choose character' // Cancel button text
                    );
                });
            }

            const characterPicker = document.getElementById('avatar-character-picker');
            if(characterPicker) {
                characterPicker.addEventListener('click', e => {
                    const option = e.target.closest('.avatar-option');
                    if (option) {
                        characterPicker.querySelectorAll('.avatar-option').forEach(opt => opt.classList.remove('selected'));
                        option.classList.add('selected');
                    }
                });
            }

        });
    </script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.2/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js"></script>
    <script src="https://unpkg.com/lucide@latest"></script>

    <!-- Premium Feature Modal -->
    <div id="premium-modal" class="modal">
        <div class="modal-content w-full max-w-md">
            <div class="modal-header">
                <h2 class="text-2xl font-bold">Upgrade to Premium</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body text-center">
                <i class="fas fa-gem text-5xl text-cyan-400 mb-4"></i>
                <p class="text-gray-300 mb-2">This feature is available for premium members only.</p>
                <p class="text-gray-400 text-sm">Unlock 30-day leaderboards, detailed statistics, an advanced planner, and more to supercharge your productivity!</p>
                <button class="w-full mt-6 bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition">
                    Subscribe Now
                </button>
            </div>
        </div>
    </div>


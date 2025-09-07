    // Supabase SDK
    import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
    const supabaseUrl = 'https://ofysppndssyllkolxjky.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9meXNwcG5kc3N5bGxrb2x4amt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNDg1MTAsImV4cCI6MjA3MjcyNDUxMH0.x6_aRXrbxSOP7I71oSooWx8x8dedczrtemoUEWiDta8';
    const supabase = createClient(supabaseUrl, supabaseKey);
    const db = supabase;
    const auth = supabase.auth;
    const storage = supabase.storage;

    let currentUser = null;

    // restore user on page load + watch changes
    async function restoreUser() {
        const { data: { user } } = await auth.getUser();
        currentUser = user ?? null;
    }
    auth.onAuthStateChange((_evt, session) => {
        currentUser = session?.user ?? null;
    });

    // ensure profile row exists (call after sign up / first login)
    async function ensureProfileRow() {
        if (!currentUser) return;
        await db.from('profiles')
            .upsert({ id: currentUser.id, email: currentUser.email }, { onConflict: 'id' });
    }
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
        let currentUserData = {};
        let dashboardCharts = {};
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        let userSessions = [];
        let isAudioUnlocked = false;
        let isAddingSubjectFromStartSession = false; // Flag to track modal origin

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
 * Sends a notification request to the Supabase Edge Function.
 * @param {object} messageData - Includes title, options.body, newState and oldState.
 */
async function triggerServerNotification(messageData) {
    if (!currentUser) {
        console.error('User not authenticated, cannot send server notification.');
        showToast('Please sign in to enable server notifications.', 'error');
        return;
    }
    try {
        const { data, error } = await supabase.functions.invoke('send-pomodoro-notification', {
            body: {
                userId: currentUser.id,
                appId,
                title: messageData.title,
                body: messageData.options.body,
                newState: messageData.newState,
                oldState: messageData.oldState
            }
        });
        if (error) throw error;
        console.log('Server notification triggered:', data);
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

        const PROFILE_BUCKET = 'profile-pictures';
        const BUCKET_IS_PRIVATE = false; // <-- set to true if your bucket is private

        async function uploadProfilePicture(file) {
            try {
                if (!currentUser) { showToast('Please sign in first.', 'info'); return; }
                if (!file || !file.type?.startsWith('image/')) { showToast('Pick a valid image.', 'error'); return; }
                if (file.size > 5 * 1024 * 1024) { showToast('Max size 5MB.', 'error'); return; }

                const ext = file.name.split('.').pop();
                const filePath = `${currentUser.id}/profile.${ext}`;

                // upload with contentType + upsert
                const { error: upErr } = await storage
                    .from(PROFILE_BUCKET)
                    .upload(filePath, file, { upsert: true, contentType: file.type });
                if (upErr) throw upErr;

                // public or signed URL
                let publicUrl = '';
                if (!BUCKET_IS_PRIVATE) {
                    const { data } = storage.from(PROFILE_BUCKET).getPublicUrl(filePath);
                    publicUrl = data?.publicUrl ?? '';
                } else {
                    const { data, error: sErr } = await storage
                        .from(PROFILE_BUCKET)
                        .createSignedUrl(filePath, 60 * 60 * 24); // 24h
                    if (sErr) throw sErr;
                    publicUrl = data?.signedUrl ?? '';
                }
                if (!publicUrl) throw new Error('Could not get file URL');

                // save URL in your profiles table column: photo_url
                const { error: upProfileErr } = await db
                    .from('profiles')
                    .update({ photo_url: publicUrl })
                    .eq('id', currentUser.id);
                if (upProfileErr) throw upProfileErr;

                // (optional) also mirror in auth metadata if your UI reads it:
                // await auth.updateUser({ data: { photo_url: publicUrl } });

                // refresh UI
                await loadMyProfile();
                showToast('Profile picture updated!', 'success');
            } catch (e) {
                console.error('uploadProfilePicture error', e);
                showToast('Upload failed. Check RLS/storage policies & bucket visibility.', 'error');
            }
        }

        // helper to load your own profile (photo + username, etc.)
        async function loadMyProfile() {
            if (!currentUser) return;
            const { data, error } = await db
                .from('profiles')
                .select('username, photo_url, email')
                .eq('id', currentUser.id)
                .single();
            if (error) { console.error(error); return; }
            // TODO: update your DOM
            // avatarImg.src = data.photo_url || '/assets/default-avatar.png';
            // usernameEl.textContent = data.username || data.email || 'User';
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

            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${groupId}/${fileName}`;
                const { error: uploadError } = await storage
                    .from('group-images')
                    .upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: publicUrlData } = storage
                    .from('group-images')
                    .getPublicUrl(filePath);
                const publicUrl = publicUrlData.publicUrl;

                const { data: userData, error: userError } = await db
                    .from('users')
                    .select('username')
                    .eq('id', currentUser.id)
                    .single();
                if (userError) throw userError;

                const { error: insertError } = await db
                    .from('group_messages')
                    .insert({
                        group_id: groupId,
                        image_url: publicUrl,
                        text: '',
                        sender_id: currentUser.id,
                        sender_name: userData.username,
                        created_at: new Date().toISOString()
                    });
                if (insertError) throw insertError;
            } catch (error) {
                console.error('Error uploading image:', error);
                showToast('Image upload failed.', 'error');
            }
        }

        // call when a Pomodoro finishes
        // studySeconds: number of seconds studied in the session
        async function recordPomodoroSession(studySeconds = 25 * 60) {
            try {
                if (!currentUser) { showToast('Sign in to record progress.', 'info'); return; }

                // read existing counters (simple & safe without RPC)
                const { data: prof, error: readErr } = await db
                    .from('profiles')
                    .select('total_study_sessions, current_streak, last_study_date')
                    .eq('id', currentUser.id)
                    .single();
                if (readErr) throw readErr;

                const today = new Date().toISOString().slice(0, 10);
                const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

                const prevStreak = prof?.current_streak ?? 0;
                const prevLast = prof?.last_study_date ?? null;

                let newStreak = prevStreak;
                if (prevLast === today) {
                    // already studied today → streak unchanged
                } else if (prevLast === yesterday) {
                    newStreak = prevStreak + 1;
                } else {
                    newStreak = 1;
                }

                const newSessions = (prof?.total_study_sessions ?? 0) + 1;

                const { error: upErr } = await db
                    .from('profiles')
                    .update({
                        total_study_sessions: newSessions,
                        current_streak: newStreak,
                        last_study_date: today
                    })
                    .eq('id', currentUser.id);
                if (upErr) throw upErr;

                showToast('Session saved!', 'success');
                // refresh leaderboard if visible
                // await loadLeaderboard();
            } catch (e) {
                console.error('recordPomodoroSession error', e);
                showToast('Could not save session. Check RLS on profiles.', 'error');
            }
        }

        // fetch & render leaderboard
        async function loadLeaderboard(limit = 50) {
            try {
                const { data, error } = await db
                    .from('profiles')
                    .select('id, username, photo_url, total_study_sessions, current_streak')
                    .order('total_study_sessions', { ascending: false })
                    .limit(limit);

                if (error) throw error;

                // TODO: render in your UI
                // leaderboardEl.innerHTML = data.map((u, i) => `
                //   <li>
                //     <img src="${u.photo_url || '/assets/default-avatar.png'}" />
                //     <span>#${i+1}</span>
                //     <span>${u.username || 'Anon'}</span>
                //     <span>${u.total_study_sessions} sessions</span>
                //   </li>`).join('');
            } catch (e) {
                console.error('loadLeaderboard error', e);
                showToast('Could not load leaderboard. Check RLS (select on profiles).', 'error');
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

        function formatTime(seconds, includeSeconds = true) {
            if (isNaN(seconds) || seconds < 0) seconds = 0;
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            
            if (includeSeconds) {
                return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
            const hDisplay = h > 0 ? `${h}h ` : '';
            return `${hDisplay}${m}m`;
        }

        function formatPomodoroTime(seconds) {
            if (isNaN(seconds) || seconds < 0) seconds = 0;
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }

        async function startTimer(subject) {
            if (!subject) {
                showToast("Please select a subject first.", "error");
                return;
            }
            unlockAudio();

            // Stop and save any active break session before starting a new study session
            if (breakTimerInterval) {
                clearInterval(breakTimerInterval);
                const elapsedBreakSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
                if (elapsedBreakSeconds > 0) {
                    await saveSession('Break', elapsedBreakSeconds, 'break'); // Save break session
                }
                breakTimerInterval = null;
                breakStartTime = 0;
            }
            // Clear break status from UI
            pomodoroStatusDisplay.textContent = ''; // Clear the "On Break" status

            // --- New: Check and save idle time before starting a new study session ---
            if (currentUser) {
                const sessionsRef = collection(db, 'artifacts', appId, 'users', currentUser.uid, 'sessions');
                const q = query(sessionsRef, orderBy('endedAt', 'desc'), limit(1));
                const lastSessionSnapshot = await getDocs(q);

                if (!lastSessionSnapshot.empty) {
                    const lastSessionData = lastSessionSnapshot.docs[0].data();
                    // Ensure lastSessionData.endedAt is a valid Timestamp before calling toDate()
                    const lastSessionEndedAt = lastSessionData.endedAt && typeof lastSessionData.endedAt.toDate === 'function' 
                                                ? lastSessionData.endedAt.toDate() 
                                                : null;
                    const now = Date.now();

                    // Only track idle break if the last session was a study session and ended before now
                    if (lastSessionData.type === 'study' && lastSessionEndedAt && lastSessionEndedAt < now) {
                        const idleDurationSeconds = Math.floor((now - lastSessionEndedAt) / 1000);
                        if (idleDurationSeconds > 0) {
                            await saveSession('Idle Break', idleDurationSeconds, 'break');
                        }
                    }
                }
            }
            // --- End New idle time tracking ---


            activeSubject = subject;
            activeSubjectDisplay.textContent = activeSubject;
            
            if(timerInterval) clearInterval(timerInterval);

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
                
                // Use the new reliable SW alarm
                await triggerServerNotification({
        title: 'Focus complete!',
        options: { body: `Time for a short break.`, tag: 'pomodoro-transition' }, // Options for the FCM notification
        newState: 'short_break',
        oldState: 'work',
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
            // Stop the UI timer in the web worker
            pomodoroWorker.postMessage({ command: 'stop' });

            // --- ADD THIS BLOCK TO RESET PAUSE STATE ---
            isPaused = false;
            pauseStartTime = 0;
            // --- END OF ADDED BLOCK ---

            // If a Pomodoro session was running, save any partial time and cancel the background alarm
            if (timerMode === 'pomodoro' && pomodoroState !== 'idle') {
                const workDuration = pomodoroSettings.work * 60;
                // Calculate elapsed time based on what's left on the display
                const displayTime = sessionTimerDisplay.textContent;
                const timeLeftInSeconds = (parseInt(displayTime.split(':')[0], 10) * 60) + parseInt(displayTime.split(':')[1], 10);
                const elapsedSeconds = workDuration - timeLeftInSeconds;
                
                if (pomodoroState === 'work' && elapsedSeconds > 0) {
                    await saveSession(activeSubject, elapsedSeconds, 'study');
                }
            }
            // If a normal timer was running, stop it and save the session
            else if (timerMode === 'normal' && timerInterval) {
                clearInterval(timerInterval);
                const elapsedMillis = Date.now() - sessionStartTime;
                const sessionDurationSeconds = Math.floor(elapsedMillis / 1000);
                if (sessionDurationSeconds > 0) {
                    await saveSession(activeSubject, sessionDurationSeconds, 'study');
                }
            }
            
            // Reset all timer-related state variables and UI elements
            timerInterval = null;
            pomodoroState = 'idle';
            activeSubjectDisplay.textContent = '';
            sessionTimerDisplay.textContent = timerMode === 'pomodoro' ? formatPomodoroTime(pomodoroSettings.work * 60) : formatTime(0);
            pomodoroStatusDisplay.textContent = timerMode === 'pomodoro' ? 'Ready for Pomodoro' : '';
            pomodoroStatusDisplay.style.color = '#9ca3af';

            // Reset button visibility
            document.getElementById('start-studying-btn').classList.remove('hidden');
            document.getElementById('stop-studying-btn').classList.add('hidden');
            // --- ADD THESE 2 LINES TO HIDE PAUSE/RESUME ---
            document.getElementById('pause-btn').classList.add('hidden');
            document.getElementById('resume-btn').classList.add('hidden');
            // --- END OF ADDED LINES ---
            document.getElementById('manual-start-btn').classList.add('hidden');

            // Update user status in Firestore to show they are no longer studying
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
            } else if (timerMode === 'pomodoro' && !isPaused) {
                pomodoroWorker.postMessage({ command: 'pause' });
                isPaused = true;
                document.getElementById('pause-btn').classList.add('hidden');
                document.getElementById('resume-btn').classList.remove('hidden');
            }
        }
        
        function resumeTimer() {
            if (timerMode === 'normal' && isPaused) {
                const pauseDuration = Date.now() - pauseStartTime;
                sessionStartTime += pauseDuration;
                timerInterval = setInterval(() => {
                    const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
                    sessionTimerDisplay.textContent = formatTime(elapsedSeconds);
                }, 1000);
                isPaused = false;
                pauseStartTime = 0;
                document.getElementById('pause-btn').classList.remove('hidden');
                document.getElementById('resume-btn').classList.add('hidden');
            } else if (timerMode === 'pomodoro' && isPaused) {
                pomodoroWorker.postMessage({ command: 'resume' });
                isPaused = false;
                document.getElementById('pause-btn').classList.remove('hidden');
                document.getElementById('resume-btn').classList.add('hidden');
            }
        }

        // --- NEW: Helper to start the next Pomodoro phase ---
        async function startNextPomodoroPhase(state) {
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
            
            // Start the UI timer
            pomodoroWorker.postMessage({ command: 'start', duration: durationSeconds });
            pomodoroStatusDisplay.textContent = statusText;
            pomodoroStatusDisplay.style.color = state.includes('break') ? '#f59e0b' : '#3b82f6';

            await triggerServerNotification(transitionMessage);

            // Update cycle in Firestore only after a break is completed (meaning a work session is starting)
            if (state === 'work') {
                const newCycleCount = (currentUserData.pomodoroCycle || 0) + 1;
                updateDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid), { pomodoroCycle: newCycleCount });
            }
        }

        function updateBreakTimerDisplay() {
            if (breakStartTime === 0) return;
            const elapsedSeconds = Math.floor((Date.now() - breakStartTime) / 1000);
            sessionTimerDisplay.textContent = formatTime(elapsedSeconds); // Show break time on main timer display
            pomodoroStatusDisplay.textContent = 'On Break'; // Indicate break status
            pomodoroStatusDisplay.style.color = '#f59e0b'; // Break color
        }
        
        function updateTotalTimeDisplay() {
            totalTimeDisplay.textContent = `Total Today: ${formatTime(totalTimeTodayInSeconds)}`;
            totalBreakTimeDisplay.textContent = `Total Break: ${formatTime(totalBreakTimeTodayInSeconds)}`;
        }

        async function saveSession(subject, durationSeconds, sessionType = 'study') { // Default to 'study'
            if (!currentUser || durationSeconds <= 0) {
                return;
            }

            // --- START: ADDED GUEST LOGIC ---
            // For anonymous users, just update local state without saving to Firestore
            if (currentUser.isAnonymous) {
                if (sessionType === 'study') {
                    totalTimeTodayInSeconds += durationSeconds;
                } else {
                    totalBreakTimeTodayInSeconds += durationSeconds;
                }
                updateTotalTimeDisplay();
                showToast(`Session of ${formatTime(durationSeconds, false)} saved locally! Sign up to save your progress.`, "success", 4000);
                return;
            }
            // --- END: ADDED GUEST LOGIC ---

            // Cap break time at 3 hours (10800 seconds)
            const MAX_BREAK_SECONDS = 3 * 3600; // 3 hours in seconds
            const cappedDuration = (sessionType === 'break' && durationSeconds > MAX_BREAK_SECONDS) ? MAX_BREAK_SECONDS : durationSeconds;

            try {
                await runTransaction(db, async (transaction) => {
                    const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                    const publicUserDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                    
                    const userDoc = await transaction.get(userDocRef);
                    const publicUserDoc = await transaction.get(publicUserDocRef);
                    const userDataForStreak = userDoc.data();
if (sessionType === 'study') {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    const lastStudyDay = userDataForStreak.lastStudyDay || '';
    let currentStreak = userDataForStreak.currentStreak || 0;

    if (lastStudyDay !== todayStr) {
        if (lastStudyDay === yesterdayStr) {
            currentStreak++; // Continued the streak
        } else {
            currentStreak = 1; // Streak was broken, reset to 1
        }
        transaction.update(userDocRef, {
            currentStreak: currentStreak,
            lastStudyDay: todayStr
        });
    }
}

                    if (!userDoc.exists()) {
                        throw new Error("Transaction failed: User document not found.");
                    }

                    const data = userDoc.data();
                    const todayStr = getCurrentDate().toISOString().split('T')[0];

                    let currentDailyStudySeconds = 0;
                    if (data.totalTimeToday && data.totalTimeToday.date === todayStr) {
                        currentDailyStudySeconds = data.totalTimeToday.seconds || 0;
                    }
                    let currentDailyBreakSeconds = 0;
                    if (data.totalBreakTimeToday && data.totalBreakTimeToday.date === todayStr) {
                        currentDailyBreakSeconds = data.totalBreakTimeToday.seconds || 0;
                    }

                    const newSessionDocRef = doc(collection(db, 'artifacts', appId, 'users', currentUser.uid, 'sessions'));
                    transaction.set(newSessionDocRef, {
                        subject: subject,
                        durationSeconds: cappedDuration, // Use capped duration
                        endedAt: serverTimestamp(),
                        type: sessionType // Store session type
                    });

                    const updateData = {};
                    if (sessionType === 'study') {
                        updateData.totalStudySeconds = increment(cappedDuration);
                        updateData.totalTimeToday = {
                            date: todayStr,
                            seconds: currentDailyStudySeconds + cappedDuration
                        };
                    } else { // 'break'
                        updateData.totalBreakSeconds = increment(cappedDuration);
                        updateData.totalBreakTimeToday = {
                            date: todayStr,
                            seconds: currentDailyBreakSeconds + cappedDuration
                        };
                    }
                    transaction.update(userDocRef, updateData);

                    if (sessionType === 'study') {
                        if (!publicUserDoc.exists()) {
                            transaction.set(publicUserDocRef, {
                                username: currentUserData.username || 'Anonymous',
                                email: currentUserData.email || currentUser.email || '',
                                totalStudySeconds: 0,
                                totalBreakSeconds: 0 // Initialize break time for public too
                            });
                        }
                        transaction.update(publicUserDocRef, {
                            totalStudySeconds: increment(cappedDuration)
                        });
                    } else { // 'break' - update public break time
                         if (!publicUserDoc.exists()) {
                            transaction.set(publicUserDocRef, {
                                username: currentUserData.username || 'Anonymous',
                                email: currentUserData.email || currentUser.email || '',
                                totalStudySeconds: 0,
                                totalBreakSeconds: 0
                            });
                        }
                        transaction.update(publicUserDocRef, {
                            totalBreakSeconds: increment(cappedDuration)
                        });
                    }

                    // Update local state after successful transaction
                    if (sessionType === 'study') {
                        totalTimeTodayInSeconds = currentDailyStudySeconds + cappedDuration;
                    } else {
                        totalBreakTimeTodayInSeconds = currentDailyBreakSeconds + cappedDuration;
                    }
                });
                
                updateTotalTimeDisplay(); // This now updates both
                showToast(`Session of ${formatTime(cappedDuration, false)} saved!`, "success");
                // After saving, check if any achievements were unlocked for this study session
if (sessionType === 'study') {
    await checkAndAwardAchievements(cappedDuration);
}

            } catch (error) {
                console.error("Error saving session in transaction: ", error);
                showToast("Error saving session.", "error");
            }
        }
        async function checkAndAwardAchievements(completedSessionDuration) {
    if (!currentUser) return;

    try {
        const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) return;

        const userData = userDoc.data();
        const unlocked = userData.unlockedAchievements || [];
        let newlyUnlocked = [];

        // Rule 1: Study for a total of 1 hour
        if (!unlocked.includes('novice_scholar') && userData.totalStudySeconds >= 3600) {
            newlyUnlocked.push('novice_scholar');
        }
        // Rule 2: Study for a total of 10 hours
        if (!unlocked.includes('dedicated_learner') && userData.totalStudySeconds >= 36000) {
            newlyUnlocked.push('dedicated_learner');
        }
        // Rule 3: Complete a single session over 2 hours
        if (!unlocked.includes('marathoner') && completedSessionDuration >= 7200) {
            newlyUnlocked.push('marathoner');
        }
        // Rule 4: Maintain a 7-day study streak
        if (!unlocked.includes('consistent_coder') && userData.currentStreak >= 7) {
            newlyUnlocked.push('consistent_coder');
        }

        if (newlyUnlocked.length > 0) {
            await updateDoc(userDocRef, { 
                unlockedAchievements: arrayUnion(...newlyUnlocked) 
            });
            
            const achievement = ACHIEVEMENTS[newlyUnlocked[0]];
            showToast(`Achievement Unlocked: ${achievement.name}!`, 'success');
        }
    } catch (error) {
        console.error("Error checking achievements:", error);
    }
}

        async function loadDailyTotal() {
            if (!currentUser) return;

            // --- START: ADDED GUEST LOGIC ---
            if (currentUser.isAnonymous) {
                totalTimeTodayInSeconds = 0;
                totalBreakTimeTodayInSeconds = 0;
                updateTotalTimeDisplay();
                return;
            }
            // --- END: ADDED GUEST LOGIC ---
            
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
                const data = userDoc.data();
                const todayStr = getCurrentDate().toISOString().split('T')[0];
                
                if (data.totalTimeToday && data.totalTimeToday.date === todayStr) {
                    totalTimeTodayInSeconds = data.totalTimeToday.seconds || 0;
                } else {
                    totalTimeTodayInSeconds = 0;
                    // The update to Firestore for a new day's totalTimeToday will be handled by saveSession's transaction.
                }

                if (data.totalBreakTimeToday && data.totalBreakTimeToday.date === todayStr) {
                    totalBreakTimeTodayInSeconds = data.totalBreakTimeToday.seconds || 0;
                } else {
                    totalBreakTimeTodayInSeconds = 0;
                    // The update to Firestore for a new day's totalBreakTimeToday will be handled by saveSession's transaction.
                }

            } else {
                totalTimeTodayInSeconds = 0;
                totalBreakTimeTodayInSeconds = 0;
            }
            if(totalTimeDisplay && totalBreakTimeDisplay) { // Should refer to the HTML element
                updateTotalTimeDisplay();
            }
        }

        async function getOrCreateUserDocument(user) {
            const userDocRef = doc(db, 'artifacts', appId, 'users', user.uid);
            let userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                const initialData = {
                    email: user.email,
                    username: user.displayName,
                    photoURL: PRESET_AVATARS[0], // Default avatar
                    studiconURL: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Angel', // Default studicon
                    joinedGroups: [],
                    createdAt: serverTimestamp(),
                    totalStudySeconds: 0,
                    totalBreakSeconds: 0, // New field
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
                    totalBreakTimeToday: { // New field
                        date: getCurrentDate().toISOString().split('T')[0],
                        seconds: 0
                    }
                };
                await setDoc(userDocRef, initialData);
                await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
                    username: user.displayName,
                    email: user.email,
                    totalStudySeconds: 0,
                    totalBreakSeconds: 0, // Initialize for public too
                    photoURL: PRESET_AVATARS[0], // Public profile needs it too
                    studiconURL: 'https://api.dicebear.com/8.x/miniavs/svg?seed=Angel',
                });
                userDoc = await getDoc(userDocRef);
            }
            return userDoc;
        }

        function updateProfileUI(userData) {
            // --- START: MODIFIED PROFILE UI LOGIC ---
            const profileAuthView = document.getElementById('profile-authenticated-view');
            const profileAnonView = document.getElementById('profile-anonymous-view');
            const headerAvatar = document.getElementById('header-avatar');

            if (!userData || (currentUser && currentUser.isAnonymous)) {
                // Show guest view
                if(profileAuthView) profileAuthView.classList.add('hidden');
                if(profileAnonView) profileAnonView.classList.remove('hidden');
                if(headerAvatar) headerAvatar.innerHTML = `<i class="fas fa-user-secret text-xl"></i>`;
                return;
            }

            // Show authenticated view
            if(profileAuthView) profileAuthView.classList.remove('hidden');
            if(profileAnonView) profileAnonView.classList.add('hidden');
            // --- END: MODIFIED PROFILE UI LOGIC ---

            currentUserData = userData; 
            const username = userData.username || 'Anonymous';
            const email = userData.email || '';
            const photoURL = userData.photoURL;
            const studyGoal = userData.studyGoalHours;

            document.getElementById('profile-page-name').textContent = username;
            document.getElementById('profile-page-email').textContent = email;
            
            const profileAvatar = document.getElementById('profile-page-avatar');
            
            [headerAvatar, profileAvatar].forEach(el => {
                if (photoURL) {
                    el.innerHTML = `<img src="${photoURL}" alt="${username}" class="w-full h-full object-cover">`;
                } else {
                    const initial = username ? username.charAt(0).toUpperCase() : 'U';
                    el.textContent = initial;
                    el.innerHTML = `<span>${initial}</span>`; // Ensure it's not trying to render an img tag
                }
            });
            
            const studyGoalValueEl = document.getElementById('study-goal-value');
            if (studyGoal) {
                studyGoalValueEl.textContent = `${studyGoal} hours/day`;
            } else {
                studyGoalValueEl.textContent = 'Not set';
            }
            const streakDisplay = document.getElementById('profile-streak-display');
if (streakDisplay) {
    const streak = userData.currentStreak || 0;
    streakDisplay.textContent = `${streak} day${streak === 1 ? '' : 's'}`;
}

const achievementsGrid = document.getElementById('achievements-grid');
if (achievementsGrid) {
    const unlocked = userData.unlockedAchievements || [];
    achievementsGrid.innerHTML = Object.keys(ACHIEVEMENTS).map(key => {
        const hasUnlocked = unlocked.includes(key);
        const achievement = ACHIEVEMENTS[key];
        return `
            <div class="p-2 ${hasUnlocked ? 'opacity-100' : 'opacity-30'}" title="${achievement.name}: ${achievement.description}">
                <i class="fas fa-trophy text-4xl ${hasUnlocked ? 'text-yellow-400' : 'text-gray-500'}"></i>
                <p class="text-xs mt-1 font-semibold">${achievement.name}</p>
            </div>
        `;
    }).join('');
}
        }

        function setupRealtimeListeners() {
            if (!currentUser) return;
            const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
            const usersCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'users');
            const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            // Fetch subjects ordered by 'order' field
            const subjectsCollectionRef = query(collection(userDocRef, 'subjects'), orderBy('order', 'asc'));
            const sessionsCollectionRef = collection(userDocRef, 'sessions');
            const plannerTasksRef = collection(userDocRef, 'plannerTasks');

            onSnapshot(userDocRef, (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    currentUserData = data;
                    const todayStr = getCurrentDate().toISOString().split('T')[0];
                    if (!data.totalTimeToday || data.totalTimeToday.date !== todayStr || !data.totalBreakTimeToday || data.totalBreakTimeToday.date !== todayStr) {
                        loadDailyTotal(); 
                    } else {
                        totalTimeTodayInSeconds = data.totalTimeToday.seconds;
                        totalBreakTimeTodayInSeconds = data.totalBreakTimeToday.seconds;
                        updateTotalTimeDisplay();
                    }

                    if (data.pomodoroSettings) {
                        pomodoroSettings = {...pomodoroSettings, ...data.pomodoroSettings};
                        pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings });
                    }
                    if (data.pomodoroSounds) {
                        pomodoroSounds = {...pomodoroSounds, ...data.pomodoroSounds};
                    }
                    updateProfileUI(data);
                    // This listener updates joinedGroups, so we call the render function
                    if (document.getElementById('page-my-groups').classList.contains('active')) {
                        renderJoinedGroups();
                    }
                }
            });
            
            onSnapshot(groupsCollectionRef, () => {
                if (document.getElementById('page-find-groups').classList.contains('active')) {
                   renderGroupRankings();
                }
                if (document.getElementById('page-my-groups').classList.contains('active')) {
                    renderJoinedGroups();
                }
            });
            
            onSnapshot(subjectsCollectionRef, (snapshot) => {
                const subjects = [];
                snapshot.forEach(doc => subjects.push({ id: doc.id, ...doc.data() }));
                // When subjects change, re-render the list in the start session modal
                renderSubjectSelectionList(subjects);
            });
            
            onSnapshot(usersCollectionRef, () => {
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
                        endedAt: data.endedAt && typeof data.endedAt.toDate === 'function' ? data.endedAt.toDate() : null, // Ensure endedAt is converted only if it's a Timestamp
                        type: data.type || 'study' // Ensure type is present, default to 'study'
                    };
                });
                if (document.getElementById('page-stats').classList.contains('active')) {
                    renderStatsPage(userSessions);
                }
                 if (document.getElementById('page-ranking').classList.contains('active')) {
                    const activeTab = document.querySelector('#ranking-period-tabs .ranking-tab-btn.active');
                    renderLeaderboard(activeTab ? activeTab.dataset.period : 'weekly');
                }
            });
            // --- DEPRECATED ---
            onSnapshot(query(plannerTasksRef, orderBy("date")), (snapshot) => {
                // This is now handled by the new planner logic
            });
            
            // --- NEW PLANNER LISTENERS ---
            setupPlannerListeners();
        }
        
        // =================================================================================
        // ============================ NEW PLANNER LOGIC START ============================
        // =================================================================================

        let plannerState = {
            lists: [],
            tasks: [],
            activeListId: 'inbox',
            selectedTaskId: null,
            currentView: 'list', // 'list', 'board', 'calendar'
            activeCategory: 'list', // 'list', 'today', 'tomorrow', 'thisweek', etc.
            showCompletedInCategory: false,
            plannerUnsubscribers: [],
            calendarYear: new Date().getFullYear(),
            calendarMonth: new Date().getMonth(),
        };
        function setupPlannerListeners() {
            if (!currentUser) return;

            // Clean up old listeners before setting new ones
            plannerState.plannerUnsubscribers.forEach(unsub => unsub());
            plannerState.plannerUnsubscribers = [];

            // 1. Listener for Lists
            const listsQuery = query(
                collection(db, `/artifacts/${appId}/public/data/lists`),
                where('members', 'array-contains', currentUser.uid)
            );
            const listsUnsub = onSnapshot(listsQuery, (snapshot) => {
                plannerState.lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderPlannerPage(); // Re-render the whole page on list changes
            });
            plannerState.plannerUnsubscribers.push(listsUnsub);

            // 2. Listener for Tasks
            const tasksQuery = query(
                collection(db, `/artifacts/${appId}/public/data/tasks`),
                where('members', 'array-contains', currentUser.uid)
            );
            const tasksUnsub = onSnapshot(tasksQuery, (snapshot) => {
                plannerState.tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                renderPlannerPage(); // Re-render the whole page on task changes
            });
            plannerState.plannerUnsubscribers.push(tasksUnsub);
        }

        function renderPlannerPage() {
            if (!document.getElementById('page-planner').classList.contains('active')) return;

            renderPlannerSidebar();
            renderPlannerMainContent();
            renderPlannerTaskDetails();
        }

        function renderPlannerSidebar() {
            const sidebar = document.getElementById('planner-sidebar');
            if (!sidebar) return;

            const inboxTasks = plannerState.tasks.filter(t => t.listId === 'inbox' && !t.completed).length;

            sidebar.innerHTML = `
                <div id="planner-sidebar-header">
                    <h2 class="text-lg font-bold">Projects</h2>
                    <button id="add-list-btn" class="p-1 rounded-full hover:bg-gray-700"><i class="fas fa-plus"></i></button>
                </div>
                <nav class="flex-grow space-y-1">
                    <div class="planner-sidebar-item ${plannerState.activeListId === 'inbox' ? 'active' : ''}" data-list-id="inbox">
                        <i class="fas fa-inbox w-5 mr-3"></i>
                        <span class="flex-grow">Inbox</span>
                        <span class="text-xs bg-gray-600 px-2 py-0.5 rounded-full">${inboxTasks}</span>
                    </div>
                    ${plannerState.lists.map(list => {
                        const taskCount = plannerState.tasks.filter(t => t.listId === list.id && !t.completed).length;
                        return `
                        <div class="planner-sidebar-item ${plannerState.activeListId === list.id ? 'active' : ''}" data-list-id="${list.id}">
                            <i class="fas fa-folder w-5 mr-3"></i>
                            <span class="flex-grow">${list.name}</span>
                            <span class="text-xs bg-gray-600 px-2 py-0.5 rounded-full">${taskCount}</span>
                        </div>
                        `
                    }).join('')}
                </nav>
            `;
        }

        function renderPlannerMainContent() {
            const mainContent = document.getElementById('planner-main-content');
            if (!mainContent) return;

            const activeList = plannerState.activeListId === 'inbox'
                ? { id: 'inbox', name: 'Inbox' }
                : plannerState.lists.find(l => l.id === plannerState.activeListId);
            
            document.getElementById('planner-header-title').textContent = activeList?.name || 'Planner';
            
            document.querySelectorAll('.planner-view-btn').forEach(btn => {
                btn.classList.toggle('bg-blue-600', btn.dataset.view === plannerState.currentView);
                btn.classList.toggle('text-white', btn.dataset.view === plannerState.currentView);
            });
            
            const tasksForCurrentList = plannerState.tasks.filter(t => t.listId === plannerState.activeListId);
            const sidebar = document.getElementById('planner-sidebar');
            const detailsPanel = document.getElementById('planner-task-details');

            // Reset styles and visibility
            if(sidebar) sidebar.style.display = '';
            mainContent.style.padding = '';
            if(detailsPanel) detailsPanel.classList.add('hidden');


            switch (plannerState.currentView) {
                case 'list':
                    if(sidebar) sidebar.style.display = 'none';
                    if(detailsPanel) detailsPanel.classList.add('hidden');
                    mainContent.style.padding = '0';
                    
                    if (plannerState.activeCategory && plannerState.activeCategory !== 'list') {
                        // We are in a detailed category view
                        renderPlannerCategoryView(plannerState.activeCategory);
                    } else {
                        // We are in the main list view
                        document.getElementById('planner-header-title').textContent = 'Planner';
                        renderPlannerListView(plannerState.tasks); // Pass all tasks for the list view
                    }
                    break;
                case 'board':
                    renderPlannerBoardView(tasksForCurrentList);
                    break;
                case 'calendar':
                    renderPlannerCalendarView(tasksForCurrentList);
                    break;
            }
        }
        
        function renderPlannerListView(allTasks) {
            const mainContent = document.getElementById('planner-main-content');
            
            // Date helpers
            const today = new Date();
            today.setHours(0,0,0,0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            
            const startOfWeek = new Date(today);
            const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
            startOfWeek.setDate(diff);

            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            endOfWeek.setHours(23,59,59,999);

            const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

            // Filter tasks
            const todayTasks = allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate.seconds * 1000), today) && !t.completed);
            const tomorrowTasks = allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate.seconds * 1000), tomorrow) && !t.completed);
            const thisWeekTasks = allTasks.filter(t => {
                if (!t.dueDate || t.completed) return false;
                const taskDate = new Date(t.dueDate.seconds * 1000);
                return taskDate >= startOfWeek && taskDate <= endOfWeek;
            });
            const plannedTasks = allTasks.filter(t => t.dueDate && !t.completed);
            const completedTasks = allTasks.filter(t => t.completed);
            const inboxTasks = allTasks.filter(t => t.listId === 'inbox' && !t.completed);

            const categories = [
                { name: 'Today', icon: 'fa-sun', color: 'bg-yellow-500', count: todayTasks.length },
                { name: 'Tomorrow', icon: 'fa-cloud-sun', color: 'bg-orange-400', count: tomorrowTasks.length },
                { name: 'This Week', icon: 'fa-calendar-week', color: 'bg-purple-500', count: thisWeekTasks.length },
                { name: 'Planned', icon: 'fa-calendar-alt', color: 'bg-blue-500', count: plannedTasks.length },
                { name: 'Events', icon: 'fa-calendar-star', color: 'bg-green-500', count: 0 }, // Placeholder
                { name: 'Completed', icon: 'fa-check-circle', color: 'bg-gray-500', count: completedTasks.length },
                { name: 'Tasks', icon: 'fa-tasks', color: 'bg-indigo-500', count: inboxTasks.length },
            ];

            mainContent.innerHTML = `
                <div id="planner-list-view-container">
                    <div class="planner-search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" placeholder="Search">
                    </div>
                    <div class="planner-list-section no-scrollbar">
                        ${categories.map(cat => `
                            <div class="planner-list-item" data-category="${cat.name.toLowerCase()}">
                                <div class="icon ${cat.color}"><i class="fas ${cat.icon}"></i></div>
                                <span class="text">${cat.name}</span>
                                <div class="counts">${cat.count}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="planner-actions">
                        <button class="planner-add-project-btn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Project</span>
                        </button>
                        <div class="action-icons">
                            <i class="fas fa-flag"></i>
                            <i class="fas fa-folder-open"></i>
                        </div>
                    </div>
                </div>
            `;
        }

        function renderPlannerCategoryView(category) {
            const mainContent = document.getElementById('planner-main-content');

            // --- 1. Filter Tasks ---
            const allTasks = plannerState.tasks;
            let tasksToShow = [];
            let title = category.charAt(0).toUpperCase() + category.slice(1);
            
            const today = new Date();
            today.setHours(0,0,0,0);
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

            switch (category) {
                case 'today':
                    tasksToShow = allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate.seconds * 1000), today));
                    break;
                case 'tomorrow':
                    tasksToShow = allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate.seconds * 1000), tomorrow));
                    break;
                case 'this week':
                    title = 'This Week';
                    const startOfWeek = new Date(today);
                    const dayOfWeek = today.getDay();
                    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                    startOfWeek.setDate(diff);
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(startOfWeek.getDate() + 6);
                    endOfWeek.setHours(23, 59, 59, 999);
                    tasksToShow = allTasks.filter(t => {
                        if (!t.dueDate) return false;
                        const taskDate = new Date(t.dueDate.seconds * 1000);
                        return taskDate >= startOfWeek && taskDate <= endOfWeek;
                    });
                    break;
                case 'planned':
                    tasksToShow = allTasks.filter(t => t.dueDate && !t.completed);
                    break;
                case 'completed':
                    tasksToShow = allTasks.filter(t => t.completed);
                    break;
                 case 'events': // Placeholder
                    tasksToShow = []; // No event tasks for now
                    break;
            }

            // --- 2. Calculate Stats ---
            const uncompletedTasks = tasksToShow.filter(t => !t.completed);
            const tasksToBeCompletedCount = uncompletedTasks.length;
            const completedTasks = tasksToShow.filter(t => t.completed);
            const completedTasksCount = completedTasks.length;

            const estimatedTimeMinutes = uncompletedTasks.reduce((total, task) => total + (task.estimatedMinutes || 0), 0);
            const estimatedHours = Math.floor(estimatedTimeMinutes / 60).toString().padStart(2, '0');
            const estimatedMins = (estimatedTimeMinutes % 60).toString().padStart(2, '0');

            const elapsedTimeMinutes = uncompletedTasks.reduce((total, task) => {
                const session = userSessions.find(s => s.subject === task.title && s.type === 'study');
                return total + (session ? session.durationSeconds / 60 : 0);
            }, 0);
            const elapsedHours = Math.floor(elapsedTimeMinutes / 60).toString().padStart(2, '0');
            const elapsedMins = (elapsedTimeMinutes % 60).toString().padStart(2, '0');
            
            let tasksToRender;
            if (category === 'completed') {
                tasksToRender = tasksToShow;
            } else {
                tasksToRender = plannerState.showCompletedInCategory ? tasksToShow.filter(t => t.completed) : uncompletedTasks;
            }

            // --- 3. Generate HTML ---
            mainContent.innerHTML = `
                <div class="planner-category-view">
                    <header class="category-view-header">
                        <button class="category-back-btn text-gray-400 hover:text-white">
                             <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h2 class="category-view-title">${title}</h2>
                    </header>
                    <div class="category-stats-grid">
                        <div class="category-stat-card">
                            <div class="stat-value">${estimatedHours}:${estimatedMins}</div>
                            <div class="stat-label">Estimated Time</div>
                        </div>
                        <div class="category-stat-card">
                            <div class="stat-value">${tasksToBeCompletedCount}</div>
                            <div class="stat-label">Tasks to be Completed</div>
                        </div>
                        <div class="category-stat-card">
                            <div class="stat-value">${elapsedHours}:${elapsedMins}</div>
                            <div class="stat-label">Elapsed Time</div>
                        </div>
                         <div class="category-stat-card">
                            <div class="stat-value">${completedTasksCount}</div>
                            <div class="stat-label">Completed Tasks</div>
                        </div>
                    </div>
                    <div class="category-add-task-container">
                        <form id="category-add-task-form">
                            <div class="add-task-input-wrapper">
                                <i class="fas fa-plus"></i>
                                <input type="text" id="category-add-task-input" class="category-add-task-input" placeholder="Add a task...">
                            </div>
                        </form>
                    </div>
                    <div class="category-task-list-container no-scrollbar">
                        ${tasksToRender.length > 0 ? tasksToRender.map(task => `
                             <div class="category-task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                                <div class="task-checkbox-category ${task.completed ? 'completed' : ''}"></div>
                                <span class="task-title-category">${task.title}</span>
                                <button class="task-play-btn"><i class="fas fa-play"></i></button>
                            </div>
                        `).join('') : `
                             <div class="no-tasks-placeholder">
                                <i class="fas fa-calendar-check"></i>
                                <h3>No Tasks</h3>
                                <p>Tap the input box above to add a new task.</p>
                            </div>
                        `}
                    </div>
                    ${completedTasks.length > 0 ? `
                        <div class="completed-tasks-toggle">
                            ${plannerState.showCompletedInCategory ? 'Hide' : 'Show'} Completed Tasks <i class="fas fa-chevron-down"></i>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        function renderPlannerTaskItem(task) {
             const priorityColors = { high: 'border-red-500', medium: 'border-yellow-500', low: 'border-blue-500', none: 'border-transparent' };
             const isSelected = plannerState.selectedTaskId === task.id;
             return `
                <div class="task-item flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200 ${priorityColors[task.priority] || 'border-l-transparent'} ${isSelected ? 'bg-blue-900/50' : 'bg-gray-800 hover:bg-gray-700'}" data-task-id="${task.id}">
                    <input type="checkbox" class="task-checkbox-planner w-5 h-5 bg-gray-700 rounded-full text-blue-500 focus:ring-blue-500 mr-4 flex-shrink-0" ${task.completed ? 'checked' : ''} />
                    <span class="flex-grow ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</span>
                    ${task.dueDate?.seconds ? `<span class="text-xs text-gray-400 ml-4">${new Date(task.dueDate.seconds * 1000).toLocaleDateString()}</span>` : ''}
                </div>
             `;
        }

        function renderPlannerBoardView(tasks) {
             const mainContent = document.getElementById('planner-main-content');
             const columns = {
                high: { name: 'High Priority', tasks: [], color: 'bg-red-500' },
                medium: { name: 'Medium Priority', tasks: [], color: 'bg-yellow-500' },
                low: { name: 'Low Priority', tasks: [], color: 'bg-blue-500' },
                none: { name: 'No Priority', tasks: [], color: 'bg-gray-400' },
            };
            tasks.filter(t => !t.completed).forEach(task => (columns[task.priority] || columns.none).tasks.push(task));

            mainContent.innerHTML = `
                <div class="kanban-board">
                    ${Object.entries(columns).map(([key, col]) => `
                        <div class="kanban-column">
                            <h3 class="font-semibold p-2 mb-2 ${col.color} text-white rounded-md">${col.name}</h3>
                            <div class="space-y-2">
                                ${col.tasks.map(task => `
                                    <div class="kanban-card p-3 rounded-md shadow-sm cursor-pointer" data-task-id="${task.id}">
                                        <p>${task.title}</p>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        function renderPlannerCalendarView(tasks) {
            const mainContent = document.getElementById('planner-main-content');
            const { calendarYear, calendarMonth } = plannerState;
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            
            // Calculate calendar grid days
            const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
            const lastDayOfMonth = new Date(calendarYear, calendarMonth + 1, 0);
            const lastDayOfPrevMonth = new Date(calendarYear, calendarMonth, 0);
            
            const daysInMonth = lastDayOfMonth.getDate();
            const startDayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon...
            const endDayOfWeek = lastDayOfMonth.getDay();

            let calendarDays = [];
            // Days from previous month
            for (let i = startDayOfWeek - 1; i >= 0; i--) {
                const day = lastDayOfPrevMonth.getDate() - i;
                const date = new Date(lastDayOfPrevMonth.getFullYear(), lastDayOfPrevMonth.getMonth(), day);
                calendarDays.push({ day, date, isOtherMonth: true });
            }
            // Days of current month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(calendarYear, calendarMonth, day);
                calendarDays.push({ day, date, isOtherMonth: false });
            }
            // Days from next month
            for (let i = 1; i <= 6 - endDayOfWeek; i++) {
                const date = new Date(calendarYear, calendarMonth + 1, i);
                calendarDays.push({ day: i, date, isOtherMonth: true });
            }

            mainContent.innerHTML = `
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-title">${monthNames[calendarMonth]} ${calendarYear}</div>
                        <div class="calendar-nav">
                            <button class="calendar-nav-btn" data-direction="prev"><i class="fas fa-chevron-left"></i></button>
                            <button class="calendar-nav-btn" data-direction="today">Today</button>
                            <button class="calendar-nav-btn" data-direction="next"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                    <div class="calendar-grid">
                        ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => `<div class="calendar-day-header">${day}</div>`).join('')}
                        ${calendarDays.map(({ day, date, isOtherMonth }) => {
                            const today = new Date();
                            const isToday = date.toDateString() === today.toDateString();
                            const tasksForDay = tasks.filter(t => t.dueDate && new Date(t.dueDate.seconds * 1000).toDateString() === date.toDateString());

                            return `
                                <div class="calendar-day-cell ${isOtherMonth ? 'other-month' : ''}" data-date="${date.toISOString().split('T')[0]}">
                                    <div class="day-number ${isToday ? 'today' : ''}">${day}</div>
                                    <div class="calendar-tasks-container">
                                        ${tasksForDay.map(task => `
                                            <div class="calendar-task priority-${task.priority} ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                                                ${task.title}
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        function renderPlannerTaskDetails() {
            const detailsPanel = document.getElementById('planner-task-details');
            if (!detailsPanel) return;

            const selectedTask = plannerState.tasks.find(t => t.id === plannerState.selectedTaskId);
            
            if (!selectedTask) {
                detailsPanel.classList.add('hidden');
                detailsPanel.innerHTML = '';
                return;
            }

            detailsPanel.classList.toggle('open', !!selectedTask);
            detailsPanel.classList.toggle('hidden', !selectedTask);
            
            if (!selectedTask) {
                detailsPanel.innerHTML = '';
                return;
            }

            const listName = selectedTask.listId === 'inbox' ? 'Tasks' : (plannerState.lists.find(l => l.id === selectedTask.listId)?.name || 'Tasks');
            const createdDate = selectedTask.createdAt ? new Date(selectedTask.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) : 'Today';

            const priorityClasses = {
                high: 'text-red-500',
                medium: 'text-yellow-500',
                low: 'text-blue-500',
                none: 'text-gray-400'
            };
            const priority = selectedTask.priority || 'none';
            const repeatText = selectedTask.repeat ? `Repeats ${selectedTask.repeat.type}` : 'None';
            const repeatTextColor = selectedTask.repeat ? 'text-gray-300' : 'text-gray-500';

            detailsPanel.innerHTML = `
                <div class="p-4 h-full flex flex-col bg-gray-800 text-white">
                    <!-- Header -->
                    <div class="flex-shrink-0 flex items-center mb-4">
                        <input type="checkbox" class="task-checkbox-planner w-6 h-6 bg-gray-700 rounded-full text-blue-500 focus:ring-blue-500 mr-4 flex-shrink-0" ${selectedTask.completed ? 'checked' : ''} />
                        
                        <button id="task-detail-start-btn" class="mr-2 text-green-400 hover:text-green-300 transition" title="Start Normal Timer"><i class="fas fa-play"></i></button>
                        
                        <input id="task-detail-title" class="text-xl font-semibold bg-transparent w-full border-none focus:ring-0 p-0" value="${selectedTask.title}">
                        
                        <div class="relative">
                            <button id="task-detail-priority-btn" class="${priorityClasses[priority]} hover:opacity-80 transition" title="Set Priority">
                                <i class="fas fa-flag"></i>
                            </button>
                            <div id="task-priority-menu" class="hidden absolute right-0 mt-2 w-32 bg-gray-700 rounded-md shadow-lg z-10">
                                <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" data-priority="high">High</a>
                                <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" data-priority="medium">Medium</a>
                                <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" data-priority="low">Low</a>
                                <a href="#" class="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-600" data-priority="none">None</a>
                            </div>
                        </div>

                        <button id="close-task-details" class="ml-2 p-1 rounded-full hover:bg-gray-700">&times;</button>
                    </div>
                    
                    <!-- Main Content -->
                    <div class="flex-grow overflow-y-auto pr-2 text-sm">
                        <button class="border border-gray-600 rounded-full px-3 py-1 text-gray-400 mb-4 hover:bg-gray-700">+ Tags</button>
                        
                        <div class="space-y-3">
                             <div id="task-detail-pomodoro-btn" class="flex items-center cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-700 transition" title="Start Pomodoro Timer">
                                <i class="fas fa-stopwatch text-gray-400 w-6 text-center mr-3"></i>
                                <span>Pomodoro</span>
                                <div class="ml-auto text-right">
                                    <span class="text-green-400">0 / 0</span>
                                    <p class="text-xs text-gray-500">= 25m</p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-calendar-day text-gray-400 w-6 text-center mr-3"></i>
                                <span>Due Date</span>
                                <input type="date" id="task-detail-due-date" class="ml-auto bg-transparent text-right p-0 border-none focus:ring-0" value="${selectedTask.dueDate ? new Date(selectedTask.dueDate.seconds * 1000).toISOString().split('T')[0] : ''}">
                            </div>
                             <div id="task-detail-project-btn" class="flex items-center cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-700 transition">
                                <i class="fas fa-tasks text-gray-400 w-6 text-center mr-3"></i>
                                <span>Project</span>
                                <span class="ml-auto text-gray-300">${listName}</span>
                            </div>
                            <div class="flex items-center">
                                <i class="fas fa-bell text-gray-400 w-6 text-center mr-3"></i>
                                <span>Reminder</span>
                                <span class="ml-auto text-gray-500">None</span>
                            </div>
                            <div id="task-detail-repeat-btn" class="flex items-center cursor-pointer p-2 -ml-2 rounded-lg hover:bg-gray-700 transition">
                                <i class="fas fa-redo text-gray-400 w-6 text-center mr-3"></i>
                                <span>Repeat</span>
                                <span class="ml-auto ${repeatTextColor}">${repeatText}</span>
                            </div>
                            <div class="flex items-center text-gray-400">
                                <i class="fas fa-plus w-6 text-center mr-3"></i>
                                <input class="bg-transparent w-full border-none p-0 focus:ring-0" placeholder="Add a subtask...">
                            </div>
                        </div>

                        <textarea id="task-detail-notes" class="w-full bg-transparent p-0 mt-4 h-24 border-none focus:ring-0" placeholder="Add a note...">${selectedTask.notes || ''}</textarea>
                    </div>

                    <!-- Footer -->
                    <div class="flex-shrink-0 pt-2 flex justify-between items-center text-xs text-gray-500">
                        <button><i class="fas fa-arrow-left"></i></button>
                        <span>Created on ${createdDate}</span>
                        <button id="delete-task-btn" class="text-gray-400 hover:text-red-500 text-base"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `;
        }

        async function addPlannerTask(title, dueDateStr = null) {
            if (!currentUser || !title.trim()) return;
            const currentList = plannerState.lists.find(l => l.id === plannerState.activeListId) || { members: [currentUser.uid] };
            
            try {
                await addDoc(collection(db, `/artifacts/${appId}/public/data/tasks`), {
                    title: title.trim(),
                    completed: false,
                    priority: 'none',
                    listId: plannerState.activeListId,
                    createdAt: serverTimestamp(),
                    createdBy: currentUser.uid,
                    members: currentList.members || [currentUser.uid],
                    notes: '',
                    subtasks: [],
                    tags: [],
                    dueDate: dueDateStr ? new Date(dueDateStr + 'T00:00:00') : null,
                });
            } catch (error) {
                console.error("Error adding task:", error);
                showToast("Failed to add task.", "error");
            }
        }
        
        async function updatePlannerTask(taskId, data) {
            if (!currentUser || !taskId) return;
            const taskRef = doc(db, `/artifacts/${appId}/public/data/tasks`, taskId);
            try {
                await updateDoc(taskRef, data);
            } catch (error) {
                console.error("Error updating task:", error);
                showToast("Failed to update task.", "error");
            }
        }

        async function deletePlannerTask(taskId) {
            if (!currentUser || !taskId) return;
            const taskRef = doc(db, `/artifacts/${appId}/public/data/tasks`, taskId);
            try {
                await deleteDoc(taskRef);
                plannerState.selectedTaskId = null;
                renderPlannerTaskDetails(); // Hide the panel
            } catch (error) {
                console.error("Error deleting task:", error);
                showToast("Failed to delete task.", "error");
            }
        }
        
        // =================================================================================
        // ============================= NEW PLANNER LOGIC END =============================
        // =================================================================================
        
        function renderGroupStudiconView() {
            const container = document.getElementById('group-detail-content');
            if (!container) return;

            // Use Object.entries to get member ID
            const membersArray = Object.entries(groupRealtimeData.members).map(([uid, data]) => ({ uid, ...data })).sort((a, b) => {
                const aIsStudying = !!a.studying;
                const bIsStudying = !!b.studying;
                if (aIsStudying !== bIsStudying) {
                    return aIsStudying ? -1 : 1;
                }
                return (a.username || '').localeCompare(b.username || '');
            });
            
            const todayStr = getCurrentDate().toISOString().split('T')[0];
            
            const studyingCount = membersArray.filter(m => !!m.studying).length;
            const totalMembers = membersArray.length;

            container.innerHTML = `
                <div class="p-4">
                    <div class="text-center mb-6 bg-gray-800 p-3 rounded-lg">
                        <p class="text-2xl font-bold text-cyan-400">${studyingCount} / ${totalMembers}</p>
                        <p class="text-sm text-gray-400">Members Currently Studying</p>
                    </div>
                    <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        ${membersArray.map(member => {
                            const isStudying = !!member.studying;
                            const studiconUrl = member.studiconURL || 'https://api.dicebear.com/8.x/miniavs/svg?seed=Angel';

                            // --- NEW: Calculate total time today for display ---
                            let totalTodaySeconds = 0;
                            if (member.totalTimeToday && member.totalTimeToday.date === todayStr) {
                                totalTodaySeconds = member.totalTimeToday.seconds || 0;
                            }
                            const currentSessionElapsed = (isStudying && member.studying.type === 'study' && member.studying.startTime) 
                                ? (Date.now() - member.studying.startTime.toDate()) / 1000 
                                : 0;
                            const effectiveTotalToday = totalTodaySeconds + currentSessionElapsed;
                            // --- END NEW ---

                            return `
                                <div class="text-center cursor-pointer studicon-member-card" data-user-id="${member.uid}">
                                    <div class="relative w-20 h-20 mx-auto">
                                        <div class="member-avatar ${isStudying ? 'studying' : ''} w-full h-full">
                                            <img src="${studiconUrl}" class="w-full h-full object-cover rounded-full pointer-events-none">
                                            ${isStudying ? '<div class="member-status-icon"></div>' : ''}
                                        </div>
                                    </div>
                                    <p class="mt-2 text-sm font-semibold truncate text-white pointer-events-none">${member.username || 'Anonymous'}</p>
                                    <p class="text-lg font-bold text-cyan-400 pointer-events-none">${formatTime(effectiveTotalToday)}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
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
                    case 'monthly': // Last 30 days
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - 30);
                        break;
                    case 'weekly': // Last 7 days
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
                    // Only count study sessions for ranking
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

            const userScores = await Promise.all(userPromises);
            userScores.sort((a, b) => b.totalStudySeconds - a.totalStudySeconds);

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
            if (!insightsContainer) return;
            
            insightsContainer.innerHTML = `
                <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 class="text-4xl font-bold text-white">Study Insights</h1>
                        <p class="text-slate-400 mt-1">Welcome back, let's analyze your progress.</p>
                    </div>
                    <!-- Added wrapper div for horizontal scrolling on small screens -->
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
                    <div id="day-view" class="view active grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Content for Day view will be injected by renderDayView -->
                    </div>
                    <div id="trend-view" class="view grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <!-- Content for Trend view will be injected by renderTrendView -->
                    </div>
                    <div id="month-view" class="view grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Content for Month view will be injected by renderMonthView -->
                    </div>
                    <div id="period-view" class="view grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <!-- Content for Period view will be injected by renderPeriodView -->
                    </div>
                </main>
            `;
            
            initializeDashboard(focusSessions, insightsContainer);
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }

        function initializeDashboard(focusSessions, insightsContainer) {
            const today = getCurrentDate(); 

            const appData = focusSessions.map(session => {
                const endTime = session.endedAt;
                if (!endTime) return null;
                const startTime = new Date(endTime.getTime() - session.durationSeconds * 1000);
                return {
                    id: session.id,
                    subject: session.subject,
                    startTime: startTime,
                    endTime: endTime,
                    duration: session.durationSeconds / 60, // in minutes
                    durationSeconds: session.durationSeconds,
                    type: session.type || 'study' // Default to 'study' if type is missing
                };
            }).filter(Boolean);

            appData.sort((a, b) => a.startTime - b.startTime);

            let charts = {};
            
            const formatTimeDashboard = (minutes) => {
                if (isNaN(minutes) || minutes < 0) return '00:00:00';
                const hours = Math.floor(minutes / 60);
                const mins = Math.floor(minutes % 60);
                const secs = Math.floor((minutes * 60) % 60);
                return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            };
            
            const CHART_COLORS = { cyan: 'rgba(34, 211, 238, 0.6)', sky: 'rgba(56, 189, 248, 0.6)', indigo: 'rgba(129, 140, 248, 0.6)', pink: 'rgba(244, 114, 182, 0.6)', orange: 'rgba(251, 146, 60, 0.6)', };
            const CHART_BORDERS = { cyan: 'rgba(34, 211, 238, 1)', sky: 'rgba(56, 189, 248, 1)', indigo: 'rgba(129, 140, 248, 1)', pink: 'rgba(244, 114, 182, 1)', orange: 'rgba(251, 146, 60, 1)', };

            const destroyChart = (chartId) => {
                if (charts[chartId]) {
                    charts[chartId].destroy();
                    delete charts[chartId];
                }
            };

            function generateAIInsight(sessions, elementId = 'ai-insight-text') {
                const insightTextEl = document.getElementById(elementId);
                if (!insightTextEl) return;

                if (sessions.length < 3) {
                    insightTextEl.textContent = "Start logging more sessions to unlock personalized insights!";
                    return;
                }

                const insightFunctions = [
                    () => {
                        const subjectTotals = sessions.filter(s => s.type === 'study').reduce((acc, s) => {
                            acc[s.subject] = (acc[s.subject] || 0) + s.duration;
                            return acc;
                        }, {});
                        const topSubject = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])[0];
                        if (topSubject && topSubject[1] > 60) {
                            return `You're putting a lot of effort into '${topSubject[0]}'. Keep up the great work!`;
                        }
                        return null;
                    },
                    () => {
                        const subjectTotals = sessions.filter(s => s.type === 'study').reduce((acc, s) => {
                            acc[s.subject] = (acc[s.subject] || 0) + s.duration;
                            return acc;
                        }, {});
                        const sortedSubjects = Object.entries(subjectTotals).sort((a, b) => a[1] - b[1]);
                        if (sortedSubjects.length > 1) {
                            const leastStudied = sortedSubjects[0];
                            const mostStudied = sortedSubjects[sortedSubjects.length - 1];
                            if (mostStudied[1] > leastStudied[1] * 3) {
                                 return `Don't forget to give some attention to '${leastStudied[0]}'. A quick review could be beneficial.`;
                            }
                        }
                        return null;
                    },
                    () => {
                        const hourlyTotals = Array(24).fill(0);
                        sessions.filter(s => s.type === 'study').forEach(s => {
                            const startHour = s.startTime.getHours();
                            hourlyTotals[startHour] += s.duration;
                        });
                        const peakHour = hourlyTotals.indexOf(Math.max(...hourlyTotals));
                        let timeOfDay = '';
                        if (peakHour >= 5 && peakHour < 12) timeOfDay = 'in the morning';
                        else if (peakHour >= 12 && peakHour < 17) timeOfDay = 'in the afternoon';
                        else if (peakHour >= 17 && peakHour < 21) timeOfDay = 'in the evening';
                        else timeOfDay = 'late at night';
                        return `You seem to be most productive ${timeOfDay}. Plan your key tasks accordingly!`;
                    },
                     () => {
                        const avgDuration = sessions.filter(s => s.type === 'study').reduce((sum, s) => sum + s.duration, 0) / sessions.filter(s => s.type === 'study').length;
                        if (avgDuration > 90) {
                            return "You're tackling long study sessions! Remember that short breaks can boost long-term focus.";
                        }
                        if (avgDuration < 25) {
                            return "Your sessions are short and sharp. For deeper topics, try a longer, uninterrupted block of time.";
                        }
                        return null;
                    },
                    () => {
                        const last7Days = new Set();
                        sessions.filter(s => s.type === 'study').forEach(s => {
                            const diffDays = (new Date() - s.startTime) / (1000 * 60 * 60 * 24);
                            if (diffDays <= 7) {
                                last7Days.add(s.startTime.getDay());
                            }
                        });
                        if (last7Days.size >= 5) {
                            return "Amazing consistency this week! You've studied on " + last7Days.size + " different days.";
                        }
                        if (last7Days.size > 0 && last7Days.size < 3) {
                             return "Building a consistent habit is key. Try to schedule short sessions every day.";
                        }
                        return null;
                    }
                ];

                let insight = null;
                let attempts = 0;
                while (insight === null && attempts < 5) {
                    const randomIndex = Math.floor(Math.random() * insightFunctions.length);
                    insight = insightFunctions[randomIndex]();
                    attempts++;
                }

                if (insight === null) {
                    // Fallback insight if no specific pattern is found
                    const subjectTotals = sessions.filter(s => s.type === 'study').reduce((acc, s) => {
                        acc[s.subject] = (acc[s.subject] || 0) + s.duration;
                        return acc;
                    }, {});
                    const topSubject = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])[0];
                    if (topSubject) {
                        insight = `You've been focusing well on '${topSubject[0]}'. Consistency is building!`;
                    } else {
                        insight = "Keep up the great work! More sessions will unlock deeper insights.";
                    }
                }

                if (insight === null) {
                    // Fallback insight if no specific pattern is found
                    const studySessions = sessions.filter(s => s.type === 'study');
                    if (studySessions.length > 0) {
                        const subjectTotals = studySessions.reduce((acc, s) => {
                            acc[s.subject] = (acc[s.subject] || 0) + s.duration;
                            return acc;
                        }, {});
                        const topSubject = Object.entries(subjectTotals).sort((a, b) => b[1] - a[1])[0];
                        if (topSubject) {
                            insight = `You've been focusing well on '${topSubject[0]}'. Consistency is building!`;
                        } else {
                            insight = "Keep up the great work! More sessions will unlock deeper insights.";
                        }
                    } else {
                        insight = "Log some study sessions to see your personalized AI insights here!";
                    }
                }
                insightTextEl.textContent = insight;
            }

            function renderPeriodView() {
                const container = document.getElementById('period-view');
                container.innerHTML = `
                    <div class="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Total Time</h3><p id="period-total-time" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                        <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Daily Average</h3><p id="period-daily-avg" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                        <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Focus Score</h3><p id="period-focus-score" class="text-4xl font-bold text-cyan-400 mt-2">--</p></div>
                        <div class="card bg-gradient-to-br from-sky-500 to-indigo-600 p-6"><h3 class="text-white text-lg font-medium flex items-center"><i data-lucide="brain-circuit" class="mr-2"></i>AI Insight</h3><p id="ai-insight-text" class="text-white mt-2 text-sm">Analyzing your study patterns...</p></div>
                    </div>
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Subject Ratio</h3><div class="chart-container" style="height: 250px;"><canvas id="subject-ratio-chart"></canvas></div></div>
                    <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Time Per Day (Last 28 Days)</h3><div class="chart-container"><canvas id="time-per-day-chart"></canvas></div></div>
                    <div class="card lg:col-span-3"><h3 class="font-semibold text-xl mb-4">Cumulative Study Time</h3><div class="chart-container"><canvas id="cumulative-time-chart"></canvas></div></div>
                `;
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                const last28DaysData = appData.filter(d => {
                    const diffDays = (today - d.startTime) / (1000 * 60 * 60 * 24);
                    return diffDays <= 28 && d.type === 'study'; // Only consider study time
                });

                const totalMinutes = last28DaysData.reduce((sum, s) => sum + s.duration, 0);
                const dailyAverage = totalMinutes / 28;
                const focusScore = last28DaysData.length > 0 ? Math.round((totalMinutes / last28DaysData.length) / 60 * 100) : 0; // Avoid division by zero

                document.getElementById('period-total-time').textContent = formatTimeDashboard(totalMinutes);
                document.getElementById('period-daily-avg').textContent = formatTimeDashboard(dailyAverage);
                document.getElementById('period-focus-score').textContent = isNaN(focusScore) ? '0' : focusScore;

                const subjectData = last28DaysData.reduce((acc, session) => {
                    acc[session.subject] = (acc[session.subject] || 0) + session.duration;
                    return acc;
                }, {});
                destroyChart('subject-ratio-chart');
                charts['subject-ratio-chart'] = new Chart(document.getElementById('subject-ratio-chart'), {
                    type: 'doughnut', plugins: [ChartDataLabels],
                    data: { labels: Object.keys(subjectData), datasets: [{ data: Object.values(subjectData), backgroundColor: Object.values(CHART_COLORS), borderColor: '#1e293b', borderWidth: 4, }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } }, tooltip: { callbacks: { label: function(context) { const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = ((context.parsed / total) * 100).toFixed(1) + '%'; return `${context.label}: ${percentage}`; } } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (value * 100 / sum).toFixed(1) + "%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
                });

                const timePerDay = Array(28).fill(0);
                appData.filter(d => d.type === 'study').forEach(s => { // Only consider study time
                    const dayIndex = 27 - Math.floor((today - s.startTime) / (1000 * 60 * 60 * 24));
                    if (dayIndex >= 0 && dayIndex < 28) { timePerDay[dayIndex] += s.duration; }
                });
                const labels28Days = Array.from({length: 28}, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return d; });
                destroyChart('time-per-day-chart');
                charts['time-per-day-chart'] = new Chart(document.getElementById('time-per-day-chart'), {
                    type: 'bar',
                    data: { labels: labels28Days.map(d => `${d.getMonth()+1}/${d.getDate()}`), datasets: [{ label: 'Minutes Studied', data: timePerDay, backgroundColor: CHART_COLORS.sky, borderColor: CHART_BORDERS.sky, borderWidth: 1, borderRadius: 5, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', maxRotation: 90, minRotation: 45 } } }, plugins: { legend: { display: false } } }
                });
                
                let cumulativeTotal = 0;
                const cumulativeData = timePerDay.map(d => cumulativeTotal += d);
                destroyChart('cumulative-time-chart');
                charts['cumulative-time-chart'] = new Chart(document.getElementById('cumulative-time-chart'), {
                    type: 'line',
                    data: { labels: labels28Days.map(d => `${d.getMonth()+1}/${d.getDate()}`), datasets: [{ label: 'Cumulative Minutes', data: cumulativeData, fill: true, backgroundColor: CHART_COLORS.cyan, borderColor: CHART_BORDERS.cyan, tension: 0.4, pointRadius: 0, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
                });
                generateAIInsight(last28DaysData);
            }

            function renderMonthView() {
                const container = document.getElementById('month-view');
                container.innerHTML = `
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Study vs. Break</h3><div class="chart-container"><canvas id="study-break-chart"></canvas></div></div>
                    <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Study Time by Subject (This Month)</h3><div class="chart-container"><canvas id="study-time-by-subject-chart"></canvas></div></div>
                    <div class="card lg:col-span-3"><h3 class="font-semibold text-xl mb-4">Start/End Time Distribution</h3><div class="chart-container"><canvas id="start-end-distribution-chart"></canvas></div></div>
                `;

                const thisMonthData = appData.filter(d => d.startTime.getMonth() === today.getMonth() && d.startTime.getFullYear() === today.getFullYear());
                
                const totalStudy = thisMonthData.filter(s => s.type === 'study').reduce((sum, s) => sum + s.duration, 0);
                const totalBreaks = thisMonthData.filter(s => s.type === 'break').reduce((sum, s) => sum + s.duration, 0);

                destroyChart('study-break-chart');
                charts['study-break-chart'] = new Chart(document.getElementById('study-break-chart'), {
                    type: 'doughnut', plugins: [ChartDataLabels],
                    data: { labels: ['Study', 'Break'], datasets: [{ data: [totalStudy, totalBreaks], backgroundColor: [CHART_COLORS.indigo, '#475569'], borderColor: '#1e293b', borderWidth: 4, }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#cbd5e1' } }, tooltip: { callbacks: { label: function(context) { const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (total > 0) ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%'; return `${context.label}: ${percentage}`; } } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (sum > 0) ? (value * 100 / sum).toFixed(1) + "%" : "0%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
                });

                const subjectDataMonth = thisMonthData.filter(s => s.type === 'study').reduce((acc, session) => { acc[session.subject] = (acc[session.subject] || 0) + session.duration; return acc; }, {});
                destroyChart('study-time-by-subject-chart');
                charts['study-time-by-subject-chart'] = new Chart(document.getElementById('study-time-by-subject-chart'), {
                    type: 'bar',
                    data: { labels: Object.keys(subjectDataMonth), datasets: [{ label: 'Minutes Studied', data: Object.values(subjectDataMonth), backgroundColor: Object.values(CHART_COLORS), }] },
                    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
                });

                const distributionData = thisMonthData.filter(s => s.type === 'study').map(s => ({ x: s.startTime, y: s.startTime.getHours() + s.startTime.getMinutes() / 60, yEnd: s.endTime.getHours() + s.endTime.getMinutes() / 60, }));
                destroyChart('start-end-distribution-chart');
                charts['start-end-distribution-chart'] = new Chart(document.getElementById('start-end-distribution-chart'), {
                    type: 'scatter',
                    data: { datasets: [{ label: 'Start Time', data: distributionData.map(d => ({x: d.x, y: d.y})), backgroundColor: CHART_COLORS.sky, }, { label: 'End Time', data: distributionData.map(d => ({x: d.x, y: d.yEnd})), backgroundColor: CHART_COLORS.pink, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'day' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { beginAtZero: true, max: 24, grid: { color: '#334155' }, ticks: { color: '#94a3b8', stepSize: 2, callback: (v) => `${v}:00` } } }, plugins: { legend: { labels: { color: '#cbd5e1' } } } }
                });
            }

            function renderTrendView() {
                const container = document.getElementById('trend-view');
                container.innerHTML = `
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Study Time Regularity</h3><div class="chart-container"><canvas id="regularity-chart"></canvas></div></div>
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Performance Forecast</h3><div class="chart-container"><canvas id="forecast-chart"></canvas></div></div>
                    <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Recent Session Log</h3><div id="session-log-container-trend" class="max-h-80 overflow-y-auto pr-2"></div></div>
                `;

                const regularityData = appData.filter(s => s.type === 'study').slice(-50).map(s => ({ x: s.startTime, y: s.startTime.getHours() + s.startTime.getMinutes() / 60, r: s.duration / 10 }));
                destroyChart('regularity-chart');
                charts['regularity-chart'] = new Chart(document.getElementById('regularity-chart'), {
                    type: 'bubble',
                    data: { datasets: [{ label: 'Study Session', data: regularityData, backgroundColor: CHART_COLORS.indigo, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'day' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { min: 6, max: 24, grid: { color: '#334155' }, ticks: { color: '#94a3b8', stepSize: 3, callback: (v) => `${v}:00` } } }, plugins: { legend: { display: false } } }
                });
                
                const last14Days = Array(14).fill(0);
                appData.filter(d => (today - d.startTime) / (1000 * 60 * 60 * 24) <= 14 && d.type === 'study').forEach(s => {
                    const dayIndex = 13 - Math.floor((today - s.startTime) / (1000 * 60 * 60 * 24));
                    if (dayIndex >= 0) last14Days[dayIndex] += s.duration;
                });
                const avgLast14 = last14Days.reduce((a, b) => a + b, 0) / 14;
                const forecastData = Array.from({length: 7}, (_, i) => avgLast14 * (i + 1) + last14Days.reduce((a, b) => a + b, 0));
                const forecastLabels = Array.from({length: 7}, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return `${d.getMonth()+1}/${d.getDate()}`; });
                
                destroyChart('forecast-chart');
                charts['forecast-chart'] = new Chart(document.getElementById('forecast-chart'), {
                    type: 'line',
                    data: { labels: forecastLabels, datasets: [{ label: 'Projected Study Minutes', data: forecastData, borderColor: CHART_BORDERS.orange, backgroundColor: CHART_COLORS.orange, borderDash: [5, 5], tension: 0.2, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
                });
                
                renderSessionLog(appData.filter(s => s.type === 'study').slice().reverse().slice(0, 20), 'session-log-container-trend');
            }
            
            function renderDayView() {
                const container = document.getElementById('day-view');
                container.innerHTML = `
                    <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Total Time Today</h3><p id="day-total-time" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                         <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Sessions Today</h3><p id="day-session-count" class="text-4xl font-bold text-cyan-400 mt-2">--</p></div>
                         <div class="card flex flex-col justify-center items-center p-6"><h3 class="text-slate-400 text-lg font-medium">Avg. Session</h3><p id="day-avg-session" class="text-4xl font-bold text-cyan-400 mt-2">--m</p></div>
                         <div class="card bg-gradient-to-br from-sky-500 to-indigo-600 p-6"><h3 class="text-white text-lg font-medium flex items-center"><i data-lucide="brain-circuit" class="mr-2"></i>AI Insight</h3><p id="day-ai-insight-text" class="text-white mt-2 text-sm">Analyzing today's patterns...</p></div>
                    </div>
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Today's Subject Ratio</h3><div class="chart-container" style="height:250px;"><canvas id="day-subject-ratio-chart"></canvas></div></div>
                    <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Time Per Hour Today</h3><div class="chart-container"><canvas id="day-time-per-hour-chart"></canvas></div></div>
                    <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Today's Session Log</h3><div id="session-log-container-day" class="max-h-80 overflow-y-auto pr-2"></div></div>
                `;

                const todayStr = today.toISOString().split('T')[0];
                const todayData = appData.filter(d => d.startTime.toISOString().split('T')[0] === todayStr && d.type === 'study'); // Only consider study time

                const totalMinutesToday = todayData.reduce((sum, s) => sum + s.duration, 0);
                const sessionCountToday = todayData.length;
                const avgSessionMinutes = sessionCountToday > 0 ? totalMinutesToday / sessionCountToday : 0;

                document.getElementById('day-total-time').textContent = formatTimeDashboard(totalMinutesToday);
                document.getElementById('day-session-count').textContent = sessionCountToday;
                document.getElementById('day-avg-session').textContent = `${avgSessionMinutes.toFixed(0)}m`;
                
                generateAIInsight(todayData, 'day-ai-insight-text');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }

                const subjectDataToday = todayData.reduce((acc, session) => {
                    acc[session.subject] = (acc[session.subject] || 0) + session.duration;
                    return acc;
                }, {});
                destroyChart('day-subject-ratio-chart');
                charts['day-subject-ratio-chart'] = new Chart(document.getElementById('day-subject-ratio-chart'), {
                    type: 'pie', plugins: [ChartDataLabels],
                    data: { labels: Object.keys(subjectDataToday), datasets: [{ data: Object.values(subjectDataToday), backgroundColor: Object.values(CHART_COLORS), borderColor: '#1e293b', borderWidth: 4, }] },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (value * 100 / sum).toFixed(0) + "%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
                });

                const timePerHour = Array(24).fill(0);
                todayData.forEach(s => {
                    const hour = s.startTime.getHours();
                    timePerHour[hour] += s.duration;
                });
                const hourLabels = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
                destroyChart('day-time-per-hour-chart');
                charts['day-time-per-hour-chart'] = new Chart(document.getElementById('day-time-per-hour-chart'), {
                    type: 'bar',
                    data: { labels: hourLabels, datasets: [{ label: 'Minutes Studied', data: timePerHour, backgroundColor: CHART_COLORS.sky, borderRadius: 5, }] },
                    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', maxRotation: 90, minRotation: 45 } } }, plugins: { legend: { display: false } } }
                });

                renderSessionLog(todayData.slice().reverse(), 'session-log-container-day');
            }

            function renderSessionLog(sessions, containerId) {
                const logContainer = document.getElementById(containerId);
                if (!logContainer) return;

                logContainer.innerHTML = '';
                sessions.forEach(s => {
                    const item = document.createElement('div');
                    item.className = 'session-log-item p-3 mb-2 bg-slate-700/50 rounded-lg flex justify-between items-center';
                    item.innerHTML = `
                        <div>
                            <p class="font-semibold text-white">${s.subject} <span class="text-sm text-gray-500">(${s.type})</span></p>
                            <p class="text-sm text-slate-400">${s.startTime.toLocaleString()}</p>
                        </div>
                        <div class="flex items-center">
                            <div class="text-lg font-bold text-sky-400 mr-4">${s.duration.toFixed(0)} min</div>
                            <button class="log-options-btn p-2 rounded-full hover:bg-slate-600" data-session-id="${s.id}" data-duration-seconds="${s.durationSeconds}" data-ended-at="${s.endTime.toISOString()}">
                                <i data-lucide="more-vertical" class="w-5 h-5 pointer-events-none"></i>
                            </button>
                            <div class="log-options-menu">
                                <button class="log-edit-btn">Edit</button>
                                <button class="log-delete-btn">Delete</button>
                            </div>
                        </div>
                    `;
                    logContainer.appendChild(item);
                });
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }

            const navBar = insightsContainer.querySelector('#dashboard-nav-bar');
            const views = insightsContainer.querySelectorAll('.view');
            const navButtons = navBar.querySelectorAll('.nav-btn');

            navBar.addEventListener('click', (e) => {
                if (e.target.tagName === 'BUTTON') {
                    const viewName = e.target.dataset.view;
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    e.target.classList.add('active');
                    views.forEach(view => {
                        view.classList.remove('active');
                        if (view.id === `${viewName}-view`) { view.classList.add('active'); }
                    });
                    switch (viewName) {
                        case 'day': renderDayView(); break;
                        case 'trend': renderTrendView(); break;
                        case 'month': renderMonthView(); break;
                        case 'period': renderPeriodView(); break;
                    }
                }
            });

            document.getElementById('insights-container').addEventListener('click', e => {
                const optionsBtn = e.target.closest('.log-options-btn');
                if (optionsBtn) {
                    const menu = optionsBtn.nextElementSibling;
                    document.querySelectorAll('.log-options-menu').forEach(m => {
                        if (m !== menu) m.classList.remove('active');
                    });
                    menu.classList.toggle('active');
                    return;
                }

                const deleteBtn = e.target.closest('.log-delete-btn');
                if(deleteBtn) {
                    const sessionItem = deleteBtn.closest('.session-log-item').querySelector('.log-options-btn');
                    const sessionId = sessionItem.dataset.sessionId;
                    const duration = parseInt(sessionItem.dataset.durationSeconds, 10);
                    const endedAt = new Date(sessionItem.dataset.endedAt);
                    
                    showConfirmationModal('Delete Session?', 'Are you sure you want to permanently delete this study session?', () => {
                        deleteSession(sessionId, duration, endedAt);
                    });
                }

                 const editBtn = e.target.closest('.log-edit-btn');
                    if(editBtn) {
                        const sessionItem = editBtn.closest('.session-log-item').querySelector('.log-options-btn');
                        const sessionId = sessionItem.dataset.sessionId;
                        const durationSeconds = parseInt(sessionItem.dataset.durationSeconds, 10);
                        const endedAt = sessionItem.dataset.endedAt;

                        const modal = document.getElementById('edit-session-modal');
                        document.getElementById('edit-session-id').value = sessionId;
                        document.getElementById('edit-session-duration').value = Math.round(durationSeconds / 60);
                        document.getElementById('edit-session-old-duration').value = durationSeconds;
                        document.getElementById('edit-session-ended-at').value = endedAt;
                        modal.classList.add('active');
                    }
            });

            // Initial render
            const initialActiveView = insightsContainer.querySelector('.nav-btn.active').dataset.view;
            if (initialActiveView === 'day') {
                renderDayView();
            } else {
                renderTrendView();
            }
        }
        
        async function deleteSession(sessionId, durationSeconds, endedAt) {
            if (!currentUser || !sessionId) return;
            
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
            const sessionRef = doc(userRef, 'sessions', sessionId);

            try {
                // Determine if the session being deleted is a study or break session
                const sessionDoc = await getDoc(sessionRef);
                const sessionType = sessionDoc.exists() ? sessionDoc.data().type || 'study' : 'study'; // Default to 'study' if type is missing

                await deleteDoc(sessionRef);

                if (sessionType === 'study') {
                    await updateDoc(userRef, { totalStudySeconds: increment(-durationSeconds) });
                    await updateDoc(publicUserRef, { totalStudySeconds: increment(-durationSeconds) });
                } else { // 'break'
                    await updateDoc(userRef, { totalBreakSeconds: increment(-durationSeconds) });
                    await updateDoc(publicUserRef, { totalBreakSeconds: increment(-durationSeconds) });
                }

                const sessionDateStr = endedAt.toISOString().split('T')[0];
                const todayStr = getCurrentDate().toISOString().split('T')[0];
                if (sessionDateStr === todayStr) {
                    if (sessionType === 'study') {
                        totalTimeTodayInSeconds -= durationSeconds;
                        if (totalTimeTodayInSeconds < 0) totalTimeTodayInSeconds = 0;
                        await updateDoc(userRef, {
                            totalTimeToday: {
                                date: todayStr,
                                seconds: totalTimeTodayInSeconds
                            }
                        });
                    } else { // 'break'
                        totalBreakTimeTodayInSeconds -= durationSeconds;
                        if (totalBreakTimeTodayInSeconds < 0) totalBreakTimeTodayInSeconds = 0;
                        await updateDoc(userRef, {
                            totalBreakTimeToday: {
                                date: todayStr,
                                seconds: totalBreakTimeTodayInSeconds
                            }
                        });
                    }
                }
                
                showToast("Session deleted successfully", "success");
            } catch (error) {
                console.error("Error deleting session:", error);
                showToast("Failed to delete session.", "error");
            }
        }

        async function renderJoinedGroups() {
            if (!currentUser) return;
            const container = document.getElementById('my-groups-list');
            if (!container) return;
            
            container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';

            const joinedGroupIds = currentUserData.joinedGroups || [];
            
            if (joinedGroupIds.length === 0) {
                container.innerHTML = `<div class="empty-group"><i class="fas fa-users-slash"></i><h3>No Groups Joined Yet</h3><p>You haven't joined any study groups. Join a group or create your own to get started!</p><button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition mt-4" id="explore-groups-btn">Explore Groups</button></div>`;
                return;
            }
            
            const todayStr = getCurrentDate().toISOString().split('T')[0];

            const groupsQuery = query(collection(db, 'artifacts', appId, 'public', 'data', 'groups'), where('__name__', 'in', joinedGroupIds));
            const snapshot = await getDocs(groupsQuery);
            
            const groupPromises = snapshot.docs.map(async (groupDoc) => {
                const group = { id: groupDoc.id, ...groupDoc.data() };
                const members = group.members || [];
                if (members.length === 0) {
                    return { ...group, attendance: 0, avgTime: 0, newMessages: 0 };
                }

                // Fetch member data and their sessions for today
                let totalSecondsToday = 0;
                let membersStudiedToday = 0;
                const memberPromises = members.map(async (memberId) => {
                    const userDocRef = doc(db, 'artifacts', appId, 'users', memberId);
                    const userSnap = await getDoc(userDocRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        if (userData.totalTimeToday && userData.totalTimeToday.date === todayStr) {
                            const memberSeconds = userData.totalTimeToday.seconds || 0;
                            if (memberSeconds > 0) {
                                membersStudiedToday++;
                            }
                            totalSecondsToday += memberSeconds;
                        }
                    }
                });
                await Promise.all(memberPromises);

                // Fetch new messages (in the last 24 hours)
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const messagesRef = collection(groupDoc.ref, 'messages');
                const newMessagesQuery = query(messagesRef, where('timestamp', '>=', twentyFourHoursAgo));
                const newMessagesSnap = await getDocs(newMessagesQuery);

                const attendance = members.length > 0 ? Math.round((membersStudiedToday / members.length) * 100) : 0;
                const avgTime = members.length > 0 ? totalSecondsToday / members.length : 0;
                
                return { ...group, attendance, avgTime, newMessages: newMessagesSnap.size };
            });

            const groupsWithRealtimeData = await Promise.all(groupPromises);

            container.innerHTML = '<div class="space-y-4">' + groupsWithRealtimeData.map(group => {
                const memberCount = group.members ? group.members.length : 0;
                return `
                <div class="group-card bg-gray-800 rounded-2xl overflow-hidden shadow-lg cursor-pointer" data-group-id="${group.id}">
                    <div class="p-5">
                        <div class="flex justify-between items-start">
                            <div>
                                <div class="text-xs uppercase text-blue-400 font-semibold">${group.category}</div>
                                <h3 class="text-xl font-bold text-white truncate">${group.name}</h3>
                                <div class="text-sm text-gray-400 mt-1">Goal: ${group.timeGoal} hours/day</div>
                            </div>
                            <div class="text-xs text-gray-500 text-right flex-shrink-0 ml-2">
                                Leader: ${group.leaderName}
                            </div>
                        </div>
                        <div class="mt-4 grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div class="text-2xl font-bold text-green-400">${group.attendance || 0}%</div>
                                <div class="text-xs text-gray-400">Attendance</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-cyan-400">${formatTime(group.avgTime || 0, false)}</div>
                                <div class="text-xs text-gray-400">Avg. Time</div>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-white">${memberCount}/${group.capacity}</div>
                                <div class="text-xs text-gray-400">Members</div>
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-700/50 px-5 py-3 flex justify-between items-center text-sm">
                        <span class="text-gray-400">Started: ${group.createdAt?.toDate().toLocaleDateString()}</span>
                        ${group.newMessages > 0 ? `
                            <span class="flex items-center gap-2 text-blue-400 animate-pulse">
                                <i class="fas fa-comment-dots"></i> ${group.newMessages} new
                            </span>
                        ` : `
                            <span class="text-gray-500">No new messages</span>
                        `}
                    </div>
                </div>
                `;
            }).join('') + '</div>';
        }

        function timeSince(date) {
            if (!date) return 'N/A';
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " years";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " months";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h";
            interval = seconds / 60;
            if (interval > 1) return Math.floor(interval) + "m";
            return Math.floor(seconds) + "s";
        }

        async function renderGroupRankings() {
            if (!currentUser) return;
            const container = document.getElementById('all-groups-list');
            if (!container) return;

            container.innerHTML = '<div class="text-center text-gray-500 py-8"><i class="fas fa-spinner fa-spin fa-2x"></i></div>';
            
            const sortMethod = document.querySelector('#group-ranking-sort-tabs .active')?.dataset.sort || 'studytime';
            const filters = {
                univ: document.querySelector('[data-filter="univ"]').checked,
                available: document.querySelector('[data-filter="available"]').checked,
                public: document.querySelector('[data-filter="public"]').checked,
            };

            const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
            const groupsSnapshot = await getDocs(groupsCollectionRef);
            
            const groupDataPromises = groupsSnapshot.docs.map(async (groupDoc) => {
                const group = { id: groupDoc.id, ...groupDoc.data() };
                if (!group.members || group.members.length === 0) {
                    return { ...group, totalStudyTime: 0, attendance: 0 };
                }

                let totalStudyTime = 0;
                const memberTimePromises = group.members.map(async (memberId) => {
                    const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', memberId);
                    const publicUserSnap = await getDoc(publicUserRef);
                    if (publicUserSnap.exists()) {
                        return publicUserSnap.data().totalStudySeconds || 0;
                    }
                    return 0;
                });
                const memberTimes = await Promise.all(memberTimePromises);
                totalStudyTime = memberTimes.reduce((sum, time) => sum + time, 0);

                const mockAttendance = Math.floor(Math.random() * (100 - 70 + 1) + 70);

                return { ...group, totalStudyTime, attendance: mockAttendance };
            });

            let allGroups = await Promise.all(groupDataPromises);

            let filteredGroups = allGroups.filter(group => {
                if (filters.univ && group.category !== 'University') return false;
                if (filters.available && (group.members?.length || 0) >= group.capacity) return false;
                if (filters.public && group.password) return false;
                return true;
            });

            filteredGroups.sort((a, b) => {
                switch (sortMethod) {
                    case 'attendance':
                        if (b.attendance !== a.attendance) return b.attendance - a.attendance;
                        return (b.members?.length || 0) - (a.members?.length || 0);
                    case 'new':
                        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                    case 'studytime':
                    default:
                        const avgA = a.totalStudyTime / (a.members?.length || 1);
                        const avgB = b.totalStudyTime / (b.members?.length || 1);
                        if (avgB !== avgA) return avgB - avgA;
                        return (b.members?.length || 0) - (a.members?.length || 0);
                }
            });
            
            if (filteredGroups.length === 0) {
                container.innerHTML = `<div class="empty-group"><i class="fas fa-search-minus"></i><h3>No Groups Found</h3><p>Try adjusting your filters or create a new group!</p></div>`;
                return;
            }

            container.innerHTML = '<div class="flex flex-col gap-4">' + filteredGroups.map((group, index) => {
                const rank = index + 1;
                const memberCount = group.members ? group.members.length : 0;
                const avgStudyTimePerMember = group.totalStudyTime / (memberCount || 1);
                const isFull = memberCount >= group.capacity;
                const isJoined = (currentUserData.joinedGroups || []).includes(group.id);

                return `
                <div class="group-card ranking bg-gray-800 rounded-xl overflow-hidden shadow-lg" data-group-id="${group.id}">
                    <div class="p-4">
                        <div class="flex justify-between items-center text-xs text-gray-400 mb-2">
                            <span class="font-bold text-base ${rank === 1 ? 'text-yellow-400' : (rank === 2 ? 'text-gray-300' : (rank === 3 ? 'text-yellow-600' : 'text-blue-400'))}">
                                Ranked #${rank} <span class="text-white">${group.category.substring(0,2).toUpperCase()}</span>
                            </span>
                            <span class="flex items-center gap-2">
                                ${Math.random() > 0.8 ? '<span class="bg-purple-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">Promoted</span>' : ''}
                                <span>${timeSince(group.createdAt?.toDate())} ago</span>
                            </span>
                        </div>
                        <h3 class="text-lg font-bold truncate mb-2 text-white">${group.name}</h3>
                        <div class="grid grid-cols-3 gap-x-2 gap-y-1 text-xs mb-3">
                            <span class="text-gray-400">Goal <b class="text-white">${group.timeGoal}h</b></span>
                            <span class="text-gray-400 col-span-2">Members <b class="text-white">${memberCount}/${group.capacity} people</b></span>
                            <span class="text-gray-400 col-span-3">Leader <b class="text-white">${group.leaderName}</b></span>
                            <span class="text-gray-400">Attendance <b class="text-white">${group.attendance}%</b></span>
                            <span class="text-gray-400 col-span-2">Time <b class="text-white">${formatTime(avgStudyTimePerMember, false)}</b></span>
                            <span class="text-gray-400 col-span-3">Started <b class="text-white">${group.createdAt?.toDate().toLocaleDateString()}</b></span>
                        </div>
                        <p class="text-gray-400 text-sm mb-3 h-8 overflow-hidden">${group.description}</p>
                        
                        <button class="join-btn w-full mt-2 ${isJoined ? 'bg-blue-600' : 'bg-green-500 hover:bg-green-600'}" data-id="${group.id}" data-private="${!!group.password}" ${isFull && !isJoined ? 'disabled' : ''}>
                             ${isJoined ? 'Joined' : (isFull ? 'Group Full' : 'Join Group')}
                        </button>
                    </div>
                </div>`;
            }).join('') + '</div>';

            document.querySelectorAll('.join-btn').forEach(button => {
                button.addEventListener('click', async function() {
                    if ((currentUserData.joinedGroups || []).includes(this.dataset.id)) {
                        showToast("You've already joined this group.", 'info');
                        return;
                    }
                     if (this.disabled) {
                        showToast("This group is currently full.", "info");
                        return;
                    }

                    const groupId = this.getAttribute('data-id');
                    const isPrivate = this.getAttribute('data-private') === 'true';
                    
                    if (isPrivate) {
                        const modal = document.getElementById('password-prompt-modal');
                        modal.classList.add('active');
                        document.getElementById('password-prompt-form').onsubmit = async (e) => {
                            e.preventDefault();
                            const password = document.getElementById('group-password-prompt-input').value;
                            const groupDoc = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId));
                            if (password !== groupDoc.data().password) {
                                showToast('Incorrect password', 'error');
                                return;
                            }
                            modal.classList.remove('active');
                            await joinGroup(groupId);
                            renderGroupRankings();
                        };
                    } else {
                        await joinGroup(groupId);
                        renderGroupRankings();
                    }
                });
            });
             document.querySelectorAll('.group-card.ranking').forEach(card => {
                card.addEventListener('click', (e) => {
                    if(e.target.classList.contains('join-btn')) return;
                    const groupId = card.dataset.groupId;
                    if ((currentUserData.joinedGroups || []).includes(groupId)) {
                         renderGroupDetail(groupId);
                         showPage('page-group-detail');
                    } else {
                        showToast('Join the group to see details.', 'info');
                    }
                });
            });
        }

        async function joinGroup(groupId) {
            if (!currentUser) return;
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            const groupRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
            await setDoc(userRef, { joinedGroups: arrayUnion(groupId) }, { merge: true });
            await updateDoc(groupRef, { members: arrayUnion(currentUser.uid) });
            showToast("Group joined successfully!", "success");
        }

        function renderSubjectSelectionList(subjects, newlyAddedSubjectName = null) {
            const container = document.getElementById('subject-selection-list');
            if (!container) return;
            if (subjects.length === 0) {
                container.innerHTML = `<p class="text-gray-400 text-center">No subjects added yet. Add one below!</p>`;
                return;
            }
            container.innerHTML = subjects.map(subject => `
                <div class="subject-item p-3 rounded-lg flex items-center gap-3" 
                     draggable="true" 
                     data-subject-id="${subject.id}" 
                     data-subject-name="${subject.name}"
                     data-order="${subject.order || 0}">
                    <div class="flex-grow flex items-center gap-3">
                        <div class="w-4 h-4 rounded-full ${subject.color}"></div>
                        <span>${subject.name}</span>
                    </div>
                    <button class="subject-options-btn"><i class="fas fa-ellipsis-v"></i></button>
                    <div class="subject-options-menu">
                        <button class="edit-subject-btn">Edit</button>
                        <button class="delete-subject-btn delete-btn">Delete</button>
                    </div>
                </div>
            `).join('');

            // Auto-select the newly added subject if provided
            if (newlyAddedSubjectName) {
                const newSubjectElement = container.querySelector(`[data-subject-name="${newlyAddedSubjectName}"]`);
                if (newSubjectElement) {
                    // Remove 'selected' from any previously selected subject
                    container.querySelectorAll('.subject-item.selected').forEach(el => el.classList.remove('selected'));
                    // Add 'selected' to the new subject
                    newSubjectElement.classList.add('selected');
                    newSubjectElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            } else {
                // If no new subject, ensure no subject is selected by default
                container.querySelectorAll('.subject-item.selected').forEach(el => el.classList.remove('selected'));
            }
        }
        
        function renderPlanner(tasks) {
            const container = document.getElementById('planner-list');
            if (!container) return;
            if (tasks.length === 0) {
                container.innerHTML = `<div class="text-center text-gray-500 py-8">No tasks scheduled. Add one to get started!</div>`;
                return;
            }

            const groupedTasks = tasks.reduce((acc, task) => {
                const date = task.date;
                if (!acc[date]) {
                    acc[date] = [];
                }
                acc[date].push(task);
                return acc;
            }, {});

            container.innerHTML = Object.keys(groupedTasks).sort().map(dateStr => {
                const date = new Date(dateStr + 'T00:00:00');
                const dayHeader = `
                    <div class="day-header">
                        <span>${date.toLocaleDateString(undefined, { weekday: 'long' })}</span>
                        <span>${date.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
                    </div>
                `;

                const tasksHtml = groupedTasks[dateStr].map(task => `
                    <div class="planner-task">
                        <input type="checkbox" class="task-checkbox w-5 h-5 bg-gray-700 rounded text-blue-500 focus:ring-blue-500" data-task-id="${task.id}" ${task.completed ? 'checked' : ''}>
                        <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
                    </div>
                `).join('');

                return `<div class="planner-day">${dayHeader}${tasksHtml}</div>`;
            }).join('');
        }
        
        async function renderGroupDetail(groupId) {
            currentGroupId = groupId;
            const groupDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);
            
            // Populate the group selector dropdown
            const groupSelector = document.getElementById('group-selector');
            if (groupSelector) {
                groupSelector.innerHTML = ''; // Clear previous options
                const allGroupsSnapshot = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'groups'));
                const allGroups = {};
                allGroupsSnapshot.forEach(doc => allGroups[doc.id] = { id: doc.id, ...doc.data() });

                (currentUserData.joinedGroups || []).forEach(joinedGroupId => {
                    const group = allGroups[joinedGroupId];
                    if (group) {
                        const option = document.createElement('option');
                        option.value = group.id;
                        option.textContent = group.name;
                        if (group.id === groupId) {
                            option.selected = true;
                        }
                        groupSelector.appendChild(option);
                    }
                });
                groupSelector.value = groupId; // Ensure the current group is selected
                groupSelector.onchange = (e) => {
                    renderGroupDetail(e.target.value);
                };
            }

            const groupUnsub = onSnapshot(groupDocRef, async (groupDoc) => {
                const container = document.getElementById('group-detail-content');
                if (!container || !groupDoc.exists()) {
                    showPage('page-my-groups');
                    return;
                }
                const groupData = groupDoc.data();

                // --- NEW: Render Settings Button for ALL members ---
                const settingsBtnContainer = document.getElementById('group-settings-btn-container');
                const settingsBtnContainerMobile = document.getElementById('group-settings-btn-container-mobile');

                if (settingsBtnContainer) {
                    settingsBtnContainer.innerHTML = `
                        <button id="group-settings-btn" class="text-gray-400 hover:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700">
                            <i class="fas fa-cog"></i>
                        </button>
                    `;
                }
                if (settingsBtnContainerMobile) {
                    settingsBtnContainerMobile.innerHTML = `
                        <button id="group-settings-btn-mobile" class="text-gray-400 hover:text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700">
                            <i class="fas fa-cog"></i>
                        </button>
                    `;
                }
                
                setupGroupMemberListeners(groupData.members || []);

                const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage || 'home';
                renderGroupSubPage(activeSubPage);
            });
            groupDetailUnsubscribers.push(groupUnsub);
        }

        function setupGroupMemberListeners(memberIds) {
            groupDetailUnsubscribers.forEach(unsub => unsub());
            groupDetailUnsubscribers = [];
            memberTimerIntervals.forEach(clearInterval);
            memberTimerIntervals = [];
            groupRealtimeData = { members: {}, sessions: {} };

            memberIds.forEach(memberId => {
                const userDocRef = doc(db, 'artifacts', appId, 'users', memberId);
                const userUnsub = onSnapshot(userDocRef, (doc) => {
                    groupRealtimeData.members[memberId] = doc.data();
                    const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage || 'home';
                    if (activeSubPage === 'home') {
                        renderGroupMembers();
                    }
                });
                groupDetailUnsubscribers.push(userUnsub);

                const sessionsRef = collection(userDocRef, 'sessions');
                const sessionsUnsub = onSnapshot(sessionsRef, (snapshot) => {
                    groupRealtimeData.sessions[memberId] = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data(),
                        endedAt: doc.data().endedAt && typeof doc.data().endedAt.toDate === 'function' ? doc.data().endedAt.toDate() : null, // Ensure endedAt is converted only if it's a Timestamp
                        type: doc.data().type || 'study' // Ensure type is present
                    }));
                    const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage;
                    if (activeSubPage === 'rankings') {
                        renderGroupLeaderboard();
                    } else if (activeSubPage === 'attendance') {
                        renderGroupAttendance();
                    }
                });
                groupDetailUnsubscribers.push(sessionsUnsub);
            });
        }

        function renderGroupSubPage(subpage) {
            const container = document.getElementById('group-detail-content');
            if (!container) return;
            
            // Show/hide controls based on subpage
            const rankingScopeSwitch = document.getElementById('ranking-scope-switch');
            const desktopHomeControls = document.getElementById('group-desktop-controls');
            const mobileHomeControls = document.getElementById('group-mobile-controls');

            if (rankingScopeSwitch) {
                rankingScopeSwitch.classList.toggle('hidden', subpage !== 'rankings');
                rankingScopeSwitch.classList.toggle('flex', subpage === 'rankings');
            }
            if (desktopHomeControls && mobileHomeControls) {
                const showHomeControls = (subpage === 'home');
                desktopHomeControls.classList.toggle('hidden', !showHomeControls);
                mobileHomeControls.classList.toggle('hidden', !showHomeControls);
            }

            document.querySelectorAll('.group-nav-item').forEach(i => i.classList.remove('active'));
            const activeNavItem = document.querySelector(`.group-nav-item[data-subpage="${subpage}"]`);
            if (activeNavItem) {
                activeNavItem.classList.add('active');
            }
            
            if (subpage === 'home') {
                const isStudiconView = document.getElementById('studicon-view-btn')?.classList.contains('active');
                 if (isStudiconView) {
                    renderGroupStudiconView();
                } else {
                    container.innerHTML = '<div id="group-member-list" class="p-4 flex flex-col gap-3"></div>';
                    renderGroupMembers();
                }
            } else if (subpage === 'invite') {
                const inviteLink = `${window.location.origin}${window.location.pathname}?groupId=${currentGroupId}`;
                container.innerHTML = `<div class="p-8 text-center"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}" class="mx-auto mb-4 rounded-lg"><p class="text-blue-400 break-all">${inviteLink}</p><div class="flex gap-4 mt-4"><button id="copy-link-btn" class="w-full py-2 bg-gray-700 rounded-lg">Copy Link</button><button class="w-full py-2 bg-orange-500 rounded-lg">Share Link</button></div><p class="text-gray-500 mt-4 text-sm">Share this link to invite a friend or organization to study with you.</p></div>`;
                document.getElementById('copy-link-btn').addEventListener('click', () => {
                    document.execCommand('copy');
                    showToast('Link copied to clipboard!', 'success');
                });
            } else if (subpage === 'chat') {
                container.innerHTML = `
                    <div class="p-4 flex flex-col h-full">
                        <div id="chat-messages" class="flex-grow overflow-y-auto mb-4"></div>
                        <div class="relative">
                            <form id="chat-form" class="flex items-center gap-2 bg-gray-800 rounded-full p-2">
                                <button type="button" id="chat-attach-btn" class="text-gray-400 hover:text-white p-2 rounded-full w-10 h-10 flex-shrink-0">
                                    <i class="fas fa-plus"></i>
                                </button>
                                <input id="chat-input" class="flex-grow bg-transparent text-white focus:outline-none" placeholder="Message...">
                                <button type="submit" class="bg-blue-600 w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </form>
                            <div id="chat-attachment-menu" class="hidden absolute bottom-full left-0 mb-2 w-48 bg-gray-700 rounded-lg shadow-lg p-2">
                                <button data-chat-action="file" class="w-full text-left p-2 hover:bg-gray-600 rounded flex items-center gap-3"><i class="fas fa-file-alt w-4"></i> File</button>
                                <button data-chat-action="album" class="w-full text-left p-2 hover:bg-gray-600 rounded flex items-center gap-3"><i class="fas fa-images w-4"></i> Album</button>
                                <button data-chat-action="camera" class="w-full text-left p-2 hover:bg-gray-600 rounded flex items-center gap-3"><i class="fas fa-camera w-4"></i> Camera</button>
                            </div>
                        </div>
                    </div>`;
                setupGroupChat(currentGroupId);
            } else if (subpage === 'rankings') {
                 container.innerHTML = `<div class="px-4 pt-4 border-b border-gray-800">
                    <div class="flex space-x-1" id="group-ranking-period-tabs">
                        <button class="ranking-tab-btn flex-1 py-2 px-4 rounded-t-lg font-semibold text-sm" data-period="daily">Daily</button>
                        <button class="ranking-tab-btn flex-1 py-2 px-4 rounded-t-lg font-semibold text-sm active" data-period="weekly">Last 7 Days</button>
                        <button class="ranking-tab-btn flex-1 py-2 px-4 rounded-t-lg font-semibold text-sm" data-period="monthly">Last 30 Days</button>
                    </div>
                </div>
                <div id="group-ranking-list" class="ranking-list"></div>`;
                
                // Set the switch to default to 'Group'
                document.getElementById('global-ranking-scope-btn').classList.remove('active');
                document.getElementById('group-ranking-scope-btn').classList.add('active');

                renderGroupLeaderboard(); // Initial render
                
                document.getElementById('group-ranking-period-tabs').addEventListener('click', (e) => {
                    if (e.target.classList.contains('ranking-tab-btn')) {
                        const period = e.target.dataset.period;
                        // Check which scope is active and re-render
                        if (document.getElementById('group-ranking-scope-btn').classList.contains('active')) {
                            renderGroupLeaderboard(period);
                        } else {
                            renderLeaderboard(period, 'group-ranking-list');
                        }
                    }
                });
            } else if (subpage === 'attendance') {
                 container.innerHTML = `<div id="attendance-container" class="attendance-container">
                    <div class="attendance-header">
                        <button id="prev-month-btn" class="attendance-nav-btn"><i class="fas fa-chevron-left"></i></button>
                        <h2 id="current-month-display" class="attendance-title">Loading...</h2>
                        <button id="next-month-btn" class="attendance-nav-btn"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="attendance-calendar grid grid-cols-7 gap-1">
                        <div class="calendar-header">Mon</div>
                        <div class="calendar-header">Tue</div>
                        <div class="calendar-header">Wed</div>
                        <div class="calendar-header">Thu</div>
                        <div class="calendar-header">Fri</div>
                        <div class="calendar-header">Sat</div>
                        <div class="calendar-header">Sun</div>
                        <div id="calendar-grid" class="col-span-7 grid grid-cols-7 gap-1"></div>
                    </div>
                    <div class="attendance-stats">
                        <h3 class="text-lg font-semibold">Attendance Stats</h3>
                        <div class="stats-grid">
                            <div class="stat-box">
                                <div id="total-hours" class="stat-value">0h 0m</div>
                                <div the="stat-label">Days Studied</div>
                            </div>
                            <div class="stat-box">
                                <div id="days-studied" class="stat-value">0</div>
                                <div the="stat-label">Days Studied</div>
                            </div>
                            <div class="stat-box">
                                <div id="attendance-rate" class="stat-value">0%</div>
                                <div class="stat-label">Attendance Rate</div>
                            </div>
                        </div>
                    </div>
                    <div class="attendance-member-list">
                        <h3 class="text-lg font-semibold mb-4">Member Attendance</h3>
                        <div id="attendance-member-grid"></div>
                    </div>
                </div>`;
                renderGroupAttendance();
            } else {
                 container.innerHTML = `<div class="p-8 text-center text-gray-400">${subpage.charAt(0).toUpperCase() + subpage.slice(1)} page is coming soon!</div>`;
            }
        }
        
        function renderGroupMembers() {
            const memberList = document.getElementById('group-member-list');
            if (!memberList) return;

            memberTimerIntervals.forEach(clearInterval);
            memberTimerIntervals = [];
            
            const todayStr = getCurrentDate().toISOString().split('T')[0];

            // Convert members object to an array for sorting
            const membersArray = Object.keys(groupRealtimeData.members).map(memberId => {
                const memberData = groupRealtimeData.members[memberId];
                let totalTodaySeconds = 0;
                // Only count study time for the member list display
                if (memberData.totalTimeToday && memberData.totalTimeToday.date === todayStr) {
                    totalTodaySeconds = memberData.totalTimeToday.seconds;
                }
                const isStudying = memberData.studying;
                // If currently studying, add current session elapsed time to total today
                const currentSessionElapsed = (isStudying && memberData.studying.type === 'study' && memberData.studying.startTime) ? (Date.now() - memberData.studying.startTime.toDate()) / 1000 : 0;
                const effectiveTotalToday = totalTodaySeconds + currentSessionElapsed;

                return {
                    id: memberId,
                    data: memberData,
                    isStudying: isStudying,
                    effectiveTotalToday: effectiveTotalToday
                };
            });

            // Sort members:
            // 1. Currently studying (true comes before false)
            // 2. Then by effectiveTotalToday (descending)
            membersArray.sort((a, b) => {
                if (a.isStudying && !b.isStudying) return -1; // a is studying, b is not: a comes first
                if (!a.isStudying && b.isStudying) return 1;  // a is not studying, b is: b comes first
                // If both are studying or both are not, sort by effectiveTotalToday
                return b.effectiveTotalToday - a.effectiveTotalToday;
            });


            memberList.innerHTML = membersArray.map(member => {
                const memberData = member.data;
                const memberId = member.id;
                const isStudying = member.isStudying;
                const totalTodaySeconds = member.effectiveTotalToday; // Use the calculated effective total

                const avatarHTML = memberData.photoURL
                    ? `<img src="${memberData.photoURL}" class="w-full h-full object-cover">`
                    : `<span>${(memberData.username || 'U').charAt(0).toUpperCase()}</span>`;
                
                const wakeUpButtonHTML = memberId !== currentUser.uid
                    ? `<button 
                          class="wake-up-btn text-xs py-1 px-3 rounded-full transition ${isStudying ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-600 text-white'}" 
                          data-target-user-id="${memberId}" 
                          data-target-user-name="${memberData.username || 'Anonymous'}"
                          ${isStudying ? 'disabled' : ''}>
                          <i class="fas fa-bell"></i> Wake Up
                       </button>`
                    : '';

                return `
                     <div class="member-list-card" data-user-id="${memberId}">
                        <div class="flex items-center flex-grow cursor-pointer member-profile-link">
                            <div class="member-avatar ${isStudying ? 'studying' : ''} overflow-hidden pointer-events-none">
                                ${avatarHTML}
                                ${isStudying ? '<div class="member-status-icon"></div>' : ''}
                            </div>
                            <div class="flex-grow pointer-events-none">
                                <div class="font-bold text-white">${memberData.username || 'Anonymous'}</div>
                                <div class="text-sm ${isStudying ? 'text-green-400' : 'text-gray-400'}" id="member-subject-${memberId}">
                                    ${isStudying ? `Studying: ${memberData.studying.subject}` : 'Idle'}
                                </div>
                            </div>
                        </div>
                        <div class="text-right flex-shrink-0 ml-4">
                            <div class="text-xl font-semibold text-white" id="member-time-${memberId}" data-base-time="${member.data.totalTimeToday && member.data.totalTimeToday.date === todayStr ? member.data.totalTimeToday.seconds : 0}" data-start-time="${isStudying && memberData.studying.startTime ? memberData.studying.startTime.toDate().getTime() : 0}">
                                ${formatTime(totalTodaySeconds)}
                            </div>
                            <div class="text-xs text-gray-500 mb-2">Total Today</div>
                            ${wakeUpButtonHTML}
                        </div>
                    </div>
                `;
            }).join('');

            // Set up intervals for actively studying members
            membersArray.forEach(member => {
                const memberData = member.data;
                const memberId = member.id;
                const timeEl = document.getElementById(`member-time-${memberId}`);
                if (memberData && memberData.studying && memberData.studying.type === 'study' && timeEl) { // Only update for study sessions
                    const baseTime = parseInt(timeEl.dataset.baseTime, 10);
                    const startTime = parseInt(timeEl.dataset.startTime, 10);
                    if (startTime > 0) {
                       const interval = setInterval(() => {
                            const ongoingSeconds = (Date.now() - startTime) / 1000;
                            timeEl.textContent = formatTime(baseTime + ongoingSeconds);
                       }, 1000);
                       memberTimerIntervals.push(interval);
                    }
                }
            });
        }
        
        function renderGroupLeaderboard(period) {
            const container = document.getElementById('group-ranking-list');
            if (!container) return;

            if (!period) {
                period = document.querySelector('#group-ranking-period-tabs .ranking-tab-btn.active')?.dataset.period || 'weekly';
            }
            
            document.querySelectorAll('#group-ranking-period-tabs .ranking-tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.period === period);
            });

            const userScores = Object.keys(groupRealtimeData.members).map(memberId => {
                const memberData = groupRealtimeData.members[memberId];
                const memberSessions = groupRealtimeData.sessions[memberId] || [];

                const now = getCurrentDate();
                let startDate;
                switch (period) {
                    case 'daily': 
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()); 
                        break;
                    case 'monthly': // Last 30 days
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - 30);
                        break;
                    case 'weekly': // Last 7 days
                    default:
                        startDate = new Date(now);
                        startDate.setDate(now.getDate() - 7);
                        break;
                }
                startDate.setHours(0,0,0,0);

                const totalSeconds = memberSessions
                    .filter(s => s.endedAt && s.endedAt >= startDate && s.type === 'study') // Only count study sessions for ranking
                    .reduce((sum, s) => sum + s.durationSeconds, 0);

                return {
                    id: memberId,
                    username: memberData.username || 'Anonymous',
                    photoURL: memberData.photoURL,
                    totalStudySeconds: totalSeconds
                };
            });

            userScores.sort((a, b) => b.totalStudySeconds - a.totalStudySeconds);
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

        function renderGroupAttendance() {
            const container = document.getElementById('calendar-grid');
            if (!container) return;
            
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            document.getElementById('current-month-display').textContent = `${monthNames[attendanceMonth]} ${attendanceYear}`;
            
            const firstDayOfMonth = new Date(attendanceYear, attendanceMonth, 1);
            const lastDayOfMonth = new Date(attendanceYear, attendanceMonth + 1, 0);
            const daysInMonth = lastDayOfMonth.getDate();
            const startDay = firstDayOfMonth.getDay();
            
            container.innerHTML = Array(startDay).fill('<div class="calendar-day empty"></div>').join('');
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${attendanceYear}-${(attendanceMonth+1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                container.innerHTML += `
                    <div class="calendar-day ${isToday(attendanceYear, attendanceMonth, day) ? 'today' : ''}" data-date="${dateStr}">
                        <div class="day-number">${day}</div>
                        <div class="day-time">0h 0m</div>
                    </div>
                `;
            }
            
            const attendanceData = {};
            const memberAttendanceData = {};
            
            for(const memberId in groupRealtimeData.sessions) {
                memberAttendanceData[memberId] = { totalTime: 0, daysStudied: new Set() };
                const memberSessions = groupRealtimeData.sessions[memberId];
                memberSessions.forEach(session => {
                    // Check if session.endedAt is a Date object before using it
                    const sessionDate = session.endedAt instanceof Date ? session.endedAt : null;
                    if(sessionDate && sessionDate.getFullYear() === attendanceYear && sessionDate.getMonth() === attendanceMonth && session.type === 'study') { // Filter for study sessions
                        const dateStr = sessionDate.toISOString().split('T')[0];
                        attendanceData[dateStr] = (attendanceData[dateStr] || 0) + session.durationSeconds;
                        memberAttendanceData[memberId].totalTime += session.durationSeconds;
                        memberAttendanceData[memberId].daysStudied.add(dateStr);
                    }
                });
            }

            const calendarDays = document.querySelectorAll('.calendar-day:not(.empty)');
            let totalGroupTime = 0;
            let daysWithStudy = 0;
            
            calendarDays.forEach(dayEl => {
                const date = dayEl.dataset.date;
                const daySeconds = attendanceData[date] || 0;
                totalGroupTime += daySeconds;
                
                if (daySeconds > 0) {
                    daysWithStudy++;
                    dayEl.classList.add('active');
                }
                
                const hours = Math.floor(daySeconds / 3600);
                const minutes = Math.floor((daySeconds % 3600) / 60);
                dayEl.querySelector('.day-time').textContent = `${hours}h ${minutes}m`;
            });
            
            document.getElementById('total-hours').textContent = formatTime(totalGroupTime, false);
            document.getElementById('days-studied').textContent = daysWithStudy;
            const attendanceRate = Math.round((daysWithStudy / daysInMonth) * 100);
            document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
            
            const memberGrid = document.getElementById('attendance-member-grid');
            if (memberGrid) {
                memberGrid.innerHTML = Object.keys(groupRealtimeData.members).map(memberId => {
                    const userData = groupRealtimeData.members[memberId];
                    if (!userData) return '';
                    const memberStats = memberAttendanceData[memberId] || { totalTime: 0, daysStudied: new Set() };
                    const memberAttendanceRate = Math.round((memberStats.daysStudied.size / daysInMonth) * 100);
                    
                    const avatarHTML = userData.photoURL
                        ? `<img src="${userData.photoURL}" class="w-full h-full object-cover">`
                        : `<span>${(userData.username || 'U').charAt(0).toUpperCase()}</span>`;

                    return `
                        <div class="member-row">
                            <div class="member-avatar-sm overflow-hidden">${avatarHTML}</div>
                            <div class="member-info">
                                <div class="member-name-sm">${userData.username || 'Anonymous'}</div>
                                <div class="member-time-sm">${formatTime(memberStats.totalTime, false)} total</div>
                                <div class="attendance-progress">
                                    <div class="progress-bar" style="width: ${memberAttendanceRate}%"></div>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-sm font-semibold">${memberAttendanceRate}%</div>
                                <div class="text-xs text-gray-500">${memberStats.daysStudied.size}/${daysInMonth} days</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            document.getElementById('prev-month-btn').onclick = () => {
                attendanceMonth--;
                if (attendanceMonth < 0) {
                    attendanceMonth = 11;
                    attendanceYear--;
                }
                renderGroupAttendance();
            };
            
            document.getElementById('next-month-btn').onclick = () => {
                attendanceMonth++;
                if (attendanceMonth > 11) {
                    attendanceMonth = 0;
                    attendanceYear++;
                }
                renderGroupAttendance();
            };
        }
        
        function isToday(year, month, day) {
            const today = getCurrentDate();
            return today.getFullYear() === year && 
                   today.getMonth() === month && 
                   today.getDate() === day;
        }
        
        function setupGroupChat(groupId) {
            const chatMessagesContainer = document.getElementById('chat-messages');
            const chatForm = document.getElementById('chat-form');
            const chatInput = document.getElementById('chat-input');
            if (!chatMessagesContainer || !chatForm) return;

            const messagesRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups', groupId, 'messages');
            const q = query(messagesRef, orderBy("timestamp"));

            const chatUnsub = onSnapshot(q, (snapshot) => {
                chatMessagesContainer.innerHTML = '';
                snapshot.forEach(doc => {
                    const msg = doc.data();
                    const isSent = msg.senderId === currentUser.uid;
                    const messageEl = document.createElement('div');
                    messageEl.classList.add('chat-message', isSent ? 'sent' : 'received');

                    let messageContent = '';
                    if (msg.text) {
                        messageContent = `<div>${msg.text}</div>`;
                    } else if (msg.imageUrl) {
                        messageContent = `<img src="${msg.imageUrl}" class="rounded-lg max-w-full h-auto cursor-pointer" style="max-height: 300px;" onclick="viewImage(this.src)">`;
                    }

                    messageEl.innerHTML = `
                        <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                            ${!isSent ? `<div class="chat-sender">${msg.senderName}</div>` : ''}
                            ${messageContent}
                            <div class="text-xs ${isSent ? 'text-blue-200' : 'text-gray-400'} text-right mt-1">
                                ${msg.timestamp ? msg.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                            </div>
                        </div>
                    `;
                    chatMessagesContainer.appendChild(messageEl);
                });
                chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
            });
            groupDetailUnsubscribers.push(chatUnsub);

            chatForm.onsubmit = async (e) => {
                e.preventDefault();
                const text = chatInput.value.trim();
                if (text && currentUser) {
                    const userDoc = await getDoc(doc(db, 'artifacts', appId, 'users', currentUser.uid));
                    await addDoc(messagesRef, {
                        text: text,
                        senderId: currentUser.uid,
                        senderName: userDoc.data().username,
                        timestamp: serverTimestamp()
                    });
                    chatInput.value = '';
                }
            };
        }

        // --- Event Listeners ---
        const ael = (id, event, callback) => {
            const el = document.getElementById(id);
            if (el) el.addEventListener(event, callback);
        };

        // --- START: NEW EVENT LISTENERS FOR GUEST MODE ---
        // Anonymous Auth
        ael('anonymous-signin-btn', 'click', async () => {
            try {
                await auth.signInAnonymously();
            } catch (error) {
                console.error("Anonymous sign-in failed:", error);
                if(authError) authError.textContent = "Could not sign in as guest. Please try again.";
            }
        });

        ael('go-to-auth-btn', 'click', async () => {
            // Sign out the anonymous user and show the auth screen
            await auth.signOut();
            // showPage will be called by onAuthStateChanged
        });
        // --- END: NEW EVENT LISTENERS FOR GUEST MODE ---

        // Auth
        ael('login-form', 'submit', async (e) => {
            e.preventDefault();
            authError.textContent = '';

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            if (!email || !password) {
                authError.textContent = 'Email and password are required.';
                return;
            }

            try {
                const { error } = await auth.signInWithPassword({ email, password });
                if (error) {
                    authError.textContent = error.message;
                    return;
                }
                await ensureProfileRow();
            } catch (err) {
                console.error('Login failed:', err);
                authError.textContent = 'Login failed. Please check your credentials.';
            }
        });

        ael('signup-form', 'submit', async (e) => {
            e.preventDefault();
            authError.textContent = '';
            const email = document.getElementById('signup-email').value;
            const password = document.getElementById('signup-password').value;
            if (password.length < 6) {
                authError.textContent = 'Password must be at least 6 characters long.';
                return;
            }
            try {
                const { error } = await auth.signUp({ email, password });
                if (error) throw error;
                await ensureProfileRow();
            } catch (error) {
                authError.textContent = error.message;
            }
        });

        ael('auth-toggle-btn', 'click', () => {
            const loginForm = document.getElementById('login-form');
            const signupForm = document.getElementById('signup-form');
            const toggleText = document.getElementById('login-toggle-text');
            const toggleBtn = document.getElementById('auth-toggle-btn');
            authError.textContent = '';

            if (loginForm.classList.contains('hidden')) {
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
                toggleText.textContent = "Don't have an account?";
                toggleBtn.textContent = 'Sign Up';
            } else {
                loginForm.classList.add('hidden');
                signupForm.classList.remove('hidden');
                toggleText.textContent = 'Already have an account?';
                toggleBtn.textContent = 'Sign In';
            }
        });

        const googleBtn = document.getElementById('google-signin-btn');
        if (googleBtn) {
            googleBtn.addEventListener('click', async () => {
                try {
                    const { data, error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: window.location.origin,
                        },
                    });
                    if (error) throw error;
                } catch (err) {
                    console.error('Google sign-in error:', err);
                    alert('Google login failed: ' + err.message);
                }
            });
        }
        
        ael('username-setup-form', 'submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const usernameInput = document.getElementById('username-input');
            const username = usernameInput.value.trim();
            const usernameError = document.getElementById('username-error');
            const selectedAvatarEl = document.querySelector('#username-avatar-picker .avatar-option.selected img');
            const photoURL = selectedAvatarEl ? selectedAvatarEl.src : PRESET_AVATARS[0];

            if (username.length < 3) {
                usernameError.textContent = 'Username must be at least 3 characters.';
                return;
            }
            usernameError.textContent = '';

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            try {
                const { error } = await db
                    .from('profiles')
                    .update({ username, photo_url: photoURL })
                    .eq('id', currentUser.id);
                if (error) throw error;

                await loadMyProfile();
                showPage('page-timer');

            } catch (error) {
                console.error("Error setting username:", error);
                usernameError.textContent = 'Failed to save profile. Please try again.';
            } finally {
                btn.disabled = false;
                btn.innerHTML = 'Save Profile';
            }
        });

        ael('sign-out-btn', 'click', async () => {
            try {
                await auth.signOut();
            } catch (error) {
                console.error("Sign out error", error);
                showToast("Failed to sign out.", "error");
            }
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', function() {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            const pageName = this.dataset.page;
            showPage(`page-${pageName}`);
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

        // --- START: ADDED GUARDS FOR GUEST USERS ---
        ael('groups-btn', 'click', () => { 
            if (currentUser && currentUser.isAnonymous) {
                showToast('Please create an account to use study groups.', 'info');
                showPage('page-profile');
                return;
            }
            renderJoinedGroups(); 
            showPage('page-my-groups'); 
        });
        ael('go-to-find-groups-btn', 'click', () => { 
             if (currentUser && currentUser.isAnonymous) {
                showToast('Please create an account to use study groups.', 'info');
                return;
            }
            renderGroupRankings(); 
            showPage('page-find-groups'); 
        });
        ael('go-to-create-group-btn', 'click', () => { 
             if (currentUser && currentUser.isAnonymous) {
                showToast('Please create an account to use study groups.', 'info');
                return;
            }
            showPage('page-create-group'); 
        });
        // --- END: ADDED GUARDS FOR GUEST USERS ---
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

            timerMode = mode;
            document.getElementById('normal-timer-btn').classList.toggle('active', mode === 'normal');
            document.getElementById('pomodoro-timer-btn').classList.toggle('active', mode === 'pomodoro');

            if (mode === 'pomodoro') {
                sessionTimerDisplay.textContent = formatPomodoroTime(pomodoroSettings.work * 60);
                pomodoroStatusDisplay.textContent = 'Ready for Pomodoro';
                pomodoroStatusDisplay.style.color = '#9ca3af';
            } else { // 'normal'
                sessionTimerDisplay.textContent = formatTime(0);
                pomodoroStatusDisplay.textContent = '';
            }
        }
        
        ael('normal-timer-btn', 'click', () => switchTimerMode('normal'));
        ael('pomodoro-timer-btn', 'click', () => switchTimerMode('pomodoro'));

        // --- NEW UNIFIED PLANNER EVENT LISTENERS ---
        // This single block handles all interactions within the planner for robustness
        const plannerPage = document.getElementById('page-planner');
        if (plannerPage) {
            let detailUpdateDebounceTimer;

            // Main click handler
            plannerPage.addEventListener('click', e => {
                const target = e.target;
                
                // --- NEW: Category List Item Click ---
                const categoryItem = target.closest('.planner-list-item');
                if (categoryItem) {
                    const category = categoryItem.dataset.category;
                    if(category) {
                        plannerState.activeCategory = category;
                        renderPlannerMainContent();
                    }
                    return;
                }
                
                // --- NEW: Category View Back Button ---
                if (target.closest('.category-back-btn')) {
                    plannerState.activeCategory = 'list';
                    plannerState.showCompletedInCategory = false; // Reset toggle on exit
                    renderPlannerMainContent();
                    return;
                }

                // --- NEW: Category View Checkbox ---
                const categoryCheckbox = target.closest('.task-checkbox-category');
                if (categoryCheckbox) {
                    const taskItem = categoryCheckbox.closest('.category-task-item');
                    const taskId = taskItem.dataset.taskId;
                    const isCompleted = !categoryCheckbox.classList.contains('completed');
                    updatePlannerTask(taskId, {
                        completed: isCompleted,
                        completedAt: isCompleted ? serverTimestamp() : null
                    });
                    return;
                }

                // --- NEW: Completed Tasks Toggle ---
                if (target.closest('.completed-tasks-toggle')) {
                    plannerState.showCompletedInCategory = !plannerState.showCompletedInCategory;
                    renderPlannerCategoryView(plannerState.activeCategory);
                    return;
                }

                // --- Calendar day click for adding task ---
                const dayCell = target.closest('.calendar-day-cell:not(.other-month)');
                if (dayCell && !target.closest('.calendar-task')) {
                    const dateStr = dayCell.dataset.date;
                    if (dateStr) {
                        const modal = document.getElementById('quick-add-task-modal');
                        document.getElementById('quick-add-task-date').textContent = new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
                        document.getElementById('quick-add-task-date-input').value = dateStr;
                        modal.classList.add('active');
                        document.getElementById('quick-add-task-title-input').focus();
                    }
                    return; 
                }

                // View switcher
                const viewBtn = target.closest('.planner-view-btn');
                if (viewBtn && !viewBtn.classList.contains('active')) {
                    plannerState.currentView = viewBtn.dataset.view;
                    renderPlannerMainContent();
                    return;
                }

                // Sidebar list selection
                const sidebarItem = target.closest('.planner-sidebar-item');
                if (sidebarItem && !sidebarItem.classList.contains('active')) {
                    plannerState.activeListId = sidebarItem.dataset.listId;
                    plannerState.selectedTaskId = null; // Deselect task when changing lists
                    renderPlannerPage();
                    return;
                }
                
                // Calendar navigation
                const calNavBtn = target.closest('.calendar-nav-btn');
                if (calNavBtn) {
                    const direction = calNavBtn.dataset.direction;
                    if (direction === 'today') {
                        plannerState.calendarYear = new Date().getFullYear();
                        plannerState.calendarMonth = new Date().getMonth();
                    } else if (direction === 'next') {
                        plannerState.calendarMonth++;
                        if (plannerState.calendarMonth > 11) {
                            plannerState.calendarMonth = 0;
                            plannerState.calendarYear++;
                        }
                    } else if (direction === 'prev') {
                        plannerState.calendarMonth--;
                        if (plannerState.calendarMonth < 0) {
                            plannerState.calendarMonth = 11;
                            plannerState.calendarYear--;
                        }
                    }
                    renderPlannerCalendarView(plannerState.tasks.filter(t => t.listId === plannerState.activeListId));
                    return;
                }

                // Task item selection (to open details)
                const taskItem = target.closest('.task-item, .kanban-card, .calendar-task, .category-task-item');
                if (taskItem && !target.matches('input[type="checkbox"]') && !target.closest('.task-play-btn')) {
                    const taskId = taskItem.dataset.taskId;
                    if (taskId !== plannerState.selectedTaskId) {
                        plannerState.selectedTaskId = taskId;
                        renderPlannerPage();
                    }
                    return;
                }

                // Task details panel buttons
                const detailsPanel = target.closest('#planner-task-details');
                if(detailsPanel) {
                    const taskId = plannerState.selectedTaskId;
                    if (!taskId) return;
                    
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
                            
                            const { data, error } = await supabase.functions.invoke('send-wake-up-notification', {
                                body: {
                                    targetUserId,
                                    senderName: currentUserData.username,
                                    appId
                                }
                            });

                            if (!error && data?.success) {
                                showToast(`Wake up call sent to ${targetUserName}!`, 'success');
                            } else {
                                showToast(data?.message || 'Could not send wake up call.', 'error');
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
                                const { data, error } = await supabase.functions.invoke('send-group-wake-up-notification', {
                                    body: {
                                        groupId: currentGroupId,
                                        senderId: currentUser.id,
                                        appId
                                    }
                                });
                                if (!error && data?.success) {
                                    showToast(`Wake up call sent to ${data.sentCount} members.`, 'success');
                                } else {
                                    showToast(data?.message || 'Could not send wake up call.', 'error');
                                }
                            } catch (error) {
                                console.error('Error sending group wake up call:', error);
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
            restoreUser();
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

            ael('save-character-avatar-btn', 'click', async () => {
                const selectedAvatar = document.querySelector('#avatar-character-picker .avatar-option.selected img')?.src;
                if (selectedAvatar && currentUser) {
                    try {
                        const { error } = await db
                            .from('profiles')
                            .update({ photo_url: selectedAvatar })
                            .eq('id', currentUser.id);
                        if (error) throw error;
                        document.getElementById('avatar-character-modal').classList.remove('active');
                        showToast('Avatar updated!', 'success');
                        await loadMyProfile();
                    } catch (error) {
                        console.error("Avatar update failed:", error);
                        showToast('Failed to update avatar.', 'error');
                    }
                } else {
                    showToast('Please select a character.', 'info');
                }
            });

        });

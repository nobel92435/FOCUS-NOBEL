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
    writeBatch
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Application Setup ---
const getCurrentDate = () => new Date();

// --- App State ---
let db, auth;
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
// ... (availableSounds object is quite large, omitting for brevity, but it's present in the original HTML) ...

// Attendance State
let attendanceMonth = getCurrentDate().getMonth();
let attendanceYear = getCurrentDate().getFullYear();

// --- UI Elements ---
let authError, sessionTimerDisplay, totalTimeDisplay, totalBreakTimeDisplay, activeSubjectDisplay, pomodoroStatusDisplay;

// --- Firebase Initialization ---
function initializeFirebase() {
    try {
        const firebaseConfig = {
            apiKey: "AIzaSyBSCrL6ravOzFnwOa7A0Jl_W68vEfZVcNw", // NOTE: This API key is public. For production, consider environment variables.
            authDomain: "focus-flow-34c07.firebaseapp.com",
            projectId: "focus-flow-34c07",
            storageBucket: "focus-flow-34c07.appspot.com",
            appId: "1:473980178825:web:164566ec8b068da3281158",
            measurementId: "G-RRFK3LY0E4"
        };

        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);

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
                // pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings }); // This line seems to be commented or missing definition for pomodoroWorker.

                if (!currentUserData || !currentUserData.username) {
                    showPage('page-username-setup');
                } else {
                    updateProfileUI(currentUserData);
                    showPage('page-timer');
                    setupRealtimeListeners();
                    await loadDailyTotal();
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
            totalBreakSeconds: 0 // Initialize for public too
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
                // pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings }); // This line also commented/missing pomodoroWorker def.
            }
            if (data.pomodoroSounds) {
                pomodoroSounds = {...pomodoroSounds, ...data.pomodoroSounds};
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

    onSnapshot(query(plannerTasksRef, orderBy("date")), (snapshot) => {
        if (document.getElementById('page-planner').classList.contains('active')) {
            const tasks = [];
            snapshot.forEach(doc => tasks.push({ id: doc.id, ...doc.data() }));
            renderPlanner(tasks);
        }
    });
}

// ... (Other functions like startTimer, stopTimer, saveSession, renderLeaderboard, etc. also interact with Firestore) ...

// --- Event Listeners (excerpt of those interacting with Firebase) ---
// Auth
ael('login-form', 'submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        authError.textContent = error.message;
    }
});

ael('signup-form', 'submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        authError.textContent = error.message;
    }
});

ael('google-signin-btn', 'click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        authError.textContent = error.message;
    }
});

ael('sign-out-btn', 'click', () => {
    signOut(auth).catch(error => {
        showToast(`Sign out failed: ${error.message}`, 'error');
    });
});

ael('username-setup-form', 'submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const usernameInput = document.getElementById('username-input');
    const usernameError = document.getElementById('username-error');
    const username = usernameInput.value.trim();
    
    if (username.length < 3) {
        usernameError.textContent = "Username must be at least 3 characters.";
        return;
    }
    usernameError.textContent = '';

    const userDocRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    await setDoc(userDocRef, { username: username }, { merge: true });
    
    const publicUserDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
    await setDoc(publicUserDocRef, { username: username }, { merge: true });
    
    const userDoc = await getDoc(userDocRef);
    updateProfileUI(userDoc.data());
    showPage('page-timer');
    setupRealtimeListeners();
    loadDailyTotal();
});

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

ael('add-subject-form', 'submit', async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    const name = document.getElementById('add-subject-name').value.trim();
    const selectedColorDot = addSubjectModal.querySelector('.color-dot.selected');
    const color = selectedColorDot ? selectedColorDot.dataset.color : 'bg-blue-500'; // Default color if none selected
    
    if (!name) {
        showToast("Please provide a name for the subject.", "error");
        return;
    }

    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
    const subjectsRef = collection(userRef, 'subjects');
    
    // Get current count to set initial order
    const subjectsSnapshot = await getDocs(subjectsRef);
    const order = subjectsSnapshot.size;

    await addDoc(subjectsRef, { name, color, order });
    
    addSubjectModal.classList.remove('active'); // This fixes the modal not hiding
    document.getElementById('add-subject-form').reset();
    // Re-select a default color for the next time the modal opens
    addSubjectModal.querySelector('.color-dot.selected')?.classList.remove('selected');
    addSubjectModal.querySelector('.color-dot[data-color="bg-blue-500"]')?.classList.add('selected');

    // After adding, re-render the subject list in the start session modal and select the new subject
    const updatedSubjectsSnapshot = await getDocs(query(subjectsRef, orderBy('order', 'asc')));
    const subjects = [];
    updatedSubjectsSnapshot.forEach(doc => subjects.push({ id: doc.id, ...doc.data() }));
    renderSubjectSelectionList(subjects, name); // Pass the newly added subject's name for auto-selection

    showToast("Subject added!", "success");

    // If the subject was added from the "Start New Session" modal, re-open it
    if (isAddingSubjectFromStartSession) {
        startSessionModal.classList.add('active');
        isAddingSubjectFromStartSession = false; // Reset flag
    }
});
// Event listener for the edit subject form
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
        // The existing onSnapshot listener will automatically refresh the UI.
    } catch (error) {
        console.error("Error updating subject:", error);
        showToast("Failed to update subject.", "error");
    }
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
                // After deleting, re-evaluate and update the order of remaining subjects
                await updateSubjectOrderInFirestore();
                showToast(`Deleted "${subjectName}"`, 'success');
            }
        );
    }
    
    if (e.target.classList.contains('edit-subject-btn')) {
        const itemToEdit = e.target.closest('.subject-item');
        const subjectId = itemToEdit.dataset.subjectId;
        const subjectName = itemToEdit.dataset.subjectName;
        // This finds the color div and gets its background color class (e.g., 'bg-red-500')
        const subjectColorClass = Array.from(itemToEdit.querySelector('.w-4.h-4').classList).find(c => c.startsWith('bg-'));

        const modal = document.getElementById('edit-subject-modal');
        document.getElementById('edit-subject-id').value = subjectId;
        document.getElementById('edit-subject-name').value = subjectName;

        const colorPicker = document.getElementById('edit-subject-color-picker');
        // We can copy the color dots from the "Add Subject" modal to ensure they are the same
        const addSubjectColorPicker = document.querySelector('#add-subject-modal .subject-color-picker');
        colorPicker.innerHTML = addSubjectColorPicker.innerHTML;

        // Now, find and select the correct color dot in the new modal
        colorPicker.querySelectorAll('.color-dot').forEach(dot => {
            dot.classList.remove('selected');
            if (dot.dataset.color === subjectColorClass) {
                dot.classList.add('selected');
            }
            // Add a click listener for the color dots in the edit modal
            dot.addEventListener('click', () => {
                 colorPicker.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                 dot.classList.add('selected');
            });
        });

        modal.classList.add('active');
    }
});

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
        // Assuming availableSounds is defined globally or in scope
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
    // pomodoroWorker.postMessage({ command: 'updateSettings', newSettings: pomodoroSettings }); // This line also commented/missing pomodoroWorker def.
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

window.onload = () => {
    // ... (UI element assignments) ...
    initializeFirebase();
    // ... (other onload logic) ...
};

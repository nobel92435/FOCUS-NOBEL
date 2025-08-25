// /js/auth.js

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
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { getCurrentDate } from './utils.js'; // Import getCurrentDate
import { showToast, showPage, updateProfileUI } from './ui.js'; // Import UI functions

let authErrorElement; // To be initialized by main.js
let dbInstance; // To be initialized by main.js
let appId; // To be initialized by main.js

export const initializeAuth = (app, db, errorElement, currentAppId) => {
    authErrorElement = errorElement;
    dbInstance = db;
    appId = currentAppId;
    return getAuth(app);
};

export async function getOrCreateUserDocument(user) {
    const userDocRef = doc(dbInstance, 'artifacts', appId, 'users', user.uid);
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
        await setDoc(doc(dbInstance, 'artifacts', appId, 'public', 'data', 'users', user.uid), {
            username: user.displayName,
            email: user.email,
            totalStudySeconds: 0,
            totalBreakSeconds: 0
        });
        userDoc = await getDoc(userDocRef);
    }
    return userDoc;
}

export const setupAuthListeners = (auth, callbacks) => {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getOrCreateUserDocument(user);
            callbacks.onUserLoggedIn(user, userDoc.data());
        } else {
            callbacks.onUserLoggedOut();
        }
    });
};

export const handleLogin = async (email, password) => {
    try {
        await signInWithEmailAndPassword(getAuth(), email, password);
    } catch (error) {
        if (authErrorElement) authErrorElement.textContent = error.message;
        throw error;
    }
};

export const handleSignup = async (email, password) => {
    try {
        await createUserWithEmailAndPassword(getAuth(), email, password);
    } catch (error) {
        if (authErrorElement) authErrorElement.textContent = error.message;
        throw error;
    }
};

export const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(getAuth(), provider);
    } catch (error) {
        if (authErrorElement) authErrorElement.textContent = error.message;
        throw error;
    }
};

export const handleSignOut = async () => {
    try {
        await signOut(getAuth());
    } catch (error) {
        showToast(`Sign out failed: ${error.message}`, 'error');
        throw error;
    }
};

export const handleUsernameSetup = async (currentUser, username) => {
    if (!currentUser) return;

    const userDocRef = doc(dbInstance, 'artifacts', appId, 'users', currentUser.uid);
    await setDoc(userDocRef, { username: username }, { merge: true });

    const publicUserDocRef = doc(dbInstance, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
    await setDoc(publicUserDocRef, { username: username }, { merge: true });

    const userDoc = await getDoc(userDocRef);
    updateProfileUI(userDoc.data());
    showPage('page-timer'); // Assuming this should be handled in main or ui
    // setupRealtimeListeners and loadDailyTotal will be handled by main.js
};

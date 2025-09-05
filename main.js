// ========== Firebase Initialization ==========
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your Firebase config (replace with yours)
const firebaseConfig = {
  apiKey: "AIzaSyBSCrL6ravOzFnwOa7A0Jl_W68vEfZVcNw",
  authDomain: "focus-flow-34c07.firebaseapp.com",
  databaseURL: "https://focus-flow-34c07-default-rtdb.firebaseio.com",
  projectId: "focus-flow-34c07",
  storageBucket: "focus-flow-34c07.firebasestorage.app",
  messagingSenderId: "473980178825",
  appId: "1:473980178825:web:164566ec8b068da3281158",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const functions = getFunctions(app);

// ========== UI DOM Elements ==========
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const timerDisplay = document.getElementById("timerDisplay");
const profilePicInput = document.getElementById("profilePicInput");
const leaderboardDiv = document.getElementById("leaderboard");
const statsDiv = document.getElementById("stats");
const plannerDiv = document.getElementById("planner");
const groupChatDiv = document.getElementById("groupChat");

// ========== Pomodoro Timer ==========
let timer;
let timeLeft = 25 * 60;
let activeSubject = "Study";

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.innerText = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      triggerNotification("Pomodoro finished!", "Time for a break!");
    }
  }, 1000);
}

async function stopTimer() {
  clearInterval(timer);

  // Save session securely via backend
  const saveSessionFn = httpsCallable(functions, "saveSession");
  await saveSessionFn({
    subject: activeSubject,
    durationSeconds: 25 * 60,
    type: "study"
  });

  console.log("Session saved securely!");
}

startBtn.addEventListener("click", () => {
  timeLeft = 25 * 60;
  updateTimerDisplay();
  startTimer();
});
stopBtn.addEventListener("click", stopTimer);

// ========== Notifications ==========
async function triggerNotification(title, body) {
  const sendPush = httpsCallable(functions, "sendPomodoroNotification");
  await sendPush({ title, body, tag: "pomodoro" });
}

// ========== Profile Picture Upload ==========
profilePicInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64Image = ev.target.result;
    const uploadFn = httpsCallable(functions, "uploadProfilePhoto");
    const result = await uploadFn({ dataURL: base64Image });
    console.log("Profile uploaded:", result.data.url);
    document.getElementById("profileImg").src = result.data.url;
  };
  reader.readAsDataURL(file);
});

// ========== Leaderboard ==========
async function loadLeaderboard(groupId) {
  const getLB = httpsCallable(functions, "getGroupLeaderboard");
  const result = await getLB({ groupId, period: "weekly" });
  leaderboardDiv.innerHTML = "";
  result.data.leaderboard.forEach((entry, i) => {
    leaderboardDiv.innerHTML += `<p>${i + 1}. ${entry.username} - ${entry.totalStudySeconds / 60} min</p>`;
  });
}

// ========== Group Attendance ==========
async function loadAttendance(groupId, year, month) {
  const getAtt = httpsCallable(functions, "getGroupAttendance");
  const result = await getAtt({ groupId, year, month });
  console.log("Attendance:", result.data);
}

// ========== Group Chat Image ==========
async function sendGroupImage(groupId, file) {
  const reader = new FileReader();
  reader.onload = async (ev) => {
    const base64Image = ev.target.result;
    const postImg = httpsCallable(functions, "postGroupImage");
    const result = await postImg({ groupId, base64Image });
    console.log("Group image sent:", result.data);
  };
  reader.readAsDataURL(file);
}

// ========== Stats Section ==========
async function loadStats() {
  const getStats = httpsCallable(functions, "getUserStats");
  const result = await getStats();
  statsDiv.innerText = `Total Focus Time: ${result.data.totalMinutes} minutes`;
}

// ========== Planner Section ==========
async function addTask(task) {
  const addTaskFn = httpsCallable(functions, "addPlannerTask");
  await addTaskFn({ task });
  plannerDiv.innerHTML += `<p>${task}</p>`;
}

// ========== Authentication ==========
const provider = new GoogleAuthProvider();
document.getElementById("loginBtn").addEventListener("click", () => {
  signInWithPopup(auth, provider).catch(console.error);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth);
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User logged in:", user.displayName);
    loadStats();
    loadLeaderboard("default-group");
  } else {
    console.log("User logged out");
  }
});

// ========== Firebase Initialization ==========
import { initializeApp } from "firebase/app";
import { 
  getAuth, onAuthStateChanged, 
  signInWithPopup, GoogleAuthProvider, signOut 
} from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";

// Your Firebase config (replace with yours)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_MSG_ID",
  appId: "YOUR_APP_ID"
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
const taskInput = document.getElementById("taskInput");
const addTaskBtn = document.getElementById("addTaskBtn");

// ========== Pomodoro State ==========
let timer;
let timeLeft = 25 * 60;
let currentPhase = "focus"; // focus | break
let activeSubject = "Study";
let autoStartFocus = true;
let autoStartBreak = true;

// Pomodoro sounds
const availableSounds = {
  bell: new Audio("/sounds/bell.mp3"),
  alarm: new Audio("/sounds/alarm.mp3"),
  tick: new Audio("/sounds/tick.mp3"),
};
let selectedSound = "bell";
let soundEnabled = true;

function playSound(type) {
  if (!soundEnabled) return;
  if (availableSounds[type]) {
    availableSounds[type].play();
  }
}

// ========== Pomodoro Timer ==========
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
      handlePomodoroPhaseEnd();
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
    type: currentPhase === "focus" ? "study" : "break"
  });

  console.log("Session saved securely!");
}

function handlePomodoroPhaseEnd() {
  if (currentPhase === "focus") {
    playSound("alarm");
    triggerNotification("Pomodoro finished!", "Take a 5 min break!");
    currentPhase = "break";
    timeLeft = 5 * 60;
    if (autoStartBreak) startTimer();
  } else {
    playSound("bell");
    triggerNotification("Break finished!", "Back to focus!");
    currentPhase = "focus";
    timeLeft = 25 * 60;
    if (autoStartFocus) startTimer();
  }
}

startBtn.addEventListener("click", () => {
  timeLeft = 25 * 60;
  currentPhase = "focus";
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
async function loadTasks() {
  const getTasksFn = httpsCallable(functions, "getPlannerTasks");
  const result = await getTasksFn();
  plannerDiv.innerHTML = "";
  result.data.tasks.forEach(task => {
    const taskEl = document.createElement("div");
    taskEl.innerHTML = `
      <input type="checkbox" ${task.done ? "checked" : ""} data-id="${task.id}">
      <span>${task.task}</span>
    `;
    taskEl.querySelector("input").addEventListener("change", async (e) => {
      const toggleTaskFn = httpsCallable(functions, "toggleTaskDone");
      await toggleTaskFn({ taskId: task.id, done: e.target.checked });
    });
    plannerDiv.appendChild(taskEl);
  });
}

addTaskBtn.addEventListener("click", async () => {
  const task = taskInput.value.trim();
  if (!task) return;
  const addTaskFn = httpsCallable(functions, "addPlannerTask");
  await addTaskFn({ task });
  taskInput.value = "";
  loadTasks();
});

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
    loadTasks();
  } else {
    statsDiv.innerText = "";
    plannerDiv.innerHTML = "";
    leaderboardDiv.innerHTML = "";
  }
});

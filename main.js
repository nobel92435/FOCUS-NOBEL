// --- Pomodoro Timer State ---
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let timeLeft = 25 * 60; // default 25 min
let currentPhase = "idle"; // "work", "short_break", "long_break", "idle"
let nextPhase = null;

// --- UI Elements ---
const sessionTimerDisplay = document.getElementById("session-timer");
const pomodoroStatusDisplay = document.getElementById("pomodoro-status");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// --- Utility ---
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

function updateDisplay() {
  if (sessionTimerDisplay) {
    sessionTimerDisplay.textContent = formatTime(timeLeft);
  }
}

// --- Timer Logic ---
function startTimer(duration, phase) {
  if (isRunning) return;
  isRunning = true;
  timeLeft = duration;
  currentPhase = phase;

  pomodoroStatusDisplay.textContent = `In ${phase.replace("_", " ")}`;

  timerInterval = setInterval(() => {
    if (!isPaused) {
      timeLeft--;
      updateDisplay();

      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        handlePhaseEnd();
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  currentPhase = "idle";
  pomodoroStatusDisplay.textContent = "Stopped";
  updateDisplay();
}

function pauseTimer() {
  isPaused = true;
}

function resumeTimer() {
  isPaused = false;
}

async function handlePhaseEnd() {
  // --- Notify backend of session end ---
  await logSession({
    phase: currentPhase,
    duration: getPhaseDuration(currentPhase),
  });

  // --- Notify user ---
  await sendNotification({
    title: "Pomodoro Complete!",
    body: `Finished ${currentPhase.replace("_", " ")} phase`,
  });

  // --- Transition to next phase ---
  if (currentPhase === "work") {
    nextPhase = "short_break";
  } else {
    nextPhase = "work";
  }
  pomodoroStatusDisplay.textContent = `Ready for ${nextPhase}`;
}

function getPhaseDuration(phase) {
  if (phase === "work") return 25 * 60;
  if (phase === "short_break") return 5 * 60;
  if (phase === "long_break") return 15 * 60;
  return 0;
}

// --- API Calls to Backend ---
async function logSession(data) {
  try {
    await fetch("/api/logSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Error logging session:", err);
  }
}

async function updateLeaderboard(score) {
  try {
    await fetch("/api/updateLeaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
  } catch (err) {
    console.error("Error updating leaderboard:", err);
  }
}

async function uploadProfilePic(file) {
  const formData = new FormData();
  formData.append("file", file);
  try {
    await fetch("/api/uploadProfilePic", {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    console.error("Error uploading profile pic:", err);
  }
}

async function shareGroupImage(file, groupId) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("groupId", groupId);
  try {
    await fetch("/api/shareGroupImage", {
      method: "POST",
      body: formData,
    });
  } catch (err) {
    console.error("Error sharing group image:", err);
  }
}

async function sendNotification(data) {
  try {
    await fetch("/api/sendNotification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

// --- Premium Features ---
async function fetchStats() {
  const res = await fetch("/api/getStats");
  return await res.json();
}

async function savePlanner(entry) {
  await fetch("/api/savePlanner", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
}

async function fetchLeaderboard() {
  const res = await fetch("/api/getLeaderboard");
  return await res.json();
}

async function createGroup(name) {
  await fetch("/api/createGroup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

async function joinGroup(groupId) {
  await fetch("/api/joinGroup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groupId }),
  });
}

async function getGroupData(groupId) {
  const res = await fetch(`/api/getGroupData/${groupId}`);
  return await res.json();
}

// --- Rendering Functions ---
async function renderLeaderboard() {
  const data = await fetchLeaderboard();
  const container = document.getElementById("leaderboard");
  if (!container) return;
  container.innerHTML = data
    .map((u, i) => `<p>${i + 1}. ${u.id} - ${u.score}</p>`)
    .join("");
}

async function renderStats() {
  const stats = await fetchStats();
  const container = document.getElementById("stats");
  if (!container) return;
  container.innerHTML = `
    <p>Sessions: ${stats.sessions}</p>
    <p>Total Minutes: ${stats.totalMinutes}</p>
  `;
}

async function renderGroups(groupId) {
  const data = await getGroupData(groupId);
  const container = document.getElementById("groups");
  if (!container) return;
  container.innerHTML = `
    <h3>${data.name}</h3>
    <p>Members: ${data.members.join(", ")}</p>
  `;
}

// --- Event Listeners ---
if (startBtn) {
  startBtn.addEventListener("click", () => startTimer(25 * 60, "work"));
}
if (stopBtn) {
  stopBtn.addEventListener("click", stopTimer);
}

// Planner form
const plannerForm = document.getElementById("plannerForm");
if (plannerForm) {
  plannerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = document.getElementById("plannerTask").value;
    const dueDate = document.getElementById("plannerDueDate").value;
    await savePlanner({ task, dueDate });
    alert("Task saved!");
  });
}

// Profile Pic Upload
const profilePicInput = document.getElementById("profilePicInput");
if (profilePicInput) {
  profilePicInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (file) {
      await uploadProfilePic(file);
      alert("Profile pic uploaded!");
    }
  });
}

// Group creation
const createGroupForm = document.getElementById("createGroupForm");
if (createGroupForm) {
  createGroupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("groupName").value;
    await createGroup(name);
    alert("Group created!");
  });
}

// Join group
const joinGroupForm = document.getElementById("joinGroupForm");
if (joinGroupForm) {
  joinGroupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("joinGroupId").value;
    await joinGroup(id);
    await renderGroups(id);
    alert("Joined group!");
  });
}

// --- Initial Render ---
window.onload = async () => {
  updateDisplay();
  await renderLeaderboard();
  await renderStats();
};

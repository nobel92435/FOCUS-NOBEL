// TIMER LOGIC
let timer;
let timeLeft = localStorage.getItem("timeLeft") || 25 * 60; // default 25 min

function updateDisplay() {
  let minutes = Math.floor(timeLeft / 60);
  let seconds = timeLeft % 60;
  document.getElementById("timer")?.innerText =
    `${minutes}:${seconds.toString().padStart(2, "0")}`;
  localStorage.setItem("timeLeft", timeLeft); // save progress
}

function startTimer() {
  if (timer) return; // prevent multiple intervals
  timer = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateDisplay();
    } else {
      clearInterval(timer);
      timer = null;
      alert("Time’s up!");
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timer);
  timer = null;
}

function resetTimer() {
  timeLeft = 25 * 60;
  updateDisplay();
  clearInterval(timer);
  timer = null;
}

updateDisplay(); // load saved time when opening

// TASK LIST LOGIC
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

function renderTasks() {
  let list = document.getElementById("taskList");
  if (!list) return;
  list.innerHTML = "";
  tasks.forEach((task, i) => {
    let li = document.createElement("li");
    li.textContent = task;
    li.onclick = () => {
      tasks.splice(i, 1);
      localStorage.setItem("tasks", JSON.stringify(tasks));
      renderTasks();
    };
    list.appendChild(li);
  });
}

function addTask() {
  let input = document.getElementById("taskInput");
  if (input.value.trim()) {
    tasks.push(input.value.trim());
    localStorage.setItem("tasks", JSON.stringify(tasks));
    input.value = "";
    renderTasks();
  }
}

renderTasks();

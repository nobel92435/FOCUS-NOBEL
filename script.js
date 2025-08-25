document.addEventListener('DOMContentLoaded', () => {
    const sessionTimerDisplay = document.getElementById('session-timer');
    const totalTimeDisplay = document.getElementById('total-time-display');
    const activeSubjectDisplay = document.getElementById('active-subject-display');
    const startStudyingBtn = document.getElementById('start-studying-btn');
    const stopStudyingBtn = document.getElementById('stop-studying-btn');
    const rankingList = document.getElementById('ranking-list');
    const plannerList = document.getElementById('planner-list');
    const addTaskBtn = document.getElementById('add-task-btn');
    const addTaskModal = document.getElementById('add-task-modal');
    const addTaskForm = document.getElementById('add-task-form');
    const addSubjectForm = document.getElementById('add-subject-form');

    let timerInterval = null;
    let sessionStartTime = 0;
    let totalTimeTodayInSeconds = 0;
    let activeSubject = '';

    const getStoredData = (key) => {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : [];
    };

    const setStoredData = (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    };

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const updateTotalTimeDisplay = () => {
        totalTimeDisplay.textContent = `Total Today: ${formatTime(totalTimeTodayInSeconds)}`;
    };

    const loadDailyTotal = () => {
        const today = new Date().toISOString().split('T')[0];
        const sessions = getStoredData('sessions');
        totalTimeTodayInSeconds = sessions
            .filter(session => session.date === today)
            .reduce((total, session) => total + session.duration, 0);
        updateTotalTimeDisplay();
    };

    const startTimer = (subject) => {
        activeSubject = subject;
        activeSubjectDisplay.textContent = activeSubject;
        sessionStartTime = Date.now();
        timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            sessionTimerDisplay.textContent = formatTime(elapsedSeconds);
        }, 1000);
        startStudyingBtn.classList.add('hidden');
        stopStudyingBtn.classList.remove('hidden');
    };

    const stopTimer = () => {
        clearInterval(timerInterval);
        const elapsedMillis = Date.now() - sessionStartTime;
        const sessionDurationSeconds = Math.floor(elapsedMillis / 1000);

        if (sessionDurationSeconds > 0) {
            const sessions = getStoredData('sessions');
            sessions.push({
                subject: activeSubject,
                duration: sessionDurationSeconds,
                date: new Date().toISOString().split('T')[0]
            });
            setStoredData('sessions', sessions);
            totalTimeTodayInSeconds += sessionDurationSeconds;
            updateTotalTimeDisplay();
        }

        activeSubject = '';
        activeSubjectDisplay.textContent = '';
        sessionTimerDisplay.textContent = '00:00:00';
        startStudyingBtn.classList.remove('hidden');
        stopStudyingBtn.classList.add('hidden');
    };

    const renderRanking = () => {
        if (!rankingList) return;
        const sessions = getStoredData('sessions');
        const userScores = sessions.reduce((acc, session) => {
            if (!acc[session.subject]) {
                acc[session.subject] = 0;
            }
            acc[session.subject] += session.duration;
            return acc;
        }, {});

        const sortedScores = Object.entries(userScores).sort((a, b) => b[1] - a[1]);

        rankingList.innerHTML = sortedScores.map((score, index) => {
            const rank = index + 1;
            let rankClass = '';
            if (rank === 1) rankClass = 'rank-1';
            if (rank === 2) rankClass = 'rank-2';
            if (rank === 3) rankClass = 'rank-3';

            return `
                <div class="ranking-item">
                    <div class="rank ${rankClass}">${rank}</div>
                    <div class="user-info">
                        <div class="user-name">${score[0]}</div>
                        <div class="user-time">${formatTime(score[1])}</div>
                    </div>
                </div>
            `;
        }).join('');
    };

    const renderPlanner = () => {
        if (!plannerList) return;
        const tasks = getStoredData('tasks');
        const groupedTasks = tasks.reduce((acc, task) => {
            if (!acc[task.date]) {
                acc[task.date] = [];
            }
            acc[task.date].push(task);
            return acc;
        }, {});

        plannerList.innerHTML = Object.keys(groupedTasks).sort().map(date => {
            const dayTasks = groupedTasks[date].map(task => `
                <div class="planner-task">
                    <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
                    <div class="task-name ${task.completed ? 'completed' : ''}">${task.name}</div>
                </div>
            `).join('');
            return `<div class="planner-day"><div class="day-header">${date}</div>${dayTasks}</div>`;
        }).join('');
    };

    if (startStudyingBtn) {
        startStudyingBtn.addEventListener('click', () => {
            const subjects = getStoredData('subjects');
            if (subjects.length > 0) {
                startTimer(subjects[0].name);
            } else {
                alert('Please add a subject first!');
            }
        });
    }

    if (stopStudyingBtn) {
        stopStudyingBtn.addEventListener('click', stopTimer);
    }

    if (addTaskBtn) {
        addTaskBtn.addEventListener('click', () => {
            addTaskModal.classList.add('active');
        });
    }

    if (addTaskModal) {
        addTaskModal.querySelector('.close-modal').addEventListener('click', () => {
            addTaskModal.classList.remove('active');
        });
    }

    if (addTaskForm) {
        addTaskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const tasks = getStoredData('tasks');
            const newTask = {
                id: Date.now(),
                name: document.getElementById('add-task-name').value,
                date: document.getElementById('add-task-date').value,
                completed: false
            };
            tasks.push(newTask);
            setStoredData('tasks', tasks);
            renderPlanner();
            addTaskModal.classList.remove('active');
            addTaskForm.reset();
        });
    }

    if (plannerList) {
        plannerList.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const tasks = getStoredData('tasks');
                const taskId = parseInt(e.target.dataset.id);
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = e.target.checked;
                    setStoredData('tasks', tasks);
                    renderPlanner();
                }
            }
        });
    }

    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const subjects = getStoredData('subjects');
            const newSubject = {
                id: Date.now(),
                name: document.getElementById('add-subject-name').value,
                color: document.querySelector('.color-dot.selected').dataset.color
            };
            subjects.push(newSubject);
            setStoredData('subjects', subjects);
            alert('Subject added!');
            addSubjectForm.reset();
        });

        document.querySelectorAll('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
                dot.classList.add('selected');
            });
        });
    }

    loadDailyTotal();
    renderRanking();
    renderPlanner();
});

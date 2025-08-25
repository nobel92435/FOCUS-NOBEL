// /js/ui.js

import {
    doc,
    updateDoc,
    collection,
    query,
    orderBy,
    getDocs,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getCurrentDate } from './utils.js';
import { ACHIEVEMENTS } from './utils.js'; // Assuming ACHIEVEMENTS is in utils.js

// Global UI elements (initialized in main.js)
export let sessionTimerDisplay;
export let totalTimeDisplay;
export let totalBreakTimeDisplay;
export let activeSubjectDisplay;
export let pomodoroStatusDisplay;
export let authErrorElement;

// Database instances and current user info (initialized in main.js)
let db;
let currentUser;
let currentUserData = {};
let appId;
let userSessions = [];
let groupRealtimeData = { members: {}, sessions: {} }; // For group member data

export const initUI = (elements, dbInstance, currentUserRef, currentUserDataRef, appIdRef, userSessionsRef, groupRealtimeDataRef) => {
    sessionTimerDisplay = elements.sessionTimerDisplay;
    totalTimeDisplay = elements.totalTimeDisplay;
    totalBreakTimeDisplay = elements.totalBreakTimeDisplay;
    activeSubjectDisplay = elements.activeSubjectDisplay;
    pomodoroStatusDisplay = elements.pomodoroStatusDisplay;
    authErrorElement = elements.authErrorElement;

    db = dbInstance;
    currentUser = currentUserRef;
    currentUserData = currentUserDataRef;
    appId = appIdRef;
    userSessions = userSessionsRef;
    groupRealtimeData = groupRealtimeDataRef;
};

// Helper to update current user data reference if it changes
export const updateCurrentUserAndData = (user, data) => {
    currentUser = user;
    currentUserData = data;
};

export const showToast = (message, type = 'info', duration = 3000) => {
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
};

export const showConfirmationModal = (title, message, onConfirm) => {
    const modal = document.getElementById('confirmation-modal');
    modal.querySelector('#confirmation-modal-title').textContent = title;
    modal.querySelector('#confirmation-modal-message').textContent = message;
    modal.classList.add('active');

    const confirmBtn = modal.querySelector('#confirm-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');
    const closeModalBtns = modal.querySelectorAll('.close-modal');

    const cleanup = () => {
        modal.classList.remove('active');
        // Clone and replace to remove all event listeners
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    };

    confirmBtn.onclick = () => {
        onConfirm();
        cleanup();
    };
    cancelBtn.onclick = cleanup;
    closeModalBtns.forEach(btn => btn.onclick = cleanup);
};

export const showPage = (pageId) => {
    if (!pageId) return;

    // Reset group detail state when navigating away from it
    if (pageId !== 'page-group-detail' && typeof window.groupDetailUnsubscribers !== 'undefined') {
        window.groupDetailUnsubscribers.forEach(unsub => unsub());
        window.groupDetailUnsubscribers = [];
        window.memberTimerIntervals.forEach(clearInterval);
        window.memberTimerIntervals = [];
        window.groupRealtimeData = { members: {}, sessions: {} }; // Reset global reference
    }

    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('app-container').classList.remove('active', 'flex');
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    if (pageId.startsWith('page-')) {
        document.getElementById('app-container').classList.add('active', 'flex');
        const targetPage = document.getElementById(pageId);
        if (targetPage) targetPage.classList.add('active');
    } else {
        const targetScreen = document.getElementById(pageId);
        if (targetScreen) targetScreen.classList.add('active');
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

    if (pageId === 'page-stats' && userSessions) {
        renderStatsPage(userSessions);
    }
};

export const formatTime = (seconds, includeSeconds = true) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (includeSeconds) {
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const hDisplay = h > 0 ? `${h}h ` : '';
    return `${hDisplay}${m}m`;
};

export const formatPomodoroTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const updateTotalTimeDisplay = (totalStudySeconds, totalBreakSeconds) => {
    if (totalTimeDisplay) totalTimeDisplay.textContent = `Total Today: ${formatTime(totalStudySeconds)}`;
    if (totalBreakTimeDisplay) totalBreakTimeDisplay.textContent = `Total Break: ${formatTime(totalBreakSeconds)}`;
};

export const updateProfileUI = (userData) => {
    if (!userData) return;
    currentUserData = userData; // Update local reference
    const username = userData.username || 'Anonymous';
    const email = userData.email || '';
    const studyGoal = userData.studyGoalHours;

    document.getElementById('profile-page-name').textContent = username;
    document.getElementById('profile-page-email').textContent = email;
    const avatarChar = username ? username.charAt(0).toUpperCase() : 'U';
    document.getElementById('header-avatar').textContent = avatarChar;
    document.getElementById('profile-page-avatar').textContent = avatarChar;

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
};

export const renderLeaderboard = async (period = 'weekly', containerId = 'ranking-list') => {
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
        startDate.setHours(0, 0, 0, 0);

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

        return `
            <div class="ranking-item ${currentUser.uid === user.id ? 'bg-blue-900/30' : ''}">
                <div class="rank ${rankClass}">${rank}</div>
                <div class="user-avatar bg-gray-600">${(user.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-time">${formatTime(user.totalStudySeconds, false)} ${periodText}</div>
                </div>
            </div>
        `;
    }).join('') || `<div class="empty-group"><i class="fas fa-trophy"></i><h3>Leaderboard is Empty</h3><p>Start studying to see your rank!</p></div>`;
};

// Recharts library is not included by default, assuming Chart.js is used for this app
// For a fully functional dashboard, Chart.js would need to be imported or data rendered manually.
export const renderStatsPage = (sessions) => {
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

    initializeDashboard(sessions, insightsContainer);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

let dashboardCharts = {};
const CHART_COLORS = { cyan: 'rgba(34, 211, 238, 0.6)', sky: 'rgba(56, 189, 248, 0.6)', indigo: 'rgba(129, 140, 248, 0.6)', pink: 'rgba(244, 114, 182, 0.6)', orange: 'rgba(251, 146, 60, 0.6)', };
const CHART_BORDERS = { cyan: 'rgba(34, 211, 238, 1)', sky: 'rgba(56, 189, 248, 1)', indigo: 'rgba(129, 140, 248, 1)', pink: 'rgba(244, 114, 182, 1)', orange: 'rgba(251, 146, 60, 1)', };


const formatTimeDashboard = (minutes) => {
    if (isNaN(minutes) || minutes < 0) return '00:00:00';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.floor((minutes * 60) % 60);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const destroyChart = (chartId) => {
    if (dashboardCharts[chartId]) {
        dashboardCharts[chartId].destroy();
        delete dashboardCharts[chartId];
    }
};

const generateAIInsight = (sessions) => {
    const insightTextEl = document.getElementById('ai-insight-text');
    if (!insightTextEl) return;

    if (sessions.length < 5) {
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
        insight = "Keep up the consistent effort. Every session is a step towards your goal!";
    }

    insightTextEl.textContent = insight;
};

export const renderPeriodView = (appData) => {
    const today = getCurrentDate();
    const container = document.getElementById('period-view');
    container.innerHTML = `
            <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Total Time</h3><p id="period-total-time" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Daily Average</h3><p id="period-daily-avg" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Focus Score</h3><p id="period-focus-score" class="text-4xl font-bold text-cyan-400 mt-2">--</p></div>
                <div class="card bg-gradient-to-br from-sky-500 to-indigo-600"><h3 class="text-white text-lg font-medium flex items-center"><i data-lucide="brain-circuit" class="mr-2"></i>AI Insight</h3><p id="ai-insight-text" class="text-white mt-2 text-sm">Analyzing your study patterns...</p></div>
            </div>
            <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Subject Ratio</h3><div class="chart-container" style="height: 250px;"><canvas id="subject-ratio-chart"></canvas></div></div>
            <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Time Per Day (Last 28 Days)</h3><div class="chart-container"><canvas id="time-per-day-chart"></canvas></div></div>
            <div class="card lg:col-span-3"><h3 class="font-semibold text-xl mb-4">Cumulative Study Time</h3><div class="chart-container"><canvas id="cumulative-time-chart"></canvas></div></div>
        `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    const last28DaysData = appData.filter(d => {
        const diffDays = (today - d.startTime) / (1000 * 60 * 60 * 24);
        return diffDays <= 28 && d.type === 'study';
    });

    const totalMinutes = last28DaysData.reduce((sum, s) => sum + s.duration, 0);
    const dailyAverage = totalMinutes / 28;
    const focusScore = last28DaysData.length > 0 ? Math.round((totalMinutes / last28DaysData.length) / 60 * 100) : 0;

    document.getElementById('period-total-time').textContent = formatTimeDashboard(totalMinutes);
    document.getElementById('period-daily-avg').textContent = formatTimeDashboard(dailyAverage);
    document.getElementById('period-focus-score').textContent = isNaN(focusScore) ? '0' : focusScore;

    const subjectData = last28DaysData.reduce((acc, session) => {
        acc[session.subject] = (acc[session.subject] || 0) + session.duration;
        return acc;
    }, {});
    destroyChart('subject-ratio-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['subject-ratio-chart'] = new Chart(document.getElementById('subject-ratio-chart'), {
            type: 'doughnut', plugins: [ChartDataLabels],
            data: { labels: Object.keys(subjectData), datasets: [{ data: Object.values(subjectData), backgroundColor: Object.values(CHART_COLORS), borderColor: '#1e293b', borderWidth: 4, }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } }, tooltip: { callbacks: { label: function (context) { const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = ((context.parsed / total) * 100).toFixed(1) + '%'; return `${context.label}: ${percentage}`; } } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (value * 100 / sum).toFixed(1) + "%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
        });
    }


    const timePerDay = Array(28).fill(0);
    appData.filter(d => d.type === 'study').forEach(s => {
        const dayIndex = 27 - Math.floor((today - s.startTime) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 28) { timePerDay[dayIndex] += s.duration; }
    });
    const labels28Days = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (27 - i)); return d; });
    destroyChart('time-per-day-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['time-per-day-chart'] = new Chart(document.getElementById('time-per-day-chart'), {
            type: 'bar',
            data: { labels: labels28Days.map(d => `${d.getMonth() + 1}/${d.getDate()}`), datasets: [{ label: 'Minutes Studied', data: timePerDay, backgroundColor: CHART_COLORS.sky, borderColor: CHART_BORDERS.sky, borderWidth: 1, borderRadius: 5, }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', maxRotation: 90, minRotation: 45 } } }, plugins: { legend: { display: false } } }
        });
    }

    let cumulativeTotal = 0;
    const cumulativeData = timePerDay.map(d => cumulativeTotal += d);
    destroyChart('cumulative-time-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['cumulative-time-chart'] = new Chart(document.getElementById('cumulative-time-chart'), {
            type: 'line',
            data: { labels: labels28Days.map(d => `${d.getMonth() + 1}/${d.getDate()}`), datasets: [{ label: 'Cumulative Minutes', data: cumulativeData, fill: true, backgroundColor: CHART_COLORS.cyan, borderColor: CHART_BORDERS.cyan, tension: 0.4, pointRadius: 0, }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
        });
    }
    generateAIInsight(last28DaysData);
};

export const renderMonthView = (appData) => {
    const today = getCurrentDate();
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
    if (typeof Chart !== 'undefined') {
        dashboardCharts['study-break-chart'] = new Chart(document.getElementById('study-break-chart'), {
            type: 'doughnut', plugins: [ChartDataLabels],
            data: { labels: ['Study', 'Break'], datasets: [{ data: [totalStudy, totalBreaks], backgroundColor: [CHART_COLORS.indigo, '#475569'], borderColor: '#1e293b', borderWidth: 4, }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#cbd5e1' } }, tooltip: { callbacks: { label: function (context) { const total = context.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (total > 0) ? ((context.parsed / total) * 100).toFixed(1) + '%' : '0%'; return `${context.label}: ${percentage}`; } } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (sum > 0) ? (value * 100 / sum).toFixed(1) + "%" : "0%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
        });
    }

    const subjectDataMonth = thisMonthData.filter(s => s.type === 'study').reduce((acc, session) => { acc[session.subject] = (acc[session.subject] || 0) + session.duration; return acc; }, {});
    destroyChart('study-time-by-subject-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['study-time-by-subject-chart'] = new Chart(document.getElementById('study-time-by-subject-chart'), {
            type: 'bar',
            data: { labels: Object.keys(subjectDataMonth), datasets: [{ label: 'Minutes Studied', data: Object.values(subjectDataMonth), backgroundColor: Object.values(CHART_COLORS), }] },
            options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
        });
    }

    const distributionData = thisMonthData.filter(s => s.type === 'study').map(s => ({ x: s.startTime, y: s.startTime.getHours() + s.startTime.getMinutes() / 60, yEnd: s.endTime.getHours() + s.endTime.getMinutes() / 60, }));
    destroyChart('start-end-distribution-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['start-end-distribution-chart'] = new Chart(document.getElementById('start-end-distribution-chart'), {
            type: 'scatter',
            data: {
                datasets: [{ label: 'Start Time', data: distributionData.map(d => ({ x: d.x, y: d.y })), backgroundColor: CHART_COLORS.sky, }, { label: 'End Time', data: distributionData.map(d => ({ x: d.x, y: d.yEnd })), backgroundColor: CHART_COLORS.pink, }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'day' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { beginAtZero: true, max: 24, grid: { color: '#334155' }, ticks: { color: '#94a3b8', stepSize: 2, callback: (v) => `${v}:00` } } }, plugins: { legend: { labels: { color: '#cbd5e1' } } }
            }
        });
    }
};

export const renderTrendView = (appData) => {
    const today = getCurrentDate();
    const container = document.getElementById('trend-view');
    container.innerHTML = `
            <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Study Time Regularity</h3><div class="chart-container"><canvas id="regularity-chart"></canvas></div></div>
            <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Performance Forecast</h3><div class="chart-container"><canvas id="forecast-chart"></canvas></div></div>
            <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Recent Session Log</h3><div id="session-log-container-trend" class="max-h-80 overflow-y-auto pr-2"></div></div>
        `;

    const regularityData = appData.filter(s => s.type === 'study').slice(-50).map(s => ({ x: s.startTime, y: s.startTime.getHours() + s.startTime.getMinutes() / 60, r: s.duration / 10 }));
    destroyChart('regularity-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['regularity-chart'] = new Chart(document.getElementById('regularity-chart'), {
            type: 'bubble',
            data: { datasets: [{ label: 'Study Session', data: regularityData, backgroundColor: CHART_COLORS.indigo, }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'time', time: { unit: 'day' }, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, y: { min: 6, max: 24, grid: { color: '#334155' }, ticks: { color: '#94a3b8', stepSize: 3, callback: (v) => `${v}:00` } } }, plugins: { legend: { display: false } } }
        });
    }

    const last14Days = Array(14).fill(0);
    appData.filter(d => (today - d.startTime) / (1000 * 60 * 60 * 24) <= 14 && d.type === 'study').forEach(s => {
        const dayIndex = 13 - Math.floor((today - s.startTime) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0) last14Days[dayIndex] += s.duration;
    });
    const avgLast14 = last14Days.reduce((a, b) => a + b, 0) / 14;
    const forecastData = Array.from({ length: 7 }, (_, i) => avgLast14 * (i + 1) + last14Days.reduce((a, b) => a + b, 0));
    const forecastLabels = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i + 1); return `${d.getMonth() + 1}/${d.getDate()}`; });

    destroyChart('forecast-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['forecast-chart'] = new Chart(document.getElementById('forecast-chart'), {
            type: 'line',
            data: { labels: forecastLabels, datasets: [{ label: 'Projected Study Minutes', data: forecastData, borderColor: CHART_BORDERS.orange, backgroundColor: CHART_COLORS.orange, borderDash: [5, 5], tension: 0.2, }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8' } } }, plugins: { legend: { display: false } } }
        });
    }

    renderSessionLog(appData.filter(s => s.type === 'study').slice().reverse().slice(0, 20), 'session-log-container-trend');
};

export const renderDayView = (appData) => {
    const today = getCurrentDate();
    const container = document.getElementById('day-view');
    container.innerHTML = `
            <div class="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Total Time Today</h3><p id="day-total-time" class="text-4xl font-bold text-cyan-400 mt-2">--:--:--</p></div>
                 <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Sessions Today</h3><p id="day-session-count" class="text-4xl font-bold text-cyan-400 mt-2">--</p></div>
                 <div class="card flex flex-col justify-center items-center"><h3 class="text-slate-400 text-lg font-medium">Avg. Session</h3><p id="day-avg-session" class="text-4xl font-bold text-cyan-400 mt-2">--m</p></div>
            </div>
            <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Today's Subject Ratio</h3><div class="chart-container" style="height:250px;"><canvas id="day-subject-ratio-chart"></canvas></div></div>
            <div class="card lg:col-span-1"><h3 class="font-semibold text-xl mb-4">Time Per Hour Today</h3><div class="chart-container"><canvas id="day-time-per-hour-chart"></canvas></div></div>
            <div class="card lg:col-span-2"><h3 class="font-semibold text-xl mb-4">Today's Session Log</h3><div id="session-log-container-day" class="max-h-80 overflow-y-auto pr-2"></div></div>
        `;

    const todayStr = today.toISOString().split('T')[0];
    const todayData = appData.filter(d => d.startTime.toISOString().split('T')[0] === todayStr && d.type === 'study');

    const totalMinutesToday = todayData.reduce((sum, s) => sum + s.duration, 0);
    const sessionCountToday = todayData.length;
    const avgSessionMinutes = sessionCountToday > 0 ? totalMinutesToday / sessionCountToday : 0;

    document.getElementById('day-total-time').textContent = formatTimeDashboard(totalMinutesToday);
    document.getElementById('day-session-count').textContent = sessionCountToday;
    document.getElementById('day-avg-session').textContent = `${avgSessionMinutes.toFixed(0)}m`;

    const subjectDataToday = todayData.reduce((acc, session) => {
        acc[session.subject] = (acc[session.subject] || 0) + session.duration;
        return acc;
    }, {});
    destroyChart('day-subject-ratio-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['day-subject-ratio-chart'] = new Chart(document.getElementById('day-subject-ratio-chart'), {
            type: 'pie', plugins: [ChartDataLabels],
            data: { labels: Object.keys(subjectDataToday), datasets: [{ data: Object.values(subjectDataToday), backgroundColor: Object.values(CHART_COLORS), borderColor: '#1e293b', borderWidth: 4, }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#cbd5e1' } }, datalabels: { formatter: (value, ctx) => { const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0); const percentage = (value * 100 / sum).toFixed(0) + "%"; return percentage; }, color: '#ffffff', font: { weight: 'bold' } } } }
        });
    }

    const timePerHour = Array(24).fill(0);
    todayData.forEach(s => {
        const hour = s.startTime.getHours();
        timePerHour[hour] += s.duration;
    });
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    destroyChart('day-time-per-hour-chart');
    if (typeof Chart !== 'undefined') {
        dashboardCharts['day-time-per-hour-chart'] = new Chart(document.getElementById('day-time-per-hour-chart'), {
            type: 'bar',
            data: { labels: hourLabels, datasets: [{ label: 'Minutes Studied', data: timePerHour, backgroundColor: CHART_COLORS.sky, borderRadius: 5, }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } }, x: { grid: { color: '#334155' }, ticks: { color: '#94a3b8', maxRotation: 90, minRotation: 45 } } }, plugins: { legend: { display: false } } }
        });
    }

    renderSessionLog(todayData.slice().reverse(), 'session-log-container-day');
};

export const renderSessionLog = (sessions, containerId) => {
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
};


export const initializeDashboard = (focusSessions) => {
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
            type: session.type || 'study'
        };
    }).filter(Boolean);

    appData.sort((a, b) => a.startTime - b.startTime);

    const insightsContainer = document.getElementById('insights-container');
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
                case 'day': renderDayView(appData); break;
                case 'trend': renderTrendView(appData); break;
                case 'month': renderMonthView(appData); break;
                case 'period': renderPeriodView(appData); break;
            }
        }
    });

    // Initial render
    const initialActiveView = insightsContainer.querySelector('.nav-btn.active').dataset.view;
    if (initialActiveView === 'day') {
        renderDayView(appData);
    } else if (initialActiveView === 'trend') {
        renderTrendView(appData);
    } else if (initialActiveView === 'month') {
        renderMonthView(appData);
    } else {
        renderPeriodView(appData);
    }
};

export const renderJoinedGroups = async () => {
    if (!currentUser) return;
    const container = document.getElementById('my-groups-list');
    if (!container) return;

    const joinedGroupIds = currentUserData.joinedGroups || [];

    if (joinedGroupIds.length === 0) {
        container.innerHTML = `<div class="empty-group"><i class="fas fa-users-slash"></i><h3>No Groups Joined Yet</h3><p>You haven't joined any study groups. Join a group or create your own to get started!</p><button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition mt-4" id="explore-groups-btn">Explore Groups</button></div>`;
        return; // Event listener added in main.js
    }

    const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
    const groupsSnapshot = await getDocs(groupsCollectionRef);
    const allGroups = {};
    groupsSnapshot.forEach(doc => allGroups[doc.id] = { id: doc.id, ...doc.data() });

    let html = '<div class="grid grid-cols-1 gap-4">';
    joinedGroupIds.forEach(groupId => {
        const group = allGroups[groupId];
        if (!group) return;
        const memberCount = group.members ? group.members.length : 0;
        const isFull = memberCount >= group.capacity;
        let headerColor = 'linear-gradient(135deg, #4361ee 0%, #4895ef 100%)';
        if (group.category === 'Language study') headerColor = 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)';
        else if (group.category === 'Secondary School') headerColor = 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)';
        else if (group.category === 'University') headerColor = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        html += `<div class="group-card" data-group-id="${group.id}"><div class="group-header" style="background: ${headerColor}"><div class="group-category">${group.category}</div><div class="group-name">${group.name}${isFull ? '<span class="badge">Full</span>' : ''}</div><div class="group-stats"><div class="stat-item"><div class="stat-value">${group.attendance || 0}%</div><div class="stat-label">Attendance</div></div><div class="stat-item"><div class="stat-value">${group.avgTime || 'N/A'}</div><div class="stat-label">Avg. Time</div></div><div class="stat-item"><div class="stat-value">${memberCount}/${group.capacity}</div><div class="stat-label">Members</div></div></div></div><div class="group-body"><div class="group-goal"><div class="goal-text">Goal: ${group.timeGoal} hours/day</div><div class="leader"><i class="fas fa-crown"></i> Leader: ${group.leaderName}</div></div><div class="group-description">${group.description}</div><div class="joined-badge"><i class="fas fa-check-circle"></i> Joined</div><div class="group-meta"><div>Started: ${group.createdAt?.toDate().toLocaleDateString()}</div><div><i class="fas fa-comment"></i> 12 new</div></div></div></div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

export const renderAvailableGroups = async () => {
    if (!currentUser) return;
    const container = document.getElementById('all-groups-list');
    if (!container) return;

    const joinedGroupIds = currentUserData.joinedGroups || [];

    const groupsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'groups');
    const groupsSnapshot = await getDocs(groupsCollectionRef);
    const availableGroups = [];
    groupsSnapshot.forEach(doc => {
        if (!joinedGroupIds.includes(doc.id)) {
            availableGroups.push({ id: doc.id, ...doc.data() });
        }
    });

    if (availableGroups.length === 0) {
        container.innerHTML = `<div class="empty-group"><i class="fas fa-search"></i><h3>No Groups Available</h3><p>There are no study groups available at the moment. Why not create your own group?</p><button class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition mt-4" id="create-first-group-btn">Create Group</button></div>`;
        return; // Event listener added in main.js
    }

    container.innerHTML = '<div class="grid grid-cols-1 gap-4">' + availableGroups.map(group => {
        const memberCount = group.members ? group.members.length : 0;
        const isFull = memberCount >= group.capacity;
        const isPrivate = !!group.password;
        let headerColor = 'linear-gradient(135deg, #4361ee 0%, #4895ef 100%)';
        if (group.category === 'Language study') headerColor = 'linear-gradient(135deg, #00bcd4 0%, #0097a7 100%)';
        else if (group.category === 'Secondary School') headerColor = 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)';
        else if (group.category === 'University') headerColor = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
        return `<div class="group-card"><div class="group-header" style="background: ${headerColor}"><div class="group-category">${group.category}</div><div class="group-name">${group.name}${isFull ? '<span class="badge">Full</span>' : ''}</div><div class="group-stats"><div class="stat-item"><div class="stat-value">${group.attendance || 0}%</div><div class="stat-label">Attendance</div></div><div class="stat-item"><div class="stat-value">${group.avgTime || 'N/A'}</div><div class="stat-label">Avg. Time</div></div><div class="stat-item"><div class="stat-value">${memberCount}/${group.capacity}</div><div class="stat-label">Members</div></div></div></div><div class="group-body"><div class="group-goal"><div class="goal-text">Goal: ${group.timeGoal} hours/day</div><div class="leader"><i class="fas fa-crown"></i> Leader: ${group.leaderName}</div></div><div class="group-description">${group.description}</div><button class="join-btn" data-id="${group.id}" data-private="${isPrivate}" ${isFull ? 'disabled' : ''}>${isFull ? 'Group Full' : 'Join Group'}</button><div class="group-meta"><div>Started: ${group.createdAt?.toDate().toLocaleDateString()}</div><div><i class="fas ${isPrivate ? 'fa-lock' : 'fa-lock-open'}"></i> ${isPrivate ? 'Private' : 'Public'}</div></div></div></div>`;
    }).join('') + '</div>';

    // Event listeners for join buttons handled in main.js
};

export const renderSubjectSelectionList = (subjects, newlyAddedSubjectName = null) => {
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
            container.querySelectorAll('.subject-item.selected').forEach(el => el.classList.remove('selected'));
            newSubjectElement.classList.add('selected');
            newSubjectElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    } else {
        container.querySelectorAll('.subject-item.selected').forEach(el => el.classList.remove('selected'));
    }
};

export const renderPlanner = (tasks) => {
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
};

export const renderGroupDetail = async (groupId, currentGroupIdRef, groupDetailUnsubscribersRef, memberTimerIntervalsRef) => {
    // Update global currentGroupId in main.js
    if (typeof window.setCurrentGroupId === 'function') {
        window.setCurrentGroupId(groupId);
    }
    
    // Clear previous listeners and intervals
    groupDetailUnsubscribersRef.forEach(unsub => unsub());
    window.groupDetailUnsubscribers = []; // Update global reference
    memberTimerIntervalsRef.forEach(clearInterval);
    window.memberTimerIntervals = []; // Update global reference
    window.groupRealtimeData = { members: {}, sessions: {} }; // Reset global reference

    const groupDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'groups', groupId);

    const groupSelector = document.getElementById('group-selector');
    if (groupSelector) {
        groupSelector.innerHTML = '';
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
        groupSelector.value = groupId;
        groupSelector.onchange = (e) => {
            renderGroupDetail(e.target.value, currentGroupIdRef, groupDetailUnsubscribersRef, memberTimerIntervalsRef); // Recurse with new group ID
        };
    }

    const groupUnsub = onSnapshot(groupDocRef, async (groupDoc) => {
        const container = document.getElementById('group-detail-content');
        if (!container || !groupDoc.exists()) {
            showPage('page-my-groups');
            return;
        }
        const groupData = groupDoc.data();

        setupGroupMemberListeners(groupData.members || [], groupDetailUnsubscribersRef, memberTimerIntervalsRef);

        const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage || 'home';
        renderGroupSubPage(activeSubPage, groupDoc.id);
    });
    groupDetailUnsubscribersRef.push(groupUnsub); // Add to local array
    window.groupDetailUnsubscribers.push(groupUnsub); // Also update global reference for cleanup
};


export const setupGroupMemberListeners = (memberIds, groupDetailUnsubscribersRef, memberTimerIntervalsRef) => {
    groupDetailUnsubscribersRef.forEach(unsub => unsub());
    window.groupDetailUnsubscribers = [];
    memberTimerIntervalsRef.forEach(clearInterval);
    window.memberTimerIntervals = [];
    window.groupRealtimeData = { members: {}, sessions: {} };

    memberIds.forEach(memberId => {
        const userDocRef = doc(db, 'artifacts', appId, 'users', memberId);
        const userUnsub = onSnapshot(userDocRef, (doc) => {
            window.groupRealtimeData.members[memberId] = doc.data();
            const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage || 'home';
            if (activeSubPage === 'home') {
                renderGroupMembers();
            }
        });
        groupDetailUnsubscribersRef.push(userUnsub);
        window.groupDetailUnsubscribers.push(userUnsub);

        const sessionsRef = collection(userDocRef, 'sessions');
        const sessionsUnsub = onSnapshot(sessionsRef, (snapshot) => {
            window.groupRealtimeData.sessions[memberId] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                endedAt: doc.data().endedAt && typeof doc.data().endedAt.toDate === 'function' ? doc.data().endedAt.toDate() : null,
                type: doc.data().type || 'study'
            }));
            const activeSubPage = document.querySelector('#group-detail-nav .active')?.dataset.subpage;
            if (activeSubPage === 'rankings') {
                renderGroupLeaderboard();
            } else if (activeSubPage === 'attendance') {
                renderGroupAttendance();
            }
        });
        groupDetailUnsubscribersRef.push(sessionsUnsub);
        window.groupDetailUnsubscribers.push(sessionsUnsub);
    });
};

export const renderGroupSubPage = (subpage, currentGroupId) => {
    const container = document.getElementById('group-detail-content');
    if (!container) return;

    const rankingScopeSwitch = document.getElementById('ranking-scope-switch');
    if (subpage === 'rankings') {
        rankingScopeSwitch.classList.remove('hidden');
        rankingScopeSwitch.classList.add('flex');
    } else {
        rankingScopeSwitch.classList.add('hidden');
        rankingScopeSwitch.classList.remove('flex');
    }

    document.querySelectorAll('.group-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelector(`.group-nav-item[data-subpage="${subpage}"]`).classList.add('active');

    if (subpage === 'home') {
        container.innerHTML = '<div id="group-member-list" class="p-4 flex flex-col gap-3"></div>';
        renderGroupMembers();
    } else if (subpage === 'invite') {
        const inviteLink = `${window.location.origin}${window.location.pathname}?groupId=${currentGroupId}`;
        container.innerHTML = `<div class="p-8 text-center"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(inviteLink)}" class="mx-auto mb-4 rounded-lg"><p class="text-blue-400 break-all">${inviteLink}</p><div class="flex gap-4 mt-4"><button id="copy-link-btn" class="w-full py-2 bg-gray-700 rounded-lg">Copy Link</button><button class="w-full py-2 bg-orange-500 rounded-lg">Share Link</button></div><p class="text-gray-500 mt-4 text-sm">Share this link to invite a friend or organization to study with you.</p></div>`;
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            document.execCommand('copy');
            showToast('Link copied to clipboard!', 'success');
        });
    } else if (subpage === 'chat') {
        container.innerHTML = `<div class="p-4 flex flex-col h-full"><div id="chat-messages" class="flex-grow overflow-y-auto"></div><form id="chat-form" class="flex gap-2 mt-4"><input id="chat-input" class="flex-grow bg-gray-700 rounded-lg p-3" placeholder="Type a message..."><button type="submit" class="bg-blue-600 px-4 rounded-lg"><i class="fas fa-paper-plane"></i></button></form></div>`;
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

        document.getElementById('global-ranking-scope-btn').classList.remove('active');
        document.getElementById('group-ranking-scope-btn').classList.add('active');

        renderGroupLeaderboard(); // Initial render

        document.getElementById('group-ranking-period-tabs').addEventListener('click', (e) => {
            if (e.target.classList.contains('ranking-tab-btn')) {
                const period = e.target.dataset.period;
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
            <div class="attendance-calendar">
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
        renderGroupAttendance(currentGroupId); // Pass current group ID if needed for attendance
    } else {
        container.innerHTML = `<div class="p-8 text-center text-gray-400">${subpage.charAt(0).toUpperCase() + subpage.slice(1)} page is coming soon!</div>`;
    }
};

export const renderGroupMembers = () => {
    const memberList = document.getElementById('group-member-list');
    if (!memberList) return;

    window.memberTimerIntervals.forEach(clearInterval);
    window.memberTimerIntervals = [];

    const todayStr = getCurrentDate().toISOString().split('T')[0];

    const membersArray = Object.keys(window.groupRealtimeData.members).map(memberId => {
        const memberData = window.groupRealtimeData.members[memberId];
        let totalTodaySeconds = 0;
        if (memberData.totalTimeToday && memberData.totalTimeToday.date === todayStr) {
            totalTodaySeconds = memberData.totalTimeToday.seconds;
        }
        const isStudying = memberData.studying;
        const currentSessionElapsed = (isStudying && memberData.studying.type === 'study') ? (Date.now() - memberData.studying.startTime.toDate()) / 1000 : 0;
        const effectiveTotalToday = totalTodaySeconds + currentSessionElapsed;

        return {
            id: memberId,
            data: memberData,
            isStudying: isStudying,
            effectiveTotalToday: effectiveTotalToday
        };
    });

    membersArray.sort((a, b) => {
        if (a.isStudying && !b.isStudying) return -1;
        if (!a.isStudying && b.isStudying) return 1;
        return b.effectiveTotalToday - a.effectiveTotalToday;
    });


    memberList.innerHTML = membersArray.map(member => {
        const memberData = member.data;
        const memberId = member.id;
        const isStudying = member.isStudying;
        const totalTodaySeconds = member.effectiveTotalToday;

        return `
            <div class="member-list-card">
                <div class="member-avatar ${isStudying ? 'studying' : ''}">
                    ${(memberData.username || 'U').charAt(0).toUpperCase()}
                    ${isStudying ? '<div class="member-status-icon"></div>' : ''}
                </div>
                <div class="flex-grow">
                    <div class="font-bold text-white">${memberData.username || 'Anonymous'}</div>
                    <div class="text-sm ${isStudying ? 'text-green-400' : 'text-gray-400'}" id="member-subject-${memberId}">
                        ${isStudying ? `Studying: ${memberData.studying.subject}` : 'Idle'}
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xl font-semibold text-white" id="member-time-${memberId}" data-base-time="${member.data.totalTimeToday && member.data.totalTimeToday.date === todayStr ? member.data.totalTimeToday.seconds : 0}" data-start-time="${isStudying ? memberData.studying.startTime.toDate().getTime() : 0}">
                        ${formatTime(totalTodaySeconds)}
                    </div>
                    <div class="text-xs text-gray-500">Total Today</div>
                </div>
            </div>
        `;
    }).join('');

    membersArray.forEach(member => {
        const memberData = member.data;
        const memberId = member.id;
        const timeEl = document.getElementById(`member-time-${memberId}`);
        if (memberData && memberData.studying && memberData.studying.type === 'study' && timeEl) {
            const baseTime = parseFloat(timeEl.dataset.baseTime);
            const startTime = parseFloat(timeEl.dataset.startTime);
            if (startTime > 0) {
                const interval = setInterval(() => {
                    const ongoingSeconds = (Date.now() - startTime) / 1000;
                    timeEl.textContent = formatTime(baseTime + ongoingSeconds);
                }, 1000);
                window.memberTimerIntervals.push(interval);
            }
        }
    });
};

export const renderGroupLeaderboard = (period) => {
    const container = document.getElementById('group-ranking-list');
    if (!container) return;

    if (!period) {
        period = document.querySelector('#group-ranking-period-tabs .ranking-tab-btn.active')?.dataset.period || 'weekly';
    }

    document.querySelectorAll('#group-ranking-period-tabs .ranking-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.period === period);
    });

    const userScores = Object.keys(window.groupRealtimeData.members).map(memberId => {
        const memberData = window.groupRealtimeData.members[memberId];
        const memberSessions = window.groupRealtimeData.sessions[memberId] || [];

        const now = getCurrentDate();
        let startDate;
        switch (period) {
            case 'daily':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'monthly':
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 30);
                break;
            case 'weekly':
            default:
                startDate = new Date(now);
                startDate.setDate(now.getDate() - 7);
                break;
        }
        startDate.setHours(0, 0, 0, 0);

        const totalSeconds = memberSessions
            .filter(s => s.endedAt && s.endedAt >= startDate && s.type === 'study')
            .reduce((sum, s) => sum + s.durationSeconds, 0);

        return {
            id: memberId,
            username: memberData.username || 'Anonymous',
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

        return `
            <div class="ranking-item ${currentUser.uid === user.id ? 'bg-blue-900/30' : ''}">
                <div class="rank ${rankClass}">${rank}</div>
                <div class="user-avatar bg-gray-600">${(user.username || 'U').charAt(0).toUpperCase()}</div>
                <div class="user-info">
                    <div class="user-name">${user.username}</div>
                    <div class="user-time">${formatTime(user.totalStudySeconds, false)} ${periodText}</div>
                </div>
            </div>
        `;
    }).join('') || `<div class="empty-group"><i class="fas fa-trophy"></i><h3>Leaderboard is Empty</h3><p>Start studying to see your rank!</p></div>`;
};

export const renderGroupAttendance = () => {
    const container = document.getElementById('calendar-grid');
    if (!container) return;

    let attendanceMonth = window.attendanceMonth;
    let attendanceYear = window.attendanceYear;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month-display').textContent = `${monthNames[attendanceMonth]} ${attendanceYear}`;

    const firstDayOfMonth = new Date(attendanceYear, attendanceMonth, 1);
    const lastDayOfMonth = new Date(attendanceYear, attendanceMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDay = firstDayOfMonth.getDay();

    container.innerHTML = Array(startDay).fill('<div class="calendar-day empty"></div>').join('');
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${attendanceYear}-${(attendanceMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        container.innerHTML += `
            <div class="calendar-day ${isToday(attendanceYear, attendanceMonth, day) ? 'today' : ''}" data-date="${dateStr}">
                <div class="day-number">${day}</div>
                <div class="day-time">0h 0m</div>
            </div>
        `;
    }

    const attendanceData = {};
    const memberAttendanceData = {};

    for (const memberId in window.groupRealtimeData.sessions) {
        memberAttendanceData[memberId] = { totalTime: 0, daysStudied: new Set() };
        const memberSessions = window.groupRealtimeData.sessions[memberId];
        memberSessions.forEach(session => {
            const sessionDate = session.endedAt instanceof Date ? session.endedAt : null;
            if (sessionDate && sessionDate.getFullYear() === attendanceYear && sessionDate.getMonth() === attendanceMonth && session.type === 'study') {
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
        memberGrid.innerHTML = Object.keys(window.groupRealtimeData.members).map(memberId => {
            const userData = window.groupRealtimeData.members[memberId];
            if (!userData) return '';
            const memberStats = memberAttendanceData[memberId] || { totalTime: 0, daysStudied: new Set() };
            const memberAttendanceRate = Math.round((memberStats.daysStudied.size / daysInMonth) * 100);
            return `
                <div class="member-row">
                    <div class="member-avatar-sm">${(userData.username || 'U').charAt(0).toUpperCase()}</div>
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
        window.attendanceMonth--;
        if (window.attendanceMonth < 0) {
            window.attendanceMonth = 11;
            window.attendanceYear--;
        }
        renderGroupAttendance();
    };

    document.getElementById('next-month-btn').onclick = () => {
        window.attendanceMonth++;
        if (window.attendanceMonth > 11) {
            window.attendanceMonth = 0;
            window.attendanceYear++;
        }
        renderGroupAttendance();
    };
};

const isToday = (year, month, day) => {
    const today = getCurrentDate();
    return today.getFullYear() === year &&
        today.getMonth() === month &&
        today.getDate() === day;
};

export const setupGroupChat = (groupId, groupDetailUnsubscribersRef) => {
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
            messageEl.innerHTML = `
                <div class="chat-bubble ${isSent ? 'sent' : 'received'}">
                    ${!isSent ? `<div class="chat-sender">${msg.senderName}</div>` : ''}
                    <div>${msg.text}</div>
                </div>
            `;
            chatMessagesContainer.appendChild(messageEl);
        });
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    });
    groupDetailUnsubscribersRef.push(chatUnsub); // Add to local array
    window.groupDetailUnsubscribers.push(chatUnsub); // Also update global reference for cleanup

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
};

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
        let saveSessionCallable, getLeaderboardCallable, addPlannerTaskCallable, updatePlannerTaskCallable, deletePlannerTaskCallable, createGroupCallable, joinGroupCallable;


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
            // MODIFICATION: Call the backend function to save the session
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
        sendPomodoroNotification = httpsCallable(functions, 'sendPomodoroNotification'); // Assign callable function
        sendWakeUpNotification = httpsCallable(functions, 'sendWakeUpNotification');
        sendGroupWakeUpNotification = httpsCallable(functions, 'sendGroupWakeUpNotification');
        // MODIFICATION: Add callable functions for backend logic
        saveSessionCallable = httpsCallable(functions, 'saveSession');
        getLeaderboardCallable = httpsCallable(functions, 'getLeaderboard');
        addPlannerTaskCallable = httpsCallable(functions, 'addPlannerTask');
        updatePlannerTaskCallable = httpsCallable(functions, 'updatePlannerTask');
        deletePlannerTaskCallable = httpsCallable(functions, 'deletePlannerTask');
        createGroupCallable = httpsCallable(functions, 'createGroup');
        joinGroupCallable = httpsCallable(functions, 'joinGroup');
        // ---------------------------------

                onAuthStateChanged(auth, async (user) => {
                    if (user) {
                        currentUser = user;
        
                    }
                });

        async function saveSession(subject, durationSeconds, sessionType = 'study') {
            if (!currentUser || durationSeconds <= 0) {
                return;
            }
        
            const MAX_BREAK_SECONDS = 3 * 3600;
            const cappedDuration = (sessionType === 'break' && durationSeconds > MAX_BREAK_SECONDS) ? MAX_BREAK_SECONDS : durationSeconds;
        
            try {
                // Optimistically update local state for instant UI feedback
                if (sessionType === 'study') {
                    totalTimeTodayInSeconds += cappedDuration;
                } else {
                    totalBreakTimeTodayInSeconds += cappedDuration;
                }
                updateTotalTimeDisplay();
        
                const result = await saveSessionCallable({
                    subject: subject,
                    durationSeconds: cappedDuration,
                    sessionType: sessionType,
                    appId: appId
                });
        
                if (result.data.success) {
                    showToast(`Session of ${formatTime(cappedDuration, false)} saved!`, "success");
                    // Handle achievements returned from the backend
                    if (result.data.unlockedAchievements && result.data.unlockedAchievements.length > 0) {
                        result.data.unlockedAchievements.forEach(achievement => {
                            showToast(`Achievement Unlocked: ${achievement.name}!`, 'success');
                        });
                    }
                } else {
                    throw new Error(result.data.message || "Failed to save session on server.");
                }
            } catch (error) {
                // Rollback optimistic update on failure
                if (sessionType === 'study') {
                    totalTimeTodayInSeconds -= cappedDuration;
                } else {
                    totalBreakTimeTodayInSeconds -= cappedDuration;
                }
                updateTotalTimeDisplay();
                console.error("Error calling saveSession function:", error);
                showToast(error.message || "Error saving session.", "error");
            }
        }
        
        // MODIFICATION: Removed the client-side checkAndAwardAchievements function.
        // This logic is now handled by the 'saveSession' cloud function on the backend.

        async function loadDailyTotal() {
            if (!currentUser) return;
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
        }
        async function addPlannerTask(title, dueDateStr = null) {
            if (!currentUser || !title.trim()) return;
            
            try {
                await addPlannerTaskCallable({
                    title: title.trim(),
                    // The backend function handles the conversion from string to Date object
                    dueDate: dueDateStr ? (new Date(dueDateStr + 'T00:00:00')).toISOString() : null,
                    listId: plannerState.activeListId,
                    appId: appId
                });
            } catch (error) {
                console.error("Error adding task:", error);
                showToast(error.message || "Failed to add task.", "error");
            }
        }
        
        async function updatePlannerTask(taskId, data) {
            if (!currentUser || !taskId) return;
            try {
                 // Ensure Date objects are converted to a serializable format (ISO string)
                if (data.dueDate instanceof Date) {
                    data.dueDate = data.dueDate.toISOString();
                }
                await updatePlannerTaskCallable({ taskId, updateData: data, appId });
            } catch (error) {
                console.error("Error updating task:", error);
                showToast(error.message || "Failed to update task.", "error");
            }
        }

        async function deletePlannerTask(taskId) {
            if (!currentUser || !taskId) return;
            try {
                await deletePlannerTaskCallable({ taskId, appId });
                plannerState.selectedTaskId = null;
                renderPlannerTaskDetails(); // Hide the panel
            } catch (error) {
                console.error("Error deleting task:", error);
                showToast(error.message || "Failed to delete task.", "error");
            }
        }
        
        // =================================================================================
        // ============================= NEW PLANNER LOGIC END =============================
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

            try {
                // MODIFICATION: Call the backend function to get leaderboard data
                const result = await getLeaderboardCallable({ period, appId });
                const userScores = result.data;

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

            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                container.innerHTML = `<div class="empty-group"><i class="fas fa-exclamation-triangle"></i><h3>Error Loading Leaderboard</h3><p>${error.message}</p></div>`;
            }
        }

        function renderStatsPage(focusSessions) {
            const insightsContainer = document.getElementById('insights-container');
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
                // MODIFICATION: Call the backend function to create the group
                await createGroupCallable({
                    name, description, category, timeGoal, capacity,
                    password: password || null,
                    appId: appId
                });
        
                showToast('Group created successfully!', 'success');
                renderGroupRankings();
                showPage('page-find-groups');
                form.reset();
            } catch (error) {
                console.error('Error creating group:', error);
                showToast(error.message || 'Failed to create group.', 'error');
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
                    const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
                    const publicUserRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', currentUser.uid);
                    try {
                        const batch = firestoreWriteBatch(db);
                        batch.update(userRef, { photoURL: selectedAvatar });
                        batch.update(publicUserRef, { photoURL: selectedAvatar });
                        await batch.commit();
                        document.getElementById('avatar-character-modal').classList.remove('active');
                        showToast('Avatar updated!', 'success');
                    } catch (error) {
                        console.error("Avatar update failed:", error);
                        showToast('Failed to update avatar.', 'error');
                    }
                } else {
                    showToast('Please select a character.', 'info');
                }
            });

        });



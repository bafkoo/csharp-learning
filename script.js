// Data Management
class LearningTracker {
    constructor() {
        this.data = this.loadData();
        this.init();
    }

    // Load data from localStorage
    loadData() {
        const defaultData = {
            totalDays: 0,
            totalXP: 0,
            currentLevel: 0,
            streak: 0,
            tasksCompleted: 0,
            projectsCreated: 0,
            hoursStudied: 0,
            achievementsUnlocked: [],
            dailyEntries: {},
            goals: [
                { id: 1, text: "Настроить среду разработки", completed: false },
                { id: 2, text: "Написать Hello World", completed: false },
                { id: 3, text: "Пройти первый урок на Stepik", completed: false }
            ],
            lastStudyDate: null,
            currentWeek: 1,
            weekProgress: {},
            projects: []
        };

        const saved = localStorage.getItem('csharpLearningData');
        return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    }

    // Save data to localStorage
    saveData() {
        localStorage.setItem('csharpLearningData', JSON.stringify(this.data));
    }

    // Initialize the app
    init() {
        this.updateUI();
        this.loadProjects();
        this.loadAchievements();
        this.loadRoadmap();
        this.setTodayDate();
    }

    // Update UI with current data
    updateUI() {
        document.getElementById('totalDays').textContent = this.data.totalDays;
        document.getElementById('totalXP').textContent = this.data.totalXP;
        document.getElementById('currentLevel').textContent = this.getLevelName();
        document.getElementById('streakDays').textContent = this.data.streak;
        document.getElementById('tasksCompleted').textContent = this.data.tasksCompleted;
        document.getElementById('projectsCreated').textContent = this.data.projectsCreated;
        document.getElementById('hoursStudied').textContent = this.data.hoursStudied;
        document.getElementById('achievementsUnlocked').textContent = `${this.data.achievementsUnlocked.length}/50`;
        
        this.updateProgressBars();
        this.updateXPBar();
        this.updateGoals();
        this.updateRecentAchievements();
    }

    // Get level name based on XP
    getLevelName() {
        const levels = [
            { min: 0, name: "Новичок" },
            { min: 100, name: "Начинающий" },
            { min: 300, name: "Ученик" },
            { min: 600, name: "Практик" },
            { min: 1000, name: "Разработчик" },
            { min: 1500, name: "Специалист" },
            { min: 2200, name: "Эксперт" },
            { min: 3000, name: "Мастер" },
            { min: 4000, name: "Гуру" },
            { min: 5500, name: "Легенда" }
        ];

        for (let i = levels.length - 1; i >= 0; i--) {
            if (this.data.totalXP >= levels[i].min) {
                this.data.currentLevel = i;
                return levels[i].name;
            }
        }
        return "Новичок";
    }

    // Update progress bars
    updateProgressBars() {
        const totalWeeks = 98;
        const completedWeeks = Object.keys(this.data.weekProgress).length;
        const overallProgress = (completedWeeks / totalWeeks) * 100;
        
        document.getElementById('overallProgress').style.width = `${overallProgress}%`;
        document.querySelector('.progress-text').textContent = `${Math.round(overallProgress)}% (${completedWeeks}/${totalWeeks} недель)`;
        
        // Current week progress
        const currentWeekData = this.data.weekProgress[this.data.currentWeek] || {};
        const weekTasks = Object.keys(currentWeekData).length;
        const weekProgress = weekTasks > 0 ? (weekTasks / 4) * 100 : 0; // Assuming 4 tasks per week
        document.getElementById('weekProgress').style.width = `${weekProgress}%`;
    }

    // Update XP bar
    updateXPBar() {
        const levels = [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7000];
        const currentLevel = this.data.currentLevel;
        const currentXP = this.data.totalXP;
        
        const currentLevelXP = currentLevel > 0 ? levels[currentLevel - 1] : 0;
        const nextLevelXP = levels[currentLevel] || 7000;
        const progressXP = currentXP - currentLevelXP;
        const neededXP = nextLevelXP - currentLevelXP;
        const xpProgress = (progressXP / neededXP) * 100;
        
        document.getElementById('xpBar').style.width = `${Math.min(xpProgress, 100)}%`;
        document.getElementById('currentXP').textContent = currentXP;
        document.getElementById('nextLevelXP').textContent = nextLevelXP;
        document.getElementById('playerLevel').textContent = `${this.getLevelName()} (Level ${currentLevel})`;
    }

    // Update goals display
    updateGoals() {
        const goalsContainer = document.getElementById('todayGoals');
        goalsContainer.innerHTML = '';
        
        this.data.goals.forEach(goal => {
            const goalDiv = document.createElement('div');
            goalDiv.className = 'goal-item';
            goalDiv.innerHTML = `
                <input type="checkbox" id="goal${goal.id}" ${goal.completed ? 'checked' : ''} onchange="tracker.updateGoal(${goal.id})">
                <label for="goal${goal.id}" ${goal.completed ? 'style="text-decoration: line-through; opacity: 0.6;"' : ''}>${goal.text}</label>
            `;
            goalsContainer.appendChild(goalDiv);
        });
    }

    // Update goal status
    updateGoal(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        if (goal) {
            goal.completed = !goal.completed;
            if (goal.completed) {
                this.addXP(10);
                this.checkAchievement('first_goal');
            }
            this.updateGoals();
            this.saveData();
        }
    }

    // Add XP and check for level up
    addXP(amount) {
        const oldLevel = this.data.currentLevel;
        this.data.totalXP += amount;
        this.getLevelName(); // This updates the level
        
        if (this.data.currentLevel > oldLevel) {
            this.showNotification(`🎉 Поздравляем! Вы достигли уровня ${this.getLevelName()}!`);
            this.checkAchievement('level_up');
        }
        
        this.updateUI();
        this.saveData();
    }

    // Check and unlock achievements
    checkAchievement(type, value = null) {
        const achievements = this.getAchievements();
        
        achievements.forEach(achievement => {
            if (!this.data.achievementsUnlocked.includes(achievement.id)) {
                let unlock = false;
                
                switch (achievement.trigger) {
                    case 'first_goal':
                        unlock = type === 'first_goal';
                        break;
                    case 'study_days':
                        unlock = this.data.totalDays >= achievement.value;
                        break;
                    case 'xp_total':
                        unlock = this.data.totalXP >= achievement.value;
                        break;
                    case 'streak':
                        unlock = this.data.streak >= achievement.value;
                        break;
                    case 'tasks':
                        unlock = this.data.tasksCompleted >= achievement.value;
                        break;
                    case 'projects':
                        unlock = this.data.projectsCreated >= achievement.value;
                        break;
                    case 'hours':
                        unlock = this.data.hoursStudied >= achievement.value;
                        break;
                }
                
                if (unlock) {
                    this.unlockAchievement(achievement);
                }
            }
        });
    }

    // Unlock achievement
    unlockAchievement(achievement) {
        this.data.achievementsUnlocked.push(achievement.id);
        this.addXP(achievement.xp);
        this.showNotification(`🏆 Достижение разблокировано: ${achievement.title}! +${achievement.xp} XP`);
        this.updateUI();
        this.loadAchievements();
    }

    // Show notification
    showNotification(message) {
        // Create notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #48bb78, #38a169);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            font-weight: 500;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        // Add animation styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
    }

    // Mark study day
    markStudyDay() {
        const today = new Date().toDateString();
        const lastStudy = this.data.lastStudyDate;
        
        if (lastStudy !== today) {
            this.data.totalDays++;
            
            // Check streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastStudy === yesterday.toDateString()) {
                this.data.streak++;
            } else if (lastStudy !== today) {
                this.data.streak = 1;
            }
            
            this.data.lastStudyDate = today;
            this.addXP(20);
            this.checkAchievement('study_days');
            this.checkAchievement('streak');
            this.showNotification('✅ День изучения отмечен! +20 XP');
        } else {
            this.showNotification('📅 Вы уже отметили сегодняшний день!');
        }
    }

    // Set today's date in date picker
    setTodayDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('entryDate').value = today;
        this.loadDailyEntry();
    }

    // Load daily entry
    loadDailyEntry() {
        const date = document.getElementById('entryDate').value;
        const entry = this.data.dailyEntries[date] || {};
        
        document.getElementById('dailyGoals').value = entry.goals || '';
        document.getElementById('whatStudied').value = entry.studied || '';
        document.getElementById('codeWritten').value = entry.code || '';
        document.getElementById('studyTime').value = entry.time || '';
        document.getElementById('tasksCount').value = entry.tasks || '';
        document.getElementById('notes').value = entry.notes || '';
        
        this.setRating(entry.rating || 0);
    }

    // Save daily entry
    saveDailyEntry() {
        const date = document.getElementById('entryDate').value;
        const entry = {
            goals: document.getElementById('dailyGoals').value,
            studied: document.getElementById('whatStudied').value,
            code: document.getElementById('codeWritten').value,
            time: parseFloat(document.getElementById('studyTime').value) || 0,
            tasks: parseInt(document.getElementById('tasksCount').value) || 0,
            notes: document.getElementById('notes').value,
            rating: this.currentRating || 0
        };
        
        this.data.dailyEntries[date] = entry;
        
        // Update stats
        if (entry.time > 0) {
            this.data.hoursStudied += entry.time;
        }
        if (entry.tasks > 0) {
            this.data.tasksCompleted += entry.tasks;
        }
        
        this.checkAchievement('tasks');
        this.checkAchievement('hours');
        
        this.saveData();
        this.updateUI();
        this.showNotification('💾 Запись сохранена!');
        this.loadRecentEntries();
    }

    // Set rating
    setRating(rating) {
        this.currentRating = rating;
        const stars = document.querySelectorAll('.star');
        stars.forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    // Load recent entries
    loadRecentEntries() {
        const container = document.getElementById('recentEntries');
        const entries = Object.entries(this.data.dailyEntries)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .slice(0, 5);
        
        if (entries.length === 0) {
            container.innerHTML = '<p>Пока нет записей. Создайте первую!</p>';
            return;
        }
        
        container.innerHTML = entries.map(([date, entry]) => `
            <div class="entry-preview" onclick="loadEntry('${date}')">
                <div class="entry-date">${new Date(date).toLocaleDateString('ru-RU')}</div>
                <div class="entry-summary">${entry.studied.substring(0, 100)}...</div>
                <div class="entry-stats">
                    ⭐ ${entry.rating}/5 | ⏰ ${entry.time}ч | 🎮 ${entry.tasks} задач
                </div>
            </div>
        `).join('');
    }

    // Load projects
    loadProjects() {
        const projects = [
            {
                id: 1,
                title: "Hello World Console App",
                description: "Создать первое консольное приложение",
                status: "not-started",
                stage: 1,
                week: 1
            },
            {
                id: 2,
                title: "Калькулятор",
                description: "Консольный калькулятор с базовыми операциями",
                status: "not-started",
                stage: 1,
                week: 3
            },
            {
                id: 3,
                title: "Конвертер валют",
                description: "Приложение для конвертации валют",
                status: "not-started",
                stage: 1,
                week: 5
            },
            {
                id: 4,
                title: "Игра 'Угадай число'",
                description: "Простая игра на угадывание числа",
                status: "not-started",
                stage: 1,
                week: 7
            },
            {
                id: 5,
                title: "Менеджер задач",
                description: "Консольное приложение для управления задачами",
                status: "not-started",
                stage: 1,
                week: 9
            }
        ];
        
        const container = document.getElementById('projectsGrid');
        container.innerHTML = projects.map(project => `
            <div class="project-card">
                <div class="project-status status-${project.status}">
                    ${this.getStatusText(project.status)}
                </div>
                <h4>${project.title}</h4>
                <p>${project.description}</p>
                <div class="project-meta">
                    <small>Этап ${project.stage}, Неделя ${project.week}</small>
                </div>
                <button class="btn btn-primary" onclick="updateProjectStatus(${project.id})">
                    Обновить статус
                </button>
            </div>
        `).join('');
        
        // Update project stats
        document.getElementById('totalProjects').textContent = projects.length;
        document.getElementById('completedProjects').textContent = projects.filter(p => p.status === 'completed').length;
        document.getElementById('inProgressProjects').textContent = projects.filter(p => p.status === 'in-progress').length;
    }

    getStatusText(status) {
        const statuses = {
            'not-started': 'Не начат',
            'in-progress': 'В процессе',
            'completed': 'Завершен'
        };
        return statuses[status] || 'Не начат';
    }

    // Load achievements
    loadAchievements() {
        const achievements = this.getAchievements();
        const container = document.getElementById('achievementsGrid');
        
        container.innerHTML = achievements.map(achievement => {
            const isUnlocked = this.data.achievementsUnlocked.includes(achievement.id);
            return `
                <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-title">${achievement.title}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    <div class="achievement-xp">+${achievement.xp} XP</div>
                </div>
            `;
        }).join('');
    }

    // Get achievements data
    getAchievements() {
        return [
            { id: 1, icon: "🎯", title: "Первые шаги", description: "Выполните первую цель", xp: 10, trigger: "first_goal" },
            { id: 2, icon: "📅", title: "Неделя изучения", description: "Изучайте 7 дней", xp: 50, trigger: "study_days", value: 7 },
            { id: 3, icon: "🔥", title: "Стрик 5 дней", description: "Изучайте 5 дней подряд", xp: 100, trigger: "streak", value: 5 },
            { id: 4, icon: "💯", title: "Первая сотня", description: "Наберите 100 XP", xp: 25, trigger: "xp_total", value: 100 },
            { id: 5, icon: "🎮", title: "Решатель", description: "Решите 10 задач", xp: 50, trigger: "tasks", value: 10 },
            { id: 6, icon: "🚀", title: "Первый проект", description: "Создайте первый проект", xp: 100, trigger: "projects", value: 1 },
            { id: 7, icon: "⏰", title: "Марафонец", description: "Изучайте 10 часов", xp: 75, trigger: "hours", value: 10 },
            { id: 8, icon: "📚", title: "Месяц изучения", description: "Изучайте 30 дней", xp: 200, trigger: "study_days", value: 30 },
            { id: 9, icon: "⚡", title: "Стрик недели", description: "Изучайте неделю подряд", xp: 150, trigger: "streak", value: 7 },
            { id: 10, icon: "🏆", title: "Чемпион", description: "Наберите 500 XP", xp: 100, trigger: "xp_total", value: 500 }
        ];
    }

    // Update recent achievements
    updateRecentAchievements() {
        const container = document.getElementById('recentAchievements');
        const recentAchievements = this.data.achievementsUnlocked.slice(-3);
        
        if (recentAchievements.length === 0) {
            container.innerHTML = '<p class="no-achievements">Пока нет достижений. Начните изучение!</p>';
            return;
        }
        
        const achievements = this.getAchievements();
        container.innerHTML = recentAchievements.map(id => {
            const achievement = achievements.find(a => a.id === id);
            return `
                <div class="achievement-preview">
                    <span>${achievement.icon}</span>
                    <span>${achievement.title}</span>
                </div>
            `;
        }).join('');
    }

    // Load roadmap
    loadRoadmap() {
        // Roadmap is mostly static, but we can add progress tracking here
        this.updateStageProgress();
    }

    updateStageProgress() {
        // Update progress for each stage based on completed tasks
        const stages = document.querySelectorAll('.stage');
        stages.forEach((stage, index) => {
            const stageNumber = index + 1;
            const progressBar = stage.querySelector('.progress-fill');
            const progressText = stage.querySelector('.stage-progress span');
            
            // Calculate progress based on completed weeks
            const stageWeeks = this.getStageWeeks(stageNumber);
            const completedWeeks = stageWeeks.filter(week => this.data.weekProgress[week]).length;
            const progress = (completedWeeks / stageWeeks.length) * 100;
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            if (progressText) {
                progressText.textContent = `${completedWeeks}/${stageWeeks.length} недель`;
            }
        });
    }

    getStageWeeks(stage) {
        const stageWeeks = {
            1: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // 10 weeks
            2: [11, 12, 13, 14, 15, 16, 17, 18], // 8 weeks
            3: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30], // 12 weeks
            4: [31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44], // 14 weeks
            5: [45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56], // 12 weeks
            6: [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68], // 12 weeks
            7: [69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80], // 12 weeks
            8: [81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98] // 18 weeks
        };
        return stageWeeks[stage] || [];
    }
}

// Global functions
let tracker;

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    tracker = new LearningTracker();
});

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Stage toggle
function toggleStage(stageNumber) {
    const stage = document.querySelector(`.stage[data-stage="${stageNumber}"]`);
    stage.classList.toggle('active');
}

// Goal management
function addGoal() {
    document.getElementById('goalModal').style.display = 'block';
}

function saveNewGoal() {
    const text = document.getElementById('newGoalText').value.trim();
    if (text) {
        const newId = Math.max(...tracker.data.goals.map(g => g.id)) + 1;
        tracker.data.goals.push({
            id: newId,
            text: text,
            completed: false
        });
        tracker.updateGoals();
        tracker.saveData();
        closeModal('goalModal');
        document.getElementById('newGoalText').value = '';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Daily log functions
function createNewEntry() {
    tracker.setTodayDate();
}

function loadEntry(date) {
    document.getElementById('entryDate').value = date;
    tracker.loadDailyEntry();
    showTab('daily');
}

function saveDailyEntry() {
    tracker.saveDailyEntry();
}

function setRating(rating) {
    tracker.setRating(rating);
}

function markStudyDay() {
    tracker.markStudyDay();
}

// Project functions
function updateProjectStatus(projectId) {
    // This would cycle through statuses
    tracker.showNotification('🚀 Функция в разработке!');
}

// Update goal progress
function updateGoalProgress() {
    // This function is called when checkboxes change
    // The actual logic is in the tracker.updateGoal method
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save daily entry
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (document.getElementById('daily').classList.contains('active')) {
            tracker.saveDailyEntry();
        }
    }
    
    // Escape to close modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
});

// Auto-save daily entries every 30 seconds
setInterval(() => {
    if (document.getElementById('daily').classList.contains('active')) {
        const hasContent = document.getElementById('dailyGoals').value ||
                          document.getElementById('whatStudied').value ||
                          document.getElementById('codeWritten').value;
        
        if (hasContent) {
            tracker.saveDailyEntry();
        }
    }
}, 30000);

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
} 
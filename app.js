// Inicjalizacja aplikacji
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const navButtons = document.querySelectorAll('.nav-btn');
    const waterLevel = document.getElementById('water-level');
    const currentAmount = document.getElementById('current-amount');
    const goalAmount = document.getElementById('goal-amount');
    const addWaterBtn = document.getElementById('add-water');
    const waterOptions = document.getElementById('water-options');
    const waterOptionBtns = document.querySelectorAll('.water-option');
    const customAmountInput = document.getElementById('custom-amount');
    const addCustomBtn = document.getElementById('add-custom');
    const todayEntries = document.getElementById('today-entries');
    const saveSettingsBtn = document.getElementById('save-settings');
    const dailyGoalInput = document.getElementById('daily-goal');
    const reminderIntervalInput = document.getElementById('reminder-interval');
    const wakeupTimeInput = document.getElementById('wakeup-time');
    const sleepTimeInput = document.getElementById('sleep-time');
    const notification = document.getElementById('notification');
    const dismissNotificationBtn = document.getElementById('dismiss-notification');
    
    let state = {
        currentAmount: 0,
        dailyGoal: 2000,
        reminderInterval: 60,
        wakeupTime: '07:00',
        sleepTime: '22:00',
        entries: [],
        lastReminderTime: null
    };
    
    let reminderTimer = null;
    
    function init() {
        loadState();
        updateUI();
        setupEventListeners();
        showSection('dashboard-section');
        scheduleReminders();
        requestNotificationPermission();
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                    registration.update();
                })
                .catch(err => {
                    console.log('ServiceWorker registration failed: ', err);
                });
        }
    }
    
    // Wczytuje ustawienia z localStorage
    function loadState() {
        const savedState = localStorage.getItem('waterReminderState');
        if (savedState) {
            state = JSON.parse(savedState);
        }
        
        dailyGoalInput.value = state.dailyGoal;
        reminderIntervalInput.value = state.reminderInterval;
        wakeupTimeInput.value = state.wakeupTime;
        sleepTimeInput.value = state.sleepTime;
        goalAmount.textContent = state.dailyGoal;
        
        checkNewDay();
    }
    
    // Zapisanie stanu do localStorage
    function saveState() {
        localStorage.setItem('waterReminderState', JSON.stringify(state));
    }
    
    // Pokazuje powiadomienie
    function showNotification(title, message, type = 'info') {
        const notificationContainer = document.getElementById('notification') || createNotificationContainer();
        
        notificationContainer.className = `notification ${type}`;
        notificationContainer.innerHTML = `
            <div class="notification-content">
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
            <button id="dismiss-notification" class="dismiss-btn">&times;</button>
        `;
        
        notificationContainer.classList.remove('hidden');
        
        document.getElementById('dismiss-notification').addEventListener('click', () => {
            notificationContainer.classList.add('hidden');
        });
        
        setTimeout(() => {
            notificationContainer.classList.add('hidden');
        }, 5000);
    }
    
    function createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'notification';
        container.className = 'notification hidden';
        document.body.appendChild(container);
        return container;
    }
    
    // Sprawdza czy czas powiadomienia minął 
    function checkNewDay() {
        if (state.entries.length > 0) {
            const lastEntryDate = new Date(state.entries[0].timestamp).toLocaleDateString();
            const today = new Date().toLocaleDateString();
            
            if (lastEntryDate !== today) {
                state.currentAmount = 0;
                state.entries = [];
                saveState();
            }
        }
    }
    
    // Aktualizuje wyświetlanie spożycia wody
    function updateUI() {
        const percentage = Math.min((state.currentAmount / state.dailyGoal) * 100, 100);
        waterLevel.style.height = `${percentage}%`;
        
        currentAmount.textContent = state.currentAmount;
        goalAmount.textContent = state.dailyGoal;
        
        const goalPercentage = document.getElementById('goal-percentage');
        if (goalPercentage) {
            goalPercentage.textContent = Math.round(percentage);
        }
        
        const currentAmountDisplay = document.getElementById('current-amount-display');
        if (currentAmountDisplay) {
            currentAmountDisplay.textContent = state.currentAmount;
        }
        
        const goalAmountDisplay = document.getElementById('goal-amount-display');
        if (goalAmountDisplay) {
            goalAmountDisplay.textContent = state.dailyGoal;
        }
        
        renderEntries();
        renderRecentEntries();
    }
    
    // Wyświetlanie ostatnich wpisów na pulpicie
    function renderRecentEntries() {
        const recentEntriesList = document.getElementById('recent-entries');
        if (!recentEntriesList) return;
        
        recentEntriesList.innerHTML = '';
        
        if (state.entries.length === 0) {
            recentEntriesList.innerHTML = '<p class="no-entries">Brak wpisów na dziś</p>';
            return;
        }
        
        const recentEntries = state.entries.slice(0, 5);
        
        recentEntries.forEach(entry => {
            const entryEl = document.createElement('div');
            entryEl.className = 'entry';
            
            const date = new Date(entry.timestamp);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            entryEl.innerHTML = `
                <span class="entry-time">${timeStr}</span>
                <span class="entry-amount">${entry.amount} ml</span>
            `;
            
            recentEntriesList.appendChild(entryEl);
        });
    }
    
    // Konfiguracja nasłuchiwaczy zdarzeń
    function setupEventListeners() {
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const sectionId = btn.dataset.section;
                showSection(sectionId);
                setActiveNavButton(btn);
            });
        });
        
        addWaterBtn.addEventListener('click', () => {
            waterOptions.classList.toggle('hidden');
        });
        
        waterOptionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                addWater(amount);
                waterOptions.classList.add('hidden');
            });
        });
        
        const quickAddBtns = document.querySelectorAll('.quick-add-btn');
        quickAddBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                addWater(amount);
                
                btn.classList.add('clicked');
                setTimeout(() => {
                    btn.classList.remove('clicked');
                }, 300);
            });
        });
        
        addCustomBtn.addEventListener('click', () => {
            const amount = parseInt(customAmountInput.value);
            if (amount && amount > 0) {
                addWater(amount);
                customAmountInput.value = '';
                waterOptions.classList.add('hidden');
            }
        });
        
        saveSettingsBtn.addEventListener('click', saveSettings);
        
        dismissNotificationBtn.addEventListener('click', () => {
            notification.classList.add('hidden');
        });
    }
    
    // Pokazuje wybraną sekcję i ukrywa pozostałe
    function showSection(sectionId) {
        sections.forEach(section => {
            if (section.id === sectionId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }
    
    // Ustawia aktywny przycisk nawigacji
    function setActiveNavButton(activeBtn) {
        navButtons.forEach(btn => {
            if (btn === activeBtn) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    // Dodaje wodę do dziennego spożycia
    function addWater(amount) {
        state.currentAmount += amount;
        
        const entry = {
            timestamp: new Date().getTime(),
            amount: amount
        };
        
        state.entries.unshift(entry);
        saveState();
        updateUI();
    }
    
    // Wyświetlanie wpisów wody
    function renderEntries() {
        todayEntries.innerHTML = '';
        
        if (state.entries.length === 0) {
            todayEntries.innerHTML = '<p class="no-entries">Brak wpisów na dziś</p>';
            return;
        }
        
        const entriesByDate = {};
        
        state.entries.forEach(entry => {
            const date = new Date(entry.timestamp);
            const dateStr = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
            
            if (!entriesByDate[dateStr]) {
                entriesByDate[dateStr] = [];
            }
            
            entriesByDate[dateStr].push(entry);
        });
        
        for (const dateStr in entriesByDate) {
            const dateHeader = document.createElement('div');
            dateHeader.className = 'date-header';
            dateHeader.textContent = dateStr;
            todayEntries.appendChild(dateHeader);
            
            entriesByDate[dateStr].forEach(entry => {
                const entryEl = document.createElement('div');
                entryEl.className = 'entry';
                
                const date = new Date(entry.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                entryEl.innerHTML = `
                    <span class="entry-time">${timeStr}</span>
                    <span class="entry-amount">${entry.amount} ml</span>
                `;
                
                todayEntries.appendChild(entryEl);
            });
        }
    }
    
    // Zapisuje ustawienia w localStorage
    function saveSettings() {
        state.dailyGoal = parseInt(dailyGoalInput.value);
        state.reminderInterval = parseInt(reminderIntervalInput.value);
        state.wakeupTime = wakeupTimeInput.value;
        state.sleepTime = sleepTimeInput.value;
        
        saveState();
        updateUI();
        scheduleReminders();
        
        alert('Ustawienia zostały zapisane!');
    }
    
    // Planuje następne powiadomienie
    function scheduleReminders() {
        if (reminderTimer) {
            clearInterval(reminderTimer);
        }
        
        const intervalMs = state.reminderInterval * 60 * 1000;
        reminderTimer = setInterval(() => {
            if (isInActiveHours()) {
                showReminder();
            }
        }, intervalMs);
        
        if (window.customReminders && window.customReminders.scheduleCustomReminders) {
            window.customReminders.scheduleCustomReminders();
        }
    }
    
    // Sprawdź czy aktualny czas jest w godzinach aktywnych
    function isInActiveHours() {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        
        const [wakeHours, wakeMinutes] = state.wakeupTime.split(':').map(Number);
        const [sleepHours, sleepMinutes] = state.sleepTime.split(':').map(Number);
        
        const wakeTime = wakeHours * 60 + wakeMinutes;
        const sleepTime = sleepHours * 60 + sleepMinutes;
        
        return currentTime >= wakeTime && currentTime <= sleepTime;
    }
    
    // Pokaż powiadomienie przypominające
    function showReminder() {
        notification.classList.remove('hidden');
        
        if ("Notification" in window && Notification.permission === "granted") {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
                navigator.serviceWorker.ready.then(registration => {
                    const notificationData = {
                        title: "Dziennik nawodnienia",
                        body: "Czas na szklankę wody!",
                        icon: "https://cdn-icons-png.flaticon.com/512/824/824239.png",
                        timestamp: Date.now()
                    };
                    
                    try {
                        registration.showNotification(notificationData.title, {
                            body: notificationData.body,
                            icon: notificationData.icon,
                            badge: "https://cdn-icons-png.flaticon.com/512/824/824239.png",
                            tag: "water-reminder",
                            vibrate: [100, 50, 100],
                            data: {
                                dateOfArrival: Date.now(),
                                primaryKey: 1
                            },
                            actions: [
                                { action: 'close', title: 'Zamknij' },
                                { action: 'check', title: 'Sprawdź' }
                            ]
                        });
                    } catch (error) {
                        const notify = new Notification(notificationData.title, {
                            body: notificationData.body,
                            icon: notificationData.icon
                        });
                    }
                });
            } else {
                const notify = new Notification("Dziennik nawodnienia", {
                    body: "Czas na szklankę wody!",
                    icon: "https://cdn-icons-png.flaticon.com/512/824/824239.png"
                });
            }
        }
    }
    
    // Sprawdza czy przeglądarka obsługuje powiadomienia
    function requestNotificationPermission() {
        if ("Notification" in window) {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    console.log("Notification permission granted");
                    subscribeToPushNotifications();
                } else {
                    console.log("Notification permission denied");
                }
            });
        }
    }
    
    // Powiadomienia push
    function subscribeToPushNotifications() {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready
                .then(registration => {
                    return registration.pushManager.getSubscription()
                        .then(subscription => {
                            if (subscription) {
                                return subscription;
                            }
                            
                            return registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(
                                    'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'
                                )
                            });
                        });
                })
                .then(subscription => {
                    console.log('User is subscribed to push notifications:', subscription);
                })
                .catch(error => {
                    console.error('Failed to subscribe to push notifications:', error);
                });
        }
    }
    
    // Konwersja base64 do Uint8Array dla applicationServerKey
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
            
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }
    
    init();
    
    // Konfiguracja w sekcji statystyk
    function setupTabsEventListeners() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                tabContents.forEach(content => {
                    if (content.id === tabId) {
                        content.classList.add('active');
                    } else {
                        content.classList.remove('active');
                    }
                });
                
                if (tabId === 'weekly-tab' && window.waterCharts && window.waterCharts.updateCharts) {
                    window.waterCharts.updateCharts();
                }
            });
        });
    }
    
    window.isInActiveHours = isInActiveHours;
});
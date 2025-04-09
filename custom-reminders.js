// Moduł niestandardowych przypomnień
document.addEventListener('DOMContentLoaded', () => {
    const customReminderSection = document.getElementById('custom-reminder-section');
    const addReminderBtn = document.getElementById('add-reminder-btn');
    const remindersList = document.getElementById('reminders-list');
    const reminderTimeInput = document.getElementById('reminder-time');
    const reminderNoteInput = document.getElementById('reminder-note');
    const saveReminderBtn = document.getElementById('save-reminder-btn');
    const cancelReminderBtn = document.getElementById('cancel-reminder-btn');
    const reminderForm = document.getElementById('reminder-form');
    
    let customReminders = [];
    let reminderTimers = [];
    
    function init() {
        loadCustomReminders();
        renderReminders();
        scheduleCustomReminders();
        
        addReminderBtn.addEventListener('click', showReminderForm);
        saveReminderBtn.addEventListener('click', saveReminder);
        cancelReminderBtn.addEventListener('click', hideReminderForm);
    }
    
    function loadCustomReminders() {
        const savedReminders = localStorage.getItem('waterReminderCustomReminders');
        if (savedReminders) {
            customReminders = JSON.parse(savedReminders);
        }
    }
    
    function saveCustomReminders() {
        localStorage.setItem('waterReminderCustomReminders', JSON.stringify(customReminders));
    }
    
    function showReminderForm() {
        reminderForm.classList.remove('hidden');
        addReminderBtn.classList.add('hidden');
        reminderTimeInput.value = '';
        reminderNoteInput.value = '';
        
        // Reset checkboxów dni tygodnia
        document.querySelectorAll('.weekday-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });
    }
    
    function hideReminderForm() {
        reminderForm.classList.add('hidden');
        addReminderBtn.classList.remove('hidden');
    }
    
    function saveReminder() {
        const time = reminderTimeInput.value;
        if (!time) return;
        
        const note = reminderNoteInput.value.trim();
        
        // Pobiera wybrane dni tygodnia
        const selectedDays = [];
        document.querySelectorAll('.weekday-checkbox:checked').forEach(checkbox => {
            selectedDays.push(parseInt(checkbox.value));
        });
        
        // Jeśli nie wybrano żadnego dnia, domyślnie wybiera wszystkie dni
        const days = selectedDays.length > 0 ? selectedDays : [0, 1, 2, 3, 4, 5, 6];
        
        const reminder = {
            id: Date.now(),
            time: time,
            note: note,
            days: days // Dodawanie dni tygodnia do przypomnienia
        };
        
        customReminders.push(reminder);
        saveCustomReminders();
        renderReminders();
        scheduleCustomReminders();
        hideReminderForm();
    }
    
    function renderReminders() {
        remindersList.innerHTML = '';
        
        if (customReminders.length === 0) {
            remindersList.innerHTML = '<p class="no-reminders">Brak niestandardowych przypomnień</p>';
            return;
        }
        
        // Sortowanie po czasie
        const sortedReminders = [...customReminders].sort((a, b) => {
            return a.time.localeCompare(b.time);
        });        
        sortedReminders.forEach(reminder => {
            const reminderEl = document.createElement('div');
            reminderEl.className = 'reminder-item';
            
            // Dodawanie notatkę, jeśli istnieje
            const noteHtml = reminder.note ? `<div class="reminder-note">${reminder.note}</div>` : '';
            
            // Wyświetlanie dni tygodnia
            const daysOfWeek = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb'];
            const selectedDays = reminder.days || [0, 1, 2, 3, 4, 5, 6]; // Domyślnie wszystkie dni, jeśli nie określono
            
            const daysHtml = `
                <div class="reminder-days">
                    ${daysOfWeek.map((day, index) => {
                        const isSelected = selectedDays.includes(index);
                        return `<span class="day-indicator ${isSelected ? 'active' : ''}">${day}</span>`;
                    }).join('')}
                </div>
            `;
            
            reminderEl.innerHTML = `
                <span class="reminder-time">${reminder.time}</span>
                ${noteHtml}
                ${daysHtml}
                <button class="delete-reminder" data-id="${reminder.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            remindersList.appendChild(reminderEl);
            
            const deleteBtn = reminderEl.querySelector('.delete-reminder');
            deleteBtn.addEventListener('click', () => deleteReminder(reminder.id));
        });    }
    
    function deleteReminder(id) {
        customReminders = customReminders.filter(reminder => reminder.id !== id);
        saveCustomReminders();
        renderReminders();
        scheduleCustomReminders();
    }
    
    function scheduleCustomReminders() {
        // Restart czasu
        reminderTimers.forEach(timer => clearTimeout(timer));
        reminderTimers = [];
        
        customReminders.forEach(reminder => {
            const now = new Date();
            const [hours, minutes] = reminder.time.split(':').map(Number);
            const currentDayOfWeek = now.getDay(); // 0 = niedziela, 1 = poniedziałek, ..., 6 = sobota
            
            // Pobieranie dni tygodnia dla przypomnienia lub wszystkie dni, jeśli nie określono
            const reminderDays = reminder.days || [0, 1, 2, 3, 4, 5, 6];
            
            // Jeśli dzisiejszy dzień jest w wybranych dniach
            if (reminderDays.includes(currentDayOfWeek)) {
                const reminderTime = new Date(now);
                reminderTime.setHours(hours, minutes, 0, 0);
                
                if (reminderTime < now) {
                    // Znajdź następny dzień tygodnia, który jest w wybranych dniach
                    let daysToAdd = 1;
                    let nextDayOfWeek = (currentDayOfWeek + 1) % 7;
                    
                    while (!reminderDays.includes(nextDayOfWeek) && daysToAdd < 7) {
                        daysToAdd++;
                        nextDayOfWeek = (nextDayOfWeek + 1) % 7;
                    }
                    
                    reminderTime.setDate(reminderTime.getDate() + daysToAdd);
                }
                
                const timeUntilReminder = reminderTime - now;
                
                const timer = setTimeout(() => {
                    triggerCustomReminder(reminder.time, reminder.id);
                    scheduleCustomReminders();
                }, timeUntilReminder);
                
                reminderTimers.push(timer);
            } else {
                // Jeśli dzisiejszy dzień nie jest w wybrany, znajduje następny dzień
                let daysToAdd = 1;
                let nextDayOfWeek = (currentDayOfWeek + 1) % 7;
                
                while (!reminderDays.includes(nextDayOfWeek) && daysToAdd < 7) {
                    daysToAdd++;
                    nextDayOfWeek = (nextDayOfWeek + 1) % 7;
                }
                
                const reminderTime = new Date(now);
                reminderTime.setDate(reminderTime.getDate() + daysToAdd);
                reminderTime.setHours(hours, minutes, 0, 0);
                
                const timeUntilReminder = reminderTime - now;
                
                const timer = setTimeout(() => {
                    triggerCustomReminder(reminder.time, reminder.id);
                    scheduleCustomReminders();
                }, timeUntilReminder);
                
                reminderTimers.push(timer);
            }
        });    }
    
    function triggerCustomReminder(time, id) {
        const reminder = customReminders.find(r => r.id === id);
        if (!reminder) return; // Jeśli przypomnienie zostało usunięte
        
        const noteText = reminder.note ? reminder.note : '';
        
        if (window.isInActiveHours && window.isInActiveHours()) {
            const notification = document.getElementById('notification');
            if (notification) {
                notification.classList.remove('hidden');
                
                if ("Notification" in window && Notification.permission === "granted") {
                    // Jeśli jest service worker i wsparcie dla powiadomień push
                    if ('serviceWorker' in navigator && 'PushManager' in window) {
                        navigator.serviceWorker.ready.then(registration => {
                            // Powiadomienie z notatką jeśli możliwe
                            const notificationMessage = noteText 
                                ? `Zaplanowane przypomnienie (${time}): ${noteText}` 
                                : `Zaplanowane przypomnienie (${time}): Czas na szklankę wody!`;
                            
                            const notificationData = {
                                title: "Dziennik nawodnienia",
                                body: notificationMessage,
                                icon: "https://cdn-icons-png.flaticon.com/512/824/824239.png",
                                timestamp: Date.now()
                            };
                            
                            try {
                                registration.showNotification(notificationData.title, {
                                    body: notificationData.body,
                                    icon: notificationData.icon,
                                    badge: "https://cdn-icons-png.flaticon.com/512/824/824239.png",
                                    tag: "water-reminder-custom",
                                    vibrate: [100, 50, 100],
                                    data: {
                                        dateOfArrival: Date.now(),
                                        primaryKey: 2,
                                        time: time,
                                        note: noteText
                                    },
                                    actions: [
                                        { action: 'close', title: 'Zamknij' },
                                        { action: 'check', title: 'Sprawdź' }
                                    ]
                                });
                            } catch (error) {
                                // API powiadomień
                                const notify = new Notification(notificationData.title, {
                                    body: notificationData.body,
                                    icon: notificationData.icon
                                });
                            }
                        });
                    } else {
                        // Tworzenie powiadomień
                        const notificationMessage = noteText 
                            ? `Zaplanowane przypomnienie (${time}): ${noteText}` 
                            : `Zaplanowane przypomnienie (${time}): Czas na szklankę wody!`;
                            
                        // Dla przeglądarek nie wspieranych
                        const notify = new Notification("Dziennik nawodnienia", {
                            body: notificationMessage,
                            icon: "https://cdn-icons-png.flaticon.com/512/824/824239.png"
                        });
                    }
                }
            }
        }
    }
    
    init();
    window.customReminders = {
        scheduleCustomReminders,
        loadCustomReminders
    };
});
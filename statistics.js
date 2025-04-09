// Moduł statystyk dla aplikacji Dziennik nawodnienia

document.addEventListener('DOMContentLoaded', () => {
    const statsModule = {
        charts: {
            weekly: null,
            monthly: null,
            yearly: null
        },

        init() {
            this.setupTabsEventListeners();
            
            const statsNavBtn = document.querySelector('.nav-btn[data-section="statistics-section"]');
            if (statsNavBtn) {
                statsNavBtn.addEventListener('click', () => {
                    setTimeout(() => {
                        this.createCharts();
                    }, 100);
                });
            }
        },

        setupTabsEventListeners() {
            const tabButtons = document.querySelectorAll('.stats-tab-btn');
            const tabContents = document.querySelectorAll('.stats-tab-content');
            
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
                    
                    this.updateCharts(tabId);
                });
            });

            const weeklyTabBtn = document.querySelector('.stats-tab-btn[data-tab="weekly-stats"]');
            if (weeklyTabBtn) {
                weeklyTabBtn.click();
            }
        },

        createCharts() {
            this.createWeeklyChart();
            this.createMonthlyChart();
            this.createYearlyChart();
        },

        updateCharts(tabId) {
            switch(tabId) {
                case 'weekly-stats':
                    this.updateWeeklyChart();
                    break;
                case 'monthly-stats':
                    this.updateMonthlyChart();
                    break;
                case 'yearly-stats':
                    this.updateYearlyChart();
                    break;
            }
        },

        getWaterEntries() {
            const savedState = localStorage.getItem('waterReminderState');
            if (savedState) {
                const state = JSON.parse(savedState);
                return state.entries || [];
            }
            return [];
        },

        getWeeklyData() {
            const entries = this.getWaterEntries();
            const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
            
            const today = new Date();
            const dayOfWeek = today.getDay();
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek);
            startOfWeek.setHours(0, 0, 0, 0);
            
            const endOfWeek = new Date(today);
            endOfWeek.setHours(23, 59, 59, 999);
            
            const weekData = days.map((day, index) => {
                const date = new Date(startOfWeek);
                date.setDate(startOfWeek.getDate() + index);
                return {
                    day: day,
                    date: date,
                    amount: 0
                };
            });
            
            entries.forEach(entry => {
                const entryDate = new Date(entry.timestamp);
                
                if (entryDate >= startOfWeek && entryDate <= endOfWeek) {
                    const dayIndex = entryDate.getDay();
                    weekData[dayIndex].amount += entry.amount;
                }
            });
            
            return weekData;
        },

        getMonthlyData() {
            const entries = this.getWaterEntries();
            const today = new Date();
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            
            const monthData = [];
            for (let i = 1; i <= daysInMonth; i++) {
                const date = new Date(currentYear, currentMonth, i);
                monthData.push({
                    day: i,
                    date: date,
                    amount: 0
                });
            }
            
            entries.forEach(entry => {
                const entryDate = new Date(entry.timestamp);
                
                if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
                    const dayIndex = entryDate.getDate() - 1;
                    monthData[dayIndex].amount += entry.amount;
                }
            });
            
            return monthData;
        },

        getYearlyData() {
            const entries = this.getWaterEntries();
            const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];
            const today = new Date();
            const currentYear = today.getFullYear();
            
            const yearData = months.map((month, index) => {
                return {
                    month: month,
                    index: index,
                    amount: 0
                };
            });
            
            entries.forEach(entry => {
                const entryDate = new Date(entry.timestamp);
                
                if (entryDate.getFullYear() === currentYear) {
                    const monthIndex = entryDate.getMonth();
                    yearData[monthIndex].amount += entry.amount;
                }
            });
            
            return yearData;
        },

        // Create weekly chart
        createWeeklyChart() {
            const ctx = document.getElementById('weekly-chart');
            if (!ctx) return;
            
            // Usunięcie istniejącego wykresu jeśli istnieje
            if (this.charts.weekly) {
                this.charts.weekly.destroy();
            }
            
            const weekData = this.getWeeklyData();
            
            this.charts.weekly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: weekData.map(data => data.day),
                    datasets: [{
                        label: 'Ilość wypitej wody (ml)',
                        data: weekData.map(data => data.amount),
                        backgroundColor: 'rgba(74, 144, 226, 0.7)',
                        borderColor: 'rgba(74, 144, 226, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Ilość (ml)'
                            }
                        }
                    }
                }
            });
            
            // Update weekly summary statistics
            this.updateWeeklySummary(weekData);
        },

        // Update weekly chart
        updateWeeklyChart() {
            if (!this.charts.weekly) {
                this.createWeeklyChart();
                return;
            }
            
            const weekData = this.getWeeklyData();
            
            this.charts.weekly.data.labels = weekData.map(data => data.day);
            this.charts.weekly.data.datasets[0].data = weekData.map(data => data.amount);
            this.charts.weekly.update();
            
            // Update weekly summary statistics
            this.updateWeeklySummary(weekData);
        },
        
        // Update weekly summary statistics
        updateWeeklySummary(weekData) {
            const weeklyAvgElement = document.getElementById('weekly-avg');
            const weeklyBestElement = document.getElementById('weekly-best');
            
            if (weeklyAvgElement && weeklyBestElement) {
                // Obliczenie średniego dziennego spożycia
                const totalAmount = weekData.reduce((sum, day) => sum + day.amount, 0);
                const daysWithData = weekData.filter(day => day.amount > 0).length;
                const avgAmount = daysWithData > 0 ? Math.round(totalAmount / daysWithData) : 0;
                
                // Znalezienie najlepszego dnia
                const bestDay = weekData.reduce((best, current) => 
                    current.amount > best.amount ? current : best, { amount: 0, day: '' });
                
                // Aktualizacja interfejsu użytkownika
                weeklyAvgElement.textContent = `${avgAmount} ml`;
                weeklyBestElement.textContent = bestDay.amount > 0 ? `${bestDay.day} (${bestDay.amount} ml)` : '0 ml';
            }
        },

        // Create monthly chart
        createMonthlyChart() {
            const ctx = document.getElementById('monthly-chart');
            if (!ctx) return;
            
            // Usunięcie istniejącego wykresu jeśli istnieje
            if (this.charts.monthly) {
                this.charts.monthly.destroy();
            }
            
            const monthData = this.getMonthlyData();
            
            this.charts.monthly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: monthData.map(data => data.day),
                    datasets: [{
                        label: 'Ilość wypitej wody (ml)',
                        data: monthData.map(data => data.amount),
                        backgroundColor: 'rgba(74, 144, 226, 0.7)',
                        borderColor: 'rgba(74, 144, 226, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Ilość (ml)'
                            }
                        }
                    }
                }
            });
            
            // Update monthly summary statistics
            this.updateMonthlySummary(monthData);
        },

        // Update monthly chart
        updateMonthlyChart() {
            if (!this.charts.monthly) {
                this.createMonthlyChart();
                return;
            }
            
            const monthData = this.getMonthlyData();
            
            this.charts.monthly.data.labels = monthData.map(data => data.day);
            this.charts.monthly.data.datasets[0].data = monthData.map(data => data.amount);
            this.charts.monthly.update();
            
            // Update monthly summary statistics
            this.updateMonthlySummary(monthData);
        },
        
        // Update monthly summary statistics
        updateMonthlySummary(monthData) {
            const monthlyAvgElement = document.getElementById('monthly-avg');
            const monthlyBestElement = document.getElementById('monthly-best');
            
            if (monthlyAvgElement && monthlyBestElement) {
                // Obliczenie średniego dziennego spożycia
                const totalAmount = monthData.reduce((sum, day) => sum + day.amount, 0);
                const daysWithData = monthData.filter(day => day.amount > 0).length;
                const avgAmount = daysWithData > 0 ? Math.round(totalAmount / daysWithData) : 0;
                
                // Znalezienie najlepszego dnia
                const bestDay = monthData.reduce((best, current) => 
                    current.amount > best.amount ? current : best, { amount: 0, day: 0 });
                
                // Aktualizacja interfejsu użytkownika
                monthlyAvgElement.textContent = `${avgAmount} ml`;
                monthlyBestElement.textContent = bestDay.amount > 0 ? `Dzień ${bestDay.day} (${bestDay.amount} ml)` : '0 ml';
            }
        },

        // Create yearly chart
        createYearlyChart() {
            const ctx = document.getElementById('yearly-chart');
            if (!ctx) return;
            
            // Usunięcie istniejącego wykresu jeśli istnieje
            if (this.charts.yearly) {
                this.charts.yearly.destroy();
            }
            
            const yearData = this.getYearlyData();
            
            this.charts.yearly = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: yearData.map(data => data.month),
                    datasets: [{
                        label: 'Ilość wypitej wody (ml)',
                        data: yearData.map(data => data.amount),
                        backgroundColor: 'rgba(74, 144, 226, 0.7)',
                        borderColor: 'rgba(74, 144, 226, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Ilość (ml)'
                            }
                        }
                    }
                }
            });
            
            // Update yearly summary statistics
            this.updateYearlySummary(yearData);
        },

        // Update yearly chart
        updateYearlyChart() {
            if (!this.charts.yearly) {
                this.createYearlyChart();
                return;
            }
            
            const yearData = this.getYearlyData();
            
            this.charts.yearly.data.labels = yearData.map(data => data.month);
            this.charts.yearly.data.datasets[0].data = yearData.map(data => data.amount);
            this.charts.yearly.update();
            
            // Update yearly summary statistics
            this.updateYearlySummary(yearData);
        },
        
        // Update yearly summary statistics
        updateYearlySummary(yearData) {
            const yearlyAvgElement = document.getElementById('yearly-avg');
            const yearlyBestElement = document.getElementById('yearly-best');
            
            if (yearlyAvgElement && yearlyBestElement) {
                // Calculate average monthly intake
                const totalAmount = yearData.reduce((sum, month) => sum + month.amount, 0);
                const monthsWithData = yearData.filter(month => month.amount > 0).length;
                const avgAmount = monthsWithData > 0 ? Math.round(totalAmount / monthsWithData) : 0;
                
                // Find the best month
                const bestMonth = yearData.reduce((best, current) => 
                    current.amount > best.amount ? current : best, { amount: 0, month: '' });
                
                // Aktualizacja interfejsu użytkownika
                yearlyAvgElement.textContent = `${avgAmount} ml`;
                yearlyBestElement.textContent = bestMonth.amount > 0 ? `${bestMonth.month} (${bestMonth.amount} ml)` : '0 ml';
            }
        }
    };

    // Initialize statistics module
    statsModule.init();

    // Expose statistics module to global scope
    window.waterStats = statsModule;
});
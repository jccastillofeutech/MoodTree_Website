document.addEventListener('DOMContentLoaded', () => {
    const today = new Date();
    const dateElements = document.querySelectorAll('.date');
    dateElements.forEach(el => {
        el.textContent = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    });

    const hamburgerButton = document.getElementById('hamburger-button');
    const mobileNav = document.getElementById('mobile-nav');
    const overlay = document.getElementById('overlay');
    const mainContent = document.querySelector('.main-content');

    if (hamburgerButton && mobileNav && overlay && mainContent) {
        hamburgerButton.addEventListener('click', () => {
            mobileNav.classList.toggle('open');
            overlay.classList.toggle('active');
            // mainContent.classList.toggle('dimmed'); // Removed dimming
            document.body.style.overflow = mobileNav.classList.contains('open') ? 'hidden' : 'auto';
        });

        overlay.addEventListener('click', () => {
            mobileNav.classList.remove('open');
            overlay.classList.remove('active');
            // mainContent.classList.remove('dimmed'); // Removed dimming
            document.body.style.overflow = 'auto';
        });

        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileNav.classList.remove('open');
                overlay.classList.remove('active');
                // mainContent.classList.remove('dimmed'); // Removed dimming
                document.body.style.overflow = 'auto';
            });
        });
    }

    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    const commonLogoutHandler = (event) => {
        event.preventDefault();
        localStorage.removeItem('adminLoggedIn');
        window.location.href = '../auth-pages/login.html';
    };

    if (logoutButton) {
        logoutButton.addEventListener('click', commonLogoutHandler);
    }
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', commonLogoutHandler);
    }

    if (document.body.id === 'admin-dashboard-page') {
        loadAdminDashboardData();
    } else if (document.body.id === 'admin-logs-page') {
        setupAdminLogsPage();
    } else if (document.body.id === 'admin-calendar-page') {
        setupAdminCalendarPage();
    }

    function generateMockUserData() {
        let users = JSON.parse(localStorage.getItem('adminUsers')) || [];
        if (users.length === 0) {
            const numUsers = 50 + Math.floor(Math.random() * 50);
            for (let i = 0; i < numUsers; i++) {
                const username = `User${i + 1}`;
                const email = `user${i + 1}@example.com`;
                const signUpDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
                const lastLogin = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
                const lastLogout = new Date(lastLogin.getTime() + Math.random() * 2 * 60 * 60 * 1000);
                const treesPlanted = Math.floor(Math.random() * 10);
                users.push({
                    username,
                    email,
                    signUpDate: signUpDate.toISOString(),
                    lastLogin: lastLogin.toISOString(),
                    lastLogout: lastLogout.toISOString(),
                    treesPlanted
                });
            }
            localStorage.setItem('adminUsers', JSON.stringify(users));
        }

        let dailyStats = JSON.parse(localStorage.getItem('adminDailyStats')) || {};
        const todayKey = new Date().toISOString().split('T')[0];
        if (!dailyStats[todayKey]) {
            dailyStats[todayKey] = {
                usersPerDay: Math.floor(Math.random() * 100) + 50,
                contactsRecorded: Math.floor(Math.random() * 20) + 5,
                visits: Math.floor(Math.random() * 100) + 50
            };
            localStorage.setItem('adminDailyStats', JSON.stringify(dailyStats));
        }

        let monthlyVisits = JSON.parse(localStorage.getItem('adminMonthlyVisits')) || {};
        const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        if (!monthlyVisits[currentMonth]) {
            for (let i = 0; i < 5; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthName = d.toLocaleString('en-US', { month: 'long' });
                monthlyVisits[monthName] = Math.floor(Math.random() * 150) + 1;
            }
            localStorage.setItem('adminMonthlyVisits', JSON.stringify(monthlyVisits));
        }
    }
    generateMockUserData();
});

function loadAdminDashboardData() {
    const users = JSON.parse(localStorage.getItem('adminUsers')) || [];
    const dailyStats = JSON.parse(localStorage.getItem('adminDailyStats')) || {};
    const monthlyVisits = JSON.parse(localStorage.getItem('adminMonthlyVisits')) || {};
    const todayKey = new Date().toISOString().split('T')[0];

    const usersPerDay = dailyStats[todayKey] ? dailyStats[todayKey].usersPerDay : 0;
    const maxUsersPerDay = 150;
    const usersPerDayProgress = Math.min((usersPerDay / maxUsersPerDay) * 100, 100);
    document.getElementById('users-per-day-pie').style.background = `conic-gradient(#4CAF50 ${usersPerDayProgress}%, #DDD ${usersPerDayProgress}%)`;
    document.getElementById('users-per-day-text').textContent = `${usersPerDay}`;
    document.querySelector('#users-per-day-pie + .progress-label').textContent = `Users Today (out of ${maxUsersPerDay})`;


    const contactsRecorded = dailyStats[todayKey] ? dailyStats[todayKey].contactsRecorded : 0;
    const maxContactsRecorded = 25;
    const contactsRecordedProgress = Math.min((contactsRecorded / maxContactsRecorded) * 100, 100);
    document.getElementById('contacts-recorded-pie').style.background = `conic-gradient(#2196F3 ${contactsRecordedProgress}%, #DDD ${contactsRecordedProgress}%)`;
    document.getElementById('contacts-recorded-text').textContent = `${contactsRecorded}`;
    document.querySelector('#contacts-recorded-pie + .progress-label').textContent = `Contacts Today (out of ${maxContactsRecorded})`;


    const visitsChart = document.getElementById('visits-chart');
    visitsChart.innerHTML = '';

    const monthNames = Object.keys(monthlyVisits).sort((a, b) => {
        const dateA = new Date(`1 ${a} 2025`);
        const dateB = new Date(`1 ${b} 2025`);
        return dateA - dateB;
    });

    const maxVisits = 150;
    monthNames.forEach(month => {
        const visits = monthlyVisits[month];
        const barHeight = (visits / maxVisits) * 100;
        const barGroup = document.createElement('div');
        barGroup.className = 'bar-group';
        barGroup.innerHTML = `
            <div class="bar" style="height: ${barHeight}%;">${visits}</div>
            <span class="bar-label">${month.substring(0, 3)}</span>
        `;
        visitsChart.appendChild(barGroup);
    });

    const totalUsers = users.length;
    let totalTreesPlanted = 0;
    users.forEach(user => {
        totalTreesPlanted += user.treesPlanted;
    });

    document.getElementById('total-users').textContent = totalUsers;
    document.getElementById('total-trees-planted').textContent = totalTreesPlanted;
}

let currentSortOrder = 0;

function setupAdminLogsPage() {
    const searchInput = document.getElementById('search-input');
    const sortButton = document.getElementById('sort-button');
    const userLogsTableBody = document.getElementById('user-logs-table-body');

    let usersData = JSON.parse(localStorage.getItem('adminUsers')) || [];

    function renderTable(data) {
        userLogsTableBody.innerHTML = '';
        if (data.length === 0) {
            userLogsTableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No user data available.</td></tr>';
            return;
        }

        data.forEach(user => {
            const row = document.createElement('tr');
            const lastLoginDate = new Date(user.lastLogin).toLocaleString();
            const lastLogoutDate = new Date(user.lastLogout).toLocaleString();
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <div class="last-login">Logged in: ${lastLoginDate}</div>
                    <div class="last-logout">Logged out: ${lastLogoutDate}</div>
                </td>
                <td>${user.treesPlanted}</td>
            `;
            userLogsTableBody.appendChild(row);
        });
    }

    function sortUsers(data, order) {
        let sortedData = [...data];
        switch (order) {
            case 1:
                sortedData.sort((a, b) => a.username.localeCompare(b.username));
                break;
            case 2:
                sortedData.sort((a, b) => b.username.localeCompare(a.username));
                break;
            case 3:
                sortedData.sort((a, b) => b.treesPlanted - a.treesPlanted);
                break;
            case 4:
                sortedData.sort((a, b) => a.treesPlanted - b.treesPlanted);
                break;
            case 5:
                sortedData.sort((a, b) => new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime());
                break;
            case 6:
                sortedData.sort((a, b) => new Date(a.lastLogin).getTime() - new Date(b.lastLogin).getTime());
                break;
            default:
                break;
        }
        return sortedData;
    }

    function filterUsers() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredData = usersData.filter(user =>
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
        renderTable(sortUsers(filteredData, currentSortOrder));
    }

    searchInput.addEventListener('input', filterUsers);

    sortButton.addEventListener('click', () => {
        currentSortOrder = (currentSortOrder % 6) + 1;
        const sortIcon = sortButton.querySelector('i');
        sortIcon.className = 'fas';

        let sortText = 'Sort';
        switch (currentSortOrder) {
            case 1:
                sortText = 'Username (A-Z)';
                sortIcon.classList.add('fa-sort-alpha-down');
                break;
            case 2:
                sortText = 'Username (Z-A)';
                sortIcon.classList.add('fa-sort-alpha-up-alt');
                break;
            case 3:
                sortText = 'Trees (Highest)';
                sortIcon.classList.add('fa-sort-numeric-down');
                break;
            case 4:
                sortText = 'Trees (Lowest)';
                sortIcon.classList.add('fa-sort-numeric-up-alt');
                break;
            case 5:
                sortText = 'Recent (Newest)';
                sortIcon.classList.add('fa-sort-amount-down');
                break;
            case 6:
                sortText = 'Recent (Oldest)';
                sortIcon.classList.add('fa-sort-amount-up-alt');
                break;
        }
        sortButton.innerHTML = `${sortText} <i class="${sortIcon.className}"></i>`;
        filterUsers();
    });

    renderTable(usersData);
}

function setupAdminCalendarPage() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthTitle = document.getElementById('month-name');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');

    let currentDate = new Date();

    function renderCalendar(year, month) {
        calendarGrid.innerHTML = '';
        const date = new Date(year, month, 1);
        monthTitle.textContent = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayIndex = date.getDay();

        const allDailyStats = JSON.parse(localStorage.getItem('adminDailyStats')) || {};

        for (let i = 0; i < firstDayIndex; i++) {
            calendarGrid.innerHTML += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const daySquare = document.createElement('div');
            daySquare.className = 'day';
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            daySquare.setAttribute('data-date-key', dateKey);
            daySquare.innerHTML = `<span class="day-number">${day}</span>`;

            const dailyData = allDailyStats[dateKey] || { usersPerDay: 0, contactsRecorded: 0, visits: 0, treesPlanted: 0 };

            const mockUsersCount = Math.floor(Math.random() * 100) + 50;
            const mockTreesCount = Math.floor(Math.random() * 20);

            daySquare.innerHTML += `
                <div class="day-stats">
                    <p>Users: <strong>${dailyData.usersPerDay}</strong></p>
                    <p>Contacts: <strong>${dailyData.contactsRecorded}</strong></p>
                    <p>Total Users: <strong>${mockUsersCount}</strong></p>
                    <p>Trees Planted: <strong>${mockTreesCount}</strong></p>
                </div>
            `;
            
            daySquare.addEventListener('click', () => showDailyDetailsModal(dateKey, dailyData, mockUsersCount, mockTreesCount));
            calendarGrid.appendChild(daySquare);
        }
    }

    function showDailyDetailsModal(dateKey, data, totalUsers, totalTrees) {
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <button class="modal-close-button">&times;</button>
                <h3>Details for ${new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                <p>Number of Users: <strong>${data.usersPerDay}</strong></p>
                <p>Number of Contacts Recorded: <strong>${data.contactsRecorded}</strong></p>
                <p>Total Users in Day: <strong>${totalUsers}</strong></p>
                <p>Total Trees Planted in Day: <strong>${totalTrees}</strong></p>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        modalOverlay.querySelector('.modal-close-button').addEventListener('click', () => {
            document.body.removeChild(modalOverlay);
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                document.body.removeChild(modalOverlay);
            }
        });
    }


    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
    });

    renderCalendar(currentDate.getFullYear(), currentDate.getMonth());
}

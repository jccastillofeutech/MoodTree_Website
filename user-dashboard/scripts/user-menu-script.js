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

    // Get username from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('username');

    if (username) {
        localStorage.setItem('loggedInUser', username);
    } else {
        username = localStorage.getItem('loggedInUser');
    }

    // Display username in sidebar
    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
    } else if (usernameDisplay) {
        usernameDisplay.textContent = 'Guest';
    }

    // Setup logout button
    const logoutButton = document.getElementById('logout-button');
    const mobileLogoutButton = document.getElementById('mobile-logout-button');

    const commonLogoutHandler = (event) => {
        event.preventDefault();
        localStorage.removeItem('loggedInUser');
        localStorage.removeItem('dailyMood');
        localStorage.removeItem('tempMood');
        localStorage.removeItem('treeState');
        localStorage.removeItem('treeClicks');
        window.location.href = '../auth-pages/login.html';
    };

    if (logoutButton) {
        logoutButton.addEventListener('click', commonLogoutHandler);
    }
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', commonLogoutHandler);
    }


    if (document.body.id === 'dashboard-page') {
        loadDashboardData();
    } else if (document.body.id === 'log-mood-page') {
        setupLogMoodPage();
    } else if (document.body.id === 'simulator-page') {
        setupSimulatorPage();
    } else if (document.body.id === 'calendar-page') {
        setupCalendarPage();
    }
});

function setupLogMoodPage() {
    const sliders = {
        happiness: document.getElementById('happiness-slider'),
        sadness: document.getElementById('sadness-slider'),
        anger: document.getElementById('anger-slider'),
        calmness: document.getElementById('calmness-slider'),
        work: document.getElementById('work-slider'),
        sleep: document.getElementById('sleep-slider'),
    };

    const pies = {
        happiness: document.getElementById('happiness-pie'),
        sadness: document.getElementById('sadness-pie'),
        anger: document.getElementById('anger-pie'),
        calmness: document.getElementById('calmness-pie'),
        work: document.getElementById('work-pie'),
        sleep: document.getElementById('sleep-pie'),
    };
    
    const sliderColors = {
        happiness: '#4CAF50',
        sadness: '#FFC107',
        anger: '#F44336',
        calmness: '#2196F3',
        work: '#2E7D32',
        sleep: '#689F38'
    };

    const moodColorBox = document.getElementById('mood-color-box');
    const moodNameDisplay = document.getElementById('mood-name');
    const saveButton = document.getElementById('save-mood');
    const createSeedButton = document.getElementById('create-seed');
    const notesArea = document.getElementById('notes-area');
    const charCounter = document.getElementById('char-counter');

    const moodMap = [
        { name: 'Astonished', valence: 0.3, arousal: 0.9, color: '#FDD835' }, { name: 'Excited', valence: 0.6, arousal: 0.8, color: '#FFEE58' },
        { name: 'Amused', valence: 0.7, arousal: 0.5, color: '#D4E157' }, { name: 'Happy', valence: 0.8, arousal: 0.4, color: '#9CCC65' },
        { name: 'Delighted', valence: 0.7, arousal: 0.2, color: '#66BB6A' }, { name: 'Glad', valence: 0.6, arousal: 0.1, color: '#4CAF50' },
        { name: 'Pleased', valence: 0.5, arousal: -0.1, color: '#43A047' }, { name: 'Alarmed', valence: -0.3, arousal: 0.9, color: '#FFB300' },
        { name: 'Tense', valence: -0.5, arousal: 0.7, color: '#FB8C00' }, { name: 'Frustrated', valence: -0.8, arousal: 0.6, color: '#F4511E' },
        { name: 'Annoyed', valence: -0.6, arousal: 0.3, color: '#FF7043' }, { name: 'Distressed', valence: -0.7, arousal: 0.1, color: '#E53935' },
        { name: 'Miserable', valence: -0.8, arousal: -0.2, color: '#D32F2F' }, { name: 'Sad', valence: -0.7, arousal: -0.4, color: '#5C6BC0' },
        { name: 'Depressed', valence: -0.6, arousal: -0.6, color: '#3F51B5' }, { name: 'Gloomy', valence: -0.4, arousal: -0.7, color: '#4527A0' },
        { name: 'Lethargic', valence: -0.3, arousal: -0.8, color: '#651FFF' }, { name: 'Fatigued', valence: -0.1, arousal: -0.9, color: '#1A237E' },
        { name: 'Content', valence: 0.4, arousal: -0.2, color: '#26A69A' }, { name: 'Serene', valence: 0.3, arousal: -0.4, color: '#00ACC1' },
        { name: 'At Ease', valence: 0.2, arousal: -0.5, color: '#0097A7' }, { name: 'Calm', valence: 0.1, arousal: -0.6, color: '#26C6DA' },
        { name: 'Relaxed', valence: 0.2, arousal: -0.8, color: '#80DEEA' }, { name: 'Sleepy', valence: 0.0, arousal: -0.7, color: '#B3E5FC' },
        { name: 'Tired', valence: -0.1, arousal: -0.6, color: '#4FC3F7' }
    ];

    function getMoodFromCircumplex(valence, arousal) {
        let closestMood = null;
        let minDistance = Infinity;
        moodMap.forEach(mood => {
            const distance = Math.sqrt(Math.pow(valence - mood.valence, 2) + Math.pow(arousal - mood.arousal, 2));
            if (distance < minDistance) {
                minDistance = distance;
                closestMood = mood;
            }
        });
        return closestMood || { name: 'Neutral', color: '#BDBDBD' };
    }

    function updateMood() {
        const pleasant = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        const unpleasant = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const highEnergy = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const lowEnergy = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        
        let valence = (pleasant - unpleasant) / 18;
        let arousal = (highEnergy - lowEnergy) / 18;

        const { color, name } = getMoodFromCircumplex(valence, arousal);
        moodColorBox.style.backgroundColor = color;
        moodNameDisplay.textContent = name;
    }

    function updatePie(slider, pie, key) {
        const value = slider.value;
        const min = slider.min || 0;
        const max = slider.max || 100;
        const percentage = ((value - min) / (max - min)) * 100;
        const color = sliderColors[key];
        
        pie.querySelector('span').textContent = value;
        pie.style.background = `conic-gradient(${color} ${percentage}%, #E0E0E0 0%)`;
    }
    
    function updateCharCounter() {
        const count = notesArea.value.length;
        const max = notesArea.maxLength;
        charCounter.textContent = `${count} / ${max}`;
    }

    for (const key in sliders) {
        sliders[key].addEventListener('input', () => {
            updatePie(sliders[key], pies[key], key);
            if (!key.includes('work') && !key.includes('sleep')) {
                updateMood();
            }
        });
    }
    
    notesArea.addEventListener('input', updateCharCounter);

    saveButton.addEventListener('click', () => {
        const showMessage = (msg) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); z-index: 1000;
                display: flex; align-items: center; justify-content: center;
            `;
            const box = document.createElement('div');
            box.style.cssText = `
                background: #fff; padding: 20px; border-radius: 8px; text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 300px;
            `;
            box.innerHTML = `<p>${msg}</p><button style="margin-top: 10px; padding: 8px 15px; background-color: #81C784; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>`;
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            box.querySelector('button').onclick = () => document.body.removeChild(overlay);
        };

        const moodData = {
            happiness: sliders.happiness.value, sadness: sliders.sadness.value,
            anger: sliders.anger.value, calmness: sliders.calmness.value,
            work: sliders.work.value, sleep: sliders.sleep.value,
            moodColor: moodColorBox.style.backgroundColor,
            moodName: moodNameDisplay.textContent,
            note: document.getElementById('notes-area').value,
            date: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('tempMood', JSON.stringify(moodData));
        showMessage('Your progress has been saved temporarily.');
    });

    createSeedButton.addEventListener('click', () => {
        const pleasant = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        const unpleasant = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const highEnergy = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const lowEnergy = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        
        let valence = (pleasant - unpleasant) / 18;
        let arousal = (highEnergy - lowEnergy) / 18;

        const moodData = {
            happiness: sliders.happiness.value, sadness: sliders.sadness.value,
            anger: sliders.anger.value, calmness: sliders.calmness.value,
            work: sliders.work.value, sleep: sliders.sleep.value,
            moodColor: moodColorBox.style.backgroundColor,
            moodName: moodNameDisplay.textContent,
            note: document.getElementById('notes-area').value,
            valence: valence,
            arousal: arousal,
            status: 'created',
            date: new Date().toISOString().split('T')[0]
        };
        localStorage.setItem('dailyMood', JSON.stringify(moodData));
        localStorage.removeItem('tempMood');
        
        Object.values(sliders).forEach(s => s.disabled = true);
        createSeedButton.disabled = true;
        saveButton.disabled = true;
        notesArea.disabled = true;

        const showMessage = (msg, callback) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.6); z-index: 1000;
                display: flex; align-items: center; justify-content: center;
            `;
            const box = document.createElement('div');
            box.style.cssText = `
                background: #fff; padding: 20px; border-radius: 8px; text-align: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 300px;
            `;
            box.innerHTML = `<p>${msg}</p><button style="margin-top: 10px; padding: 8px 15px; background-color: #81C784; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>`;
            overlay.appendChild(box);
            document.body.appendChild(overlay);
            box.querySelector('button').onclick = () => {
                document.body.removeChild(overlay);
                if (callback) callback();
            };
        };
        showMessage('Seed Created! Let\'s go to the simulator to grow your tree.', () => {
            window.location.href = 'tree-simulator.html';
        });
    });
    
    function loadState() {
        const todayKey = new Date().toISOString().split('T')[0];
        const dailyMood = JSON.parse(localStorage.getItem('dailyMood'));
        let dataToLoad = null;

        if (dailyMood && dailyMood.date !== todayKey) {
            localStorage.removeItem('dailyMood');
        }
        const tempMood = JSON.parse(localStorage.getItem('tempMood'));
        if (tempMood && tempMood.date !== todayKey) {
            localStorage.removeItem('tempMood');
        }

        const currentDailyMood = JSON.parse(localStorage.getItem('dailyMood'));
        const currentTempMood = JSON.parse(localStorage.getItem('tempMood'));

        if (currentDailyMood && currentDailyMood.date === todayKey) {
            dataToLoad = currentDailyMood;
            Object.values(sliders).forEach(s => s.disabled = true);
            createSeedButton.disabled = true;
            saveButton.disabled = true;
            notesArea.disabled = true;
        } else if (currentTempMood && currentTempMood.date === todayKey) {
            dataToLoad = currentTempMood;
            Object.values(sliders).forEach(s => s.disabled = false);
            createSeedButton.disabled = false;
            saveButton.disabled = false;
            notesArea.disabled = false;
        } else {
            Object.values(sliders).forEach(s => s.disabled = false);
            createSeedButton.disabled = false;
            saveButton.disabled = false;
            notesArea.disabled = false;
            Object.keys(sliders).forEach(key => {
                const defaultVal = key === 'work' || key === 'sleep' ? 8 : 5;
                sliders[key].value = defaultVal;
            });
            notesArea.value = '';
        }
        
        if (dataToLoad) {
             Object.keys(sliders).forEach(key => {
                if(dataToLoad[key]) {
                    sliders[key].value = dataToLoad[key];
                }
            });
            notesArea.value = dataToLoad.note || '';
        }
        
        Object.keys(sliders).forEach(key => updatePie(sliders[key], pies[key], key));
        updateMood();
        updateCharCounter();
    }
    
    loadState();
}


function loadDashboardData() {
    const todayKey = new Date().toISOString().split('T')[0];
    let dataToDisplay = JSON.parse(localStorage.getItem('dailyMood'));

    if (!dataToDisplay || dataToDisplay.date !== todayKey) {
        const tempMood = JSON.parse(localStorage.getItem('tempMood'));
        if (tempMood && tempMood.date === todayKey) {
            dataToDisplay = tempMood;
        } else {
            dataToDisplay = null;
        }
    }


    if (dataToDisplay) {
        const workHours = parseInt(dataToDisplay.work) || 0;
        const sleepHours = parseInt(dataToDisplay.sleep) || 0;

        const workBar = document.getElementById('work-bar');
        const sleepBar = document.getElementById('sleep-bar');

        workBar.style.height = `${(workHours / 24) * 100}%`;
        workBar.textContent = workHours;
        sleepBar.style.height = `${(sleepHours / 24) * 100}%`;
        sleepBar.textContent = sleepHours;

        document.getElementById('mood-display-color').style.backgroundColor = dataToDisplay.moodColor;
        document.getElementById('mood-display-name').textContent = dataToDisplay.moodName;
        document.getElementById('notes-display').textContent = dataToDisplay.note || 'No note added.';

        document.getElementById('happiness-level').style.height = `${(parseInt(dataToDisplay.happiness) -1) * 11.1}%`;
        document.getElementById('sadness-level').style.height = `${(parseInt(dataToDisplay.sadness) -1) * 11.1}%`;
        document.getElementById('anger-level').style.height = `${(parseInt(dataToDisplay.anger) -1) * 11.1}%`;
        document.getElementById('calmness-level').style.height = `${(parseInt(dataToDisplay.calmness) -1) * 11.1}%`;
    } else {
        const workBar = document.getElementById('work-bar');
        const sleepBar = document.getElementById('sleep-bar');
        workBar.style.height = '0%';
        workBar.textContent = '0';
        sleepBar.style.height = '0%';
        sleepBar.textContent = '0';
        document.getElementById('mood-display-color').style.backgroundColor = '#DDD';
        document.getElementById('mood-display-name').textContent = 'NOT LOGGED';
        document.getElementById('notes-display').textContent = 'No note added.';
        document.getElementById('happiness-level').style.height = '0%';
        document.getElementById('sadness-level').style.height = '0%';
        document.getElementById('anger-level').style.height = '0%';
        document.getElementById('calmness-level').style.height = '0%';
    }
        
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const history = JSON.parse(localStorage.getItem('moodHistory')) || {};
    const trackedDays = Object.keys(history).length; 
    
    const progress = (trackedDays / daysInMonth) * 100;
    
    document.getElementById('progress-pie').style.background = `conic-gradient(#4CAF50 ${progress}%, #DDD ${progress}%)`;
    document.getElementById('progress-text').textContent = `${Math.round(progress)}%`;
}

function setupSimulatorPage() {
    const plantBtn = document.getElementById('plant-seed');
    const waterBtn = document.getElementById('water-seed');
    const fertilizeBtn = document.getElementById('fertilize-seed');
    const shovelBtn = document.getElementById('shovel-tree');
    const mound = document.getElementById('mound');
    const treeContainer = document.getElementById('tree-container');
    const progressBar = document.getElementById('growth-progress');
    const notificationOverlay = document.getElementById('notification-overlay');
    const redirectBtn = document.getElementById('redirect-log-mood');

    let state = localStorage.getItem('treeState') || 'unplanted';
    let clicks = parseInt(localStorage.getItem('treeClicks')) || 0;
    const clicksNeeded = 80;

    const dailyMood = JSON.parse(localStorage.getItem('dailyMood'));
    const todayKey = new Date().toISOString().split('T')[0];

    const isSimulatorActive = dailyMood && dailyMood.status === 'created' && dailyMood.date === todayKey && state !== 'shoveled';

    if (!isSimulatorActive) {
        plantBtn.disabled = true;
        waterBtn.disabled = true;
        fertilizeBtn.disabled = true;
        shovelBtn.disabled = true;
        
        if(notificationOverlay) notificationOverlay.style.display = 'flex';
        if(redirectBtn) redirectBtn.addEventListener('click', () => { window.location.href = 'log-mood.html'; });

        if ((dailyMood && dailyMood.date !== todayKey) || (!dailyMood && state !== 'unplanted')) {
             localStorage.removeItem('treeState');
             localStorage.removeItem('treeClicks');
             state = 'unplanted';
             clicks = 0;
        }
        
        if (state === 'shoveled') {
            mound.style.display = 'none';
            treeContainer.style.display = 'none';
        }

        updateUI(); 
        return; 
    }
    
    const moodColor = dailyMood.moodColor;
    const moodName = dailyMood.moodName;
    const treeType = getTreeType(dailyMood.valence, dailyMood.arousal);
    treeContainer.style.setProperty('--leaf-color', moodColor);


    function updateUI() {
        plantBtn.disabled = state !== 'unplanted';
        waterBtn.disabled = state !== 'planted';
        fertilizeBtn.disabled = state !== 'watered';
        shovelBtn.disabled = state !== 'mature';

        mound.style.display = 'none';
        treeContainer.style.display = 'none';
        if(notificationOverlay) notificationOverlay.style.display = 'none';

        if (state === 'unplanted') {
        } else if (state === 'planted') {
            mound.style.display = 'block';
            mound.style.backgroundColor = '#A0522D';
            mound.style.width = '80px';
            mound.style.height = '40px';
        } else if (state === 'watered') {
            mound.style.display = 'block';
            mound.style.backgroundColor = '#8B4513';
            mound.style.width = '100px';
            mound.style.height = '50px';
        } else if (state === 'fertilized' || state === 'growing' || state === 'mature') {
            if (clicks < 20) {
                mound.style.display = 'block';
                mound.style.backgroundColor = '#DAA520';
                mound.style.width = '120px';
                mound.style.height = '60px';
            } else {
                treeContainer.style.display = 'block';
                drawTree(clicks, treeType);
            }
        } 

        const progress = Math.min((clicks / clicksNeeded) * 100, 100);
        progressBar.style.width = `${progress}%`;

        localStorage.setItem('treeState', state);
        localStorage.setItem('treeClicks', clicks);
    }

    plantBtn.addEventListener('click', () => { state = 'planted'; updateUI(); });
    waterBtn.addEventListener('click', () => { state = 'watered'; updateUI(); });
    fertilizeBtn.addEventListener('click', () => { state = 'fertilized'; updateUI(); });
    
    mound.addEventListener('click', () => {
        if (state === 'fertilized' || state === 'growing') {
            state = 'growing';
            clicks++;
            if (clicks >= clicksNeeded) {
                state = 'mature';
            }
            updateUI();
        }
    });

    treeContainer.addEventListener('click', () => {
        if (state === 'growing' || state === 'mature') {
            clicks++;
            if (clicks >= clicksNeeded) {
                state = 'mature';
            }
            updateUI();
        }
    });

    shovelBtn.addEventListener('click', () => {
        if (state === 'mature') {
            const todayKey = new Date().toISOString().split('T')[0];
            const history = JSON.parse(localStorage.getItem('moodHistory')) || {};
            history[todayKey] = { moodName, moodColor, treeType };
            localStorage.setItem('moodHistory', JSON.stringify(history));
            
            localStorage.removeItem('tempMood');
            localStorage.removeItem('treeClicks');
            localStorage.setItem('treeState', 'shoveled');

            const showMessage = (msg, callback) => {
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.6); z-index: 1000;
                    display: flex; align-items: center; justify-content: center;
                `;
                const box = document.createElement('div');
                box.style.cssText = `
                    background: #fff; padding: 20px; border-radius: 8px; text-align: center;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2); max-width: 300px;
                `;
                box.innerHTML = `<p>${msg}</p><button style="margin-top: 10px; padding: 8px 15px; background-color: #81C784; color: white; border: none; border-radius: 5px; cursor: pointer;">OK</button>`;
                overlay.appendChild(box);
                document.body.appendChild(overlay);
                box.querySelector('button').onclick = () => {
                    document.body.removeChild(overlay);
                    if (callback) callback();
                };
            };

            showMessage('Tree Shoveled and recorded in your calendar! Your mood for today is now considered logged.', () => {
                window.location.href = 'user-calendar.html'; 
            });
        }
    });

    updateUI();
}

function drawTree(clicks, treeType) {
    const tree = document.getElementById('tree-container');
    const trunk = tree.querySelector('.trunk');
    const canopy = tree.querySelector('.canopy');

    tree.className = ''; 
    trunk.removeAttribute('style'); 
    canopy.removeAttribute('style'); 
    canopy.querySelectorAll('div').forEach(leaf => leaf.removeAttribute('style')); 


    if (clicks >= 20 && clicks < 40) {
        tree.classList.add('stage-1');
    } else if (clicks >= 40 && clicks < 60) {
        tree.classList.add('stage-2');
    } else if (clicks >= 60 && clicks < 80) {
        tree.classList.add('stage-3');
    } else if (clicks >= 80) {
        tree.classList.add('stage-4', `type-${treeType}`);
    }
}

function getTreeType(valence, arousal) {
    if (valence >= 0 && arousal >= 0) return 'pine';
    if (valence < 0 && arousal >= 0) return 'columnar';
    if (valence < 0 && arousal < 0) return 'weeping';
    if (valence >= 0 && arousal < 0) return 'rounded';
    return 'rounded';
}


function setupCalendarPage() {
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

        const history = JSON.parse(localStorage.getItem('moodHistory')) || {};

        for (let i = 0; i < firstDayIndex; i++) {
            calendarGrid.innerHTML += '<div></div>';
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const daySquare = document.createElement('div');
            daySquare.className = 'day';
            daySquare.innerHTML = `<span class="day-number">${day}</span>`;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            if (history[dateKey]) {
                const entry = history[dateKey];
                const treeDiv = document.createElement('div');
                treeDiv.className = `calendar-tree type-${entry.treeType}`;
                
                const trunk = document.createElement('div');
                trunk.className = 'trunk';
                const leaves = document.createElement('div');
                leaves.className = 'leaves';
                leaves.style.backgroundColor = entry.moodColor;
                
                treeDiv.appendChild(trunk);
                treeDiv.appendChild(leaves);
                
                const moodName = document.createElement('p');
                moodName.textContent = entry.moodName;
                
                daySquare.appendChild(treeDiv);
                daySquare.appendChild(moodName);
            }
            calendarGrid.appendChild(daySquare);
        }
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

function hexToRgb(color) {
    if (!color) return {r:128, g:128, b:128};
    if (color.startsWith('rgb')) {
        const [r, g, b] = color.match(/\d+/g).map(Number);
        return {r, g, b};
    }
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : {r:128, g:128, b:128};
}

function darkenColor(color, percent) {
    let {r, g, b} = hexToRgb(color);
    r = Math.floor(r * (1 - percent / 100));
    g = Math.floor(g * (1 - percent / 100));
    b = Math.floor(b * (1 - percent / 100));
    return `rgb(${r},${g},${b})`;
}

function lightenColor(color, percent) {
    let {r, g, b} = hexToRgb(color);
    r = Math.floor(r + (255 - r) * (percent / 100));
    g = Math.floor(g + (255 - g) * (percent / 100));
    b = Math.floor(b + (255 - b) * (percent / 100));
    return `rgb(${r},${g},${b})`;
}

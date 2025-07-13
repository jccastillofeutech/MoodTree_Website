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

    const urlParams = new URLSearchParams(window.location.search);
    let username = urlParams.get('username');

    if (username) {
        localStorage.setItem('loggedInUser', username);
    } else {
        username = localStorage.getItem('loggedInUser');
    }

    const usernameDisplay = document.getElementById('username-display');
    if (usernameDisplay && username) {
        usernameDisplay.textContent = username;
    } else if (usernameDisplay) {
        usernameDisplay.textContent = 'Guest';
    }

    const mobileUsernameDisplay = document.getElementById('mobile-username-display');
    if (mobileUsernameDisplay && username) {
        mobileUsernameDisplay.textContent = username;
    } else if (mobileUsernameDisplay) {
        mobileUsernameDisplay.textContent = 'Guest';
    }

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

    function calculateMood() {
        const pleasant = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        const unpleasant = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const highEnergy = (parseInt(sliders.happiness.value) - 1) + (parseInt(sliders.anger.value) - 1);
        const lowEnergy = (parseInt(sliders.sadness.value) - 1) + (parseInt(sliders.calmness.value) - 1);
        
        let valence = (pleasant - unpleasant) / 18;
        let arousal = (highEnergy - lowEnergy) / 18;

        return getMoodFromCircumplex(valence, arousal);
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
        });
    }
    
    notesArea.addEventListener('input', updateCharCounter);

    createSeedButton.addEventListener('click', () => {
        const { color: moodColor, name: moodName, valence, arousal } = calculateMood();

        const today = new Date(); 
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayKey = `${year}-${month}-${day}`;

        const moodData = {
            happiness: sliders.happiness.value, sadness: sliders.sadness.value,
            anger: sliders.anger.value, calmness: sliders.calmness.value,
            work: sliders.work.value, sleep: sliders.sleep.value,
            moodColor: moodColor,
            moodName: moodName,
            note: document.getElementById('notes-area').value,
            valence: valence,
            arousal: arousal,
            status: 'created',
            date: todayKey
        };
        localStorage.setItem('dailyMood', JSON.stringify(moodData));
        localStorage.removeItem('tempMood');
        
        Object.values(sliders).forEach(s => s.disabled = true);
        createSeedButton.disabled = true;
        notesArea.disabled = true;

        let reflectionMessage = "";
        if (moodName === 'Happy' || moodName === 'Delighted' || moodName === 'Glad' || moodName === 'Pleased' || moodName === 'Amused' || moodName === 'Excited' || moodName === 'Astonished') {
            reflectionMessage = "It's wonderful to see you feeling positive! Your seed will thrive with this energy.";
        } else if (moodName === 'Sad' || moodName === 'Depressed' || moodName === 'Gloomy' || moodName === 'Miserable') {
            reflectionMessage = "It's okay to feel this way. Your seed is resilient and will grow with care.";
        } else if (moodName === 'Angry' || moodName === 'Frustrated' || moodName === 'Annoyed' || moodName === 'Tense' || moodName === 'Alarmed') {
            reflectionMessage = "Acknowledging your feelings is the first step. Let's channel this energy into growth.";
        } else if (moodName === 'Calm' || moodName === 'Serene' || moodName === 'At Ease' || moodName === 'Content') {
            reflectionMessage = "A calm mind brings strength. Your seed will grow peacefully.";
        } else if (moodName === 'Tired' || moodName === 'Fatigued' || moodName === 'Lethargic' || moodName === 'Sleepy') {
            reflectionMessage = "Rest is important for growth. Your seed needs time and nurturing.";
        } else {
            reflectionMessage = "Reflect on what this mood means for you. Your seed represents your journey.";
        }


        const moodDialogOverlay = document.createElement('div');
        moodDialogOverlay.className = 'mood-dialog-overlay';
        moodDialogOverlay.innerHTML = `
            <div class="mood-dialog-box">
                <h3>Your Mood Seed for Today!</h3>
                <div class="mood-dialog-seed" style="background-color: ${moodColor};"></div>
                <p class="mood-dialog-message">${reflectionMessage}</p>
                <button class="mood-dialog-button" id="mood-dialog-ok-button">OK</button>
            </div>
        `;
        document.body.appendChild(moodDialogOverlay);

        document.getElementById('mood-dialog-ok-button').addEventListener('click', () => {
            document.body.removeChild(moodDialogOverlay);
            window.location.href = 'tree-simulator.html';
        });

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `
            .mood-dialog-seed {
                width: 100px;
                height: 60px;
                background-color: var(--seed-color, #BDBDBD);
                border-radius: 50px / 30px;
                margin-bottom: 15px;
                transition: background-color 0.3s ease;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            }
        `;
        document.head.appendChild(styleSheet);
        moodDialogOverlay.querySelector('.mood-dialog-seed').style.setProperty('--seed-color', moodColor);
    });
    
    function loadState() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayKey = `${year}-${month}-${day}`;

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
            notesArea.disabled = true;
        } else if (currentTempMood && currentTempMood.date === todayKey) {
            dataToLoad = currentTempMood;
            Object.values(sliders).forEach(s => s.disabled = false);
            createSeedButton.disabled = false;
            notesArea.disabled = false;
        } else {
            Object.values(sliders).forEach(s => s.disabled = false);
            createSeedButton.disabled = false;
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
        updateCharCounter();
    }
    
    loadState();
}


function loadDashboardData() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayKey = `${year}-${month}-${day}`;

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

        const effectiveMaxHours = 27;

        workBar.style.height = `${(workHours / effectiveMaxHours) * 100}%`;
        workBar.textContent = workHours;
        sleepBar.style.height = `${(sleepHours / effectiveMaxHours) * 100}%`;
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
        document.getElementById('happiness-level').style.height = '0%';
        document.getElementById('sadness-level').style.height = '0%';
        document.getElementById('anger-level').style.height = '0%';
        document.getElementById('calmness-level').style.height = '0%';
    }
        
    const daysInMonth = new Date(year, today.getMonth() + 1, 0).getDate();
    
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
    const progressNotification = document.getElementById('progress-text-notification');

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayKey = `${year}-${month}-${day}`;

    let dailyMood = JSON.parse(localStorage.getItem('dailyMood'));

    if (dailyMood && dailyMood.date !== todayKey) {
        localStorage.removeItem('dailyMood');
        localStorage.removeItem('treeState');
        localStorage.removeItem('treeClicks');
        dailyMood = null;
    }
    dailyMood = JSON.parse(localStorage.getItem('dailyMood'));

    let state = localStorage.getItem('treeState') || 'unplanted';
    let clicks = parseInt(localStorage.getItem('treeClicks')) || 0;

    const clicksNeeded = 80;
    let notificationTimeout;
    let growingNotificationShown = false;
    
    const isSimulatorActive = dailyMood && dailyMood.status === 'created' && state !== 'shoveled';

    if (!isSimulatorActive) {
        plantBtn.disabled = true;
        waterBtn.disabled = true;
        fertilizeBtn.disabled = true;
        shovelBtn.disabled = true;
        
        if (state === 'shoveled') {
            mound.style.display = 'none';
            treeContainer.style.display = 'none';
            if (notificationOverlay) {
                notificationOverlay.querySelector('h3').textContent = "All Done for Today!";
                notificationOverlay.querySelector('p').textContent = "You've already grown and saved your tree. Come back tomorrow to grow a new one!";
                notificationOverlay.querySelector('button').textContent = "View Calendar";
                redirectBtn.addEventListener('click', () => { window.location.href = 'user-calendar.html'; });
                notificationOverlay.style.display = 'flex';
            }
        } else {
            if(notificationOverlay) notificationOverlay.style.display = 'flex';
            if(redirectBtn) redirectBtn.addEventListener('click', () => { window.location.href = 'log-mood.html'; });
        }
        return; 
    }
    
    const moodColor = dailyMood.moodColor;
    const moodName = dailyMood.moodName;
    const treeType = getTreeType(dailyMood.valence, dailyMood.arousal);
    
    document.documentElement.style.setProperty('--leaf-color', moodColor);

    const quotes = {
        pine: [
            "The foolish man seeks happiness in the distance, the wise grows it under his feet. - James Oppenheim",
            "Even if I knew that tomorrow the world would go to pieces, I would still plant my apple tree. - Martin Luther",
            "Joy is the serious business of Heaven. - C.S. Lewis"
        ],
        columnar: [
            "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
            "Notice that the stiffest tree is most easily cracked, while the bamboo or willow survives by bending with the wind. - Bruce Lee",
            "Turn your wounds into wisdom. - Oprah Winfrey"
        ],
        weeping: [
            "The clearest way into the Universe is through a forest wilderness. - John Muir",
            "And into the forest I go, to lose my mind and find my soul. - John Muir",
            "Even the darkest night will end and the sun will rise. - Victor Hugo"
        ],
        rounded: [
            "A society grows great when old men plant trees in whose shade they shall never sit. - Greek Proverb",
            "The creation of a thousand forests is in one acorn. - Ralph Waldo Emerson",
            "Adopt the pace of nature: her secret is patience. - Ralph Waldo Emerson"
        ]
    };

    function updateTreeAppearance(currentClicks, type) {
        treeContainer.className = '';
        if (currentClicks >= clicksNeeded) {
            treeContainer.classList.add('stage-mature', `type-${type}`);
        } else if (currentClicks >= 60) {
            treeContainer.classList.add('stage-sapling');
        } else if (currentClicks >= 40) {
            treeContainer.classList.add('stage-seedling');
        }
    }

    function updateUI() {
        plantBtn.disabled = state !== 'unplanted';
        waterBtn.disabled = state !== 'planted';
        fertilizeBtn.disabled = state !== 'watered';
        shovelBtn.disabled = state !== 'mature';

        mound.style.display = 'none';
        treeContainer.style.display = 'none';
        mound.className = '';

        if (state === 'unplanted') {
        } else if (state === 'planted') {
            mound.style.display = 'block';
            mound.classList.add('planted');
        } else if (state === 'watered') {
            mound.style.display = 'block';
            mound.classList.add('watered');
        } else if (state === 'fertilized' || state === 'growing' || state === 'mature') {
            if (clicks < 40) {
                mound.style.display = 'block';
                if (clicks >= 20) {
                    mound.classList.add('seed');
                } else {
                    mound.classList.add('watered'); 
                }
            } else {
                treeContainer.style.display = 'block';
                updateTreeAppearance(clicks, treeType);
            }
        } 
        
        clearTimeout(notificationTimeout);
        let notificationText = '';
        let shouldShow = true;

        switch(state) {
            case 'unplanted': notificationText = "Click the 'Plant' button to begin."; break;
            case 'planted': notificationText = "Click the 'Water' button to water your seed."; break;
            case 'watered': notificationText = "Click 'Fertilize' to enrich the soil."; break;
            case 'fertilized':
            case 'growing':
                if (!growingNotificationShown) {
                    notificationText = "It's growing! Click the mound or tree to help it along.";
                    growingNotificationShown = true;
                } else {
                    shouldShow = false;
                }
                break;
            case 'mature': notificationText = "Your tree is fully grown! Click 'Shovel' to save your tree."; break;
        }

        if (shouldShow && notificationText) {
            progressNotification.textContent = notificationText;
            progressNotification.style.opacity = '1';
            notificationTimeout = setTimeout(() => {
                progressNotification.style.opacity = '0';
            }, 3000);
        } else if (!shouldShow) {
             progressNotification.style.opacity = '0';
        }

        const progress = Math.min((clicks / clicksNeeded) * 100, 100);
        progressBar.style.width = `${progress}%`;

        localStorage.setItem('treeState', state);
        localStorage.setItem('treeClicks', clicks);
    }

    function handleGrowthClick() {
        if (state === 'fertilized' || state === 'growing') {
            if(state === 'fertilized') state = 'growing';
            clicks++;
            if (clicks >= clicksNeeded) {
                state = 'mature';
            }
            updateUI();
        }
    }

    plantBtn.addEventListener('click', () => { state = 'planted'; updateUI(); });
    waterBtn.addEventListener('click', () => { state = 'watered'; updateUI(); });
    fertilizeBtn.addEventListener('click', () => { state = 'fertilized'; updateUI(); });
    mound.addEventListener('click', handleGrowthClick);
    treeContainer.addEventListener('click', handleGrowthClick);

    shovelBtn.addEventListener('click', () => {
        if (state === 'mature') {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const todayKey = `${year}-${month}-${day}`;

            const history = JSON.parse(localStorage.getItem('moodHistory')) || {};
            
            const randomQuote = quotes[treeType][Math.floor(Math.random() * quotes[treeType].length)];

            history[todayKey] = { moodName, moodColor, treeType, note: dailyMood.note, quote: randomQuote };
            localStorage.setItem('moodHistory', JSON.stringify(history));
            
            localStorage.removeItem('tempMood');
            localStorage.removeItem('treeClicks');
            localStorage.setItem('treeState', 'shoveled');
            state = 'shoveled';

            showShovelConfirmationDialog(dailyMood, treeType, randomQuote);
        }
    });

    updateUI();
}

function getTreeType(valence, arousal) {
    if (valence >= 0 && arousal >= 0) return 'columnar';
    if (valence < 0 && arousal >= 0) return 'pine';
    if (valence < 0 && arousal < 0) return 'weeping';
    if (valence >= 0 && arousal < 0) return 'rounded';
    return 'rounded';
}

function showShovelConfirmationDialog(dailyMood, treeType, quote) {
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'mood-dialog-overlay';
    dialogOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
    `;

    const dialogBox = document.createElement('div');
    dialogBox.style.cssText = `
        background: #fff; padding: 30px; border-radius: 12px; text-align: center;
        box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-width: 450px;
        animation: pop 0.4s ease-out forwards;
        display: flex; flex-direction: column; align-items: center;
    `;

    dialogBox.innerHTML = `
        <h3 style="font-family: 'REM', sans-serif; margin-bottom: 15px; color: #333;">Congrats! You just planted a Mood Tree! Here's a quote for motivational prize:</h3>
        <p style="font-style: italic; color: #666; margin-bottom: 25px; line-height: 1.5;">"${quote || 'No quote available.'}"</p>
        <button id="view-calendar-button" style="padding: 12px 25px; background-color: #81C784; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: background-color 0.2s;">View Calendar</button>
    `;

    document.body.appendChild(dialogOverlay);
    dialogOverlay.appendChild(dialogBox);

    document.getElementById('view-calendar-button').addEventListener('click', () => {
        document.body.removeChild(dialogOverlay);
        window.location.href = `user-calendar.html?showDialog=true&date=${dailyMood.date}`;
    });

    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `@keyframes pop { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`;
    document.head.appendChild(styleSheet);
}


function setupCalendarPage() {
    const calendarGrid = document.getElementById('calendar-grid');
    const monthTitle = document.getElementById('month-name');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    const urlParams = new URLSearchParams(window.location.search);
    const showDialogOnLoad = urlParams.get('showDialog') === 'true';
    const dialogDateKey = urlParams.get('date');

    let currentDate = new Date();

   
    const quotes = {
        pine: [
            "The foolish man seeks happiness in the distance, the wise grows it under his feet. - James Oppenheim",
            "Even if I knew that tomorrow the world would go to pieces, I would still plant my apple tree. - Martin Luther",
            "Joy is the serious business of Heaven. - C.S. Lewis"
        ],
        columnar: [
            "The best time to plant a tree was 20 years ago. The second best time is now. - Chinese Proverb",
            "Notice that the stiffest tree is most easily cracked, while the bamboo or willow survives by bending with the wind. - Bruce Lee",
            "Turn your wounds into wisdom. - Oprah Winfrey"
        ],
        weeping: [
            "The clearest way into the Universe is through a forest wilderness. - John Muir",
            "And into the forest I go, to lose my mind and find my soul. - John Muir",
            "Even the darkest night will end and the sun will rise. - Victor Hugo"
        ],
        rounded: [
            "A society grows great when old men plant trees in whose shade they shall never sit. - Greek Proverb",
            "The creation of a thousand forests is in one acorn. - Ralph Waldo Emerson",
            "Adopt the pace of nature: her secret is patience. - Ralph Waldo Emerson"
        ]
    };

    function showShovelDialog(dateKey) {
        const history = JSON.parse(localStorage.getItem('moodHistory')) || {};
        const entry = history[dateKey];
        if (!entry) return;

        const { moodColor, treeType, quote } = entry; 

        const shovelOverlay = document.createElement('div');
        shovelOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #fff; padding: 30px; border-radius: 12px; text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-width: 400px;
            animation: pop 0.4s ease-out forwards;
        `;

        const treeDiv = document.createElement('div');
        treeDiv.className = `calendar-tree type-${treeType}`;
        treeDiv.style.cssText = `
            width: 100px; height: 120px; position: relative; display: inline-flex;
            flex-direction: column; align-items: center; justify-content: flex-end; margin-bottom: 15px;
        `;
        const trunk = document.createElement('div');
        trunk.className = 'trunk';
        trunk.style.cssText = `height: 40px; width: 12px; background-color: #8B4513; border-radius: 4px; position: absolute; bottom: 0;`;
        const leaves = document.createElement('div');
        leaves.className = 'leaves';
        leaves.style.backgroundColor = moodColor;
        leaves.style.position = 'absolute';
        leaves.style.bottom = '40px';

        if (treeType === 'pine') {
            leaves.style.clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';
            leaves.style.width = '80px'; leaves.style.height = '70px';
        } else if (treeType === 'columnar') {
            leaves.style.borderRadius = '10px / 40px';
            leaves.style.width = '40px'; leaves.style.height = '90px';
        } else if (treeType === 'weeping') {
            leaves.style.borderRadius = '50% 50% 40% 40%';
            leaves.style.width = '90px'; leaves.style.height = '60px';
        } else {
            leaves.style.borderRadius = '50%';
            leaves.style.width = '80px'; leaves.style.height = '80px';
        }

        treeDiv.appendChild(trunk);
        treeDiv.appendChild(leaves);

        box.innerHTML = `
            <h3>Your tree has been planted in the calendar!</h3>
            <div id="dialog-tree-container" style="width: 100%; height: 150px; display: flex; justify-content: center; align-items: flex-end; position: relative;"></div>
            <p class="quote" style="font-style: italic; color: #666; max-width: 90%; margin: 15px auto; text-align: center;">"${entry.quote}"</p>
            <button id="confirm-shovel" style="padding: 12px 25px; background-color: #81C784; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; transition: background-color 0.2s;">Great!</button>
        `;
        box.querySelector('#confirm-shovel').onmouseover = function() { this.style.backgroundColor = '#66BB6A'; };
        box.querySelector('#confirm-shovel').onmouseout = function() { this.style.backgroundColor = '#81C784'; };


        box.querySelector('#dialog-tree-container').appendChild(treeDiv);
        shovelOverlay.appendChild(box);
        document.body.appendChild(shovelOverlay);

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `@keyframes pop { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`;
        document.head.appendChild(styleSheet);

        box.querySelector('#confirm-shovel').onclick = () => {
            document.body.removeChild(shovelOverlay);
            document.head.removeChild(styleSheet);
        };
    }

    function showCalendarDayDetailsDialog(dateKey) {
        const history = JSON.parse(localStorage.getItem('moodHistory')) || {};
        const entry = history[dateKey];
        if (!entry) return;

        const { moodName, moodColor, treeType, quote } = entry; 

        const dialogOverlay = document.createElement('div');
        dialogOverlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); z-index: 1000;
            display: flex; align-items: center; justify-content: center;
        `;

        const box = document.createElement('div');
        box.style.cssText = `
            background: #fff; padding: 30px; border-radius: 12px; text-align: center;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3); max-width: 400px;
            animation: pop 0.4s ease-out forwards;
        `;

        const treeDiv = document.createElement('div');
        treeDiv.className = `calendar-tree type-${treeType}`;
        treeDiv.style.cssText = `
            width: 100px; height: 120px; position: relative; display: inline-flex;
            flex-direction: column; align-items: center; justify-content: flex-end; margin-bottom: 15px;
        `;
        const trunk = document.createElement('div');
        trunk.className = 'trunk';
        trunk.style.cssText = `height: 40px; width: 12px; background-color: #8B4513; border-radius: 4px; position: absolute; bottom: 0;`;
        const leaves = document.createElement('div');
        leaves.className = 'leaves';
        leaves.style.backgroundColor = moodColor;
        leaves.style.position = 'absolute';
        leaves.style.bottom = '40px';

        if (treeType === 'pine') {
            leaves.style.clipPath = 'polygon(50% 0%, 100% 100%, 0% 100%)';
            leaves.style.width = '80px'; leaves.style.height = '70px';
        } else if (treeType === 'columnar') {
            leaves.style.borderRadius = '10px / 40px';
            leaves.style.width = '40px'; leaves.style.height = '90px';
        } else if (treeType === 'weeping') {
            leaves.style.borderRadius = '50% 50% 40% 40%';
            leaves.style.width = '90px'; leaves.style.height = '60px';
        } else {
            leaves.style.borderRadius = '50%';
            leaves.style.width = '80px'; leaves.style.height = '80px';
        }

        treeDiv.appendChild(trunk);
        treeDiv.appendChild(leaves);

        const displayDate = new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        box.innerHTML = `
            <h3>Your Day on ${displayDate}</h3>
            <div id="dialog-tree-container" style="width: 100%; height: 150px; display: flex; justify-content: center; align-items: flex-end; position: relative;"></div>
            <p style="font-weight: bold; margin-bottom: 5px;">Mood: <span style="color: ${moodColor};">${moodName}</span></p>
            <p style="font-style: italic; color: #666; margin-top: 5px;">"${quote || 'No quote available.'}"</p>
            <button id="close-dialog" style="padding: 12px 25px; background-color: #81C784; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin-top: 20px; transition: background-color 0.2s;">Close</button>
        `;
        box.querySelector('#close-dialog').onmouseover = function() { this.style.backgroundColor = '#66BB6A'; };
        box.querySelector('#close-dialog').onmouseout = function() { this.style.backgroundColor = '#81C784'; };

        box.querySelector('#dialog-tree-container').appendChild(treeDiv);
        dialogOverlay.appendChild(box);
        document.body.appendChild(dialogOverlay);

        const styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = `@keyframes pop { 0% { transform: scale(0.7); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }`;
        document.head.appendChild(styleSheet);

        box.querySelector('#close-dialog').onclick = () => {
            document.body.removeChild(dialogOverlay);
            document.head.removeChild(styleSheet);
        };
    }


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
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            daySquare.setAttribute('data-date-key', dateKey);
            daySquare.innerHTML = `<span class="day-number">${day}</span>`;

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

                daySquare.addEventListener('click', () => showCalendarDayDetailsDialog(dateKey));
            }
            calendarGrid.appendChild(daySquare);
        }

        if (showDialogOnLoad && dialogDateKey) {
            const dateParts = dialogDateKey.split('-').map(Number);
            if (dateParts[0] === year && (dateParts[1] - 1) === month) {
                 const dayElement = calendarGrid.querySelector(`[data-date-key="${dialogDateKey}"]`);
                 if (dayElement) {
                     showShovelDialog(dialogDateKey);
                     window.history.replaceState({}, document.title, window.location.pathname);
                 }
            }
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
    b = Math.floor(b + (255 - b) * (percent / 100));
    return `rgb(${r},${g},${b})`;
}

function lightenColor(color, percent) {
    let {r, g, b} = hexToRgb(color);
    r = Math.floor(r + (255 - r) * (percent / 100));
    g = Math.floor(g + (255 - g) * (percent / 100));
    b = Math.floor(b + (255 - b) * (percent / 100));
    return `rgb(${r},${g},${b})`;
}

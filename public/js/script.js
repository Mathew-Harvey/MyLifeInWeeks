// Initialize Firebase with config
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Global variables
let eventCounter = 0;
let lifeEvents = [];
let totalWeeksLived = 0;
let birthDate = null;

// Document Ready Handler
$(document).ready(function() {
    $("#floating-div").draggable({ containment: "window" });
    updateLegend();
    updateUserName();
    createWeekLabels();
    createYearLabels(100);

    // Event Listeners
    $('#birthdate').change(calculateAge);
    $('#add-event-btn').click(addEvent);
    $('#accountImg').click(function() {
        var accountMenu = document.getElementById('account-menu');
        accountMenu.style.display = accountMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Auth state observer
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            onUserLoggedIn(user);
        } else {
            handleLoggedOutState();
        }
    });

    toggleAuthMode();
    initializeApp();
});

// Week and Year Labels
function createWeekLabels() {
    const weekLabelsContainer = document.getElementById('week-labels-container');
    weekLabelsContainer.innerHTML = '';
    for (let i = 1; i <= 52; i++) {
        const weekLabel = document.createElement('div');
        weekLabel.classList.add('week-label');
        weekLabel.textContent = i % 4 === 0 ? i : '';
        weekLabelsContainer.appendChild(weekLabel);
    }
}

function createYearLabels(totalYears) {
    const yearsLabelsContainer = document.getElementById('years-labels-container');
    yearsLabelsContainer.innerHTML = '';
    for (let i = 0; i < totalYears; i += 10) {
        const yearLabel = document.createElement('div');
        yearLabel.classList.add('year-label');
        yearLabel.textContent = i;
        yearsLabelsContainer.appendChild(yearLabel);
    }
}

// Week Boxes Creation
function createWeekBoxes(container, totalWeeksLived, totalYears) {
    container.innerHTML = '';
    const weeksPerYear = 52;
    let weeksCounter = 0;
    const today = new Date();
    const currentWeek = Math.ceil((today - birthDate) / (7 * 24 * 60 * 60 * 1000));

    for (let year = 0; year < totalYears; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');

        if (year % 10 === 0) {
            const decadeSpacer = document.createElement('div');
            decadeSpacer.classList.add('decade-spacer');
            yearContainer.appendChild(decadeSpacer);
        }

        for (let week = 0; week < weeksPerYear; week++) {
            if (week % 4 === 0) {
                const monthSpacer = document.createElement('div');
                monthSpacer.classList.add('month-spacer');
                yearContainer.appendChild(monthSpacer);
            }

            const weekBox = document.createElement('div');
            weekBox.classList.add('week-box');
            
            if (weeksCounter < totalWeeksLived) {
                weekBox.classList.add('lived');
            }

            if (weeksCounter === currentWeek) {
                weekBox.classList.add('current-week');
            }

            if (birthDate) {
                lifeEvents.forEach(event => {
                    const eventStartWeek = Math.floor((event.start - birthDate) / (7 * 24 * 60 * 60 * 1000));
                    const eventEndWeek = Math.floor((event.end - birthDate) / (7 * 24 * 60 * 60 * 1000));
                    if (weeksCounter >= eventStartWeek && weeksCounter < eventEndWeek) {
                        weekBox.style.backgroundColor = event.color;
                        weekBox.title = event.name;
                    }
                });
            }
            yearContainer.appendChild(weekBox);
            weeksCounter++;
        }
        container.appendChild(yearContainer);
    }
}

// Age Calculation
function calculateAge() {
    const inputBirthDate = document.getElementById('birthdate').value;
    if (inputBirthDate) {
        birthDate = new Date(inputBirthDate);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        const lastBirthday = new Date(birthDate.getFullYear() + age, birthDate.getMonth(), birthDate.getDate());
        const daysSinceLastBirthday = Math.ceil((today - lastBirthday) / (24 * 60 * 60 * 1000));
        const weeksSinceLastBirthday = Math.ceil(daysSinceLastBirthday / 7);
        totalWeeksLived = age * 52 + weeksSinceLastBirthday;

        if (auth.currentUser) {
            saveBirthDateToDatabase(auth.currentUser.uid, birthDate);
        }

        createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    }
}

// Life Events Management
function addEvent() {
    const eventGroup = $('<div/>', { class: 'event-group' }).appendTo("#floating-div");
    
    // Name and color container
    const nameColorContainer = $('<div/>', { class: 'name-color-container' }).appendTo(eventGroup);
    $('<input/>', {
        type: 'text',
        id: `event-name-${eventCounter}`,
        placeholder: 'Event Name'
    }).appendTo(nameColorContainer);
    $('<input/>', {
        type: 'color',
        id: `event-color-${eventCounter}`
    }).appendTo(nameColorContainer);

    // Date container
    const dateContainer = $('<div/>', { class: 'date-container' }).appendTo(eventGroup);
    $('<input/>', {
        type: 'date',
        class: 'date-picker',
        id: `event-start-${eventCounter}`,
        placeholder: 'From'
    }).appendTo(dateContainer);
    $('<input/>', {
        type: 'date',
        class: 'date-picker',
        id: `event-end-${eventCounter}`,
        placeholder: 'To'
    }).appendTo(dateContainer);

    // Buttons
    $('<button/>', {
        text: 'Save Event',
        class: 'submit-event',
        click: function() { addOrUpdateEvent(eventCounter); }
    }).appendTo(eventGroup);
    $('<button/>', {
        text: 'x',
        class: 'remove-event',
        click: function(e) {
            e.stopPropagation();
            removeEvent('event-' + eventCounter);
        }
    }).appendTo(eventGroup);
}

function addOrUpdateEvent(counter) {
    const name = $(`#event-name-${counter}`).val();
    const startStr = $(`#event-start-${counter}`).val();
    const endStr = $(`#event-end-${counter}`).val();
    const color = $(`#event-color-${counter}`).val();

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start) || isNaN(end)) {
        showError('Invalid event dates. Please enter valid dates.');
        return;
    }

    const eventIndex = lifeEvents.findIndex(e => e.id === `event-${counter}`);
    if (eventIndex !== -1) {
        lifeEvents[eventIndex] = { id: `event-${counter}`, name, start, end, color };
    } else {
        lifeEvents.push({ id: `event-${counter}`, name, start, end, color });
        eventCounter++;
    }

    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    if (auth.currentUser) {
        const firebaseLifeEvents = lifeEvents.map(event => ({
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }));
        saveLifeEventsToDatabase(auth.currentUser.uid, firebaseLifeEvents);
    }

    updateLegend();
    if (eventIndex === -1) {
        eventCounter++;
    }
    updateFloatingDivWithEvents();
}

function removeEvent(eventId) {
    lifeEvents = lifeEvents.filter(event => event.id !== eventId);
    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    updateLegend();
    updateFloatingDivWithEvents();

    if (auth.currentUser) {
        const firebaseLifeEvents = lifeEvents.map(event => ({
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }));
        saveLifeEventsToDatabase(auth.currentUser.uid, firebaseLifeEvents);
    }
}

// Firebase Functions
function saveLifeEventsToDatabase(userId, lifeEvents) {
    database.ref('users/' + userId + '/lifeEvents').set(lifeEvents);
}

function loadLifeEventsFromDatabase(userId) {
    database.ref('users/' + userId + '/lifeEvents').once('value').then((snapshot) => {
        const events = snapshot.val();
        if (events) {
            lifeEvents = events.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end)
            })).filter(event => !isNaN(event.start) && !isNaN(event.end));
            
            eventCounter = lifeEvents.reduce((max, event) => {
                const currentNum = parseInt(event.id.replace('event-', ''));
                return Math.max(max, currentNum);
            }, 0) + 1;
            
            createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
            updateLegend();
            updateFloatingDivWithEvents();
        }
    }).catch(error => {
        console.error('Error loading life events:', error);
    });
}

function saveBirthDateToDatabase(userId, birthDate) {
    database.ref('users/' + userId + '/birthDate').set(birthDate.toISOString());
}

function loadBirthDateFromDatabase(userId) {
    database.ref('users/' + userId + '/birthDate').once('value').then((snapshot) => {
        const birthDateString = snapshot.val();
        if (birthDateString) {
            birthDate = new Date(birthDateString);
            document.getElementById('birthdate').valueAsDate = birthDate;
            calculateAge();
        }
    });
}

// Authentication Functions
function registerUser() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (email && password) {
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                onUserLoggedIn(userCredential.user);
            })
            .catch((error) => {
                showError('Registration failed: ' + error.message);
            });
    } else {
        showError('Please enter both email and password.');
    }
}

window.loginUser = function() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const landingPageDiv = document.getElementById('landing-page');

    if (landingPageDiv) landingPageDiv.style.display = 'none';

    if (email && password) {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                onUserLoggedIn(userCredential.user);
            })
            .catch((error) => {
                showError('Login failed: ' + error.message);
            });
    } else {
        showError('Email or password is missing - please try again');
    }
}

window.logoutUser = function() {
    auth.signOut().then(() => {
        handleLoggedOutState();
    }).catch((error) => {
        showError('Logout failed: ' + error.message);
    });
}

// UI State Management
function onUserLoggedIn(user) {
    const elements = {
        authContainer: document.getElementById('auth-container'),
        logoutButton: document.getElementById('logout-button'),
        navbar: document.getElementById('navbar'),
        registerSection: document.getElementById('register-section'),
        toggleAuthButton: document.getElementById('toggle-auth'),
        accountImg: document.getElementById('accountImg'),
        accountMenu: document.getElementById('account-menu'),
        landingPageImg: document.getElementById('landingPage'),
        signInLink: document.getElementById('signin-link'),
        landingPageDiv: document.getElementById('landing-page'),
        loginSectionDiv: document.getElementById('login-section'),
        floatingDiv: document.getElementById('floating-div'),
        mainContent: document.getElementById('main-content')
    };

    // Update UI elements visibility
    Object.entries({
        authContainer: 'none',
        logoutButton: 'block',
        navbar: 'flex',
        registerSection: 'none',
        toggleAuthButton: 'none',
        signInLink: 'none',
        accountImg: 'block',
        accountMenu: 'none',
        landingPageImg: 'none',
        landingPageDiv: 'none',
        loginSectionDiv: 'none',
        mainContent: 'block'
    }).forEach(([elementKey, displayValue]) => {
        if (elements[elementKey]) {
            elements[elementKey].style.display = displayValue;
        }
    });

    clearUserData();
    loadLifeEventsFromDatabase(user.uid);
    loadBirthDateFromDatabase(user.uid);

    updateLegend();
    updateUserName();
    createWeekLabels();
    createYearLabels(100);
}

function handleLoggedOutState() {
    const elements = {
        mainContent: document.getElementById('main-content'),
        navbar: document.getElementById('navbar'),
        navbarUserInfo: document.getElementById('user-info'),
        authContainer: document.getElementById('auth-container'),
        loginSection: document.getElementById('login-section'),
        registerSection: document.getElementById('register-section'),
        toggleAuth: document.getElementById('toggle-auth'),
        logoutButton: document.getElementById('logout-button'),
        loginContainer: document.getElementById('login-container'),
        signInLink: document.getElementById('signin-link'),
        accountImg: document.getElementById('accountImg'),
        accountMenu: document.getElementById('account-menu'),
        landingPage: document.getElementById('landingPage'),
        landingPageDiv: document.getElementById('landing-page')
    };

    // Update UI elements visibility
    Object.entries({
        mainContent: 'none',
        navbar: 'none',
        loginSection: 'block',
        registerSection: 'none',
        logoutButton: 'none',
        signInLink: 'none',
        accountImg: 'block',
        accountMenu: 'none',
        landingPage: 'flex',
        landingPageDiv: 'flex'
    }).forEach(([elementKey, displayValue]) => {
        if (elements[elementKey]) {
            elements[elementKey].style.display = displayValue;
        }
    });

    if (elements.landingPageDiv) {
        elements.landingPageDiv.style.flexDirection = 'row-reverse';
        elements.landingPageDiv.style.alignItems = 'center';
        elements.landingPageDiv.style.justifyContent = 'center';
    }

    if (elements.navbarUserInfo) {
        elements.navbarUserInfo.innerHTML = '';
    }

    lifeEvents = [];
    updateLegend();
    updateUserName();
    clearUserData();
}

// Helper Functions
function clearUserData() {
    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        birthdateInput.value = '';
    }

    lifeEvents = [];
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = '';
    }
    
    updateLegend();
}

function updateLegend() {
    const legendContainer = document.getElementById('events-legend');
    if (!legendContainer) return;
    
    legendContainer.innerHTML = '';
    lifeEvents.forEach(event => {
        const legendItem = document.createElement('div');
        legendItem.classList.add('event-legend-item');

        const colorIndicator = document.createElement('div');
        colorIndicator.classList.add('event-color-indicator');
        colorIndicator.style.backgroundColor = event.color;

        const eventName = document.createElement('span');
        eventName.classList.add('event-name');
        eventName.textContent = event.name;

        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(eventName);
        legendContainer.appendChild(legendItem);
    });
}

function updateUserName() {
    const user = firebase.auth().currentUser;
    if (user) {
        const email = user.email;
        const userName = email.substring(0, email.lastIndexOf("@"));
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

function toggleAuthMode() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    
    if (registerSection.style.display === 'none') {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
    } else {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
    }
}

function showError(message) {
    let errorContainer = document.getElementById('error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-message';
        errorContainer.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: red;
            color: white;
            padding: 10px;
            border-radius: 5px;
            z-index: 1000;
            display: none;
        `;
        document.body.appendChild(errorContainer);
    }
    
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 3000);
}

// Image Download Function
window.downloadImage = function() {
    const content = document.getElementById('main-content');
    const clarityScaleFactor = window.devicePixelRatio || 4;
    const originalWidth = content.style.width;
    content.style.width = '1000px';
    
    const yearTextLabel = document.getElementById('year-text-label');
    const originalTransform = yearTextLabel.style.transform;
    yearTextLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
    
    html2canvas(content, {
        scale: clarityScaleFactor,
        useCORS: true
    }).then(canvas => {
        if (canvas) {
            const link = document.createElement('a');
            link.download = 'my-life-in-weeks.png';
            link.href = canvas.toDataURL('image/png', 1.0);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }).catch(error => {
        content.style.width = originalWidth;
        showError('Error generating image: ' + error.message);
    });
    
    yearTextLabel.style.transform = originalTransform;
}

// Life Events Toggle
window.toggleLifeEvent = function() {
    const floatingDiv = document.getElementById('floating-div');
    floatingDiv.style.display = floatingDiv.style.display === 'none' ? 'block' : 'none';
}

// Initialize the app
function initializeApp() {
    const chartContainer = document.getElementById('chart-container');
    createEmptyWeekBoxes(chartContainer, 90);
}

function createEmptyWeekBoxes(container, totalYears) {
    container.innerHTML = '';
    const weeksPerYear = 52;
    for (let year = 0; year < totalYears; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');
        for (let week = 0; week < weeksPerYear; week++) {
            const weekBox = document.createElement('div');
            weekBox.classList.add('week-box', 'unlived');
            yearContainer.appendChild(weekBox);
        }
        container.appendChild(yearContainer);
    }
}

function updateFloatingDivWithEvents() {
    $('#floating-div').empty();
    
    // Add title
    $('<h3>Life Events</h3>').appendTo('#floating-div');
    
    lifeEvents.forEach(event => {
        const eventGroup = $('<div/>', {
            class: 'event-group',
            id: event.id
        }).appendTo("#floating-div");

        // Name and color container
        const nameColorContainer = $('<div/>', {
            class: 'name-color-container'
        }).appendTo(eventGroup);

        $('<input/>', {
            type: 'text',
            value: event.name,
            readonly: true
        }).appendTo(nameColorContainer);

        $('<input/>', {
            type: 'color',
            value: event.color,
            readonly: true
        }).appendTo(nameColorContainer);

        // Date container
        const dateContainer = $('<div/>', {
            class: 'date-container'
        }).appendTo(eventGroup);

        $('<input/>', {
            type: 'date',
            class: 'date-picker',
            value: formatDate(event.start),
            readonly: true
        }).appendTo(dateContainer);

        $('<input/>', {
            type: 'date',
            class: 'date-picker',
            value: formatDate(event.end),
            readonly: true
        }).appendTo(dateContainer);

        // Delete button
        $('<button/>', {
            text: 'x',
            class: 'remove-event',
            'data-event-id': event.id
        }).appendTo(eventGroup);
    });

    attachDeleteEventListeners();
    addAddEventButton();
}

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function attachDeleteEventListeners() {
    $('.remove-event').off('click').on('click', function(e) {
        e.stopPropagation();
        const eventId = $(this).data('event-id');
        removeEvent(eventId);
    });
}

function addAddEventButton() {
    $('<div/>', {
        id: 'add-event-btn',
        title: 'Add life event',
        text: '+',
        click: addEvent
    }).appendTo('#floating-div');
}
// Initialize Firebase
let auth;
let database;
let isInitialAuthCheck = true;

// Global variables
let eventCounter = 0;
let lifeEvents = [];
let totalWeeksLived = 0;
let birthDate = null;

// Update the initializeAuthObserver function
function initializeAuthObserver() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in
            onUserLoggedIn(user);
        } else {
            // Only handle logout state if it's not the initial check
            if (!isInitialAuthCheck) {
                handleLoggedOutState();
            }
        }
        // Set initial check to false after first run
        isInitialAuthCheck = false;
    });
}

document.addEventListener('DOMContentLoaded', function () {
    try {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        database = firebase.database();

        // Set persistence to LOCAL
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                // Initialize auth observer after setting persistence
                initializeAuthObserver();
            })
            .catch((error) => {
                console.error('Persistence error:', error);
            });

        // Initialize UI components
        if ($("#floating-div").length) {
            $("#floating-div").draggable({ containment: "window" });
        }

        // Set up event listeners
        setupEventListeners();

        // Set up account menu
        setupAccountMenu();

        // Initialize the empty chart
        initializeApp();
    } catch (error) {
        console.error('Firebase initialization error:', error);
        showError('Failed to initialize application. Please try again later.');
    }
});

// Event Listeners Setup
function setupEventListeners() {
    // Auth form submissions
    document.getElementById('login-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        loginUser();
    });

    document.getElementById('register-form')?.addEventListener('submit', function (e) {
        e.preventDefault();
        registerUser();
    });

    // Other UI events
    document.getElementById('birthdate')?.addEventListener('change', calculateAge);
    document.getElementById('add-event-btn')?.addEventListener('click', addEvent);
    document.getElementById('toggle-life-events')?.addEventListener('click', toggleLifeEvent);

}

// Update your setupAccountMenu function
function setupAccountMenu() {
    const accountImg = document.getElementById('accountImg');
    const accountMenu = document.getElementById('account-menu');

    if (!accountImg || !accountMenu) {
        console.error('Account menu elements not found');
        return;
    }

    // Toggle menu on click
    accountImg.addEventListener('click', function (e) {
        e.stopPropagation();
        const isVisible = accountMenu.style.display === 'block';
        accountMenu.style.display = isVisible ? 'none' : 'block';
        console.log('Menu visibility:', !isVisible);
    });

    // Close menu when clicking outside - MOVE THIS INSIDE setupAccountMenu
    document.addEventListener('click', function (e) {
        if (accountMenu && !accountMenu.contains(e.target) && e.target !== accountImg) {
            accountMenu.style.display = 'none';
        }
    });
}



// Auth State Observer
function initializeAuthObserver() {
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            // User is signed in
            onUserLoggedIn(user);
        } else {
            // Only handle logout state if it's not the initial check
            if (!isInitialAuthCheck) {
                handleLoggedOutState();
            }
        }
        // Set initial check to false after first run
        isInitialAuthCheck = false;
    });
}
// Authentication Functions
function toggleAuthMode(mode) {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const signinLink = document.getElementById('signin-link');

    if (!loginSection || !registerSection) return;

    if (!mode) {
        // Toggle between modes
        const isLogin = loginSection.style.display === 'none';
        loginSection.style.display = isLogin ? 'block' : 'none';
        registerSection.style.display = isLogin ? 'none' : 'block';

        // Update signin link text
        if (signinLink) {
            signinLink.textContent = isLogin ? 'Register' : 'Sign in';
        }
    } else {
        // Set specific mode
        loginSection.style.display = mode === 'login' ? 'block' : 'none';
        registerSection.style.display = mode === 'login' ? 'none' : 'block';

        // Update signin link text based on mode
        if (signinLink) {
            signinLink.textContent = mode === 'login' ? 'Sign in' : 'Register';
        }
    }
}
// Also update the login function with better error handling
// Update the loginUser function
function loginUser() {
    const email = document.getElementById('login-email')?.value;
    const password = document.getElementById('login-password')?.value;

    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('#login-form button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
    }

    // Set persistence before signing in
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            return auth.signInWithEmailAndPassword(email, password);
        })
        .then((userCredential) => {
            // Login successful
            document.getElementById('landing-page').style.display = 'none';
            document.getElementById('main-content').style.display = 'block';
            document.getElementById('account-container').style.display = 'flex';
            onUserLoggedIn(userCredential.user);
        })
        .catch((error) => {
            let errorMessage = 'Login failed: ';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address';
                    break;
                case 'auth/user-disabled':
                    errorMessage += 'This account has been disabled';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage += 'Invalid email or password';
                    break;
                default:
                    errorMessage += error.message;
            }
            showError(errorMessage);
        })
        .finally(() => {
            // Reset button state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        });
}
function registerUser() {
    const email = document.getElementById('register-email')?.value;
    const password = document.getElementById('register-password')?.value;

    // Input validation
    if (!email || !password) {
        showError('Please enter both email and password');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    // Password validation
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    // Show loading state
    const submitButton = document.querySelector('#register-form button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Initialize user data first
            return initializeUserData(userCredential.user).then(() => {
                // Then proceed with UI updates
                document.getElementById('landing-page').style.display = 'none';
                document.getElementById('main-content').style.display = 'block';
                onUserLoggedIn(userCredential.user);
            });
        })
        .catch((error) => {
            let errorMessage = 'Registration failed: ';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage += 'This email is already registered';
                    break;
                case 'auth/invalid-email':
                    errorMessage += 'Invalid email address';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage += 'Email/password accounts are not enabled';
                    break;
                case 'auth/weak-password':
                    errorMessage += 'Password is too weak. Must be at least 6 characters';
                    break;
                default:
                    errorMessage += error.message;
            }
            showError(errorMessage);
        })
        .finally(() => {
            // Reset button state
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Register';
            }
        });
}

// Update the logoutUser function
function logoutUser() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to log out?')) {
        auth.signOut().then(() => {
            // Clear any cached data
            clearUserData();

            // Reset UI state
            handleLoggedOutState();
        }).catch((error) => {
            showError('Logout failed: ' + error.message);
        });
    }
}

// Add this new function to handle auth text updates
function updateAuthText(isLoggedIn) {
    const authLinks = document.querySelectorAll('[data-auth-text]');
    authLinks.forEach(link => {
        if (isLoggedIn) {
            if (link.dataset.authText === 'login') {
                link.style.display = 'none';
            } else if (link.dataset.authText === 'logout') {
                link.style.display = 'block';
            }
        } else {
            if (link.dataset.authText === 'login') {
                link.style.display = 'block';
            } else if (link.dataset.authText === 'logout') {
                link.style.display = 'none';
            }
        }
    });
}
// UI State Management
function onUserLoggedIn(user) {
    // Update UI visibility
    document.getElementById('landing-page').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('account-container').style.display = 'flex';

    // Hide signin link and show account menu
    const signinLink = document.getElementById('signin-link');
    if (signinLink) {
        signinLink.style.display = 'none';
    }
    // Update all auth-related text
    updateAuthText(true);

    // Clear and load user data
    clearUserData();
    loadLifeEventsFromDatabase(user.uid);
    loadBirthDateFromDatabase(user.uid);

    // Update UI components
    updateLegend();
    updateUserName();
    createWeekLabels();
    createYearLabels(100);
}

function handleLoggedOutState() {
    // Reset UI to initial state
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('landing-page').style.display = 'flex';
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('account-container').style.display = 'none';

    // Show signin link
    const signinLink = document.getElementById('signin-link');
    if (signinLink) {
        signinLink.style.display = 'block';
    }
    // Update all auth-related text
    updateAuthText(false);

    // Clear user data
    clearUserData();
    lifeEvents = [];
    updateLegend();
}
// Firebase Data Functions

function initializeUserData(user) {
    if (!user) return;

    const userData = {
        email: user.email,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
        updatedAt: firebase.database.ServerValue.TIMESTAMP,
        lifeEvents: [],
        birthDate: null
    };

    return database.ref('users/' + user.uid).update(userData)
        .catch(error => {
            console.error('Error initializing user data:', error);
            showError('Failed to initialize user data. Please try again.');
        });
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

// Update the saveLifeEventsToDatabase function
function saveLifeEventsToDatabase(userId, events) {
    if (!userId || !events) return;

    const firebaseEvents = events.map(event => {
        // Ensure dates are proper Date objects before conversion
        const startDate = event.start instanceof Date ? event.start : new Date(event.start);
        const endDate = event.end instanceof Date ? event.end : new Date(event.end);

        // Check if dates are valid before converting
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Invalid date found:', event);
            throw new Error('Invalid date in event');
        }

        return {
            ...event,
            start: startDate.toISOString(),
            end: endDate.toISOString()
        };
    });

    return database.ref('users/' + userId).update({
        lifeEvents: firebaseEvents,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch(error => {
        console.error('Error saving life events:', error);
        showError('Failed to save life events. Please try again.');
    });
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

function saveBirthDateToDatabase(userId, date) {
    if (!userId || !date) return;

    return database.ref('users/' + userId).update({
        birthDate: date.toISOString(),
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch(error => {
        console.error('Error saving birthdate:', error);
        showError('Failed to save birth date. Please try again.');
    });
}

// Week Labels and Chart Creation
function createWeekLabels() {
    const weekLabelsContainer = document.getElementById('week-labels-container');
    if (!weekLabelsContainer) return;

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
    if (!yearsLabelsContainer) return;

    yearsLabelsContainer.innerHTML = '';
    for (let i = 0; i < totalYears; i++) {
        // Only add a label every 10 years
        if (i % 10 === 0) {
            const yearLabel = document.createElement('div');
            yearLabel.classList.add('year-label');
            yearLabel.textContent = i;
            yearsLabelsContainer.appendChild(yearLabel);
        } else {
            // Add empty spacers to maintain alignment
            const spacer = document.createElement('div');
            spacer.classList.add('year-label-spacer');
            yearsLabelsContainer.appendChild(spacer);
        }
    }
}

function createWeekBoxes(container, totalWeeksLived, totalYears) {
    if (!container) return;

    container.innerHTML = '';
    const weeksPerYear = 52;
    let weeksCounter = 0;
    const today = new Date();
    const currentWeek = birthDate ? Math.ceil((today - birthDate) / (7 * 24 * 60 * 60 * 1000)) : 0;

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
    const birthdateInput = document.getElementById('birthdate');
    const inputBirthDate = birthdateInput?.value;

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
        click: function () { addOrUpdateEvent(eventCounter); }
    }).appendTo(eventGroup);
    $('<button/>', {
        text: 'x',
        class: 'remove-event',
        click: function (e) {
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

    if (!name || !startStr || !endStr) {
        showError('Please fill in all event details');
        return;
    }

    try {
        const start = new Date(startStr);
        const end = new Date(endStr);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            showError('Invalid event dates. Please enter valid dates.');
            return;
        }

        const eventIndex = lifeEvents.findIndex(e => e.id === `event-${counter}`);
        if (eventIndex !== -1) {
            lifeEvents[eventIndex] = { id: `event-${counter}`, name, start, end, color };
        } else {
            lifeEvents.push({ id: `event-${counter}`, name, start, end, color });
        }

        // Update UI
        createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);

        // Save to Firebase if user is authenticated
        if (auth.currentUser) {
            saveLifeEventsToDatabase(auth.currentUser.uid, lifeEvents)
                .then(() => {
                    updateLegend();
                    if (eventIndex === -1) eventCounter++;
                    updateFloatingDivWithEvents();
                })
                .catch(error => {
                    console.error('Error saving event:', error);
                    showError('Failed to save event. Please try again.');
                });
        }
    } catch (error) {
        console.error('Error processing event:', error);
        showError('Failed to process event. Please check your inputs and try again.');
    }
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
            'data-event-id': event.id,
            click: function (e) {
                e.stopPropagation();
                removeEvent($(this).data('event-id'));
            }
        }).appendTo(eventGroup);
    });

    // Add the "Add Event" button
    $('<div/>', {
        id: 'add-event-btn',
        title: 'Add life event',
        text: '+',
        click: addEvent
    }).appendTo('#floating-div');
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
    const user = auth.currentUser;
    if (user) {
        const email = user.email;
        const userName = email ? email.substring(0, email.lastIndexOf("@")) : 'User';
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = userName;
        }
    }
}

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

// Helper Functions
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
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
            background-color: #ff3b30;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 1000;
            display: none;
            font-size: 14px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            max-width: 80%;
            text-align: center;
            animation: fadeIn 0.3s ease-in-out;
        `;
        document.body.appendChild(errorContainer);
    }

    errorContainer.textContent = message;
    errorContainer.style.display = 'block';

    setTimeout(() => {
        errorContainer.style.opacity = '0';
        setTimeout(() => {
            errorContainer.style.display = 'none';
            errorContainer.style.opacity = '1';
        }, 300);
    }, 3000);
}
// Image Download Function
function downloadImage() {
    const content = document.getElementById('main-content');
    if (!content) return;

    const clarityScaleFactor = window.devicePixelRatio || 4;
    const originalWidth = content.style.width;
    content.style.width = '1000px';

    const yearTextLabel = document.getElementById('year-text-label');
    const originalTransform = yearTextLabel?.style.transform;
    if (yearTextLabel) {
        yearTextLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
    }

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
    }).finally(() => {
        if (yearTextLabel && originalTransform) {
            yearTextLabel.style.transform = originalTransform;
        }
        content.style.width = originalWidth;
    });
}

// Toggle Life Events Panel
function toggleLifeEvent() {
    const floatingDiv = document.getElementById('floating-div');
    if (floatingDiv) {
        floatingDiv.style.display = floatingDiv.style.display === 'none' ? 'block' : 'none';
    }
}

// Initialize empty week boxes
function createEmptyWeekBoxes(container, totalYears) {
    if (!container) return;

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

// Initialize the app
function initializeApp() {
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        createEmptyWeekBoxes(chartContainer, 90);
    }
}
// Make ALL functions available globally that are called from HTML
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.toggleAuthMode = toggleAuthMode;
window.downloadImage = downloadImage;
window.toggleLifeEvent = toggleLifeEvent;
window.calculateAge = calculateAge;
window.addEvent = addEvent;
window.showLogin = toggleAuthMode; // Add this for the sign-in link

// Add missing CSS keyframe animation
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translate(-50%, 20px);
    }
    to {
        opacity: 1;
        transform: translate(-50%, 0);
    }
}
`;
document.head.appendChild(style);
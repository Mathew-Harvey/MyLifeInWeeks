firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();

const database = firebase.database();

let eventCounter = 0;
let lifeEvents = [];
let totalWeeksLived = 0;
let birthDate = null;

$(document).ready(function() {
    // Initialize draggable feature for floating div
    $("#floating-div").draggable({ containment: "window" });

    // Set up any initial states
    updateLegend();
    updateUserName();
    
    // Set up your week and year labels
    createWeekLabels();
    createYearLabels(100);

    // Event handlers
    $('#login-action').click(loginUser); // Button to log in
    $('#register-action').click(registerUser); // Button to register
    $('#login-button').click(loginUser);
    $('#logout-button').click(logoutUser);
    $('#toggle-auth').click(toggleAuthMode);
    $('#birthdate').change(calculateAge);
    $('#add-event-btn').click(addEvent);
    $('#accountImg').click(toggleAccountMenu);

    // Check auth state on page load
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            onUserLoggedIn(user);
        } else {
            handleLoggedOutState();
        }
    });

    // Call this function to set the initial auth mode
    toggleAuthMode();

    // Make sure all DOM-related initializations are done
    initializeApp();
});
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

function createWeekBoxes(container, totalWeeksLived, totalYears) {
    container.innerHTML = '';
    const weeksPerYear = 52;
    let weeksCounter = 0;
    const today = new Date();
    const currentWeek = Math.ceil((today - birthDate) / (7 * 24 * 60 * 60 * 1000));

    for (let year = 0; year < totalYears; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');

        // Decade spacer (if applicable)
        if (year % 10 === 0) {
            const decadeSpacer = document.createElement('div');
            decadeSpacer.classList.add('decade-spacer');
            yearContainer.appendChild(decadeSpacer);
        }

        for (let week = 0; week < weeksPerYear; week++) {
            // Month spacer (if applicable)
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
                weekBox.classList.add('current-week'); // Add a class for current week styling
            }

            // Life events coloring
            if (birthDate) {
                lifeEvents.forEach(event => {
                    const eventStartWeek = Math.floor((event.start.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    const eventEndWeek = Math.floor((event.end.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
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




document.addEventListener('DOMContentLoaded', function () {
    toggleAuthMode();
    initializeApp();
    updateLegend();
    updateUserName();
    createWeekLabels();
    createYearLabels(100);
    document.getElementById('login-action').addEventListener('click', loginUser); // Button to log in
    document.getElementById('register-action').addEventListener('click', registerUser); // Button to register
    document.getElementById('login-button').addEventListener('click', loginUser);
    document.getElementById('logout-button').addEventListener('click', logoutUser);
    document.getElementById('toggle-auth').addEventListener('click', toggleAuthMode);

    // Check auth state on page load
    firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
            onUserLoggedIn(user);
        } else {
            handleLoggedOutState();
        }
    });
});




function addOrUpdateEvent(counter) {
    const name = $('#event-name-' + counter).val();
    const startStr = $('#event-start-' + counter).val();
    const endStr = $('#event-end-' + counter).val();
    const color = $('#event-color-' + counter).val();

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid event date:', { startStr, endStr });
        alert('Invalid event dates. Please enter valid dates.');
        return;
    }
    console.log('Start Date:', start.toISOString()); // Debugging
    console.log('End Date:', end.toISOString());   // Debugging
    const eventIndex = lifeEvents.findIndex(e => e.id === 'event-' + counter);
    if (eventIndex !== -1) {
        // Update existing event
        lifeEvents[eventIndex] = { id: 'event-' + counter, name, start, end, color };
    } else {
        // Add new event
        lifeEvents.push({ id: 'event-' + counter, name, start, end, color });
        eventCounter++;
    }

    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    if (auth.currentUser) {
        const firebaseLifeEvents = lifeEvents.map(event => {
            // Ensure that both start and end dates are valid before converting to ISO string
            if (isValidDate(event.start) && isValidDate(event.end)) {
                return {
                    ...event,
                    start: event.start.toISOString(),
                    end: event.end.toISOString()
                };
            } else {
                console.error('Invalid event date:', event);
                return event; // Return the original event if dates are invalid
            }
        });
        saveLifeEventsToDatabase(auth.currentUser.uid, firebaseLifeEvents);
    }
    console.log("Updated life events:", lifeEvents);

    updateLegend();
    if (eventIndex === -1) {
        eventCounter++;
    }
    updateFloatingDivWithEvents();

}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}

function createCompactEventView(event, counter) {
    const compactView = $('<div/>', {
        class: 'compact-event',
        click: () => toggleEventView(counter),
        mouseenter: function () { $(this).addClass('highlight'); },
        mouseleave: function () { $(this).removeClass('highlight'); }
    });

    compactView.append($('<span/>', { text: event.name + ': ' }));
    compactView.append($('<span/>', { text: formatDate(event.start) + ' - ' + formatDate(event.end), class: 'event-dates' }));

    compactView.append($('<span/>', {
        class: 'color-indicator',
        css: { 'background-color': event.color }
    }));

    compactView.append($('<button/>', {
        text: 'x',
        class: 'remove-event',
        click: function (e) {
            e.stopPropagation();
            removeEvent(counter);
        }
    }));

    return compactView;
}

// function toggleEventView(counter) {
//     const detailView = $('#event-details-' + counter);
//     const compactView = $('#compact-event-' + counter);

//     if (detailView.is(':visible')) {
//         detailView.hide();
//         compactView.show();
//     } else {
//         compactView.hide();
//         detailView.show();
//     }
// }

function removeEvent(eventId) {
    // Remove event from the lifeEvents array
    lifeEvents = lifeEvents.filter(event => event.id !== eventId);

    // Update the grid, legend, and floating div
    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    updateLegend();
    updateFloatingDivWithEvents();


    // Save updated life events to database
    if (auth.currentUser) {
        const firebaseLifeEvents = lifeEvents.map(event => ({
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }));
        saveLifeEventsToDatabase(auth.currentUser.uid, firebaseLifeEvents);
    }

    console.log("Life events after removal:", lifeEvents);
}



function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function createEventLabels(container, lifeEvents, birthDate) {

    lifeEvents.forEach(event => {
        const eventStartWeek = Math.floor((event.start.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const eventEndWeek = Math.floor((event.end.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const eventMidWeek = eventStartWeek + (eventEndWeek - eventStartWeek) / 2;
        const yearPosition = Math.floor(eventMidWeek / 52);
        const weekPosition = eventMidWeek % 52;

        const x1 = weekPosition * (weekBoxWidth + weekBoxMargin) + weekBoxWidth / 2;
        const y1 = yearPosition * (weekBoxHeight + weekBoxMargin) + weekBoxHeight / 2;

        const x2 = x1 < container.offsetWidth / 2 ? 0 : container.offsetWidth;
        const y2 = y1;

        svg.append("line")
            .attr("x1", x1)
            .attr("y1", y1)
            .attr("x2", x2)
            .attr("y2", y2)
            .attr("stroke", event.color)
            .attr("stroke-width", 2);

        svg.append("text")
            .attr("x", x2 + (x1 < container.offsetWidth / 2 ? -5 : 5))
            .attr("y", y2)
            .attr("dy", "0.35em")
            .attr("text-anchor", x1 < container.offsetWidth / 2 ? "end" : "start")
            .text(event.name)
            .style("font-size", "12px");
    });
}

createEventLabels(document.getElementById('chart-container'), lifeEvents, birthDate);

function showError(message) {
    // Create the error message container if it doesn't exist
    let errorContainer = document.getElementById('error-message');
    if (!errorContainer) {
        errorContainer = document.createElement('div');
        errorContainer.id = 'error-message';
        errorContainer.style.position = 'fixed';
        errorContainer.style.bottom = '20px';
        errorContainer.style.left = '50%';
        errorContainer.style.transform = 'translateX(-50%)';
        errorContainer.style.backgroundColor = 'red';
        errorContainer.style.color = 'white';
        errorContainer.style.padding = '10px';
        errorContainer.style.borderRadius = '5px';
        errorContainer.style.zIndex = '1000';
        errorContainer.style.display = 'none';
        document.body.appendChild(errorContainer);
    }
    
    // Show the error message
    errorContainer.textContent = message;
    errorContainer.style.display = 'block';
    
    // Hide the message after 3 seconds
    setTimeout(() => {
        errorContainer.style.display = 'none';
    }, 3000);
}

function toggleAuthMode() {
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const toggleAuthButtonText = document.getElementById('toggle-auth-text'); // Assume this is a span or div inside the button
    const loginContainer = document.getElementById('login-container');
    const registerButton = document.getElementById('register-action'); // Button to actually register a user

    if (registerSection.style.display === 'none') {
        loginSection.style.display = 'none';
        registerSection.style.display = 'block';
        toggleAuthButtonText.textContent = 'Login'; // Change the text to 'Login'
        loginContainer.querySelector('h2').textContent = 'Register'; // Change the heading to 'Register'
        registerButton.style.display = 'block'; // Show the actual register button
    } else {
        loginSection.style.display = 'block';
        registerSection.style.display = 'none';
        loginContainer.querySelector('h2').textContent = 'Login'; // Change the heading to 'Login'
        registerButton.style.display = 'none'; // Hide the actual register button
    }
}

function registerUser() {
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    if (email && password) {
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User registered:', userCredential.user);
                toggleAuthMode();
            })
            .catch((error) => {
                console.error('Registration failed:', error.message);
            });
    } else {
        console.error('Please enter both email and password.');
    }
}

function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (email && password) {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User logged in:', userCredential.user);
                onUserLoggedIn(userCredential.user);
            })
            .catch((error) => {
                alert('Login failed:', error.message);
            });
    } else {
        console.error('Email or password is missing');
    }
    updateLegend();
    updateUserName();
    const landingPageDiv = document.getElementById('landing-page');
    if (landingPageDiv) {
        landingPageDiv.style.display = 'none';
    }
}


function logoutUser() {
    auth.signOut().then(() => {
        console.log('User logged out');
        handleLoggedOutState();
    }).catch((error) => {
        console.error('Logout failed:', error.message);
    });
}


//account menu

document.getElementById('accountImg').addEventListener('click', function() {
    console.log('clicked');
    var accountMenu = document.getElementById('account-menu');
    accountMenu.style.display = accountMenu.style.display === 'block' ? 'none' : 'block';
});

function clearUserData() {
    // Clear the birthdate input
    const birthdateInput = document.getElementById('birthdate');
    if (birthdateInput) {
        birthdateInput.value = '';
    }

    // Clear the life events data
    lifeEvents = [];
    const chartContainer = document.getElementById('chart-container');
    if (chartContainer) {
        chartContainer.innerHTML = '';
    }
    
    // Clear the events legend
    updateLegend();
}

function handleLoggedOutState() {

    const mainContent = document.getElementById('main-content');
    const navbar = document.getElementById('navbar');
    const navbarUserInfo = document.getElementById('user-info');
    const authContainer = document.getElementById('auth-container');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const toggleAuth = document.getElementById('toggle-auth');
    const logoutButton = document.getElementById('logout-button');
    const loginContainer = document.getElementById('login-container');
    const signInLink = document.getElementById('signin-link');
    const accountImg = document.getElementById('accountImg');
    const accountMenu = document.getElementById('account-menu');
    const landingPageImg = document.getElementById('landingPage');
    const landingPageDiv = document.getElementById('landing-page');

    if (navbarUserInfo) navbarUserInfo.innerHTML = '';
    if (loginContainer) loginContainer.style.display = 'flex';
    if (authContainer) authContainer.style.display = 'block';
    if (loginSection) loginSection.style.display = 'block';
    if (registerSection) registerSection.style.display = 'none';
    if (logoutButton) logoutButton.style.display = 'none';
    if (signInLink) signInLink.style.display = 'none';
    if (accountImg) accountImg.style.display = 'block';
    if (mainContent) mainContent.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (accountMenu) accountMenu.style.display = 'none';
    if (landingPageImg) landingPageImg.style.display = 'block';
    if (landingPageDiv) landingPageDiv.style.display = 'flex';
    
    

    lifeEvents = [];
    updateLegend();
    updateUserName();
    clearUserData();
}

auth.onAuthStateChanged((user) => {
    if (user) {
        onUserLoggedIn(user);
        loadBirthDateFromDatabase(user.uid);
        loadLifeEventsFromDatabase(user.uid);
        switchToLoggedInState(user);
    } else {
        handleLoggedOutState();
    }
});

function switchToLoggedInState(user) {
    $('#login-container').hide();
    $('#main-content').show();
    $('#auth-header').hide();
    $('#navbar').show();
    // Populate auth-header with user info and logout button
}




function onUserLoggedIn(user) {

    const authContainer = document.getElementById('auth-container');
    if (authContainer) authContainer.style.display = 'none';

    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) logoutButton.style.display = 'block';

    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.display = 'flex';

    const toggleAuthButton = document.getElementById('toggle-auth');
    if (toggleAuthButton) toggleAuthButton.style.display = 'none';

    const registerSection = document.getElementById('register-section');
    if (registerSection) registerSection.style.display = 'none';

    const signInLink = document.getElementById('signin-link');
    if (signInLink) signInLink.style.display = 'none';

    const accountImg = document.getElementById('accountImg');
    if (accountImg) accountImg.style.display = 'block';

    const accountMenu = document.getElementById('account-menu');
    if (accountMenu) accountMenu.style.display = 'none';

    const landingPageImg = document.getElementById('landingPage');
    if (landingPageImg) landingPageImg.style.display = 'none';

    var floatingDiv = document.getElementById('floating-div');
    if (floatingDiv) {
        floatingDiv.style.display = 'none';
    }


    clearUserData()
    // Load data from Firebase
    loadLifeEventsFromDatabase(user.uid);
    loadBirthDateFromDatabase(user.uid);

    // Update UI
    updateLegend();
    updateUserName();
    createWeekLabels();
    createYearLabels(100);
}



$('#login-button').click(() => {
    const email = $('#login-email').val();
    const password = $('#login-password').val();
    if (email && password) {
        loginUser(email, password);
    } else {
        console.error('Email or password is missing');
    }
});

// $('#register-button').click(() => {
//     const email = $('#register-email').val();
//     const password = $('#register-password').val();
//     registerUser(email, password);
// });

$('#logout-button').click(logoutUser);

function saveLifeEventsToDatabase(userId, lifeEvents) {
    database.ref('users/' + userId + '/lifeEvents').set(lifeEvents);
}

function loadLifeEventsFromDatabase(userId) {
    database.ref('users/' + userId + '/lifeEvents').once('value').then((snapshot) => {
        const events = snapshot.val();
        if (events) {
            lifeEvents = events.map(event => {
                if (isValidDateString(event.start) && isValidDateString(event.end)) {
                    return {
                        ...event,
                        start: new Date(event.start),
                        end: new Date(event.end)
                    };
                } else {
                    console.error('Invalid event date:', event);
                    return null; // or handle it differently
                }
            }).filter(event => event != null); // Remove invalid events
            eventCounter = lifeEvents.reduce((max, event) => Math.max(max, parseInt(event.id.replace('event-', ''))), 0) + 1;
            createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
            updateLegend();
            updateFloatingDivWithEvents();
        }
    }).catch(error => {
        console.error('Error loading life events:', error);
    });
}

function isValidDateString(dateStr) {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
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
function addEvent() {
    const eventNameId = 'event-name-' + eventCounter;
    const eventStartId = 'event-start-' + eventCounter;
    const eventEndId = 'event-end-' + eventCounter;
    const eventColorId = 'event-color-' + eventCounter;

    const eventGroup = $('<div/>', { class: 'event-group' }).appendTo("#floating-div");

    // Name and color container
    const nameColorContainer = $('<div/>', { class: 'name-color-container' }).appendTo(eventGroup);
    $('<input/>', { type: 'text', id: eventNameId, placeholder: 'Event Name' }).appendTo(nameColorContainer);
    $('<input/>', { type: 'color', id: eventColorId }).appendTo(nameColorContainer);

    // Date container
    const dateContainer = $('<div/>', { class: 'date-container' }).appendTo(eventGroup);
    $('<input/>', { type: 'date', class: 'date-picker', id: eventStartId, placeholder: 'From' }).appendTo(dateContainer);
    $('<input/>', { type: 'date', class: 'date-picker', id: eventEndId, placeholder: 'To' }).appendTo(dateContainer);

    // Add buttons
    $('<button/>', { text: 'Save Event', class: 'submit-event', click: function () { addOrUpdateEvent(eventCounter); } }).appendTo(eventGroup);
    // Inside addEvent function
    $('<button/>', {
        text: 'x',
        class: 'remove-event',
        click: function (e) {
            e.stopPropagation();
            removeEvent('event-' + eventCounter);
        }
    }).appendTo(eventGroup);
    // Setup date picker
    $('#' + eventStartId + ', #' + eventEndId).datepicker({
        dateFormat: 'yy-mm-dd', changeMonth: true, changeYear: true, yearRange: '1900:' + new Date().getFullYear()
    });
}


function updateFloatingDivWithEvents() {
    $('#floating-div').empty();
    lifeEvents.forEach(event => {
        const eventGroup = $('<div/>', { class: 'event-group', id: event.id }).appendTo("#floating-div");

        // Name and color container
        const nameColorContainer = $('<div/>', { class: 'name-color-container' }).appendTo(eventGroup);
        $('<input/>', { type: 'text', value: event.name, readonly: true }).appendTo(nameColorContainer);
        $('<input/>', { type: 'color', value: event.color, readonly: true }).appendTo(nameColorContainer);

        // Date container
        const dateContainer = $('<div/>', { class: 'date-container' }).appendTo(eventGroup);
        $('<input/>', { type: 'date', class: 'date-picker', value: formatDate(event.start), readonly: true }).appendTo(dateContainer);
        $('<input/>', { type: 'date', class: 'date-picker', value: formatDate(event.end), readonly: true }).appendTo(dateContainer);

        // Delete button
        $('<button/>', { text: 'x', class: 'remove-event', 'data-event-id': event.id }).appendTo(eventGroup);
    });
    attachDeleteEventListeners();
    addAddEventButton();
}
function attachDeleteEventListeners() {
    $('.remove-event').off('click').on('click', function (e) {
        e.stopPropagation();
        const eventId = $(this).data('event-id');
        removeEvent(eventId);
    });
}

function addAddEventButton() {
    const addEventButtonHtml = `<div id="add-event-btn" title="Add life event">+</div>`;
    $('#floating-div').append(addEventButtonHtml);

    // Attach the click event listener to the 'Add Event' button
    $('#add-event-btn').off('click').on('click', function (e) {
        e.stopPropagation();
        addEvent(); // Function to handle adding a new event
    });
}

lifeEvents.forEach((event, index) => {
    const eventHtml = `
        <div class="event-group" id="event-${index}">
            <input type="text" value="${event.name}" placeholder="Event Name" readonly>
            <input type="text" value="${formatDate(event.start)}" class="date-picker" placeholder="From" readonly>
            <input type="text" value="${formatDate(event.end)}" class="date-picker" placeholder="To" readonly>
            <input type="color" value="${event.color}" readonly>
            <button class="remove-event" data-event-id="${index}">x</button>
        </div>
    `;
    $('#floating-div').append(eventHtml);
});

// Attach click event listeners to the 'Remove Event' buttons
$('.remove-event').off('click').on('click', function (e) {
    e.stopPropagation();
    const eventId = $(this).data('event-id');
    removeEvent(eventId); // Function to handle removing an event
});
function updateLegend() {
    const legendContainer = document.getElementById('events-legend');
    if (!legendContainer) {
        console.error('Legend container not found');
        return;
    }
    legendContainer.innerHTML = ''; // Clear existing legend items

    lifeEvents.forEach(event => {
        // Create the container for each legend item
        const legendItem = document.createElement('div');
        legendItem.classList.add('event-legend-item');

        // Create the color indicator
        const colorIndicator = document.createElement('div');
        colorIndicator.classList.add('event-color-indicator');
        colorIndicator.style.backgroundColor = event.color;

        // Create the event name text
        const eventName = document.createElement('span');
        eventName.classList.add('event-name');
        eventName.textContent = event.name;

        // Append color indicator and event name to the legend item
        legendItem.appendChild(colorIndicator);
        legendItem.appendChild(eventName);

        // Append the legend item to the legend container
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
// Call these functions whenever the life events update or user logs in/out




function printContent() {
    window.print();
}

const clarityScaleFactor = window.devicePixelRatio || 4;

function downloadImage() {
    const content = document.getElementById('main-content');

    const originalWidth = content.style.width;
    content.style.width = '1000px'
    const yearTextLabel = document.getElementById('year-text-label');
    const originalTransform = yearTextLabel.style.transform;
    yearTextLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
    html2canvas(content, { scale: clarityScaleFactor, useCORS: true }).then(canvas => {
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
        console.error('Error generating image:', error);

    });
    yearTextLabel.style.transform = originalTransform;
}

function toggleLifeEvent() {
    var floatingDiv = document.getElementById('floating-div');
    if (floatingDiv.style.display === 'none' || !floatingDiv.style.display) {
        floatingDiv.style.display = 'block';
    } else {
        floatingDiv.style.display = 'none';
    }
}


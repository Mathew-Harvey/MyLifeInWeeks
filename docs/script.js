
const firebaseConfig = {
    apiKey: "AIzaSyDXdYWM6FFa82V1DN5ecl5V5KqMfWBpc18",
    authDomain: "mylifeinweeks-6e743.firebaseapp.com",
    databaseURL: "https://mylifeinweeks-6e743-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mylifeinweeks-6e743",
    storageBucket: "mylifeinweeks-6e743.appspot.com",
    messagingSenderId: "72962197769",
    appId: "1:72962197769:web:886cc755f32e9b3d6f6bd8",
    measurementId: "G-6E144LFLGX"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();


const database = firebase.database();


let eventCounter = 0;
let lifeEvents = [];
let totalWeeksLived = 0;
let birthDate = null;

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

function createDecadeLabels(totalYears) {
    const decadeLabelsContainer = document.getElementById('decade-labels-container');
    decadeLabelsContainer.innerHTML = '';
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

            // Highlighting the current week
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
//make calculate age robust


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



$(function () {
    $("#floating-div").draggable({ containment: "window" }).resizable();
    $("#birthdate").change(calculateAge);
    $('#floating-div').hide();

    $('#toggle-life-events').off('click').on('click', function (e) {
        e.stopPropagation();
        $('#floating-div').toggle();
    });

    $('#add-event-btn').off('click').on('click', function (e) {
        e.stopPropagation();
        eventCounter++;
        const eventNameId = 'event-name-' + eventCounter;
        const eventStartId = 'event-start-' + eventCounter;
        const eventEndId = 'event-end-' + eventCounter;
        const eventColorId = 'event-color-' + eventCounter;

        const eventGroup = $('<div/>', { class: 'event-group' }).appendTo("#floating-div");

        $('<input/>', { type: 'text', id: eventNameId, placeholder: 'Event Name' }).appendTo(eventGroup);
        $('<input/>', { type: 'text', class: 'date-picker', id: eventStartId, placeholder: 'From' }).appendTo(eventGroup);
        $('<input/>', { type: 'text', class: 'date-picker', id: eventEndId, placeholder: 'To' }).appendTo(eventGroup);

        const colorInput = $('<input/>', { type: 'color', id: eventColorId }).appendTo(eventGroup);

        $('#' + eventStartId + ', #' + eventEndId).datepicker({
            dateFormat: 'yy-mm-dd',
            changeMonth: true,
            changeYear: true,
            yearRange: '1900:' + new Date().getFullYear()
        });

        $('<button/>', {
            text: 'Add Event',
            class: 'submit-event',
            click: function () { addOrUpdateEvent(eventCounter); }
        }).appendTo(eventGroup);

        $('<button/>', {
            text: 'x',
            class: 'remove-event',
            click: function (e) {
                e.stopPropagation();
                eventGroup.remove();
                const eventIndex = lifeEvents.findIndex(event => event.id === 'event-' + eventCounter);
                if (eventIndex > -1) {
                    lifeEvents.splice(eventIndex, 1);
                }
                createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
            }
        }).appendTo(eventGroup);

        colorInput.spectrum({
            color: "#f00",
            showInput: true,
            showInitial: false,
            preferredFormat: "hex",
            showPalette: true,
            palette: [
                ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"]
            ],
            change: function (color) {
                $('#' + eventColorId).val(color.toHexString());
            }
        });
    });

    createWeekLabels();
    createYearLabels(100);
    createDecadeLabels(100);
    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
});

function addOrUpdateEvent(counter) {
    const name = $('#event-name-' + counter).val();
    const startStr = $('#event-start-' + counter).val();
    const endStr = $('#event-end-' + counter).val();
    const color = $('#event-color-' + counter).val();

    // Convert strings to Date objects
    const start = new Date(startStr);
    const end = new Date(endStr);

    // Find if the event already exists
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
        const firebaseLifeEvents = lifeEvents.map(event => ({
            ...event,
            start: event.start.toISOString(),
            end: event.end.toISOString()
        }));
        saveLifeEventsToDatabase(auth.currentUser.uid, firebaseLifeEvents);
    }
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

function toggleEventView(counter) {
    const detailView = $('#event-details-' + counter);
    const compactView = $('#compact-event-' + counter);

    if (detailView.is(':visible')) {
        detailView.hide();
        compactView.show();
    } else {
        compactView.hide();
        detailView.show();
    }
}

function removeEvent(counter) {
    $('#event-details-' + counter).remove();
    $('#compact-event-' + counter).remove();
    lifeEvents = lifeEvents.filter(event => event.id !== 'event-' + counter);
    if (auth.currentUser) {
        saveLifeEventsToDatabase(auth.currentUser.uid, lifeEvents);
    }
}
function compactPreviousEvents() {
    lifeEvents.forEach((event, index) => {
        if (index < eventCounter) {
            toggleEventView(index);
        }
    });
}

compactPreviousEvents();

function formatDate(date) {
    return date.toISOString().slice(0, 10);
}

function createEventLabels(container, lifeEvents, birthDate) {
    const svg = d3.select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .style("position", "absolute")
        .style("top", 0)
        .style("left", 0);

    const lineGenerator = d3.line();

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

function registerUser(email, password) {
    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Registration successful
            console.log('User registered:', userCredential.user);
            switchToLoggedInState(userCredential.user);
        })
        .catch((error) => {
            console.error('Registration failed:', error.message);
        });
}

function loginUser() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    if (email && password) {
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                console.log('User logged in:', userCredential.user);
                switchToLoggedInState(userCredential.user);
            })
            .catch((error) => {
                console.error('Login failed:', error.message);
            });
    } else {
        console.error('Email or password is missing');
    }
}


function logoutUser() {
    auth.signOut().then(() => {
        console.log('User logged out');
        switchToLoggedOutState();
    }).catch((error) => {
        console.error('Logout failed:', error.message);
    });
}

// Listener for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('Logged in user email:', user.email);
        loadBirthDateFromDatabase(user.uid); // Load birth date
        loadLifeEventsFromDatabase(user.uid); // Load life events

        switchToLoggedInState(user);
    } else {
        console.log('User is logged out');
        switchToLoggedOutState();
    }
});

function switchToLoggedInState(user) {
    $('#login-container').hide();
    $('#main-content').show();
    $('#auth-header').show();
    $('#navbar').show();
    // Populate auth-header with user info and logout button
}

function switchToLoggedOutState() {
    $('#login-container').show();
    $('#main-content').hide();
    $('#auth-header').hide();
    $('#navbar').hide();
}

function onUserLoggedIn(user) {
    loadLifeEventsFromDatabase(user.uid);
    loadBirthDateFromDatabase(user.uid);
    // Display the user's email in the navigation bar
    const userEmailDisplay = document.getElementById('user-email');
    if (userEmailDisplay) {
        userEmailDisplay.textContent = user.email; // Display the user's email
    }
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('register-section').style.display = 'none';
    document.getElementById('logout-button').style.display = 'block';
    const navbar = document.getElementById('navbar');
    navbar.innerHTML = `
        <div id="user-info">
            <img id="user-avatar" src="${user.photoURL || 'default-avatar.png'}" alt="User Avatar">
            <span id="user-email">${user.email}</span>
        </div>
        <div>
            <button onclick="window.print()">Print</button>
            <button id="logout-button" onclick="logoutUser()">Logout</button>
        </div>
    `;

    // Show the main content
    document.getElementById('main-content').style.display = 'block';
}
function onUserLoggedOut() {
    // Clear the navigation bar user info and hide the main content
    const navbarUserInfo = document.getElementById('user-info');
    if (navbarUserInfo) {
        navbarUserInfo.innerHTML = '';
    }

    document.getElementById('auth-container').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('logout-button').style.display = 'none'; // Hide the logout button

    // Any additional logic for when the user logs out...
}
// Event listeners for login, register, and logout buttons
$('#login-button').click(() => {
    const email = $('#login-email').val();
    const password = $('#login-password').val();
    if (email && password) {
        loginUser(email, password);
    } else {
        console.error('Email or password is missing');
    }
});

$('#register-button').click(() => {
    const email = $('#register-email').val();
    const password = $('#register-password').val();
    registerUser(email, password);
});

$('#logout-button').click(logoutUser);





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
            }));
            createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
        }
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

function printContent() {
    window.print();
}

function printGrid() {
    const mainContent = document.getElementById("main-content");

    html2canvas(mainContent, { scale: 2, logging: true, scrollY: -window.scrollY }).then(canvas => {
        const image = canvas.toDataURL("image/png");
        const windowContent = '<!DOCTYPE html>' +
                              '<html>' +
                              '<head><title>Print</title></head>' +
                              '<body style="margin: 0; padding: 0; box-sizing: border-box; font-family: Arial;">' +
                              '<div style="text-align: center; margin: auto; page-break-inside: avoid;">' +
                                  '<img src="' + image + '" style="width: 100%; max-width: 800px; max-height: 1120px; height: auto;">' +
                              '</div>' +
                              '</body>' +
                              '</html>';
        const printWin = window.open('', '', 'width=840,height=1189'); // A4 size: 8.27 × 11.69 inches
        printWin.document.open();
        printWin.document.write(windowContent);
        printWin.document.close();
        printWin.focus();
        setTimeout(function () {
            printWin.print();
            printWin.close();
        }, 1000);
    }).catch(error => {
        console.error('Error generating print image:', error);
    });
}

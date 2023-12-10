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

    // Change: Adjusting loop to include month groupings
    for (let year = 0; year < totalYears; year++) {
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');

        // Change: Adding a spacer at the start of each decade
        if (year % 10 === 0) {
            const decadeSpacer = document.createElement('div');
            decadeSpacer.classList.add('decade-spacer');
            yearContainer.appendChild(decadeSpacer);
        }

        for (let week = 0; week < weeksPerYear; week++) {
            // Change: Adding a spacer at the start of each month
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

            if (birthDate) {
                const weekDate = new Date(birthDate.getTime() + weeksCounter * 7 * 24 * 60 * 60 * 1000);
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
        totalWeeksLived = age * 52;
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
            showInitial: true,
            preferredFormat: "hex",
            showPalette: true,
            palette: [
                ["#000","#444","#666","#999","#ccc","#eee","#f3f3f3","#fff"],
                ["#f00","#f90","#ff0","#0f0","#0ff","#00f","#90f","#f0f"]
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
    const start = $('#event-start-' + counter).datepicker('getDate');
    const end = $('#event-end-' + counter).datepicker('getDate');
    const color = $('#event-color-' + counter).val();

    const event = lifeEvents.find(e => e.id === 'event-' + counter);
    if (event) {
        event.name = name;
        event.start = start;
        event.end = end;
        event.color = color;
    } else {
        lifeEvents.push({ id: 'event-' + counter, name, start, end, color });
    }
    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
}


    createWeekLabels();
    createYearLabels(100);
    createDecadeLabels(100);
    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);

// Function to create a compact key view of an event
function createCompactEventView(event, counter) {
    const compactView = $('<div/>', {
        class: 'compact-event',
        click: () => toggleEventView(counter),
        mouseenter: function () { $(this).addClass('highlight'); },
        mouseleave: function () { $(this).removeClass('highlight'); }
    });

    // Add the event name and dates to the compact view
    compactView.append($('<span/>', { text: event.name + ': ' }));
    compactView.append($('<span/>', { text: formatDate(event.start) + ' - ' + formatDate(event.end), class: 'event-dates' }));

    // Add a colored indicator
    compactView.append($('<span/>', {
        class: 'color-indicator',
        css: { 'background-color': event.color }
    }));

    // Add a remove button
    compactView.append($('<button/>', {
        text: 'x',
        class: 'remove-event',
        click: function (e) {
            e.stopPropagation(); // Prevent the compact event from expanding
            // Removal logic here
            removeEvent(counter);
        }
    }));

    return compactView;
}

// Toggle event view function
function toggleEventView(counter) {
    const detailView = $('#event-details-' + counter);
    const compactView = $('#compact-event-' + counter);

    // Check if we're expanding or collapsing the view
    if (detailView.is(':visible')) {
        // Collapse to compact view
        detailView.hide();
        compactView.show();
    } else {
        // Expand to detailed view
        compactView.hide();
        detailView.show();
    }
}

// Function to remove an event
function removeEvent(counter) {
    $('#event-details-' + counter).remove();
    $('#compact-event-' + counter).remove();
    // Update the lifeEvents array as previously described
}

// Call this function whenever you add a new life event to make previous ones compact
function compactPreviousEvents() {
    lifeEvents.forEach((event, index) => {
        if (index < eventCounter) {
            toggleEventView(index);
        }
    });
}

// Add this call inside your event creation logic, after creating a new event
compactPreviousEvents();

// Utility function to format dates
function formatDate(date) {
    // Format the date as needed
    return date.toISOString().slice(0, 10);
}

// Inside your existing event creation logic, replace the toggleEventView call
// with a call to createCompactEventView, and append the returned div to your container

function createEventLabels(container, lifeEvents, birthDate) {
    lifeEvents.forEach(event => {
        // Calculate start and end week numbers
        const eventStartWeek = Math.floor((event.start.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const eventEndWeek = Math.floor((event.end.getTime() - birthDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        
        // Calculate the mid-point of the event duration
        const eventMidWeek = eventStartWeek + (eventEndWeek - eventStartWeek) / 2;
        const yearPosition = Math.floor(eventMidWeek / 52);
        const weekPosition = eventMidWeek % 52;

        // Create the event label container element
        const eventLabelContainer = document.createElement('div');
        eventLabelContainer.classList.add('event-label-container');
        eventLabelContainer.style.position = 'absolute';
        eventLabelContainer.style.left = (weekPosition * (weekBoxWidth + weekBoxMargin)) + 'px';
        eventLabelContainer.style.top = (yearPosition * (weekBoxHeight + weekBoxMargin)) + 'px';

        // Set the label text
        eventLabelContainer.textContent = event.name; // The text content of the label

        // Append the label container to the main container
        container.appendChild(eventLabelContainer);

        // Optionally, set additional styles or attributes as needed
        eventLabelContainer.style.cursor = 'pointer';
        eventLabelContainer.title = `${event.name}: ${formatDate(event.start)} - ${formatDate(event.end)}`;
    });
}
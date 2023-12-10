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

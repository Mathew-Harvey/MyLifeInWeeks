let eventCounter = 0;
let lifeEvents = [];
let totalWeeksLived = 0;
let birthDate = null

function createWeekBoxes(container, totalWeeksLived, totalYears) {
    const chartContainer = document.getElementById('chart-container');
    const labelsContainer = document.getElementById('decade-labels-container');
    chartContainer.innerHTML = '';
    labelsContainer.innerHTML = '';
    container.innerHTML = '';
    const weeksPerYear = 52;
    const weeksPerMonth = 4.34812;
    let weeksCounter = 0;
    for (let year = 0; year < totalYears; year++) {
        if (year % 10 === 0) {
            const decadeLabel = document.createElement('div');
            const decadeWrapper = document.createElement('div');
            decadeWrapper.classList.add('decade-wrapper');
            decadeLabel.classList.add('decade-label');
            decadeLabel.textContent = "";
            decadeWrapper.appendChild(decadeLabel);
            container.appendChild(decadeWrapper);
        }
        const yearContainer = document.createElement('div');
        yearContainer.classList.add('year-container');
        yearContainer.dataset.year = year;

        for (let month = 0; month < 13; month++) {
            const monthContainer = document.createElement('div');
            monthContainer.classList.add('month-container');
            monthContainer.dataset.month = month + 1;
            let weekCountForMonth = month === 13 ? weeksPerYear - weeksCounter : Math.floor(weeksPerMonth);

            for (let week = 0; week < weekCountForMonth; week++) {
                if (weeksCounter >= weeksPerYear * (year + 1)) {
                    break;
                }
                const weekBox = document.createElement('div');
                weekBox.classList.add('week-box');
                weekBox.dataset.week = weeksCounter;

                if (weeksCounter < totalWeeksLived) {
                    weekBox.classList.add('lived'); // Coloring based on age
                }

                if (birthDate) {
                    const weekDate = new Date(birthDate.getFullYear(), birthDate.getMonth(), birthDate.getDate() + weeksCounter * 7);

                    if (birthDate) {
                        const weekDate = new Date(birthDate.getTime() + weeksCounter * 7 * 24 * 60 * 60 * 1000);

                        lifeEvents.forEach(event => {
                            if (event.start && event.end) {
                                if (weekDate >= event.start && weekDate <= event.end) {
                                    weekBox.style.backgroundColor = event.color;
                                    weekBox.title = event.name;
                                }
                            }
                        });
                    }
                }

                monthContainer.appendChild(weekBox);
                weeksCounter++;
            }
            if (weeksCounter >= weeksPerYear * (year + 1)) {
                break;
            }
            yearContainer.appendChild(monthContainer);
        }
        container.appendChild(yearContainer);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    createWeekBoxes(document.getElementById('chart-container'), 0, 90);
});

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    tooltip.textContent = `Week ${event.target.dataset.week}`;
    tooltip.style.position = 'absolute';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    document.body.appendChild(tooltip);
}

function hideTooltip(event) {
    document.querySelectorAll('.tooltip').forEach(tooltip => {
        tooltip.remove();
    });
}

function createWeekLabels(container) {
    container.innerHTML = '';
    const weeksInYear = 52;
    const weeksLabel = document.createElement('div');
    weeksLabel.textContent = '';
    weeksLabel.style.textAlign = 'left';
    weeksLabel.style.marginRight = '10px';
    weeksLabel.style.fontSize = '12px';
    container.appendChild(weeksLabel);
    for (let i = 1; i <= weeksInYear; i++) {
        const label = document.createElement('div');
        label.classList.add('week-label');
        label.textContent = i % 4 === 0 ? i : '';
        container.appendChild(label);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const weekLabelsContainer = document.getElementById('week-labels-container');
    createWeekLabels(weekLabelsContainer);
    createWeekBoxes(document.getElementById('chart-container'), 0, 90);
});

function createYearLabels(container) {
    container.innerHTML = '';
    for (let i = 0; i < 19; i++) {
        const label = document.createElement('div');
        label.classList.add('year-label');
        label.textContent = i * 5;
        container.appendChild(label);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const yearsLabelsContainer = document.getElementById('years-labels-container');
    createYearLabels(yearsLabelsContainer);
});

function calculateAge() {
    var birthDate = document.getElementById('birthdate').value;
    if (birthDate) {
        birthDate = new Date(birthDate)
        var today = new Date();
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        var daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        var ageDecimal = age + (m + (today.getDate() - birthDate.getDate()) / daysInMonth) / 12;
        ageDecimal = Math.round(ageDecimal * 100) / 100;
        const totalWeeksLived = Math.floor(ageDecimal * 52);
        const chartContainer = document.getElementById('chart-container');
        chartContainer.innerHTML = '';
        createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
    } else {

        console.log('Please enter your birthdate.');
    }
}



$(function () {
    $("#floating-div").draggable().resizable();

    $("#add-event-btn").click(function () {
        eventCounter++;
        const eventGroup = $('<div/>', { class: 'event-group' });
        eventGroup.append($('<input/>', {
            type: 'text',
            id: 'event-name-' + eventCounter,
            placeholder: 'Event Name'
        }));
        eventGroup.append($('<input/>', {
            type: 'text',
            class: 'date-picker',
            id: 'event-start-' + eventCounter,
            placeholder: 'From'
        }));
        eventGroup.append($('<input/>', {
            type: 'text',
            class: 'date-picker',
            id: 'event-end-' + eventCounter,
            placeholder: 'To'
        }));
        eventGroup.append($('<input/>', {
            type: 'color',
            id: 'event-color-' + eventCounter,
            title: 'Choose event color'
        }));

        $("#floating-div").append(eventGroup);

        $('.date-picker').datepicker({ dateFormat: 'yy-mm-dd' });
        $('.color-picker').spectrum({
            // Spectrum initialization options
        });
    });




    $("#add-event-btn").hover(function () {
        eventCounter++;
        const eventGroup = $('<div/>', { class: 'event-group' });
        $(".tooltip").show().css({
            top: $(this).offset().top - $(this).outerHeight(),
            left: $(this).offset().left + $(this).outerWidth() / 2 - $(".tooltip").outerWidth() / 2
        });
        const colorInput = $('<input/>', {
            id: 'event-color-' + eventCounter,
        });
        eventGroup.append(colorInput);
        colorInput.spectrum({
            color: "#f00", // Example starting color, red
            showInput: true,
            showInitial: true,
            preferredFormat: "hex",
            showPalette: true,
            palette: [ // Example color palette
                ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
            ],
            change: function (color) {
                // Logic to handle color change events
                // You could update the event's display or store the selected color value
            }
        });
        eventGroup.append($('<input/>', {
            type: 'color',
            id: 'event-color-' + eventCounter,
            title: 'Choose event color'
        }));
    }, function () {
        $(".tooltip").hide();
    });
});

$("#add-event-btn").click(function () {
    eventCounter++;
    const eventName = $('#event-name-' + eventCounter).val();
    const eventStartStr = $('#event-start-' + eventCounter).val();
    const eventEndStr = $('#event-end-' + eventCounter).val();
    const eventColor = $('#event-color-' + eventCounter).val();

    const eventStart = eventStartStr ? new Date(eventStartStr) : null;
    const eventEnd = eventEndStr ? new Date(eventEndStr) : null;

    if (eventStart && eventEnd) { // Check if both dates are valid
        const event = {
            id: 'event-' + eventCounter,
            name: eventName,
            start: eventStart,
            end: eventEnd,
            color: eventColor
        };

        if (event.start && event.end) {
            lifeEvents.push(event);
        }
    }

    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
});
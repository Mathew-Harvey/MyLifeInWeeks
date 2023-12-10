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
                            // Convert event start and end to the corresponding week number since birth.
                            const eventStartWeek = Math.floor((event.start - birthDate) / (7 * 24 * 60 * 60 * 1000));
                            const eventEndWeek = Math.floor((event.end - birthDate) / (7 * 24 * 60 * 60 * 1000));

                            // Check if the current week box is within the event start and end week.
                            if (weeksCounter >= eventStartWeek && weeksCounter <= eventEndWeek) {
                                weekBox.style.backgroundColor = event.color;
                                weekBox.title = event.name;
                            }
                            console.log(`Event: ${event.name}, Start Week: ${eventStartWeek}, End Week: ${eventEndWeek}`); // Log event weeks
                            console.log(`Current Week Counter: ${weeksCounter}`); // Log the current week counter
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
    var inputBirthDate = document.getElementById('birthdate').value;
    if (inputBirthDate) {
        birthDate = new Date(inputBirthDate); // Set the global birthDate
        var today = new Date();
        var age = today.getFullYear() - birthDate.getFullYear();
        var m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        var daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        var ageDecimal = age + (m + (today.getDate() - birthDate.getDate()) / daysInMonth) / 12;
        ageDecimal = Math.round(ageDecimal * 100) / 100;
        totalWeeksLived = Math.floor(ageDecimal * 52);
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
            const colorInput = $('<input/>', {
                type: 'color',
                id: 'event-color-' + eventCounter,
                title: 'Choose event color'
            });
            eventGroup.append(colorInput);
    
            $("#floating-div").append(eventGroup);
    
            // Initialize the datepickers
            $('.date-picker').datepicker({ dateFormat: 'yy-mm-dd' });
    
            // Attach the Spectrum color picker to the color input
            colorInput.spectrum({
                color: "#f00", // Example starting color, red
                showInput: true,
                showInitial: true,
                preferredFormat: "hex",
                showPalette: true,
                palette: [
                    ["#000", "#444", "#666", "#999", "#ccc", "#eee", "#f3f3f3", "#fff"],
                    ["#f00", "#f90", "#ff0", "#0f0", "#0ff", "#00f", "#90f", "#f0f"],
                ],
                change: function (color) {
                    // When a color is chosen, update the event color
                    const colorHex = color.toHexString();
                    $('#event-color-' + eventCounter).val(colorHex);
    
                    // Find the event in the lifeEvents array and update its color
                    const index = lifeEvents.findIndex(event => event.id === 'event-' + eventCounter);
                    if (index !== -1) {
                        lifeEvents[index].color = colorHex;
                    } else {
                        // If the event isn't in the array, push it with the selected color
                        lifeEvents.push({
                            id: 'event-' + eventCounter,
                            name: $('#event-name-' + eventCounter).val(),
                            start: new Date($('#event-start-' + eventCounter).val()),
                            end: new Date($('#event-end-' + eventCounter).val()),
                            color: colorHex
                        });
                    }
    
                    // Recreate the week boxes with the updated colors
                    createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
                }
            });
        });
        // ... [rest of the code]
    
        function updateGrid() {
            calculateAge(); // Make sure this function sets the birthDate global variable
            createWeekBoxes(document.getElementById('chart-container'), totalWeeksLived, 90);
        }
    });
document.getElementById('generate-chart').addEventListener('click', function() {
    const age = parseFloat(document.getElementById('user-age').value); // Allow for partial years
    const totalWeeksLived = Math.floor(age * 52); // Convert age to total weeks lived
    const chartContainer = document.getElementById('chart-container');
    chartContainer.innerHTML = ''; // Clear the chart before generating new boxes
    createWeekBoxes(chartContainer, totalWeeksLived, 90); // Assume a 90-year lifespan
});

function createWeekBoxes(container, totalWeeksLived, totalYears) {
    const chartContainer = document.getElementById('chart-container');
    const labelsContainer = document.getElementById('decade-labels-container');
    chartContainer.innerHTML = ''; // Clear the chart
    labelsContainer.innerHTML = ''; // Clear the labels
    const weeksPerYear = 52;
    const weeksPerMonth = 4.34812; // Average weeks per month (52 weeks / 12 months)
    let weeksCounter = 0;

    // Generate the full chart with decades, years, and weeks
    for (let year = 0; year < totalYears; year++) {
        // Add decade label at the start of each decade
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

        // Generate months for the year
        
        for (let month = 0; month < 13; month++) {
            const monthContainer = document.createElement('div');
            monthContainer.classList.add('month-container');
            monthContainer.dataset.month = month + 1;
            
            // Generate weeks for the month
            let weekCountForMonth = month === 13 ? weeksPerYear - weeksCounter : Math.floor(weeksPerMonth); // Adjust for last month
            for (let week = 0; week <weekCountForMonth; week++) {
                if (weeksCounter >= weeksPerYear * (year + 1)) {
                    // If the weeks exceed the year, break the loop
                    break;
                }
                const weekBox = document.createElement('div');
                weekBox.classList.add('week-box');
                weekBox.classList.add(weeksCounter < totalWeeksLived ? 'lived' : 'unlived'); // Apply the lived or unlived class based on the weeksCounter
                monthContainer.appendChild(weekBox);
                weeksCounter++; // Increment weeks counter
            }
            
            if (weeksCounter >= weeksPerYear * (year + 1)) {
                // If we've added all weeks for the year, don't add any more months
                break;
            }

            yearContainer.appendChild(monthContainer);
        }

        container.appendChild(yearContainer);
    }
}

// Initial chart generation (optional)
document.addEventListener('DOMContentLoaded', function() {
    createWeekBoxes(document.getElementById('chart-container'), 0, 90); // Start with no weeks lived
});

    // Function to show tooltip
    function showTooltip(event) {
        const tooltip = document.createElement('div');
        tooltip.classList.add('tooltip');
        tooltip.textContent = `Week ${event.target.dataset.week}`;
        tooltip.style.position = 'absolute';
        tooltip.style.left = `${event.pageX + 10}px`;
        tooltip.style.top = `${event.pageY + 10}px`;
        document.body.appendChild(tooltip);
    }

    // Function to hide tooltip
    function hideTooltip(event) {
        document.querySelectorAll('.tooltip').forEach(tooltip => {
            tooltip.remove();
        });
    }

    function createWeekLabels(container) {
        container.innerHTML = ''; // Clear any existing labels
        const weeksInYear = 52;
        
        // Create the 'WEEKS' label
        const weeksLabel = document.createElement('div');
        weeksLabel.textContent = '';
        weeksLabel.style.textAlign = 'left';
        weeksLabel.style.marginRight = '10px'; // Adjust as needed
        weeksLabel.style.fontSize = '12px'; // Adjust as needed
        container.appendChild(weeksLabel);
    
        // Create the individual week number labels
        for (let i = 1; i <= weeksInYear; i++) {
            const label = document.createElement('div');
            label.classList.add('week-label');
            label.textContent = i % 4 === 0 ? i : ''; // Adjust as per your label frequency requirement
            container.appendChild(label);
        }
    }
    
    // Call createWeekLabels on DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        const weekLabelsContainer = document.getElementById('week-labels-container');
        createWeekLabels(weekLabelsContainer);
    
        // Also generate the week boxes as before
        createWeekBoxes(document.getElementById('chart-container'), 0, 90); // Start with no weeks lived
    });

    function createYearLabels(container) {
        container.innerHTML = ''; // Clear any existing labels
        
        for (let i = 0; i < 19; i++) { // Assuming a 90-year lifespan with labels every 5 years
            const label = document.createElement('div');
            label.classList.add('year-label');
            label.textContent = i * 5; // Multiplying by 5 gives us the five-year intervals
            container.appendChild(label);
        }
    }
    
 
    document.addEventListener('DOMContentLoaded', function() {
        const yearsLabelsContainer = document.getElementById('years-labels-container');
        createYearLabels(yearsLabelsContainer);
    });
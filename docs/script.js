function createWeekBoxes(container, totalWeeksLived, totalYears) {
    const chartContainer = document.getElementById('chart-container');
    const labelsContainer = document.getElementById('decade-labels-container');
    chartContainer.innerHTML = ''; 
    labelsContainer.innerHTML = ''; 
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
            for (let week = 0; week <weekCountForMonth; week++) {
                if (weeksCounter >= weeksPerYear * (year + 1)) {
                    break;
                }
                const weekBox = document.createElement('div');
                weekBox.classList.add('week-box');
                weekBox.classList.add(weeksCounter < totalWeeksLived ? 'lived' : 'unlived'); 
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

document.addEventListener('DOMContentLoaded', function() {
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
    
    document.addEventListener('DOMContentLoaded', function() {
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
 
    document.addEventListener('DOMContentLoaded', function() {
        const yearsLabelsContainer = document.getElementById('years-labels-container');
        createYearLabels(yearsLabelsContainer);
    });

    function calculateAge() {
        var birthdate = document.getElementById('birthdate').value;
        if (birthdate) {
            var today = new Date();
            var birthDate = new Date(birthdate);
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
            createWeekBoxes(chartContainer, totalWeeksLived, 90);
        } else {
            
            console.log('Please enter your birthdate.');
        }
    }
    $(function() {
        $("#floating-div").draggable().resizable();
    });
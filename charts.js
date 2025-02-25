// Chart.js Configuration
Chart.defaults.color = '#2c3e50';
Chart.defaults.font.family = "'Segoe UI', sans-serif";

// Temperature Forecast Chart
function updateForecastChart(forecast) {
    const ctx = document.getElementById('forecastChart').getContext('2d');
    const data = processForecastData(forecast);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Temperature',
                data: data.temperatures,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Historical Temperature Chart
function updateHistoricalChart(historicalData) {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    const data = processHistoricalData(historicalData);

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Historical Temperature',
                data: data.temperatures,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgb(75, 192, 192)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false
                }
            }
        }
    });
}

// Data Processing Functions
function processForecastData(forecast) {
    const labels = [];
    const temperatures = [];

    forecast.list.slice(0, 8).forEach(item => {
        const date = new Date(item.dt * 1000);
        labels.push(date.toLocaleTimeString([], { hour: '2-digit' }));
        temperatures.push(Math.round(item.main.temp));
    });

    return { labels, temperatures };
}

function processHistoricalData(data) {
    const labels = [];
    const temperatures = [];

    // Process historical data here
    // This will depend on your historical data format

    return { labels, temperatures };
}

// Update charts when theme changes
function updateChartsTheme(theme) {
    Chart.defaults.color = theme === 'dark' ? '#ffffff' : '#2c3e50';
    // Recreate charts with new theme
}
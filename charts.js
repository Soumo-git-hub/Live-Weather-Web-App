// Chart Configuration
const CHART_CONFIG = {
  colors: {
    light: {
      text: '#2c3e50',
      grid: 'rgba(0, 0, 0, 0.1)',
      primary: 'rgb(75, 192, 192)',
      secondary: 'rgba(75, 192, 192, 0.2)'
    },
    dark: {
      text: '#ffffff',
      grid: 'rgba(255, 255, 255, 0.1)',
      primary: 'rgb(0, 255, 255)',
      secondary: 'rgba(0, 255, 255, 0.2)'
    }
  },
  animation: {
    duration: 1000,
    easing: 'easeInOutCubic'
  }
};

// Chart instances
let forecastChart = null;
let historicalChart = null;

// Initialize chart defaults
function initializeChartDefaults(theme = 'light') {
  const colors = CHART_CONFIG.colors[theme];
  Chart.defaults.color = colors.text;
  Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.displayColors = false;
}

// Temperature Forecast Chart
function updateForecastChart(forecast) {
  if (!forecast || !forecast.list) {
    console.error('Invalid forecast data:', forecast);
    return;
  }
  
  const ctx = document.getElementById('forecastChart');
  if (!ctx) {
    console.error('Forecast chart canvas not found');
    return;
  }
  
  const context = ctx.getContext('2d');
  
  // Process forecast data
  const data = processForecastData(forecast);
  const isDark = document.body.classList.contains('dark-theme');
  const colors = CHART_CONFIG.colors[isDark ? 'dark' : 'light'];
  
  // Destroy previous chart instance
  if (forecastChart) forecastChart.destroy();
  
  // Create new chart
  forecastChart = new Chart(context, {
    type: 'line',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Temperature',
        data: data.temperatures,
        borderColor: colors.primary,
        backgroundColor: createGradient(context, colors.primary),
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: colors.primary,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: CHART_CONFIG.animation,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: (items) => items[0].label.replace(',', ' '),
            label: (context) => ` ${context.dataset.label}: ${context.parsed.y}°${window.state?.units === 'imperial' ? 'F' : 'C'}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: colors.grid },
          ticks: { 
            callback: (value) => `${value}°${window.state?.units === 'imperial' ? 'F' : 'C'}`,
            color: colors.text
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: colors.text }
        }
      }
    }
  });
  
  // Store chart in window for access from other scripts
  window.forecastChart = forecastChart;
}

// Historical Temperature Chart
function updateHistoricalChart(historicalData) {
  if (!historicalData || !historicalData.data) {
    console.error('Invalid historical data');
    return;
  }
  const ctx = document.getElementById('historicalChart');
  if (!ctx) {
    console.error('Historical chart canvas not found');
    return;
  }
  const context = ctx.getContext('2d');
  const isDark = document.body.classList.contains('dark-theme');
  const colors = CHART_CONFIG.colors[isDark ? 'dark' : 'light'];
  const data = processHistoricalData(historicalData.data);
  if (historicalChart) {
    historicalChart.destroy();
  }
  historicalChart = new Chart(context, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: 'Historical Temperature',
        data: data.temperatures,
        backgroundColor: colors.secondary,
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: colors.primary
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: CHART_CONFIG.animation,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.parsed.y}°${window.state?.units === 'imperial' ? 'F' : 'C'}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: false,
          grid: { color: colors.grid },
          ticks: {
            callback: (value) => `${value}°${window.state?.units === 'imperial' ? 'F' : 'C'}`,
            color: colors.text
          }
        },
        x: {
          grid: { display: false },
          ticks: { color: colors.text }
        }
      }
    }
  });
  
  // Store chart in window for access from other scripts
  window.historicalChart = historicalChart;
}

// Data Processing Functions
function processForecastData(forecast) {
  if (!forecast?.list) return { labels: [], temperatures: [] };
  return forecast.list.slice(0, 8).reduce((acc, item) => {
    const date = new Date(item.dt * 1000);
    acc.labels.push(date.toLocaleTimeString([], { hour: '2-digit' }));
    acc.temperatures.push(Math.round(item.main.temp));
    return acc;
  }, { labels: [], temperatures: [] });
}

function processHistoricalData(data) {
  if (!Array.isArray(data)) return { labels: [], temperatures: [] };
  return data.reduce((acc, item) => {
    if (item.date && item.temp) {
      acc.labels.push(new Date(item.date).toLocaleDateString());
      acc.temperatures.push(Math.round(item.temp));
    }
    return acc;
  }, { labels: [], temperatures: [] });
}

// Theme Management
function updateChartsTheme(theme) {
  initializeChartDefaults(theme);
  // Refresh charts with current data if they exist
  if (window.state && window.state.lastFetch) {
    const { forecast, historical } = window.state.lastFetch.data;
    if (forecast && forecastChart) updateForecastChart(forecast);
    if (historical && historicalChart) updateHistoricalChart(historical);
  }
}

// Helper function to create gradients
function createGradient(ctx, color) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, `${color}33`);
  gradient.addColorStop(1, `${color}00`);
  return gradient;
}

// Add this function at the end of your charts.js file
function initTestCharts() {
  console.log('Initializing test charts');
  
  // Sample forecast data
  const sampleForecast = {
    list: [
      { dt: Date.now() / 1000, main: { temp: 22 } },
      { dt: (Date.now() / 1000) + 3600, main: { temp: 23 } },
      { dt: (Date.now() / 1000) + 7200, main: { temp: 25 } },
      { dt: (Date.now() / 1000) + 10800, main: { temp: 24 } },
      { dt: (Date.now() / 1000) + 14400, main: { temp: 22 } },
      { dt: (Date.now() / 1000) + 18000, main: { temp: 20 } },
      { dt: (Date.now() / 1000) + 21600, main: { temp: 19 } },
      { dt: (Date.now() / 1000) + 25200, main: { temp: 18 } }
    ]
  };
  
  // Sample historical data
  const sampleHistorical = {
    data: [
      { date: '2023-10-01', temp: 20 },
      { date: '2023-10-02', temp: 22 },
      { date: '2023-10-03', temp: 21 },
      { date: '2023-10-04', temp: 23 },
      { date: '2023-10-05', temp: 25 },
      { date: '2023-10-06', temp: 24 },
      { date: '2023-10-07', temp: 22 }
    ]
  };
  
  // Update charts with sample data
  updateForecastChart(sampleForecast);
  updateHistoricalChart(sampleHistorical);
}

// Call this function when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing charts');
  
  // Initialize chart defaults
  initializeChartDefaults(document.body.classList.contains('dark-theme') ? 'dark' : 'light');
  
  // Initialize test charts with sample data
  setTimeout(initTestCharts, 1000);
  
  // Add tab change event listeners
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Trigger resize event to ensure charts render correctly after tab switch
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        
        // If this is the forecast tab, make sure to redraw the chart
        const tabId = this.getAttribute('data-tab');
        if (tabId === 'forecast' && window.forecastChart) {
          console.log('Resizing forecast chart');
          window.forecastChart.resize();
          window.forecastChart.update();
        }
        
        // If this is the historical tab, make sure to redraw the chart
        if (tabId === 'historical' && window.historicalChart) {
          console.log('Resizing historical chart');
          window.historicalChart.resize();
          window.historicalChart.update();
        }
      }, 100);
    });
  });
});
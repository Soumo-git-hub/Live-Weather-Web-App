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
  // Ensure this script is included in your HTML after Chart.js
  
  function updateForecastChart(forecast) {
      const ctx = document.getElementById('forecastChart').getContext('2d');
      
      // Extract data from forecast
      const labels = forecast.list.map(item => new Date(item.dt * 1000).toLocaleTimeString());
      const temperatures = forecast.list.map(item => item.main.temp);
  
      // Create or update the chart
      if (window.forecastChart) {
          // Update existing chart
          window.forecastChart.data.labels = labels;
          window.forecastChart.data.datasets[0].data = temperatures;
          window.forecastChart.update();
      } else {
          // Create new chart
          window.forecastChart = new Chart(ctx, {
              type: 'line',
              data: {
                  labels: labels,
                  datasets: [{
                      label: 'Temperature',
                      data: temperatures,
                      borderColor: 'rgba(75, 192, 192, 1)',
                      backgroundColor: 'rgba(75, 192, 192, 0.2)',
                      fill: true
                  }]
              },
              options: {
                  scales: {
                      x: {
                          type: 'time',
                          time: {
                              unit: 'hour'
                          }
                      },
                      y: {
                          beginAtZero: true
                      }
                  }
              }
          });
      }
  }
  const data = processForecastData(forecast);
  const isDark = document.body.classList.contains('dark-theme');
  const colors = CHART_CONFIG.colors[isDark ? 'dark' : 'light'];
  
  // Destroy previous chart instance
  if (forecastChart) forecastChart.destroy();
  
  forecastChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: data.labels,
        datasets: [{
            label: 'Temperature',
            data: data.temperatures,
            borderColor: colors.primary,
            backgroundColor: createGradient(ctx, colors.primary),
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
                    label: (context) => ` ${context.dataset.label}: ${context.parsed.y}°C`
                }
            }
        },
        scales: {  // Move scales outside of plugins
            y: {
                beginAtZero: false,
                grid: { color: colors.grid },
                ticks: { 
                    callback: (value) => `${value}°C`,
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
  
  // Historical Temperature Chart
  function updateHistoricalChart(historicalData) {
    const ctx = document.getElementById('historicalChart').getContext('2d');
    const data = processHistoricalData(historicalData);
    const isDark = document.body.classList.contains('dark-theme');
    const colors = CHART_CONFIG.colors[isDark ? 'dark' : 'light'];
  
    if (historicalChart) historicalChart.destroy();
  
    historicalChart = new Chart(ctx, {
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
              label: (context) => ` ${context.dataset.label}: ${context.parsed.y}°C`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: colors.grid },
            ticks: { 
              callback: (value) => `${value}°C`,
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
    if (forecastChart) updateForecastChart(forecastChart.data.datasets[0].data);
    if (historicalChart) updateHistoricalChart(historicalChart.data.datasets[0].data);
  }
  
  // Helper function to create gradients
  function createGradient(ctx, color) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, `${color}33`);
    gradient.addColorStop(1, `${color}00`);
    return gradient;
  }
  
  // Initialize charts with default theme
  initializeChartDefaults();
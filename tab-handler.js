// Tab Navigation Handler
document.addEventListener('DOMContentLoaded', function() {
    // Tab navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Add "Coming Soon" text to specific tabs
    addComingSoonText('forecast');
    addComingSoonText('historical');
    addComingSoonText('map');
    
    // Set Recommendations tab as the default active tab
    setDefaultTab('recommendations');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', function() {
        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabPanes.forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked button
        this.classList.add('active');
        
        // Show corresponding tab pane
        const tabId = this.getAttribute('data-tab');
        const tabPane = document.getElementById(tabId);
        tabPane.classList.add('active');
        
        // Trigger resize event to ensure charts render correctly
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          
          // If this is the forecast tab, make sure to redraw the chart
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
    
    // Forecast toggle
    const forecastButtons = document.querySelectorAll('.forecast-btn');
    const hourlyForecast = document.getElementById('hourlyForecast');
    const dailyForecast = document.getElementById('dailyForecast');
    
    forecastButtons.forEach(button => {
      button.addEventListener('click', function() {
        forecastButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const forecastType = this.getAttribute('data-forecast');
        if (forecastType === 'hourly') {
          hourlyForecast.style.display = 'flex';
          dailyForecast.style.display = 'none';
        } else {
          hourlyForecast.style.display = 'none';
          dailyForecast.style.display = 'flex';
        }
        
        // Trigger resize event to ensure charts render correctly
        setTimeout(() => {
          window.dispatchEvent(new Event('resize'));
          if (window.forecastChart) {
            window.forecastChart.resize();
            window.forecastChart.update();
          }
        }, 100);
      });
    });
    
    // Helper function to add "Coming Soon" text to tabs
    function addComingSoonText(tabId) {
      const tabPane = document.getElementById(tabId);
      if (tabPane) {
        // Create coming soon message if it doesn't exist
        if (!tabPane.querySelector('.coming-soon-message')) {
          const comingSoonDiv = document.createElement('div');
          comingSoonDiv.className = 'coming-soon-message glass-effect';
          comingSoonDiv.innerHTML = `
            <h3>Coming Soon</h3>
            <p>This feature is currently under development and will be available in a future update.</p>
            <div class="coming-soon-icon">
              <i class="fas fa-tools"></i>
            </div>
          `;
          tabPane.prepend(comingSoonDiv);
        }
      }
    }
    
    // Helper function to set default tab
    function setDefaultTab(tabId) {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Set the specified tab as active
      const defaultTabBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
      const defaultTabPane = document.getElementById(tabId);
      
      if (defaultTabBtn && defaultTabPane) {
        defaultTabBtn.classList.add('active');
        defaultTabPane.classList.add('active');
      }
    }
});
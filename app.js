// Add this to a new file or at the end of your main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  // Tab navigation
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons and panes
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanes.forEach(pane => pane.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      // Show corresponding tab pane
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
      
      // Trigger resize event to ensure charts render correctly
      window.dispatchEvent(new Event('resize'));
      
      // If this is the forecast tab, make sure to redraw the chart
      if (tabId === 'forecast' && window.forecastChart) {
        setTimeout(() => {
          window.forecastChart.resize();
          window.forecastChart.update();
        }, 10);
      }
      
      // If this is the historical tab, make sure to redraw the chart
      if (tabId === 'historical' && window.historicalChart) {
        setTimeout(() => {
          window.historicalChart.resize();
          window.historicalChart.update();
        }, 10);
      }
    });
  });
});
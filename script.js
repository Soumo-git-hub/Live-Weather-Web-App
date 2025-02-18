// DOM elements - using destructuring for cleaner code
const {
    'city-input': cityInput,
    'search-btn': searchButton,
    'location-btn': locationButton,
    'city-name': cityNameElement,
    'weather-description': weatherDescriptionElement,
    'temperature': temperatureElement,
    'wind-speed': windSpeedElement,
    'humidity': humidityElement,
    'air-quality': airQualityElement,
    'weather-icon': weatherIconElement,
    'forecast-list': forecastListElement,
    'weather-insights': weatherInsightsElement = document.createElement('div'), // Handle potential new element
    'search-form': searchForm,
  } = Object.fromEntries(
    ['city-input', 'search-btn', 'location-btn', 'city-name', 'weather-description', 
     'temperature', 'wind-speed', 'humidity', 'air-quality', 'weather-icon', 
     'forecast-list', 'weather-insights', 'search-form']
    .map(id => [id, document.getElementById(id)])
  );
  
  // Configuration and constants
  const CONFIG = {
    API_KEY: '4ad432a816fb1ab0e83d962d52909803',
    BASE_URL: 'https://api.openweathermap.org',
    ICONS_PATH: 'https://openweathermap.org/img/wn',
    DEFAULT_CITY: 'New York',
    UNITS: 'metric', // Use metric for Celsius
  };
  
  // Cache mechanism for weather data
  const weatherCache = {
    data: new Map(),
    set(key, data, ttl = 600000) { // 10 minutes TTL by default
      const entry = {
        data,
        expiry: Date.now() + ttl
      };
      this.data.set(key, entry);
      return data;
    },
    get(key) {
      const entry = this.data.get(key);
      if (!entry) return null;
      if (entry.expiry < Date.now()) {
        this.data.delete(key);
        return null;
      }
      return entry.data;
    }
  };
  
  /**
   * Creates a forecast card for a single day
   * @param {Object} weatherItem - Weather data for a specific day
   * @returns {string} HTML string for the forecast card
   */
  const createForecastCard = (weatherItem) => {
    const date = new Date(weatherItem.dt_txt.split(' ')[0]);
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString(undefined, options);
    const tempCelsius = (weatherItem.main.temp).toFixed(1);
    const iconCode = weatherItem.weather[0].icon;
    const description = weatherItem.weather[0].description;
    
    return `
      <li class="card">
        <h3>${formattedDate}</h3>
        <img src="${CONFIG.ICONS_PATH}/${iconCode}.png" alt="${description}" width="70" height="70">
        <p class="temp">${tempCelsius}°C</p>
        <p class="description">${description}</p>
        <div class="details">
          <p>Wind: ${weatherItem.wind.speed} m/s</p>
          <p>Humidity: ${weatherItem.main.humidity}%</p>
        </div>
      </li>
    `;
  };
  
  /**
   * Generates weather insights based on current conditions
   * @param {Object} currentWeather - Current weather data
   * @returns {string} Weather insight message
   */
  const generateWeatherInsights = (currentWeather) => {
    const temp = currentWeather.main.temp;
    const description = currentWeather.weather[0].description.toLowerCase();
    const windSpeed = currentWeather.wind.speed;
    
    let insight = '';
    
    if (temp < 5) {
      insight = 'It\'s very cold today! Make sure to wear warm clothes.';
    } else if (temp < 15) {
      insight = 'It\'s quite cool. A light jacket would be advisable.';
    } else if (temp < 25) {
      insight = 'The temperature is comfortable for outdoor activities.';
    } else {
      insight = 'It\'s quite warm today. Stay hydrated!';
    }
    
    if (description.includes('rain')) {
      insight += ' Don\'t forget your umbrella!';
    } else if (description.includes('snow')) {
      insight += ' Watch out for slippery roads!';
    } else if (description.includes('clear')) {
      insight += ' A great day for outdoor activities!';
    }
    
    if (windSpeed > 10) {
      insight += ' Be careful of strong winds today.';
    }
    
    return insight;
  };
  
  /**
   * Updates UI with weather data
   * @param {string} cityName - Name of the city
   * @param {Object} weatherData - Weather data from API
   */
  const updateWeatherUI = (cityName, weatherData) => {
    try {
      // Filter the forecasts to get only one forecast per day
      const uniqueForecastDays = new Set();
      const fiveDaysForecast = weatherData.list.filter(forecast => {
        const forecastDate = new Date(forecast.dt_txt).getDate();
        if (!uniqueForecastDays.has(forecastDate)) {
          uniqueForecastDays.add(forecastDate);
          return true;
        }
        return false;
      }).slice(0, 5); // Ensure we get exactly 5 days
      
      // Update Current Weather
      const currentWeather = fiveDaysForecast[0];
      
      // Weather description with capitalized first letter
      const description = currentWeather.weather[0].description;
      const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
      
      cityNameElement.textContent = cityName;
      weatherDescriptionElement.textContent = capitalizedDescription;
      temperatureElement.textContent = `${currentWeather.main.temp.toFixed(1)}°C`;
      windSpeedElement.textContent = currentWeather.wind.speed;
      humidityElement.textContent = currentWeather.main.humidity;
      
      // Air Quality (placeholder for now)
      airQualityElement.textContent = 'N/A';
      
      // Weather Icon
      const iconCode = currentWeather.weather[0].icon;
      weatherIconElement.src = `${CONFIG.ICONS_PATH}/${iconCode}@4x.png`;
      weatherIconElement.alt = capitalizedDescription;
      
      // Update Forecast List with animation
      forecastListElement.innerHTML = '';
      
      fiveDaysForecast.forEach((forecast, index) => {
        const html = createForecastCard(forecast);
        const tempElement = document.createElement('div');
        tempElement.innerHTML = html;
        const card = tempElement.firstElementChild;
        
        // Add fade-in animation with delay based on index
        card.style.animation = `fadeIn 0.5s ease ${index * 0.1}s forwards`;
        card.style.opacity = '0';
        
        forecastListElement.appendChild(card);
      });
      
      // Generate and update weather insights if element exists
      if (weatherInsightsElement) {
        weatherInsightsElement.textContent = generateWeatherInsights(currentWeather);
      }
      
      // Show the weather container with fade-in effect
      document.querySelector('.weather-data').classList.add('visible');
      
    } catch (error) {
      console.error('Error updating UI:', error);
      showErrorNotification('Failed to update weather display');
    }
  };
  
  /**
   * Displays error notification to user
   * @param {string} message - Error message to display
   */
  const showErrorNotification = (message) => {
    // Create notification if it doesn't exist
    let notification = document.querySelector('.error-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.className = 'error-notification';
      document.body.appendChild(notification);
    }
    
    notification.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
      notification.classList.remove('show');
    }, 5000);
  };
  
  /**
   * Fetches weather details for given coordinates
   * @param {string} cityName - Name of the city
   * @param {number} latitude - Latitude coordinate
   * @param {number} longitude - Longitude coordinate
   */
  const getWeatherDetails = async (cityName, latitude, longitude) => {
    try {
      // Check cache first
      const cacheKey = `${latitude},${longitude}`;
      const cachedData = weatherCache.get(cacheKey);
      
      if (cachedData) {
        console.log('Using cached weather data');
        updateWeatherUI(cityName, cachedData);
        return;
      }
      
      // Show loading indicator
      document.body.classList.add('loading');
      
      const WEATHER_API_URL = `${CONFIG.BASE_URL}/data/2.5/forecast?lat=${latitude}&lon=${longitude}&units=${CONFIG.UNITS}&appid=${CONFIG.API_KEY}`;
      
      const response = await fetch(WEATHER_API_URL);
      
      if (!response.ok) {
        throw new Error(`Weather API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      weatherCache.set(cacheKey, data);
      
      // Update UI with the fetched data
      updateWeatherUI(cityName, data);
      
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      showErrorNotification(`Weather data unavailable for ${cityName}`);
    } finally {
      // Hide loading indicator
      document.body.classList.remove('loading');
    }
  };
  
  /**
   * Gets coordinates for a city name
   */
  const getCityCoordinates = async () => {
    const cityName = cityInput.value.trim();
    
    if (!cityName) {
      showErrorNotification('Please enter a city name');
      return;
    }
    
    try {
      document.body.classList.add('loading');
      
      const API_URL = `${CONFIG.BASE_URL}/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${CONFIG.API_KEY}`;
      
      const response = await fetch(API_URL);
      
      if (!response.ok) {
        throw new Error(`Geocoding API returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.length) {
        throw new Error(`No coordinates found for ${cityName}`);
      }
      
      const { lat, lon, name } = data[0];
      getWeatherDetails(name, lat, lon);
      
    } catch (error) {
      console.error('Failed to get coordinates:', error);
      showErrorNotification(error.message || 'Failed to find that location');
    } finally {
      document.body.classList.remove('loading');
    }
  };
  
  /**
   * Gets user's current location coordinates
   */
  const getUserCoordinates = () => {
    if (!navigator.geolocation) {
      showErrorNotification('Geolocation is not supported by your browser');
      return;
    }
    
    document.body.classList.add('loading');
    
    navigator.geolocation.getCurrentPosition(
      async position => {
        try {
          const { latitude, longitude } = position.coords;
          
          const API_URL = `${CONFIG.BASE_URL}/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${CONFIG.API_KEY}`;
          const response = await fetch(API_URL);
          
          if (!response.ok) {
            throw new Error(`Reverse geocoding API returned ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          const { name } = data[0];
          
          getWeatherDetails(name, latitude, longitude);
        } catch (error) {
          console.error('Failed to get location name:', error);
          showErrorNotification('Failed to determine your location name');
        } finally {
          document.body.classList.remove('loading');
        }
      },
      error => {
        document.body.classList.remove('loading');
        
        if (error.code === error.PERMISSION_DENIED) {
          showErrorNotification('Location access denied. Please grant permission');
        } else {
          showErrorNotification('Failed to get your location');
        }
        
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  };
  
  // Add styles for notifications and loading state
  const addStyles = () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .error-notification {
        position: fixed;
        top: -100px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f44336;
        color: white;
        padding: 16px;
        border-radius: 4px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        transition: top 0.5s ease;
      }
      
      .error-notification.show {
        top: 20px;
      }
      
      body.loading::after {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.3);
        z-index: 999;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      
      body.loading::before {
        content: '';
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        border: 5px solid #f3f3f3;
        border-top: 5px solid #3498db;
        border-radius: 50%;
        z-index: 1000;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .weather-data {
        opacity: 0;
        transition: opacity 0.5s ease;
      }
      
      .weather-data.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(styleElement);
  };
  
  // Event Listeners
  const setupEventListeners = () => {
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        getCityCoordinates();
      });
    } else {
      searchButton.addEventListener('click', getCityCoordinates);
    }
    
    locationButton.addEventListener('click', getUserCoordinates);
    
    cityInput.addEventListener('keyup', e => {
      if (e.key === 'Enter' && !searchForm) {
        getCityCoordinates();
      }
    });
  };
  
  // Initialization
  const init = () => {
    addStyles();
    setupEventListeners();
    
    // Load default city on start
    if (CONFIG.DEFAULT_CITY) {
      cityInput.value = CONFIG.DEFAULT_CITY;
      getCityCoordinates();
    }
  };
  
  // Start the application
  document.addEventListener('DOMContentLoaded', init);
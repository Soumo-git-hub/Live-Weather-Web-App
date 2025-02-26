// Constants
const API_KEY = '4ad432a816fb1ab0e83d962d52909803';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const elements = {
    locationName: document.getElementById('locationName'),
    currentTemp: document.getElementById('currentTemp'),
    feelsLike: document.getElementById('feelsLike'),
    weatherDescription: document.getElementById('weatherDescription'),
    windSpeed: document.getElementById('windSpeed'),
    humidity: document.getElementById('humidity'),
    aqi: document.getElementById('aqi'),
    uvIndex: document.getElementById('uvIndex'),
    loadingOverlay: document.querySelector('.loading-overlay'),
    themeToggle: document.getElementById('themeToggle'),
    weatherCanvas: document.getElementById('weatherCanvas'),
    searchBtn: document.getElementById('searchBtn'),
    locationSearch: document.getElementById('locationSearch'),
    currentLocationBtn: document.getElementById('currentLocationBtn'),
    unitsToggle: document.getElementById('unitsToggle'),
    errorNotification: document.getElementById('errorNotification'),
    errorMessage: document.getElementById('errorMessage'),
    highTemp: document.getElementById('highTemp'),
    lowTemp: document.getElementById('lowTemp')
};

// State Management
const state = {
    theme: localStorage.getItem('theme') || 'light',
    units: localStorage.getItem('units') || 'metric',
    location: null,
    lastFetch: null
};

// Theme Management
function initializeTheme() {
    document.body.className = `${state.theme}-theme`;
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (!localStorage.getItem('theme')) {
        setTheme(isDarkMode ? 'dark' : 'light');
    }
    updateThemeBasedOnTime();
}

function updateThemeBasedOnTime() {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    // Only auto-switch theme if user hasn't manually selected one recently
    const lastThemeChange = localStorage.getItem('lastThemeChange');
    if (!lastThemeChange || (Date.now() - parseInt(lastThemeChange)) > 24 * 60 * 60 * 1000) {
        setTheme(isDaytime ? 'light' : 'dark');
    }
}

function setTheme(theme) {
    state.theme = theme;
    document.body.className = `${theme}-theme theme-transition`;
    localStorage.setItem('theme', theme);
    localStorage.setItem('lastThemeChange', Date.now());
    
    // Update UI to match theme
    elements.themeToggle.textContent = theme === 'light' ? '🌙' : '☀️';
    
    // Update charts with new theme
    if (typeof updateChartsTheme === 'function') {
        updateChartsTheme(theme);
    }
}

// Weather Data Fetching
async function fetchWeatherData(lat, lon) {
    showLoading(true);
    try {
        // Check if we need to use cached data
        if (state.lastFetch && Date.now() - state.lastFetch.time < 10 * 60 * 1000 &&
            state.lastFetch.lat === lat && state.lastFetch.lon === lon &&
            state.lastFetch.units === state.units) {
            // Use cached data if it's less than 10 minutes old
            const { weather, forecast, air, uvi } = state.lastFetch.data;
            updateUI(weather, forecast, air, uvi);
            return;
        }
        
        const [weather, forecast, air, uvi, historical] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/uvi?lat=${lat}&lon=${lon}&appid=${API_KEY}`)
                .then(r => r.json())
                .catch(() => ({ value: 0 })), // Fallback if UV endpoint fails
            getHistoricalData(lat, lon)
        ]);
    
        // Cache the data
        state.lastFetch = {
            time: Date.now(),
            lat, lon,
            units: state.units,
            data: { weather, forecast, air, uvi, historical }
        };
    
        updateUI(weather, forecast, air, uvi, historical);
        if (typeof updateWeatherAnimation === 'function') {
            updateWeatherAnimation(weather.weather[0].main);
        }
        updateRecommendations(weather, uvi, air);
        
        // Save the last location to localStorage
        localStorage.setItem('lastLocation', JSON.stringify({ lat, lon, name: weather.name }));
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data. Please check your connection.');
    } finally {
        showLoading(false);
    }
}

// Get historical data for the location
async function getHistoricalData(lat, lon) {
    // This would typically use a paid API endpoint
    // For demonstration, we'll generate fake historical data
    const now = new Date();
    const data = [];
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i + 1));
        
        // Generate plausible random temperature based on current weather
        const randomTemp = Math.round(15 + Math.random() * 10);
        
        data.push({
            date: date.toISOString().slice(0, 10),
            temp: randomTemp
        });
    }
    
    return { data: data.reverse() };
}

// UI Updates
function updateUI(weather, forecast, air, uvi, historical) {
    elements.locationName.textContent = weather.name;
    elements.currentTemp.textContent = `${Math.round(weather.main.temp)}°${state.units === 'metric' ? 'C' : 'F'}`;
    elements.feelsLike.textContent = `Feels like: ${Math.round(weather.main.feels_like)}°${state.units === 'metric' ? 'C' : 'F'}`;
    elements.weatherDescription.textContent = weather.weather[0].description;
    elements.windSpeed.textContent = `${weather.wind.speed} ${state.units === 'metric' ? 'm/s' : 'mph'}`;
    elements.humidity.textContent = `${weather.main.humidity}%`;
    elements.aqi.textContent = getAQIDescription(air.list[0].main.aqi);
    elements.uvIndex.textContent = uvi.value ? Math.round(uvi.value) : 'N/A';
    
    // Update high and low temperatures
    const highTemp = Math.round(weather.main.temp_max);
    const lowTemp = Math.round(weather.main.temp_min);
    elements.highLow.textContent = `H: ${highTemp}° L: ${lowTemp}°`;
    
    // Load weather icon
    const iconCode = weather.weather[0].icon;
    const weatherIcon = document.getElementById('weatherIcon');
    if (weatherIcon) {
        weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        weatherIcon.alt = weather.weather[0].description;
    }
    
    // Update charts
    if (typeof updateForecastChart === 'function') {
        updateForecastChart(forecast);
    }
    
    if (typeof updateHourlyForecast === 'function') {
        updateHourlyForecast(forecast);
    }
    
    if (historical && typeof updateHistoricalChart === 'function') {
        updateHistoricalChart(historical);
    }
}

// Weather Recommendations
function updateRecommendations(weather, uvi, air) {
    const temp = weather.main.temp;
    const conditions = weather.weather[0].main;
    const uvIndex = uvi ? uvi.value : 0;
    const airQuality = air.list[0].main.aqi;
    
    // Clothing Recommendations
    let clothing = getClothingRecommendation(temp, conditions);
    document.getElementById('clothingRecommendation').textContent = clothing;
    
    // Activity Recommendations
    let activity = getActivityRecommendation(temp, conditions, airQuality);
    document.getElementById('activityRecommendation').textContent = activity;
    
    // UV Recommendations
    let uvAdvice = getUVRecommendation(uvIndex);
    document.getElementById('uvRecommendation').textContent = uvAdvice;
}

// Search Functions
async function searchLocation(location) {
    showLoading(true);
    try {
        const geocodingResponse = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`);
        const geocodingData = await geocodingResponse.json();
    
        if (geocodingData.length > 0) {
            const { lat, lon } = geocodingData[0];
            await fetchWeatherData(lat, lon);
        } else {
            showError('Location not found. Please check the spelling and try again.');
        }
    } catch (error) {
        console.error('Error geocoding location:', error);
        showError('Failed to find location. Please check your connection.');
    } finally {
        showLoading(false);
    }
}

// Helper Functions
function getAQIDescription(aqi) {
    const descriptions = {
        1: 'Good',
        2: 'Fair',
        3: 'Moderate',
        4: 'Poor',
        5: 'Very Poor'
    };
    return descriptions[aqi] || 'Unknown';
}

function getClothingRecommendation(temp, conditions) {
    const isRainy = conditions.includes('Rain') || conditions.includes('Drizzle');
    const isSnowy = conditions.includes('Snow');
    
    if (isRainy) {
        return temp < 10 ? 'Raincoat with warm layers underneath, waterproof boots and umbrella' :
               'Light raincoat or umbrella recommended';
    }
    
    if (isSnowy) {
        return 'Heavy winter coat, waterproof boots, gloves, scarf and warm hat';
    }
    
    if (temp < 0) return 'Heavy winter coat, multiple layers, gloves, and warm hat essential';
    if (temp < 10) return 'Winter coat, hat, scarf and gloves recommended';
    if (temp < 15) return 'Light jacket or sweater recommended';
    if (temp < 20) return 'Long sleeves or light jacket may be needed';
    if (temp < 25) return 'Light clothing, consider bringing a light layer for evening';
    if (temp < 30) return 'Light, breathable clothing recommended';
    return 'Very light clothing, sun hat and light fabrics recommended';
}

function getActivityRecommendation(temp, conditions, airQuality) {
    const isRainy = conditions.includes('Rain') || conditions.includes('Drizzle');
    const isSnowy = conditions.includes('Snow');
    const isStormy = conditions.includes('Storm') || conditions.includes('Thunder');
    const isPoorAir = airQuality >= 4;
    
    if (isStormy) return 'Stay indoors and avoid travel if possible';
    if (isPoorAir) return 'Consider indoor activities due to poor air quality';
    
    if (isRainy) {
        return 'Indoor activities recommended, or visit museums/galleries';
    }
    
    if (isSnowy) {
        return temp < -5 ? 'Limited outdoor exposure recommended' : 
               'Winter sports like skiing or sledding would be perfect';
    }
    
    if (temp > 30) return 'Indoor activities or water-based activities recommended, stay hydrated';
    if (temp < 0) return 'Limited outdoor exposure recommended, indoor sports ideal';
    if (temp > 20 && temp < 30 && conditions.includes('Clear')) return 'Perfect for hiking, cycling or beach activities';
    
    return 'Good conditions for outdoor activities';
}

function getUVRecommendation(uvi) {
    if (uvi < 3) return 'Low UV risk - minimal protection needed';
    if (uvi < 6) return 'Moderate UV - wear sunscreen and protective clothing';
    if (uvi < 8) return 'High UV - limit sun exposure between 10am and 4pm';
    return 'Very high UV - avoid sun exposure during peak hours, use SPF 50+ sunscreen';
}

function showLoading(show) {
    elements.loadingOverlay.classList.toggle('active', show);
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorNotification.classList.add('active');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.errorNotification.classList.remove('active');
    }, 5000);
}

function hideError() {
    elements.errorNotification.classList.remove('active');
}

// Geolocation
function getCurrentLocation() {
    showLoading(true);
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherData(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                showError('Unable to get your location. Please check your browser settings.');
                showLoading(false);
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
        showLoading(false);
    }
}

function toggleUnits() {
    state.units = state.units === 'metric' ? 'imperial' : 'metric';
    localStorage.setItem('units', state.units);
    
    // Update UI
    elements.unitsToggle.textContent = state.units === 'metric' ? '°C' : '°F';
    
    // Refetch weather data with new units
    if (state.lastFetch) {
        fetchWeatherData(state.lastFetch.lat, state.lastFetch.lon);
    }
}

// Event Listeners
function initializeEventListeners() {
    elements.themeToggle.addEventListener('click', () => {
        setTheme(state.theme === 'light' ? 'dark' : 'light');
    });
    
    elements.searchBtn.addEventListener('click', () => {
        const location = elements.locationSearch.value;
        if (location) {
            searchLocation(location);
        }
    });
    
    elements.currentLocationBtn.addEventListener('click', getCurrentLocation);
    
    elements.locationSearch.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const location = elements.locationSearch.value;
            if (location) {
                searchLocation(location);
            }
        }
    });
    
    // Add units toggle
    if (elements.unitsToggle) {
        elements.unitsToggle.textContent = state.units === 'metric' ? '°C' : '°F';
        elements.unitsToggle.addEventListener('click', toggleUnits);
    }
    
    // Close error notification
    const closeError = document.getElementById('closeError');
    if (closeError) {
        closeError.addEventListener('click', hideError);
    }
    
    // Handle offline/online events
    window.addEventListener('online', () => {
        if (state.lastFetch) {
            fetchWeatherData(state.lastFetch.lat, state.lastFetch.lon);
        }
    });
    
    window.addEventListener('offline', () => {
        showError('You are offline. Weather data may not be current.');
    });
}

// Initialize App
function initializeApp() {
    initializeTheme();
    initializeEventListeners();
    
    // Try to load last location from localStorage
    const lastLocation = JSON.parse(localStorage.getItem('lastLocation'));
    if (lastLocation) {
        fetchWeatherData(lastLocation.lat, lastLocation.lon);
    } else {
        getCurrentLocation();
    }
    
    // Set up theme auto-switching based on time
    setInterval(updateThemeBasedOnTime, 60 * 60 * 1000); // Check every hour
}

// Start the app
initializeApp();
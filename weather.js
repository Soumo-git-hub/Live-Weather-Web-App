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
    currentLocationBtn: document.getElementById('currentLocationBtn')
};

// State Management
const state = {
    theme: localStorage.getItem('theme') || 'light',
    units: localStorage.getItem('units') || 'metric',
    location: null
};

// Theme Management
function initializeTheme() {
    document.body.className = `${state.theme}-theme`;
    updateThemeBasedOnTime();
}

function updateThemeBasedOnTime() {
    const hour = new Date().getHours();
    const isDaytime = hour >= 6 && hour <= 18;
    setTheme(isDaytime ? 'light' : 'dark');
}

function setTheme(theme) {
    state.theme = theme;
    document.body.className = `${theme}-theme theme-transition`;
    localStorage.setItem('theme', theme);
}

// Declare the missing functions
function updateWeatherAnimation(weatherCondition) {
    // Implement weather animation logic here
    console.log("Updating weather animation for:", weatherCondition);
}

function updateForecastChart(forecast) {
    // Implement forecast chart update logic here
    console.log("Updating forecast chart:", forecast);
}

function updateHourlyForecast(forecast) {
    // Implement hourly forecast update logic here
    console.log("Updating hourly forecast:", forecast);
}

async function searchLocation(location) {
    // Implement location search logic here
    console.log("Searching for location:", location);
    showLoading(true);
    try {
        const geocodingResponse = await fetch(`http://api.openweathermap.org/geo/1.0/direct?q=${location}&limit=1&appid=${API_KEY}`);
        const geocodingData = await geocodingResponse.json();

        if (geocodingData.length > 0) {
            const { lat, lon } = geocodingData[0];
            await fetchWeatherData(lat, lon);
        } else {
            showError('Location not found');
        }
    } catch (error) {
        console.error('Error geocoding location:', error);
        showError('Failed to find location');
    } finally {
        showLoading(false);
    }
}

// Weather Data Fetching
async function fetchWeatherData(lat, lon) {
    showLoading(true);
    try {
        const [weather, forecast, air] = await Promise.all([
            fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then(r => r.json()),
            fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then(r => r.json())
        ]);

        updateUI(weather, forecast, air);
        updateWeatherAnimation(weather.weather[0].main);
        updateRecommendations(weather);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        showError('Failed to fetch weather data');
    } finally {
        showLoading(false);
    }
}

// UI Updates
function updateUI(weather, forecast, air) {
    elements.locationName.textContent = weather.name;
    elements.currentTemp.textContent = `${Math.round(weather.main.temp)}°${state.units === 'metric' ? 'C' : 'F'}`;
    elements.feelsLike.textContent = `Feels like: ${Math.round(weather.main.feels_like)}°${state.units === 'metric' ? 'C' : 'F'}`;
    elements.weatherDescription.textContent = weather.weather[0].description;
    elements.windSpeed.textContent = `${weather.wind.speed} ${state.units === 'metric' ? 'm/s' : 'mph'}`;
    elements.humidity.textContent = `${weather.main.humidity}%`;
    elements.aqi.textContent = getAQIDescription(air.list[0].main.aqi);
    
    updateForecastChart(forecast);
    updateHourlyForecast(forecast);
}

// Weather Recommendations
function updateRecommendations(weather) {
    const temp = weather.main.temp;
    const conditions = weather.weather[0].main;

    // Clothing Recommendations
    let clothing = getClothingRecommendation(temp, conditions);
    document.getElementById('clothingRecommendation').textContent = clothing;

    // Activity Recommendations
    let activity = getActivityRecommendation(temp, conditions);
    document.getElementById('activityRecommendation').textContent = activity;

    // UV Recommendations
    let uvAdvice = getUVRecommendation(weather.uvi || 0);
    document.getElementById('uvRecommendation').textContent = uvAdvice;
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
    if (temp < 10) return 'Heavy winter coat, gloves, and warm hat recommended';
    if (temp < 20) return 'Light jacket or sweater recommended';
    if (temp < 30) return 'Light clothing, consider bringing a light jacket';
    return 'Light, breathable clothing recommended';
}

function getActivityRecommendation(temp, conditions) {
    if (conditions.includes('Rain')) return 'Indoor activities recommended';
    if (temp > 30) return 'Indoor activities or water-based activities recommended';
    if (temp < 5) return 'Limited outdoor exposure recommended';
    return 'Great conditions for outdoor activities';
}

function getUVRecommendation(uvi) {
    if (uvi < 3) return 'Low UV risk - minimal protection needed';
    if (uvi < 6) return 'Moderate UV - wear sunscreen and protective clothing';
    if (uvi < 8) return 'High UV - limit sun exposure between 10am and 4pm';
    return 'Very high UV - avoid sun exposure during peak hours';
}

function showLoading(show) {
    elements.loadingOverlay.classList.toggle('active', show);
}

function showError(message) {
    // Implement error notification
    console.error(message);
}

// Geolocation
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                fetchWeatherData(position.coords.latitude, position.coords.longitude);
            },
            error => {
                console.error('Geolocation error:', error);
                showError('Unable to get your location');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser');
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
}

// Initialize App
function initializeApp() {
    initializeTheme();
    initializeEventListeners();
    getCurrentLocation();
}

// Start the app
initializeApp();
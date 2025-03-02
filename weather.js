// Constants
const API_KEY = "4ad432a816fb1ab0e83d962d52909803"
const BASE_URL = "https://api.openweathermap.org/data/2.5"

// DOM Elements - with null checking
const elements = {
  locationName: document.getElementById("locationName"),
  currentTemp: document.getElementById("currentTemp"),
  feelsLike: document.getElementById("feelsLike"),
  weatherDescription: document.getElementById("weatherDescription"),
  windSpeed: document.getElementById("windSpeed"),
  humidity: document.getElementById("humidity"),
  aqi: document.getElementById("aqi"),
  uvIndex: document.getElementById("uvIndex"),
  loadingOverlay: document.querySelector(".loading-overlay"),
  themeToggle: document.getElementById("themeToggle"),
  weatherCanvas: document.getElementById("weatherCanvas"),
  searchBtn: document.getElementById("searchBtn"),
  locationSearch: document.getElementById("locationSearch"),
  currentLocationBtn: document.getElementById("currentLocationBtn"),
  unitsToggle: document.getElementById("unitsToggle"),
  errorNotification: document.getElementById("errorNotification"),
  errorMessage: document.getElementById("errorMessage"),
  highTemp: document.getElementById("highTemp"),
  lowTemp: document.getElementById("lowTemp"),
  clothingRecommendation: document.getElementById("clothingRecommendation"),
  activityRecommendation: document.getElementById("activityRecommendation"),
  uvRecommendation: document.getElementById("uvRecommendation"),
  closeError: document.getElementById("closeError"),
  weatherIcon: document.getElementById("weatherIcon"),
  lastUpdated: document.getElementById("lastUpdated"),
  refreshBtn: document.getElementById("refreshBtn"),
  sunriseTime: document.getElementById("sunriseTime"),
  sunsetTime: document.getElementById("sunsetTime"),
  sunPosition: document.getElementById("sunPosition"),
  locationTime: document.getElementById("locationTime"),
}

// State Management
const state = {
  theme: localStorage.getItem("theme") || "light",
  units: localStorage.getItem("units") || "metric",
  location: null,
  lastFetch: null,
}

// Make state available globally for other scripts
window.state = state

// Declare these variables to avoid errors
let updateChartsTheme
let updateForecastChart
let updateHistoricalChart

// Theme Management
function initializeTheme() {
  document.body.className = `${state.theme}-theme`
  const isDarkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  if (!localStorage.getItem("theme")) {
    setTheme(isDarkMode ? "dark" : "light")
  }
  updateThemeBasedOnTime()
}

function updateThemeBasedOnTime() {
  const hour = new Date().getHours()
  const isDaytime = hour >= 6 && hour <= 18
  // Only auto-switch theme if user hasn't manually selected one recently
  const lastThemeChange = localStorage.getItem("lastThemeChange")
  if (!lastThemeChange || Date.now() - Number.parseInt(lastThemeChange) > 24 * 60 * 60 * 1000) {
    setTheme(isDaytime ? "light" : "dark")
  }
}

function setTheme(theme) {
  state.theme = theme
  document.body.className = `${theme}-theme theme-transition`
  localStorage.setItem("theme", theme)
  localStorage.setItem("lastThemeChange", Date.now())

  // Update UI to match theme
  if (elements.themeToggle) {
    elements.themeToggle.textContent = theme === "light" ? "🌙" : "☀️"
  }

  // Update charts with new theme
  if (typeof updateChartsTheme === "function") {
    updateChartsTheme(theme)
  }
}

// Weather Data Fetching
async function fetchWeatherData(lat, lon) {
  showLoading(true)
  try {
    // Check if we need to use cached data
    if (
      state.lastFetch &&
      Date.now() - state.lastFetch.time < 10 * 60 * 1000 &&
      state.lastFetch.lat === lat &&
      state.lastFetch.lon === lon &&
      state.lastFetch.units === state.units
    ) {
      // Use cached data if it's less than 10 minutes old
      const { weather, forecast, air, uvi, historical } = state.lastFetch.data
      updateUI(weather, forecast, air, uvi, historical)
      return
    }

    // Fetch current weather and forecast data
    const [weather, forecast, air] = await Promise.all([
      fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then((r) => r.json()),
      fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${state.units}&appid=${API_KEY}`).then((r) => r.json()),
      fetch(`${BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`).then((r) => r.json()),
    ])

    // Fetch One Call API data for UV index and other current details
    const oneCall = await fetch(
      `${BASE_URL}/onecall?lat=${lat}&lon=${lon}&units=${state.units}&exclude=minutely,alerts&appid=${API_KEY}`
    ).then((r) => r.json())

    // Extract UV index from One Call API
    const uvi = { 
      value: oneCall.current?.uvi !== undefined ? oneCall.current.uvi : 0 
    }

    // Get historical data
    const historical = await getHistoricalData(lat, lon)

    // Cache the data
    state.lastFetch = {
      time: Date.now(),
      lat,
      lon,
      units: state.units,
      data: { weather, forecast, air, uvi, historical, oneCall },
    }

    // Update UI components
    updateUI(weather, forecast, air, uvi, historical)
    updateSunPosition(weather)

    if (typeof updateWeatherAnimation === "function") {
      updateWeatherAnimation(weather.weather[0].main)
    }

    updateRecommendations(weather, uvi, air)

    // Update last updated time
    const now = new Date()
    if (elements.lastUpdated) {
      elements.lastUpdated.textContent = now.toLocaleTimeString()
    }

    // Save the last location to localStorage
    localStorage.setItem("lastLocation", JSON.stringify({ lat, lon, name: weather.name }))
  } catch (error) {
    console.error("Error fetching weather data:", error)
    showError(`Failed to fetch weather data: ${error.message}`)
  } finally {
    showLoading(false)
  }
}

// Get historical data for the location
async function getHistoricalData(lat, lon) {
  // This would typically use a paid API endpoint
  // For demonstration, we'll generate fake historical data
  const now = new Date()
  const data = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (i + 1))

    // Generate plausible random temperature based on current weather
    const randomTemp = Math.round(15 + Math.random() * 10)

    data.push({
      date: date.toISOString().slice(0, 10),
      temp: randomTemp,
    })
  }

  return { data: data.reverse() }
}

// Update sun position indicator
function updateSunPosition(weather) {
  if (!weather.sys || !weather.sys.sunrise || !weather.sys.sunset) {
    console.warn("Missing sunrise/sunset data for sun position")
    return
  }

  const now = Date.now() / 1000 // Current time in seconds
  const sunrise = weather.sys.sunrise
  const sunset = weather.sys.sunset
  const dayLength = sunset - sunrise

  // Format sunrise/sunset times
  const sunriseDate = new Date(sunrise * 1000)
  const sunsetDate = new Date(sunset * 1000)
  
  if (elements.sunriseTime) {
    elements.sunriseTime.textContent = sunriseDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  
  if (elements.sunsetTime) {
    elements.sunsetTime.textContent = sunsetDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  // Update location time
  if (elements.locationTime) {
    const locationDate = new Date()
    elements.locationTime.textContent = `Local time: ${locationDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  // Calculate sun position percentage
  let positionPercent = 0

  if (now < sunrise) {
    // Before sunrise
    positionPercent = 0
  } else if (now > sunset) {
    // After sunset
    positionPercent = 100
  } else {
    // During day
    positionPercent = ((now - sunrise) / dayLength) * 100
  }

  // Update sun position indicator
  if (elements.sunPosition) {
    elements.sunPosition.style.left = `${positionPercent}%`
  }
}

// UI Updates
function updateUI(weather, forecast, air, uvi, historical) {
  if (!weather || !forecast) {
    console.error("Invalid weather or forecast data")
    return
  }

  // Safety checks for DOM elements before updating
  if (elements.locationName) {
    elements.locationName.textContent = weather.name
  }
  
  if (elements.currentTemp) {
    elements.currentTemp.textContent = `${Math.round(weather.main.temp)}°${state.units === "metric" ? "C" : "F"}`
  }
  
  if (elements.feelsLike) {
    elements.feelsLike.textContent = `Feels like: ${Math.round(weather.main.feels_like)}°${state.units === "metric" ? "C" : "F"}`
  }
  
  if (elements.weatherDescription && weather.weather && weather.weather[0]) {
    elements.weatherDescription.textContent = weather.weather[0].description
  }
  
  if (elements.windSpeed) {
    const speedKmph = state.units === "metric" 
      ? weather.wind.speed * 3.6 // Convert m/s to km/h
      : weather.wind.speed * 1.609; // Convert mph to km/h
    
    elements.windSpeed.textContent = `${speedKmph.toFixed(2)} km/h`;
  }
  
  if (elements.humidity) {
    elements.humidity.textContent = `${weather.main.humidity}%`
  }

  // Update AQI with indicator class
  if (elements.aqi && air && air.list && air.list[0]) {
    const aqiValue = air.list[0].main.aqi
    elements.aqi.textContent = getAQIDescription(aqiValue)

    const aqiIndicator = document.getElementById("aqiIndicator")
    if (aqiIndicator) {
      aqiIndicator.className = "quality-indicator"
      if (aqiValue <= 2) aqiIndicator.classList.add("quality-good")
      else if (aqiValue <= 3) aqiIndicator.classList.add("quality-moderate")
      else if (aqiValue <= 4) aqiIndicator.classList.add("quality-poor")
      else aqiIndicator.classList.add("quality-bad")
    }
  }

  // Update UV index with indicator class
  if (elements.uvIndex) {
    // Fixed UV index display - ensure we have a valid value
    const uvValue = typeof uvi.value === 'number' ? uvi.value : 0
    elements.uvIndex.textContent = uvValue ? uvValue.toFixed(1) : "N/A"

    const uvIndicator = document.getElementById("uvIndicator")
    if (uvIndicator) {
      uvIndicator.className = "quality-indicator"
      if (uvValue < 3) uvIndicator.classList.add("quality-good")
      else if (uvValue < 6) uvIndicator.classList.add("quality-moderate")
      else if (uvValue < 8) uvIndicator.classList.add("quality-poor")
      else uvIndicator.classList.add("quality-bad")
    }
  }

  // Update high and low temperatures
  if (elements.highTemp && elements.lowTemp) {
    const highTemp = Math.round(weather.main.temp_max)
    const lowTemp = Math.round(weather.main.temp_min)
    elements.highTemp.textContent = `H: ${highTemp}°`
    elements.lowTemp.textContent = `L: ${lowTemp}°`
  }

  // Load weather icon
  if (elements.weatherIcon && weather.weather && weather.weather[0]) {
    const iconCode = weather.weather[0].icon
    elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`
    elements.weatherIcon.alt = weather.weather[0].description
  }

  // Update hourly forecast
  updateHourlyForecast(forecast)

  // Update charts
  if (typeof updateForecastChart === "function") {
    updateForecastChart(forecast)
  }

  if (historical && typeof updateHistoricalChart === "function") {
    updateHistoricalChart(historical)
  }
}

// Update hourly forecast
function updateHourlyForecast(forecast) {
  const hourlyContainer = document.getElementById("hourlyForecast")
  if (!hourlyContainer || !forecast || !forecast.list) return

  // Clear previous forecast
  hourlyContainer.innerHTML = ""

  // Add hourly items
  forecast.list.slice(0, 8).forEach((item) => {
    const date = new Date(item.dt * 1000)
    const hour = date.toLocaleTimeString([], { hour: "2-digit" })
    const temp = Math.round(item.main.temp)
    const iconCode = item.weather[0].icon
    const description = item.weather[0].description

    const hourlyItem = document.createElement("div")
    hourlyItem.className = "hourly-item"
    hourlyItem.innerHTML = `
            <div class="hourly-time">${hour}</div>
            <img src="https://openweathermap.org/img/wn/${iconCode}.png" alt="${description}" class="hourly-icon">
            <div class="hourly-temp">${temp}°</div>
            <div class="hourly-detail">${item.main.humidity}% <i class="fas fa-tint"></i></div>
        `

    hourlyContainer.appendChild(hourlyItem)
  })
}

// Weather Recommendations
function updateRecommendations(weather, uvi, air) {
  if (!weather || !weather.main || !weather.weather || !weather.weather[0]) {
    console.error("Invalid weather data for recommendations")
    return
  }

  const temp = weather.main.temp
  const conditions = weather.weather[0].main
  const uvIndex = uvi && typeof uvi.value === 'number' ? uvi.value : 0
  const airQuality = air && air.list && air.list[0] ? air.list[0].main.aqi : 1

  // Try importing recommendation functions from recommendations.js
  const importPromise = import("./recommendations.js")
    .then((module) => {
      // Clothing Recommendations
      if (elements.clothingRecommendation) {
        const clothing = module.getClothingRecommendation(temp, conditions)
        elements.clothingRecommendation.textContent = clothing
      }

      // Activity Recommendations
      if (elements.activityRecommendation) {
        const activity = module.getActivityRecommendation(temp, conditions, airQuality)
        elements.activityRecommendation.textContent = activity
      }

      // UV Recommendations
      if (elements.uvRecommendation) {
        const uvAdvice = module.getUVRecommendation(uvIndex)
        elements.uvRecommendation.textContent = uvAdvice
      }
    })
    .catch((error) => {
      console.warn("Using fallback recommendation functions:", error)
      // Fallback to inline functions if module loading fails
      if (elements.clothingRecommendation) {
        elements.clothingRecommendation.textContent = getClothingRecommendation(temp, conditions)
      }
      
      if (elements.activityRecommendation) {
        elements.activityRecommendation.textContent = getActivityRecommendation(temp, conditions, airQuality)
      }
      
      if (elements.uvRecommendation) {
        elements.uvRecommendation.textContent = getUVRecommendation(uvIndex)
      }
    })

  // Set a timeout to use fallback if import takes too long
  setTimeout(() => {
    importPromise.catch(() => {
      // Already handled in the catch above
    })
  }, 2000)
}

// Search Functions
async function searchLocation(location) {
  if (!location || location.trim() === "") {
    showError("Please enter a location name")
    return
  }
  
  showLoading(true)
  try {
    const geocodingResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${API_KEY}`
    )
    
    if (!geocodingResponse.ok) {
      throw new Error(`Geocoding API error: ${geocodingResponse.status}`)
    }
    
    const geocodingData = await geocodingResponse.json()

    if (geocodingData.length > 0) {
      const { lat, lon } = geocodingData[0]
      await fetchWeatherData(lat, lon)
    } else {
      showError("Location not found. Please check the spelling and try again.")
    }
  } catch (error) {
    console.error("Error geocoding location:", error)
    showError(`Failed to find location: ${error.message}`)
  } finally {
    showLoading(false)
  }
}

// Helper Functions
function getAQIDescription(aqi) {
  const descriptions = {
    1: "Good",
    2: "Fair",
    3: "Moderate",
    4: "Poor",
    5: "Very Poor",
  }
  return descriptions[aqi] || "Unknown"
}

// Fallback recommendation functions in case module loading fails
function getClothingRecommendation(temp, conditions) {
  const isRainy = conditions.includes("Rain") || conditions.includes("Drizzle")
  const isSnowy = conditions.includes("Snow")

  if (isRainy) {
    return temp < 10
      ? "Raincoat with warm layers underneath, waterproof boots and umbrella"
      : "Light raincoat or umbrella recommended"
  }

  if (isSnowy) {
    return "Heavy winter coat, waterproof boots, gloves, scarf and warm hat"
  }

  if (temp < 0) return "Heavy winter coat, multiple layers, gloves, and warm hat essential"
  if (temp < 10) return "Winter coat, hat, scarf and gloves recommended"
  if (temp < 15) return "Light jacket or sweater recommended"
  if (temp < 20) return "Long sleeves or light jacket may be needed"
  if (temp < 25) return "Light clothing, consider bringing a light layer for evening"
  if (temp < 30) return "Light, breathable clothing recommended"
  return "Very light clothing, sun hat and light fabrics recommended"
}

function getActivityRecommendation(temp, conditions, airQuality) {
  const isRainy = conditions.includes("Rain") || conditions.includes("Drizzle")
  const isSnowy = conditions.includes("Snow")
  const isStormy = conditions.includes("Storm") || conditions.includes("Thunder")
  const isPoorAir = airQuality >= 4

  if (isStormy) return "Stay indoors and avoid travel if possible"
  if (isPoorAir) return "Consider indoor activities due to poor air quality"

  if (isRainy) {
    return "Indoor activities recommended, or visit museums/galleries"
  }

  if (isSnowy) {
    return temp < -5 ? "Limited outdoor exposure recommended" : "Winter sports like skiing or sledding would be perfect"
  }

  if (temp > 30) return "Indoor activities or water-based activities recommended, stay hydrated"
  if (temp < 0) return "Limited outdoor exposure recommended, indoor sports ideal"
  if (temp > 20 && temp < 30 && conditions.includes("Clear")) return "Perfect for hiking, cycling or beach activities"

  return "Good conditions for outdoor activities"
}

function getUVRecommendation(uvi) {
  if (uvi < 3) return "Low UV risk - minimal protection needed"
  if (uvi < 6) return "Moderate UV - wear sunscreen and protective clothing"
  if (uvi < 8) return "High UV - limit sun exposure between 10am and 4pm"
  return "Very high UV - avoid sun exposure during peak hours, use SPF 50+ sunscreen"
}

function showLoading(show) {
  if (elements.loadingOverlay) {
    elements.loadingOverlay.classList.toggle("active", show)
  }
}

function showError(message) {
  console.error("Error:", message) // Always log to console first
  
  if (elements.errorMessage && elements.errorNotification) {
    elements.errorMessage.textContent = message
    elements.errorNotification.classList.add("active")

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (elements.errorNotification) {
        elements.errorNotification.classList.remove("active")
      }
    }, 5000)
  } else {
    // Fallback if error elements aren't available
    alert(message)
  }
}

function hideError() {
  if (elements.errorNotification) {
    elements.errorNotification.classList.remove("active")
  }
}

// Geolocation
function getCurrentLocation() {
  showLoading(true)
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error("Geolocation error:", error)
        let errorMsg = "Unable to get your location. "
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Please enable location permissions in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMsg += "Location request timed out."
            break
          default:
            errorMsg += "Please check your browser settings."
        }
        
        showError(errorMsg)
        showLoading(false)
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000,
        maximumAge: 0
      }
    )
  } else {
    showError("Geolocation is not supported by your browser")
    showLoading(false)
  }
}

function toggleUnits() {
  state.units = state.units === "metric" ? "imperial" : "metric"
  localStorage.setItem("units", state.units)

  // Update UI
  if (elements.unitsToggle) {
    elements.unitsToggle.textContent = state.units === "metric" ? "°C" : "°F"
  }

  // Refetch weather data with new units
  if (state.lastFetch) {
    fetchWeatherData(state.lastFetch.lat, state.lastFetch.lon)
  }
}

// Update weather animation based on weather condition
function updateWeatherAnimation(weatherCondition) {
  if (typeof window.weatherAnimations === "undefined") {
    console.warn("Weather animations not available")
    return
  }

  let animationType = "Clear"

  if (weatherCondition.includes("Rain") || weatherCondition.includes("Drizzle")) {
    animationType = "Rain"
  } else if (weatherCondition.includes("Snow")) {
    animationType = "Snow"
  } else if (weatherCondition.includes("Cloud")) {
    animationType = "Cloudy"
  } else if (weatherCondition.includes("Thunder")) {
    animationType = "Thunder"
  }

  window.weatherAnimations.start(animationType)
}

// Event Listeners
function initializeEventListeners() {
  // Theme toggle
  if (elements.themeToggle) {
    elements.themeToggle.addEventListener("click", () => {
      setTheme(state.theme === "light" ? "dark" : "light")
    })
  }

  // Search button
  if (elements.searchBtn && elements.locationSearch) {
    elements.searchBtn.addEventListener("click", () => {
      const location = elements.locationSearch.value
      if (location) {
        searchLocation(location)
      }
    })
  }

  // Current location button
  if (elements.currentLocationBtn) {
    elements.currentLocationBtn.addEventListener("click", getCurrentLocation)
  }

  // Search input field
  if (elements.locationSearch) {
    elements.locationSearch.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const location = elements.locationSearch.value
        if (location) {
          searchLocation(location)
        }
      }
    })
  }

  // Units toggle
  if (elements.unitsToggle) {
    elements.unitsToggle.textContent = state.units === "metric" ? "°C" : "°F"
    elements.unitsToggle.addEventListener("click", toggleUnits)
  }

  // Close error notification
  if (elements.closeError) {
    elements.closeError.addEventListener("click", hideError)
  }

  // Refresh button
  if (elements.refreshBtn) {
    elements.refreshBtn.addEventListener("click", () => {
      if (state.lastFetch) {
        fetchWeatherData(state.lastFetch.lat, state.lastFetch.lon)
      } else {
        getCurrentLocation()
      }
    })
  }

  // Handle offline/online events
  window.addEventListener("online", () => {
    if (state.lastFetch) {
      fetchWeatherData(state.lastFetch.lat, state.lastFetch.lon)
    }
  })

  window.addEventListener("offline", () => {
    showError("You are offline. Weather data may not be current.")
  })
}

// Initialize App
function initializeApp() {
  // Check if all needed DOM elements exist
  const criticalElements = [
    "locationName", "currentTemp", "weatherDescription",
    "searchBtn", "locationSearch", "loadingOverlay"
  ]
  
  const missingElements = criticalElements.filter(el => !elements[el])
  
  if (missingElements.length > 0) {
    console.error(`Missing critical DOM elements: ${missingElements.join(", ")}`)
    showError("App initialization failed. Please check the console for details.")
    return
  }

  initializeTheme()
  initializeEventListeners()

  // Try to load last location from localStorage
  try {
    const lastLocation = JSON.parse(localStorage.getItem("lastLocation"))
    if (lastLocation && lastLocation.lat && lastLocation.lon) {
      fetchWeatherData(lastLocation.lat, lastLocation.lon)
    } else {
      getCurrentLocation()
    }
  } catch (error) {
    console.warn("Error loading last location, getting current location instead:", error)
    getCurrentLocation()
  }

  // Set up theme auto-switching based on time
  setInterval(updateThemeBasedOnTime, 60 * 60 * 1000) // Check every hour
}

// Start the app when DOM is fully loaded
document.addEventListener("DOMContentLoaded", initializeApp)
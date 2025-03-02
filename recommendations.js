// Weather Recommendations

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

// New function for food recommendations based on weather
function getFoodRecommendation(temp, conditions) {
    const isRainy = conditions.includes("Rain") || conditions.includes("Drizzle")
    const isSnowy = conditions.includes("Snow")
    const isHot = temp > 25
    const isCold = temp < 10

    if (isHot) {
        return "Focus on hydrating foods like watermelon, cucumber, and leafy greens. Light meals like salads and cold soups are ideal."
    } else if (isCold) {
        return "Warming foods like soups, stews, and hot cereals. Include root vegetables and warming spices like ginger and cinnamon."
    } else if (isRainy) {
        return "Comfort foods like soups and warm beverages. Include vitamin C rich foods to boost immunity."
    } else if (isSnowy) {
        return "Hearty meals with complex carbs for sustained energy. Hot beverages with cinnamon or ginger to maintain body warmth."
    } else {
        return "Balanced meals with seasonal produce. Include a mix of proteins, whole grains, and fresh vegetables."
    }
}

// New function for water intake recommendations
function getWaterRecommendation(temp, conditions, activityLevel = "moderate") {
    // Base recommendation (in liters) - 2.5L for men, 2L for women on average
    let baseRecommendation = 2.3
    
    // Adjust for temperature
    if (temp > 30) {
        baseRecommendation += 1.0 // Add 1L for very hot weather
    } else if (temp > 25) {
        baseRecommendation += 0.5 // Add 500ml for hot weather
    } else if (temp < 5) {
        baseRecommendation -= 0.2 // Slightly less in very cold weather (but still important)
    }
    
    // Adjust for humidity and conditions
    if (conditions.includes("Humid") || conditions.includes("Mist")) {
        baseRecommendation += 0.3 // Add 300ml for humid conditions
    }
    
    // Adjust for activity level
    if (activityLevel === "high") {
        baseRecommendation += 1.0 // Add 1L for high activity
    } else if (activityLevel === "low") {
        baseRecommendation -= 0.3 // Reduce by 300ml for low activity
    }
    
    // Format the recommendation
    const liters = baseRecommendation.toFixed(1)
    const cups = Math.round(baseRecommendation * 4) // Approximate cups (250ml per cup)
    
    return `Aim for about ${liters} liters (${cups} cups) of water today. ${
        temp > 25 ? "Remember to drink more if you're active outdoors." : 
        "Include herbal teas and water-rich foods in your daily intake."
    }`
}

// Export functions for use in other scripts
export { 
    getClothingRecommendation, 
    getActivityRecommendation, 
    getUVRecommendation,
    getFoodRecommendation,
    getWaterRecommendation
}
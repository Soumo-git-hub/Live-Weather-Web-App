// Weather Recommendations

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

// Export functions for use in other scripts
export { getClothingRecommendation, getActivityRecommendation, getUVRecommendation };
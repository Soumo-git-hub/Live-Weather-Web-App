// Canvas Setup
const canvas = document.getElementById("weatherCanvas")
const ctx = canvas.getContext("2d")

// Animation Configuration
const ANIMATION_CONFIG = {
  RAIN_DROPS: 100,
  SNOW_FLAKES: 80,
  SUN_RAYS: 12,
  CLOUDS: 5,
  THUNDER_CHANCE: 0.01,
  THUNDER_DURATION: 5,
  WIND_PARTICLES: 60,
  MIST_PARTICLES: 200,
}

// Performance optimization
let lastFrameTime = 0
const targetFPS = 30
const frameInterval = 1000 / targetFPS
let animationPaused = false
let currentAnimation = null // Declare currentAnimation

// Resize canvas to match container
function resizeCanvas() {
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  if (currentAnimation) {
    currentAnimation.init()
  }
}

// Handle visibility and resize events
window.addEventListener("resize", debounce(resizeCanvas, 250))
window.addEventListener("orientationchange", resizeCanvas)
resizeCanvas()

// Debounce function for resize events
function debounce(func, wait) {
  let timeout
  return function () {
    
    const args = arguments
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Weather Animation Types
const weatherAnimations = {
    Rain: {
        particles: [],
        puddles: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.RAIN_DROPS }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 10 + 10,
                speed: Math.random() * 15 + 15,
                thickness: Math.random() * 2 + 1
            }));
            
            this.puddles = Array.from({ length: 10 }, () => ({
                x: Math.random() * canvas.width,
                y: canvas.height - Math.random() * 100,
                radius: Math.random() * 20 + 10,
                ripples: []
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw rain background
            ctx.fillStyle = isDarkMode ? 'rgba(0, 10, 20, 0.05)' : 'rgba(200, 210, 240, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw raindrops
            ctx.strokeStyle = isDarkMode ? 'rgba(120, 160, 255, 0.6)' : 'rgba(100, 140, 240, 0.6)';
            ctx.lineWidth = 1;
            
            this.particles.forEach(drop => {
                ctx.beginPath();
                ctx.moveTo(drop.x, drop.y);
                ctx.lineTo(drop.x, drop.y + drop.length);
                ctx.stroke();
                
                // Move raindrop
                drop.y += drop.speed;
                
                // Reset raindrop when it goes off screen
                if (drop.y > canvas.height) {
                    drop.y = -drop.length;
                    drop.x = Math.random() * canvas.width;
                    
                    // Add ripple to nearest puddle
                    const nearestPuddle = this.puddles.reduce((nearest, puddle) => {
                        const distance = Math.abs(puddle.x - drop.x);
                        return distance < Math.abs(nearest.x - drop.x) ? puddle : nearest;
                    }, this.puddles[0]);
                    
                    if (Math.abs(nearestPuddle.x - drop.x) < nearestPuddle.radius * 2) {
                        nearestPuddle.ripples.push({
                            radius: 1,
                            maxRadius: Math.random() * 10 + 5,
                            x: drop.x,
                            y: nearestPuddle.y - Math.random() * 5,
                            opacity: 0.7
                        });
                    }
                }
            });
            
            // Draw puddles and ripples
            this.puddles.forEach(puddle => {
                // Draw puddle
                const puddleGradient = ctx.createRadialGradient(
                    puddle.x, puddle.y, 0,
                    puddle.x, puddle.y, puddle.radius
                );
                puddleGradient.addColorStop(0, isDarkMode ? 'rgba(30, 50, 80, 0.4)' : 'rgba(150, 180, 255, 0.4)');
                puddleGradient.addColorStop(1, isDarkMode ? 'rgba(30, 50, 80, 0.1)' : 'rgba(150, 180, 255, 0.1)');
                
                ctx.fillStyle = puddleGradient;
                ctx.beginPath();
                ctx.ellipse(puddle.x, puddle.y, puddle.radius, puddle.radius / 3, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw ripples
                puddle.ripples.forEach((ripple, index) => {
                    ctx.strokeStyle = isDarkMode ? 
                        `rgba(100, 150, 255, ${ripple.opacity})` : 
                        `rgba(255, 255, 255, ${ripple.opacity})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.ellipse(ripple.x, ripple.y, ripple.radius, ripple.radius / 3, 0, 0, Math.PI * 2);
                    ctx.stroke();
                    
                    // Expand ripple
                    ripple.radius += 0.3;
                    ripple.opacity -= 0.02;
                    
                    // Remove old ripples
                    if (ripple.opacity <= 0 || ripple.radius >= ripple.maxRadius) {
                        puddle.ripples.splice(index, 1);
                    }
                });
            });
        }
    },
    Snow: {
        particles: [],
        groundSnow: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.SNOW_FLAKES }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                wind: Math.random() * 1 - 0.5,
                wobble: Math.random() * 0.1,
                wobbleSpeed: Math.random() * 0.05
            }));
            
            this.groundSnow = Array.from({ length: 20 }, (_, i) => ({
                x: (canvas.width / 20) * i,
                y: canvas.height,
                height: 0,
                targetHeight: Math.random() * 30 + 10
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw snow background
            ctx.fillStyle = isDarkMode ? 'rgba(10, 15, 25, 0.05)' : 'rgba(230, 240, 255, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw snowflakes
            this.particles.forEach(flake => {
                ctx.fillStyle = isDarkMode ? 'rgba(200, 210, 255, 0.8)' : 'rgba(255, 255, 255, 0.8)';
                ctx.beginPath();
                ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Move snowflake
                flake.y += flake.speed;
                flake.x += flake.wind + Math.sin(Date.now() * flake.wobbleSpeed) * flake.wobble;
                
                // Reset snowflake when it goes off screen
                if (flake.y > canvas.height) {
                    flake.y = -flake.radius;
                    flake.x = Math.random() * canvas.width;
                    
                    // Add to ground snow
                    const groundIndex = Math.floor(flake.x / (canvas.width / this.groundSnow.length));
                    if (groundIndex >= 0 && groundIndex < this.groundSnow.length) {
                        if (this.groundSnow[groundIndex].height < this.groundSnow[groundIndex].targetHeight) {
                            this.groundSnow[groundIndex].height += 0.1;
                        }
                    }
                }
                
                // Wrap around edges
                if (flake.x > canvas.width) flake.x = 0;
                if (flake.x < 0) flake.x = canvas.width;
            });
            
            // Draw ground snow
            ctx.fillStyle = isDarkMode ? 'rgba(200, 210, 255, 0.3)' : 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);
            
            this.groundSnow.forEach((point, index) => {
                const x = point.x;
                const y = canvas.height - point.height;
                
                if (index === 0) {
                    ctx.lineTo(x, y);
                } else {
                    const prevX = this.groundSnow[index - 1].x;
                    const prevY = canvas.height - this.groundSnow[index - 1].height;
                    const cpX = (prevX + x) / 2;
                    
                    ctx.quadraticCurveTo(cpX, prevY, x, y);
                }
            });
            
            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();
            ctx.fill();
        }
    },
    Clear: {
        sunPosition: { x: 0, y: 0 },
        rays: [],
        clouds: [],
        birds: [],
        init: function() {
            this.sunPosition = {
                x: canvas.width * 0.8,
                y: canvas.height * 0.2
            };
            
            this.rays = Array.from({ length: ANIMATION_CONFIG.SUN_RAYS }, (_, i) => ({
                angle: (i / ANIMATION_CONFIG.SUN_RAYS) * Math.PI * 2,
                length: Math.random() * 30 + 50,
                width: Math.random() * 2 + 1,
                speed: Math.random() * 0.002 + 0.001
            }));
            
            this.clouds = Array.from({ length: 3 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 3),
                size: Math.random() * 0.5 + 0.5,
                speed: Math.random() * 0.2 + 0.1
            }));
            
            this.birds = Array.from({ length: 5 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 2) + canvas.height / 4,
                size: Math.random() * 0.5 + 0.5,
                speed: Math.random() * 1 + 0.5,
                wingAngle: 0,
                wingSpeed: Math.random() * 0.1 + 0.05
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            if (isDarkMode) {
                skyGradient.addColorStop(0, 'rgba(20, 30, 60, 0.1)');
                skyGradient.addColorStop(1, 'rgba(40, 50, 80, 0.05)');
            } else {
                skyGradient.addColorStop(0, 'rgba(135, 206, 235, 0.1)');
                skyGradient.addColorStop(1, 'rgba(200, 230, 255, 0.05)');
            }
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw sun
            const sunGradient = ctx.createRadialGradient(
                this.sunPosition.x, this.sunPosition.y, 0,
                this.sunPosition.x, this.sunPosition.y, 40
            );
            if (isDarkMode) {
                sunGradient.addColorStop(0, 'rgba(255, 210, 120, 0.8)');
                sunGradient.addColorStop(1, 'rgba(255, 180, 80, 0)');
            } else {
                sunGradient.addColorStop(0, 'rgba(255, 230, 150, 0.8)');
                sunGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
            }
            
            ctx.fillStyle = sunGradient;
            ctx.beginPath();
            ctx.arc(this.sunPosition.x, this.sunPosition.y, 40, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw sun rays
            this.rays.forEach(ray => {
                const startX = this.sunPosition.x;
                const startY = this.sunPosition.y;
                const angle = ray.angle + Date.now() * ray.speed;
                const endX = startX + Math.cos(angle) * ray.length;
                const endY = startY + Math.sin(angle) * ray.length;
                
                ctx.strokeStyle = isDarkMode ? 
                    'rgba(255, 200, 100, 0.2)' : 
                    'rgba(255, 230, 150, 0.3)';
                ctx.lineWidth = ray.width;
                
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });
            
            // Draw clouds
            this.clouds.forEach(cloud => {
                ctx.save();
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.size, cloud.size);
                
                const cloudColor = isDarkMode ? 
                    'rgba(200, 210, 255, 0.3)' : 
                    'rgba(255, 255, 255, 0.5)';
                
                ctx.fillStyle = cloudColor;
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.arc(25, -10, 25, 0, Math.PI * 2);
                ctx.arc(-25, -10, 25, 0, Math.PI * 2);
                ctx.arc(10, 10, 20, 0, Math.PI * 2);
                ctx.arc(-10, 10, 20, 0, Math.PI * 2);
                ctx.fill
                ctx.restore();
                
                // Move clouds
                cloud.x += cloud.speed;
                if (cloud.x > canvas.width + 100) {
                    cloud.x = -100;
                }
            });
            
            // Draw birds
            this.birds.forEach(bird => {
                ctx.save();
                ctx.translate(bird.x, bird.y);
                ctx.scale(bird.size, bird.size);
                
                // Update wing angle
                bird.wingAngle += bird.wingSpeed;
                
                // Draw bird
                ctx.strokeStyle = isDarkMode ? 'rgba(200, 200, 200, 0.6)' : 'rgba(50, 50, 50, 0.6)';
                ctx.lineWidth = 2;
                
                // Left wing
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, Math.sin(bird.wingAngle) * 5);
                ctx.stroke();
                
                // Right wing
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(10, Math.sin(bird.wingAngle + Math.PI) * 5);
                ctx.stroke();
                
                ctx.restore();
                
                // Move birds
                bird.x += bird.speed;
                if (bird.x > canvas.width + 20) {
                    bird.x = -20;
                    bird.y = Math.random() * (canvas.height / 2) + canvas.height / 4;
                }
            });
        }
    },
    Cloudy: {
        clouds: [],
        init: function() {
            this.clouds = Array.from({ length: ANIMATION_CONFIG.CLOUDS * 2 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 2),
                size: Math.random() * 0.5 + 0.5,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.3 + 0.4
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            // Draw overcast sky with theme awareness
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            if (isDarkMode) {
                skyGradient.addColorStop(0, 'rgba(40, 45, 50, 0.2)');
                skyGradient.addColorStop(1, 'rgba(50, 55, 60, 0.1)');
            } else {
                skyGradient.addColorStop(0, 'rgba(180, 190, 200, 0.2)');
                skyGradient.addColorStop(1, 'rgba(210, 220, 230, 0.1)');
            }
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw clouds with theme-aware colors
            this.clouds.forEach(cloud => {
                ctx.save();
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.size, cloud.size);
                
                const cloudColor = isDarkMode ? 
                    `rgba(200, 200, 200, ${cloud.opacity})` : 
                    `rgba(255, 255, 255, ${cloud.opacity})`;
                
                ctx.fillStyle = cloudColor;
                ctx.beginPath();
                ctx.arc(0, 0, 40, 0, Math.PI * 2);
                ctx.arc(30, -10, 35, 0, Math.PI * 2);
                ctx.arc(-30, -10, 35, 0, Math.PI * 2);
                ctx.arc(15, 10, 30, 0, Math.PI * 2);
                ctx.arc(-15, 10, 30, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                
                // Move clouds
                cloud.x += cloud.speed;
                if (cloud.x > canvas.width + 100) {
                    cloud.x = -100;
                }
            });
        }
    },
    Thunder: {
        lightningTime: 0,
        clouds: [],
        init: function() {
            this.lightningTime = 0;
            this.clouds = Array.from({ length: ANIMATION_CONFIG.CLOUDS * 2 }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 2),
                size: Math.random() * 0.5 + 0.7,
                speed: Math.random() * 0.3 + 0.1,
                opacity: Math.random() * 0.3 + 0.6
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw stormy sky
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            if (isDarkMode) {
                skyGradient.addColorStop(0, 'rgba(30, 35, 45, 0.2)');
                skyGradient.addColorStop(1, 'rgba(40, 45, 55, 0.1)');
            } else {
                skyGradient.addColorStop(0, 'rgba(100, 110, 130, 0.2)');
                skyGradient.addColorStop(1, 'rgba(130, 140, 160, 0.1)');
            }
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw dark clouds
            this.clouds.forEach(cloud => {
                ctx.save();
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.size, cloud.size);
                
                const cloudColor = isDarkMode ? 
                    `rgba(70, 70, 90, ${cloud.opacity})` : 
                    `rgba(100, 100, 120, ${cloud.opacity})`;
                
                ctx.fillStyle = cloudColor;
                ctx.beginPath();
                ctx.arc(0, 0, 40, 0, Math.PI * 2);
                ctx.arc(30, -10, 35, 0, Math.PI * 2);
                ctx.arc(-30, -10, 35, 0, Math.PI * 2);
                ctx.arc(15, 10, 30, 0, Math.PI * 2);
                ctx.arc(-15, 10, 30, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
                
                // Move clouds
                cloud.x += cloud.speed;
                if (cloud.x > canvas.width + 100) {
                    cloud.x = -100;
                }
            });
            
            // Random lightning
            if (Math.random() < ANIMATION_CONFIG.THUNDER_CHANCE || this.lightningTime > 0) {
                if (this.lightningTime === 0) {
                    this.lightningTime = ANIMATION_CONFIG.THUNDER_DURATION;
                }
                
                // Flash the sky
                const flashOpacity = this.lightningTime / ANIMATION_CONFIG.THUNDER_DURATION * 0.7;
                ctx.fillStyle = isDarkMode ? 
                    `rgba(200, 220, 255, ${flashOpacity})` : 
                    `rgba(255, 255, 200, ${flashOpacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw lightning bolt
                const startX = Math.random() * canvas.width;
                const startY = 0;
                
                ctx.strokeStyle = isDarkMode ? 
                    'rgba(200, 230, 255, 0.9)' : 
                    'rgba(255, 255, 200, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(startX, startY);
                
                let x = startX;
                let y = startY;
                
                while (y < canvas.height * 0.8) {
                    x += (Math.random() - 0.5) * 80;
                    y += Math.random() * 50 + 20;
                    ctx.lineTo(x, y);
                }
                
                ctx.stroke();
                
                // Decrease lightning time
                this.lightningTime--;
            }
        }
    },
    Mist: {
        particles: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.MIST_PARTICLES }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 30 + 20,
                opacity: Math.random() * 0.2 + 0.1,
                speed: Math.random() * 0.2 + 0.1
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw misty background
            ctx.fillStyle = isDarkMode ? 'rgba(40, 45, 55, 0.05)' : 'rgba(220, 225, 235, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw mist particles
            this.particles.forEach(particle => {
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.radius
                );
                
                const color = isDarkMode ? '200, 210, 220' : '255, 255, 255';
                gradient.addColorStop(0, `rgba(${color}, ${particle.opacity})`);
                gradient.addColorStop(1, `rgba(${color}, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // Move particles
                particle.x += particle.speed;
                
                // Wrap around edges
                if (particle.x - particle.radius > canvas.width) {
                    particle.x = -particle.radius;
                    particle.y = Math.random() * canvas.height;
                }
            });
        }
    },
    Windy: {
        particles: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.WIND_PARTICLES }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 50 + 30,
                thickness: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 5 + 3,
                opacity: Math.random() * 0.3 + 0.1
            }));
        },
        animate: function() {
            const isDarkMode = document.body.classList.contains('dark-theme');
            
            // Draw background
            ctx.fillStyle = isDarkMode ? 'rgba(30, 40, 50, 0.05)' : 'rgba(210, 230, 250, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw wind streaks
            this.particles.forEach(particle => {
                ctx.strokeStyle = isDarkMode ? 
                    `rgba(180, 200, 220, ${particle.opacity})` : 
                    `rgba(255, 255, 255, ${particle.opacity})`;
                ctx.lineWidth = particle.thickness;
                
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x + particle.length, particle.y);
                ctx.stroke();
                
                // Move particles
                particle.x += particle.speed;
                
                // Reset particles
                if (particle.x - particle.length > canvas.width) {
                    particle.x = -particle.length;
                    particle.y = Math.random() * canvas.height;
                }
            });
            
            // Draw some swaying elements at the bottom (like grass or plants)
            const grassCount = 20;
            const grassHeight = canvas.height * 0.1;
            const time = Date.now() * 0.001;
            
            ctx.strokeStyle = isDarkMode ? 'rgba(100, 120, 80, 0.4)' : 'rgba(50, 180, 50, 0.4)';
            
            for (let i = 0; i < grassCount; i++) {
                const x = (canvas.width / grassCount) * i;
                const height = grassHeight * (0.7 + Math.random() * 0.3);
                const sway = Math.sin(time + i * 0.3) * 10;
                
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x, canvas.height);
                ctx.quadraticCurveTo(
                    x + sway, 
                    canvas.height - height / 2, 
                    x + sway * 1.5, 
                    canvas.height - height
                );
                ctx.stroke();
            }
        }
    }
};

// Animation loop
function animate() {
    if (animationPaused) return;
    
    const now = Date.now();
    const elapsed = now - lastFrameTime;
    
    if (elapsed > frameInterval) {
        lastFrameTime = now - (elapsed % frameInterval);
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Animate current weather
        if (currentAnimation) {
            currentAnimation.animate();
        }
    }
    
    requestAnimationFrame(animate);
}

// Start animation
function startWeatherAnimation(weatherType) {
    // Stop current animation
    animationPaused = true;
    
    // Map weather type to animation
    const animationType = mapWeatherToAnimation(weatherType);
    
    // Set current animation
    currentAnimation = weatherAnimations[animationType];
    
    // Initialize animation
    if (currentAnimation) {
        currentAnimation.init();
        animationPaused = false;
        animate();
    }
}

// Map OpenWeather weather types to our animation types
function mapWeatherToAnimation(weatherType) {
    const weatherMap = {
        'Clear': 'Clear',
        'Clouds': 'Cloudy',
        'Rain': 'Rain',
        'Drizzle': 'Rain',
        'Thunderstorm': 'Thunder',
        'Snow': 'Snow',
        'Mist': 'Mist',
        'Smoke': 'Mist',
        'Haze': 'Mist',
        'Dust': 'Mist',
        'Fog': 'Mist',
        'Sand': 'Windy',
        'Ash': 'Mist',
        'Squall': 'Windy',
        'Tornado': 'Windy'
    };
    
    return weatherMap[weatherType] || 'Clear';
}

// Export functions
window.startWeatherAnimation = startWeatherAnimation;
// Canvas Setup
const canvas = document.getElementById('weatherCanvas');
const ctx = canvas.getContext('2d');

// Animation Configuration
const ANIMATION_CONFIG = {
    RAIN_DROPS: 100,
    SNOW_FLAKES: 80,
    SUN_RAYS: 12,
    CLOUDS: 5,
    THUNDER_CHANCE: 0.01,
    THUNDER_DURATION: 5,
    WIND_PARTICLES: 60,
    MIST_PARTICLES: 200
};

// Performance optimization
let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;
let animationPaused = false;

// Resize canvas to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.height;
    if (currentAnimation) {
        currentAnimation.init();
    }
}

// Handle visibility and resize events
window.addEventListener('resize', debounce(resizeCanvas, 250));
window.addEventListener('orientationchange', resizeCanvas);
resizeCanvas();

// Debounce function for resize events
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Weather Animation Types
const weatherAnimations = {
    Rain: {
        particles: [],
        puddles: [],
        init: function() {
            // ... (existing Rain init code)
        },
        animate: function() {
            // ... (existing Rain animate code)
        }
    },

    Snow: {
        particles: [],
        groundSnow: [],
        init: function() {
            // ... (existing Snow init code)
        },
        animate: function() {
            // ... (existing Snow animate code)
        }
    },

    Clear: {
        sunPosition: { x: 0, y: 0 },
        rays: [],
        clouds: [],
        birds: [],
        init: function() {
            // ... (existing Clear init code)
        },
        animate: function() {
            // ... (existing Clear animate code)
        }
    },

    Cloudy: {  // Fixed syntax error: removed trailing comma
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
            const isDarkMode = document.body.classList.contains('dark-theme');  // Added missing declaration
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
        ...Clear,
        lightningTime: 0,
        init: function() {
            Clear.init.call(this);
            this.lightningTime = 0;
        },
        animate: function() {
            // Draw base clear sky
            Clear.animate.call(this);
            
            // Add lightning effect with theme awareness
            if (Math.random() < ANIMATION_CONFIG.THUNDER_CHANCE) {
                this.lightningTime = ANIMATION_CONFIG.THUNDER_DURATION;
            }
            
            if (this.lightningTime > 0) {
                const isDarkMode = document.body.classList.contains('dark-theme');
                const intensity = isDarkMode ? 0.4 : 0.3;
                
                ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningTime / ANIMATION_CONFIG.THUNDER_DURATION * intensity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                this.lightningTime--;
            }
        }
    }
};


// Animation Control
let currentAnimation = null;
let animationFrame = null;

function startAnimation(weatherType) {
    // Stop current animation if any
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
    
    // Get animation based on weather type
    const AnimationType = weatherAnimations[weatherType] || weatherAnimations.Clear;
    currentAnimation = Object.create(AnimationType);
    currentAnimation.init();
    
    // Start animation loop
    function animate(timestamp) {
        if (!animationPaused) {
            if (!lastFrameTime) lastFrameTime = timestamp;
            
            const elapsed = timestamp - lastFrameTime;
            
            if (elapsed >= frameInterval) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                currentAnimation.animate();
                lastFrameTime = timestamp - (elapsed % frameInterval);
            }
            
            animationFrame = requestAnimationFrame(animate);
        }
    }
    
    animationFrame = requestAnimationFrame(animate);
}

// Handle visibility change
document.addEventListener('visibilitychange', () => {
    animationPaused = document.hidden;
    if (!animationPaused && currentAnimation) {
        lastFrameTime = 0;
        startAnimation(currentAnimation.constructor.name);
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    if (currentAnimation) {
        currentAnimation.init();
    }
});

// Export animation control
window.weatherAnimations = {
    start: startAnimation,
    stop: () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    },
    pause: () => {
        animationPaused = true;
    },
    resume: () => {
        animationPaused = false;
        lastFrameTime = 0;
        if (currentAnimation) {
            startAnimation(currentAnimation.constructor.name);
        }
    }
};

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
    THUNDER_DURATION: 5
};

// Performance optimization
let lastFrameTime = 0;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

// Resize canvas to full window size
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (currentAnimation) {
        currentAnimation.init();
    }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Weather Animation Types
const weatherAnimations = {
    Rain: {
        particles: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.RAIN_DROPS }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                length: Math.random() * 20 + 10,
                speed: Math.random() * 10 + 5,
                opacity: Math.random() * 0.3 + 0.2
            }));
        },
        animate: function() {
            this.particles.forEach(particle => {
                ctx.beginPath();
                ctx.strokeStyle = `rgba(174, 194, 224, ${particle.opacity})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x, particle.y + particle.length);
                ctx.stroke();

                particle.y += particle.speed;
                if (particle.y > canvas.height) {
                    particle.y = -particle.length;
                    particle.x = Math.random() * canvas.width;
                }
            });
        }
    },

    Snow: {
        particles: [],
        init: function() {
            this.particles = Array.from({ length: ANIMATION_CONFIG.SNOW_FLAKES }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 3 + 1,
                speed: Math.random() * 2 + 1,
                wind: Math.random() * 2 - 1,
                wobble: Math.random() * Math.PI * 2
            }));
        },
        animate: function() {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            this.particles.forEach(particle => {
                particle.wobble += 0.01;
                particle.x += Math.sin(particle.wobble) * 0.3 + particle.wind;
                particle.y += particle.speed;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();

                if (particle.y > canvas.height) {
                    particle.y = -particle.radius;
                    particle.x = Math.random() * canvas.width;
                }
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.x < 0) particle.x = canvas.width;
            });
        }
    },

    Clear: {
        sunPosition: { x: 0, y: 0 },
        rays: [],
        init: function() {
            this.sunPosition = {
                x: canvas.width * 0.2,
                y: canvas.height * 0.2
            };
            this.rays = Array.from({ length: ANIMATION_CONFIG.SUN_RAYS }, (_, i) => ({
                angle: (i * Math.PI * 2) / ANIMATION_CONFIG.SUN_RAYS,
                length: 50,
                originalLength: 50,
                phase: Math.random() * Math.PI * 2
            }));
        },
        animate: function() {
            const time = Date.now() / 1000;
            
            // Draw sun glow
            const gradient = ctx.createRadialGradient(
                this.sunPosition.x, this.sunPosition.y, 30,
                this.sunPosition.x, this.sunPosition.y, 80
            );
            gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw sun
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.sunPosition.x, this.sunPosition.y, 40, 0, Math.PI * 2);
            ctx.fill();

            // Draw rays
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 3;

            this.rays.forEach(ray => {
                ray.length = ray.originalLength * (0.8 + Math.sin(time + ray.phase) * 0.2);
                const startX = this.sunPosition.x + Math.cos(ray.angle) * 40;
                const startY = this.sunPosition.y + Math.sin(ray.angle) * 40;
                const endX = this.sunPosition.x + Math.cos(ray.angle) * (40 + ray.length);
                const endY = this.sunPosition.y + Math.sin(ray.angle) * (40 + ray.length);

                ctx.beginPath();
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });
        }
    },

    Clouds: {
        clouds: [],
        init: function() {
            this.clouds = Array.from({ length: ANIMATION_CONFIG.CLOUDS }, () => ({
                x: Math.random() * canvas.width,
                y: Math.random() * (canvas.height / 2),
                size: Math.random() * 0.5 + 0.5,
                speed: Math.random() * 0.5 + 0.1
            }));
        },
        animate: function() {
            this.clouds.forEach(cloud => {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.save();
                ctx.translate(cloud.x, cloud.y);
                ctx.scale(cloud.size, cloud.size);
                
                ctx.beginPath();
                ctx.arc(0, 0, 30, 0, Math.PI * 2);
                ctx.arc(35, -10, 35, 0, Math.PI * 2);
                ctx.arc(70, 0, 30, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();

                cloud.x += cloud.speed;
                if (cloud.x > canvas.width + 100) {
                    cloud.x = -100;
                }
            });
        }
    },

    Thunder: {
        lightningTime: 0,
        lastFlash: 0,
        init: function() {
            this.lightningTime = 0;
            this.lastFlash = Date.now();
        },
        animate: function() {
            const now = Date.now();
            if (now - this.lastFlash > 2000 && Math.random() < ANIMATION_CONFIG.THUNDER_CHANCE) {
                this.lightningTime = ANIMATION_CONFIG.THUNDER_DURATION;
                this.lastFlash = now;
            }

            if (this.lightningTime > 0) {
                const opacity = this.lightningTime / ANIMATION_CONFIG.THUNDER_DURATION;
                ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                this.lightningTime--;
            }
        }
    }
};

let currentAnimation = null;
let animationFrameId = null;

function animate(timestamp) {
    if (!lastFrameTime) lastFrameTime = timestamp;
    const elapsed = timestamp - lastFrameTime;

    if (elapsed > frameInterval) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        currentAnimation.animate();
        lastFrameTime = timestamp - (elapsed % frameInterval);
    }

    if (document.visibilityState === 'visible') {
        animationFrameId = requestAnimationFrame(animate);
    }
}

function updateWeatherAnimation(weatherCondition) {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const condition = weatherCondition.toLowerCase();
    const animationType = condition.includes('rain') ? 'Rain'
        : condition.includes('snow') ? 'Snow'
        : condition.includes('cloud') ? 'Clouds'
        : condition.includes('thunder') ? 'Thunder'
        : 'Clear';

    currentAnimation = weatherAnimations[animationType];
    if (currentAnimation) {
        currentAnimation.init();
        lastFrameTime = 0;
        animate(performance.now());
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentAnimation) {
        lastFrameTime = 0;
        animate(performance.now());
    }
});

export { updateWeatherAnimation };
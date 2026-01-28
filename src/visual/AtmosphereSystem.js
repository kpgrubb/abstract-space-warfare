/**
 * AtmosphereSystem.js - Space backgrounds and visual effects
 * Creates starfields, nebulae, and cosmic atmosphere
 */

export class AtmosphereSystem {
    constructor() {
        this.backgroundType = 'deep_space';
        this.starField = [];
        this.nebulaClouds = [];

        this.canvasWidth = 0;
        this.canvasHeight = 0;

        // Background types
        this.backgrounds = [
            'deep_space',      // Pure black with white stars
            'nebula_purple',   // Purple/pink gas clouds
            'nebula_blue',     // Blue emission nebula
            'nebula_green',    // Green/cyan nebula
            'asteroid_field'   // Brownish with scattered rocks
        ];

        // Color schemes - subtle grey textures on white background
        this.nebulaColors = {
            'nebula_purple': {
                primary: 'rgba(180, 170, 190, 0.12)',
                secondary: 'rgba(190, 180, 185, 0.08)',
                stars: '#bbbbbb'
            },
            'nebula_blue': {
                primary: 'rgba(170, 175, 190, 0.15)',
                secondary: 'rgba(180, 185, 195, 0.08)',
                stars: '#aaaaaa'
            },
            'nebula_green': {
                primary: 'rgba(175, 185, 175, 0.12)',
                secondary: 'rgba(180, 190, 180, 0.08)',
                stars: '#bbbbbb'
            },
            'deep_space': {
                primary: 'rgba(200, 200, 200, 0)',
                secondary: 'rgba(200, 200, 200, 0)',
                stars: '#cccccc'
            },
            'asteroid_field': {
                primary: 'rgba(185, 180, 175, 0.1)',
                secondary: 'rgba(190, 185, 180, 0.06)',
                stars: '#aaaaaa'
            }
        };
    }

    /**
     * Set random space background
     */
    setRandomAtmosphere() {
        this.backgroundType = this.backgrounds[
            Math.floor(Math.random() * this.backgrounds.length)
        ];

        // Regenerate star field
        this.generateStarField();

        // Generate nebula clouds if applicable
        if (this.backgroundType.startsWith('nebula')) {
            this.generateNebulaClouds();
        } else {
            this.nebulaClouds = [];
        }

        console.log(`Space atmosphere: ${this.backgroundType}`);
    }

    /**
     * Generate star field
     */
    generateStarField() {
        this.starField = [];

        const canvas = document.getElementById('battleCanvas');
        if (canvas) {
            this.canvasWidth = canvas.width;
            this.canvasHeight = canvas.height;
        } else {
            this.canvasWidth = 1200;
            this.canvasHeight = 800;
        }

        // Generate stars (more for deep space, fewer for nebulae)
        const starCount = this.backgroundType === 'deep_space' ? 300 : 150;

        for (let i = 0; i < starCount; i++) {
            this.starField.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                size: Math.random() * 2 + 0.5,
                brightness: 0.3 + Math.random() * 0.7,
                twinkleSpeed: 1 + Math.random() * 3,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }

        // Add some brighter stars
        for (let i = 0; i < 20; i++) {
            this.starField.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                size: 2 + Math.random() * 2,
                brightness: 0.8 + Math.random() * 0.2,
                twinkleSpeed: 0.5 + Math.random() * 1,
                twinkleOffset: Math.random() * Math.PI * 2,
                bright: true
            });
        }
    }

    /**
     * Generate nebula cloud positions
     */
    generateNebulaClouds() {
        this.nebulaClouds = [];

        const numClouds = 5 + Math.floor(Math.random() * 5);

        for (let i = 0; i < numClouds; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight,
                radius: 100 + Math.random() * 200,
                drift: {
                    x: (Math.random() - 0.5) * 5,
                    y: (Math.random() - 0.5) * 5
                }
            });
        }
    }

    /**
     * Update atmosphere (slow drift)
     */
    update(deltaTime) {
        // Update canvas dimensions
        const canvas = document.getElementById('battleCanvas');
        if (canvas) {
            this.canvasWidth = canvas.width;
            this.canvasHeight = canvas.height;
        }

        // Slow nebula drift
        for (const cloud of this.nebulaClouds) {
            cloud.x += cloud.drift.x * deltaTime;
            cloud.y += cloud.drift.y * deltaTime;

            // Wrap around
            if (cloud.x < -cloud.radius) cloud.x = this.canvasWidth + cloud.radius;
            if (cloud.x > this.canvasWidth + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = this.canvasHeight + cloud.radius;
            if (cloud.y > this.canvasHeight + cloud.radius) cloud.y = -cloud.radius;
        }
    }

    /**
     * Render space background (call before entities)
     */
    render(renderer) {
        const ctx = renderer.getContext();
        const colors = this.nebulaColors[this.backgroundType] || this.nebulaColors['deep_space'];

        // Render nebula clouds first (if any)
        this.renderNebulae(ctx, colors);

        // Render stars
        this.renderStars(ctx, colors);
    }

    /**
     * Render nebula clouds
     */
    renderNebulae(ctx, colors) {
        if (this.nebulaClouds.length === 0) return;

        ctx.save();

        for (const cloud of this.nebulaClouds) {
            // Primary cloud
            const gradient = ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius
            );
            gradient.addColorStop(0, colors.primary);
            gradient.addColorStop(0.5, colors.secondary);
            gradient.addColorStop(1, 'rgba(240, 240, 240, 0)');

            ctx.fillStyle = gradient;
            ctx.fillRect(
                cloud.x - cloud.radius,
                cloud.y - cloud.radius,
                cloud.radius * 2,
                cloud.radius * 2
            );
        }

        ctx.restore();
    }

    /**
     * Render star field
     */
    renderStars(ctx, colors) {
        ctx.save();

        const time = Date.now() * 0.001;

        for (const star of this.starField) {
            // Calculate twinkle
            const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            const alpha = star.brightness * twinkle;

            ctx.globalAlpha = alpha;

            if (star.bright) {
                // Bright stars with glow
                ctx.shadowColor = colors.stars;
                ctx.shadowBlur = 8;
                ctx.fillStyle = colors.stars;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;

                // Cross flare for brightest stars
                if (star.size > 3) {
                    ctx.globalAlpha = alpha * 0.5;
                    ctx.strokeStyle = colors.stars;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(star.x - star.size * 2, star.y);
                    ctx.lineTo(star.x + star.size * 2, star.y);
                    ctx.moveTo(star.x, star.y - star.size * 2);
                    ctx.lineTo(star.x, star.y + star.size * 2);
                    ctx.stroke();
                }
            } else {
                // Regular stars
                ctx.fillStyle = colors.stars;
                ctx.fillRect(star.x, star.y, star.size, star.size);
            }
        }

        ctx.restore();
    }

    /**
     * Get atmosphere description
     */
    getDescription() {
        const names = {
            'deep_space': 'Deep Space',
            'nebula_purple': 'Purple Nebula',
            'nebula_blue': 'Blue Nebula',
            'nebula_green': 'Green Nebula',
            'asteroid_field': 'Asteroid Field'
        };
        return names[this.backgroundType] || 'Unknown';
    }

    /**
     * Clear atmosphere
     */
    clear() {
        this.starField = [];
        this.nebulaClouds = [];
    }
}

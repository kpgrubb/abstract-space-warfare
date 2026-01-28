/**
 * ScreenEffects.js - Screen shake and visual effects
 * Handles camera shake, flash effects, and post-processing
 */

export class ScreenEffects {
    constructor() {
        // Screen shake
        this.shakeIntensity = 0;
        this.shakeDecay = 5.0; // How fast shake fades
        this.shakeX = 0;
        this.shakeY = 0;

        // Flash effects
        this.flashIntensity = 0;
        this.flashColor = '#000000';
        this.flashDecay = 3.0;

        // Vignette
        this.vignetteIntensity = 0.3;
    }

    /**
     * Trigger screen shake
     */
    shake(intensity) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }

    /**
     * Trigger flash effect
     */
    flash(intensity, color = '#000000') {
        this.flashIntensity = Math.max(this.flashIntensity, intensity);
        this.flashColor = color;
    }

    /**
     * Update effects
     */
    update(deltaTime) {
        // Update shake
        if (this.shakeIntensity > 0) {
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 10;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 10;
            this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * deltaTime);
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Update flash
        if (this.flashIntensity > 0) {
            this.flashIntensity = Math.max(0, this.flashIntensity - this.flashDecay * deltaTime);
        }
    }

    /**
     * Apply camera shake offset
     */
    applyShake(ctx) {
        if (this.shakeX !== 0 || this.shakeY !== 0) {
            ctx.translate(this.shakeX, this.shakeY);
        }
    }

    /**
     * Render post-processing effects
     */
    render(renderer) {
        const ctx = renderer.getContext();
        const { width, height } = renderer.getDimensions();

        ctx.save();

        // Vignette effect
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Flash effect
        if (this.flashIntensity > 0) {
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashIntensity;
            ctx.fillRect(0, 0, width, height);
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();
    }

    /**
     * Get current shake offset
     */
    getShakeOffset() {
        return { x: this.shakeX, y: this.shakeY };
    }
}

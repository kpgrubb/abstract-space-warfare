/**
 * Artillery.js - Artillery units (hexagons)
 * Long-range stationary units with area-of-effect explosions
 */

import { Unit } from './Unit.js';
import { Colors } from '../visual/Colors.js';

export class Artillery extends Unit {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        // Artillery-specific properties
        this.type = 'artillery';
        this.size = 22;
        this.speed = 15; // Very slow/nearly stationary
        this.range = 400; // Very long range
        this.damage = 25; // Good damage with area effect
        this.fireRate = 0.3; // Slow fire rate (~3 seconds per shot)

        // Set color based on team
        this.color = team === 'friendly' ? Colors.FRIENDLY_ACCENT : Colors.ENEMY_ACCENT;

        // Artillery-specific state
        this.isReloading = false;
        this.reloadProgress = 0;
        this.lastShotTime = 0;

        // Prefer to stay at max range
        this.preferredRange = this.range * 0.9;
    }

    /**
     * Update artillery behavior
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update reload animation
        if (this.isReloading) {
            this.reloadProgress = Math.min(1.0, this.reloadProgress + deltaTime * this.fireRate);
            if (this.reloadProgress >= 1.0) {
                this.isReloading = false;
            }
        }
    }

    /**
     * Override fire to add reload animation
     */
    fire() {
        const canFire = super.fire();

        if (canFire) {
            this.isReloading = true;
            this.reloadProgress = 0;
        }

        return canFire;
    }

    /**
     * Render artillery as hexagon with pulsing effect
     */
    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();

        // Pulsing effect when ready to fire
        let pulseSize = this.size;
        if (!this.isReloading && this.canFire()) {
            const pulse = Math.sin(Date.now() * 0.003) * 0.15 + 1;
            pulseSize = this.size * pulse;

            // Extra glow when ready
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 10;
            renderer.drawHexagon(this.x, this.y, pulseSize * 1.2, this.color, false);
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Last stand units pulse gold
        let renderColor = this.color;
        if (this.isLastStand) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
            renderColor = `rgba(255, 220, 100, ${0.8 + pulse * 0.2})`;
        }

        // Draw the hexagon
        renderer.drawHexagon(
            this.x,
            this.y,
            pulseSize,
            renderColor,
            true // Enable glow
        );

        // Draw reload progress bar
        if (this.isReloading) {
            const barWidth = this.size * 2.5;
            const barHeight = 4;
            const barX = this.x - barWidth / 2;
            const barY = this.y + this.size + 10;

            // Background
            ctx.save();
            ctx.globalAlpha = 0.5;
            renderer.drawLine(barX, barY, barX + barWidth, barY, '#444444', barHeight);

            // Reload progress
            const progressWidth = this.reloadProgress * barWidth;
            ctx.globalAlpha = 1.0;
            renderer.drawLine(barX, barY, barX + progressWidth, barY, this.color, barHeight);
            ctx.restore();
        }

        // Debug: Draw health bar
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 15;

            // Background
            renderer.drawLine(barX, barY, barX + barWidth, barY, '#333333', barHeight);

            // Health
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            renderer.drawLine(barX, barY, barX + healthWidth, barY, this.color, barHeight);
        }

        // Draw range indicator (subtle)
        if (this.canFire()) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }
    }

    /**
     * Artillery should try to maintain maximum range from enemies
     */
    shouldRetreat(enemyDistance) {
        // If enemy too close, retreat
        return enemyDistance < this.range * 0.3;
    }

    /**
     * Artillery doesn't need to move toward distant targets
     */
    shouldAdvance(enemyDistance) {
        // Only advance if target is way out of range
        return enemyDistance > this.range * 1.2;
    }
}

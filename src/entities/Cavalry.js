/**
 * Cavalry.js - Cavalry units (diamonds)
 * Fast-moving mounted units with devastating melee charges
 */

import { Unit } from './Unit.js';
import { Colors } from '../visual/Colors.js';

export class Cavalry extends Unit {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        // Cavalry-specific properties
        this.type = 'cavalry';
        this.size = 18;
        this.speed = 120; // Much faster than infantry
        this.range = 20; // Melee only - must get very close
        this.damage = 30; // High damage on charge
        this.fireRate = 1.5; // Fast attacks (melee strikes)

        // Set color based on team
        this.color = team === 'friendly' ? Colors.FRIENDLY_SECONDARY : Colors.ENEMY_SECONDARY;

        // Cavalry-specific state
        this.isCharging = false;
        this.chargeSpeed = 200; // Speed during charge
        this.chargeDistance = 0;
        this.maxChargeDistance = 300;

        // Motion trail for visual effect
        this.trailPositions = [];
        this.maxTrailLength = 8;
    }

    /**
     * Update cavalry behavior
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update trail positions
        this.updateTrail();

        // Check if charging
        if (this.isCharging) {
            this.chargeDistance += this.speed * deltaTime;

            // End charge after max distance
            if (this.chargeDistance >= this.maxChargeDistance) {
                this.endCharge();
            }
        }
    }

    /**
     * Update motion trail
     */
    updateTrail() {
        // Add current position to trail
        this.trailPositions.push({ x: this.x, y: this.y });

        // Limit trail length
        if (this.trailPositions.length > this.maxTrailLength) {
            this.trailPositions.shift();
        }
    }

    /**
     * Start a charge toward target
     */
    startCharge() {
        if (this.isCharging) return;

        this.isCharging = true;
        this.chargeDistance = 0;
        this.speed = this.chargeSpeed;
        this.damage = 40; // Bonus damage during charge
    }

    /**
     * End charge
     */
    endCharge() {
        this.isCharging = false;
        this.speed = 120; // Return to normal speed
        this.damage = 30; // Normal damage
        this.chargeDistance = 0;
    }

    /**
     * Override fire to handle melee attacks
     */
    fire() {
        const canAttack = super.fire();

        // If we attacked during a charge, end the charge
        if (canAttack && this.isCharging) {
            this.endCharge();
        }

        return canAttack;
    }

    /**
     * Render cavalry as diamond with motion trails
     */
    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();

        // Draw motion trail
        if (this.trailPositions.length > 1) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.3;

            ctx.beginPath();
            ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);

            for (let i = 1; i < this.trailPositions.length; i++) {
                const alpha = i / this.trailPositions.length;
                ctx.globalAlpha = alpha * 0.3;
                ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
            }

            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Last stand units pulse gold
        let renderColor = this.color;
        if (this.isLastStand) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
            renderColor = `rgba(255, 220, 100, ${0.8 + pulse * 0.2})`;
        }

        // Draw the diamond
        renderer.drawDiamond(
            this.x,
            this.y,
            this.size,
            this.rotation,
            renderColor,
            true // Enable glow
        );

        // If charging, add extra glow effect
        if (this.isCharging) {
            ctx.save();
            ctx.globalAlpha = 0.4;
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
            ctx.shadowBlur = 10;
            renderer.drawDiamond(
                this.x,
                this.y,
                this.size * 1.3,
                this.rotation,
                this.color,
                false
            );
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0;
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
    }

    /**
     * Override move to detect charge opportunities
     */
    moveTo(x, y) {
        super.moveTo(x, y);

        // If moving toward enemy and not charging, start charge
        const dist = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
        if (dist > 100 && dist < this.maxChargeDistance && !this.isCharging) {
            // Random chance to charge (30%)
            if (Math.random() < 0.3) {
                this.startCharge();
            }
        }
    }
}

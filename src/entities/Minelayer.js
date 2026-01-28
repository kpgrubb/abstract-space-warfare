/**
 * Minelayer.js - Mine deployment vessel
 * Deploys proximity mines that detonate on contact
 *
 * Visual: Boxy utilitarian hull with visible mine bays
 */

import { Spacecraft } from './Spacecraft.js';

export class Minelayer extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'minelayer';
        this.size = 14;          // Medium-small
        this.speed = 30;         // Moderate speed
        this.turnRate = 0.8;     // Decent maneuverability
        this.health = 80;
        this.maxHealth = 80;

        // EVASION: Low-moderate - utilitarian design
        this.evasion = 35;

        // TACTICAL ROLE: Support
        // - Deploys mines in enemy paths
        // - Creates defensive zones
        // - Withdraws after deploying
        this.tacticalRole = 'support';

        // Light shields
        this.shields = 30;
        this.maxShields = 30;
        this.shieldRegenRate = 5;
        this.shieldRegenDelay = 3;

        // Team colors
        this.color = team === 'friendly' ? '#4a4035' : '#e8e8e8';

        // Mine deployment system
        this.mineCapacity = 8;
        this.minesRemaining = 8;
        this.mineCooldown = 3;      // Seconds between deployments
        this.mineTimer = 0;
        this.mineReady = true;
        this.mineDamage = 60;
        this.mineProximity = 40;    // Detonation radius

        // Hardpoints: Light defensive weapons
        this.addHardpoint(8, -5, 'ballistic');  // Left defense gun
        this.addHardpoint(8, 5, 'ballistic');   // Right defense gun
        this.addHardpoint(-5, 0, 'laser');      // Rear defense
    }

    update(deltaTime, allShips = []) {
        super.update(deltaTime);

        // Update mine cooldown
        if (!this.mineReady && this.minesRemaining > 0) {
            this.mineTimer += deltaTime;
            if (this.mineTimer >= this.mineCooldown) {
                this.mineReady = true;
                this.mineTimer = 0;
            }
        }
    }

    /**
     * Deploy a mine at current position
     * Returns mine data or null if can't deploy
     */
    deployMine() {
        if (!this.mineReady || this.minesRemaining <= 0) {
            return null;
        }

        this.minesRemaining--;
        this.mineReady = false;
        this.mineTimer = 0;

        // Return mine data for the mine system to track
        return {
            x: this.x - Math.cos(this.rotation) * this.size,
            y: this.y - Math.sin(this.rotation) * this.size,
            team: this.team,
            damage: this.mineDamage,
            proximityRadius: this.mineProximity,
            armed: false,
            armTime: 1.5,  // Time before mine becomes active
            timer: 0
        };
    }

    /**
     * Check if can deploy mines
     */
    canDeployMine() {
        return this.mineReady && this.minesRemaining > 0;
    }

    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Last stand glow
        let renderColor = this.color;
        if (this.isLastStand) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
            renderColor = `rgba(255, 220, 100, ${0.8 + pulse * 0.2})`;
        } else if (this.showDamageFlash) {
            renderColor = '#000000';
        }

        // Dark shadow
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 10;

        // Main hull - boxy utilitarian shape
        ctx.beginPath();
        ctx.moveTo(this.size * 0.6, -this.size * 0.3);   // Forward left
        ctx.lineTo(this.size * 0.6, this.size * 0.3);    // Forward right
        ctx.lineTo(-this.size * 0.5, this.size * 0.4);   // Rear right
        ctx.lineTo(-this.size * 0.6, this.size * 0.2);   // Stern right
        ctx.lineTo(-this.size * 0.6, -this.size * 0.2);  // Stern left
        ctx.lineTo(-this.size * 0.5, -this.size * 0.4);  // Rear left
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Mine bay doors (rear)
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-this.size * 0.55, -this.size * 0.25, this.size * 0.3, this.size * 0.5);

        // Mine indicators (show remaining)
        const mineSlots = [
            { x: -0.45, y: -0.15 },
            { x: -0.45, y: 0.05 },
            { x: -0.35, y: -0.15 },
            { x: -0.35, y: 0.05 },
            { x: -0.45, y: -0.05 },
            { x: -0.45, y: 0.15 },
            { x: -0.35, y: -0.05 },
            { x: -0.35, y: 0.15 }
        ];

        for (let i = 0; i < mineSlots.length; i++) {
            const slot = mineSlots[i];
            if (i < this.minesRemaining) {
                ctx.fillStyle = '#555555';  // Mine present
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
            } else {
                ctx.fillStyle = '#bbbbbb';  // Empty slot
                ctx.shadowBlur = 0;
            }
            ctx.beginPath();
            ctx.arc(this.size * slot.x, this.size * slot.y, this.size * 0.06, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';

        // Bridge
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.rect(this.size * 0.2, -this.size * 0.15, this.size * 0.25, this.size * 0.3);
        ctx.fill();

        // Defense turrets
        ctx.beginPath();
        ctx.arc(this.size * 0.5, -this.size * 0.35, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.5, this.size * 0.35, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.62, 0, this.size * 0.1, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(0, 0, 0, 0.3)';
        // Light enemy ships get dark accents, dark friendly ships get light accents
        return color === '#e8e8e8' || color === '#d8d8d8' || color === '#c8c8c8' ? '#666666' : '#888888';
    }
}

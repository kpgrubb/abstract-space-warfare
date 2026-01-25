/**
 * RepairTender.js - Fleet support vessel
 * Heals nearby friendly ships over time
 *
 * Visual: Wide hull with repair arms and docking clamps
 */

import { Spacecraft } from './Spacecraft.js';

export class RepairTender extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'repair_tender';
        this.size = 18;          // Medium size
        this.speed = 22;         // Slow support vessel
        this.turnRate = 0.5;     // Poor maneuverability
        this.health = 150;
        this.maxHealth = 150;

        // EVASION: Low - bulky support ship
        this.evasion = 25;

        // TACTICAL ROLE: Support
        // - Stays near damaged friendlies
        // - Repairs ships over time
        // - High priority target
        // - Withdraws from direct combat
        this.tacticalRole = 'support';

        // Decent shields for survivability
        this.shields = 60;
        this.maxShields = 60;
        this.shieldRegenRate = 8;
        this.shieldRegenDelay = 3;

        // Team colors - support vessel green
        this.color = team === 'friendly' ? '#00cc88' : '#ff9944';

        // Repair system
        this.repairRange = 120;      // Range to repair friendlies
        this.repairRate = 15;        // HP per second
        this.repairCooldown = 0.5;   // Time between repair ticks
        this.repairTimer = 0;
        this.currentRepairTarget = null;
        this.repairBeamActive = false;

        // Hardpoints: Light defensive weapons only
        this.addHardpoint(10, -8, 'laser');   // Port defense
        this.addHardpoint(10, 8, 'laser');    // Starboard defense
        this.addHardpoint(-8, 0, 'ballistic'); // Rear defense
    }

    update(deltaTime, allShips = []) {
        super.update(deltaTime);

        // Update repair timer
        this.repairTimer += deltaTime;

        // Find repair target if we don't have one (only if we have ship list)
        if (allShips && allShips.length > 0) {
            if (!this.currentRepairTarget || !this.currentRepairTarget.alive ||
                this.currentRepairTarget.health >= this.currentRepairTarget.maxHealth) {
                this.currentRepairTarget = this.findRepairTarget(allShips);
            }
        }

        // Check if current target is still in range
        if (this.currentRepairTarget) {
            const dist = Math.hypot(
                this.currentRepairTarget.x - this.x,
                this.currentRepairTarget.y - this.y
            );
            if (dist > this.repairRange) {
                this.currentRepairTarget = null;
                this.repairBeamActive = false;
            }
        }
    }

    /**
     * Find the most damaged friendly ship in range
     */
    findRepairTarget(allShips) {
        let bestTarget = null;
        let lowestHealthPercent = 1.0;

        for (const ship of allShips) {
            if (!ship.alive || ship === this || ship.team !== this.team) continue;
            if (ship.health >= ship.maxHealth) continue;

            const dist = Math.hypot(ship.x - this.x, ship.y - this.y);
            if (dist > this.repairRange) continue;

            const healthPercent = ship.health / ship.maxHealth;
            if (healthPercent < lowestHealthPercent) {
                lowestHealthPercent = healthPercent;
                bestTarget = ship;
            }
        }

        return bestTarget;
    }

    /**
     * Perform repair on current target
     * Returns repair info for visual effects
     */
    performRepair() {
        if (!this.currentRepairTarget || this.repairTimer < this.repairCooldown) {
            this.repairBeamActive = false;
            return null;
        }

        this.repairTimer = 0;
        this.repairBeamActive = true;

        const healAmount = Math.min(
            this.repairRate * this.repairCooldown,
            this.currentRepairTarget.maxHealth - this.currentRepairTarget.health
        );

        this.currentRepairTarget.health += healAmount;

        return {
            source: { x: this.x, y: this.y },
            target: { x: this.currentRepairTarget.x, y: this.currentRepairTarget.y },
            healAmount: healAmount
        };
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
            renderColor = '#ffffff';
        }

        // Neon glow
        ctx.shadowColor = renderColor;
        ctx.shadowBlur = 18;

        // Main hull - wide support vessel
        ctx.beginPath();
        ctx.moveTo(this.size * 0.5, -this.size * 0.2);    // Forward left
        ctx.lineTo(this.size * 0.6, 0);                   // Bow
        ctx.lineTo(this.size * 0.5, this.size * 0.2);     // Forward right
        ctx.lineTo(this.size * 0.2, this.size * 0.5);     // Mid right
        ctx.lineTo(-this.size * 0.4, this.size * 0.5);    // Rear right
        ctx.lineTo(-this.size * 0.55, this.size * 0.3);   // Stern right
        ctx.lineTo(-this.size * 0.55, -this.size * 0.3);  // Stern left
        ctx.lineTo(-this.size * 0.4, -this.size * 0.5);   // Rear left
        ctx.lineTo(this.size * 0.2, -this.size * 0.5);    // Mid left
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Repair arms (extended outward)
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 3;

        // Left repair arm
        ctx.beginPath();
        ctx.moveTo(0, -this.size * 0.45);
        ctx.lineTo(-this.size * 0.1, -this.size * 0.65);
        ctx.lineTo(this.size * 0.1, -this.size * 0.7);
        ctx.stroke();

        // Right repair arm
        ctx.beginPath();
        ctx.moveTo(0, this.size * 0.45);
        ctx.lineTo(-this.size * 0.1, this.size * 0.65);
        ctx.lineTo(this.size * 0.1, this.size * 0.7);
        ctx.stroke();

        // Repair arm tips (glowing if repairing)
        if (this.repairBeamActive) {
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#006644';
            ctx.shadowBlur = 5;
        }
        ctx.beginPath();
        ctx.arc(this.size * 0.1, -this.size * 0.7, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.1, this.size * 0.7, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 18;
        ctx.shadowColor = renderColor;

        // Central repair bay
        ctx.fillStyle = '#113322';
        ctx.fillRect(-this.size * 0.2, -this.size * 0.25, this.size * 0.35, this.size * 0.5);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size * 0.2, -this.size * 0.25, this.size * 0.35, this.size * 0.5);

        // Medical cross symbol
        ctx.fillStyle = '#00ff88';
        ctx.globalAlpha = 0.7;
        ctx.fillRect(-this.size * 0.08, -this.size * 0.18, this.size * 0.1, this.size * 0.36);
        ctx.fillRect(-this.size * 0.15, -this.size * 0.05, this.size * 0.24, this.size * 0.1);
        ctx.globalAlpha = 1.0;

        // Bridge
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.rect(this.size * 0.25, -this.size * 0.12, this.size * 0.18, this.size * 0.24);
        ctx.fill();

        // Defense turrets
        ctx.beginPath();
        ctx.arc(this.size * 0.35, -this.size * 0.35, this.size * 0.06, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.35, this.size * 0.35, this.size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow (twin engines)
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#00aa66';
        ctx.fillStyle = '#00cc88';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.58, -this.size * 0.15, this.size * 0.08, this.size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.58, this.size * 0.15, this.size * 0.08, this.size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Draw repair beam if active
        if (this.repairBeamActive && this.currentRepairTarget) {
            this.renderRepairBeam(renderer);
        }

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    renderRepairBeam(renderer) {
        const ctx = renderer.getContext();
        const target = this.currentRepairTarget;

        ctx.save();

        // Pulsing repair beam
        const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;

        ctx.strokeStyle = `rgba(0, 255, 136, ${pulse * 0.6})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Healing particles along beam
        const numParticles = 5;
        for (let i = 0; i < numParticles; i++) {
            const t = ((Date.now() * 0.002 + i / numParticles) % 1);
            const px = this.x + (target.x - this.x) * t;
            const py = this.y + (target.y - this.y) * t;

            ctx.fillStyle = `rgba(0, 255, 136, ${(1 - t) * 0.8})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(255, 255, 255, 0.8)';
        return '#ffffff';
    }
}

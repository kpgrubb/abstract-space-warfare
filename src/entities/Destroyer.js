/**
 * Destroyer.js - Fast escort vessel with point defense
 * Specializes in screening capital ships from missiles and fighters
 *
 * Visual: Sleek angular hull with multiple PD turrets
 */

import { Spacecraft } from './Spacecraft.js';

export class Destroyer extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'destroyer';
        this.size = 12;          // Medium-small
        this.speed = 45;         // Fast - keeps up with the fleet
        this.turnRate = 1.2;     // Good maneuverability
        this.health = 100;
        this.maxHealth = 100;

        // EVASION: Moderate - nimble but not a fighter
        this.evasion = 50;

        // TACTICAL ROLE: Screening
        // - Escorts capital ships
        // - Intercepts incoming missiles with point defense
        // - Engages fighters threatening the fleet
        // - Forward deployed to screen the battle line
        this.tacticalRole = 'screen';

        // SHIELDS: Light shields
        this.shields = 40;
        this.maxShields = 40;
        this.shieldRegenRate = 6;
        this.shieldRegenDelay = 2.5;

        // POINT DEFENSE SYSTEM
        this.pointDefenseRange = 120;      // Range to intercept missiles
        this.pointDefenseRate = 0.4;       // Seconds between PD shots
        this.pointDefenseCooldown = 0;     // Current cooldown
        this.pointDefenseAccuracy = 65;    // Base chance to intercept
        this.pdActive = true;              // PD system online

        // Track intercepted missiles for visuals
        this.lastInterceptPos = null;

        // Team colors - teal/cyan for escort ships
        this.color = team === 'friendly' ? '#4a4035' : '#354050';

        // Missile ammo: Medium ship - torpedo boat
        this.missileAmmo = 6;
        this.maxMissileAmmo = 6;

        // Hardpoints: 2 forward torpedoes, 2 PD lasers, 1 flak cannon
        this.addHardpoint(10, 0, 'missile');    // Forward torpedo
        this.addHardpoint(8, -4, 'missile');    // Port torpedo
        this.addHardpoint(3, -6, 'laser');      // Port PD turret
        this.addHardpoint(3, 6, 'laser');       // Starboard PD turret
        this.addHardpoint(-2, 0, 'flak');       // Rear flak cannon
    }

    /**
     * Update destroyer state including point defense
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Update PD cooldown
        if (this.pointDefenseCooldown > 0) {
            this.pointDefenseCooldown -= deltaTime;
        }

        // PD systems are active while alive
        this.pdActive = this.alive;
    }

    /**
     * Attempt to intercept a missile with point defense
     * Returns true if interception was attempted (may still miss)
     */
    attemptIntercept(missile, particleSystem) {
        if (!this.pdActive || !this.alive) return false;
        if (this.pointDefenseCooldown > 0) return false;

        // Check if missile is in range
        const dist = Math.hypot(missile.x - this.x, missile.y - this.y);
        if (dist > this.pointDefenseRange) return false;

        // Reset cooldown
        this.pointDefenseCooldown = this.pointDefenseRate;

        // Roll to intercept
        const roll = Math.random() * 100;
        const intercepted = roll < this.pointDefenseAccuracy;

        // Store position for visual effect
        this.lastInterceptPos = { x: missile.x, y: missile.y };

        if (intercepted) {
            missile.intercept();

            // Create intercept effect
            if (particleSystem) {
                particleSystem.createImpact(
                    missile.x,
                    missile.y,
                    '#333333',
                    8
                );
            }
            return true;
        }

        // Miss - PD tracer flies past
        return false;
    }

    /**
     * Get point defense coverage info for nearby friendlies
     */
    getPointDefenseCoverage() {
        return {
            x: this.x,
            y: this.y,
            range: this.pointDefenseRange,
            ready: this.pointDefenseCooldown <= 0,
            active: this.pdActive
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
            renderColor = '#000000';
        }

        // Dark shadow
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 10;

        // Main hull - sleek angular shape
        ctx.beginPath();
        ctx.moveTo(this.size * 1.0, 0);                // Bow point
        ctx.lineTo(this.size * 0.4, -this.size * 0.4);     // Forward left
        ctx.lineTo(-this.size * 0.2, -this.size * 0.45);   // Mid left
        ctx.lineTo(-this.size * 0.6, -this.size * 0.35);   // Rear left
        ctx.lineTo(-this.size * 0.7, 0);               // Stern
        ctx.lineTo(-this.size * 0.6, this.size * 0.35);    // Rear right
        ctx.lineTo(-this.size * 0.2, this.size * 0.45);    // Mid right
        ctx.lineTo(this.size * 0.4, this.size * 0.4);      // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Forward torpedo tubes
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(this.size * 0.5, -this.size * 0.15, this.size * 0.3, this.size * 0.1);
        ctx.fillRect(this.size * 0.5, this.size * 0.05, this.size * 0.3, this.size * 0.1);

        // PD turret mounts (port and starboard)
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.arc(this.size * 0.1, -this.size * 0.5, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.size * 0.1, this.size * 0.5, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();

        // PD turret barrels (pulsing when active)
        const pdPulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
        ctx.fillStyle = this.pdActive ? `rgba(80, 80, 80, ${pdPulse})` : '#aaaaaa';
        ctx.fillRect(this.size * 0.1, -this.size * 0.55, this.size * 0.15, this.size * 0.04);
        ctx.fillRect(this.size * 0.1, this.size * 0.51, this.size * 0.15, this.size * 0.04);

        // Bridge superstructure
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.ellipse(this.size * 0.15, 0, this.size * 0.12, this.size * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Flak mount (rear)
        ctx.fillStyle = '#555555';
        ctx.beginPath();
        ctx.arc(-this.size * 0.35, 0, this.size * 0.1, 0, Math.PI * 2);
        ctx.fill();

        // Engine array (2 engines)
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.72, -this.size * 0.15, this.size * 0.08, this.size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.72, this.size * 0.15, this.size * 0.08, this.size * 0.06, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Render PD coverage indicator (subtle)
        this.renderPDCoverage(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    /**
     * Render subtle PD coverage indicator
     */
    renderPDCoverage(renderer) {
        if (!this.pdActive) return;

        const ctx = renderer.getContext();
        ctx.save();

        // Subtle pulsing ring showing PD range
        const pulse = Math.sin(Date.now() * 0.004) * 0.3 + 0.7;
        const alpha = 0.06 * pulse;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.pointDefenseRange, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80, 80, 80, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 8]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.restore();
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(0, 0, 0, 0.3)';
        return '#888888';
    }
}

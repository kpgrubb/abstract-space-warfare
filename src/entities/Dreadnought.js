/**
 * Dreadnought.js - Massive super-capital ship
 * The ultimate warship with spinal-mount beam cannon
 *
 * Visual: Enormous elongated hull with central spine weapon
 */

import { Spacecraft } from './Spacecraft.js';

export class Dreadnought extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'dreadnought';
        this.size = 40;          // Largest ship class
        this.speed = 10;         // Extremely slow
        this.turnRate = 0.15;    // Worst maneuverability
        this.health = 600;
        this.maxHealth = 600;    // Most durable ship

        // EVASION: Absolute minimum - massive and lumbering
        this.evasion = 5;

        // TACTICAL ROLE: Heavy Anchor
        // - Fleet centerpiece
        // - Spinal weapon devastates targets
        // - Never retreats
        this.tacticalRole = 'anchor';

        // SHIELDS: Massive shielding
        this.shields = 250;
        this.maxShields = 250;
        this.shieldRegenRate = 20;
        this.shieldRegenDelay = 6;

        // Team colors - darker, more imposing
        this.color = team === 'friendly' ? '#2a2015' : '#152030';

        // Missile ammo: Massive capital ship
        this.missileAmmo = 16;
        this.maxMissileAmmo = 16;

        // SPINAL BEAM CANNON - special weapon
        this.spinalBeamReady = true;
        this.spinalBeamCooldown = 8;    // 8 second cooldown
        this.spinalBeamTimer = 0;
        this.spinalBeamDamage = 150;    // Devastating damage
        this.spinalBeamRange = 500;     // Long range
        this.spinalBeamCharging = false;
        this.spinalBeamChargeTime = 1.5;
        this.spinalBeamCharge = 0;

        // 10 Hardpoints: Overwhelming firepower
        this.addHardpoint(25, 0, 'laser');      // Forward laser battery
        this.addHardpoint(15, -15, 'ballistic'); // Port forward turret
        this.addHardpoint(15, 15, 'ballistic');  // Starboard forward turret
        this.addHardpoint(5, -18, 'laser');      // Port broadside
        this.addHardpoint(5, 18, 'laser');       // Starboard broadside
        this.addHardpoint(-5, -20, 'missile');   // Port missile battery
        this.addHardpoint(-5, 20, 'missile');    // Starboard missile battery
        this.addHardpoint(-15, -12, 'ballistic'); // Port aft turret
        this.addHardpoint(-15, 12, 'ballistic');  // Starboard aft turret
        this.addHardpoint(-10, 0, 'laser');       // Rear defense
    }

    update(deltaTime, allShips = []) {
        super.update(deltaTime);

        // Update spinal beam cooldown
        if (!this.spinalBeamReady) {
            this.spinalBeamTimer += deltaTime;
            if (this.spinalBeamTimer >= this.spinalBeamCooldown) {
                this.spinalBeamReady = true;
                this.spinalBeamTimer = 0;
            }
        }

        // Update charge if charging
        if (this.spinalBeamCharging) {
            this.spinalBeamCharge += deltaTime;
        }
    }

    /**
     * Begin charging the spinal beam at a target
     */
    chargeSpinalBeam(target) {
        if (!this.spinalBeamReady || this.spinalBeamCharging) return false;

        this.spinalBeamCharging = true;
        this.spinalBeamCharge = 0;
        this.spinalBeamTarget = target;
        return true;
    }

    /**
     * Fire the spinal beam if charged
     * Returns damage info or null
     */
    fireSpinalBeam() {
        if (!this.spinalBeamCharging || this.spinalBeamCharge < this.spinalBeamChargeTime) {
            return null;
        }

        this.spinalBeamCharging = false;
        this.spinalBeamCharge = 0;
        this.spinalBeamReady = false;
        this.spinalBeamTimer = 0;

        // Return beam info for rendering
        return {
            damage: this.spinalBeamDamage,
            target: this.spinalBeamTarget,
            origin: { x: this.x, y: this.y },
            rotation: this.rotation
        };
    }

    /**
     * Cancel charging
     */
    cancelSpinalCharge() {
        this.spinalBeamCharging = false;
        this.spinalBeamCharge = 0;
        this.spinalBeamTarget = null;
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
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 12;

        // Main hull - elongated wedge with multiple sections
        ctx.beginPath();
        ctx.moveTo(this.size * 0.9, 0);                  // Bow point
        ctx.lineTo(this.size * 0.5, -this.size * 0.25);  // Forward left
        ctx.lineTo(this.size * 0.3, -this.size * 0.35);  // Mid-forward left
        ctx.lineTo(-this.size * 0.1, -this.size * 0.4);  // Mid left
        ctx.lineTo(-this.size * 0.5, -this.size * 0.35); // Rear left
        ctx.lineTo(-this.size * 0.7, -this.size * 0.25); // Stern left
        ctx.lineTo(-this.size * 0.8, 0);                 // Stern center
        ctx.lineTo(-this.size * 0.7, this.size * 0.25);  // Stern right
        ctx.lineTo(-this.size * 0.5, this.size * 0.35);  // Rear right
        ctx.lineTo(-this.size * 0.1, this.size * 0.4);   // Mid right
        ctx.lineTo(this.size * 0.3, this.size * 0.35);   // Mid-forward right
        ctx.lineTo(this.size * 0.5, this.size * 0.25);   // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 3;
        ctx.stroke();

        // Spinal beam channel (central groove)
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(this.size * 0.85, 0);
        ctx.lineTo(this.size * 0.2, -this.size * 0.08);
        ctx.lineTo(-this.size * 0.3, -this.size * 0.1);
        ctx.lineTo(-this.size * 0.3, this.size * 0.1);
        ctx.lineTo(this.size * 0.2, this.size * 0.08);
        ctx.closePath();
        ctx.fill();

        // Spinal beam charging glow
        if (this.spinalBeamCharging) {
            const chargeProgress = this.spinalBeamCharge / this.spinalBeamChargeTime;
            ctx.fillStyle = `rgba(0, 0, 0, ${chargeProgress * 0.8})`;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 10 + chargeProgress * 15;
            ctx.beginPath();
            ctx.moveTo(this.size * 0.8, 0);
            ctx.lineTo(this.size * 0.15, -this.size * 0.06);
            ctx.lineTo(-this.size * 0.25, -this.size * 0.08);
            ctx.lineTo(-this.size * 0.25, this.size * 0.08);
            ctx.lineTo(this.size * 0.15, this.size * 0.06);
            ctx.closePath();
            ctx.fill();
        }

        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 10;

        // Armored prow sections
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.92, 0);
        ctx.lineTo(this.size * 0.6, -this.size * 0.15);
        ctx.lineTo(this.size * 0.6, this.size * 0.15);
        ctx.closePath();
        ctx.fill();

        // Main turrets (large)
        ctx.fillStyle = this.lightenColor(renderColor);
        const mainTurrets = [
            { x: 0.4, y: -0.28 },
            { x: 0.4, y: 0.28 },
            { x: 0.0, y: -0.32 },
            { x: 0.0, y: 0.32 }
        ];
        for (const pos of mainTurrets) {
            ctx.beginPath();
            ctx.arc(this.size * pos.x, this.size * pos.y, this.size * 0.1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Secondary turrets
        const secondaryTurrets = [
            { x: -0.25, y: -0.28 },
            { x: -0.25, y: 0.28 },
            { x: -0.45, y: -0.2 },
            { x: -0.45, y: 0.2 }
        ];
        for (const pos of secondaryTurrets) {
            ctx.beginPath();
            ctx.arc(this.size * pos.x, this.size * pos.y, this.size * 0.07, 0, Math.PI * 2);
            ctx.fill();
        }

        // Command superstructure
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.rect(this.size * 0.1, -this.size * 0.12, this.size * 0.2, this.size * 0.24);
        ctx.fill();

        // Command tower
        ctx.beginPath();
        ctx.rect(this.size * 0.15, -this.size * 0.08, this.size * 0.1, this.size * 0.16);
        ctx.fill();

        // Engine bank (8 large engines)
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.6;
        const engineY = [-0.28, -0.18, -0.08, 0.02, -0.02, 0.08, 0.18, 0.28];
        for (let i = 0; i < engineY.length; i++) {
            const ey = engineY[i];
            if (i < 4) {
                ctx.beginPath();
                ctx.ellipse(-this.size * 0.82, this.size * ey, this.size * 0.07, this.size * 0.045, 0, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.ellipse(-this.size * 0.82, this.size * ey, this.size * 0.07, this.size * 0.045, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(0, 0, 0, 0.3)';
        return '#888888';
    }
}

/**
 * Battleship.js - Capital ship, maximum firepower
 * Massive, slow, heavily armed and armored
 *
 * Visual: Multi-section hull with numerous weapon mounts
 */

import { Spacecraft } from './Spacecraft.js';

export class Battleship extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'battleship';
        this.size = 28;          // Smaller for distant view
        this.speed = 15;         // Very slow, ponderous
        this.turnRate = 0.25;    // Very poor maneuverability
        this.health = 400;
        this.maxHealth = 400;    // Extremely durable

        // EVASION: Lowest - massive, slow, easy to hit
        // Battleships rely on armor and firepower, not dodging
        this.evasion = 10;

        // TACTICAL ROLE: Anchor/Heavy
        // - Anchors the battle line
        // - Pushes forward relentlessly
        // - Primary target for enemy fleet
        // - Inspires nearby friendlies (morale aura)
        // - Never withdraws (fights to the death)
        this.tacticalRole = 'anchor';

        // SHIELDS: Heaviest shielding in the fleet
        this.shields = 150;
        this.maxShields = 150;
        this.shieldRegenRate = 15;
        this.shieldRegenDelay = 5;  // Slower to recover due to larger system

        // Team colors
        this.color = team === 'friendly' ? '#3a3025' : '#d8d8d8';

        // Missile ammo: Large capital ship
        this.missileAmmo = 12;
        this.maxMissileAmmo = 12;

        // 8 Hardpoints: Full broadside capability
        this.addHardpoint(18, 0, 'ballistic');   // Main forward battery
        this.addHardpoint(10, -10, 'laser');     // Port forward turret
        this.addHardpoint(10, 10, 'laser');      // Starboard forward turret
        this.addHardpoint(0, -12, 'ballistic');  // Port broadside
        this.addHardpoint(0, 12, 'ballistic');   // Starboard broadside
        this.addHardpoint(-7, -8, 'missile');    // Port aft launcher
        this.addHardpoint(-7, 8, 'missile');     // Starboard aft launcher
        this.addHardpoint(-3, 0, 'laser');       // Rear defense turret
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

        // Main hull - massive wedge shape
        ctx.beginPath();
        ctx.moveTo(this.size * 0.8, 0);                // Bow point
        ctx.lineTo(this.size * 0.4, -this.size * 0.45);     // Forward left
        ctx.lineTo(-this.size * 0.2, -this.size * 0.5);     // Mid left
        ctx.lineTo(-this.size * 0.6, -this.size * 0.45);    // Rear left
        ctx.lineTo(-this.size * 0.7, -this.size * 0.25);    // Stern left
        ctx.lineTo(-this.size * 0.75, 0);              // Stern center
        ctx.lineTo(-this.size * 0.7, this.size * 0.25);     // Stern right
        ctx.lineTo(-this.size * 0.6, this.size * 0.45);     // Rear right
        ctx.lineTo(-this.size * 0.2, this.size * 0.5);      // Mid right
        ctx.lineTo(this.size * 0.4, this.size * 0.45);      // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Armored prow
        ctx.beginPath();
        ctx.moveTo(this.size * 0.85, 0);
        ctx.lineTo(this.size * 0.5, -this.size * 0.2);
        ctx.lineTo(this.size * 0.5, this.size * 0.2);
        ctx.closePath();
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fill();

        // Main turret (forward)
        ctx.beginPath();
        ctx.arc(this.size * 0.35, 0, this.size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(this.size * 0.35, -this.size * 0.03, this.size * 0.25, this.size * 0.06);

        // Side turrets
        const turretPositions = [
            { x: 0.15, y: -0.4 },
            { x: 0.15, y: 0.4 },
            { x: -0.15, y: -0.4 },
            { x: -0.15, y: 0.4 }
        ];
        for (const pos of turretPositions) {
            ctx.beginPath();
            ctx.arc(this.size * pos.x, this.size * pos.y, this.size * 0.08, 0, Math.PI * 2);
            ctx.fill();
        }

        // Missile bays
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-this.size * 0.45, -this.size * 0.35, this.size * 0.18, this.size * 0.12);
        ctx.fillRect(-this.size * 0.45, this.size * 0.23, this.size * 0.18, this.size * 0.12);

        // Bridge superstructure (raised section)
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.1, -this.size * 0.15);
        ctx.lineTo(this.size * 0.25, -this.size * 0.2);
        ctx.lineTo(this.size * 0.25, this.size * 0.2);
        ctx.lineTo(this.size * 0.1, this.size * 0.15);
        ctx.lineTo(-this.size * 0.15, this.size * 0.2);
        ctx.lineTo(-this.size * 0.15, -this.size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Command tower
        ctx.beginPath();
        ctx.rect(this.size * 0.0, -this.size * 0.08, this.size * 0.12, this.size * 0.16);
        ctx.fill();

        // Engine bank (6 engines)
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.6;
        const engineY = [-0.35, -0.2, -0.05, 0.05, 0.2, 0.35];
        for (const ey of engineY) {
            ctx.beginPath();
            ctx.ellipse(-this.size * 0.78, this.size * ey, this.size * 0.06, this.size * 0.05, 0, 0, Math.PI * 2);
            ctx.fill();
        }

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

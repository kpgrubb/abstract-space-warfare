/**
 * Cruiser.js - Main battle line vessel
 * Balanced stats, mixed weapon loadout
 *
 * Visual: Sturdy angular hull with multiple weapon mounts
 */

import { Spacecraft } from './Spacecraft.js';

export class Cruiser extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'cruiser';
        this.size = 16;          // Smaller for distant view
        this.speed = 30;         // Slower, more ponderous
        this.turnRate = 0.8;     // Moderate maneuverability
        this.health = 180;
        this.maxHealth = 180;

        // EVASION: Low-moderate - big enough to hit, but not huge
        // Cruisers can still dodge some fire, especially at range
        this.evasion = 35;

        // TACTICAL ROLE: Line Ship
        // - Forms the main battle line
        // - Versatile - can engage any target
        // - Maintains formation with other cruisers
        // - Primary damage dealer against other capitals
        this.tacticalRole = 'line';

        // SHIELDS: Moderate shielding
        this.shields = 60;
        this.maxShields = 60;
        this.shieldRegenRate = 8;
        this.shieldRegenDelay = 3;

        // Team colors
        this.color = team === 'friendly' ? '#4a4035' : '#e8e8e8';

        // Missile ammo: Medium/large ship
        this.missileAmmo = 8;
        this.maxMissileAmmo = 8;

        // Hardpoints: 1 forward ballistic, 2 side lasers, 2 rear missiles
        this.addHardpoint(12, 0, 'ballistic');   // Forward cannon
        this.addHardpoint(3, -8, 'laser');       // Left turret
        this.addHardpoint(3, 8, 'laser');        // Right turret
        this.addHardpoint(-5, -5, 'missile');    // Left missile
        this.addHardpoint(-5, 5, 'missile');     // Right missile
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

        // Main hull - angular wedge shape
        ctx.beginPath();
        ctx.moveTo(this.size * 0.9, 0);                // Bow point
        ctx.lineTo(this.size * 0.3, -this.size * 0.5);     // Forward left
        ctx.lineTo(-this.size * 0.4, -this.size * 0.55);   // Mid left
        ctx.lineTo(-this.size * 0.7, -this.size * 0.35);   // Rear left
        ctx.lineTo(-this.size * 0.8, 0);               // Stern
        ctx.lineTo(-this.size * 0.7, this.size * 0.35);    // Rear right
        ctx.lineTo(-this.size * 0.4, this.size * 0.55);    // Mid right
        ctx.lineTo(this.size * 0.3, this.size * 0.5);      // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Forward weapon mount
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.95, 0);
        ctx.lineTo(this.size * 0.6, -this.size * 0.12);
        ctx.lineTo(this.size * 0.6, this.size * 0.12);
        ctx.closePath();
        ctx.fill();

        // Side turret pods
        ctx.fillRect(0, -this.size * 0.7, this.size * 0.25, this.size * 0.2);
        ctx.fillRect(0, this.size * 0.5, this.size * 0.25, this.size * 0.2);

        // Missile bays
        ctx.fillStyle = '#444444';
        ctx.fillRect(-this.size * 0.5, -this.size * 0.45, this.size * 0.2, this.size * 0.15);
        ctx.fillRect(-this.size * 0.5, this.size * 0.3, this.size * 0.2, this.size * 0.15);

        // Bridge superstructure
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.ellipse(this.size * 0.1, 0, this.size * 0.18, this.size * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine array
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-this.size * 0.85, -this.size * 0.25, this.size * 0.12, this.size * 0.15);
        ctx.fillRect(-this.size * 0.85, this.size * 0.1, this.size * 0.12, this.size * 0.15);

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

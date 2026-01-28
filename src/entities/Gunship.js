/**
 * Gunship.js - Heavy attack fighter
 * Slower than a fighter but much more heavily armed
 *
 * Visual: Bulky angular craft with visible weapon pods
 */

import { Spacecraft } from './Spacecraft.js';

export class Gunship extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'gunship';
        this.size = 12;          // Larger than fighter
        this.speed = 45;         // Slower than fighter
        this.turnRate = 1.2;     // Less maneuverable
        this.health = 100;
        this.maxHealth = 100;    // Tougher than fighter

        // EVASION: Moderate - bigger target but still nimble
        this.evasion = 45;

        // TACTICAL ROLE: Attack
        // - Heavy strike craft
        // - Attacks larger ships
        // - Can brawl with fighters
        this.tacticalRole = 'attack';

        // Light shields
        this.shields = 25;
        this.maxShields = 25;
        this.shieldRegenRate = 5;
        this.shieldRegenDelay = 3;

        // Team colors
        this.color = team === 'friendly' ? '#4a4035' : '#354050';

        // Missile ammo: Small/medium ship
        this.missileAmmo = 4;
        this.maxMissileAmmo = 4;

        // Hardpoints: Heavy armament
        this.addHardpoint(8, -5, 'ballistic');   // Left nose cannon
        this.addHardpoint(8, 5, 'ballistic');    // Right nose cannon
        this.addHardpoint(4, -8, 'laser');       // Left wing laser
        this.addHardpoint(4, 8, 'laser');        // Right wing laser
        this.addHardpoint(0, 0, 'missile');      // Center missile rack
        this.addHardpoint(-2, 0, 'missile');     // Secondary missile
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

        // Main hull - bulky angular shape
        ctx.beginPath();
        ctx.moveTo(this.size * 1.0, 0);               // Nose
        ctx.lineTo(this.size * 0.4, -this.size * 0.4); // Forward left
        ctx.lineTo(-this.size * 0.2, -this.size * 0.5); // Mid left
        ctx.lineTo(-this.size * 0.5, -this.size * 0.35); // Rear left
        ctx.lineTo(-this.size * 0.6, 0);              // Tail
        ctx.lineTo(-this.size * 0.5, this.size * 0.35); // Rear right
        ctx.lineTo(-this.size * 0.2, this.size * 0.5);  // Mid right
        ctx.lineTo(this.size * 0.4, this.size * 0.4);  // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Weapon pods on wings
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fillRect(this.size * 0.1, -this.size * 0.6, this.size * 0.3, this.size * 0.15);
        ctx.fillRect(this.size * 0.1, this.size * 0.45, this.size * 0.3, this.size * 0.15);

        // Nose cannons
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(this.size * 0.7, -this.size * 0.15, this.size * 0.35, this.size * 0.08);
        ctx.fillRect(this.size * 0.7, this.size * 0.07, this.size * 0.35, this.size * 0.08);

        // Cockpit
        ctx.beginPath();
        ctx.ellipse(this.size * 0.35, 0, this.size * 0.2, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fill();

        // Engine glow (twin engines)
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.55, -this.size * 0.2, this.size * 0.12, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.55, this.size * 0.2, this.size * 0.12, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

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

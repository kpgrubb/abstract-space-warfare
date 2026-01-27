/**
 * Fighter.js - Fast interceptor craft
 * Small, agile, deadly against slow ships
 *
 * Visual: Arrow/dart shape pointing forward
 */

import { Spacecraft } from './Spacecraft.js';

export class Fighter extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'fighter';
        this.size = 8;           // Smaller for distant view
        this.speed = 65;         // Fastest ship (but still ponderous)
        this.turnRate = 2.0;     // Maneuverable
        this.health = 50;
        this.maxHealth = 50;     // Fragile

        // EVASION: Very high - small and fast
        // Fighters are the hardest ships to hit
        this.evasion = 75;

        // TACTICAL ROLE: Interceptor/Striker
        // - Performs strafing runs on larger ships
        // - Chases down damaged enemies
        // - Avoids prolonged engagements (hit and run)
        // - Excellent against carriers and other slow targets
        this.tacticalRole = 'interceptor';

        // Team colors
        this.color = team === 'friendly' ? '#00ddff' : '#ff4466';

        // Missile ammo: Small ship - very limited
        this.missileAmmo = 2;
        this.maxMissileAmmo = 2;

        // Hardpoints: 2 nose cannons + 1 center missile
        this.addHardpoint(6, -3, 'ballistic');   // Left nose gun
        this.addHardpoint(6, 3, 'ballistic');    // Right nose gun
        this.addHardpoint(0, 0, 'missile');      // Center missile
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
        ctx.shadowBlur = 12;

        // Main hull - sleek arrow shape
        ctx.beginPath();
        ctx.moveTo(this.size * 1.2, 0);              // Nose
        ctx.lineTo(-this.size * 0.3, -this.size * 0.5);  // Left wing tip
        ctx.lineTo(-this.size * 0.1, -this.size * 0.15); // Left wing root
        ctx.lineTo(-this.size * 0.4, 0);             // Tail
        ctx.lineTo(-this.size * 0.1, this.size * 0.15);  // Right wing root
        ctx.lineTo(-this.size * 0.3, this.size * 0.5);   // Right wing tip
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cockpit
        ctx.beginPath();
        ctx.ellipse(this.size * 0.3, 0, this.size * 0.25, this.size * 0.12, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fill();

        // Engine glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#00aaff';
        ctx.fillStyle = '#00ccff';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.4, 0, this.size * 0.12, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        // Simple color lightening
        if (color.startsWith('rgba')) return 'rgba(255, 255, 255, 0.8)';
        return '#ffffff';
    }
}

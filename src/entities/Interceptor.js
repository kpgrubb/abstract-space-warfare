/**
 * Interceptor.js - Ultra-fast fighter killer
 * Specialized in hunting down small craft
 *
 * Visual: Sleek needle-like shape, minimal profile
 */

import { Spacecraft } from './Spacecraft.js';

export class Interceptor extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'interceptor';
        this.size = 7;           // Smallest ship
        this.speed = 85;         // Fastest ship in the game
        this.turnRate = 2.5;     // Extremely maneuverable
        this.health = 35;
        this.maxHealth = 35;     // Very fragile

        // EVASION: Highest - tiny and blazing fast
        this.evasion = 85;

        // TACTICAL ROLE: Interceptor
        // - Hunts fighters and gunships
        // - Avoids larger ships
        // - Hit and run attacks
        this.tacticalRole = 'interceptor';

        // No shields - pure speed
        this.shields = 0;
        this.maxShields = 0;

        // Team colors - bright and fast-looking
        this.color = team === 'friendly' ? '#00ffdd' : '#ff3366';

        // Hardpoints: Light but rapid-fire
        this.addHardpoint(5, -2, 'laser');    // Left nose laser
        this.addHardpoint(5, 2, 'laser');     // Right nose laser
        this.addHardpoint(3, 0, 'ballistic'); // Center gun
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
        ctx.shadowBlur = 10;

        // Main hull - needle shape
        ctx.beginPath();
        ctx.moveTo(this.size * 1.5, 0);                // Sharp nose
        ctx.lineTo(this.size * 0.3, -this.size * 0.25); // Forward left
        ctx.lineTo(-this.size * 0.4, -this.size * 0.4); // Wing left
        ctx.lineTo(-this.size * 0.2, -this.size * 0.1); // Wing root left
        ctx.lineTo(-this.size * 0.5, 0);               // Tail
        ctx.lineTo(-this.size * 0.2, this.size * 0.1);  // Wing root right
        ctx.lineTo(-this.size * 0.4, this.size * 0.4);  // Wing right
        ctx.lineTo(this.size * 0.3, this.size * 0.25);  // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1;
        ctx.stroke();

        // Cockpit (small)
        ctx.beginPath();
        ctx.ellipse(this.size * 0.4, 0, this.size * 0.2, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fill();

        // Engine glow (single powerful engine)
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffaa';
        ctx.fillStyle = '#00ffcc';
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.5, 0, this.size * 0.15, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(255, 255, 255, 0.8)';
        return '#ffffff';
    }
}

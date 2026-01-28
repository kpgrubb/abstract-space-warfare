/**
 * Frigate.js - Light support vessel
 * Versatile escort ship, good against fighters
 *
 * Visual: Elongated hull with side turrets
 */

import { Spacecraft } from './Spacecraft.js';

export class Frigate extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'frigate';
        this.size = 12;          // Smaller for distant view
        this.speed = 45;         // Moderate speed
        this.turnRate = 1.2;     // Good maneuverability
        this.health = 100;
        this.maxHealth = 100;

        // EVASION: Moderate - decent speed and size
        // Good at evading capital ship fire, vulnerable to fighters
        this.evasion = 55;

        // TACTICAL ROLE: Escort/Screen
        // - Screens capital ships from fighters
        // - Harasses enemy escorts
        // - Anti-fighter specialist (laser turrets)
        // - Maintains formation with larger ships
        this.tacticalRole = 'escort';

        // Team colors
        this.color = team === 'friendly' ? '#4a4035' : '#354050';

        // Hardpoints: 2 forward ballistic + 2 side lasers
        this.addHardpoint(9, -2, 'ballistic');   // Left forward
        this.addHardpoint(9, 2, 'ballistic');    // Right forward
        this.addHardpoint(0, -7, 'laser');       // Left turret
        this.addHardpoint(0, 7, 'laser');        // Right turret
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

        // Main hull - elongated hexagon
        ctx.beginPath();
        ctx.moveTo(this.size * 1.0, 0);               // Nose
        ctx.lineTo(this.size * 0.4, -this.size * 0.4);    // Front left
        ctx.lineTo(-this.size * 0.5, -this.size * 0.4);   // Rear left
        ctx.lineTo(-this.size * 0.8, 0);              // Tail
        ctx.lineTo(-this.size * 0.5, this.size * 0.4);    // Rear right
        ctx.lineTo(this.size * 0.4, this.size * 0.4);     // Front right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Side turret pods
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fillRect(-this.size * 0.2, -this.size * 0.65, this.size * 0.4, this.size * 0.2);
        ctx.fillRect(-this.size * 0.2, this.size * 0.45, this.size * 0.4, this.size * 0.2);

        // Bridge section
        ctx.beginPath();
        ctx.ellipse(this.size * 0.2, 0, this.size * 0.2, this.size * 0.15, 0, 0, Math.PI * 2);
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fill();

        // Engine glow
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-this.size * 0.85, -this.size * 0.2, this.size * 0.15, this.size * 0.4);

        ctx.restore();

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(0, 0, 0, 0.3)';
        return '#888888';
    }
}

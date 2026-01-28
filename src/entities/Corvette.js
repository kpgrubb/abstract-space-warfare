/**
 * Corvette.js - Electronic Warfare specialist vessel
 * Small, fast, equipped with jamming systems that disrupt enemy targeting
 *
 * Visual: Sleek hull with antenna arrays and electronic warfare pods
 */

import { Spacecraft } from './Spacecraft.js';

export class Corvette extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'corvette';
        this.size = 10;          // Small and agile
        this.speed = 50;         // Fast, but not as fast as fighters
        this.turnRate = 1.5;     // Good maneuverability
        this.health = 70;
        this.maxHealth = 70;     // Fragile

        // SHIELDS: Light shielding for survivability
        this.shields = 30;
        this.maxShields = 30;
        this.shieldRegenRate = 5;  // Moderate regen
        this.shieldRegenDelay = 2;

        // EVASION: High - small and nimble
        this.evasion = 65;

        // TACTICAL ROLE: Electronic Warfare
        // - Disrupts enemy targeting within jamming range
        // - Stays near friendly capitals to protect them
        // - High priority target - enemies want to eliminate EW support
        this.tacticalRole = 'electronic_warfare';

        // EW Jamming capabilities
        this.ewJammingRange = 180;    // Range of jamming effect
        this.ewJammingStrength = 20;  // Accuracy penalty to enemies in range
        this.ewActive = true;         // EW systems online

        // Team colors - distinct purple/violet for EW ships
        this.color = team === 'friendly' ? '#4a4035' : '#354050';

        // Hardpoints: Light defensive armament only
        // EW corvettes focus on support, not damage
        this.addHardpoint(7, -3, 'laser');    // Left point defense
        this.addHardpoint(7, 3, 'laser');     // Right point defense
    }

    /**
     * Update corvette state including EW effects
     */
    update(deltaTime) {
        super.update(deltaTime);

        // EW systems are always active while alive
        this.ewActive = this.alive;
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

        // Main hull - sleek elongated shape
        ctx.beginPath();
        ctx.moveTo(this.size * 1.1, 0);              // Nose
        ctx.lineTo(this.size * 0.4, -this.size * 0.35);  // Forward left
        ctx.lineTo(-this.size * 0.3, -this.size * 0.4);  // Mid left
        ctx.lineTo(-this.size * 0.7, -this.size * 0.25); // Rear left
        ctx.lineTo(-this.size * 0.8, 0);             // Tail
        ctx.lineTo(-this.size * 0.7, this.size * 0.25);  // Rear right
        ctx.lineTo(-this.size * 0.3, this.size * 0.4);   // Mid right
        ctx.lineTo(this.size * 0.4, this.size * 0.35);   // Forward right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // EW antenna array (top)
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.1, -this.size * 0.4);
        ctx.lineTo(this.size * 0.2, -this.size * 0.6);
        ctx.lineTo(-this.size * 0.1, -this.size * 0.6);
        ctx.lineTo(-this.size * 0.2, -this.size * 0.4);
        ctx.closePath();
        ctx.fill();

        // EW antenna array (bottom)
        ctx.beginPath();
        ctx.moveTo(this.size * 0.1, this.size * 0.4);
        ctx.lineTo(this.size * 0.2, this.size * 0.6);
        ctx.lineTo(-this.size * 0.1, this.size * 0.6);
        ctx.lineTo(-this.size * 0.2, this.size * 0.4);
        ctx.closePath();
        ctx.fill();

        // EW emitter pods (pulsing)
        const ewPulse = Math.sin(Date.now() * 0.006) * 0.5 + 0.5;
        ctx.fillStyle = `rgba(80, 80, 80, ${0.5 + ewPulse * 0.5})`;
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 6 + ewPulse * 4;

        // Left emitter
        ctx.beginPath();
        ctx.arc(-this.size * 0.1, -this.size * 0.55, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Right emitter
        ctx.beginPath();
        ctx.arc(-this.size * 0.1, this.size * 0.55, this.size * 0.08, 0, Math.PI * 2);
        ctx.fill();

        // Sensor dome (front)
        ctx.shadowBlur = 6;
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.ellipse(this.size * 0.5, 0, this.size * 0.15, this.size * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#333333';
        ctx.fillStyle = '#333333';
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.ellipse(-this.size * 0.82, 0, this.size * 0.1, this.size * 0.08, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Render EW jamming field (subtle visual)
        this.renderJammingField(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    /**
     * Render visual indicator of EW jamming field
     */
    renderJammingField(renderer) {
        if (!this.ewActive) return;

        const ctx = renderer.getContext();
        ctx.save();

        // Subtle pulsing ring showing jamming range
        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
        const alpha = 0.08 * pulse;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.ewJammingRange, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(80, 80, 80, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 10]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Inner gradient showing field strength
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.ewJammingRange
        );
        gradient.addColorStop(0, `rgba(80, 80, 80, ${alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(80, 80, 80, ${alpha * 0.15})`);
        gradient.addColorStop(1, 'rgba(80, 80, 80, 0)');

        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(0, 0, 0, 0.3)';
        return '#888888';
    }
}

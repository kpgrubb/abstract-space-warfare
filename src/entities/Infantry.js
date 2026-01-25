/**
 * Infantry.js - Infantry units (triangles)
 * Musket-armed foot soldiers with medium range and speed
 */

import { Unit } from './Unit.js';
import { Colors } from '../visual/Colors.js';

export class Infantry extends Unit {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        // Infantry-specific properties
        this.type = 'infantry';
        this.size = 14;
        this.speed = 40; // Slower than cavalry
        this.range = 150; // Medium range (musket)
        this.damage = 15;
        this.fireRate = 0.5; // 2 seconds per shot

        // Set color based on team
        this.color = team === 'friendly' ? Colors.FRIENDLY_PRIMARY : Colors.ENEMY_PRIMARY;

        // Formation properties
        this.inSquare = false; // Defensive square formation
    }

    /**
     * Update infantry behavior
     */
    update(deltaTime) {
        super.update(deltaTime);

        // Infantry-specific behavior can be added here
        // For now, just basic movement
    }

    /**
     * Render infantry as triangle
     */
    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();

        // Calculate rotation (point triangle in movement direction + 90 degrees)
        const renderRotation = this.rotation + Math.PI / 2;

        // Last stand units pulse gold/white
        let renderColor = this.color;
        if (this.isLastStand) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.5 + 0.5;
            renderColor = `rgba(255, 220, 100, ${0.8 + pulse * 0.2})`;
        } else if (this.isRouting) {
            // Routing units flash red
            const flash = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            renderColor = `rgba(255, 50, 50, ${0.5 + flash * 0.5})`;
        }

        // Draw the triangle
        renderer.drawTriangle(
            this.x,
            this.y,
            this.size,
            renderRotation,
            renderColor,
            true // Enable glow
        );

        // If in defensive square, add visual indicator
        if (this.inSquare) {
            ctx.save();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.4;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
            ctx.restore();
        }

        // Debug: Draw health bar (can be removed later)
        if (this.health < this.maxHealth) {
            const barWidth = this.size * 2;
            const barHeight = 3;
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.size - 10;

            // Background
            renderer.drawLine(barX, barY, barX + barWidth, barY, '#333333', barHeight);

            // Health
            const healthWidth = (this.health / this.maxHealth) * barWidth;
            renderer.drawLine(barX, barY, barX + healthWidth, barY, this.color, barHeight);
        }
    }

    /**
     * Form defensive square (bonus vs cavalry)
     */
    formSquare() {
        this.inSquare = true;
        this.speed *= 0.5; // Slower when in square
    }

    /**
     * Break defensive square
     */
    breakSquare() {
        this.inSquare = false;
        this.speed *= 2.0; // Restore normal speed
    }
}

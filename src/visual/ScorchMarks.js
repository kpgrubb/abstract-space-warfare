/**
 * ScorchMarks.js - Persistent ground damage from explosions
 * Renders scorch marks that fade over time
 */

export class ScorchMark {
    constructor(x, y, radius, intensity = 1.0) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.intensity = intensity;
        this.maxIntensity = intensity;
        this.fadeRate = 0.15; // Fade per second
        this.alive = true;
    }

    update(deltaTime) {
        this.intensity -= this.fadeRate * deltaTime;
        if (this.intensity <= 0) {
            this.alive = false;
        }
    }

    render(ctx) {
        if (!this.alive) return;

        ctx.save();

        // Create gradient for scorch mark
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.radius
        );

        const alpha = this.intensity / this.maxIntensity;
        gradient.addColorStop(0, `rgba(180, 180, 180, ${0.4 * alpha})`);
        gradient.addColorStop(0.5, `rgba(190, 190, 190, ${0.25 * alpha})`);
        gradient.addColorStop(1, `rgba(240, 240, 240, 0)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(
            this.x - this.radius,
            this.y - this.radius,
            this.radius * 2,
            this.radius * 2
        );

        ctx.restore();
    }
}

export class ScorchMarkSystem {
    constructor(maxMarks = 50) {
        this.marks = [];
        this.maxMarks = maxMarks;
    }

    /**
     * Add a scorch mark
     */
    addMark(x, y, radius, intensity = 1.0) {
        const mark = new ScorchMark(x, y, radius, intensity);
        this.marks.push(mark);

        // Remove oldest if over limit
        if (this.marks.length > this.maxMarks) {
            this.marks.shift();
        }
    }

    /**
     * Update all marks
     */
    update(deltaTime) {
        for (const mark of this.marks) {
            mark.update(deltaTime);
        }

        // Remove dead marks
        this.marks = this.marks.filter(m => m.alive);
    }

    /**
     * Render all marks (render before units)
     */
    render(renderer) {
        const ctx = renderer.getContext();
        for (const mark of this.marks) {
            mark.render(ctx);
        }
    }

    /**
     * Clear all marks
     */
    clear() {
        this.marks = [];
    }
}

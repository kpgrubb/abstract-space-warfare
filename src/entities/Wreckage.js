/**
 * Wreckage.js - Persistent debris from destroyed ships
 * Floats and rotates in zero-G, slowly fades over time
 */

export class Wreckage {
    constructor(x, y, size, color, velocity, shipType) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.shipType = shipType;

        // Inherit some momentum from destroyed ship (reduced)
        this.vx = (velocity?.x || 0) * 0.3 + (Math.random() - 0.5) * 20;
        this.vy = (velocity?.y || 0) * 0.3 + (Math.random() - 0.5) * 20;

        // Rotation
        this.rotation = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 1.5;

        // Lifetime (longer for larger ships)
        const baseLifetime = 30 + size * 0.5;
        this.lifetime = baseLifetime;
        this.maxLifetime = baseLifetime;
        this.alive = true;

        // Generate wreckage fragments
        this.fragments = this.generateFragments();

        // Type for entity filtering
        this.type = 'wreckage';
        this.team = null; // No team affiliation
    }

    /**
     * Generate random hull fragments based on ship size
     */
    generateFragments() {
        const fragments = [];
        const numFragments = Math.floor(this.size / 8) + 2;

        for (let i = 0; i < numFragments; i++) {
            const fragSize = this.size * (0.3 + Math.random() * 0.4);
            const numVertices = Math.floor(Math.random() * 3) + 3; // 3-5 vertices
            const vertices = [];

            for (let v = 0; v < numVertices; v++) {
                const angle = (v / numVertices) * Math.PI * 2 + Math.random() * 0.5;
                const dist = fragSize * (0.5 + Math.random() * 0.5);
                vertices.push({
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist
                });
            }

            fragments.push({
                vertices,
                offsetX: (Math.random() - 0.5) * this.size * 0.8,
                offsetY: (Math.random() - 0.5) * this.size * 0.8,
                rotation: Math.random() * Math.PI * 2,
                angularVel: (Math.random() - 0.5) * 2
            });
        }

        return fragments;
    }

    /**
     * Update wreckage position and lifetime
     */
    update(deltaTime) {
        if (!this.alive) return;

        // Drift (zero-G, no friction)
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Very slight drag in space (solar wind, debris interaction)
        this.vx *= 0.999;
        this.vy *= 0.999;

        // Rotate main body
        this.rotation += this.angularVelocity * deltaTime;

        // Rotate individual fragments
        for (const frag of this.fragments) {
            frag.rotation += frag.angularVel * deltaTime;
        }

        // Fade over time
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }

        // Wrap around screen edges (or could remove when off-screen)
        const canvas = document.getElementById('battleCanvas');
        if (canvas) {
            const margin = this.size * 2;
            if (this.x < -margin) this.x = canvas.width + margin;
            if (this.x > canvas.width + margin) this.x = -margin;
            if (this.y < -margin) this.y = canvas.height + margin;
            if (this.y > canvas.height + margin) this.y = -margin;
        }
    }

    /**
     * Render wreckage fragments
     */
    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();
        const alpha = Math.min(1.0, this.lifetime / this.maxLifetime);

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Dim the color for wreckage
        const dimColor = this.dimColor(this.color, 0.5);

        // Draw each fragment
        for (const frag of this.fragments) {
            ctx.save();
            ctx.translate(frag.offsetX, frag.offsetY);
            ctx.rotate(frag.rotation);
            ctx.globalAlpha = alpha * 0.7;

            // Subtle glow for hot metal
            ctx.shadowColor = '#ff4400';
            ctx.shadowBlur = 5 * alpha;

            // Draw fragment shape
            ctx.beginPath();
            ctx.moveTo(frag.vertices[0].x, frag.vertices[0].y);
            for (let i = 1; i < frag.vertices.length; i++) {
                ctx.lineTo(frag.vertices[i].x, frag.vertices[i].y);
            }
            ctx.closePath();

            ctx.strokeStyle = dimColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Slight fill
            ctx.globalAlpha = alpha * 0.3;
            ctx.fillStyle = dimColor;
            ctx.fill();

            ctx.restore();
        }

        // Central glow (cooling reactor/fire)
        if (this.lifetime > this.maxLifetime * 0.5) {
            const glowIntensity = (this.lifetime / this.maxLifetime - 0.5) * 2;
            ctx.globalAlpha = glowIntensity * 0.4;
            ctx.shadowColor = '#ff6600';
            ctx.shadowBlur = 15;
            ctx.fillStyle = '#ff4400';
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Dim a color for wreckage effect
     */
    dimColor(color, factor) {
        // Simple approach - return a grayish version
        if (color.startsWith('#')) {
            // Parse hex color
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);

            // Dim and desaturate
            const gray = (r + g + b) / 3;
            const nr = Math.floor(r * factor + gray * (1 - factor) * 0.5);
            const ng = Math.floor(g * factor + gray * (1 - factor) * 0.5);
            const nb = Math.floor(b * factor + gray * (1 - factor) * 0.5);

            return `rgb(${nr}, ${ng}, ${nb})`;
        }
        return '#666666';
    }
}

/**
 * Particles.js - Particle effects system
 * Handles explosions, impacts, smoke, debris, etc.
 */

import { Colors } from './Colors.js';

export class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
        this.alive = true;

        // Physics (zero-G space environment)
        this.gravity = 0; // No gravity in space
        this.friction = 0.995; // Very little drag in vacuum

        // Rotation for debris
        this.rotation = Math.random() * Math.PI * 2;
        this.angularVelocity = (Math.random() - 0.5) * 5;
    }

    /**
     * Update particle
     */
    update(deltaTime) {
        if (!this.alive) return;

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Apply rotation
        this.rotation += this.angularVelocity * deltaTime;

        // Apply very slight drag (vacuum)
        this.vx *= this.friction;
        this.vy *= this.friction;

        // Update lifetime
        this.lifetime -= deltaTime;
        if (this.lifetime <= 0) {
            this.alive = false;
        }
    }

    /**
     * Render particle
     */
    render(renderer) {
        if (!this.alive) return;

        // Calculate alpha based on lifetime
        const alpha = this.lifetime / this.maxLifetime;
        const ctx = renderer.getContext();

        ctx.save();
        ctx.globalAlpha = alpha;

        // Add glow for bright particles
        if (this.color !== Colors.SMOKE && this.color !== Colors.DEBRIS) {
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 5;
        }

        renderer.drawCircle(this.x, this.y, this.size, this.color);

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}

/**
 * Particle system - manages all particles
 */
export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 1000;
    }

    /**
     * Create an explosion effect
     */
    createExplosion(x, y, color, count = 20, size = 3) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 150 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = Math.random() * 0.5 + 0.5; // 0.5-1.0 seconds

            this.createParticle(x, y, vx, vy, color, size, lifetime);
        }
    }

    /**
     * Create impact effect (smaller burst)
     */
    createImpact(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 100 + 30;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = Math.random() * 0.3 + 0.2;

            this.createParticle(x, y, vx, vy, color, 2, lifetime);
        }
    }

    /**
     * Create muzzle flash (forward burst)
     */
    createMuzzleFlash(x, y, angle, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.3;
            const speed = Math.random() * 80 + 40;
            const vx = Math.cos(spreadAngle) * speed;
            const vy = Math.sin(spreadAngle) * speed;
            const lifetime = Math.random() * 0.2 + 0.1;

            this.createParticle(x, y, vx, vy, color, 2, lifetime);
        }
    }

    /**
     * Create smoke effect
     */
    createSmoke(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 30 + 10;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 30; // Smoke rises
            const lifetime = Math.random() * 1.0 + 0.5;
            const size = Math.random() * 4 + 2;

            this.createParticle(x, y, vx, vy, Colors.SMOKE, size, lifetime);
        }
    }

    /**
     * Create death explosion (unit destroyed)
     */
    createDeathExplosion(x, y, color) {
        // Main explosion
        this.createExplosion(x, y, color, 30, 4);

        // Debris
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 120 + 60;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = Math.random() * 0.8 + 0.4;

            this.createParticle(x, y, vx, vy, Colors.DEBRIS, 3, lifetime);
        }

        // Smoke
        this.createSmoke(x, y, 8);
    }

    /**
     * Create a single particle
     */
    createParticle(x, y, vx, vy, color, size, lifetime) {
        // Don't exceed max particles
        if (this.particles.length >= this.maxParticles) {
            // Remove oldest particle
            this.particles.shift();
        }

        const particle = new Particle(x, y, vx, vy, color, size, lifetime);
        this.particles.push(particle);
    }

    /**
     * Update all particles
     */
    update(deltaTime) {
        // Update all particles
        for (const particle of this.particles) {
            particle.update(deltaTime);
        }

        // Remove dead particles
        this.particles = this.particles.filter(p => p.alive);
    }

    /**
     * Render all particles
     */
    render(renderer) {
        for (const particle of this.particles) {
            particle.render(renderer);
        }
    }

    /**
     * Get active particle count
     */
    getCount() {
        return this.particles.length;
    }

    /**
     * Clear all particles
     */
    clear() {
        this.particles = [];
    }

    /**
     * Create warp flash effect (when reinforcements start warping)
     */
    createWarpFlash(x, y, team) {
        const color = team === 'friendly' ? '#00ffff' : '#ff6666';
        const count = 15;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = Math.random() * 0.4 + 0.2;
            const size = Math.random() * 3 + 2;

            this.createParticle(x, y, vx, vy, color, size, lifetime);
        }

        // Central bright flash
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            this.createParticle(x, y, vx, vy, '#ffffff', 5, 0.3);
        }
    }

    /**
     * Create warp arrival effect (when ship finishes warping in)
     */
    createWarpArrival(x, y, team) {
        const color = team === 'friendly' ? '#00ccff' : '#ff4444';

        // Ring burst effect
        const ringCount = 20;
        for (let i = 0; i < ringCount; i++) {
            const angle = (i / ringCount) * Math.PI * 2;
            const speed = 150;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const lifetime = 0.4;

            this.createParticle(x, y, vx, vy, color, 2, lifetime);
        }

        // Bright center flash
        this.createParticle(x, y, 0, 0, '#ffffff', 8, 0.2);
    }
}

/**
 * Projectiles.js - Space warfare projectile system
 * Handles ballistic rounds, laser beams, and missiles
 */

import { distance } from '../utils/math.js';
import { WeaponConfig } from '../data/config.js';

export class Projectile {
    constructor(x, y, targetX, targetY, team, type = 'ballistic') {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.targetX = targetX;
        this.targetY = targetY;
        this.team = team;
        this.type = type; // 'ballistic', 'laser', 'missile'

        // Get weapon config
        const config = WeaponConfig[type] || WeaponConfig.ballistic;
        this.speed = config.speed;
        this.size = config.size;
        this.color = config.color;
        this.damage = config.damage;

        // Calculate velocity toward target
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
        this.rotation = Math.atan2(dy, dx);

        // State
        this.alive = true;
        this.distanceTraveled = 0;
        this.maxDistance = dist;

        // Point defense tracking
        this.intercepted = false;  // True if shot down by PD
        this.canBeIntercepted = (type === 'missile'); // Only missiles can be intercepted

        // Missile-specific: exhaust trail positions
        if (type === 'missile') {
            this.trailPositions = [];
            this.maxTrailLength = 15;
        }

        // Ballistic-specific: short tracer trail positions
        if (type === 'ballistic') {
            this.trailPositions = [];
            this.maxTrailLength = 6; // Shorter trail than missiles
        }

        // Laser-specific: instant hit, brief duration
        if (type === 'laser') {
            this.beamDuration = config.beamDuration || 0.15;
            this.beamTimer = this.beamDuration;
            // Laser reaches target instantly
            this.distanceTraveled = dist;
        }
    }

    /**
     * Update projectile position
     */
    update(deltaTime) {
        if (!this.alive) return;

        if (this.type === 'laser') {
            // Laser is instant hit, just fade out
            this.beamTimer -= deltaTime;
            if (this.beamTimer <= 0) {
                this.alive = false;
            }
            return;
        }

        // Store trail position for missiles and ballistics
        if (this.type === 'missile' || this.type === 'ballistic') {
            this.trailPositions.push({ x: this.x, y: this.y });
            if (this.trailPositions.length > this.maxTrailLength) {
                this.trailPositions.shift();
            }
        }

        // Move projectile (no gravity in space)
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Update distance traveled
        this.distanceTraveled = distance(this.startX, this.startY, this.x, this.y);

        // Check if reached target
        if (this.distanceTraveled >= this.maxDistance) {
            this.alive = false;
        }
    }

    /**
     * Render projectile
     */
    render(renderer) {
        if (!this.alive) return;

        const ctx = renderer.getContext();

        if (this.type === 'ballistic') {
            this.renderBallistic(ctx, renderer);
        } else if (this.type === 'laser') {
            this.renderLaser(ctx, renderer);
        } else if (this.type === 'missile') {
            this.renderMissile(ctx, renderer);
        }
    }

    /**
     * Render ballistic projectile (tracer round with fading trail)
     */
    renderBallistic(ctx, renderer) {
        ctx.save();

        // Fading trail (similar to missiles but shorter and thinner)
        if (this.trailPositions && this.trailPositions.length > 1) {
            for (let i = 1; i < this.trailPositions.length; i++) {
                const alpha = (i / this.trailPositions.length) * 0.4;
                const width = (i / this.trailPositions.length) * this.size * 0.6;

                ctx.globalAlpha = alpha;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = width;
                ctx.beginPath();
                ctx.moveTo(this.trailPositions[i - 1].x, this.trailPositions[i - 1].y);
                ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
                ctx.stroke();
            }

            // Connect trail to current position
            if (this.trailPositions.length > 0) {
                const lastPos = this.trailPositions[this.trailPositions.length - 1];
                ctx.globalAlpha = 0.5;
                ctx.lineWidth = this.size * 0.7;
                ctx.beginPath();
                ctx.moveTo(lastPos.x, lastPos.y);
                ctx.lineTo(this.x, this.y);
                ctx.stroke();
            }
        }

        // Projectile head with glow
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 8;
        renderer.drawCircle(this.x, this.y, this.size, this.color);

        ctx.restore();
    }

    /**
     * Render laser beam (instant hit visual)
     */
    renderLaser(ctx, renderer) {
        const alpha = this.beamTimer / this.beamDuration;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Outer glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();

        // Inner bright core
        ctx.shadowBlur = 10;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.targetX, this.targetY);
        ctx.stroke();

        ctx.restore();
    }

    /**
     * Render missile (torpedo with exhaust trail)
     */
    renderMissile(ctx, renderer) {
        ctx.save();

        // Exhaust trail
        if (this.trailPositions.length > 1) {
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(this.trailPositions[0].x, this.trailPositions[0].y);

            for (let i = 1; i < this.trailPositions.length; i++) {
                const a = i / this.trailPositions.length;
                ctx.globalAlpha = a * 0.5;
                ctx.lineTo(this.trailPositions[i].x, this.trailPositions[i].y);
            }
            ctx.stroke();
        }

        // Missile body
        ctx.globalAlpha = 1.0;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Neon glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        // Body (elongated shape)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.size * 1.2, 0);           // Nose
        ctx.lineTo(-this.size * 0.5, -this.size * 0.4);  // Left fin
        ctx.lineTo(-this.size * 0.3, 0);          // Back
        ctx.lineTo(-this.size * 0.5, this.size * 0.4);   // Right fin
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.shadowColor = '#ff8800';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(-this.size * 0.4, 0, this.size * 0.25, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
    }

    /**
     * Check if projectile has reached target
     */
    hasReachedTarget() {
        if (this.type === 'laser') {
            // Laser hits instantly
            return true;
        }
        return !this.alive;
    }

    /**
     * Intercept this projectile (point defense)
     */
    intercept() {
        if (!this.canBeIntercepted) return false;
        this.intercepted = true;
        this.alive = false;
        return true;
    }
}

/**
 * Projectile system - manages all projectiles
 */
export class ProjectileSystem {
    constructor() {
        this.projectiles = [];
        this.maxProjectiles = 500;
    }

    /**
     * Create a new projectile
     */
    createProjectile(x, y, targetX, targetY, team, type = 'ballistic') {
        // Pool management
        if (this.projectiles.length >= this.maxProjectiles) {
            // Remove oldest projectile
            this.projectiles.shift();
        }

        const projectile = new Projectile(x, y, targetX, targetY, team, type);
        this.projectiles.push(projectile);
        return projectile;
    }

    /**
     * Update all projectiles
     */
    update(deltaTime) {
        for (const projectile of this.projectiles) {
            projectile.update(deltaTime);
        }

        // Remove dead projectiles
        this.projectiles = this.projectiles.filter(p => p.alive);
    }

    /**
     * Render all projectiles
     */
    render(renderer) {
        for (const projectile of this.projectiles) {
            projectile.render(renderer);
        }
    }

    /**
     * Get active projectile count
     */
    getCount() {
        return this.projectiles.length;
    }

    /**
     * Clear all projectiles
     */
    clear() {
        this.projectiles = [];
    }

    /**
     * Get missiles that can be intercepted by point defense
     * Returns missiles that are:
     * - Still alive and not already intercepted
     * - Within range of the specified position
     * - Belonging to enemy team
     */
    getInterceptableMissiles(x, y, range, friendlyTeam) {
        return this.projectiles.filter(p =>
            p.alive &&
            p.canBeIntercepted &&
            !p.intercepted &&
            p.team !== friendlyTeam &&
            Math.hypot(p.x - x, p.y - y) <= range
        );
    }
}

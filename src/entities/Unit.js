/**
 * Unit.js - Base unit class
 * All military units inherit from this class
 */

import { distance, angleBetween, normalize } from '../utils/math.js';

export class Unit {
    constructor(x, y, team = 'friendly') {
        // Position
        this.x = x;
        this.y = y;

        // Velocity
        this.vx = 0;
        this.vy = 0;

        // Properties
        this.team = team; // 'friendly' or 'enemy'
        this.size = 16;
        this.color = team === 'friendly' ? '#00d4ff' : '#ff3366';
        this.rotation = 0;

        // Stats
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 50; // pixels per second
        this.range = 150;
        this.damage = 10;
        this.fireRate = 1.0; // shots per second
        this.lastFireTime = 0;

        // State
        this.alive = true;
        this.target = null;
        this.targetX = 0;
        this.targetY = 0;

        // Unit type (override in subclasses)
        this.type = 'unit';
    }

    /**
     * Update unit state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        if (!this.alive) return;

        // Update movement
        this.updateMovement(deltaTime);

        // Update rotation to face movement direction
        if (this.vx !== 0 || this.vy !== 0) {
            this.rotation = Math.atan2(this.vy, this.vx);
        }

        // Update timers
        this.lastFireTime += deltaTime;
    }

    /**
     * Update movement toward target
     * @param {number} deltaTime - Time since last frame in seconds
     */
    updateMovement(deltaTime) {
        if (!this.targetX && !this.targetY) return;

        // Calculate direction to target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // If close enough to target, stop
        if (dist < 5) {
            this.vx = 0;
            this.vy = 0;
            return;
        }

        // Normalize direction and apply speed
        const normalized = normalize(dx, dy);
        this.vx = normalized.x * this.speed;
        this.vy = normalized.y * this.speed;

        // Update position
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }

    /**
     * Move toward a target position
     */
    moveTo(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    /**
     * Get distance to another unit
     */
    distanceTo(otherUnit) {
        return distance(this.x, this.y, otherUnit.x, otherUnit.y);
    }

    /**
     * Take damage
     */
    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    /**
     * Handle unit death
     */
    die() {
        this.alive = false;
        // TODO: Emit death particles
    }

    /**
     * Check if unit can fire
     */
    canFire() {
        return this.lastFireTime >= 1.0 / this.fireRate;
    }

    /**
     * Fire at target
     */
    fire() {
        if (!this.canFire()) return false;

        this.lastFireTime = 0;
        return true;
    }

    /**
     * Render the unit (override in subclasses)
     */
    render(renderer) {
        // Override in subclasses
    }

    /**
     * Check if unit is on screen
     */
    isOnScreen(renderer) {
        const { width, height } = renderer.getDimensions();
        const margin = 50;
        return (
            this.x > -margin &&
            this.x < width + margin &&
            this.y > -margin &&
            this.y < height + margin
        );
    }
}

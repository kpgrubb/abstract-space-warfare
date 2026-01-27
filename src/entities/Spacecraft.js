/**
 * Spacecraft.js - Base class for all spacecraft
 * Handles position, movement, health, and multi-hardpoint weapon systems
 */

import { WeaponConfig } from '../data/config.js';

export class Spacecraft {
    constructor(x, y, team = 'friendly') {
        // Position and movement
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.rotation = team === 'friendly' ? 0 : Math.PI; // Face toward enemy
        this.angularVelocity = 0;

        // Ship properties (override in subclasses)
        this.type = 'spacecraft';
        this.team = team;
        this.size = 20;
        this.speed = 40;           // Max speed (was 50) - slower for ponderous feel
        this.acceleration = 6;     // How fast we reach max speed (was 15) - more inertia
        this.turnRate = 0.7;       // radians per second (was 1.0) - slower turning

        // Health
        this.health = 100;
        this.maxHealth = 100;
        this.alive = true;

        // Shields - absorb damage before hull
        // Shield properties (override in subclasses)
        this.shields = 0;           // Current shield strength
        this.maxShields = 0;        // Maximum shield capacity (0 = no shields)
        this.shieldRegenRate = 0;   // Shields regenerated per second
        this.shieldRegenDelay = 3;  // Seconds after damage before regen starts
        this.shieldDamagedTime = 0; // Time since last shield damage
        this.shieldFlicker = 0;     // Visual flicker when hit

        // Combat
        this.damage = 10;
        this.range = 200;

        // Evasion - affects how hard this ship is to hit
        // Calculated from speed and size - faster/smaller = more evasive
        // Base evasion: 0-100 scale (50 = average, 80+ = very hard to hit)
        this.evasion = 50; // Override in subclasses

        // Tactical role - defines behavior priorities (set in subclasses)
        this.tacticalRole = 'generic';

        // Strafing state for fighters
        this.isStrafing = false;
        this.strafePhase = 0; // 0 = approach, 1 = strafe, 2 = disengage
        this.strafeTarget = null;
        this.strafeCooldown = 0;

        // Withdrawal state for damaged ships
        this.isWithdrawing = false;
        this.withdrawalTarget = null;

        // Hardpoint system - array of weapon mounts
        this.hardpoints = [];

        // Missile ammo capacity based on ship size (set in subclasses)
        // Small ships: 2-4 missiles, Medium: 6-8, Large: 12-16
        this.missileAmmo = 4;       // Default for small ships
        this.maxMissileAmmo = 4;

        // Visual
        this.color = team === 'friendly' ? '#00ccff' : '#ff3366';

        // AI state
        this.target = null;
        this.morale = 100;
        this.maxMorale = 100;
        this.isRouting = false;
        this.isLastStand = false;
        this.lastStandBonus = 0;

        // Personality traits (randomized for variety)
        this.personality = this.generatePersonality();

        // Death callback for spawning wreckage
        this.onDeath = null;
    }

    /**
     * Generate randomized personality traits for this ship
     * These affect targeting, engagement range, and tactical decisions
     */
    generatePersonality() {
        return {
            // Aggression: 0.5 (cautious) to 1.5 (aggressive)
            // Affects preferred engagement range - aggressive ships close in
            aggression: 0.7 + Math.random() * 0.6,

            // Discipline: 0.5 (green crew) to 1.5 (veteran)
            // Affects morale resistance and formation keeping
            discipline: 0.6 + Math.random() * 0.8,

            // Focus: determines target preference behavior
            // 'opportunist' - targets wounded/routing ships
            // 'duelist' - prefers same-class targets
            // 'hunter' - prioritizes capitals (or fighters if capital)
            // 'guardian' - prioritizes threats to friendlies
            focus: this.randomFocus(),

            // Recklessness: 0 to 1
            // Chance to break formation and charge when enemy wounded
            recklessness: Math.random() * 0.4,

            // Initiative: affects reaction time and decision speed
            initiative: 0.7 + Math.random() * 0.6
        };
    }

    /**
     * Pick a random focus type with weighted probabilities
     */
    randomFocus() {
        const roll = Math.random();
        if (roll < 0.3) return 'opportunist';      // 30%
        if (roll < 0.5) return 'duelist';          // 20%
        if (roll < 0.7) return 'hunter';           // 20%
        return 'guardian';                          // 30%
    }

    /**
     * Get preferred engagement range based on aggression and fleet orders
     */
    getPreferredRange() {
        // Base preferred range is 70% of max range
        // Aggression modifies this: aggressive ships want to be closer
        const baseRange = this.range * 0.7;
        let preferredRange = baseRange / this.personality.aggression;

        // Apply fleet stance modifier if present
        if (this.stanceRangeModifier) {
            preferredRange *= this.stanceRangeModifier;
        }

        return preferredRange;
    }

    /**
     * Get current evasion value (dynamic based on movement)
     * Ships that are actively moving/maneuvering are harder to hit
     */
    getCurrentEvasion() {
        let evasion = this.evasion;

        // Movement bonus - faster movement = harder to hit
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const speedRatio = currentSpeed / Math.max(1, this.speed);
        evasion += speedRatio * 15; // Up to +15 for full speed

        // Strafing bonus - actively strafing ships are very hard to hit
        if (this.isStrafing && this.strafePhase === 1) {
            evasion += 25;
        }

        // Evasive maneuver bonus (set by AI)
        if (this.evasiveManeuver) {
            evasion += 20;
        }

        // Damaged ships are slightly easier to hit (sluggish)
        const healthRatio = this.health / this.maxHealth;
        if (healthRatio < 0.5) {
            evasion -= (0.5 - healthRatio) * 20; // Up to -10 at very low health
        }

        // Routing ships are easier to hit (panicking, not evading)
        if (this.isRouting) {
            evasion -= 15;
        }

        return Math.max(0, Math.min(95, evasion)); // Cap at 95%
    }

    /**
     * Check if this ship should withdraw due to damage
     */
    shouldWithdraw() {
        // Only withdraw if damaged below 30% health and not already routing
        if (this.isRouting || this.isLastStand) return false;

        const healthRatio = this.health / this.maxHealth;

        // Capital ships are more stubborn (disciplined crews)
        const discipline = this.personality?.discipline || 1.0;
        const withdrawThreshold = 0.25 + (1 - discipline) * 0.1; // 0.25 to 0.35

        // Aggressive ships are less likely to withdraw
        const aggression = this.personality?.aggression || 1.0;
        if (aggression > 1.2 && healthRatio > 0.15) return false;

        return healthRatio < withdrawThreshold;
    }

    /**
     * Add a hardpoint (weapon mount) to the ship
     * @param {number} localX - X offset from ship center
     * @param {number} localY - Y offset from ship center
     * @param {string} weaponType - 'ballistic', 'laser', or 'missile'
     */
    addHardpoint(localX, localY, weaponType) {
        const config = WeaponConfig[weaponType] || WeaponConfig.ballistic;
        this.hardpoints.push({
            localX,
            localY,
            weaponType,
            cooldown: config.cooldown,
            lastFire: config.cooldown, // Start ready to fire
            damage: config.damage,
            range: config.range,
            speed: config.speed
        });

        // Update ship's effective range to max hardpoint range
        const maxRange = Math.max(...this.hardpoints.map(hp => hp.range));
        this.range = maxRange;
    }

    /**
     * Get world position of a hardpoint (accounting for ship rotation)
     */
    getHardpointWorldPos(hardpoint) {
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        return {
            x: this.x + hardpoint.localX * cos - hardpoint.localY * sin,
            y: this.y + hardpoint.localX * sin + hardpoint.localY * cos
        };
    }

    /**
     * Get all hardpoints that are ready to fire
     */
    getReadyHardpoints() {
        return this.hardpoints.filter(hp => {
            // Check cooldown
            if (hp.lastFire < hp.cooldown) return false;
            // Check ammo for missiles
            if (hp.weaponType === 'missile' && this.missileAmmo <= 0) return false;
            return true;
        });
    }

    /**
     * Check if any hardpoint can fire
     */
    canFire() {
        return this.getReadyHardpoints().length > 0;
    }

    /**
     * Fire all ready hardpoints (resets their cooldowns)
     * Returns the hardpoints that fired
     */
    fire() {
        const readyHardpoints = this.getReadyHardpoints();
        if (readyHardpoints.length === 0) return [];

        // Reset cooldowns and consume ammo for all fired hardpoints
        for (const hp of readyHardpoints) {
            hp.lastFire = 0;
            // Consume missile ammo
            if (hp.weaponType === 'missile') {
                this.missileAmmo = Math.max(0, this.missileAmmo - 1);
            }
        }

        return readyHardpoints;
    }

    /**
     * Update hardpoint cooldowns
     */
    updateHardpoints(deltaTime) {
        for (const hp of this.hardpoints) {
            if (hp.lastFire < hp.cooldown) {
                hp.lastFire += deltaTime;
            }
        }
    }

    /**
     * Update spacecraft state
     */
    update(deltaTime) {
        if (!this.alive) return;

        // Update hardpoint cooldowns
        this.updateHardpoints(deltaTime);

        // Update shields
        this.updateShields(deltaTime);

        // Apply velocity
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;

        // Apply angular velocity
        this.rotation += this.angularVelocity * deltaTime;

        // Normalize rotation
        while (this.rotation > Math.PI) this.rotation -= Math.PI * 2;
        while (this.rotation < -Math.PI) this.rotation += Math.PI * 2;

        // Basic movement toward target
        if (this.target && this.target.alive && !this.isRouting) {
            this.moveTowardTarget(deltaTime);
        } else if (this.isRouting && this.routeTargetX !== undefined) {
            this.moveTowardPoint(this.routeTargetX, this.routeTargetY, deltaTime);
        }

        // Keep within bounds (with some margin)
        const canvas = document.getElementById('battleCanvas');
        if (canvas) {
            const margin = 50;
            this.x = Math.max(margin, Math.min(canvas.width - margin, this.x));
            this.y = Math.max(margin, Math.min(canvas.height - margin, this.y));
        }
    }

    /**
     * Move toward current target (with momentum/acceleration)
     */
    moveTowardTarget(deltaTime) {
        if (!this.target) return;

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Desired angle
        const targetAngle = Math.atan2(dy, dx);

        // Turn toward target
        this.turnToward(targetAngle, deltaTime);

        // Current speed
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        // Move if not in range (maintain some distance)
        // Use personality-modified preferred range
        const preferredRange = this.getPreferredRange();
        if (dist > preferredRange) {
            // Accelerate toward target (momentum)
            const accel = this.acceleration * deltaTime;
            const desiredVx = Math.cos(this.rotation) * this.speed;
            const desiredVy = Math.sin(this.rotation) * this.speed;

            // Gradually approach desired velocity
            this.vx += (desiredVx - this.vx) * Math.min(1, accel / this.speed);
            this.vy += (desiredVy - this.vy) * Math.min(1, accel / this.speed);
        } else if (dist < preferredRange * 0.4) {
            // Too close, back off slowly
            const accel = this.acceleration * deltaTime * 0.5;
            const desiredVx = -Math.cos(this.rotation) * this.speed * 0.3;
            const desiredVy = -Math.sin(this.rotation) * this.speed * 0.3;

            this.vx += (desiredVx - this.vx) * Math.min(1, accel / this.speed);
            this.vy += (desiredVy - this.vy) * Math.min(1, accel / this.speed);
        } else {
            // In good range, decelerate gradually
            this.vx *= (1 - deltaTime * 0.5);
            this.vy *= (1 - deltaTime * 0.5);
        }

        // Clamp to max speed
        if (currentSpeed > this.speed) {
            const scale = this.speed / currentSpeed;
            this.vx *= scale;
            this.vy *= scale;
        }
    }

    /**
     * Set a movement destination (called by AI system)
     */
    moveTo(x, y) {
        this.moveTargetX = x;
        this.moveTargetY = y;
    }

    /**
     * Move toward a specific point (with momentum)
     */
    moveTowardPoint(targetX, targetY, deltaTime) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 10) {
            const targetAngle = Math.atan2(dy, dx);
            this.turnToward(targetAngle, deltaTime);

            // Accelerate toward point
            const accel = this.acceleration * deltaTime;
            const desiredVx = Math.cos(this.rotation) * this.speed;
            const desiredVy = Math.sin(this.rotation) * this.speed;

            this.vx += (desiredVx - this.vx) * Math.min(1, accel / this.speed);
            this.vy += (desiredVy - this.vy) * Math.min(1, accel / this.speed);
        } else {
            // Decelerate gradually
            this.vx *= (1 - deltaTime * 0.5);
            this.vy *= (1 - deltaTime * 0.5);
        }
    }

    /**
     * Turn toward a target angle
     */
    turnToward(targetAngle, deltaTime) {
        let angleDiff = targetAngle - this.rotation;

        // Normalize to -PI to PI
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Apply turn rate
        const maxTurn = this.turnRate * deltaTime;
        if (Math.abs(angleDiff) < maxTurn) {
            this.rotation = targetAngle;
        } else if (angleDiff > 0) {
            this.rotation += maxTurn;
        } else {
            this.rotation -= maxTurn;
        }
    }

    /**
     * Update shield regeneration
     */
    updateShields(deltaTime) {
        if (this.maxShields <= 0) return;

        // Update shield flicker decay
        if (this.shieldFlicker > 0) {
            this.shieldFlicker -= deltaTime * 3;
        }

        // Track time since last damage
        this.shieldDamagedTime += deltaTime;

        // Regenerate shields after delay
        if (this.shieldDamagedTime >= this.shieldRegenDelay && this.shields < this.maxShields) {
            this.shields = Math.min(this.maxShields, this.shields + this.shieldRegenRate * deltaTime);
        }
    }

    /**
     * Take damage - shields absorb first, then hull
     * Returns object with shield and hull damage for visual effects
     */
    takeDamage(amount) {
        let shieldDamage = 0;
        let hullDamage = 0;

        // Shields absorb damage first
        if (this.shields > 0) {
            shieldDamage = Math.min(this.shields, amount);
            this.shields -= shieldDamage;
            amount -= shieldDamage;

            // Reset shield regen timer
            this.shieldDamagedTime = 0;

            // Trigger shield flicker visual
            this.shieldFlicker = 1;
        }

        // Remaining damage goes to hull
        if (amount > 0) {
            hullDamage = amount;
            this.health -= hullDamage;
            this.showDamageFlash = true;
            setTimeout(() => this.showDamageFlash = false, 100);
        }

        if (this.health <= 0) {
            this.die();
        }

        return { shieldDamage, hullDamage };
    }

    /**
     * Check if shields are active (have capacity and some charge)
     */
    hasShields() {
        return this.maxShields > 0 && this.shields > 0;
    }

    /**
     * Get shield percentage for UI/visuals
     */
    getShieldPercent() {
        if (this.maxShields <= 0) return 0;
        return this.shields / this.maxShields;
    }

    /**
     * Die and spawn wreckage
     */
    die() {
        this.alive = false;

        // Trigger death callback (for wreckage spawning)
        if (this.onDeath) {
            this.onDeath(this);
        }
    }

    /**
     * Distance to another entity
     */
    distanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if target is in range of any hardpoint
     */
    isInRange(target) {
        const dist = this.distanceTo(target);
        return dist <= this.range;
    }

    /**
     * Render the spacecraft (override in subclasses)
     */
    render(renderer) {
        // Base implementation - subclasses should override
        if (!this.alive) return;

        // Draw a simple circle as placeholder
        renderer.drawCircle(this.x, this.y, this.size, this.color);
    }

    /**
     * Render health bar (and shield bar if applicable)
     */
    renderHealthBar(renderer) {
        const hasShieldCapacity = this.maxShields > 0;
        const isDamaged = this.health < this.maxHealth || (hasShieldCapacity && this.shields < this.maxShields);

        if (!isDamaged) return;

        const barWidth = this.size * 2;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        let barY = this.y - this.size - 10;

        const ctx = renderer.getContext();
        ctx.save();

        // Shield bar (if ship has shields)
        if (hasShieldCapacity) {
            // Shield background
            ctx.fillStyle = '#222244';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Shield fill
            const shieldPercent = this.shields / this.maxShields;
            ctx.fillStyle = '#4488ff';
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 4;
            ctx.fillRect(barX, barY, barWidth * shieldPercent, barHeight);
            ctx.shadowBlur = 0;

            barY += barHeight + 2; // Move health bar below
        }

        // Health background
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // Health fill
        const healthPercent = this.health / this.maxHealth;
        const healthColor = healthPercent > 0.5 ? '#00ff00' :
                           healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        ctx.restore();
    }

    /**
     * Render shield bubble effect (call from subclass render methods)
     */
    renderShieldBubble(renderer) {
        if (this.maxShields <= 0) return;
        if (this.shields <= 0 && this.shieldFlicker <= 0) return;

        const ctx = renderer.getContext();
        ctx.save();

        const shieldRadius = this.size * 1.4;
        const shieldAlpha = Math.max(0.1, this.shields / this.maxShields * 0.3);

        // Shield bubble
        ctx.beginPath();
        ctx.arc(this.x, this.y, shieldRadius, 0, Math.PI * 2);

        // Flicker effect when hit
        if (this.shieldFlicker > 0) {
            ctx.strokeStyle = `rgba(100, 180, 255, ${0.5 + this.shieldFlicker * 0.5})`;
            ctx.lineWidth = 2 + this.shieldFlicker * 2;
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 15;
        } else {
            ctx.strokeStyle = `rgba(80, 150, 255, ${shieldAlpha})`;
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#4488ff';
            ctx.shadowBlur = 8;
        }

        ctx.stroke();

        // Inner glow
        if (this.shields > 0) {
            const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, shieldRadius);
            gradient.addColorStop(0, 'rgba(80, 150, 255, 0)');
            gradient.addColorStop(0.7, 'rgba(80, 150, 255, 0)');
            gradient.addColorStop(1, `rgba(80, 150, 255, ${shieldAlpha * 0.5})`);
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        ctx.restore();
    }
}

/**
 * Carrier.js - Large support vessel with fighter deployment
 * Slow, vulnerable, but deploys fighters and interceptors mid-battle
 *
 * Visual: Wide rectangular hull with hangar bay
 */

import { Spacecraft } from './Spacecraft.js';

export class Carrier extends Spacecraft {
    constructor(x, y, team = 'friendly') {
        super(x, y, team);

        this.type = 'carrier';
        this.size = 22;          // Smaller for distant view
        this.speed = 18;         // Very slow, ponderous
        this.turnRate = 0.4;     // Poor maneuverability
        this.health = 250;
        this.maxHealth = 250;

        // EVASION: Very low - big, slow target
        // Carriers rely on escorts for protection, not evasion
        this.evasion = 20;

        // TACTICAL ROLE: Fire Support & Carrier Operations
        // - Stays at maximum range
        // - Provides long-range missile support
        // - Deploys fighters and interceptors during battle
        // - High priority target - needs escort protection
        // - Withdraws when threatened by close enemies
        this.tacticalRole = 'support';

        // SHIELDS: Heavy shielding to compensate for poor evasion
        this.shields = 100;
        this.maxShields = 100;
        this.shieldRegenRate = 12;
        this.shieldRegenDelay = 4;

        // Team colors
        this.color = team === 'friendly' ? '#0077dd' : '#ff7722';

        // Hardpoints: 3 missile launchers + 1 defensive laser
        this.addHardpoint(7, 0, 'missile');      // Forward launcher
        this.addHardpoint(-7, -12, 'missile');   // Port launcher
        this.addHardpoint(-7, 12, 'missile');    // Starboard launcher
        this.addHardpoint(10, 0, 'laser');       // Point defense

        // HANGAR SYSTEM - Fighter deployment
        this.hangarCapacity = 6;         // Total craft that can be deployed
        this.fightersInHangar = 4;       // Fighters ready to launch
        this.interceptorsInHangar = 2;   // Interceptors ready to launch
        this.deployedCraft = [];         // Track deployed craft
        this.launchCooldown = 8;         // Seconds between launches
        this.launchTimer = 0;
        this.launchReady = false;        // Starts false - needs warmup
        this.launchWarmup = 5;           // Initial delay before first launch
        this.warmupTimer = 0;
        this.isLaunching = false;        // Visual state for launch animation
        this.launchAnimTimer = 0;
    }

    update(deltaTime, allShips = []) {
        super.update(deltaTime);

        // Warmup timer before carrier can launch
        if (!this.launchReady) {
            this.warmupTimer += deltaTime;
            if (this.warmupTimer >= this.launchWarmup) {
                this.launchReady = true;
            }
        }

        // Launch cooldown
        if (this.launchReady && this.launchTimer > 0) {
            this.launchTimer -= deltaTime;
        }

        // Launch animation timer
        if (this.isLaunching) {
            this.launchAnimTimer += deltaTime;
            if (this.launchAnimTimer > 0.5) {
                this.isLaunching = false;
                this.launchAnimTimer = 0;
            }
        }
    }

    /**
     * Check if carrier can launch a craft
     */
    canLaunch() {
        return this.launchReady &&
               this.launchTimer <= 0 &&
               (this.fightersInHangar > 0 || this.interceptorsInHangar > 0);
    }

    /**
     * Get the type of craft to launch (prefers fighters, then interceptors)
     */
    getNextLaunchType() {
        if (this.fightersInHangar > 0) return 'fighter';
        if (this.interceptorsInHangar > 0) return 'interceptor';
        return null;
    }

    /**
     * Launch a craft from the hangar
     * Returns launch data for the battle system to spawn the craft
     */
    launchCraft(craftType = null) {
        if (!this.canLaunch()) return null;

        // Determine what to launch
        const type = craftType || this.getNextLaunchType();
        if (!type) return null;

        // Deduct from hangar
        if (type === 'fighter' && this.fightersInHangar > 0) {
            this.fightersInHangar--;
        } else if (type === 'interceptor' && this.interceptorsInHangar > 0) {
            this.interceptorsInHangar--;
        } else {
            return null;
        }

        // Start cooldown and animation
        this.launchTimer = this.launchCooldown;
        this.isLaunching = true;
        this.launchAnimTimer = 0;

        // Calculate launch position (in front of hangar bay)
        const launchOffset = this.size * 0.8;
        const launchX = this.x + Math.cos(this.rotation) * launchOffset;
        const launchY = this.y + Math.sin(this.rotation) * launchOffset;

        return {
            type: type,
            x: launchX,
            y: launchY,
            rotation: this.rotation,
            team: this.team,
            parentCarrier: this
        };
    }

    /**
     * Get hangar status for UI/AI
     */
    getHangarStatus() {
        return {
            fighters: this.fightersInHangar,
            interceptors: this.interceptorsInHangar,
            total: this.fightersInHangar + this.interceptorsInHangar,
            capacity: this.hangarCapacity,
            ready: this.canLaunch(),
            cooldownRemaining: Math.max(0, this.launchTimer)
        };
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
        ctx.shadowBlur = 20;

        // Main hull - wide rectangular with angled bow
        ctx.beginPath();
        ctx.moveTo(this.size * 0.7, 0);                // Bow
        ctx.lineTo(this.size * 0.3, -this.size * 0.6);     // Bow left
        ctx.lineTo(-this.size * 0.6, -this.size * 0.6);    // Stern left
        ctx.lineTo(-this.size * 0.7, -this.size * 0.4);    // Stern corner left
        ctx.lineTo(-this.size * 0.7, this.size * 0.4);     // Stern corner right
        ctx.lineTo(-this.size * 0.6, this.size * 0.6);     // Stern right
        ctx.lineTo(this.size * 0.3, this.size * 0.6);      // Bow right
        ctx.closePath();

        ctx.fillStyle = renderColor;
        ctx.fill();
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Hangar bay (dark rectangle in center)
        ctx.fillStyle = '#111122';
        ctx.fillRect(-this.size * 0.4, -this.size * 0.3, this.size * 0.6, this.size * 0.6);
        ctx.strokeStyle = this.lightenColor(renderColor);
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size * 0.4, -this.size * 0.3, this.size * 0.6, this.size * 0.6);

        // Hangar lighting strips (pulse when launching)
        if (this.isLaunching) {
            const pulse = Math.sin(this.launchAnimTimer * 20) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 200, 100, ${pulse})`;
            ctx.shadowColor = '#ffcc66';
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#00ffaa';
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 0.5;
        ctx.fillRect(-this.size * 0.35, -this.size * 0.25, this.size * 0.5, this.size * 0.02);
        ctx.fillRect(-this.size * 0.35, this.size * 0.23, this.size * 0.5, this.size * 0.02);
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 20;
        ctx.shadowColor = renderColor;

        // Missile pods (port and starboard)
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.fillRect(-this.size * 0.5, -this.size * 0.75, this.size * 0.3, this.size * 0.12);
        ctx.fillRect(-this.size * 0.5, this.size * 0.63, this.size * 0.3, this.size * 0.12);

        // Bridge tower
        ctx.fillStyle = this.lightenColor(renderColor);
        ctx.beginPath();
        ctx.moveTo(this.size * 0.5, -this.size * 0.2);
        ctx.lineTo(this.size * 0.65, -this.size * 0.1);
        ctx.lineTo(this.size * 0.65, this.size * 0.1);
        ctx.lineTo(this.size * 0.5, this.size * 0.2);
        ctx.closePath();
        ctx.fill();

        // Engine array (4 engines)
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#0055cc';
        ctx.fillStyle = '#0077ff';
        ctx.globalAlpha = 0.8;
        const engineY = [-0.45, -0.15, 0.15, 0.45];
        for (const ey of engineY) {
            ctx.beginPath();
            ctx.ellipse(-this.size * 0.72, this.size * ey, this.size * 0.08, this.size * 0.06, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        // Render shield bubble
        this.renderShieldBubble(renderer);

        // Health bar
        this.renderHealthBar(renderer);
    }

    lightenColor(color) {
        if (color.startsWith('rgba')) return 'rgba(255, 255, 255, 0.8)';
        return '#ffffff';
    }
}

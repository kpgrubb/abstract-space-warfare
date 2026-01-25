/**
 * RadioChatter.js - Dynamic radio chatter text bubbles
 * Displays contextual messages from ships based on their actions
 */

export class RadioChatter {
    constructor() {
        // Active chat bubbles (max 2)
        this.activeBubbles = [];
        this.maxBubbles = 2;

        // Timing
        this.refreshInterval = 1.2;  // Seconds between new messages
        this.bubbleDuration = 1.5;   // How long bubbles stay visible
        this.timer = 0;

        // Cooldown per ship to avoid spam
        this.shipCooldowns = new Map();
        this.shipCooldownTime = 3;  // Seconds before same ship can talk again

        // Message templates by action/state
        this.messages = {
            // Combat messages
            attacking: [
                "Fox two!",
                "Engaging target!",
                "Weapons hot!",
                "Firing solution locked!",
                "Target acquired!",
                "Guns guns guns!",
                "Taking the shot!",
                "Fire at will!",
                "Hostile in sights!",
                "Splash one!",
                "Good hit!",
                "Target down!"
            ],

            // Taking damage
            damaged: [
                "Taking fire!",
                "We're hit!",
                "Shields failing!",
                "Hull breach!",
                "Damage report!",
                "Armor compromised!",
                "Systems critical!",
                "Mayday mayday!",
                "Need support!",
                "Under heavy fire!"
            ],

            // Low health
            critical: [
                "Hull critical!",
                "Losing power!",
                "Engine failure!",
                "Abandon ship!",
                "Going down!",
                "Life support failing!",
                "Core breach imminent!",
                "All hands brace!"
            ],

            // Last stand
            lastStand: [
                "I'm not done yet!",
                "Come get some!",
                "To the last!",
                "For glory!",
                "No retreat!",
                "Hold the line!",
                "Never surrender!",
                "Fight to the end!"
            ],

            // Routing/fleeing
            routing: [
                "Falling back!",
                "Tactical retreat!",
                "Breaking off!",
                "Can't hold!",
                "Withdrawing!",
                "Need extraction!",
                "Cover me!",
                "Too many of them!"
            ],

            // Carrier launching
            launching: [
                "Launch bay clear!",
                "Fighters away!",
                "Deploy all craft!",
                "Squadron launched!",
                "Birds are airborne!",
                "Flight deck active!"
            ],

            // Dreadnought spinal beam
            spinalCharging: [
                "Spinal charging!",
                "Main gun primed!",
                "All power to weapon!",
                "Capacitors full!",
                "Target locked - firing!",
                "FIRE MAIN CANNON!"
            ],

            // Repair tender healing
            repairing: [
                "Repair beam active!",
                "Patching you up!",
                "Hold still!",
                "Nano-repair engaged!",
                "Hull restored!",
                "You're good to go!"
            ],

            // Minelayer deploying
            mineDeploying: [
                "Mines away!",
                "Field deployed!",
                "Watch your step!",
                "Area denied!",
                "Payload delivered!"
            ],

            // Destroyer point defense
            pointDefense: [
                "Missile intercepted!",
                "PD active!",
                "Got it!",
                "Splash missile!",
                "Threat neutralized!"
            ],

            // Corvette jamming
            jamming: [
                "ECM active!",
                "Jamming their sensors!",
                "They're blind!",
                "Interference up!",
                "Scrambling comms!"
            ],

            // Victory celebration
            victory: [
                "Target destroyed!",
                "Kill confirmed!",
                "Scratch one!",
                "That's a kill!",
                "Enemy down!",
                "One less to worry about!"
            ],

            // General combat chatter
            combat: [
                "Contact!",
                "Hostiles inbound!",
                "Eyes on target!",
                "Stay sharp!",
                "Keep formation!",
                "Watch your six!",
                "Copy that!",
                "Roger!",
                "Acknowledged!",
                "Standing by!"
            ],

            // Fighter/interceptor specific
            fighter: [
                "Going in hot!",
                "On your wing!",
                "Break left!",
                "I've got tone!",
                "Tally ho!",
                "Bandit on scope!"
            ],

            // Capital ship specific
            capital: [
                "All batteries fire!",
                "Broadside ready!",
                "Concentrate fire!",
                "Forward shields up!",
                "Target their bridge!",
                "Helm, evasive!"
            ]
        };
    }

    /**
     * Update the chatter system
     */
    update(deltaTime, entities) {
        // Update bubble timers
        for (const bubble of this.activeBubbles) {
            bubble.age += deltaTime;
            bubble.alpha = Math.max(0, 1 - (bubble.age / this.bubbleDuration));
        }

        // Remove expired bubbles
        this.activeBubbles = this.activeBubbles.filter(b => b.age < this.bubbleDuration);

        // Update ship cooldowns
        for (const [shipId, cooldown] of this.shipCooldowns.entries()) {
            this.shipCooldowns.set(shipId, cooldown - deltaTime);
            if (cooldown - deltaTime <= 0) {
                this.shipCooldowns.delete(shipId);
            }
        }

        // Check if we should add new chatter
        this.timer += deltaTime;
        if (this.timer >= this.refreshInterval && this.activeBubbles.length < this.maxBubbles) {
            this.timer = 0;
            this.generateChatter(entities);
        }
    }

    /**
     * Generate new chatter based on current battle state
     */
    generateChatter(entities) {
        if (!entities || entities.length === 0) return;

        // Find ships with interesting states
        const candidates = [];

        for (const entity of entities) {
            if (!entity.alive || !entity.team) continue;

            // Skip if on cooldown
            const shipId = entity.id || `${entity.x}-${entity.y}-${entity.type}`;
            if (this.shipCooldowns.has(shipId)) continue;

            // Check for interesting states
            let priority = 0;
            let category = null;

            // Critical health
            if (entity.health / entity.maxHealth < 0.2) {
                priority = 10;
                category = 'critical';
            }
            // Last stand
            else if (entity.isLastStand) {
                priority = 9;
                category = 'lastStand';
            }
            // Routing
            else if (entity.isRouting) {
                priority = 8;
                category = 'routing';
            }
            // Damaged recently (check for damage flash)
            else if (entity.showDamageFlash) {
                priority = 7;
                category = 'damaged';
            }
            // Carrier launching
            else if (entity.type === 'carrier' && entity.isLaunching) {
                priority = 6;
                category = 'launching';
            }
            // Dreadnought charging
            else if (entity.type === 'dreadnought' && entity.spinalBeamCharging) {
                priority = 9;
                category = 'spinalCharging';
            }
            // Repair tender healing
            else if (entity.type === 'repair_tender' && entity.repairBeamActive) {
                priority = 5;
                category = 'repairing';
            }
            // Ship in combat (has target in range)
            else if (entity.target && entity.isInRange && entity.isInRange(entity.target)) {
                priority = 3;
                category = this.getCombatCategory(entity);
            }
            // General combat chatter
            else if (entity.target) {
                priority = 1;
                category = 'combat';
            }

            if (category) {
                candidates.push({ entity, priority, category, shipId });
            }
        }

        if (candidates.length === 0) return;

        // Sort by priority and pick one (with some randomness)
        candidates.sort((a, b) => b.priority - a.priority);

        // Pick from top candidates with weighted random
        const topCandidates = candidates.slice(0, Math.min(5, candidates.length));
        const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)];

        // Create the bubble
        this.createBubble(chosen.entity, chosen.category, chosen.shipId);
    }

    /**
     * Get appropriate combat category for ship type
     */
    getCombatCategory(entity) {
        if (entity.type === 'fighter' || entity.type === 'interceptor' || entity.type === 'gunship') {
            return Math.random() < 0.5 ? 'fighter' : 'attacking';
        }
        if (entity.type === 'battleship' || entity.type === 'cruiser' || entity.type === 'dreadnought') {
            return Math.random() < 0.5 ? 'capital' : 'attacking';
        }
        if (entity.type === 'corvette') {
            return Math.random() < 0.3 ? 'jamming' : 'attacking';
        }
        if (entity.type === 'destroyer') {
            return Math.random() < 0.3 ? 'pointDefense' : 'attacking';
        }
        return 'attacking';
    }

    /**
     * Create a new chat bubble
     */
    createBubble(entity, category, shipId) {
        const messages = this.messages[category];
        if (!messages || messages.length === 0) return;

        const message = messages[Math.floor(Math.random() * messages.length)];

        this.activeBubbles.push({
            x: entity.x,
            y: entity.y,
            entity: entity,  // Track entity for position updates
            message: message,
            team: entity.team,
            age: 0,
            alpha: 1
        });

        // Put ship on cooldown
        this.shipCooldowns.set(shipId, this.shipCooldownTime);
    }

    /**
     * Manually trigger a message for a specific event
     */
    triggerMessage(entity, category) {
        if (this.activeBubbles.length >= this.maxBubbles) {
            // Replace oldest bubble
            this.activeBubbles.shift();
        }

        const shipId = entity.id || `${entity.x}-${entity.y}-${entity.type}`;
        this.createBubble(entity, category, shipId);
    }

    /**
     * Render all active bubbles
     */
    render(renderer) {
        const ctx = renderer.getContext();

        for (const bubble of this.activeBubbles) {
            this.renderBubble(ctx, bubble);
        }
    }

    /**
     * Render a single chat bubble
     */
    renderBubble(ctx, bubble) {
        // Update position to follow entity
        if (bubble.entity && bubble.entity.alive) {
            bubble.x = bubble.entity.x;
            bubble.y = bubble.entity.y;
        }

        ctx.save();

        // Position above the ship
        const textX = bubble.x;
        const textY = bubble.y - 25;

        // Sci-fi font styling
        const fontSize = 10;
        ctx.font = `bold ${fontSize}px "Consolas", "Courier New", monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';

        // Measure text for background
        const metrics = ctx.measureText(bubble.message);
        const textWidth = metrics.width;
        const padding = 4;

        // Background box with team color tint
        const baseColor = bubble.team === 'friendly' ?
            { r: 0, g: 100, b: 200 } :
            { r: 200, g: 50, b: 50 };

        ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${bubble.alpha * 0.7})`;
        ctx.strokeStyle = `rgba(255, 255, 255, ${bubble.alpha * 0.5})`;
        ctx.lineWidth = 1;

        // Draw rounded rectangle background
        const boxX = textX - textWidth / 2 - padding;
        const boxY = textY - fontSize - padding;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;
        const radius = 3;

        ctx.beginPath();
        ctx.moveTo(boxX + radius, boxY);
        ctx.lineTo(boxX + boxWidth - radius, boxY);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
        ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
        ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
        ctx.lineTo(boxX + radius, boxY + boxHeight);
        ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
        ctx.lineTo(boxX, boxY + radius);
        ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();

        // Small pointer triangle toward ship
        ctx.fillStyle = `rgba(${baseColor.r}, ${baseColor.g}, ${baseColor.b}, ${bubble.alpha * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(textX - 4, boxY + boxHeight);
        ctx.lineTo(textX + 4, boxY + boxHeight);
        ctx.lineTo(textX, boxY + boxHeight + 5);
        ctx.closePath();
        ctx.fill();

        // Draw text with glow
        ctx.shadowColor = bubble.team === 'friendly' ? '#00aaff' : '#ff4444';
        ctx.shadowBlur = 4;
        ctx.fillStyle = `rgba(255, 255, 255, ${bubble.alpha})`;
        ctx.fillText(bubble.message, textX, textY);

        // Second pass for sharper text
        ctx.shadowBlur = 0;
        ctx.fillText(bubble.message, textX, textY);

        ctx.restore();
    }

    /**
     * Clear all bubbles
     */
    clear() {
        this.activeBubbles = [];
        this.shipCooldowns.clear();
        this.timer = 0;
    }
}

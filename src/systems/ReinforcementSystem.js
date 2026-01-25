/**
 * ReinforcementSystem.js - Mid-battle reinforcement spawning
 * Creates dramatic moments with ships warping in from screen edges
 * Tends to favor the losing side to create comeback potential
 */

import { Fighter } from '../entities/Fighter.js';
import { Frigate } from '../entities/Frigate.js';
import { Cruiser } from '../entities/Cruiser.js';
import { Carrier } from '../entities/Carrier.js';
import { Battleship } from '../entities/Battleship.js';

export class ReinforcementSystem {
    constructor(engine, particleSystem) {
        this.engine = engine;
        this.particleSystem = particleSystem;

        // Timing
        this.timeSinceLastReinforcement = 0;
        this.minTimeBetweenWaves = 25;     // Minimum seconds between reinforcement waves
        this.maxTimeBetweenWaves = 50;     // Maximum seconds between reinforcement waves
        this.nextWaveTime = this.randomWaveTime();

        // Battle state
        this.isActive = false;
        this.battleStartTime = 0;
        this.initialGracePeriod = 15;      // No reinforcements in first 15 seconds

        // Reinforcement budget (depletes as reinforcements arrive)
        this.friendlyBudget = 0;
        this.enemyBudget = 0;

        // Warp-in effect tracking
        this.warpingShips = [];            // Ships currently warping in

        // Canvas dimensions (set on update)
        this.canvasWidth = 800;
        this.canvasHeight = 600;
    }

    /**
     * Start reinforcement system for a new battle
     * @param {number} friendlyTotal - Total friendly ships at battle start
     * @param {number} enemyTotal - Total enemy ships at battle start
     */
    startBattle(friendlyTotal, enemyTotal) {
        this.isActive = true;
        this.battleStartTime = 0;
        this.timeSinceLastReinforcement = 0;
        this.nextWaveTime = this.randomWaveTime();
        this.warpingShips = [];

        // Reinforcement budget is roughly 30-50% of starting fleet size
        const budgetMultiplier = 0.3 + Math.random() * 0.2;
        this.friendlyBudget = Math.floor(friendlyTotal * budgetMultiplier);
        this.enemyBudget = Math.floor(enemyTotal * budgetMultiplier);

        console.log(`Reinforcements available: Friendly=${this.friendlyBudget}, Enemy=${this.enemyBudget}`);
    }

    /**
     * Stop the reinforcement system
     */
    stop() {
        this.isActive = false;
        this.warpingShips = [];
    }

    /**
     * Get random time until next wave
     */
    randomWaveTime() {
        return this.minTimeBetweenWaves + Math.random() * (this.maxTimeBetweenWaves - this.minTimeBetweenWaves);
    }

    /**
     * Update reinforcement system
     */
    update(deltaTime, entities) {
        if (!this.isActive) return;

        this.battleStartTime += deltaTime;
        this.timeSinceLastReinforcement += deltaTime;

        // Update warping ships
        this.updateWarpingShips(deltaTime);

        // Get canvas dimensions from first entity or default
        if (entities.length > 0) {
            const canvas = document.getElementById('battleCanvas');
            if (canvas) {
                this.canvasWidth = canvas.width;
                this.canvasHeight = canvas.height;
            }
        }

        // Skip grace period
        if (this.battleStartTime < this.initialGracePeriod) {
            return;
        }

        // Check if it's time for reinforcements
        if (this.timeSinceLastReinforcement >= this.nextWaveTime) {
            this.trySpawnReinforcements(entities);
            this.timeSinceLastReinforcement = 0;
            this.nextWaveTime = this.randomWaveTime();
        }

        // Also check for emergency reinforcements (one side getting crushed)
        this.checkEmergencyReinforcements(entities);
    }

    /**
     * Try to spawn a reinforcement wave
     */
    trySpawnReinforcements(entities) {
        // Count current forces
        const friendlyCount = entities.filter(e => e.alive && e.team === 'friendly').length;
        const enemyCount = entities.filter(e => e.alive && e.team === 'enemy').length;

        if (friendlyCount === 0 || enemyCount === 0) {
            return; // Battle is decided, no reinforcements
        }

        // Determine which side gets reinforcements
        // Favor the losing side (creates comeback potential)
        const totalShips = friendlyCount + enemyCount;
        const friendlyRatio = friendlyCount / totalShips;

        let reinforceTeam;
        let budget;

        if (friendlyRatio < 0.4 && this.friendlyBudget > 0) {
            // Friendly is losing badly, reinforce them
            reinforceTeam = 'friendly';
            budget = this.friendlyBudget;
        } else if (friendlyRatio > 0.6 && this.enemyBudget > 0) {
            // Enemy is losing badly, reinforce them
            reinforceTeam = 'enemy';
            budget = this.enemyBudget;
        } else {
            // Close battle - random side with available budget
            if (Math.random() < 0.5 && this.friendlyBudget > 0) {
                reinforceTeam = 'friendly';
                budget = this.friendlyBudget;
            } else if (this.enemyBudget > 0) {
                reinforceTeam = 'enemy';
                budget = this.enemyBudget;
            } else if (this.friendlyBudget > 0) {
                reinforceTeam = 'friendly';
                budget = this.friendlyBudget;
            } else {
                return; // No budget left
            }
        }

        // Spawn reinforcement wave
        const waveSize = this.calculateWaveSize(budget);
        const ships = this.generateReinforcementWave(waveSize, reinforceTeam);

        // Deduct from budget
        if (reinforceTeam === 'friendly') {
            this.friendlyBudget -= ships.length;
        } else {
            this.enemyBudget -= ships.length;
        }

        // Spawn with warp effect
        this.spawnWithWarpEffect(ships, reinforceTeam);

        console.log(`${reinforceTeam.toUpperCase()} REINFORCEMENTS: ${ships.length} ships incoming!`);
    }

    /**
     * Check for emergency reinforcements (one side critically low)
     */
    checkEmergencyReinforcements(entities) {
        const friendlyCount = entities.filter(e => e.alive && e.team === 'friendly').length;
        const enemyCount = entities.filter(e => e.alive && e.team === 'enemy').length;

        // Emergency threshold: 2 or fewer ships
        if (friendlyCount <= 2 && this.friendlyBudget >= 3 && this.timeSinceLastReinforcement > 10) {
            const ships = this.generateReinforcementWave(3, 'friendly');
            this.friendlyBudget -= ships.length;
            this.spawnWithWarpEffect(ships, 'friendly');
            this.timeSinceLastReinforcement = 0;
            console.log('EMERGENCY FRIENDLY REINFORCEMENTS!');
        }

        if (enemyCount <= 2 && this.enemyBudget >= 3 && this.timeSinceLastReinforcement > 10) {
            const ships = this.generateReinforcementWave(3, 'enemy');
            this.enemyBudget -= ships.length;
            this.spawnWithWarpEffect(ships, 'enemy');
            this.timeSinceLastReinforcement = 0;
            console.log('EMERGENCY ENEMY REINFORCEMENTS!');
        }
    }

    /**
     * Calculate wave size based on budget
     */
    calculateWaveSize(budget) {
        // Small waves (2-5 ships) to keep tension
        const maxWave = Math.min(budget, 5);
        const minWave = Math.min(2, budget);
        return Math.floor(minWave + Math.random() * (maxWave - minWave + 1));
    }

    /**
     * Generate ships for a reinforcement wave
     */
    generateReinforcementWave(count, team) {
        const ships = [];
        const shipTypes = ['fighter', 'fighter', 'frigate', 'cruiser']; // Weighted toward smaller ships

        // Small chance for a capital ship
        if (count >= 3 && Math.random() < 0.2) {
            shipTypes.push(Math.random() < 0.7 ? 'cruiser' : 'battleship');
        }

        for (let i = 0; i < count; i++) {
            const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
            ships.push({ type, team });
        }

        return ships;
    }

    /**
     * Spawn ships with warp-in visual effect
     */
    spawnWithWarpEffect(ships, team) {
        // Pick random edge of screen
        const edge = this.pickSpawnEdge(team);
        const spawnPositions = this.calculateSpawnPositions(ships.length, edge);

        ships.forEach((shipData, index) => {
            const pos = spawnPositions[index];
            const ship = this.createShip(shipData.type, pos.x, pos.y, team);

            // Start ship invisible and warping
            ship.isWarping = true;
            ship.warpProgress = 0;
            ship.warpDuration = 1.5 + Math.random() * 0.5; // 1.5-2 seconds
            ship.originalAlpha = 1.0;

            // Store original position for warp effect
            ship.warpStartX = pos.warpStartX;
            ship.warpStartY = pos.warpStartY;
            ship.warpEndX = pos.x;
            ship.warpEndY = pos.y;

            // Start at warp origin
            ship.x = ship.warpStartX;
            ship.y = ship.warpStartY;

            this.warpingShips.push(ship);
            this.engine.addEntity(ship);

            // Create warp flash effect
            if (this.particleSystem) {
                this.particleSystem.createWarpFlash(pos.x, pos.y, team);
            }
        });
    }

    /**
     * Pick which edge reinforcements come from
     */
    pickSpawnEdge(team) {
        // Usually from "behind" the team's side, but sometimes flanking
        const roll = Math.random();

        if (roll < 0.6) {
            // From team's home edge
            return team === 'friendly' ? 'left' : 'right';
        } else if (roll < 0.8) {
            // From top
            return 'top';
        } else {
            // From bottom
            return 'bottom';
        }
    }

    /**
     * Calculate spawn positions along an edge
     */
    calculateSpawnPositions(count, edge) {
        const positions = [];
        const margin = 50;
        const warpDistance = 100; // How far "outside" ships start

        for (let i = 0; i < count; i++) {
            let x, y, warpStartX, warpStartY;
            const spread = (i - (count - 1) / 2) * 40; // Spread ships out

            switch (edge) {
                case 'left':
                    x = margin + 50;
                    y = this.canvasHeight / 2 + spread + (Math.random() - 0.5) * 100;
                    warpStartX = -warpDistance;
                    warpStartY = y;
                    break;
                case 'right':
                    x = this.canvasWidth - margin - 50;
                    y = this.canvasHeight / 2 + spread + (Math.random() - 0.5) * 100;
                    warpStartX = this.canvasWidth + warpDistance;
                    warpStartY = y;
                    break;
                case 'top':
                    x = this.canvasWidth / 2 + spread + (Math.random() - 0.5) * 200;
                    y = margin + 50;
                    warpStartX = x;
                    warpStartY = -warpDistance;
                    break;
                case 'bottom':
                    x = this.canvasWidth / 2 + spread + (Math.random() - 0.5) * 200;
                    y = this.canvasHeight - margin - 50;
                    warpStartX = x;
                    warpStartY = this.canvasHeight + warpDistance;
                    break;
            }

            // Clamp to canvas bounds
            x = Math.max(margin, Math.min(this.canvasWidth - margin, x));
            y = Math.max(margin, Math.min(this.canvasHeight - margin, y));

            positions.push({ x, y, warpStartX, warpStartY });
        }

        return positions;
    }

    /**
     * Create a ship of the specified type
     */
    createShip(type, x, y, team) {
        switch (type) {
            case 'fighter':
                return new Fighter(x, y, team);
            case 'frigate':
                return new Frigate(x, y, team);
            case 'cruiser':
                return new Cruiser(x, y, team);
            case 'carrier':
                return new Carrier(x, y, team);
            case 'battleship':
                return new Battleship(x, y, team);
            default:
                return new Fighter(x, y, team);
        }
    }

    /**
     * Update ships currently warping in
     */
    updateWarpingShips(deltaTime) {
        for (let i = this.warpingShips.length - 1; i >= 0; i--) {
            const ship = this.warpingShips[i];

            if (!ship.alive) {
                this.warpingShips.splice(i, 1);
                continue;
            }

            ship.warpProgress += deltaTime / ship.warpDuration;

            if (ship.warpProgress >= 1) {
                // Warp complete
                ship.isWarping = false;
                ship.x = ship.warpEndX;
                ship.y = ship.warpEndY;
                this.warpingShips.splice(i, 1);

                // Create arrival flash
                if (this.particleSystem) {
                    this.particleSystem.createWarpArrival(ship.x, ship.y, ship.team);
                }
            } else {
                // Interpolate position with easing (ease-out)
                const t = 1 - Math.pow(1 - ship.warpProgress, 3);
                ship.x = ship.warpStartX + (ship.warpEndX - ship.warpStartX) * t;
                ship.y = ship.warpStartY + (ship.warpEndY - ship.warpStartY) * t;
            }
        }
    }

    /**
     * Render warp effects (called separately for visual layer control)
     */
    render(renderer) {
        const ctx = renderer.getContext();

        for (const ship of this.warpingShips) {
            if (!ship.alive) continue;

            // Draw warp streak
            ctx.save();

            const dx = ship.warpEndX - ship.warpStartX;
            const dy = ship.warpEndY - ship.warpStartY;
            const angle = Math.atan2(dy, dx);

            // Warp trail
            const gradient = ctx.createLinearGradient(
                ship.warpStartX, ship.warpStartY,
                ship.x, ship.y
            );

            const baseColor = ship.team === 'friendly' ? '0, 200, 255' : '255, 100, 100';
            gradient.addColorStop(0, `rgba(${baseColor}, 0)`);
            gradient.addColorStop(0.5, `rgba(${baseColor}, 0.3)`);
            gradient.addColorStop(1, `rgba(${baseColor}, 0.8)`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 3 + ship.size * 0.2;
            ctx.lineCap = 'round';

            ctx.beginPath();
            ctx.moveTo(ship.warpStartX, ship.warpStartY);
            ctx.lineTo(ship.x, ship.y);
            ctx.stroke();

            // Warp glow around ship
            const glowIntensity = 1 - ship.warpProgress;
            ctx.shadowColor = ship.team === 'friendly' ? '#00ffff' : '#ff6666';
            ctx.shadowBlur = 20 + glowIntensity * 30;

            ctx.beginPath();
            ctx.arc(ship.x, ship.y, ship.size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${glowIntensity * 0.5})`;
            ctx.fill();

            ctx.restore();
        }
    }

    /**
     * Get reinforcement status for HUD display
     */
    getStatus() {
        return {
            friendlyBudget: this.friendlyBudget,
            enemyBudget: this.enemyBudget,
            warpingCount: this.warpingShips.length,
            timeToNext: Math.max(0, this.nextWaveTime - this.timeSinceLastReinforcement)
        };
    }
}

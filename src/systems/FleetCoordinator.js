/**
 * FleetCoordinator.js - Fleet-level tactical coordination
 * Manages team-wide strategy that influences individual ship decisions
 * Creates battle phases, fleet cohesion, and coordinated maneuvers
 */

export class FleetCoordinator {
    constructor() {
        // Fleet state per team
        this.fleets = {
            friendly: this.createFleetState(),
            enemy: this.createFleetState()
        };

        // Battle phase tracking
        this.battleTime = 0;
        this.currentPhase = 'opening';
        this.phaseTime = 0;

        // Update intervals
        this.strategyUpdateInterval = 1.0; // Update fleet strategy every second
        this.timeSinceStrategyUpdate = 0;
    }

    /**
     * Create initial fleet state
     */
    createFleetState() {
        return {
            // Fleet composition
            ships: [],
            capitalShips: [],
            escorts: [],
            fighters: [],

            // Fleet center of mass (for cohesion)
            centerX: 0,
            centerY: 0,

            // Current orders
            stance: 'advance',      // 'advance', 'hold', 'retreat', 'regroup'
            focusPoint: null,       // Coordinates to focus on
            priorityTargetType: null, // Ship type to prioritize

            // Fleet health
            totalHealth: 0,
            maxHealth: 0,
            healthRatio: 1.0,
            casualties: 0,
            initialCount: 0,

            // Morale/momentum
            fleetMorale: 100,
            momentum: 0,            // Positive = winning, negative = losing

            // Cohesion
            cohesionRadius: 200,    // How spread out the fleet is
            isCohesive: true,

            // Tactical state
            hasAdvantage: false,
            isRetreating: false,
            regroupPoint: null
        };
    }

    /**
     * Start tracking a new battle
     */
    startBattle(ships) {
        this.battleTime = 0;
        this.currentPhase = 'opening';
        this.phaseTime = 0;

        // Reset fleet states
        this.fleets.friendly = this.createFleetState();
        this.fleets.enemy = this.createFleetState();

        // Initialize with current ships
        this.updateFleetComposition(ships);

        // Store initial counts
        this.fleets.friendly.initialCount = this.fleets.friendly.ships.length;
        this.fleets.enemy.initialCount = this.fleets.enemy.ships.length;
    }

    /**
     * Main update loop
     */
    update(deltaTime, ships) {
        this.battleTime += deltaTime;
        this.phaseTime += deltaTime;
        this.timeSinceStrategyUpdate += deltaTime;

        // Update fleet composition
        this.updateFleetComposition(ships);

        // Update battle phase
        this.updateBattlePhase(ships);

        // Periodic strategy updates
        if (this.timeSinceStrategyUpdate >= this.strategyUpdateInterval) {
            this.timeSinceStrategyUpdate = 0;

            this.updateFleetStrategy('friendly', ships);
            this.updateFleetStrategy('enemy', ships);

            // Apply fleet orders to individual ships
            this.applyFleetOrders('friendly');
            this.applyFleetOrders('enemy');
        }
    }

    /**
     * Update fleet composition from current ships
     */
    updateFleetComposition(ships) {
        for (const team of ['friendly', 'enemy']) {
            const fleet = this.fleets[team];
            const teamShips = ships.filter(s => s.alive && s.team === team);

            fleet.ships = teamShips;
            fleet.capitalShips = teamShips.filter(s =>
                s.type === 'battleship' || s.type === 'carrier' || s.type === 'cruiser'
            );
            fleet.escorts = teamShips.filter(s => s.type === 'frigate');
            fleet.fighters = teamShips.filter(s => s.type === 'fighter');

            // Calculate center of mass
            if (teamShips.length > 0) {
                fleet.centerX = teamShips.reduce((sum, s) => sum + s.x, 0) / teamShips.length;
                fleet.centerY = teamShips.reduce((sum, s) => sum + s.y, 0) / teamShips.length;

                // Calculate total health
                fleet.totalHealth = teamShips.reduce((sum, s) => sum + s.health, 0);
                fleet.maxHealth = teamShips.reduce((sum, s) => sum + s.maxHealth, 0);
                fleet.healthRatio = fleet.maxHealth > 0 ? fleet.totalHealth / fleet.maxHealth : 0;

                // Calculate cohesion (average distance from center)
                const avgDist = teamShips.reduce((sum, s) => {
                    return sum + Math.hypot(s.x - fleet.centerX, s.y - fleet.centerY);
                }, 0) / teamShips.length;
                fleet.cohesionRadius = avgDist;
                fleet.isCohesive = avgDist < 250;

                // Update casualties
                fleet.casualties = fleet.initialCount - teamShips.length;
            }
        }
    }

    /**
     * Update battle phase based on conditions
     */
    updateBattlePhase(ships) {
        const friendly = this.fleets.friendly;
        const enemy = this.fleets.enemy;

        // Calculate average distance between fleets
        const fleetDistance = Math.hypot(
            friendly.centerX - enemy.centerX,
            friendly.centerY - enemy.centerY
        );

        // Determine phase based on distance and battle time
        const previousPhase = this.currentPhase;

        if (this.battleTime < 8) {
            // Opening phase - fleets approaching
            this.currentPhase = 'opening';
        } else if (fleetDistance > 400) {
            // Fleets far apart - still approaching or regrouping
            if (friendly.isRetreating || enemy.isRetreating) {
                this.currentPhase = 'pursuit';
            } else {
                this.currentPhase = 'opening';
            }
        } else if (fleetDistance > 200) {
            // Medium range - engagement phase
            this.currentPhase = 'engagement';
        } else {
            // Close range - melee phase
            this.currentPhase = 'melee';
        }

        // Check for lull conditions (both sides hurt, need to regroup)
        const bothHurt = friendly.healthRatio < 0.6 && enemy.healthRatio < 0.6;
        const recentCasualties = this.checkRecentCasualties(ships);

        if (bothHurt && !recentCasualties && this.phaseTime > 15) {
            // Natural lull - both sides pull back slightly
            this.currentPhase = 'lull';
        }

        // Reset phase timer on phase change
        if (previousPhase !== this.currentPhase) {
            this.phaseTime = 0;
        }
    }

    /**
     * Check if there were recent casualties (combat is active)
     */
    checkRecentCasualties(ships) {
        // Check if any ship took damage recently (has damage flash)
        return ships.some(s => s.showDamageFlash);
    }

    /**
     * Update fleet-level strategy
     */
    updateFleetStrategy(team, ships) {
        const fleet = this.fleets[team];
        const enemyTeam = team === 'friendly' ? 'enemy' : 'friendly';
        const enemyFleet = this.fleets[enemyTeam];

        if (fleet.ships.length === 0) return;

        // Calculate momentum (who's winning)
        const healthAdvantage = fleet.healthRatio - enemyFleet.healthRatio;
        const numberAdvantage = (fleet.ships.length - enemyFleet.ships.length) /
            Math.max(1, fleet.initialCount);
        fleet.momentum = healthAdvantage * 0.5 + numberAdvantage * 0.5;
        fleet.hasAdvantage = fleet.momentum > 0.1;

        // Determine stance based on phase and momentum
        this.determineFleetStance(fleet, enemyFleet);

        // Determine priority target type
        this.determinePriorityTarget(fleet, enemyFleet);

        // Calculate focus point
        this.calculateFocusPoint(fleet, enemyFleet);

        // Update fleet morale
        this.updateFleetMorale(fleet);
    }

    /**
     * Determine fleet stance (advance/hold/retreat/regroup)
     */
    determineFleetStance(fleet, enemyFleet) {
        const previousStance = fleet.stance;

        // Base stance on phase and momentum
        switch (this.currentPhase) {
            case 'opening':
                fleet.stance = 'advance';
                break;

            case 'engagement':
                if (fleet.hasAdvantage) {
                    fleet.stance = 'advance';
                } else if (fleet.momentum < -0.2) {
                    fleet.stance = 'hold';
                } else {
                    fleet.stance = 'hold';
                }
                break;

            case 'melee':
                // In close combat, hold ground unless badly losing
                if (fleet.momentum < -0.3) {
                    fleet.stance = 'retreat';
                    fleet.isRetreating = true;
                } else {
                    fleet.stance = 'hold';
                }
                break;

            case 'lull':
                // During lull, regroup
                fleet.stance = 'regroup';
                this.calculateRegroupPoint(fleet);
                break;

            case 'pursuit':
                if (fleet.hasAdvantage) {
                    fleet.stance = 'advance';
                } else {
                    fleet.stance = 'retreat';
                    fleet.isRetreating = true;
                }
                break;
        }

        // Clear retreat flag if not retreating
        if (fleet.stance !== 'retreat') {
            fleet.isRetreating = false;
        }
    }

    /**
     * Determine which enemy ship type to prioritize
     */
    determinePriorityTarget(fleet, enemyFleet) {
        // Prioritize based on threat and opportunity
        if (enemyFleet.capitalShips.length > 0 && fleet.capitalShips.length > 0) {
            // Capital ships should target enemy capitals
            fleet.priorityTargetType = 'capital';
        } else if (enemyFleet.fighters.length > fleet.escorts.length * 2) {
            // Too many enemy fighters - prioritize them
            fleet.priorityTargetType = 'fighter';
        } else if (enemyFleet.capitalShips.length > 0) {
            // Enemy has capitals, we don't - swarm them
            fleet.priorityTargetType = 'capital';
        } else {
            // Default - target anything
            fleet.priorityTargetType = null;
        }
    }

    /**
     * Calculate focus point for fleet movement
     */
    calculateFocusPoint(fleet, enemyFleet) {
        switch (fleet.stance) {
            case 'advance':
                // Focus on enemy center
                fleet.focusPoint = {
                    x: enemyFleet.centerX,
                    y: enemyFleet.centerY
                };
                break;

            case 'hold':
                // Hold current position (slight movement toward enemy)
                fleet.focusPoint = {
                    x: fleet.centerX + (enemyFleet.centerX - fleet.centerX) * 0.2,
                    y: fleet.centerY + (enemyFleet.centerY - fleet.centerY) * 0.2
                };
                break;

            case 'retreat':
            case 'regroup':
                // Move to regroup point
                fleet.focusPoint = fleet.regroupPoint || {
                    x: fleet.centerX,
                    y: fleet.centerY
                };
                break;
        }
    }

    /**
     * Calculate regroup point (behind current position)
     */
    calculateRegroupPoint(fleet) {
        const canvas = document.getElementById('battleCanvas');
        const width = canvas?.width || 800;

        // Regroup behind current position
        const retreatDirection = fleet === this.fleets.friendly ? -1 : 1;
        fleet.regroupPoint = {
            x: Math.max(100, Math.min(width - 100,
                fleet.centerX + retreatDirection * 150)),
            y: fleet.centerY
        };
    }

    /**
     * Update fleet morale based on conditions
     */
    updateFleetMorale(fleet) {
        let moraleDelta = 0;

        // Momentum affects morale
        moraleDelta += fleet.momentum * 5;

        // Cohesion affects morale
        if (!fleet.isCohesive) {
            moraleDelta -= 2;
        }

        // Capital ship presence
        if (fleet.capitalShips.length > 0) {
            moraleDelta += 1;
        }

        // Apply change
        fleet.fleetMorale = Math.max(0, Math.min(100, fleet.fleetMorale + moraleDelta));
    }

    /**
     * Apply fleet orders to individual ships
     */
    applyFleetOrders(team) {
        const fleet = this.fleets[team];

        for (const ship of fleet.ships) {
            // Skip routing ships - they have their own behavior
            if (ship.isRouting) continue;

            // Apply fleet orders
            ship.fleetOrders = {
                stance: fleet.stance,
                focusPoint: fleet.focusPoint,
                priorityTargetType: fleet.priorityTargetType,
                fleetCenter: { x: fleet.centerX, y: fleet.centerY },
                shouldMaintainCohesion: !fleet.isCohesive,
                cohesionRadius: 200,
                fleetMorale: fleet.fleetMorale,
                phase: this.currentPhase,
                hasAdvantage: fleet.hasAdvantage
            };
        }
    }

    /**
     * Get current battle phase
     */
    getPhase() {
        return this.currentPhase;
    }

    /**
     * Get fleet status for debugging/display
     */
    getStatus() {
        return {
            phase: this.currentPhase,
            battleTime: Math.floor(this.battleTime),
            friendly: {
                stance: this.fleets.friendly.stance,
                ships: this.fleets.friendly.ships.length,
                momentum: this.fleets.friendly.momentum.toFixed(2),
                cohesive: this.fleets.friendly.isCohesive
            },
            enemy: {
                stance: this.fleets.enemy.stance,
                ships: this.fleets.enemy.ships.length,
                momentum: this.fleets.enemy.momentum.toFixed(2),
                cohesive: this.fleets.enemy.isCohesive
            }
        };
    }

    /**
     * Clear state
     */
    clear() {
        this.fleets.friendly = this.createFleetState();
        this.fleets.enemy = this.createFleetState();
        this.battleTime = 0;
        this.currentPhase = 'opening';
    }
}

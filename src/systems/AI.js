/**
 * AI.js - Tactical AI system for space combat
 * Handles ship behaviors, morale, flanking, and group tactics
 * Now includes personality-driven target selection
 */

export class AISystem {
    constructor() {
        this.updateInterval = 0.5; // Update AI decisions every 0.5 seconds
        this.timeSinceUpdate = 0;

        // Focus fire tracking - prioritized targets for each team
        this.focusTargets = {
            friendly: null,
            enemy: null
        };

        // Focus fire coordination settings
        this.focusFireUpdateInterval = 2.0; // Update focus target every 2 seconds
        this.focusFireTimer = 0;
    }

    /**
     * Update focus fire targets for each team
     * Selects high-value or damaged targets for coordinated attacks
     */
    updateFocusFireTargets(ships) {
        const friendlyShips = ships.filter(s => s.alive && s.team === 'friendly');
        const enemyShips = ships.filter(s => s.alive && s.team === 'enemy');

        // Calculate focus target for friendly team (targeting enemies)
        this.focusTargets.friendly = this.selectFocusTarget(enemyShips, friendlyShips);

        // Calculate focus target for enemy team (targeting friendlies)
        this.focusTargets.enemy = this.selectFocusTarget(friendlyShips, enemyShips);

        // Broadcast focus targets to ships
        for (const ship of friendlyShips) {
            ship.focusTarget = this.focusTargets.friendly;
        }
        for (const ship of enemyShips) {
            ship.focusTarget = this.focusTargets.enemy;
        }
    }

    /**
     * Select the best focus fire target from enemy ships
     * Considers: damage dealt, ship value, current health, and threat level
     */
    selectFocusTarget(enemyShips, friendlyShips) {
        if (enemyShips.length === 0) return null;

        let bestTarget = null;
        let bestScore = -Infinity;

        for (const enemy of enemyShips) {
            let score = 0;

            // High-value target bonus (capitals are worth focusing)
            const valueMultiplier = {
                dreadnought: 120,
                battleship: 100,
                carrier: 90,
                repair_tender: 80, // High priority - stop the healing!
                cruiser: 60,
                corvette: 50, // EW ships are high priority
                destroyer: 40,
                minelayer: 35,
                frigate: 30,
                gunship: 20,
                interceptor: 18,
                fighter: 15
            };
            score += valueMultiplier[enemy.type] || 25;

            // Damaged target bonus - finish off wounded ships
            const healthRatio = enemy.health / enemy.maxHealth;
            if (healthRatio < 0.5) {
                score += (1 - healthRatio) * 80; // Up to +80 for nearly dead ships
            }

            // Shield down bonus - vulnerable target
            if (enemy.shields !== undefined && enemy.shields <= 0) {
                score += 30;
            }

            // Threat assessment - target ships that are damaging our fleet
            if (enemy.target && enemy.target.team !== enemy.team) {
                const targetingOurShip = friendlyShips.find(f => f === enemy.target);
                if (targetingOurShip) {
                    // Enemy is actively targeting one of ours
                    score += 25;

                    // Extra bonus if targeting our capitals
                    if (targetingOurShip.type === 'battleship' || targetingOurShip.type === 'carrier') {
                        score += 35;
                    }
                }
            }

            // Routing penalty - don't focus routing ships (they're leaving)
            if (enemy.isRouting) {
                score -= 40;
            }

            // Last stand bonus - they're dangerous, finish them
            if (enemy.isLastStand) {
                score += 45;
            }

            // Distance factor - prefer targets more ships can reach
            let reachableCount = 0;
            for (const friendly of friendlyShips) {
                const dist = Math.hypot(enemy.x - friendly.x, enemy.y - friendly.y);
                const range = friendly.range || 200;
                if (dist < range * 1.5) {
                    reachableCount++;
                }
            }
            score += reachableCount * 10; // More ships can hit = better focus target

            if (score > bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        }

        return bestTarget;
    }

    /**
     * Select best target for a ship based on personality and ship type
     * This creates more varied behavior than pure nearest-enemy targeting
     */
    selectTargetByPersonality(ship, enemies) {
        if (enemies.length === 0) return null;

        const personality = ship.personality || { focus: 'opportunist', aggression: 1.0 };
        const shipType = ship.type;

        // Score each potential target
        // Get fleet orders if available
        const fleetOrders = ship.fleetOrders || {};

        const scoredTargets = enemies.map(enemy => {
            let score = 100; // Base score

            // Distance factor - closer targets get higher scores (but personality modifies this)
            const dist = Math.hypot(enemy.x - ship.x, enemy.y - ship.y);
            const distancePenalty = dist / 50; // Penalty increases with distance
            score -= distancePenalty * (2 - personality.aggression); // Aggressive ships care less about distance

            // Fleet priority target bonus
            if (fleetOrders.priorityTargetType) {
                if (fleetOrders.priorityTargetType === 'capital') {
                    if (enemy.type === 'battleship' || enemy.type === 'carrier' || enemy.type === 'cruiser') {
                        score += 35;
                    }
                } else if (fleetOrders.priorityTargetType === 'fighter' && enemy.type === 'fighter') {
                    score += 35;
                }
            }

            // Focus fire coordination bonus
            // Ships prioritize the fleet's focus target for concentrated firepower
            if (ship.focusTarget && enemy === ship.focusTarget) {
                // Discipline affects how well ship follows focus fire orders
                const focusBonus = 40 * (personality.discipline || 1.0);
                score += focusBonus;
            }

            // Personality focus bonuses
            switch (personality.focus) {
                case 'opportunist':
                    // Bonus for wounded enemies
                    if (enemy.health < enemy.maxHealth * 0.5) {
                        score += 40;
                    }
                    // Big bonus for routing enemies
                    if (enemy.isRouting) {
                        score += 60;
                    }
                    break;

                case 'duelist':
                    // Bonus for same-class targets
                    if (enemy.type === shipType) {
                        score += 50;
                    }
                    break;

                case 'hunter':
                    // Capital ships hunt other capitals, small ships hunt capitals
                    if (shipType === 'battleship' || shipType === 'cruiser') {
                        // Capitals want to fight capitals
                        if (enemy.type === 'battleship') score += 40;
                        if (enemy.type === 'carrier') score += 35;
                        if (enemy.type === 'cruiser') score += 30;
                    } else {
                        // Small ships are bold - go for the big targets
                        if (enemy.type === 'carrier') score += 50;
                        if (enemy.type === 'battleship') score += 30;
                    }
                    break;

                case 'guardian':
                    // Prioritize enemies that are threatening friendlies
                    if (enemy.target && enemy.target.team === ship.team) {
                        score += 45;
                    }
                    // Bonus for enemies close to friendly capitals
                    // (Handled in ship-specific behavior)
                    break;
            }

            // Ship-type specific preferences (rock-paper-scissors)
            score += this.getTypeMatchupBonus(shipType, enemy.type);

            // Recklessness factor - chance to fixate on wounded target
            if (personality.recklessness > 0.3 && enemy.health < enemy.maxHealth * 0.3) {
                if (Math.random() < personality.recklessness) {
                    score += 80; // Strong urge to finish off wounded
                }
            }

            return { enemy, score };
        });

        // Sort by score (highest first) and return best target
        scoredTargets.sort((a, b) => b.score - a.score);
        return scoredTargets[0].enemy;
    }

    /**
     * Get combat matchup bonus based on ship types
     */
    getTypeMatchupBonus(attackerType, targetType) {
        const matchups = {
            // Fighters are good against carriers and other fighters
            fighter: { carrier: 25, fighter: 15, frigate: 5, cruiser: -10, battleship: -20, corvette: 20, destroyer: -10, dreadnought: -30, gunship: -5, interceptor: -15, minelayer: 15, repair_tender: 20 },
            // Frigates screen against fighters
            frigate: { fighter: 30, frigate: 10, cruiser: 5, carrier: 0, battleship: -15, corvette: 15, destroyer: 10, dreadnought: -25, gunship: 15, interceptor: 10, minelayer: 10, repair_tender: 15 },
            // Cruisers are versatile
            cruiser: { fighter: 20, frigate: 15, cruiser: 10, carrier: 10, battleship: 5, corvette: 20, destroyer: 15, dreadnought: -10, gunship: 15, interceptor: 15, minelayer: 15, repair_tender: 20 },
            // Carriers want to avoid everything except battleships (good missile targets)
            carrier: { battleship: 20, cruiser: 5, carrier: 0, frigate: -10, fighter: -25, corvette: 10, destroyer: -15, dreadnought: 15, gunship: -15, interceptor: -20, minelayer: 5, repair_tender: 10 },
            // Battleships want to crush other capitals
            battleship: { cruiser: 25, carrier: 20, battleship: 15, frigate: 10, fighter: -5, corvette: 25, destroyer: 20, dreadnought: 10, gunship: 10, interceptor: 5, minelayer: 20, repair_tender: 25 },
            // Corvettes are support - they don't seek combat
            corvette: { fighter: -15, frigate: -10, cruiser: -20, carrier: -20, battleship: -30, corvette: 0, destroyer: -10, dreadnought: -35, gunship: -15, interceptor: -10, minelayer: -5, repair_tender: 5 },
            // Destroyers screen against missiles/fighters, hunt enemy screens
            destroyer: { fighter: 25, frigate: 15, corvette: 20, destroyer: 10, cruiser: -5, carrier: 15, battleship: -15, dreadnought: -25, gunship: 20, interceptor: 25, minelayer: 15, repair_tender: 15 },
            // Dreadnoughts crush everything
            dreadnought: { cruiser: 30, carrier: 30, battleship: 25, frigate: 15, fighter: -5, corvette: 25, destroyer: 25, dreadnought: 15, gunship: 10, interceptor: 0, minelayer: 20, repair_tender: 25 },
            // Gunships are heavy fighters - good vs medium targets
            gunship: { fighter: 15, frigate: 20, cruiser: 5, carrier: 25, battleship: -10, corvette: 20, destroyer: -5, dreadnought: -20, gunship: 10, interceptor: -10, minelayer: 15, repair_tender: 20 },
            // Interceptors specialize in killing small craft
            interceptor: { fighter: 35, frigate: 5, cruiser: -15, carrier: -10, battleship: -25, corvette: 10, destroyer: -20, dreadnought: -35, gunship: 25, interceptor: 15, minelayer: 5, repair_tender: 10 },
            // Minelayers avoid combat
            minelayer: { fighter: -10, frigate: -5, cruiser: -20, carrier: -15, battleship: -30, corvette: 0, destroyer: -15, dreadnought: -35, gunship: -10, interceptor: -15, minelayer: 0, repair_tender: 5 },
            // Repair tenders really avoid combat
            repair_tender: { fighter: -20, frigate: -15, cruiser: -30, carrier: -25, battleship: -40, corvette: -5, destroyer: -20, dreadnought: -45, gunship: -20, interceptor: -25, minelayer: -5, repair_tender: 0 }
        };

        return matchups[attackerType]?.[targetType] || 0;
    }

    /**
     * Update AI for all ships
     */
    update(deltaTime, ships) {
        this.timeSinceUpdate += deltaTime;

        // Only update AI periodically (performance optimization)
        if (this.timeSinceUpdate < this.updateInterval) {
            return;
        }

        this.timeSinceUpdate = 0;

        // Update focus fire targets
        this.focusFireTimer += this.updateInterval;
        if (this.focusFireTimer >= this.focusFireUpdateInterval) {
            this.focusFireTimer = 0;
            this.updateFocusFireTargets(ships);
        }

        // Update formation assignments for each team
        this.updateFormations(ships);

        // Process AI for each ship
        for (const ship of ships) {
            if (!ship.alive) continue;

            // Update morale
            this.updateMorale(ship, ships);

            // Check for dramatic moments
            this.checkLastStand(ship, ships);
            this.attemptRally(ship, ships);

            // Ship-specific behaviors
            this.updateShipBehavior(ship, ships);

            // Update tactical state
            this.updateTacticalState(ship, ships);

            // Apply formation positioning
            this.applyFormationPosition(ship, ships);
        }
    }

    /**
     * Update tactical formations for both teams
     */
    updateFormations(ships) {
        const friendlyShips = ships.filter(s => s.alive && s.team === 'friendly');
        const enemyShips = ships.filter(s => s.alive && s.team === 'enemy');

        this.assignFormationRoles(friendlyShips);
        this.assignFormationRoles(enemyShips);
    }

    /**
     * Assign formation roles to ships based on their types
     * Creates a defensive screen around capital ships
     */
    assignFormationRoles(teamShips) {
        if (teamShips.length === 0) return;

        // Find capital ships (formation anchors)
        const capitals = teamShips.filter(s =>
            s.type === 'battleship' || s.type === 'carrier' || s.type === 'dreadnought'
        );

        // Find screening ships
        const screens = teamShips.filter(s =>
            s.type === 'destroyer' || s.type === 'corvette' || s.type === 'frigate'
        );

        // Find attack ships
        const attackers = teamShips.filter(s =>
            s.type === 'fighter' || s.type === 'cruiser' ||
            s.type === 'gunship' || s.type === 'interceptor'
        );

        // Find support ships
        const supports = teamShips.filter(s =>
            s.type === 'minelayer' || s.type === 'repair_tender'
        );

        // Calculate fleet center
        let centerX = 0;
        let centerY = 0;
        for (const ship of teamShips) {
            centerX += ship.x;
            centerY += ship.y;
        }
        centerX /= teamShips.length;
        centerY /= teamShips.length;

        // Assign formation positions
        // Capitals stay near center
        for (const capital of capitals) {
            capital.formationRole = 'anchor';
            capital.formationCenter = { x: centerX, y: centerY };
        }

        // Screens position around capitals
        if (capitals.length > 0 && screens.length > 0) {
            const screenAngleStep = (Math.PI * 2) / screens.length;
            screens.forEach((screen, i) => {
                screen.formationRole = 'screen';
                screen.formationAnchor = capitals[i % capitals.length];
                screen.formationAngle = screenAngleStep * i;
                screen.formationDistance = 80; // Distance from anchor
            });
        }

        // Attackers operate more freely but stay loosely grouped
        for (const attacker of attackers) {
            attacker.formationRole = 'attack';
            attacker.formationCenter = { x: centerX, y: centerY };
        }

        // Support ships stay at the rear, protected
        for (const support of supports) {
            support.formationRole = 'support';
            support.formationCenter = { x: centerX, y: centerY };
            // Support ships hang back
            if (capitals.length > 0) {
                support.formationAnchor = capitals[capitals.length - 1]; // Stay near rear capital
            }
        }
    }

    /**
     * Apply formation positioning to a ship
     * Balances formation keeping with combat needs
     */
    applyFormationPosition(ship, allShips) {
        // Don't apply formation if ship is routing, in last stand, or withdrawing
        if (ship.isRouting || ship.isLastStand || ship.isWithdrawing) return;

        // Don't override active combat targeting
        if (ship.priorityTarget && ship.priorityTarget.alive) {
            const distToTarget = Math.hypot(
                ship.priorityTarget.x - ship.x,
                ship.priorityTarget.y - ship.y
            );
            // If in weapons range, focus on combat not formation
            if (distToTarget < (ship.range || 200)) return;
        }

        const discipline = ship.personality?.discipline || 1.0;

        // Lower discipline = less likely to maintain formation
        if (Math.random() > discipline * 0.7) return;

        switch (ship.formationRole) {
            case 'screen':
                this.applyScreenFormation(ship);
                break;

            case 'anchor':
                this.applyAnchorFormation(ship, allShips);
                break;

            case 'attack':
                this.applyAttackFormation(ship, allShips);
                break;
        }
    }

    /**
     * Apply screening formation - stay between anchor and threats
     */
    applyScreenFormation(ship) {
        if (!ship.formationAnchor || !ship.formationAnchor.alive) return;

        const anchor = ship.formationAnchor;
        const dist = ship.formationDistance || 80;
        const angle = ship.formationAngle || 0;

        // Calculate ideal position
        // If there's an escort target, position toward threats
        // Otherwise use assigned formation angle
        let idealX, idealY;

        if (ship.escortTarget) {
            // escortTarget logic already handles positioning for destroyers/corvettes
            return;
        }

        idealX = anchor.x + Math.cos(angle) * dist;
        idealY = anchor.y + Math.sin(angle) * dist;

        // Gently push toward formation position
        const distToIdeal = Math.hypot(idealX - ship.x, idealY - ship.y);
        if (distToIdeal > dist * 0.5) {
            // Only move toward formation if significantly out of position
            const pullStrength = 0.15;
            ship.formationTargetX = ship.x + (idealX - ship.x) * pullStrength;
            ship.formationTargetY = ship.y + (idealY - ship.y) * pullStrength;
        }
    }

    /**
     * Apply anchor formation - capitals maintain spacing with each other
     */
    applyAnchorFormation(ship, allShips) {
        if (!ship.formationCenter) return;

        // Find other anchors
        const otherAnchors = allShips.filter(s =>
            s.alive &&
            s.team === ship.team &&
            s.formationRole === 'anchor' &&
            s !== ship
        );

        if (otherAnchors.length === 0) return;

        // Maintain minimum spacing between capitals
        const minSpacing = 120;
        let pushX = 0;
        let pushY = 0;

        for (const other of otherAnchors) {
            const dist = Math.hypot(other.x - ship.x, other.y - ship.y);
            if (dist < minSpacing && dist > 0) {
                // Push away from too-close anchors
                const pushStrength = (minSpacing - dist) / minSpacing;
                const angle = Math.atan2(ship.y - other.y, ship.x - other.x);
                pushX += Math.cos(angle) * pushStrength * 20;
                pushY += Math.sin(angle) * pushStrength * 20;
            }
        }

        if (Math.abs(pushX) > 5 || Math.abs(pushY) > 5) {
            ship.formationTargetX = ship.x + pushX;
            ship.formationTargetY = ship.y + pushY;
        }
    }

    /**
     * Apply attack formation - loose grouping with freedom to maneuver
     */
    applyAttackFormation(ship, allShips) {
        if (!ship.formationCenter) return;

        // Attackers have more freedom but shouldn't stray too far from fleet
        const maxDistFromCenter = 300;
        const distToCenter = Math.hypot(
            ship.formationCenter.x - ship.x,
            ship.formationCenter.y - ship.y
        );

        if (distToCenter > maxDistFromCenter) {
            // Gently pull back toward fleet
            const pullStrength = 0.1;
            ship.formationTargetX = ship.x + (ship.formationCenter.x - ship.x) * pullStrength;
            ship.formationTargetY = ship.y + (ship.formationCenter.y - ship.y) * pullStrength;
        }
    }

    /**
     * Update ship-specific tactical behaviors
     */
    updateShipBehavior(ship, allShips) {
        const nearby = this.getNearbyUnits(ship, allShips, 400);

        switch (ship.type) {
            case 'fighter':
                // Fighters: Chase down carriers and wounded ships
                this.fighterBehavior(ship, nearby);
                break;

            case 'frigate':
                // Frigates: Support role, screen for capital ships
                this.frigateBehavior(ship, nearby);
                break;

            case 'cruiser':
                // Cruisers: Hunt fighters, maintain formation
                this.cruiserBehavior(ship, nearby);
                break;

            case 'carrier':
                // Carriers: Stay at max range, retreat from threats
                this.carrierBehavior(ship, nearby);
                break;

            case 'battleship':
                // Battleships: Advance slowly, engage all targets
                this.battleshipBehavior(ship, nearby);
                break;

            case 'corvette':
                // Corvettes: EW support, stay near friendly capitals
                this.corvetteBehavior(ship, nearby);
                break;

            case 'destroyer':
                // Destroyers: Point defense screening, escort capitals
                this.destroyerBehavior(ship, nearby);
                break;

            case 'dreadnought':
                // Dreadnoughts: Massive flagship, spinal beam usage
                this.dreadnoughtBehavior(ship, nearby);
                break;

            case 'gunship':
                // Gunships: Heavy attack craft
                this.gunshipBehavior(ship, nearby);
                break;

            case 'interceptor':
                // Interceptors: Hunt fighters and small craft
                this.interceptorBehavior(ship, nearby);
                break;

            case 'minelayer':
                // Minelayers: Deploy mines, stay safe
                this.minelayerBehavior(ship, nearby);
                break;

            case 'repair_tender':
                // Repair tenders: Heal friendlies, avoid combat
                this.repairTenderBehavior(ship, nearby);
                break;
        }
    }

    /**
     * Fighter AI - fast interceptors
     * Now uses personality for target selection and performs strafing runs
     */
    fighterBehavior(ship, nearby) {
        // Update strafing cooldown
        if (ship.strafeCooldown > 0) {
            ship.strafeCooldown -= this.updateInterval;
        }

        // Use personality-based targeting
        const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
        if (bestTarget) {
            ship.priorityTarget = bestTarget;

            // Track routing enemies for pursuit
            if (bestTarget.isRouting) {
                ship.pursuingTarget = bestTarget;
            }

            // Check if we should initiate a strafing run against larger targets
            // Strafing runs are more effective against slow, large ships
            if (!ship.isStrafing && ship.strafeCooldown <= 0) {
                const shouldStrafe = this.shouldInitiateStrafingRun(ship, bestTarget);
                if (shouldStrafe) {
                    this.initiateStrafingRun(ship, bestTarget);
                }
            }
        }

        // Update active strafing run
        if (ship.isStrafing) {
            this.updateStrafingRun(ship, nearby);
        }

        // Fighters should avoid battleships and cruisers when possible
        // But aggressive/reckless fighters are more willing to stay in the fight
        const threats = nearby.enemies.filter(e => e.type === 'battleship' || e.type === 'cruiser');
        const aggressionThreshold = 0.5 * (ship.personality?.aggression || 1.0);
        const healthThreshold = ship.maxHealth * aggressionThreshold;

        if (threats.length > 0 && ship.health < healthThreshold && !ship.isStrafing) {
            // Evasive action - unless very reckless
            if (Math.random() > (ship.personality?.recklessness || 0)) {
                ship.evasiveManeuver = true;
            }
        } else if (!ship.isStrafing) {
            ship.evasiveManeuver = false;
        }
    }

    /**
     * Determine if fighter should initiate a strafing run
     */
    shouldInitiateStrafingRun(fighter, target) {
        // Only strafe larger, slower targets
        if (target.type === 'fighter') return false;

        // Prefer targets that are slow and have low evasion
        const targetEvasion = target.evasion || 50;
        if (targetEvasion > 40) return false; // Too nimble for a strafe

        // Check distance - need to be within approach range
        const distance = Math.hypot(target.x - fighter.x, target.y - fighter.y);
        if (distance > 300 || distance < 50) return false;

        // Personality affects strafing tendency
        const aggression = fighter.personality?.aggression || 1.0;
        const recklessness = fighter.personality?.recklessness || 0;

        // Aggressive and reckless fighters strafe more often
        const strafeChance = 0.15 + aggression * 0.1 + recklessness * 0.2;

        return Math.random() < strafeChance;
    }

    /**
     * Initiate a strafing run
     */
    initiateStrafingRun(fighter, target) {
        fighter.isStrafing = true;
        fighter.strafeTarget = target;
        fighter.strafePhase = 0; // 0 = approach, 1 = strafe pass, 2 = disengage
        fighter.strafeStartTime = Date.now();

        // Calculate approach vector - come in from the side or rear
        const angleToTarget = Math.atan2(target.y - fighter.y, target.x - fighter.x);
        const approachOffset = (Math.random() - 0.5) * Math.PI; // Random angle offset

        // Set approach point to side of target
        const approachDist = 150;
        fighter.strafeApproachX = target.x + Math.cos(angleToTarget + Math.PI + approachOffset) * approachDist;
        fighter.strafeApproachY = target.y + Math.sin(angleToTarget + Math.PI + approachOffset) * approachDist;

        // Set exit point on opposite side
        fighter.strafeExitX = target.x + Math.cos(angleToTarget + approachOffset) * approachDist;
        fighter.strafeExitY = target.y + Math.sin(angleToTarget + approachOffset) * approachDist;

        fighter.evasiveManeuver = true; // Boost evasion during strafe
    }

    /**
     * Update an active strafing run
     */
    updateStrafingRun(fighter, nearby) {
        if (!fighter.strafeTarget || !fighter.strafeTarget.alive) {
            this.endStrafingRun(fighter);
            return;
        }

        const target = fighter.strafeTarget;
        const distToTarget = Math.hypot(target.x - fighter.x, target.y - fighter.y);

        switch (fighter.strafePhase) {
            case 0: // Approach phase
                // Move toward approach point
                const distToApproach = Math.hypot(
                    fighter.strafeApproachX - fighter.x,
                    fighter.strafeApproachY - fighter.y
                );

                if (distToApproach < 30) {
                    // Reached approach point, begin strafe pass
                    fighter.strafePhase = 1;
                } else {
                    fighter.moveTo(fighter.strafeApproachX, fighter.strafeApproachY);
                }
                break;

            case 1: // Strafe pass - fly through, firing at target
                // Move toward exit point through target area
                fighter.moveTo(fighter.strafeExitX, fighter.strafeExitY);

                // Set target for weapons
                fighter.target = target;

                const distToExit = Math.hypot(
                    fighter.strafeExitX - fighter.x,
                    fighter.strafeExitY - fighter.y
                );

                if (distToExit < 40) {
                    // Reached exit, disengage
                    fighter.strafePhase = 2;
                }
                break;

            case 2: // Disengage - pull away
                // Continue away from target for safety
                const escapeAngle = Math.atan2(fighter.y - target.y, fighter.x - target.x);
                const escapeX = fighter.x + Math.cos(escapeAngle) * 100;
                const escapeY = fighter.y + Math.sin(escapeAngle) * 100;
                fighter.moveTo(escapeX, escapeY);

                // End strafe after pulling away
                if (distToTarget > 180) {
                    this.endStrafingRun(fighter);
                }
                break;
        }

        // Timeout safety - end strafe if taking too long (4 seconds)
        if (Date.now() - fighter.strafeStartTime > 4000) {
            this.endStrafingRun(fighter);
        }
    }

    /**
     * End a strafing run
     */
    endStrafingRun(fighter) {
        fighter.isStrafing = false;
        fighter.strafePhase = 0;
        fighter.strafeTarget = null;
        fighter.evasiveManeuver = false;
        fighter.strafeCooldown = 3 + Math.random() * 2; // 3-5 second cooldown
    }

    /**
     * Frigate AI - support ships
     * Guardians prioritize screening, others use personality targeting
     */
    frigateBehavior(ship, nearby) {
        const personality = ship.personality || { focus: 'guardian' };

        // Stay near friendly capital ships (unless very aggressive)
        if (personality.aggression < 1.3) {
            const friendlyCapitals = nearby.friendlies.filter(
                f => f.type === 'battleship' || f.type === 'carrier'
            );

            if (friendlyCapitals.length > 0) {
                ship.escortTarget = friendlyCapitals[0];
            }
        }

        // Guardians specifically hunt fighters threatening friendlies
        if (personality.focus === 'guardian') {
            const threateningFighters = nearby.enemies.filter(e =>
                e.type === 'fighter' && e.target && e.target.team === ship.team
            );
            if (threateningFighters.length > 0) {
                ship.priorityTarget = threateningFighters[0];
                return;
            }
        }

        // Use personality-based targeting for others
        const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
        if (bestTarget) {
            ship.priorityTarget = bestTarget;
        }
    }

    /**
     * Cruiser AI - main battle line
     * Disciplined cruisers maintain formation, others are more independent
     */
    cruiserBehavior(ship, nearby) {
        const personality = ship.personality || { discipline: 1.0 };

        // Use personality-based targeting
        const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
        if (bestTarget) {
            ship.priorityTarget = bestTarget;
        }

        // Maintain formation with other cruisers (if disciplined)
        if (personality.discipline > 0.8) {
            const friendlyCruisers = nearby.friendlies.filter(f => f.type === 'cruiser');
            if (friendlyCruisers.length > 0) {
                ship.formationBuddy = friendlyCruisers[0];
            }
        }
    }

    /**
     * Carrier AI - missile platform
     * Carriers generally stay back but personality affects how aggressively they position
     */
    carrierBehavior(ship, nearby) {
        const personality = ship.personality || { aggression: 0.8 };

        // Use personality-based targeting (carriers favor battleships anyway)
        const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
        if (bestTarget) {
            ship.priorityTarget = bestTarget;
        }

        // Carriers are vulnerable - stay at max range
        // But aggressive carriers are braver
        const closestEnemy = nearby.enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
            const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
            return distA - distB;
        })[0];

        if (closestEnemy) {
            const dist = Math.hypot(closestEnemy.x - ship.x, closestEnemy.y - ship.y);

            // Retreat threshold modified by aggression (aggressive carriers are braver)
            const retreatThreshold = 200 + (personality.aggression - 1) * 100;

            if (dist < retreatThreshold) {
                const retreatPos = this.calculateRetreatPosition(ship, [closestEnemy]);
                ship.moveTo(retreatPos.x, retreatPos.y);
                ship.retreating = true;
            } else {
                ship.retreating = false;
            }
        }
    }

    /**
     * Battleship AI - capital ship
     * Aggressive battleships push forward, cautious ones anchor the line
     */
    battleshipBehavior(ship, nearby) {
        const personality = ship.personality || { aggression: 1.0 };

        // Battleships advance - aggression determines speed
        ship.advanceRate = 0.2 + personality.aggression * 0.2; // 0.2 to 0.5

        // Use personality-based targeting
        const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
        if (bestTarget) {
            ship.priorityTarget = bestTarget;
        }

        // Morale boost to nearby friendlies (disciplined captains inspire more)
        ship.moraleAura = 15 + (personality.discipline || 1) * 10;
    }

    /**
     * Corvette AI - Electronic Warfare support
     * Stay near friendly capital ships to provide jamming coverage
     * Avoid direct combat, rely on point defense only
     */
    corvetteBehavior(ship, nearby) {
        // Find friendly capitals to escort (prioritize battleships > carriers > cruisers)
        const friendlyCapitals = nearby.friendlies.filter(
            f => f.type === 'battleship' || f.type === 'carrier' || f.type === 'cruiser'
        );

        // Sort by priority (battleships first, then carriers, then cruisers)
        friendlyCapitals.sort((a, b) => {
            const priority = { battleship: 3, carrier: 2, cruiser: 1 };
            return (priority[b.type] || 0) - (priority[a.type] || 0);
        });

        if (friendlyCapitals.length > 0) {
            // Escort the highest priority capital ship
            ship.escortTarget = friendlyCapitals[0];

            // Position to maximize jamming coverage
            // Stay close but not directly in front (don't block line of fire)
            const escortTarget = ship.escortTarget;
            const offsetAngle = escortTarget.rotation + Math.PI * 0.7; // Offset to rear-flank
            const offsetDist = 60;

            const idealX = escortTarget.x + Math.cos(offsetAngle) * offsetDist;
            const idealY = escortTarget.y + Math.sin(offsetAngle) * offsetDist;

            // Move toward ideal position
            const distToIdeal = Math.hypot(idealX - ship.x, idealY - ship.y);
            if (distToIdeal > 40) {
                ship.moveTo(idealX, idealY);
            }
        }

        // Corvettes avoid direct combat - only target enemies that get too close
        const closestEnemy = nearby.enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
            const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
            return distA - distB;
        })[0];

        if (closestEnemy) {
            const dist = Math.hypot(closestEnemy.x - ship.x, closestEnemy.y - ship.y);

            // Only target very close enemies (point defense)
            if (dist < 150) {
                ship.priorityTarget = closestEnemy;

                // If too close, try to retreat toward friendlies
                if (dist < 80) {
                    const retreatPos = this.calculateRetreatPosition(ship, [closestEnemy]);
                    ship.moveTo(retreatPos.x, retreatPos.y);
                    ship.evasiveManeuver = true;
                }
            } else {
                ship.priorityTarget = null;
                ship.evasiveManeuver = false;
            }
        }

        // High value target - enemies prioritize killing EW ships
        // Corvettes should be extra cautious when health is low
        if (ship.health < ship.maxHealth * 0.4) {
            ship.evasiveManeuver = true;
        }
    }

    /**
     * Destroyer AI - Point Defense Screening Ship
     * Escort capital ships and intercept incoming missiles/fighters
     * Position to provide PD coverage for valuable ships
     */
    destroyerBehavior(ship, nearby) {
        const personality = ship.personality || { aggression: 1.0, discipline: 1.0 };

        // Find friendly capital ships to escort (carriers are highest priority - they launch missiles that get countered)
        const friendlyCapitals = nearby.friendlies.filter(
            f => f.type === 'carrier' || f.type === 'battleship' || f.type === 'cruiser'
        );

        // Sort by priority (carriers first as they're vulnerable to return fire, then battleships)
        friendlyCapitals.sort((a, b) => {
            const priority = { carrier: 3, battleship: 2, cruiser: 1 };
            return (priority[b.type] || 0) - (priority[a.type] || 0);
        });

        if (friendlyCapitals.length > 0) {
            // Escort the highest priority capital ship
            ship.escortTarget = friendlyCapitals[0];

            // Position to intercept incoming threats
            // Stay between the capital and enemy ships
            const escortTarget = ship.escortTarget;

            // Find average enemy position
            let avgEnemyX = 0;
            let avgEnemyY = 0;
            if (nearby.enemies.length > 0) {
                for (const enemy of nearby.enemies) {
                    avgEnemyX += enemy.x;
                    avgEnemyY += enemy.y;
                }
                avgEnemyX /= nearby.enemies.length;
                avgEnemyY /= nearby.enemies.length;

                // Position between escort target and enemy center
                const angleToEnemy = Math.atan2(avgEnemyY - escortTarget.y, avgEnemyX - escortTarget.x);
                const screenDist = 70; // Stay ahead of the capital

                const idealX = escortTarget.x + Math.cos(angleToEnemy) * screenDist;
                const idealY = escortTarget.y + Math.sin(angleToEnemy) * screenDist;

                // Move toward screening position
                const distToIdeal = Math.hypot(idealX - ship.x, idealY - ship.y);
                if (distToIdeal > 50) {
                    ship.moveTo(idealX, idealY);
                }
            } else {
                // No enemies visible - stay close to escort target
                const offsetAngle = escortTarget.rotation + Math.PI * 0.25; // Forward-flank position
                const offsetDist = 50;

                const idealX = escortTarget.x + Math.cos(offsetAngle) * offsetDist;
                const idealY = escortTarget.y + Math.sin(offsetAngle) * offsetDist;

                const distToIdeal = Math.hypot(idealX - ship.x, idealY - ship.y);
                if (distToIdeal > 40) {
                    ship.moveTo(idealX, idealY);
                }
            }
        }

        // Target selection - prioritize fighters and small ships that threaten the fleet
        // Destroyers are aggressive hunters of small craft
        const hostileFighters = nearby.enemies.filter(e =>
            e.type === 'fighter' || e.type === 'frigate' || e.type === 'corvette'
        );

        if (hostileFighters.length > 0) {
            // Sort by distance
            hostileFighters.sort((a, b) => {
                const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
                const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
                return distA - distB;
            });
            ship.priorityTarget = hostileFighters[0];
        } else {
            // No small craft - use personality-based targeting
            const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
            if (bestTarget) {
                ship.priorityTarget = bestTarget;
            }
        }

        // Destroyers are faster and more aggressive than corvettes
        // They can push forward more to screen
        if (personality.aggression > 1.0) {
            ship.stanceRangeModifier = 0.9; // Push forward slightly
        }
    }

    /**
     * Dreadnought AI - Super-capital with spinal beam
     * Slow advance, prioritize spinal beam on high-value targets
     */
    dreadnoughtBehavior(ship, nearby) {
        const personality = ship.personality || { aggression: 1.0 };

        // Dreadnoughts advance inexorably
        ship.advanceRate = 0.15 + personality.aggression * 0.1;

        // Prioritize targets for spinal beam
        // Best targets: Other capitals, especially stationary ones
        const capitalTargets = nearby.enemies.filter(e =>
            e.type === 'dreadnought' || e.type === 'battleship' ||
            e.type === 'carrier' || e.type === 'cruiser'
        );

        if (capitalTargets.length > 0 && ship.spinalBeamReady) {
            // Sort by priority (dreadnoughts > battleships > carriers > cruisers)
            capitalTargets.sort((a, b) => {
                const priority = { dreadnought: 4, battleship: 3, carrier: 3, cruiser: 2 };
                return (priority[b.type] || 1) - (priority[a.type] || 1);
            });

            const spinalTarget = capitalTargets[0];
            const dist = Math.hypot(spinalTarget.x - ship.x, spinalTarget.y - ship.y);

            // Check if in spinal beam range
            if (dist <= ship.spinalBeamRange) {
                // Start charging if not already
                if (!ship.spinalBeamCharging) {
                    ship.chargeSpinalBeam(spinalTarget);
                }
            }

            ship.priorityTarget = spinalTarget;
        } else {
            // Use personality-based targeting for regular weapons
            const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
            if (bestTarget) {
                ship.priorityTarget = bestTarget;
            }
        }

        // Massive morale aura
        ship.moraleAura = 25 + (personality.discipline || 1) * 15;
    }

    /**
     * Gunship AI - Heavy attack craft
     * More aggressive than fighters, hunts larger targets
     */
    gunshipBehavior(ship, nearby) {
        const personality = ship.personality || { aggression: 1.2 };

        // Gunships are aggressive - target larger ships
        const preferredTargets = nearby.enemies.filter(e =>
            e.type === 'frigate' || e.type === 'cruiser' ||
            e.type === 'carrier' || e.type === 'corvette'
        );

        if (preferredTargets.length > 0) {
            // Sort by damage dealt (focus wounded)
            preferredTargets.sort((a, b) => {
                const healthRatioA = a.health / a.maxHealth;
                const healthRatioB = b.health / b.maxHealth;
                return healthRatioA - healthRatioB;
            });
            ship.priorityTarget = preferredTargets[0];
        } else {
            // Fall back to personality targeting
            const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
            if (bestTarget) {
                ship.priorityTarget = bestTarget;
            }
        }

        // Gunships can brawl - less evasive than fighters
        const threats = nearby.enemies.filter(e =>
            e.type === 'battleship' || e.type === 'dreadnought'
        );

        if (threats.length > 0 && ship.health < ship.maxHealth * 0.3) {
            ship.evasiveManeuver = true;
        } else {
            ship.evasiveManeuver = false;
        }
    }

    /**
     * Interceptor AI - Fighter killer
     * Hunts small craft exclusively
     */
    interceptorBehavior(ship, nearby) {
        // Interceptors ONLY target small craft
        const smallCraft = nearby.enemies.filter(e =>
            e.type === 'fighter' || e.type === 'gunship' ||
            e.type === 'interceptor'
        );

        if (smallCraft.length > 0) {
            // Prioritize: interceptors > fighters > gunships
            smallCraft.sort((a, b) => {
                const priority = { interceptor: 3, fighter: 2, gunship: 1 };
                return (priority[b.type] || 0) - (priority[a.type] || 0);
            });
            ship.priorityTarget = smallCraft[0];

            // Engage aggressively
            ship.evasiveManeuver = false;
        } else {
            // No small craft - reluctantly target larger ships
            // But interceptors are poor against them
            const bestTarget = this.selectTargetByPersonality(ship, nearby.enemies);
            if (bestTarget) {
                ship.priorityTarget = bestTarget;
            }

            // Be evasive against larger ships
            ship.evasiveManeuver = true;
        }
    }

    /**
     * Minelayer AI - Mine deployment
     * Deploy mines in enemy paths, avoid combat
     */
    minelayerBehavior(ship, nearby) {
        // Find good mine deployment locations
        // Ideal: Between friendly capitals and approaching enemies

        const friendlyCapitals = nearby.friendlies.filter(f =>
            f.type === 'battleship' || f.type === 'carrier' ||
            f.type === 'cruiser' || f.type === 'dreadnought'
        );

        // Calculate average enemy approach vector
        if (nearby.enemies.length > 0 && friendlyCapitals.length > 0) {
            let avgEnemyX = 0;
            let avgEnemyY = 0;
            for (const enemy of nearby.enemies) {
                avgEnemyX += enemy.x;
                avgEnemyY += enemy.y;
            }
            avgEnemyX /= nearby.enemies.length;
            avgEnemyY /= nearby.enemies.length;

            // Position between enemies and friendlies
            const capital = friendlyCapitals[0];
            const midX = (avgEnemyX + capital.x) / 2;
            const midY = (avgEnemyY + capital.y) / 2;

            // Move toward deployment position
            const distToMid = Math.hypot(midX - ship.x, midY - ship.y);
            if (distToMid > 100 && ship.canDeployMine && ship.canDeployMine()) {
                ship.moveTo(midX, midY);
            }

            // Deploy mine flag for combat system to handle
            ship.shouldDeployMine = ship.canDeployMine && ship.canDeployMine();
        }

        // Minelayers avoid combat
        const closestEnemy = nearby.enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
            const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
            return distA - distB;
        })[0];

        if (closestEnemy) {
            const dist = Math.hypot(closestEnemy.x - ship.x, closestEnemy.y - ship.y);
            if (dist < 150) {
                // Retreat from threats
                const retreatPos = this.calculateRetreatPosition(ship, [closestEnemy]);
                ship.moveTo(retreatPos.x, retreatPos.y);
                ship.evasiveManeuver = true;
                ship.priorityTarget = closestEnemy; // Defensive fire only
            }
        }
    }

    /**
     * Repair Tender AI - Fleet support
     * Stay near damaged friendlies, avoid combat
     */
    repairTenderBehavior(ship, nearby) {
        // Find most damaged friendly (handled by RepairTender class)
        // AI just needs to position the ship

        // If we have a repair target, move toward it
        if (ship.currentRepairTarget && ship.currentRepairTarget.alive) {
            const target = ship.currentRepairTarget;
            const dist = Math.hypot(target.x - ship.x, target.y - ship.y);

            if (dist > ship.repairRange * 0.7) {
                // Move closer to repair target
                ship.moveTo(target.x, target.y);
            }
        } else {
            // No repair target - stay near friendly capitals
            const friendlyCapitals = nearby.friendlies.filter(f =>
                f.type === 'battleship' || f.type === 'carrier' ||
                f.type === 'cruiser' || f.type === 'dreadnought'
            );

            if (friendlyCapitals.length > 0) {
                // Find most damaged capital
                const mostDamaged = friendlyCapitals.reduce((prev, curr) => {
                    const prevRatio = prev.health / prev.maxHealth;
                    const currRatio = curr.health / curr.maxHealth;
                    return currRatio < prevRatio ? curr : prev;
                });

                // Position behind the damaged capital (safe spot)
                const enemies = nearby.enemies;
                if (enemies.length > 0) {
                    const avgEnemyX = enemies.reduce((sum, e) => sum + e.x, 0) / enemies.length;
                    const avgEnemyY = enemies.reduce((sum, e) => sum + e.y, 0) / enemies.length;
                    const awayAngle = Math.atan2(mostDamaged.y - avgEnemyY, mostDamaged.x - avgEnemyX);

                    const idealX = mostDamaged.x + Math.cos(awayAngle) * 60;
                    const idealY = mostDamaged.y + Math.sin(awayAngle) * 60;

                    ship.moveTo(idealX, idealY);
                }
            }
        }

        // Repair tenders REALLY avoid combat
        const closestEnemy = nearby.enemies.sort((a, b) => {
            const distA = Math.hypot(a.x - ship.x, a.y - ship.y);
            const distB = Math.hypot(b.x - ship.x, b.y - ship.y);
            return distA - distB;
        })[0];

        if (closestEnemy) {
            const dist = Math.hypot(closestEnemy.x - ship.x, closestEnemy.y - ship.y);
            if (dist < 200) {
                // Retreat!
                const retreatPos = this.calculateRetreatPosition(ship, [closestEnemy]);
                ship.moveTo(retreatPos.x, retreatPos.y);
                ship.evasiveManeuver = true;
            }

            // Only target extremely close enemies
            if (dist < 100) {
                ship.priorityTarget = closestEnemy;
            }
        }
    }

    /**
     * Update ship morale based on battlefield conditions
     */
    updateMorale(ship, allShips) {
        // Initialize morale if not present
        if (ship.morale === undefined) {
            ship.morale = 100;
            ship.maxMorale = 100;
            ship.isRouting = false;
            ship.isLastStand = false;
            ship.lastStandBonus = 0;
        }

        // Count nearby friendlies and enemies
        const nearby = this.getNearbyUnits(ship, allShips, 200);
        const nearbyFriendlies = nearby.friendlies.length;
        const nearbyEnemies = nearby.enemies.length;

        // Morale factors
        let moraleDelta = 0;

        // Isolated penalty
        if (nearbyFriendlies === 0 && nearbyEnemies > 0) {
            moraleDelta -= 5; // Isolated ships lose morale fast
        }

        // Outnumbered penalty
        if (nearbyEnemies > nearbyFriendlies * 2) {
            moraleDelta -= 3;
        }

        // Low health penalty
        if (ship.health < ship.maxHealth * 0.3) {
            moraleDelta -= 2;
        }

        // Capital ship threat (small ships fear battleships)
        if (ship.type === 'fighter' || ship.type === 'frigate') {
            const nearbyBattleships = nearby.enemies.filter(e => e.type === 'battleship');
            if (nearbyBattleships.length > 0) {
                moraleDelta -= nearbyBattleships.length * 2;
            }
        }

        // Support bonus
        if (nearbyFriendlies > nearbyEnemies) {
            moraleDelta += 1;
        }

        // Battleship morale aura
        const friendlyBattleships = nearby.friendlies.filter(f => f.type === 'battleship');
        if (friendlyBattleships.length > 0) {
            moraleDelta += 2;
        }

        // Fleet morale influence
        if (ship.fleetOrders?.fleetMorale !== undefined) {
            const fleetMoraleBonus = (ship.fleetOrders.fleetMorale - 50) / 50; // -1 to +1
            moraleDelta += fleetMoraleBonus * 2;

            // Fleet advantage gives morale boost
            if (ship.fleetOrders.hasAdvantage) {
                moraleDelta += 1;
            }
        }

        // Apply morale change - discipline reduces negative effects
        const discipline = ship.personality?.discipline || 1.0;
        if (moraleDelta < 0) {
            moraleDelta *= (2 - discipline); // High discipline reduces morale loss
        }
        ship.morale = Math.max(0, Math.min(ship.maxMorale, ship.morale + moraleDelta));

        // Check for morale break - disciplined crews hold longer
        const breakThreshold = 20 + (discipline - 1) * 15; // 20 to 35 depending on discipline
        if (ship.morale <= breakThreshold && !ship.isRouting) {
            this.startRouting(ship, allShips);
        }

        // Recover from routing if morale improves
        const rallyThreshold = 45 + (discipline - 1) * 10; // 45 to 55
        if (ship.morale > rallyThreshold && ship.isRouting) {
            this.stopRouting(ship);
        }
    }

    /**
     * Start routing behavior
     */
    startRouting(ship, allShips) {
        ship.isRouting = true;
        ship.routingSpeed = ship.speed * 1.5; // Boost engines when fleeing

        // Find retreat direction (away from enemies)
        const nearby = this.getNearbyUnits(ship, allShips, 300);

        let retreatX = 0;
        let retreatY = 0;

        // Flee from enemies
        for (const enemy of nearby.enemies) {
            const dx = ship.x - enemy.x;
            const dy = ship.y - enemy.y;
            retreatX += dx;
            retreatY += dy;
        }

        // Normalize retreat direction
        const len = Math.sqrt(retreatX * retreatX + retreatY * retreatY);
        if (len > 0) {
            retreatX = (retreatX / len) * 500;
            retreatY = (retreatY / len) * 500;
        }

        ship.routeTargetX = ship.x + retreatX;
        ship.routeTargetY = ship.y + retreatY;
    }

    /**
     * Stop routing behavior
     */
    stopRouting(ship) {
        ship.isRouting = false;
        ship.routeTargetX = undefined;
        ship.routeTargetY = undefined;
    }

    /**
     * Update tactical state and behaviors
     * Now incorporates fleet-level orders and withdrawal behavior
     */
    updateTacticalState(ship, allShips) {
        // If routing, override other behaviors
        if (ship.isRouting && ship.routeTargetX !== undefined) {
            ship.speed = ship.routingSpeed;
            ship.moveTo(ship.routeTargetX, ship.routeTargetY);
            return;
        }

        // Check for damaged ship withdrawal (before fleet orders)
        if (this.updateWithdrawal(ship, allShips)) {
            return; // Skip other behaviors while withdrawing
        }

        // Get fleet orders
        const fleetOrders = ship.fleetOrders || {};

        // Apply fleet stance modifiers
        this.applyFleetStance(ship, fleetOrders, allShips);

        // Check for flanking opportunities (fighters only, and only when advancing)
        if (ship.type === 'fighter' && fleetOrders.stance !== 'retreat' && fleetOrders.stance !== 'regroup') {
            const flankingTarget = this.findFlankingOpportunity(ship, allShips);
            if (flankingTarget) {
                // Move to flank position
                const flankPos = this.calculateFlankPosition(ship, flankingTarget);
                ship.moveTo(flankPos.x, flankPos.y);
            }
        }

        // Carrier kiting
        if (ship.type === 'carrier' && ship.retreating) {
            // Already handled in carrierBehavior
        }
    }

    /**
     * Check and update withdrawal behavior for damaged ships
     * Returns true if ship is actively withdrawing (skip other behaviors)
     */
    updateWithdrawal(ship, allShips) {
        // Battleships never withdraw (anchors fight to the death)
        if (ship.tacticalRole === 'anchor' || ship.type === 'battleship') {
            ship.isWithdrawing = false;
            return false;
        }

        // Last stand ships don't withdraw
        if (ship.isLastStand) {
            ship.isWithdrawing = false;
            return false;
        }

        // Check if ship should start withdrawal
        const shouldWithdraw = ship.shouldWithdraw ? ship.shouldWithdraw() : false;

        if (shouldWithdraw && !ship.isWithdrawing) {
            this.initiateWithdrawal(ship, allShips);
        }

        // Update active withdrawal
        if (ship.isWithdrawing) {
            return this.continueWithdrawal(ship, allShips);
        }

        return false;
    }

    /**
     * Initiate withdrawal for damaged ship
     */
    initiateWithdrawal(ship, allShips) {
        ship.isWithdrawing = true;

        // Find safe position - toward friendly capitals or away from enemies
        const nearby = this.getNearbyUnits(ship, allShips, 400);

        // Try to find friendly capitals to withdraw toward
        const friendlyCapitals = nearby.friendlies.filter(
            f => f.type === 'battleship' || f.type === 'carrier' || f.type === 'cruiser'
        );

        if (friendlyCapitals.length > 0) {
            // Withdraw toward nearest friendly capital
            const nearestCapital = friendlyCapitals.reduce((prev, curr) => {
                const prevDist = Math.hypot(prev.x - ship.x, prev.y - ship.y);
                const currDist = Math.hypot(curr.x - ship.x, curr.y - ship.y);
                return currDist < prevDist ? curr : prev;
            });

            // Position behind the capital (away from enemies)
            const avgEnemyX = nearby.enemies.reduce((sum, e) => sum + e.x, 0) / Math.max(1, nearby.enemies.length);
            const avgEnemyY = nearby.enemies.reduce((sum, e) => sum + e.y, 0) / Math.max(1, nearby.enemies.length);

            const awayAngle = Math.atan2(nearestCapital.y - avgEnemyY, nearestCapital.x - avgEnemyX);
            ship.withdrawalTarget = {
                x: nearestCapital.x + Math.cos(awayAngle) * 80,
                y: nearestCapital.y + Math.sin(awayAngle) * 80
            };
        } else {
            // No capitals - just retreat away from enemies
            const retreatPos = this.calculateRetreatPosition(ship, nearby.enemies);
            ship.withdrawalTarget = retreatPos;
        }

        // Boost evasion while withdrawing
        ship.evasiveManeuver = true;
    }

    /**
     * Continue withdrawal behavior
     * Returns true while withdrawing, false when complete
     */
    continueWithdrawal(ship, allShips) {
        if (!ship.withdrawalTarget) {
            ship.isWithdrawing = false;
            return false;
        }

        const distToTarget = Math.hypot(
            ship.withdrawalTarget.x - ship.x,
            ship.withdrawalTarget.y - ship.y
        );

        // Move toward withdrawal target
        ship.moveTo(ship.withdrawalTarget.x, ship.withdrawalTarget.y);

        // Check if withdrawal complete
        if (distToTarget < 50) {
            // Reached safe position - check if we should continue withdrawing or re-engage
            const healthRatio = ship.health / ship.maxHealth;

            if (healthRatio < 0.15) {
                // Very low health - continue withdrawing (find new target)
                this.initiateWithdrawal(ship, allShips);
            } else {
                // Moderate health - can cautiously re-engage
                ship.isWithdrawing = false;
                ship.evasiveManeuver = false;

                // Keep stanceRangeModifier high - stay at longer range
                ship.stanceRangeModifier = 1.4;
            }
        }

        // Cancel withdrawal if health recovers (not currently possible, but future-proof)
        const healthRatio = ship.health / ship.maxHealth;
        if (healthRatio > 0.5) {
            ship.isWithdrawing = false;
            ship.evasiveManeuver = false;
            return false;
        }

        // Cancel withdrawal if last few ships (trigger last stand instead)
        const friendlies = allShips.filter(s => s.alive && s.team === ship.team);
        if (friendlies.length <= 3) {
            ship.isWithdrawing = false;
            ship.evasiveManeuver = false;
            return false;
        }

        return true;
    }

    /**
     * Apply fleet stance to ship behavior
     */
    applyFleetStance(ship, fleetOrders, allShips) {
        if (!fleetOrders.stance) return;

        const personality = ship.personality || { discipline: 1.0, aggression: 1.0 };

        // Discipline affects how well ship follows fleet orders
        const followChance = 0.5 + personality.discipline * 0.3;
        if (Math.random() > followChance) return; // Undisciplined ships may ignore orders

        switch (fleetOrders.stance) {
            case 'advance':
                // Aggressive advance - modify preferred range
                ship.stanceRangeModifier = 0.8; // Close in more
                break;

            case 'hold':
                // Hold position - maintain current range
                ship.stanceRangeModifier = 1.0;
                // Reduce speed slightly to hold formation
                if (fleetOrders.shouldMaintainCohesion) {
                    this.maintainCohesion(ship, fleetOrders);
                }
                break;

            case 'retreat':
                // Retreat - pull back from combat
                ship.stanceRangeModifier = 1.5; // Stay further away
                if (fleetOrders.focusPoint) {
                    ship.moveTo(fleetOrders.focusPoint.x, fleetOrders.focusPoint.y);
                }
                break;

            case 'regroup':
                // Regroup - move toward fleet center, reduce aggression
                ship.stanceRangeModifier = 1.3;
                if (fleetOrders.focusPoint) {
                    // Move toward regroup point
                    const distToRegroup = Math.hypot(
                        ship.x - fleetOrders.focusPoint.x,
                        ship.y - fleetOrders.focusPoint.y
                    );
                    if (distToRegroup > 100) {
                        ship.moveTo(fleetOrders.focusPoint.x, fleetOrders.focusPoint.y);
                    }
                }
                break;
        }

        // Apply cohesion pressure
        if (fleetOrders.shouldMaintainCohesion && fleetOrders.stance !== 'retreat') {
            this.maintainCohesion(ship, fleetOrders);
        }
    }

    /**
     * Pull ship toward fleet center to maintain cohesion
     */
    maintainCohesion(ship, fleetOrders) {
        if (!fleetOrders.fleetCenter) return;

        const distToCenter = Math.hypot(
            ship.x - fleetOrders.fleetCenter.x,
            ship.y - fleetOrders.fleetCenter.y
        );

        // If too far from fleet center, move back
        if (distToCenter > fleetOrders.cohesionRadius * 1.5) {
            // Calculate position partway back to center
            const pullStrength = 0.3;
            const targetX = ship.x + (fleetOrders.fleetCenter.x - ship.x) * pullStrength;
            const targetY = ship.y + (fleetOrders.fleetCenter.y - ship.y) * pullStrength;

            ship.cohesionTargetX = targetX;
            ship.cohesionTargetY = targetY;
        }
    }

    /**
     * Get nearby ships within range
     */
    getNearbyUnits(ship, allShips, range) {
        const friendlies = [];
        const enemies = [];

        for (const other of allShips) {
            if (!other.alive || other === ship) continue;

            const dist = ship.distanceTo ? ship.distanceTo(other) :
                Math.hypot(other.x - ship.x, other.y - ship.y);
            if (dist > range) continue;

            if (other.team === ship.team) {
                friendlies.push(other);
            } else {
                enemies.push(other);
            }
        }

        return { friendlies, enemies };
    }

    /**
     * Find flanking opportunity for fighters
     */
    findFlankingOpportunity(ship, allShips) {
        const nearby = this.getNearbyUnits(ship, allShips, 400);

        for (const enemy of nearby.enemies) {
            // Look for enemies engaged with our larger ships
            const enemyNearby = this.getNearbyUnits(enemy, allShips, 150);
            const friendlyCapitals = enemyNearby.friendlies.filter(
                f => f.type === 'cruiser' || f.type === 'battleship'
            );

            if (friendlyCapitals.length > 0) {
                // Enemy is engaged, good flanking target
                return enemy;
            }
        }

        return null;
    }

    /**
     * Calculate flanking position
     */
    calculateFlankPosition(ship, target) {
        // Move to side or rear of target
        const angle = Math.atan2(target.y - ship.y, target.x - ship.x);
        const flankAngle = angle + Math.PI / 2; // 90 degrees to the side

        const distance = 100;
        return {
            x: target.x + Math.cos(flankAngle) * distance,
            y: target.y + Math.sin(flankAngle) * distance
        };
    }

    /**
     * Calculate retreat position
     */
    calculateRetreatPosition(ship, enemies) {
        // Calculate average enemy position
        let avgX = 0;
        let avgY = 0;

        for (const enemy of enemies) {
            avgX += enemy.x;
            avgY += enemy.y;
        }

        avgX /= enemies.length;
        avgY /= enemies.length;

        // Move away from average enemy position
        const dx = ship.x - avgX;
        const dy = ship.y - avgY;
        const len = Math.sqrt(dx * dx + dy * dy);

        if (len > 0) {
            return {
                x: ship.x + (dx / len) * 150,
                y: ship.y + (dy / len) * 150
            };
        }

        return { x: ship.x, y: ship.y };
    }

    /**
     * Check if ship is flanked
     */
    isFlanked(ship, allShips) {
        const nearby = this.getNearbyUnits(ship, allShips, 100);

        if (nearby.enemies.length < 2) return false;

        // Check if enemies are on opposite sides
        let leftEnemies = 0;
        let rightEnemies = 0;

        for (const enemy of nearby.enemies) {
            const angle = Math.atan2(enemy.y - ship.y, enemy.x - ship.x);
            const relativeAngle = angle - ship.rotation;

            if (relativeAngle > 0) {
                leftEnemies++;
            } else {
                rightEnemies++;
            }
        }

        return leftEnemies > 0 && rightEnemies > 0;
    }

    /**
     * Get AI statistics for debugging
     */
    getStats(ships) {
        let routingCount = 0;
        let lastStandCount = 0;
        let avgMorale = 0;

        for (const ship of ships) {
            if (!ship.alive) continue;

            if (ship.isRouting) routingCount++;
            if (ship.isLastStand) lastStandCount++;
            if (ship.morale !== undefined) avgMorale += ship.morale;
        }

        const aliveCount = ships.filter(u => u.alive).length;
        if (aliveCount > 0) {
            avgMorale /= aliveCount;
        }

        return {
            routing: routingCount,
            lastStands: lastStandCount,
            avgMorale: Math.round(avgMorale)
        };
    }

    /**
     * Check for and trigger heroic last stand
     */
    checkLastStand(ship, allShips) {
        // Only trigger if not already routing and health/morale critical
        if (ship.isRouting || ship.isLastStand) return;

        const friendlies = allShips.filter(u => u.alive && u.team === ship.team);
        const totalFriendlies = friendlies.length;

        // Trigger if:
        // 1. One of last 3 ships on team
        // 2. Low health (< 30%)
        // 3. Surrounded by enemies
        const nearby = this.getNearbyUnits(ship, allShips, 200);
        const isLastFew = totalFriendlies <= 3;
        const isLowHealth = ship.health < ship.maxHealth * 0.3;
        const isSurrounded = nearby.enemies.length >= nearby.friendlies.length * 2;

        if (isLastFew && (isLowHealth || isSurrounded)) {
            this.triggerLastStand(ship);
        }
    }

    /**
     * Trigger heroic last stand
     */
    triggerLastStand(ship) {
        ship.isLastStand = true;
        ship.isRouting = false; // Never route during last stand
        ship.lastStandBonus = 0.5; // +50% damage
        ship.morale = Math.max(ship.morale, 60); // Boost morale
        console.log(`${ship.team} ${ship.type} LAST STAND!`);
    }

    /**
     * Check for pursuit of routing ships
     */
    checkPursuit(ship, allShips) {
        if (ship.type !== 'fighter') return;
        if (!ship.alive) return;

        // Find nearby routing enemies
        const nearby = this.getNearbyUnits(ship, allShips, 300);
        const routingEnemies = nearby.enemies.filter(e => e.isRouting);

        if (routingEnemies.length > 0) {
            // Fighters should prioritize routing ships
            const closest = routingEnemies.reduce((prev, curr) => {
                const prevDist = Math.hypot(prev.x - ship.x, prev.y - ship.y);
                const currDist = Math.hypot(curr.x - ship.x, curr.y - ship.y);
                return currDist < prevDist ? curr : prev;
            });

            // Mark for pursuit (used by combat system for target priority)
            ship.pursuingTarget = closest;
            return true;
        }

        ship.pursuingTarget = null;
        return false;
    }

    /**
     * Attempt to rally routing ships
     */
    attemptRally(ship, allShips) {
        if (!ship.isRouting) return;

        // Rally chance based on:
        // - Nearby friendlies
        // - Distance from enemies
        // - Current morale
        const nearby = this.getNearbyUnits(ship, allShips, 200);
        const safeDistance = nearby.enemies.length === 0;
        const hasFriendlySupport = nearby.friendlies.length >= 3;
        const moraleRecovering = ship.morale > 40;

        if (safeDistance && hasFriendlySupport && moraleRecovering) {
            // 20% chance to rally each AI update
            if (Math.random() < 0.2) {
                this.rallyShip(ship);
            }
        }
    }

    /**
     * Rally a routing ship
     */
    rallyShip(ship) {
        this.stopRouting(ship);
        ship.morale = 55; // Rallied but shaken
        console.log(`${ship.team} ${ship.type} rallied!`);
    }
}

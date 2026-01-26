/**
 * Combat.js - Space warfare combat system
 * Handles ship targeting, multi-hardpoint firing, damage calculation
 */

import { CombatBalance, WeaponConfig } from '../data/config.js';
import { Wreckage } from '../entities/Wreckage.js';
import { Fighter } from '../entities/Fighter.js';
import { Interceptor } from '../entities/Interceptor.js';

export class CombatSystem {
    constructor(projectileSystem, particleSystem, aiSystem = null) {
        this.projectileSystem = projectileSystem;
        this.particleSystem = particleSystem;
        this.aiSystem = aiSystem;

        // Track projectiles and their targets
        this.activeProjectiles = new Map(); // projectile -> target data

        // Visual/audio effects (set by engine)
        this.screenEffects = null;
        this.audioSystem = null;

        // Wreckage spawning callback
        this.onWreckageSpawn = null;

        // Ship spawning callback (for carrier deployments)
        this.onShipSpawn = null;

        // Active mines on the battlefield
        this.activeMines = [];

        // Spinal beam effects to render
        this.activeSpinalBeams = [];

        // Weapon accuracy modifiers by type
        // Lasers are precise, missiles track, ballistics are spray
        this.weaponAccuracy = {
            laser: 85,      // High accuracy - precision weapons
            missile: 75,    // Good accuracy - tracking (but slow, gives time to evade)
            ballistic: 65   // Lower accuracy - kinetic spray
        };

        // Large ship types that trigger screen shake on destruction
        this.largeShipTypes = ['battleship', 'cruiser', 'carrier', 'dreadnought'];
    }

    /**
     * Check if a ship type is considered "large" for screen shake purposes
     */
    isLargeShip(shipType) {
        return this.largeShipTypes.includes(shipType);
    }

    /**
     * Calculate hit chance based on weapon accuracy and target evasion
     * Returns a value 0-100 representing hit percentage
     */
    calculateHitChance(attacker, target, weaponType, allShips = []) {
        // Base accuracy from weapon type
        const baseAccuracy = this.weaponAccuracy[weaponType] || 70;

        // Target evasion (dynamic, based on current movement)
        const targetEvasion = target.getCurrentEvasion ? target.getCurrentEvasion() : 50;

        // Distance penalty - further away = harder to hit
        const distance = attacker.distanceTo(target);
        const range = attacker.range || 200;
        const distanceRatio = distance / range;
        const distancePenalty = distanceRatio * 15; // Up to -15 at max range

        // Attacker movement penalty - harder to aim while moving fast
        const attackerSpeed = Math.sqrt(attacker.vx * attacker.vx + attacker.vy * attacker.vy);
        const attackerSpeedRatio = attackerSpeed / Math.max(1, attacker.speed);
        const movementPenalty = attackerSpeedRatio * 10; // Up to -10 while moving fast

        // Size bonus - bigger targets are easier to hit
        const sizeBonus = (target.size - 12) * 1.5; // +/- based on size (12 is baseline)

        // Calculate final hit chance
        // Formula: base accuracy - evasion/2 - distance - movement + size
        let hitChance = baseAccuracy - (targetEvasion * 0.5) - distancePenalty - movementPenalty + sizeBonus;

        // Weapon-specific bonuses
        if (weaponType === 'missile') {
            // Missiles track - less affected by evasion of large ships
            if (target.size > 15) {
                hitChance += 10;
            }
        } else if (weaponType === 'laser') {
            // Lasers are instant - less affected by target movement
            hitChance += targetEvasion * 0.15; // Partially ignore evasion
        }

        // EW Jamming penalty - check for nearby enemy EW corvettes
        const ewPenalty = this.calculateEWPenalty(attacker, allShips);
        hitChance -= ewPenalty;

        // Clamp to reasonable range (minimum 15% for dramatic misses, max 95%)
        return Math.max(15, Math.min(95, hitChance));
    }

    /**
     * Calculate accuracy penalty from enemy EW jamming
     */
    calculateEWPenalty(attacker, allShips) {
        let totalPenalty = 0;

        for (const ship of allShips) {
            if (!ship.alive) continue;
            if (ship.team === attacker.team) continue;
            if (!ship.ewJammingRange || !ship.ewJammingStrength) continue;

            // Check if attacker is within jamming range
            const dist = Math.hypot(ship.x - attacker.x, ship.y - attacker.y);
            if (dist <= ship.ewJammingRange) {
                // Jamming strength falls off with distance
                const effectiveness = 1 - (dist / ship.ewJammingRange) * 0.5;
                totalPenalty += ship.ewJammingStrength * effectiveness;
            }
        }

        return totalPenalty;
    }

    /**
     * Roll to see if an attack hits
     */
    rollToHit(hitChance) {
        return Math.random() * 100 < hitChance;
    }

    /**
     * Update combat for all ships
     */
    update(deltaTime, ships) {
        // Run point defense interception before other combat
        this.updatePointDefense(ships);

        // Update projectile tracking
        this.updateProjectileTracking(ships);

        // Update special ship systems
        this.updateCarrierDeployment(ships, deltaTime);
        this.updateRepairTenders(ships);
        this.updateMinelayers(ships);
        this.updateMines(ships, deltaTime);
        this.updateDreadnoughtBeams(ships, deltaTime);
        this.updateSpinalBeams(deltaTime);

        // Process combat for each ship
        for (const ship of ships) {
            if (!ship.alive) continue;
            if (ship.type === 'wreckage') continue; // Skip wreckage

            // Find target
            const target = this.findTarget(ship, ships);
            if (!target) continue;

            // Set ship's target for movement
            ship.target = target;

            // Check if in range of any weapon
            const dist = ship.distanceTo(target);
            if (dist > ship.range) {
                continue; // Not in range, keep moving
            }

            // Try to fire all ready hardpoints at target
            if (ship.canFire()) {
                this.fireAtTarget(ship, target);
            }
        }
    }

    /**
     * Update carrier fighter deployment
     */
    updateCarrierDeployment(ships, deltaTime) {
        const carriers = ships.filter(s => s.alive && s.type === 'carrier');

        for (const carrier of carriers) {
            // Check if carrier can launch
            if (!carrier.canLaunch || !carrier.canLaunch()) continue;

            // AI decides when to launch - launch when enemies are approaching
            const enemies = ships.filter(s => s.alive && s.team !== carrier.team);
            if (enemies.length === 0) continue;

            // Find closest enemy
            let closestDist = Infinity;
            for (const enemy of enemies) {
                const dist = Math.hypot(enemy.x - carrier.x, enemy.y - carrier.y);
                if (dist < closestDist) closestDist = dist;
            }

            // Launch when enemies within 400 units
            if (closestDist < 400) {
                const launchData = carrier.launchCraft();
                if (launchData) {
                    this.spawnCarrierCraft(launchData);
                }
            }
        }
    }

    /**
     * Spawn a craft from carrier launch
     */
    spawnCarrierCraft(launchData) {
        let newShip;

        if (launchData.type === 'fighter') {
            newShip = new Fighter(launchData.x, launchData.y, launchData.team);
        } else if (launchData.type === 'interceptor') {
            newShip = new Interceptor(launchData.x, launchData.y, launchData.team);
        } else {
            return; // Unknown type
        }

        // Set initial rotation to match carrier
        newShip.rotation = launchData.rotation;

        // Give initial velocity away from carrier
        newShip.vx = Math.cos(launchData.rotation) * newShip.speed * 0.5;
        newShip.vy = Math.sin(launchData.rotation) * newShip.speed * 0.5;

        // Create launch particles
        if (this.particleSystem) {
            for (let i = 0; i < 8; i++) {
                const angle = launchData.rotation + (Math.random() - 0.5) * 0.5;
                const speed = 30 + Math.random() * 50;
                this.particleSystem.createParticle(
                    launchData.x, launchData.y,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    '#ffcc44',
                    2 + Math.random() * 2,
                    0.3 + Math.random() * 0.2
                );
            }
        }

        // Spawn via callback
        if (this.onShipSpawn) {
            this.onShipSpawn(newShip);
        }

        console.log(`${launchData.team} carrier deployed ${launchData.type}`);
    }

    /**
     * Update repair tender healing
     */
    updateRepairTenders(ships) {
        const tenders = ships.filter(s => s.alive && s.type === 'repair_tender');

        for (const tender of tenders) {
            if (!tender.performRepair) continue;

            const repairInfo = tender.performRepair();
            if (repairInfo) {
                // Create healing particles along beam
                const midX = (repairInfo.source.x + repairInfo.target.x) / 2;
                const midY = (repairInfo.source.y + repairInfo.target.y) / 2;

                for (let i = 0; i < 3; i++) {
                    this.particleSystem.createParticle(
                        midX + (Math.random() - 0.5) * 20,
                        midY + (Math.random() - 0.5) * 20,
                        (Math.random() - 0.5) * 30,
                        (Math.random() - 0.5) * 30,
                        '#00ff88',
                        3 + Math.random() * 2,
                        0.4 + Math.random() * 0.3
                    );
                }
            }
        }
    }

    /**
     * Update minelayer mine deployment
     */
    updateMinelayers(ships) {
        const minelayers = ships.filter(s => s.alive && s.type === 'minelayer');

        for (const minelayer of minelayers) {
            if (!minelayer.shouldDeployMine) continue;
            if (!minelayer.deployMine) continue;

            const mineData = minelayer.deployMine();
            if (mineData) {
                this.activeMines.push(mineData);

                // Mine deployment effect
                if (this.particleSystem) {
                    for (let i = 0; i < 6; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = 20 + Math.random() * 30;
                        this.particleSystem.createParticle(
                            mineData.x, mineData.y,
                            Math.cos(angle) * speed,
                            Math.sin(angle) * speed,
                            '#ffaa00',
                            2,
                            0.5
                        );
                    }
                }

                console.log(`${minelayer.team} minelayer deployed mine (${minelayer.minesRemaining} remaining)`);
            }

            minelayer.shouldDeployMine = false;
        }
    }

    /**
     * Update active mines - arm them and check for detonation
     */
    updateMines(ships, deltaTime) {
        const minesToRemove = [];

        for (const mine of this.activeMines) {
            // Update arm timer
            if (!mine.armed) {
                mine.timer += deltaTime;
                if (mine.timer >= mine.armTime) {
                    mine.armed = true;
                }
                continue; // Don't detonate until armed
            }

            // Check for enemy ships in proximity
            for (const ship of ships) {
                if (!ship.alive) continue;
                if (ship.team === mine.team) continue; // Don't hit friendlies
                if (ship.type === 'wreckage') continue;

                const dist = Math.hypot(ship.x - mine.x, ship.y - mine.y);
                if (dist < mine.proximityRadius) {
                    // DETONATE!
                    this.detonateMine(mine, ship, ships);
                    minesToRemove.push(mine);
                    break;
                }
            }
        }

        // Remove detonated mines
        for (const mine of minesToRemove) {
            const index = this.activeMines.indexOf(mine);
            if (index > -1) {
                this.activeMines.splice(index, 1);
            }
        }
    }

    /**
     * Detonate a mine
     */
    detonateMine(mine, triggerShip, allShips) {
        // Deal damage to trigger ship
        triggerShip.takeDamage(mine.damage);

        // Explosion effect
        if (this.particleSystem) {
            this.particleSystem.createDeathExplosion(mine.x, mine.y, '#ffaa00');
        }

        // Screen shake only for large ships
        if (this.screenEffects && this.isLargeShip(triggerShip.type)) {
            this.screenEffects.shake(0.8);
        }

        // Sound
        if (this.audioSystem) {
            this.audioSystem.playImpact(0, 'missile');
        }

        // Check if ship destroyed
        if (!triggerShip.alive) {
            this.particleSystem.createDeathExplosion(
                triggerShip.x,
                triggerShip.y,
                triggerShip.color
            );
            this.spawnWreckage(triggerShip);

            // Screen shake on death only for large ships
            if (this.screenEffects && this.isLargeShip(triggerShip.type)) {
                this.screenEffects.shake(1.2);
            }

            if (this.audioSystem) {
                this.audioSystem.playShipDestroyed();
            }
        }

        console.log(`Mine detonated! Hit ${triggerShip.team} ${triggerShip.type}`);
    }

    /**
     * Update dreadnought spinal beam charging and firing
     */
    updateDreadnoughtBeams(ships, deltaTime) {
        const dreadnoughts = ships.filter(s => s.alive && s.type === 'dreadnought');

        for (const dreadnought of dreadnoughts) {
            // Check if charging and ready to fire
            if (dreadnought.spinalBeamCharging) {
                const beamData = dreadnought.fireSpinalBeam();

                if (beamData && beamData.target && beamData.target.alive) {
                    // FIRE SPINAL BEAM!
                    this.fireSpinalBeam(dreadnought, beamData);
                }
            }
        }
    }

    /**
     * Fire dreadnought spinal beam
     */
    fireSpinalBeam(dreadnought, beamData) {
        const target = beamData.target;

        // Deal massive damage
        const damageResult = target.takeDamage(beamData.damage);

        // Create dramatic beam effect
        this.activeSpinalBeams.push({
            startX: dreadnought.x + Math.cos(dreadnought.rotation) * dreadnought.size * 0.8,
            startY: dreadnought.y + Math.sin(dreadnought.rotation) * dreadnought.size * 0.8,
            endX: target.x,
            endY: target.y,
            duration: 0.5,
            timer: 0,
            color: '#ff6633'
        });

        // Massive particles along beam path
        const beamLength = Math.hypot(target.x - dreadnought.x, target.y - dreadnought.y);
        const beamAngle = Math.atan2(target.y - dreadnought.y, target.x - dreadnought.x);

        for (let i = 0; i < 30; i++) {
            const t = Math.random();
            const px = dreadnought.x + Math.cos(beamAngle) * beamLength * t;
            const py = dreadnought.y + Math.sin(beamAngle) * beamLength * t;

            this.particleSystem.createParticle(
                px + (Math.random() - 0.5) * 20,
                py + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#ff8844',
                3 + Math.random() * 4,
                0.3 + Math.random() * 0.3
            );
        }

        // Big screen shake
        if (this.screenEffects) {
            this.screenEffects.shake(1.5);
        }

        // Impact particles at target
        this.particleSystem.createDeathExplosion(target.x, target.y, '#ff6633');

        // Sound (use missile impact as placeholder)
        if (this.audioSystem) {
            this.audioSystem.playImpact(0, 'missile');
        }

        // Check if target destroyed
        if (!target.alive) {
            this.particleSystem.createDeathExplosion(target.x, target.y, target.color);
            this.spawnWreckage(target);

            if (this.screenEffects) {
                this.screenEffects.shake(2.0);
            }

            if (this.audioSystem) {
                this.audioSystem.playShipDestroyed();
            }
        }

        console.log(`${dreadnought.team} DREADNOUGHT SPINAL BEAM hit ${target.team} ${target.type} for ${beamData.damage} damage!`);
    }

    /**
     * Update active spinal beam effects
     */
    updateSpinalBeams(deltaTime) {
        const beamsToRemove = [];

        for (const beam of this.activeSpinalBeams) {
            beam.timer += deltaTime;
            if (beam.timer >= beam.duration) {
                beamsToRemove.push(beam);
            }
        }

        for (const beam of beamsToRemove) {
            const index = this.activeSpinalBeams.indexOf(beam);
            if (index > -1) {
                this.activeSpinalBeams.splice(index, 1);
            }
        }
    }

    /**
     * Render active spinal beams (called by renderer)
     */
    renderSpinalBeams(ctx) {
        for (const beam of this.activeSpinalBeams) {
            const progress = beam.timer / beam.duration;
            const alpha = 1 - progress;
            const width = 8 * (1 - progress * 0.5);

            ctx.save();
            ctx.strokeStyle = beam.color;
            ctx.lineWidth = width;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = beam.color;
            ctx.shadowBlur = 20;

            ctx.beginPath();
            ctx.moveTo(beam.startX, beam.startY);
            ctx.lineTo(beam.endX, beam.endY);
            ctx.stroke();

            // Inner bright core
            ctx.strokeStyle = '#ffddaa';
            ctx.lineWidth = width * 0.4;
            ctx.stroke();

            ctx.restore();
        }
    }

    /**
     * Render active mines (called by renderer)
     */
    renderMines(ctx) {
        for (const mine of this.activeMines) {
            ctx.save();

            // Mine color based on team and armed state
            const baseColor = mine.team === 'friendly' ? '#00aa88' : '#ff6644';
            const color = mine.armed ? baseColor : '#666666';

            // Pulsing glow when armed
            let glowIntensity = 10;
            if (mine.armed) {
                const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
                glowIntensity = 15 * pulse;
            }

            ctx.shadowColor = color;
            ctx.shadowBlur = glowIntensity;
            ctx.fillStyle = color;

            // Draw mine as small hexagon
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = mine.x + Math.cos(angle) * 6;
                const y = mine.y + Math.sin(angle) * 6;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fill();

            // Proximity radius indicator when armed
            if (mine.armed) {
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.2;
                ctx.beginPath();
                ctx.arc(mine.x, mine.y, mine.proximityRadius, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }
    }

    /**
     * Update point defense systems - destroyers intercept enemy missiles
     */
    updatePointDefense(ships) {
        // Find all ships with point defense capability
        const pdShips = ships.filter(s =>
            s.alive &&
            s.pdActive &&
            s.pointDefenseRange &&
            s.attemptIntercept
        );

        if (pdShips.length === 0) return;

        // Get all interceptable missiles
        for (const pdShip of pdShips) {
            // Skip if PD on cooldown
            if (pdShip.pointDefenseCooldown > 0) continue;

            // Get enemy missiles in range
            const missiles = this.projectileSystem.getInterceptableMissiles(
                pdShip.x,
                pdShip.y,
                pdShip.pointDefenseRange,
                pdShip.team
            );

            if (missiles.length === 0) continue;

            // Target closest missile
            let closestMissile = null;
            let closestDist = Infinity;

            for (const missile of missiles) {
                const dist = Math.hypot(missile.x - pdShip.x, missile.y - pdShip.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closestMissile = missile;
                }
            }

            if (closestMissile) {
                // Attempt intercept
                const intercepted = pdShip.attemptIntercept(closestMissile, this.particleSystem);

                if (intercepted) {
                    // Remove from our tracking if it was being tracked
                    for (const [projectile, data] of this.activeProjectiles) {
                        if (projectile === closestMissile) {
                            this.activeProjectiles.delete(projectile);
                            break;
                        }
                    }

                    // Play intercept sound
                    if (this.audioSystem) {
                        this.audioSystem.playBallisticFire(); // Use ballistic sound for PD
                    }
                } else {
                    // Miss effect - PD tracer
                    this.particleSystem.createMuzzleFlash(
                        pdShip.x,
                        pdShip.y,
                        Math.atan2(closestMissile.y - pdShip.y, closestMissile.x - pdShip.x),
                        '#ffcc00',
                        2
                    );
                }
            }
        }
    }

    /**
     * Find best target for a ship (with tactical priority)
     */
    findTarget(ship, allShips) {
        let bestTarget = null;
        let bestScore = -Infinity;

        for (const other of allShips) {
            if (!other.alive) continue;
            if (other.team === ship.team) continue;
            if (other.type === 'wreckage') continue;

            const dist = ship.distanceTo(other);

            // Calculate target priority score
            let score = 1000 - dist; // Closer is better

            // Apply ship type combat preferences
            const key = `${ship.type}_vs_${other.type}`;
            const multiplier = CombatBalance[key] || 1.0;
            score += (multiplier - 1.0) * 300; // Boost score based on advantage

            // Pursuit of routing ships
            if (other.isRouting) {
                score += 400;
            }

            // Low health targets (finish them off)
            if (other.health < other.maxHealth * 0.3) {
                score += 150;
            }

            // Penalize targets that are already heavily targeted
            // (distributes fire across enemies)

            if (score > bestScore) {
                bestScore = score;
                bestTarget = other;
            }
        }

        return bestTarget;
    }

    /**
     * Fire all ready hardpoints at target
     */
    fireAtTarget(ship, target) {
        // Get all ready hardpoints and fire them
        const firedHardpoints = ship.fire();
        if (firedHardpoints.length === 0) return;

        // Fire each hardpoint
        for (const hardpoint of firedHardpoints) {
            const worldPos = ship.getHardpointWorldPos(hardpoint);

            // Calculate damage with modifiers
            let damage = hardpoint.damage;
            damage = this.applyShipTypeBonus(ship, target, damage);
            damage = this.applyFlankingBonus(ship, target, damage);

            // Last stand bonus
            if (ship.isLastStand && ship.lastStandBonus) {
                damage *= (1 + ship.lastStandBonus);
            }

            // Low morale penalty on target
            if (target.morale !== undefined && target.morale < 50) {
                damage *= 1.2;
            }

            // Create muzzle flash
            this.particleSystem.createMuzzleFlash(
                worldPos.x,
                worldPos.y,
                ship.rotation,
                hardpoint.weaponType === 'laser' ? '#00ff44' :
                hardpoint.weaponType === 'missile' ? '#ff4444' : '#ffaa00',
                hardpoint.weaponType === 'missile' ? 6 : 3
            );

            // Calculate hit chance before creating projectile
            const hitChance = this.calculateHitChance(ship, target, hardpoint.weaponType);
            const willHit = this.rollToHit(hitChance);

            // Create projectile
            const projectile = this.projectileSystem.createProjectile(
                worldPos.x,
                worldPos.y,
                target.x,
                target.y,
                ship.team,
                hardpoint.weaponType
            );

            // Track projectile with hit/miss info
            this.activeProjectiles.set(projectile, {
                target,
                damage: Math.round(damage),
                sourceTeam: ship.team,
                sourceType: ship.type,
                weaponType: hardpoint.weaponType,
                willHit,
                hitChance
            });

            // Play sound
            if (this.audioSystem) {
                if (hardpoint.weaponType === 'laser') {
                    this.audioSystem.playLaserFire();
                } else if (hardpoint.weaponType === 'missile') {
                    // Missile sound on launch
                    this.audioSystem.playMissileLaunch();
                } else {
                    this.audioSystem.playBallisticFire();
                }
            }
        }
    }

    /**
     * Apply ship type combat bonuses
     */
    applyShipTypeBonus(attacker, defender, baseDamage) {
        const key = `${attacker.type}_vs_${defender.type}`;
        const multiplier = CombatBalance[key] || 1.0;
        return baseDamage * multiplier;
    }

    /**
     * Apply flanking bonus
     */
    applyFlankingBonus(attacker, defender, baseDamage) {
        // Extra damage to routing ships
        if (defender.isRouting) return baseDamage * 1.3;

        // Calculate attack angle
        const angleToDefender = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
        const defenderFacing = defender.rotation;

        let angleDiff = Math.abs(angleToDefender - defenderFacing);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // Rear attack bonus (within 45 degrees of rear)
        if (angleDiff < Math.PI / 4) {
            return baseDamage * 1.5;
        }

        // Flank attack bonus
        if (angleDiff > Math.PI / 3 && angleDiff < 2 * Math.PI / 3) {
            return baseDamage * 1.25;
        }

        return baseDamage;
    }

    /**
     * Update projectile tracking and apply damage on hit
     */
    updateProjectileTracking(ships) {
        const projectilesToRemove = [];

        for (const [projectile, data] of this.activeProjectiles) {
            if (projectile.hasReachedTarget()) {
                const { target, damage, weaponType, willHit } = data;

                // Check if projectile hits or misses
                if (willHit && target.alive) {
                    // HIT - Apply damage (shields absorb first)
                    const damageResult = target.takeDamage(damage);

                    // Create appropriate impact effect based on what was hit
                    if (damageResult && damageResult.shieldDamage > 0) {
                        // Shield hit effect - blue/cyan particles
                        this.createShieldHitEffect(target, weaponType);
                    }

                    if (!damageResult || damageResult.hullDamage > 0) {
                        // Hull hit effect - standard impact
                        const impactSize = weaponType === 'missile' ? 15 :
                                           weaponType === 'laser' ? 8 : 6;
                        this.particleSystem.createImpact(
                            target.x,
                            target.y,
                            target.color,
                            impactSize
                        );
                    }

                    // Missile explosion effects
                    if (weaponType === 'missile') {
                        // Screen shake only for large ship missile hits
                        if (this.screenEffects && this.isLargeShip(target.type)) {
                            this.screenEffects.shake(0.6);
                        }
                        if (this.audioSystem) {
                            this.audioSystem.playImpact(0, 'missile');
                        }
                    }

                    // If target destroyed, create explosion and wreckage
                    if (!target.alive) {
                        this.particleSystem.createDeathExplosion(
                            target.x,
                            target.y,
                            target.color
                        );

                        // Screen shake only for large ship destruction
                        if (this.screenEffects && this.isLargeShip(target.type)) {
                            this.screenEffects.shake(1.0);
                        }

                        // Spawn wreckage
                        this.spawnWreckage(target);

                        // Death sound
                        if (this.audioSystem) {
                            this.audioSystem.playShipDestroyed();
                        }
                    }
                } else if (target.alive) {
                    // MISS - Create miss effect near target
                    // Projectile flew past - small particle burst at target location offset
                    const missOffsetX = (Math.random() - 0.5) * target.size * 2;
                    const missOffsetY = (Math.random() - 0.5) * target.size * 2;
                    const missX = target.x + missOffsetX;
                    const missY = target.y + missOffsetY;

                    // Smaller miss effect
                    const missSize = weaponType === 'missile' ? 8 :
                                    weaponType === 'laser' ? 4 : 3;
                    this.particleSystem.createImpact(
                        missX,
                        missY,
                        '#444466', // Dimmer color for miss
                        missSize
                    );

                    // No screen shake for missile misses (removed)
                }

                projectilesToRemove.push(projectile);
            }
        }

        // Remove completed projectiles
        for (const projectile of projectilesToRemove) {
            this.activeProjectiles.delete(projectile);
        }
    }

    /**
     * Create visual effect for shield hit
     */
    createShieldHitEffect(target, weaponType) {
        // Create shield-colored particles at random position on shield bubble
        const angle = Math.random() * Math.PI * 2;
        const radius = target.size * 1.3;
        const hitX = target.x + Math.cos(angle) * radius;
        const hitY = target.y + Math.sin(angle) * radius;

        // Shield hit particles - cyan/blue
        const particleCount = weaponType === 'missile' ? 12 : 6;
        for (let i = 0; i < particleCount; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * Math.PI * 0.5;
            const speed = 50 + Math.random() * 80;
            const vx = Math.cos(spreadAngle) * speed;
            const vy = Math.sin(spreadAngle) * speed;

            this.particleSystem.createParticle(
                hitX, hitY, vx, vy,
                '#66bbff',
                2 + Math.random() * 2,
                0.3 + Math.random() * 0.2
            );
        }

        // Bright flash at impact point
        this.particleSystem.createParticle(
            hitX, hitY, 0, 0,
            '#aaddff',
            weaponType === 'missile' ? 8 : 5,
            0.15
        );
    }

    /**
     * Spawn wreckage from destroyed ship
     */
    spawnWreckage(ship) {
        const wreckage = new Wreckage(
            ship.x,
            ship.y,
            ship.size,
            ship.color,
            { x: ship.vx, y: ship.vy },
            ship.type
        );

        if (this.onWreckageSpawn) {
            this.onWreckageSpawn(wreckage);
        }
    }

    /**
     * Check if battle is over
     */
    checkVictory(ships) {
        let friendlyCount = 0;
        let enemyCount = 0;

        for (const ship of ships) {
            if (!ship.alive) continue;
            if (ship.type === 'wreckage') continue;

            if (ship.team === 'friendly') {
                friendlyCount++;
            } else if (ship.team === 'enemy') {
                enemyCount++;
            }
        }

        if (friendlyCount === 0 && enemyCount > 0) {
            return 'enemy';
        } else if (enemyCount === 0 && friendlyCount > 0) {
            return 'friendly';
        }

        return null;
    }

    /**
     * Get combat statistics
     */
    getStats(ships) {
        let friendlyAlive = 0;
        let friendlyDead = 0;
        let enemyAlive = 0;
        let enemyDead = 0;

        for (const ship of ships) {
            if (ship.type === 'wreckage') continue;

            if (ship.team === 'friendly') {
                if (ship.alive) friendlyAlive++;
                else friendlyDead++;
            } else if (ship.team === 'enemy') {
                if (ship.alive) enemyAlive++;
                else enemyDead++;
            }
        }

        return {
            friendly: { alive: friendlyAlive, dead: friendlyDead },
            enemy: { alive: enemyAlive, dead: enemyDead },
            projectiles: this.projectileSystem.getCount(),
            particles: this.particleSystem.getCount()
        };
    }

    /**
     * Clear combat state
     */
    clear() {
        this.activeProjectiles.clear();
        this.activeMines = [];
        this.activeSpinalBeams = [];
    }
}

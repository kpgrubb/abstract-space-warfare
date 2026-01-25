/**
 * battleInit.js - Fleet spawning and deployment
 * Handles creating ships based on battle configuration
 * Creates asymmetric, varied deployments for more tension
 */

import { Fighter } from '../entities/Fighter.js';
import { Frigate } from '../entities/Frigate.js';
import { Corvette } from '../entities/Corvette.js';
import { Destroyer } from '../entities/Destroyer.js';
import { Cruiser } from '../entities/Cruiser.js';
import { Carrier } from '../entities/Carrier.js';
import { Battleship } from '../entities/Battleship.js';
import { Dreadnought } from '../entities/Dreadnought.js';
import { Gunship } from '../entities/Gunship.js';
import { Interceptor } from '../entities/Interceptor.js';
import { Minelayer } from '../entities/Minelayer.js';
import { RepairTender } from '../entities/RepairTender.js';

/**
 * Initialize a battle with the given configuration
 */
export function initializeBattle(config, renderer, engine) {
    try {
        // Clear existing entities
        engine.entities = [];

        const { width, height } = renderer.getDimensions();
        const margin = 60;

        console.log(`Canvas dimensions: ${width}x${height}`);

    console.log(`Initializing space battle:`);
    console.log(`Friendly: ${config.friendlyFighters}F / ${config.friendlyFrigates}Fr / ${config.friendlyCorvettes || 0}Co / ${config.friendlyDestroyers || 0}D / ${config.friendlyCruisers}C / ${config.friendlyCarriers}Ca / ${config.friendlyBattleships}B / ${config.friendlyDreadnoughts || 0}DN / ${config.friendlyGunships || 0}G / ${config.friendlyInterceptors || 0}I / ${config.friendlyMinelayers || 0}ML / ${config.friendlyRepairTenders || 0}RT`);
    console.log(`Enemy: ${config.enemyFighters}F / ${config.enemyFrigates}Fr / ${config.enemyCorvettes || 0}Co / ${config.enemyDestroyers || 0}D / ${config.enemyCruisers}C / ${config.enemyCarriers}Ca / ${config.enemyBattleships}B / ${config.enemyDreadnoughts || 0}DN / ${config.enemyGunships || 0}G / ${config.enemyInterceptors || 0}I / ${config.enemyMinelayers || 0}ML / ${config.enemyRepairTenders || 0}RT`);

    // Randomize deployment zones for each side (creates asymmetry)
    const friendlyZone = randomizeDeploymentZone('friendly', width, height, margin);
    const enemyZone = randomizeDeploymentZone('enemy', width, height, margin);

    // Spawn friendly fleet
    spawnFleet({
        fighters: config.friendlyFighters,
        frigates: config.friendlyFrigates,
        corvettes: config.friendlyCorvettes || 0,
        destroyers: config.friendlyDestroyers || 0,
        cruisers: config.friendlyCruisers,
        carriers: config.friendlyCarriers,
        battleships: config.friendlyBattleships,
        dreadnoughts: config.friendlyDreadnoughts || 0,
        gunships: config.friendlyGunships || 0,
        interceptors: config.friendlyInterceptors || 0,
        minelayers: config.friendlyMinelayers || 0,
        repairTenders: config.friendlyRepairTenders || 0
    }, 'friendly', friendlyZone, engine);

    // Spawn enemy fleet
    spawnFleet({
        fighters: config.enemyFighters,
        frigates: config.enemyFrigates,
        corvettes: config.enemyCorvettes || 0,
        destroyers: config.enemyDestroyers || 0,
        cruisers: config.enemyCruisers,
        carriers: config.enemyCarriers,
        battleships: config.enemyBattleships,
        dreadnoughts: config.enemyDreadnoughts || 0,
        gunships: config.enemyGunships || 0,
        interceptors: config.enemyInterceptors || 0,
        minelayers: config.enemyMinelayers || 0,
        repairTenders: config.enemyRepairTenders || 0
    }, 'enemy', enemyZone, engine);

    console.log(`Fleet spawned: ${engine.entities.length} ships`);
    } catch (err) {
        console.error('Failed to initialize battle:', err);
    }
}

/**
 * Create a randomized deployment zone for a team
 * This creates more interesting, asymmetric deployments
 * Wider spread to prevent instant blobbing
 */
function randomizeDeploymentZone(team, canvasWidth, canvasHeight, margin) {
    const isFriendly = team === 'friendly';

    // Base position - wider zones (left 35% for friendly, right 35% for enemy)
    // This gives more space between fleets initially
    const baseXMin = isFriendly ? margin : canvasWidth * 0.60;
    const baseXMax = isFriendly ? canvasWidth * 0.40 : canvasWidth - margin;

    // Use more of the vertical space (70-95% of height)
    const zoneHeight = canvasHeight * (0.7 + Math.random() * 0.25);
    const zoneYStart = margin + Math.random() * (canvasHeight - 2 * margin - zoneHeight);

    // Add some horizontal offset variation
    const xOffset = (Math.random() - 0.5) * canvasWidth * 0.08;

    return {
        xMin: Math.max(margin, baseXMin + xOffset),
        xMax: Math.min(canvasWidth - margin, baseXMax + xOffset),
        yMin: zoneYStart,
        yMax: zoneYStart + zoneHeight,
        // Favor spread formation more often to reduce blobbing
        formation: Math.random() < 0.3 ? 'clustered' : 'spread'
    };
}

/**
 * Spawn a fleet of ships with varied positioning
 */
function spawnFleet(counts, team, zone, engine) {
    const ships = [];

    // Create ship instances with deployment priority
    // Lower priority = further back (capital ships protected)
    for (let i = 0; i < counts.fighters; i++) {
        ships.push({ Class: Fighter, priority: 4 + Math.random() * 2 }); // Fighters forward, some variance
    }
    for (let i = 0; i < counts.gunships; i++) {
        ships.push({ Class: Gunship, priority: 3.5 + Math.random() * 1.5 }); // Gunships with fighters
    }
    for (let i = 0; i < counts.interceptors; i++) {
        ships.push({ Class: Interceptor, priority: 5 + Math.random() * 1 }); // Interceptors furthest forward
    }
    for (let i = 0; i < counts.frigates; i++) {
        ships.push({ Class: Frigate, priority: 3 + Math.random() * 1.5 });
    }
    for (let i = 0; i < counts.corvettes; i++) {
        // EW Corvettes stay near capitals to provide jamming support
        ships.push({ Class: Corvette, priority: 1.5 + Math.random() * 1 });
    }
    for (let i = 0; i < counts.destroyers; i++) {
        // Destroyers screen the fleet - between frigates and cruisers
        ships.push({ Class: Destroyer, priority: 2.5 + Math.random() * 1 });
    }
    for (let i = 0; i < counts.cruisers; i++) {
        ships.push({ Class: Cruiser, priority: 2 + Math.random() * 1 });
    }
    for (let i = 0; i < counts.carriers; i++) {
        ships.push({ Class: Carrier, priority: 0.5 + Math.random() * 0.5 }); // Carriers way back
    }
    for (let i = 0; i < counts.battleships; i++) {
        ships.push({ Class: Battleship, priority: 1 + Math.random() * 1 });
    }
    for (let i = 0; i < counts.dreadnoughts; i++) {
        ships.push({ Class: Dreadnought, priority: 0.8 + Math.random() * 0.5 }); // Dreadnoughts near back
    }
    for (let i = 0; i < counts.minelayers; i++) {
        ships.push({ Class: Minelayer, priority: 2 + Math.random() * 1 }); // Mid-fleet
    }
    for (let i = 0; i < counts.repairTenders; i++) {
        ships.push({ Class: RepairTender, priority: 0.3 + Math.random() * 0.4 }); // Very back, protected
    }

    // Sort by priority (higher = closer to enemy)
    ships.sort((a, b) => b.priority - a.priority);

    const totalShips = ships.length;
    if (totalShips === 0) return;

    const xRange = zone.xMax - zone.xMin;
    const yRange = zone.yMax - zone.yMin;
    const isFriendly = team === 'friendly';

    // Different deployment patterns
    if (zone.formation === 'clustered') {
        // Clustered formation - ships group together more
        deployClusteredFormation(ships, zone, team, engine);
    } else {
        // Spread formation - ships more dispersed
        deploySpreadFormation(ships, zone, team, engine);
    }
}

/**
 * Deploy ships in clustered groups
 */
function deployClusteredFormation(ships, zone, team, engine) {
    const totalShips = ships.length;
    const isFriendly = team === 'friendly';
    const xRange = zone.xMax - zone.xMin;
    const yRange = zone.yMax - zone.yMin;

    // Create 2-4 cluster centers
    const numClusters = Math.min(Math.max(2, Math.ceil(totalShips / 5)), 4);
    const clusters = [];

    for (let i = 0; i < numClusters; i++) {
        clusters.push({
            x: zone.xMin + xRange * (0.3 + Math.random() * 0.4),
            y: zone.yMin + yRange * ((i + 0.5) / numClusters) + (Math.random() - 0.5) * yRange * 0.2,
            ships: []
        });
    }

    // Assign ships to clusters (by type - capital ships in back clusters)
    ships.forEach((shipData, index) => {
        // Higher priority ships go to front clusters
        const clusterIndex = Math.floor((1 - shipData.priority / 6) * (numClusters - 0.1));
        const cluster = clusters[Math.min(clusterIndex, numClusters - 1)];
        cluster.ships.push(shipData);
    });

    // Spawn ships in clusters (wider spread)
    clusters.forEach(cluster => {
        const clusterSize = cluster.ships.length;
        cluster.ships.forEach((shipData, i) => {
            // Position within cluster with more spread to reduce blobbing
            const angle = (i / clusterSize) * Math.PI * 2 + Math.random() * 0.8;
            const radius = 50 + Math.random() * 70 + i * 12;

            let x = cluster.x + Math.cos(angle) * radius;
            let y = cluster.y + Math.sin(angle) * radius;

            // Adjust X based on priority (higher priority = closer to enemy)
            const priorityOffset = (shipData.priority / 6) * xRange * 0.3;
            if (isFriendly) {
                x += priorityOffset;
            } else {
                x -= priorityOffset;
            }

            // Clamp to zone bounds
            x = Math.max(zone.xMin, Math.min(zone.xMax, x));
            y = Math.max(zone.yMin, Math.min(zone.yMax, y));

            try {
                const ship = new shipData.Class(x, y, team);

                // Give ships a slight initial angle variation
                ship.rotation += (Math.random() - 0.5) * 0.3;

                engine.addEntity(ship);
            } catch (err) {
                console.error(`Failed to create ship of type ${shipData.Class?.name || 'unknown'}:`, err);
            }
        });
    });
}

/**
 * Deploy ships in spread formation
 */
function deploySpreadFormation(ships, zone, team, engine) {
    const totalShips = ships.length;
    const isFriendly = team === 'friendly';
    const xRange = zone.xMax - zone.xMin;
    const yRange = zone.yMax - zone.yMin;

    // Calculate grid dimensions
    const cols = Math.ceil(Math.sqrt(totalShips * 1.5));
    const rows = Math.ceil(totalShips / cols);

    ships.forEach((shipData, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;

        // Base grid position
        let x, y;

        // X position based on priority (high priority = closer to center/enemy)
        const xProgress = shipData.priority / 6; // 0-1 based on priority
        if (isFriendly) {
            x = zone.xMin + xRange * (0.2 + xProgress * 0.6);
        } else {
            x = zone.xMax - xRange * (0.2 + xProgress * 0.6);
        }

        // Y position spread across zone
        y = zone.yMin + yRange * ((col + 0.5) / cols);

        // Add significant randomness for organic feel (increased spread)
        x += (Math.random() - 0.5) * 100;
        y += (Math.random() - 0.5) * 80;

        // Clamp to zone
        x = Math.max(zone.xMin, Math.min(zone.xMax, x));
        y = Math.max(zone.yMin, Math.min(zone.yMax, y));

        try {
            const ship = new shipData.Class(x, y, team);

            // Random initial rotation variance
            ship.rotation += (Math.random() - 0.5) * 0.4;

            engine.addEntity(ship);
        } catch (err) {
            console.error(`Failed to create ship of type ${shipData.Class?.name || 'unknown'}:`, err);
        }
    });
}

/**
 * main.js - Application entry point
 * Bootstraps the ABSTRACT SPACE WARFARE application
 */

import { Engine } from './core/Engine.js';
import { Renderer } from './systems/Renderer.js';
import { ProjectileSystem } from './visual/Projectiles.js';
import { ParticleSystem } from './visual/Particles.js';
import { CombatSystem } from './systems/Combat.js';
import { AISystem } from './systems/AI.js';
import { VictorySystem } from './systems/VictorySystem.js';
import { ReinforcementSystem } from './systems/ReinforcementSystem.js';
import { FleetCoordinator } from './systems/FleetCoordinator.js';
import { SetupUI } from './ui/SetupUI.js';
import { initializeBattle } from './utils/battleInit.js';
import { ScreenEffects } from './visual/ScreenEffects.js';
import { ScorchMarkSystem } from './visual/ScorchMarks.js';
import { AudioSystem } from './audio/AudioSystem.js';
import { AtmosphereSystem } from './visual/AtmosphereSystem.js';
import { RadioChatter } from './visual/RadioChatter.js';

// Application state
let engine = null;
let renderer = null;
let projectileSystem = null;
let particleSystem = null;
let aiSystem = null;
let combatSystem = null;
let victorySystem = null;
let setupUI = null;
let currentConfig = null; // Store current battle config for reset

// Visual/Audio effects
let screenEffects = null;
let scorchMarkSystem = null;
let audioSystem = null;
let atmosphereSystem = null;
let reinforcementSystem = null;
let fleetCoordinator = null;
let radioChatter = null;

// Wreckage entities
let wreckageEntities = [];

/**
 * Initialize the application
 */
function init() {
    console.log('=== ABSTRACT SPACE WARFARE ===');
    console.log('Fleet Combat Simulator');
    console.log('Initializing...\n');

    try {
        // Create renderer
        renderer = new Renderer('battleCanvas');

        // Create engine
        engine = new Engine(renderer);

        // Initialize engine
        engine.init();

        // Connect renderer resize to camera
        renderer.onResize = (width, height) => {
            if (engine && engine.camera) {
                engine.camera.resize(width, height);
            }
        };

        // Create visual/audio effects
        screenEffects = new ScreenEffects();
        scorchMarkSystem = new ScorchMarkSystem();
        audioSystem = new AudioSystem();
        atmosphereSystem = new AtmosphereSystem();

        // Create game systems
        projectileSystem = new ProjectileSystem();
        particleSystem = new ParticleSystem();
        aiSystem = new AISystem();
        victorySystem = new VictorySystem();
        combatSystem = new CombatSystem(projectileSystem, particleSystem, aiSystem);

        // Connect effects to combat system
        combatSystem.screenEffects = screenEffects;
        combatSystem.scorchMarkSystem = scorchMarkSystem;
        combatSystem.audioSystem = audioSystem;

        // Create reinforcement system (after engine and particleSystem are ready)
        reinforcementSystem = new ReinforcementSystem(engine, particleSystem);

        // Create fleet coordinator for team-wide strategy
        fleetCoordinator = new FleetCoordinator();

        // Create radio chatter system
        radioChatter = new RadioChatter();

        // Set up wreckage spawning callback
        combatSystem.onWreckageSpawn = (wreckage) => {
            wreckageEntities.push(wreckage);
        };

        // Set up ship spawning callback (for carrier deployments)
        combatSystem.onShipSpawn = (ship) => {
            engine.addEntity(ship);
        };

        // Set victory callback for auto-reset
        victorySystem.setVictoryCallback((stats) => {
            handleVictory(stats);
        });

        // Add systems to engine (order matters for rendering)
        engine.addSystem(screenEffects);       // Update first
        engine.addSystem(atmosphereSystem);    // Space background
        engine.addSystem(scorchMarkSystem);    // Render first (ground layer)
        engine.addSystem(fleetCoordinator);    // Fleet strategy before AI
        engine.addSystem(aiSystem);
        engine.addSystem(reinforcementSystem); // Reinforcements before combat
        engine.addSystem(combatSystem);
        engine.addSystem(victorySystem);
        engine.addSystem(projectileSystem);
        engine.addSystem(particleSystem);
        engine.addSystem(radioChatter);    // Radio chatter on top

        // Add custom render hook for wreckage, mines, and spinal beams
        engine.addCustomRender(() => {
            renderWreckage(renderer);
            // Render mines and spinal beams
            const ctx = renderer.getContext();
            if (combatSystem) {
                combatSystem.renderMines(ctx);
                combatSystem.renderSpinalBeams(ctx);
            }
        });

        // Create setup UI
        setupUI = new SetupUI((config) => {
            // Initialize audio on first user interaction
            if (!audioSystem.initialized) {
                audioSystem.init();
            }
            startBattle(config);
        });
        setupUI.create();

        // Start the game loop (but no ships yet)
        engine.start();

        console.log('\nApplication started successfully');
        console.log('Configure your fleet or hit Launch Random Fleet!');
    } catch (error) {
        console.error('Failed to initialize application:', error);
    }
}

/**
 * Start a battle with the given configuration
 */
function startBattle(config) {
    console.log('\n=== LAUNCHING FLEET BATTLE ===');

    // Store config for reset
    currentConfig = config.clone();

    // Clear wreckage from previous battle
    wreckageEntities = [];

    // Clear visual effects from previous battle
    if (scorchMarkSystem) {
        scorchMarkSystem.clear();
    }
    if (radioChatter) {
        radioChatter.clear();
    }
    if (combatSystem) {
        combatSystem.clear();
    }
    if (projectileSystem) {
        projectileSystem.clear();
    }
    if (particleSystem) {
        particleSystem.clear();
    }

    // Set random space atmosphere for variety
    if (atmosphereSystem) {
        atmosphereSystem.setRandomAtmosphere();
    }

    // Reset camera to default view
    if (engine && engine.camera) {
        engine.camera.reset();
    }

    // Initialize battle from configuration
    initializeBattle(config, renderer, engine);

    // Start victory tracking
    const friendlyCount = config.getTotalUnits('friendly');
    const enemyCount = config.getTotalUnits('enemy');
    victorySystem.startBattle(friendlyCount, enemyCount);

    // Start reinforcement system
    if (reinforcementSystem) {
        reinforcementSystem.startBattle(friendlyCount, enemyCount);
    }

    // Start fleet coordinator
    if (fleetCoordinator) {
        fleetCoordinator.startBattle(engine.entities);
    }

    console.log('Battle started! Watch for:');
    console.log('- 12 ship types: Fighters, Gunships, Interceptors, Frigates, Destroyers, Corvettes, Cruisers, Carriers, Battleships, Dreadnoughts, Minelayers, Repair Tenders');
    console.log('- Multi-hardpoint weapons: Ballistic, Laser, Missile, Flak');
    console.log('- Tactical AI: formations, morale, flanking');
    console.log('- Ship personalities: aggression, discipline, target focus');
    console.log('- Heroic last stands, rallying, fighter pursuit');
    console.log('- MID-BATTLE REINFORCEMENTS warping in from screen edges!');
    console.log('- CARRIER FIGHTER DEPLOYMENT during battle!');
    console.log('- DREADNOUGHT SPINAL BEAMS dealing devastating damage!');
    console.log('- REPAIR TENDERS healing damaged ships!');
    console.log('- MINELAYERS deploying proximity mines!');
    console.log('- Persistent wreckage floating in zero-G');
    if (atmosphereSystem) {
        console.log(`- Space atmosphere: ${atmosphereSystem.getDescription()}`);
    }
}

/**
 * Update and render wreckage entities
 */
function updateWreckage(deltaTime) {
    for (const wreckage of wreckageEntities) {
        wreckage.update(deltaTime);
    }

    // Remove dead wreckage
    wreckageEntities = wreckageEntities.filter(w => w.alive);
}

function renderWreckage(renderer) {
    for (const wreckage of wreckageEntities) {
        wreckage.render(renderer);
    }
}

// Add wreckage update to engine loop
const originalUpdate = Engine.prototype.update;
Engine.prototype.update = function(deltaTime) {
    originalUpdate.call(this, deltaTime);
    updateWreckage(deltaTime);
};

/**
 * Handle victory and auto-reset
 */
function handleVictory(stats) {
    console.log('\n=== AUTO-RESET ===');
    console.log('Starting new battle with same configuration...');

    // Small delay for visual transition
    setTimeout(() => {
        // Reset battle with same config
        if (currentConfig) {
            startBattle(currentConfig);
        }
    }, 500);
}

/**
 * Handle window load event
 */
window.addEventListener('load', init);

/**
 * Handle ESC key to return to setup menu
 */
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        returnToSetup();
    }
});

/**
 * Return to setup menu (called by ESC key)
 */
function returnToSetup() {
    // Stop current battle systems
    if (victorySystem) {
        victorySystem.stop();
    }
    if (reinforcementSystem) {
        reinforcementSystem.stop();
    }
    if (fleetCoordinator) {
        fleetCoordinator.clear();
    }

    // Clear entities
    if (engine) {
        engine.entities = [];
    }

    // Clear wreckage
    wreckageEntities = [];

    // Clear visual effects
    if (scorchMarkSystem) {
        scorchMarkSystem.clear();
    }
    if (particleSystem) {
        particleSystem.clear();
    }
    if (projectileSystem) {
        projectileSystem.clear();
    }
    if (combatSystem) {
        combatSystem.clear();
    }
    if (radioChatter) {
        radioChatter.clear();
    }

    // Show setup UI
    if (setupUI) {
        setupUI.show();
    }
}

/**
 * Handle window unload (cleanup)
 */
window.addEventListener('beforeunload', () => {
    if (engine) {
        engine.stop();
    }
});

// Export for debugging
window.ABSTRACT_SPACE_WARFARE = {
    engine,
    renderer,
    setupUI,
    victorySystem,
    getDebugInfo: () => ({
        fps: engine?.getFPS(),
        entityCount: engine?.entities.length,
        wreckageCount: wreckageEntities.length,
        systemCount: engine?.systems.length,
        battleStats: victorySystem?.getStats()
    }),
    restartSetup: () => {
        if (setupUI) {
            setupUI.show();
        }
    }
};

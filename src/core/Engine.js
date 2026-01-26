/**
 * Engine.js - Core game loop and state management
 * Handles initialization, update, render cycle using requestAnimationFrame
 */

import { Camera } from './Camera.js';

export class Engine {
    constructor(renderer) {
        this.renderer = renderer;
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Game entities and systems
        this.entities = [];
        this.systems = [];
        this.customRenders = [];
        this.overlayRenders = []; // Screen-space UI renders (not affected by camera)

        // Camera for zoom/pan
        this.camera = new Camera();

        // Bind the game loop to maintain context
        this.gameLoop = this.gameLoop.bind(this);
    }

    /**
     * Initialize the engine and all systems
     */
    init() {
        console.log('Engine initializing...');

        // Initialize renderer
        this.renderer.init();

        // Initialize camera
        const canvas = document.getElementById('battleCanvas');
        if (canvas) {
            this.camera.init(canvas);
        }

        console.log('Engine initialized successfully');
    }

    /**
     * Start the game loop
     */
    start() {
        if (this.isRunning) return;

        console.log('Engine starting...');
        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        console.log('Engine stopped');
    }

    /**
     * Main game loop - called every frame
     */
    gameLoop(currentTime) {
        if (!this.isRunning) return;

        // Calculate delta time in seconds
        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        // Update FPS counter
        this.updateFPS(currentTime);

        // Update game state
        this.update(deltaTime);

        // Render frame
        this.render();

        // Schedule next frame
        requestAnimationFrame(this.gameLoop);
    }

    /**
     * Update game state
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Cap delta time to prevent huge jumps
        const dt = Math.min(deltaTime, 0.1);

        // Update camera
        this.camera.update(dt);

        // Update all entities first
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(dt, this.entities);
            }
        }

        // Update all systems (passing entities if needed)
        for (const system of this.systems) {
            if (system.update) {
                // Combat, AI, Victory, Reinforcement, FleetCoordinator, and RadioChatter systems need access to entities
                if (system.constructor.name === 'CombatSystem' ||
                    system.constructor.name === 'AISystem' ||
                    system.constructor.name === 'VictorySystem' ||
                    system.constructor.name === 'ReinforcementSystem' ||
                    system.constructor.name === 'FleetCoordinator' ||
                    system.constructor.name === 'RadioChatter') {
                    system.update(dt, this.entities);
                } else {
                    system.update(dt);
                }
            }
        }

        // Clean up dead entities
        this.entities = this.entities.filter(entity => entity.alive);
    }

    /**
     * Render the current frame
     */
    render() {
        const ctx = this.renderer.getContext();

        // Clear canvas
        this.renderer.clear();

        // Apply camera transform and screen shake
        ctx.save();

        // Apply camera zoom/pan
        this.camera.applyTransform(ctx);

        // Apply screen shake on top of camera
        const screenEffects = this.systems.find(s => s.constructor.name === 'ScreenEffects');
        if (screenEffects) {
            screenEffects.applyShake(ctx);
        }

        // Render all entities
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.renderer);
            }
        }

        // Render systems (UI, particles, etc.) - but not ScreenEffects yet
        for (const system of this.systems) {
            if (system.render && system.constructor.name !== 'ScreenEffects') {
                system.render(this.renderer);
            }
        }

        // Render custom renders (e.g., wreckage)
        for (const customRender of this.customRenders) {
            customRender();
        }

        // Restore canvas (remove shake)
        ctx.restore();

        // Render ScreenEffects last (post-processing)
        if (screenEffects && screenEffects.render) {
            screenEffects.render(this.renderer);
        }

        // Render overlay UI (in screen space, not affected by camera)
        for (const overlayRender of this.overlayRenders) {
            overlayRender();
        }
    }

    /**
     * Update FPS counter
     */
    updateFPS(currentTime) {
        this.frameCount++;

        // Update FPS display every second
        if (currentTime - this.fpsUpdateTime >= 1000) {
            this.fps = Math.round(this.frameCount * 1000 / (currentTime - this.fpsUpdateTime));
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;

            // Update FPS display in DOM
            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                const zoomPercent = Math.round(this.camera.zoom * 100);
                fpsElement.textContent = `FPS: ${this.fps} | Zoom: ${zoomPercent}%`;
            }
        }
    }

    /**
     * Add an entity to the game
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * Remove an entity from the game
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Add a system to the game
     */
    addSystem(system) {
        this.systems.push(system);
    }

    /**
     * Add a custom render callback
     */
    addCustomRender(callback) {
        this.customRenders.push(callback);
    }

    /**
     * Add an overlay render callback (screen-space UI)
     */
    addOverlayRender(callback) {
        this.overlayRenders.push(callback);
    }

    /**
     * Get current FPS
     */
    getFPS() {
        return this.fps;
    }
}

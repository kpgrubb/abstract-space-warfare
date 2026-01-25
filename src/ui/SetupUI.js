/**
 * SetupUI.js - Fleet configuration interface
 * UI for customizing fleet composition for space battles
 */

import { BattleConfig, GameConfig } from '../data/config.js';
import { SurpriseMe } from './SurpriseMe.js';

export class SetupUI {
    constructor(onStart) {
        this.onStart = onStart; // Callback when battle starts
        this.config = new BattleConfig();
        this.container = null;
        this.isVisible = true;
    }

    /**
     * Create and show the setup UI
     */
    create() {
        // Create container
        this.container = document.createElement('div');
        this.container.id = 'setup-container';
        this.container.innerHTML = this.getHTML();
        document.body.appendChild(this.container);

        // Attach event listeners
        this.attachListeners();

        // Update display
        this.updateDisplay();
    }

    /**
     * Get HTML for setup UI
     */
    getHTML() {
        return `
            <div class="setup-panel">
                <div class="setup-header">
                    <h1>ABSTRACT SPACE WARFARE</h1>
                    <p class="tagline">Fleet Combat Simulator</p>
                </div>

                <div class="setup-content">
                    <!-- Quick Start -->
                    <div class="setup-section">
                        <h2>Quick Start</h2>
                        <button id="btn-surprise" class="btn-large btn-primary">
                            &#9889; Launch Random Fleet
                        </button>
                        <p class="hint">Generate a random balanced space battle</p>
                    </div>

                    <div class="setup-divider">OR</div>

                    <!-- Custom Setup -->
                    <div class="setup-section">
                        <h2>Custom Fleet</h2>

                        <!-- Friendly Fleet -->
                        <div class="army-config">
                            <h3>Friendly Fleet (Blue)</h3>
                            <div class="unit-slider">
                                <label>Fighters: <span id="friendly-fighters-value">${this.config.friendlyFighters}</span></label>
                                <input type="range" id="friendly-fighters"
                                    min="${GameConfig.FIGHTERS_MIN}"
                                    max="${GameConfig.FIGHTERS_MAX}"
                                    value="${this.config.friendlyFighters}">
                            </div>
                            <div class="unit-slider">
                                <label>Frigates: <span id="friendly-frigates-value">${this.config.friendlyFrigates}</span></label>
                                <input type="range" id="friendly-frigates"
                                    min="${GameConfig.FRIGATES_MIN}"
                                    max="${GameConfig.FRIGATES_MAX}"
                                    value="${this.config.friendlyFrigates}">
                            </div>
                            <div class="unit-slider">
                                <label>Corvettes (EW): <span id="friendly-corvettes-value">${this.config.friendlyCorvettes}</span></label>
                                <input type="range" id="friendly-corvettes"
                                    min="${GameConfig.CORVETTES_MIN}"
                                    max="${GameConfig.CORVETTES_MAX}"
                                    value="${this.config.friendlyCorvettes}">
                            </div>
                            <div class="unit-slider">
                                <label>Destroyers (PD): <span id="friendly-destroyers-value">${this.config.friendlyDestroyers}</span></label>
                                <input type="range" id="friendly-destroyers"
                                    min="${GameConfig.DESTROYERS_MIN}"
                                    max="${GameConfig.DESTROYERS_MAX}"
                                    value="${this.config.friendlyDestroyers}">
                            </div>
                            <div class="unit-slider">
                                <label>Cruisers: <span id="friendly-cruisers-value">${this.config.friendlyCruisers}</span></label>
                                <input type="range" id="friendly-cruisers"
                                    min="${GameConfig.CRUISERS_MIN}"
                                    max="${GameConfig.CRUISERS_MAX}"
                                    value="${this.config.friendlyCruisers}">
                            </div>
                            <div class="unit-slider">
                                <label>Carriers: <span id="friendly-carriers-value">${this.config.friendlyCarriers}</span></label>
                                <input type="range" id="friendly-carriers"
                                    min="${GameConfig.CARRIERS_MIN}"
                                    max="${GameConfig.CARRIERS_MAX}"
                                    value="${this.config.friendlyCarriers}">
                            </div>
                            <div class="unit-slider">
                                <label>Battleships: <span id="friendly-battleships-value">${this.config.friendlyBattleships}</span></label>
                                <input type="range" id="friendly-battleships"
                                    min="${GameConfig.BATTLESHIPS_MIN}"
                                    max="${GameConfig.BATTLESHIPS_MAX}"
                                    value="${this.config.friendlyBattleships}">
                            </div>
                            <div class="unit-slider">
                                <label>Dreadnoughts: <span id="friendly-dreadnoughts-value">${this.config.friendlyDreadnoughts}</span></label>
                                <input type="range" id="friendly-dreadnoughts"
                                    min="${GameConfig.DREADNOUGHTS_MIN}"
                                    max="${GameConfig.DREADNOUGHTS_MAX}"
                                    value="${this.config.friendlyDreadnoughts}">
                            </div>
                            <div class="unit-slider">
                                <label>Gunships: <span id="friendly-gunships-value">${this.config.friendlyGunships}</span></label>
                                <input type="range" id="friendly-gunships"
                                    min="${GameConfig.GUNSHIPS_MIN}"
                                    max="${GameConfig.GUNSHIPS_MAX}"
                                    value="${this.config.friendlyGunships}">
                            </div>
                            <div class="unit-slider">
                                <label>Interceptors: <span id="friendly-interceptors-value">${this.config.friendlyInterceptors}</span></label>
                                <input type="range" id="friendly-interceptors"
                                    min="${GameConfig.INTERCEPTORS_MIN}"
                                    max="${GameConfig.INTERCEPTORS_MAX}"
                                    value="${this.config.friendlyInterceptors}">
                            </div>
                            <div class="unit-slider">
                                <label>Minelayers: <span id="friendly-minelayers-value">${this.config.friendlyMinelayers}</span></label>
                                <input type="range" id="friendly-minelayers"
                                    min="${GameConfig.MINELAYERS_MIN}"
                                    max="${GameConfig.MINELAYERS_MAX}"
                                    value="${this.config.friendlyMinelayers}">
                            </div>
                            <div class="unit-slider">
                                <label>Repair Tenders: <span id="friendly-repair-tenders-value">${this.config.friendlyRepairTenders}</span></label>
                                <input type="range" id="friendly-repair-tenders"
                                    min="${GameConfig.REPAIR_TENDERS_MIN}"
                                    max="${GameConfig.REPAIR_TENDERS_MAX}"
                                    value="${this.config.friendlyRepairTenders}">
                            </div>
                            <p class="total">Total: <span id="friendly-total">${this.config.getTotalUnits('friendly')}</span> ships</p>
                        </div>

                        <!-- Enemy Fleet -->
                        <div class="army-config">
                            <h3>Enemy Fleet (Red)</h3>
                            <div class="unit-slider">
                                <label>Fighters: <span id="enemy-fighters-value">${this.config.enemyFighters}</span></label>
                                <input type="range" id="enemy-fighters"
                                    min="${GameConfig.FIGHTERS_MIN}"
                                    max="${GameConfig.FIGHTERS_MAX}"
                                    value="${this.config.enemyFighters}">
                            </div>
                            <div class="unit-slider">
                                <label>Frigates: <span id="enemy-frigates-value">${this.config.enemyFrigates}</span></label>
                                <input type="range" id="enemy-frigates"
                                    min="${GameConfig.FRIGATES_MIN}"
                                    max="${GameConfig.FRIGATES_MAX}"
                                    value="${this.config.enemyFrigates}">
                            </div>
                            <div class="unit-slider">
                                <label>Corvettes (EW): <span id="enemy-corvettes-value">${this.config.enemyCorvettes}</span></label>
                                <input type="range" id="enemy-corvettes"
                                    min="${GameConfig.CORVETTES_MIN}"
                                    max="${GameConfig.CORVETTES_MAX}"
                                    value="${this.config.enemyCorvettes}">
                            </div>
                            <div class="unit-slider">
                                <label>Destroyers (PD): <span id="enemy-destroyers-value">${this.config.enemyDestroyers}</span></label>
                                <input type="range" id="enemy-destroyers"
                                    min="${GameConfig.DESTROYERS_MIN}"
                                    max="${GameConfig.DESTROYERS_MAX}"
                                    value="${this.config.enemyDestroyers}">
                            </div>
                            <div class="unit-slider">
                                <label>Cruisers: <span id="enemy-cruisers-value">${this.config.enemyCruisers}</span></label>
                                <input type="range" id="enemy-cruisers"
                                    min="${GameConfig.CRUISERS_MIN}"
                                    max="${GameConfig.CRUISERS_MAX}"
                                    value="${this.config.enemyCruisers}">
                            </div>
                            <div class="unit-slider">
                                <label>Carriers: <span id="enemy-carriers-value">${this.config.enemyCarriers}</span></label>
                                <input type="range" id="enemy-carriers"
                                    min="${GameConfig.CARRIERS_MIN}"
                                    max="${GameConfig.CARRIERS_MAX}"
                                    value="${this.config.enemyCarriers}">
                            </div>
                            <div class="unit-slider">
                                <label>Battleships: <span id="enemy-battleships-value">${this.config.enemyBattleships}</span></label>
                                <input type="range" id="enemy-battleships"
                                    min="${GameConfig.BATTLESHIPS_MIN}"
                                    max="${GameConfig.BATTLESHIPS_MAX}"
                                    value="${this.config.enemyBattleships}">
                            </div>
                            <div class="unit-slider">
                                <label>Dreadnoughts: <span id="enemy-dreadnoughts-value">${this.config.enemyDreadnoughts}</span></label>
                                <input type="range" id="enemy-dreadnoughts"
                                    min="${GameConfig.DREADNOUGHTS_MIN}"
                                    max="${GameConfig.DREADNOUGHTS_MAX}"
                                    value="${this.config.enemyDreadnoughts}">
                            </div>
                            <div class="unit-slider">
                                <label>Gunships: <span id="enemy-gunships-value">${this.config.enemyGunships}</span></label>
                                <input type="range" id="enemy-gunships"
                                    min="${GameConfig.GUNSHIPS_MIN}"
                                    max="${GameConfig.GUNSHIPS_MAX}"
                                    value="${this.config.enemyGunships}">
                            </div>
                            <div class="unit-slider">
                                <label>Interceptors: <span id="enemy-interceptors-value">${this.config.enemyInterceptors}</span></label>
                                <input type="range" id="enemy-interceptors"
                                    min="${GameConfig.INTERCEPTORS_MIN}"
                                    max="${GameConfig.INTERCEPTORS_MAX}"
                                    value="${this.config.enemyInterceptors}">
                            </div>
                            <div class="unit-slider">
                                <label>Minelayers: <span id="enemy-minelayers-value">${this.config.enemyMinelayers}</span></label>
                                <input type="range" id="enemy-minelayers"
                                    min="${GameConfig.MINELAYERS_MIN}"
                                    max="${GameConfig.MINELAYERS_MAX}"
                                    value="${this.config.enemyMinelayers}">
                            </div>
                            <div class="unit-slider">
                                <label>Repair Tenders: <span id="enemy-repair-tenders-value">${this.config.enemyRepairTenders}</span></label>
                                <input type="range" id="enemy-repair-tenders"
                                    min="${GameConfig.REPAIR_TENDERS_MIN}"
                                    max="${GameConfig.REPAIR_TENDERS_MAX}"
                                    value="${this.config.enemyRepairTenders}">
                            </div>
                            <p class="total">Total: <span id="enemy-total">${this.config.getTotalUnits('enemy')}</span> ships</p>
                        </div>

                        <!-- Start Button -->
                        <button id="btn-start" class="btn-large btn-success">
                            Launch Battle
                        </button>
                    </div>

                    <!-- Presets -->
                    <div class="setup-section">
                        <h2>Scenarios</h2>
                        <div class="preset-grid">
                            <button class="btn-preset" data-preset="fighter_swarm">
                                <span class="preset-icon">&#9733;</span>
                                <span class="preset-name">Fighter Swarm</span>
                            </button>
                            <button class="btn-preset" data-preset="capital_clash">
                                <span class="preset-icon">&#9876;</span>
                                <span class="preset-name">Capital Clash</span>
                            </button>
                            <button class="btn-preset" data-preset="carrier_strike">
                                <span class="preset-icon">&#8982;</span>
                                <span class="preset-name">Carrier Strike</span>
                            </button>
                            <button class="btn-preset" data-preset="balanced_fleet">
                                <span class="preset-icon">&#9878;</span>
                                <span class="preset-name">Balanced Fleet</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachListeners() {
        // Surprise Me button
        document.getElementById('btn-surprise').addEventListener('click', () => {
            this.surpriseMe();
        });

        // Start button
        document.getElementById('btn-start').addEventListener('click', () => {
            this.startBattle();
        });

        // Preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.preset;
                this.loadPreset(preset);
            });
        });

        // Sliders
        const sliders = [
            'friendly-fighters', 'friendly-frigates', 'friendly-corvettes',
            'friendly-destroyers', 'friendly-cruisers', 'friendly-carriers', 'friendly-battleships',
            'friendly-dreadnoughts', 'friendly-gunships', 'friendly-interceptors',
            'friendly-minelayers', 'friendly-repair-tenders',
            'enemy-fighters', 'enemy-frigates', 'enemy-corvettes',
            'enemy-destroyers', 'enemy-cruisers', 'enemy-carriers', 'enemy-battleships',
            'enemy-dreadnoughts', 'enemy-gunships', 'enemy-interceptors',
            'enemy-minelayers', 'enemy-repair-tenders'
        ];

        sliders.forEach(id => {
            const slider = document.getElementById(id);
            slider.addEventListener('input', () => this.updateFromSliders());
        });
    }

    /**
     * Update configuration from sliders
     */
    updateFromSliders() {
        this.config.friendlyFighters = parseInt(document.getElementById('friendly-fighters').value);
        this.config.friendlyFrigates = parseInt(document.getElementById('friendly-frigates').value);
        this.config.friendlyCorvettes = parseInt(document.getElementById('friendly-corvettes').value);
        this.config.friendlyDestroyers = parseInt(document.getElementById('friendly-destroyers').value);
        this.config.friendlyCruisers = parseInt(document.getElementById('friendly-cruisers').value);
        this.config.friendlyCarriers = parseInt(document.getElementById('friendly-carriers').value);
        this.config.friendlyBattleships = parseInt(document.getElementById('friendly-battleships').value);
        this.config.friendlyDreadnoughts = parseInt(document.getElementById('friendly-dreadnoughts').value);
        this.config.friendlyGunships = parseInt(document.getElementById('friendly-gunships').value);
        this.config.friendlyInterceptors = parseInt(document.getElementById('friendly-interceptors').value);
        this.config.friendlyMinelayers = parseInt(document.getElementById('friendly-minelayers').value);
        this.config.friendlyRepairTenders = parseInt(document.getElementById('friendly-repair-tenders').value);

        this.config.enemyFighters = parseInt(document.getElementById('enemy-fighters').value);
        this.config.enemyFrigates = parseInt(document.getElementById('enemy-frigates').value);
        this.config.enemyCorvettes = parseInt(document.getElementById('enemy-corvettes').value);
        this.config.enemyDestroyers = parseInt(document.getElementById('enemy-destroyers').value);
        this.config.enemyCruisers = parseInt(document.getElementById('enemy-cruisers').value);
        this.config.enemyCarriers = parseInt(document.getElementById('enemy-carriers').value);
        this.config.enemyBattleships = parseInt(document.getElementById('enemy-battleships').value);
        this.config.enemyDreadnoughts = parseInt(document.getElementById('enemy-dreadnoughts').value);
        this.config.enemyGunships = parseInt(document.getElementById('enemy-gunships').value);
        this.config.enemyInterceptors = parseInt(document.getElementById('enemy-interceptors').value);
        this.config.enemyMinelayers = parseInt(document.getElementById('enemy-minelayers').value);
        this.config.enemyRepairTenders = parseInt(document.getElementById('enemy-repair-tenders').value);

        this.updateDisplay();
    }

    /**
     * Update display values
     */
    updateDisplay() {
        document.getElementById('friendly-fighters-value').textContent = this.config.friendlyFighters;
        document.getElementById('friendly-frigates-value').textContent = this.config.friendlyFrigates;
        document.getElementById('friendly-corvettes-value').textContent = this.config.friendlyCorvettes;
        document.getElementById('friendly-destroyers-value').textContent = this.config.friendlyDestroyers;
        document.getElementById('friendly-cruisers-value').textContent = this.config.friendlyCruisers;
        document.getElementById('friendly-carriers-value').textContent = this.config.friendlyCarriers;
        document.getElementById('friendly-battleships-value').textContent = this.config.friendlyBattleships;
        document.getElementById('friendly-dreadnoughts-value').textContent = this.config.friendlyDreadnoughts;
        document.getElementById('friendly-gunships-value').textContent = this.config.friendlyGunships;
        document.getElementById('friendly-interceptors-value').textContent = this.config.friendlyInterceptors;
        document.getElementById('friendly-minelayers-value').textContent = this.config.friendlyMinelayers;
        document.getElementById('friendly-repair-tenders-value').textContent = this.config.friendlyRepairTenders;

        document.getElementById('enemy-fighters-value').textContent = this.config.enemyFighters;
        document.getElementById('enemy-frigates-value').textContent = this.config.enemyFrigates;
        document.getElementById('enemy-corvettes-value').textContent = this.config.enemyCorvettes;
        document.getElementById('enemy-destroyers-value').textContent = this.config.enemyDestroyers;
        document.getElementById('enemy-cruisers-value').textContent = this.config.enemyCruisers;
        document.getElementById('enemy-carriers-value').textContent = this.config.enemyCarriers;
        document.getElementById('enemy-battleships-value').textContent = this.config.enemyBattleships;
        document.getElementById('enemy-dreadnoughts-value').textContent = this.config.enemyDreadnoughts;
        document.getElementById('enemy-gunships-value').textContent = this.config.enemyGunships;
        document.getElementById('enemy-interceptors-value').textContent = this.config.enemyInterceptors;
        document.getElementById('enemy-minelayers-value').textContent = this.config.enemyMinelayers;
        document.getElementById('enemy-repair-tenders-value').textContent = this.config.enemyRepairTenders;

        document.getElementById('friendly-total').textContent = this.config.getTotalUnits('friendly');
        document.getElementById('enemy-total').textContent = this.config.getTotalUnits('enemy');
    }

    /**
     * Generate random battle
     */
    surpriseMe() {
        this.config = SurpriseMe.generate('medium');
        this.startBattle();
    }

    /**
     * Load preset configuration
     */
    loadPreset(preset) {
        this.config = SurpriseMe.generateThemed(preset);
        this.startBattle();
    }

    /**
     * Start the battle
     */
    startBattle() {
        if (!this.config.isValid()) {
            alert('Invalid configuration! Each side must have at least 1 ship.');
            return;
        }

        // Hide setup UI
        this.hide();

        // Call start callback
        if (this.onStart) {
            this.onStart(this.config);
        }
    }

    /**
     * Hide the setup UI
     */
    hide() {
        if (this.container) {
            this.container.style.display = 'none';
            this.isVisible = false;
        }
    }

    /**
     * Show the setup UI
     */
    show() {
        if (this.container) {
            this.container.style.display = 'flex';
            this.isVisible = true;
        }
    }

    /**
     * Remove the setup UI
     */
    destroy() {
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

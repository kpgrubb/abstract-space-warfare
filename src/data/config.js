/**
 * config.js - Space warfare game configuration
 * Ship stats, weapon types, and gameplay balance
 */

// Weapon configurations
// Speed hierarchy: Lasers (instant) > Ballistics (fast) > Missiles (tracking)
// Tuned for ponderous, deliberate combat
export const WeaponConfig = {
    ballistic: {
        damage: 8,
        speed: 280,      // Slower projectile (was 450)
        range: 280,
        cooldown: 1.2,   // Slower fire rate (was 0.5)
        visual: 'tracer',
        color: '#ffaa00',
        size: 2
    },

    laser: {
        damage: 12,
        speed: 1800,     // Still fast but more visible (was 3000)
        range: 100,      // Very short range - knife fight weapon (was 150)
        cooldown: 1.8,   // Slower fire rate (was 0.8)
        visual: 'beam',
        color: '#00ff44',
        beamDuration: 0.15,
        size: 1.5
    },

    missile: {
        damage: 35,
        speed: 180,      // Slower missiles (was 280)
        range: 400,
        cooldown: 5.0,   // Much slower fire rate (was 2.5)
        visual: 'torpedo',
        color: '#ff4444',
        size: 4,
        hasExhaust: true
    },

    flak: {
        damage: 15,      // Moderate damage per hit
        speed: 240,      // Slower burst projectile (was 380)
        range: 150,      // Short range area denial
        cooldown: 2.5,   // Slower fire rate (was 1.2)
        visual: 'flak',
        color: '#ffcc00',
        size: 3,
        burstCount: 5,   // Fires multiple pellets
        spread: 0.4      // Radians spread angle
    }
};

// Combat balance - damage multipliers between ship types
export const CombatBalance = {
    // Fighters excel against Carriers (speed vs slow)
    fighter_vs_carrier: 1.6,
    fighter_vs_cruiser: 0.9,
    fighter_vs_battleship: 0.7,
    fighter_vs_frigate: 1.0,
    fighter_vs_fighter: 1.0,

    // Frigates are versatile support
    frigate_vs_fighter: 1.2,
    frigate_vs_carrier: 1.1,
    frigate_vs_cruiser: 0.9,
    frigate_vs_battleship: 0.8,
    frigate_vs_frigate: 1.0,

    // Cruisers counter Fighters
    cruiser_vs_fighter: 1.4,
    cruiser_vs_frigate: 1.1,
    cruiser_vs_carrier: 1.0,
    cruiser_vs_battleship: 0.8,
    cruiser_vs_cruiser: 1.0,

    // Carriers are vulnerable but long-range
    carrier_vs_battleship: 1.3, // Missiles work well
    carrier_vs_cruiser: 1.1,
    carrier_vs_frigate: 0.9,
    carrier_vs_fighter: 0.6,    // Very weak vs fighters
    carrier_vs_carrier: 1.0,

    // Battleships dominate most ships
    battleship_vs_cruiser: 1.4,
    battleship_vs_frigate: 1.3,
    battleship_vs_carrier: 1.2,
    battleship_vs_fighter: 1.1,
    battleship_vs_battleship: 1.0,
    battleship_vs_corvette: 1.5,  // Easy target when caught

    // Corvettes are EW support vessels - fragile, but disruptive
    corvette_vs_fighter: 0.8,    // Point defense struggles vs fighters
    corvette_vs_frigate: 0.7,
    corvette_vs_cruiser: 0.6,    // Very weak vs capitals
    corvette_vs_carrier: 0.6,
    corvette_vs_battleship: 0.5,
    corvette_vs_corvette: 1.0,

    // Other ships vs corvette (high priority target)
    fighter_vs_corvette: 1.3,    // Fighters hunt EW ships
    frigate_vs_corvette: 1.2,
    cruiser_vs_corvette: 1.3,
    carrier_vs_corvette: 1.1,

    // Destroyer - fast screening ship with point defense
    destroyer_vs_fighter: 1.3,      // PD effective vs small craft
    destroyer_vs_frigate: 1.0,
    destroyer_vs_corvette: 1.2,
    destroyer_vs_cruiser: 0.8,
    destroyer_vs_carrier: 1.1,      // Torpedoes hurt carriers
    destroyer_vs_battleship: 0.6,   // Outgunned by battleships
    destroyer_vs_destroyer: 1.0,

    // Other ships vs destroyer
    fighter_vs_destroyer: 0.8,      // Fighters struggle vs PD
    frigate_vs_destroyer: 1.0,
    corvette_vs_destroyer: 0.7,
    cruiser_vs_destroyer: 1.2,
    carrier_vs_destroyer: 0.9,      // Missiles get intercepted
    battleship_vs_destroyer: 1.4,

    // Dreadnought - massive super-capital with spinal beam
    dreadnought_vs_fighter: 1.0,    // Too slow to track fighters well
    dreadnought_vs_frigate: 1.3,
    dreadnought_vs_corvette: 1.2,
    dreadnought_vs_destroyer: 1.4,
    dreadnought_vs_cruiser: 1.5,    // Crushes cruisers
    dreadnought_vs_carrier: 1.6,    // Spinal beam devastates carriers
    dreadnought_vs_battleship: 1.3, // Outguns battleships
    dreadnought_vs_dreadnought: 1.0,

    // Other ships vs dreadnought
    fighter_vs_dreadnought: 0.6,    // Need many fighters
    frigate_vs_dreadnought: 0.5,
    corvette_vs_dreadnought: 0.4,
    destroyer_vs_dreadnought: 0.5,
    cruiser_vs_dreadnought: 0.7,
    carrier_vs_dreadnought: 0.8,
    battleship_vs_dreadnought: 0.8,

    // Gunship - heavy attack fighter
    gunship_vs_fighter: 1.2,        // Outguns fighters
    gunship_vs_frigate: 1.1,
    gunship_vs_corvette: 1.2,
    gunship_vs_destroyer: 0.9,
    gunship_vs_cruiser: 0.8,
    gunship_vs_carrier: 1.3,        // Good vs slow targets
    gunship_vs_battleship: 0.7,
    gunship_vs_dreadnought: 0.6,
    gunship_vs_gunship: 1.0,

    // Other ships vs gunship
    fighter_vs_gunship: 0.9,        // Fighter is faster but weaker
    frigate_vs_gunship: 1.1,
    corvette_vs_gunship: 0.8,
    destroyer_vs_gunship: 1.2,      // PD shreds gunships
    cruiser_vs_gunship: 1.2,
    carrier_vs_gunship: 0.7,
    battleship_vs_gunship: 1.3,
    dreadnought_vs_gunship: 1.1,

    // Interceptor - ultra-fast fighter killer
    interceptor_vs_fighter: 1.5,    // Dominates fighters
    interceptor_vs_gunship: 1.3,    // Fast enough to hit gunships
    interceptor_vs_frigate: 0.8,
    interceptor_vs_corvette: 1.0,
    interceptor_vs_destroyer: 0.6,  // PD nightmare
    interceptor_vs_cruiser: 0.5,
    interceptor_vs_carrier: 0.7,
    interceptor_vs_battleship: 0.4,
    interceptor_vs_dreadnought: 0.3,
    interceptor_vs_interceptor: 1.0,

    // Other ships vs interceptor
    fighter_vs_interceptor: 0.7,    // Interceptor wins dogfights
    gunship_vs_interceptor: 0.8,
    frigate_vs_interceptor: 1.0,
    corvette_vs_interceptor: 0.9,
    destroyer_vs_interceptor: 1.4,  // PD very effective
    cruiser_vs_interceptor: 1.2,
    carrier_vs_interceptor: 0.5,
    battleship_vs_interceptor: 1.0,
    dreadnought_vs_interceptor: 0.9,

    // Minelayer - mine deployment vessel
    minelayer_vs_fighter: 0.7,
    minelayer_vs_gunship: 0.7,
    minelayer_vs_interceptor: 0.6,
    minelayer_vs_frigate: 0.8,
    minelayer_vs_corvette: 0.8,
    minelayer_vs_destroyer: 0.7,
    minelayer_vs_cruiser: 0.6,
    minelayer_vs_carrier: 0.7,
    minelayer_vs_battleship: 0.5,
    minelayer_vs_dreadnought: 0.4,
    minelayer_vs_minelayer: 1.0,

    // Other ships vs minelayer (high priority target)
    fighter_vs_minelayer: 1.2,
    gunship_vs_minelayer: 1.2,
    interceptor_vs_minelayer: 1.3,
    frigate_vs_minelayer: 1.1,
    corvette_vs_minelayer: 1.0,
    destroyer_vs_minelayer: 1.2,
    cruiser_vs_minelayer: 1.2,
    carrier_vs_minelayer: 1.0,
    battleship_vs_minelayer: 1.3,
    dreadnought_vs_minelayer: 1.2,

    // Repair Tender - support vessel
    repair_tender_vs_fighter: 0.5,
    repair_tender_vs_gunship: 0.5,
    repair_tender_vs_interceptor: 0.4,
    repair_tender_vs_frigate: 0.5,
    repair_tender_vs_corvette: 0.6,
    repair_tender_vs_destroyer: 0.5,
    repair_tender_vs_cruiser: 0.4,
    repair_tender_vs_carrier: 0.5,
    repair_tender_vs_battleship: 0.3,
    repair_tender_vs_dreadnought: 0.2,
    repair_tender_vs_minelayer: 0.6,
    repair_tender_vs_repair_tender: 1.0,

    // Other ships vs repair tender (very high priority target)
    fighter_vs_repair_tender: 1.3,
    gunship_vs_repair_tender: 1.3,
    interceptor_vs_repair_tender: 1.4,
    frigate_vs_repair_tender: 1.2,
    corvette_vs_repair_tender: 1.1,
    destroyer_vs_repair_tender: 1.2,
    cruiser_vs_repair_tender: 1.3,
    carrier_vs_repair_tender: 1.1,
    battleship_vs_repair_tender: 1.4,
    dreadnought_vs_repair_tender: 1.3,
    minelayer_vs_repair_tender: 1.1
};

// Ship count ranges for UI
export const GameConfig = {
    // Ship count ranges
    FIGHTERS_MIN: 0,
    FIGHTERS_MAX: 30,
    FRIGATES_MIN: 0,
    FRIGATES_MAX: 20,
    CORVETTES_MIN: 0,
    CORVETTES_MAX: 8,
    DESTROYERS_MIN: 0,
    DESTROYERS_MAX: 10,
    CRUISERS_MIN: 0,
    CRUISERS_MAX: 15,
    CARRIERS_MIN: 0,
    CARRIERS_MAX: 5,
    BATTLESHIPS_MIN: 0,
    BATTLESHIPS_MAX: 5,
    DREADNOUGHTS_MIN: 0,
    DREADNOUGHTS_MAX: 3,
    GUNSHIPS_MIN: 0,
    GUNSHIPS_MAX: 15,
    INTERCEPTORS_MIN: 0,
    INTERCEPTORS_MAX: 20,
    MINELAYERS_MIN: 0,
    MINELAYERS_MAX: 4,
    REPAIR_TENDERS_MIN: 0,
    REPAIR_TENDERS_MAX: 3,

    // Default fleet composition
    DEFAULT_FIGHTERS: 6,
    DEFAULT_FRIGATES: 4,
    DEFAULT_CORVETTES: 1,
    DEFAULT_DESTROYERS: 2,
    DEFAULT_CRUISERS: 3,
    DEFAULT_CARRIERS: 1,
    DEFAULT_BATTLESHIPS: 1,
    DEFAULT_DREADNOUGHTS: 0,
    DEFAULT_GUNSHIPS: 2,
    DEFAULT_INTERCEPTORS: 0,
    DEFAULT_MINELAYERS: 0,
    DEFAULT_REPAIR_TENDERS: 0,

    // Deployment patterns
    DEPLOYMENT_PATTERNS: {
        LINE: 'line',
        COLUMN: 'column',
        DEFENSIVE: 'defensive',
        SCATTERED: 'scattered'
    },

    // Victory conditions
    VICTORY_CONDITIONS: {
        ANNIHILATION: 'annihilation',
        TIME_LIMIT: 'time_limit'
    },

    // Time limits (in seconds)
    TIME_LIMITS: {
        SHORT: 120,
        MEDIUM: 300,
        LONG: 600
    }
};

/**
 * Battle configuration class
 */
export class BattleConfig {
    constructor() {
        // Friendly fleet composition
        this.friendlyFighters = GameConfig.DEFAULT_FIGHTERS;
        this.friendlyFrigates = GameConfig.DEFAULT_FRIGATES;
        this.friendlyCorvettes = GameConfig.DEFAULT_CORVETTES;
        this.friendlyDestroyers = GameConfig.DEFAULT_DESTROYERS;
        this.friendlyCruisers = GameConfig.DEFAULT_CRUISERS;
        this.friendlyCarriers = GameConfig.DEFAULT_CARRIERS;
        this.friendlyBattleships = GameConfig.DEFAULT_BATTLESHIPS;
        this.friendlyDreadnoughts = GameConfig.DEFAULT_DREADNOUGHTS;
        this.friendlyGunships = GameConfig.DEFAULT_GUNSHIPS;
        this.friendlyInterceptors = GameConfig.DEFAULT_INTERCEPTORS;
        this.friendlyMinelayers = GameConfig.DEFAULT_MINELAYERS;
        this.friendlyRepairTenders = GameConfig.DEFAULT_REPAIR_TENDERS;

        // Enemy fleet composition
        this.enemyFighters = GameConfig.DEFAULT_FIGHTERS;
        this.enemyFrigates = GameConfig.DEFAULT_FRIGATES;
        this.enemyCorvettes = GameConfig.DEFAULT_CORVETTES;
        this.enemyDestroyers = GameConfig.DEFAULT_DESTROYERS;
        this.enemyCruisers = GameConfig.DEFAULT_CRUISERS;
        this.enemyCarriers = GameConfig.DEFAULT_CARRIERS;
        this.enemyBattleships = GameConfig.DEFAULT_BATTLESHIPS;
        this.enemyDreadnoughts = GameConfig.DEFAULT_DREADNOUGHTS;
        this.enemyGunships = GameConfig.DEFAULT_GUNSHIPS;
        this.enemyInterceptors = GameConfig.DEFAULT_INTERCEPTORS;
        this.enemyMinelayers = GameConfig.DEFAULT_MINELAYERS;
        this.enemyRepairTenders = GameConfig.DEFAULT_REPAIR_TENDERS;

        // Deployment
        this.friendlyDeployment = GameConfig.DEPLOYMENT_PATTERNS.LINE;
        this.enemyDeployment = GameConfig.DEPLOYMENT_PATTERNS.LINE;

        // Victory
        this.victoryCondition = GameConfig.VICTORY_CONDITIONS.ANNIHILATION;
        this.timeLimit = GameConfig.TIME_LIMITS.MEDIUM;
    }

    /**
     * Get total ship count for a team
     */
    getTotalUnits(team = 'friendly') {
        if (team === 'friendly') {
            return this.friendlyFighters + this.friendlyFrigates +
                   this.friendlyCorvettes + this.friendlyDestroyers +
                   this.friendlyCruisers + this.friendlyCarriers +
                   this.friendlyBattleships + this.friendlyDreadnoughts +
                   this.friendlyGunships + this.friendlyInterceptors +
                   this.friendlyMinelayers + this.friendlyRepairTenders;
        } else {
            return this.enemyFighters + this.enemyFrigates +
                   this.enemyCorvettes + this.enemyDestroyers +
                   this.enemyCruisers + this.enemyCarriers +
                   this.enemyBattleships + this.enemyDreadnoughts +
                   this.enemyGunships + this.enemyInterceptors +
                   this.enemyMinelayers + this.enemyRepairTenders;
        }
    }

    /**
     * Validate configuration
     */
    isValid() {
        const friendlyTotal = this.getTotalUnits('friendly');
        const enemyTotal = this.getTotalUnits('enemy');

        // Must have at least 1 ship per side
        return friendlyTotal >= 1 && enemyTotal >= 1;
    }

    /**
     * Create a copy of this configuration
     */
    clone() {
        const copy = new BattleConfig();
        Object.assign(copy, this);
        return copy;
    }
}

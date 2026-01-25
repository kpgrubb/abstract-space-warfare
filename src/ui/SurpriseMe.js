/**
 * SurpriseMe.js - Random fleet generator
 * Generates balanced, varied fleet configurations for space battles
 */

import { BattleConfig, GameConfig } from '../data/config.js';
import { randomInt, randomChoice } from '../utils/math.js';

export class SurpriseMe {
    /**
     * Generate a random fleet configuration
     * @param {string} intensity - 'skirmish', 'medium', or 'epic'
     * @returns {BattleConfig}
     */
    static generate(intensity = 'medium') {
        const config = new BattleConfig();

        // Determine scale based on intensity
        let scale;
        switch (intensity) {
            case 'skirmish':
                scale = { min: 0.3, max: 0.5 };
                break;
            case 'epic':
                scale = { min: 0.7, max: 1.0 };
                break;
            case 'medium':
            default:
                scale = { min: 0.4, max: 0.7 };
                break;
        }

        // Generate base ship counts
        const baseFighters = Math.round(
            GameConfig.FIGHTERS_MIN + (GameConfig.FIGHTERS_MAX - GameConfig.FIGHTERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseFrigates = Math.round(
            GameConfig.FRIGATES_MIN + (GameConfig.FRIGATES_MAX - GameConfig.FRIGATES_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseCorvettes = Math.round(
            GameConfig.CORVETTES_MIN + (GameConfig.CORVETTES_MAX - GameConfig.CORVETTES_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseDestroyers = Math.round(
            GameConfig.DESTROYERS_MIN + (GameConfig.DESTROYERS_MAX - GameConfig.DESTROYERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseCruisers = Math.round(
            GameConfig.CRUISERS_MIN + (GameConfig.CRUISERS_MAX - GameConfig.CRUISERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseCarriers = Math.round(
            GameConfig.CARRIERS_MIN + (GameConfig.CARRIERS_MAX - GameConfig.CARRIERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseBattleships = Math.round(
            GameConfig.BATTLESHIPS_MIN + (GameConfig.BATTLESHIPS_MAX - GameConfig.BATTLESHIPS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseDreadnoughts = Math.round(
            GameConfig.DREADNOUGHTS_MIN + (GameConfig.DREADNOUGHTS_MAX - GameConfig.DREADNOUGHTS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min)) * 0.5 // Less common
        );
        const baseGunships = Math.round(
            GameConfig.GUNSHIPS_MIN + (GameConfig.GUNSHIPS_MAX - GameConfig.GUNSHIPS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min))
        );
        const baseInterceptors = Math.round(
            GameConfig.INTERCEPTORS_MIN + (GameConfig.INTERCEPTORS_MAX - GameConfig.INTERCEPTORS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min)) * 0.6
        );
        const baseMinelayers = Math.round(
            GameConfig.MINELAYERS_MIN + (GameConfig.MINELAYERS_MAX - GameConfig.MINELAYERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min)) * 0.4 // Rare
        );
        const baseRepairTenders = Math.round(
            GameConfig.REPAIR_TENDERS_MIN + (GameConfig.REPAIR_TENDERS_MAX - GameConfig.REPAIR_TENDERS_MIN) *
            (scale.min + Math.random() * (scale.max - scale.min)) * 0.5
        );

        // Add asymmetry (±20% variance)
        const variance = 0.2;

        config.friendlyFighters = Math.max(0,
            Math.round(baseFighters * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyFrigates = Math.max(0,
            Math.round(baseFrigates * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyCorvettes = Math.max(0,
            Math.round(baseCorvettes * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyDestroyers = Math.max(0,
            Math.round(baseDestroyers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyCruisers = Math.max(0,
            Math.round(baseCruisers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyCarriers = Math.max(0,
            Math.round(baseCarriers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyBattleships = Math.max(0,
            Math.round(baseBattleships * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyDreadnoughts = Math.max(0,
            Math.round(baseDreadnoughts * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyGunships = Math.max(0,
            Math.round(baseGunships * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyInterceptors = Math.max(0,
            Math.round(baseInterceptors * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyMinelayers = Math.max(0,
            Math.round(baseMinelayers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.friendlyRepairTenders = Math.max(0,
            Math.round(baseRepairTenders * (1 + (Math.random() * 2 - 1) * variance))
        );

        config.enemyFighters = Math.max(0,
            Math.round(baseFighters * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyFrigates = Math.max(0,
            Math.round(baseFrigates * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyCorvettes = Math.max(0,
            Math.round(baseCorvettes * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyDestroyers = Math.max(0,
            Math.round(baseDestroyers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyCruisers = Math.max(0,
            Math.round(baseCruisers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyCarriers = Math.max(0,
            Math.round(baseCarriers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyBattleships = Math.max(0,
            Math.round(baseBattleships * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyDreadnoughts = Math.max(0,
            Math.round(baseDreadnoughts * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyGunships = Math.max(0,
            Math.round(baseGunships * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyInterceptors = Math.max(0,
            Math.round(baseInterceptors * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyMinelayers = Math.max(0,
            Math.round(baseMinelayers * (1 + (Math.random() * 2 - 1) * variance))
        );
        config.enemyRepairTenders = Math.max(0,
            Math.round(baseRepairTenders * (1 + (Math.random() * 2 - 1) * variance))
        );

        // Ensure at least one ship per side
        if (config.getTotalUnits('friendly') === 0) {
            config.friendlyFighters = 3;
        }
        if (config.getTotalUnits('enemy') === 0) {
            config.enemyFighters = 3;
        }

        // Random deployments
        const deployments = Object.values(GameConfig.DEPLOYMENT_PATTERNS);
        config.friendlyDeployment = randomChoice(deployments);
        config.enemyDeployment = randomChoice(deployments);

        // Random victory condition
        const conditions = Object.values(GameConfig.VICTORY_CONDITIONS);
        config.victoryCondition = randomChoice(conditions);

        // If time limit, choose duration
        if (config.victoryCondition === GameConfig.VICTORY_CONDITIONS.TIME_LIMIT) {
            const timeLimits = Object.values(GameConfig.TIME_LIMITS);
            config.timeLimit = randomChoice(timeLimits);
        }

        return config;
    }

    /**
     * Generate a themed fleet battle
     * @param {string} theme - 'fighter_swarm', 'capital_clash', 'carrier_strike', 'balanced_fleet'
     * @returns {BattleConfig}
     */
    static generateThemed(theme) {
        const config = new BattleConfig();

        switch (theme) {
            case 'fighter_swarm':
                // Lots of small fast ships - with gunships and interceptors
                config.friendlyFighters = randomInt(12, 20);
                config.friendlyFrigates = randomInt(4, 8);
                config.friendlyCorvettes = randomInt(0, 1);
                config.friendlyDestroyers = randomInt(1, 3);
                config.friendlyCruisers = randomInt(0, 2);
                config.friendlyCarriers = 0;
                config.friendlyBattleships = 0;
                config.friendlyDreadnoughts = 0;
                config.friendlyGunships = randomInt(4, 8);  // Heavy fighter support
                config.friendlyInterceptors = randomInt(6, 10); // Fighter killers
                config.friendlyMinelayers = 0;
                config.friendlyRepairTenders = 0;

                config.enemyFighters = randomInt(12, 20);
                config.enemyFrigates = randomInt(4, 8);
                config.enemyCorvettes = randomInt(0, 1);
                config.enemyDestroyers = randomInt(1, 3);
                config.enemyCruisers = randomInt(0, 2);
                config.enemyCarriers = 0;
                config.enemyBattleships = 0;
                config.enemyDreadnoughts = 0;
                config.enemyGunships = randomInt(4, 8);
                config.enemyInterceptors = randomInt(6, 10);
                config.enemyMinelayers = 0;
                config.enemyRepairTenders = 0;

                config.friendlyDeployment = GameConfig.DEPLOYMENT_PATTERNS.SCATTERED;
                config.enemyDeployment = GameConfig.DEPLOYMENT_PATTERNS.SCATTERED;
                break;

            case 'capital_clash':
                // Heavy capital ship focus - dreadnoughts, repair tenders
                config.friendlyFighters = randomInt(2, 5);
                config.friendlyFrigates = randomInt(2, 4);
                config.friendlyCorvettes = randomInt(2, 4);
                config.friendlyDestroyers = randomInt(3, 5);
                config.friendlyCruisers = randomInt(4, 8);
                config.friendlyCarriers = randomInt(1, 2);
                config.friendlyBattleships = randomInt(2, 3);
                config.friendlyDreadnoughts = randomInt(1, 2); // Dreadnoughts!
                config.friendlyGunships = randomInt(2, 4);
                config.friendlyInterceptors = 0;
                config.friendlyMinelayers = randomInt(0, 1);
                config.friendlyRepairTenders = randomInt(1, 2); // Keep capitals alive

                config.enemyFighters = randomInt(2, 5);
                config.enemyFrigates = randomInt(2, 4);
                config.enemyCorvettes = randomInt(2, 4);
                config.enemyDestroyers = randomInt(3, 5);
                config.enemyCruisers = randomInt(4, 8);
                config.enemyCarriers = randomInt(1, 2);
                config.enemyBattleships = randomInt(2, 3);
                config.enemyDreadnoughts = randomInt(1, 2);
                config.enemyGunships = randomInt(2, 4);
                config.enemyInterceptors = 0;
                config.enemyMinelayers = randomInt(0, 1);
                config.enemyRepairTenders = randomInt(1, 2);

                config.friendlyDeployment = GameConfig.DEPLOYMENT_PATTERNS.LINE;
                config.enemyDeployment = GameConfig.DEPLOYMENT_PATTERNS.LINE;
                break;

            case 'carrier_strike':
                // Carriers deploy fighters - interceptors hunt deployed craft
                config.friendlyFighters = randomInt(4, 8);  // Fewer starting fighters
                config.friendlyFrigates = randomInt(3, 6);
                config.friendlyCorvettes = randomInt(1, 3);
                config.friendlyDestroyers = randomInt(4, 6);
                config.friendlyCruisers = randomInt(1, 3);
                config.friendlyCarriers = randomInt(3, 5);  // Many carriers deploy fighters!
                config.friendlyBattleships = randomInt(0, 1);
                config.friendlyDreadnoughts = 0;
                config.friendlyGunships = randomInt(2, 4);
                config.friendlyInterceptors = randomInt(4, 6); // Hunt enemy deployed fighters
                config.friendlyMinelayers = 0;
                config.friendlyRepairTenders = randomInt(0, 1);

                config.enemyFighters = randomInt(4, 8);
                config.enemyFrigates = randomInt(3, 6);
                config.enemyCorvettes = randomInt(1, 3);
                config.enemyDestroyers = randomInt(4, 6);
                config.enemyCruisers = randomInt(1, 3);
                config.enemyCarriers = randomInt(3, 5);
                config.enemyBattleships = randomInt(0, 1);
                config.enemyDreadnoughts = 0;
                config.enemyGunships = randomInt(2, 4);
                config.enemyInterceptors = randomInt(4, 6);
                config.enemyMinelayers = 0;
                config.enemyRepairTenders = randomInt(0, 1);

                config.friendlyDeployment = GameConfig.DEPLOYMENT_PATTERNS.DEFENSIVE;
                config.enemyDeployment = GameConfig.DEPLOYMENT_PATTERNS.DEFENSIVE;
                break;

            case 'balanced_fleet':
                // Equal mix of all ship types - full fleet variety
                const fighters = randomInt(5, 8);
                const frigates = randomInt(3, 5);
                const corvettes = randomInt(1, 2);
                const destroyers = randomInt(2, 3);
                const cruisers = randomInt(2, 4);
                const carriers = randomInt(1, 2);
                const battleships = randomInt(1, 2);
                const dreadnoughts = randomInt(0, 1);
                const gunships = randomInt(2, 4);
                const interceptors = randomInt(2, 4);
                const minelayers = randomInt(0, 1);
                const repairTenders = randomInt(0, 1);

                config.friendlyFighters = fighters;
                config.friendlyFrigates = frigates;
                config.friendlyCorvettes = corvettes;
                config.friendlyDestroyers = destroyers;
                config.friendlyCruisers = cruisers;
                config.friendlyCarriers = carriers;
                config.friendlyBattleships = battleships;
                config.friendlyDreadnoughts = dreadnoughts;
                config.friendlyGunships = gunships;
                config.friendlyInterceptors = interceptors;
                config.friendlyMinelayers = minelayers;
                config.friendlyRepairTenders = repairTenders;

                config.enemyFighters = fighters;
                config.enemyFrigates = frigates;
                config.enemyCorvettes = corvettes;
                config.enemyDestroyers = destroyers;
                config.enemyCruisers = cruisers;
                config.enemyCarriers = carriers;
                config.enemyBattleships = battleships;
                config.enemyDreadnoughts = dreadnoughts;
                config.enemyGunships = gunships;
                config.enemyInterceptors = interceptors;
                config.enemyMinelayers = minelayers;
                config.enemyRepairTenders = repairTenders;

                config.friendlyDeployment = GameConfig.DEPLOYMENT_PATTERNS.COLUMN;
                config.enemyDeployment = GameConfig.DEPLOYMENT_PATTERNS.COLUMN;
                break;

            default:
                // Default to random
                return SurpriseMe.generate('medium');
        }

        config.victoryCondition = GameConfig.VICTORY_CONDITIONS.ANNIHILATION;
        return config;
    }

    /**
     * Generate description for a configuration
     */
    static describe(config) {
        const friendlyTotal = config.getTotalUnits('friendly');
        const enemyTotal = config.getTotalUnits('enemy');

        let description = `${friendlyTotal} vs ${enemyTotal} ships\n`;
        description += `Friendly: ${config.friendlyFighters}F / ${config.friendlyFrigates}Fr / ${config.friendlyCorvettes}Co / ${config.friendlyDestroyers}D / `;
        description += `${config.friendlyCruisers}C / ${config.friendlyCarriers}Ca / ${config.friendlyBattleships}B\n`;
        description += `Enemy: ${config.enemyFighters}F / ${config.enemyFrigates}Fr / ${config.enemyCorvettes}Co / ${config.enemyDestroyers}D / `;
        description += `${config.enemyCruisers}C / ${config.enemyCarriers}Ca / ${config.enemyBattleships}B\n`;
        description += `Victory: ${config.victoryCondition}`;

        return description;
    }
}

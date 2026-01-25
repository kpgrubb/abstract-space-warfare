/**
 * VictorySystem.js - Victory detection and battle statistics
 * Tracks battle progress and determines winners
 */

export class VictorySystem {
    constructor() {
        this.battleStartTime = 0;
        this.battleStats = {
            friendlyKilled: 0,
            enemyKilled: 0,
            friendlyStartCount: 0,
            enemyStartCount: 0,
            battleDuration: 0,
            winner: null
        };

        this.victoryDetected = false;
        this.victoryTime = 0;
        this.victoryPauseDuration = 3.0; // 3 seconds to show victory screen
        this.onVictoryCallback = null;
        this.callbackFired = false; // Prevent multiple callback invocations
    }

    /**
     * Initialize a new battle
     */
    startBattle(friendlyCount, enemyCount) {
        this.battleStartTime = Date.now();
        this.battleStats = {
            friendlyKilled: 0,
            enemyKilled: 0,
            friendlyStartCount: friendlyCount,
            enemyStartCount: enemyCount,
            battleDuration: 0,
            winner: null
        };
        this.victoryDetected = false;
        this.victoryTime = 0;
        this.callbackFired = false;

        console.log(`Battle started: ${friendlyCount} vs ${enemyCount}`);
    }

    /**
     * Update victory system
     */
    update(deltaTime, units) {
        if (this.victoryDetected) {
            // Count down victory pause
            this.victoryTime += deltaTime;

            if (this.victoryTime >= this.victoryPauseDuration && !this.callbackFired) {
                // Victory pause over, trigger reset (only once)
                this.callbackFired = true;
                if (this.onVictoryCallback) {
                    this.onVictoryCallback(this.battleStats);
                }
            }
            return;
        }

        // Don't check victory if battle hasn't been initialized
        // (startCounts would be 0 if startBattle wasn't called)
        if (this.battleStats.friendlyStartCount === 0 && this.battleStats.enemyStartCount === 0) {
            return;
        }

        // Update battle duration
        this.battleStats.battleDuration = (Date.now() - this.battleStartTime) / 1000;

        // Grace period - don't check victory in first 0.5 seconds
        // This prevents false draws if ships haven't been added yet
        if (this.battleStats.battleDuration < 0.5) {
            return;
        }

        // Count alive units
        let friendlyAlive = 0;
        let enemyAlive = 0;

        for (const unit of units) {
            if (!unit.alive) continue;

            if (unit.team === 'friendly') {
                friendlyAlive++;
            } else if (unit.team === 'enemy') {
                enemyAlive++;
            }
        }

        // Update kill counts
        this.battleStats.friendlyKilled = this.battleStats.friendlyStartCount - friendlyAlive;
        this.battleStats.enemyKilled = this.battleStats.enemyStartCount - enemyAlive;

        // Check victory conditions
        if (friendlyAlive === 0 && enemyAlive > 0) {
            this.declareVictory('enemy');
        } else if (enemyAlive === 0 && friendlyAlive > 0) {
            this.declareVictory('friendly');
        } else if (friendlyAlive === 0 && enemyAlive === 0) {
            this.declareVictory('draw');
        }
    }

    /**
     * Declare victory
     */
    declareVictory(winner) {
        this.victoryDetected = true;
        this.victoryTime = 0;
        this.battleStats.winner = winner;

        console.log('\n=== VICTORY ===');
        console.log(`Winner: ${winner.toUpperCase()}`);
        console.log(`Friendly casualties: ${this.battleStats.friendlyKilled}/${this.battleStats.friendlyStartCount}`);
        console.log(`Enemy casualties: ${this.battleStats.enemyKilled}/${this.battleStats.enemyStartCount}`);
        console.log(`Battle duration: ${Math.round(this.battleStats.battleDuration)}s`);
    }

    /**
     * Set victory callback
     */
    setVictoryCallback(callback) {
        this.onVictoryCallback = callback;
    }

    /**
     * Stop victory tracking (reset state for new battle)
     */
    stop() {
        this.victoryDetected = false;
        this.victoryTime = 0;
        this.callbackFired = false;
        this.battleStats.winner = null;
    }

    /**
     * Check if victory detected
     */
    isVictoryDetected() {
        return this.victoryDetected;
    }

    /**
     * Get battle statistics
     */
    getStats() {
        return { ...this.battleStats };
    }

    /**
     * Get time remaining in victory pause
     */
    getVictoryTimeRemaining() {
        return Math.max(0, this.victoryPauseDuration - this.victoryTime);
    }

    /**
     * Render victory overlay
     */
    render(renderer) {
        if (!this.victoryDetected) return;

        const { width, height } = renderer.getDimensions();
        const ctx = renderer.getContext();

        // Flash effect
        const flash = Math.sin(this.victoryTime * 5) * 0.3 + 0.7;

        // Darken background
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        // Victory text
        ctx.font = 'bold 72px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Color based on winner
        let color;
        let text;
        if (this.battleStats.winner === 'friendly') {
            color = `rgba(0, 212, 255, ${flash})`;
            text = 'FRIENDLY VICTORY';
        } else if (this.battleStats.winner === 'enemy') {
            color = `rgba(255, 51, 102, ${flash})`;
            text = 'ENEMY VICTORY';
        } else {
            color = `rgba(200, 200, 200, ${flash})`;
            text = 'DRAW';
        }

        // Glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 30;
        ctx.fillStyle = color;
        ctx.fillText(text, width / 2, height / 2 - 50);
        ctx.shadowBlur = 0;

        // Statistics
        ctx.font = '24px "Courier New"';
        ctx.fillStyle = '#ffffff';

        const statsY = height / 2 + 40;
        const lineHeight = 35;

        ctx.fillText(
            `Friendly: ${this.battleStats.friendlyStartCount - this.battleStats.friendlyKilled}/${this.battleStats.friendlyStartCount} survived`,
            width / 2,
            statsY
        );

        ctx.fillText(
            `Enemy: ${this.battleStats.enemyStartCount - this.battleStats.enemyKilled}/${this.battleStats.enemyStartCount} survived`,
            width / 2,
            statsY + lineHeight
        );

        ctx.fillText(
            `Duration: ${Math.round(this.battleStats.battleDuration)}s`,
            width / 2,
            statsY + lineHeight * 2
        );

        // Next battle countdown
        const timeLeft = Math.ceil(this.getVictoryTimeRemaining());
        ctx.font = '20px "Courier New"';
        ctx.fillStyle = '#888888';
        ctx.fillText(
            `Next battle in ${timeLeft}s...`,
            width / 2,
            statsY + lineHeight * 3.5
        );

        ctx.restore();
    }
}

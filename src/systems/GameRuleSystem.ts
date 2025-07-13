import type { GameState } from '../stores/GameState';
import { getCurrentTime } from './PlayerSystem.js';

/**
 * GameRuleSystem handles game rule enforcement and victory/defeat conditions.
 * Follows autonomous update pattern - directly mutates GameState properties.
 */
export class GameRuleSystem {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Autonomous update method that checks all game rules and updates GameState directly.
     * Handles boundary checking, time limits, and goal detection.
     */
    public update(): void {
        // Skip rule checking if game is already over
        if (this.gameState.gameOver) {
            return;
        }

        // Check boundary violations (holes and screen boundaries)
        this.checkBoundaries();

        // Check time limit (only if game still running)
        if (!this.gameState.gameOver) {
            this.checkTimeUp();
        }

        // Check goal completion (only if game still running)
        if (!this.gameState.gameOver) {
            this.checkGoalReached();
        }
    }

    /**
     * Check if player has violated boundary conditions (holes or screen edges).
     * Sets gameOver = true if violation detected.
     */
    private checkBoundaries(): void {
        // Check hole collision using collision results flag
        if (this.gameState.runtime.collisionResults.holeCollision) {
            this.handlePlayerDeath();
            return;
        }

        // Check boundary collision using collision results flag
        if (this.gameState.runtime.collisionResults.boundaryCollision) {
            this.handlePlayerDeath();
            return;
        }
    }

    /**
     * Handle player death: set game over, add death marker, and trigger death animation.
     */
    private handlePlayerDeath(): void {
        // Pure rule enforcement: set the game over flag and increment death count
        this.gameState.gameOver = true;
        this.gameState.deathCount++;
    }

    /**
     * Public method to trigger player death from collision system
     */
    public triggerPlayerDeath(): void {
        this.handlePlayerDeath();
    }

    /**
     * Check if time limit has been exceeded.
     * Updates timeRemaining and sets gameOver = true if time up.
     */
    private checkTimeUp(): void {
        const gameStartTime = this.gameState.gameStartTime;

        if (gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;
            const timeRemaining = Math.max(0, this.gameState.timeLimit - elapsedSeconds);

            // Update time remaining
            this.gameState.timeRemaining = timeRemaining;

            // Check if time is up
            if (timeRemaining <= 0) {
                this.handlePlayerDeath();
            }
        }
    }

    /**
     * Check if player has reached the goal.
     * Sets gameOver = true and finalScore if goal reached.
     */
    private checkGoalReached(): void {
        // Check goal collision using collision results flag
        if (this.gameState.runtime.collisionResults.goalCollision) {
            this.handleGoalReached();
        }
    }

    /**
     * Handle goal reached: set game over, calculate final score, and trigger clear animation.
     */
    private handleGoalReached(): void {
        this.gameState.gameOver = true;
        this.gameState.finalScore = Math.ceil(this.gameState.timeRemaining);

        // Set flag to trigger clear animation
        this.gameState.runtime.shouldStartClearAnimation = true;
    }

    /**
     * Public method to trigger goal reached from collision system
     */
    public triggerGoalReached(): void {
        this.handleGoalReached();
    }
}

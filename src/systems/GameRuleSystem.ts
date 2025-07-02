import type { GameState } from '../stores/GameState';
import { getCurrentTime } from '../utils/GameUtils';
import type { CollisionSystem } from './CollisionSystem';

/**
 * GameRuleSystem handles game rule enforcement and victory/defeat conditions.
 * Follows autonomous update pattern - directly mutates GameState properties.
 */
export class GameRuleSystem {
    private gameState: GameState;
    private collisionSystem: CollisionSystem;

    constructor(gameState: GameState, collisionSystem: CollisionSystem) {
        this.gameState = gameState;
        this.collisionSystem = collisionSystem;
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
        const player = this.gameState.runtime.player;

        // Check hole collision (depth: 600 pixels)
        if (this.collisionSystem.checkHoleCollision(player, 600)) {
            this.gameState.gameOver = true;
            return;
        }

        // Check boundary collision (canvas height: 600 pixels)
        if (this.collisionSystem.checkBoundaryCollision(player, 600)) {
            this.gameState.gameOver = true;
            return;
        }
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
                this.gameState.gameOver = true;
            }
        }
    }

    /**
     * Check if player has reached the goal.
     * Sets gameOver = true and finalScore if goal reached.
     */
    private checkGoalReached(): void {
        // Check if stage has a goal and collision system has goal collision detection
        const stage = this.gameState.stage;
        if (
            stage?.goal &&
            this.collisionSystem.checkGoalCollision &&
            this.collisionSystem.checkGoalCollision(this.gameState.runtime.player, stage.goal)
        ) {
            this.gameState.gameOver = true;
            this.gameState.finalScore = Math.ceil(this.gameState.timeRemaining);
        }
    }
}

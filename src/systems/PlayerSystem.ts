/**
 * @fileoverview Player system for managing player movement and input processing
 * @module systems/PlayerSystem
 * @description Domain Layer - Pure player logic and physics management using Zustand store
 */

import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { Platform } from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
import { calculateDeltaFactor, getCurrentTime } from '../utils/GameUtils.js';
import type { LandingPrediction } from './FabricRenderSystem.js';
import type { InputManager } from './InputManager.js';

/**
 * Player system responsible for handling player movement, input processing, and auto-jump mechanics
 * @class PlayerSystem
 * @description Manages all player-related logic including movement and auto-jumping through Zustand store
 */
export class PlayerSystem {
    /** @private {InputManager | null} Input manager instance for handling user input */
    private inputManager: InputManager | null = null;

    /** @private {GameState} Game state instance for direct state access */
    private gameState: GameState;
    /** @private {any} Render system for landing predictions (injected dependency) */
    private renderSystem: {
        setLandingPredictions: (predictions: LandingPrediction[]) => void;
    } | null = null;

    /** @private {boolean} Flag tracking if player has moved at least once */
    private hasMovedOnce = false;

    /** @private {number | null} Timestamp of the last auto-jump execution */
    private lastJumpTime: number | null = null;

    /**
     * Creates a new PlayerSystem instance
     * @constructor
     * @param {GameState} gameState - Game state instance for state management
     * @param {InputManager} [inputManager] - Optional input manager for handling user input
     */
    constructor(gameState: GameState, inputManager?: InputManager) {
        this.gameState = gameState;
        this.inputManager = inputManager || null;
    }

    /**
     * Sets the input manager for handling user input
     * @param {InputManager} inputManager - Input manager instance to set
     * @returns {void}
     */
    setInputManager(inputManager: InputManager): void {
        this.inputManager = inputManager;
    }

    /**
     * Sets the render system for landing predictions
     * @param {any} renderSystem - Render system instance to set
     * @returns {void}
     */
    setRenderSystem(renderSystem: {
        setLandingPredictions: (predictions: LandingPrediction[]) => void;
    }): void {
        this.renderSystem = renderSystem;
    }

    /**
     * Updates player system for the current frame
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @param {PhysicsConstants} physics - Physics constants for calculations
     * @returns {void}
     */
    update(deltaTime: number, physics: PhysicsConstants): void {
        const dtFactor = calculateDeltaFactor(deltaTime, physics.gameSpeed);

        this.handleInput(dtFactor);
        this.handleAutoJump(physics);

        this.updateLandingPredictions();
    }

    /**
     * Handles player input processing and velocity updates
     * @private
     * @param {number} dtFactor - Delta time factor for frame-rate independent movement
     * @returns {void}
     */
    private handleInput(dtFactor: number): void {
        if (!this.inputManager) return;

        const leftInput = this.inputManager.isPressed('move-left');
        const rightInput = this.inputManager.isPressed('move-right');

        if (leftInput || rightInput) {
            const player = this.gameState.runtime.player;
            const direction = leftInput ? -1 : 1;
            const acceleration = GAME_CONFIG.player.acceleration * direction * dtFactor;

            player.vx += acceleration;
            this.hasMovedOnce = true;
        }

        // Apply minimum velocity if player has moved once
        if (
            this.hasMovedOnce &&
            Math.abs(this.gameState.runtime.player.vx) < GAME_CONFIG.player.minVelocity
        ) {
            const sign = this.gameState.runtime.player.vx >= 0 ? 1 : -1;
            this.gameState.runtime.player.vx = GAME_CONFIG.player.minVelocity * sign;
        }
    }

    /**
     * Handles automatic jumping mechanism for the player
     * @private
     * @param {PhysicsConstants} physics - Physics constants containing auto-jump configuration
     * @returns {void}
     */
    private handleAutoJump(physics: PhysicsConstants): void {
        const currentTime = getCurrentTime();
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - physics.autoJumpInterval;
        }

        const player = this.gameState.runtime.player;
        if (player.grounded && currentTime - this.lastJumpTime > physics.autoJumpInterval) {
            player.vy = physics.jumpForce;
            player.grounded = false;
            this.lastJumpTime = currentTime;
        }
    }

    /**
     * Updates landing predictions for player movement
     * @private
     * @returns {void}
     */
    private updateLandingPredictions(): void {
        if (!(this.renderSystem && this.gameState.stage)) return;

        // Simple input-based prediction that grows from landing spot
        const inputKeys = this.inputManager?.getMovementState() || {};
        const futureDistance = this.calculateFutureMovement(inputKeys);
        const predictedX = this.gameState.runtime.player.x + futureDistance;

        // Find the platform closest to predicted position
        const targetPlatform = this.findNearestPlatform(predictedX);

        if (targetPlatform) {
            const simplePrediction = [
                {
                    x: predictedX,
                    y: targetPlatform.y1,
                    confidence: 0.8,
                    jumpNumber: 1
                }
            ];
            this.renderSystem.setLandingPredictions(simplePrediction);
        } else {
            this.renderSystem.setLandingPredictions([]);
        }
    }

    /**
     * Calculates future movement based on player input
     * @private
     * @param {Record<string, boolean>} keys - Current input state
     * @returns {number} Predicted movement distance
     */
    private calculateFutureMovement(keys: Record<string, boolean>): number {
        // Estimate future movement for one jump (more realistic timing)
        const jumpDuration = 400; // Shorter, more realistic jump duration
        const baseMovement = this.gameState.runtime.player.vx * (jumpDuration / 16.67); // Movement during jump

        // Add smaller input-based movement
        let inputMovement = 0;
        if (keys.ArrowLeft) {
            inputMovement = -30; // Smaller left movement
        } else if (keys.ArrowRight) {
            inputMovement = 30; // Smaller right movement
        }

        return baseMovement + inputMovement;
    }

    /**
     * Finds the nearest platform to a target X position
     * @private
     * @param {number} targetX - Target X coordinate
     * @returns {Platform | null} Nearest platform or null if none found
     */
    private findNearestPlatform(targetX: number): Platform | null {
        if (!this.gameState.stage) return null;

        // Find platform that the player would likely land on
        let bestPlatform = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const platform of this.gameState.stage.platforms) {
            // Check if target X is within platform bounds or nearby
            const platformCenterX = (platform.x1 + platform.x2) / 2;
            const distance = Math.abs(targetX - platformCenterX);

            if (
                distance < bestDistance &&
                targetX >= platform.x1 - 30 &&
                targetX <= platform.x2 + 30
            ) {
                bestDistance = distance;
                bestPlatform = platform;
            }
        }

        return bestPlatform;
    }

    /**
     * Clamps player speed to the specified maximum value
     * @param {number} maxSpeed - Maximum allowed speed value
     * @returns {void}
     */
    clampSpeed(maxSpeed: number): void {
        const player = this.gameState.runtime.player;
        if (Math.abs(player.vx) > maxSpeed) {
            player.vx = player.vx >= 0 ? maxSpeed : -maxSpeed;
        }
    }

    /**
     * Resets the jump timer to allow immediate auto-jump
     * @returns {void}
     */
    resetJumpTimer(): void {
        this.lastJumpTime = getCurrentTime() - 150;
    }

    /**
     * Resets player to specified position and clears all state
     * @param {number} x - X coordinate to reset player to
     * @param {number} y - Y coordinate to reset player to
     * @returns {void}
     */
    reset(x: number, y: number): void {
        const player = this.gameState.runtime.player;
        player.x = x;
        player.y = y;
        player.vx = 0;
        player.vy = 0;
        player.grounded = false;

        this.hasMovedOnce = false;
        this.lastJumpTime = null;
    }

    /**
     * Gets whether the player has moved at least once
     * @returns {boolean} True if player has moved at least once, false otherwise
     */
    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

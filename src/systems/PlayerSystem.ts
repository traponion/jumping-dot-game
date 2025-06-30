/**
 * @fileoverview Player system for managing player movement, input processing, and trail management
 * @module systems/PlayerSystem
 * @description Domain Layer - Pure player logic and physics management using Zustand store
 */

import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { GameState } from '../stores/GameState.js';
import type { PhysicsConstants, TrailPoint } from '../types/GameTypes.js';
import { calculateDeltaFactor, getCurrentTime } from '../utils/GameUtils.js';
import type { InputManager } from './InputManager.js';

/**
 * Player system responsible for handling player movement, input processing, auto-jump mechanics, and trail management
 * @class PlayerSystem
 * @description Manages all player-related logic including movement, auto-jumping, and trail tracking through Zustand store
 */
export class PlayerSystem {
    /** @private {InputManager | null} Input manager instance for handling user input */
    private inputManager: InputManager | null = null;

    /** @private {GameState} Game state instance for direct state access */
    private gameState: GameState;

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
     * Updates player system for the current frame
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @param {PhysicsConstants} physics - Physics constants for calculations
     * @returns {void}
     */
    update(deltaTime: number, physics: PhysicsConstants): void {
        const dtFactor = calculateDeltaFactor(deltaTime, physics.gameSpeed);

        this.handleInput(dtFactor);
        this.handleAutoJump(physics);
        this.updateTrail();
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
     * Updates the player's trail by adding current position
     * @private
     * @returns {void}
     */
    private updateTrail(): void {
        const player = this.gameState.runtime.player;
        this.gameState.runtime.trail.push({ x: player.x, y: player.y });

        // Limit trail length
        if (this.gameState.runtime.trail.length > GAME_CONFIG.player.maxTrailLength) {
            this.gameState.runtime.trail.shift();
        }
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
     * Clears the player's trail by resetting it to empty array
     * @returns {void}
     */
    clearTrail(): void {
        this.gameState.runtime.trail.length = 0;
    }

    /**
     * Gets the current player trail points
     * @returns {TrailPoint[]} Array of trail points representing player's path
     */
    getTrail(): TrailPoint[] {
        return this.gameState.runtime.trail;
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
        this.gameState.runtime.trail.length = 0;
    }

    /**
     * Gets whether the player has moved at least once
     * @returns {boolean} True if player has moved at least once, false otherwise
     */
    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

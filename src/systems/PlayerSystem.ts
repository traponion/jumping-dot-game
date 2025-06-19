/**
 * @fileoverview Player system for managing player movement, input processing, and trail management
 * @module systems/PlayerSystem
 * @description Domain Layer - Pure player logic and physics management using Zustand store
 */

import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { PhysicsConstants, TrailPoint } from '../types/GameTypes.js';
import { calculateDeltaFactor, getCurrentTime } from '../utils/GameUtils.js';
import type { InputManager } from './InputManager.js';
import { getGameStore } from '../stores/GameZustandStore.js';

/**
 * Player system responsible for handling player movement, input processing, auto-jump mechanics, and trail management
 * @class PlayerSystem
 * @description Manages all player-related logic including movement, auto-jumping, and trail tracking through Zustand store
 */
export class PlayerSystem {
    /** @private {InputManager | null} Input manager instance for handling user input */
    private inputManager: InputManager | null = null;
    
    /** @private {boolean} Flag tracking if player has moved at least once */
    private hasMovedOnce = false;
    
    /** @private {number | null} Timestamp of the last auto-jump execution */
    private lastJumpTime: number | null = null;
    
    // Trail is now managed by Zustand store

    /**
     * Creates a new PlayerSystem instance
     * @constructor
     * @param {InputManager} [inputManager] - Optional input manager for handling user input
     */
    constructor(inputManager?: InputManager) {
        // Use Zustand store for all state management
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
        const gameStore = getGameStore();

        if (leftInput || rightInput) {
            // Use Zustand store actions to update player state
            gameStore.updatePlayerVelocity(leftInput ? 'left' : 'right', dtFactor);
            gameStore.markPlayerMoved();
            this.hasMovedOnce = true;
        }

        // Get updated player state from store
        const currentPlayer = gameStore.getPlayer();
        if (this.hasMovedOnce && Math.abs(currentPlayer.vx) < GAME_CONFIG.player.minVelocity) {
            // Apply minimum velocity (still need to implement this in store)
            // TODO: Add updatePlayerVelocityDirect action to store for this case
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

        const currentPlayer = getGameStore().getPlayer();
        if (currentPlayer.grounded && currentTime - this.lastJumpTime > physics.autoJumpInterval) {
            getGameStore().updatePlayer({
                vy: physics.jumpForce,
                grounded: false
            });
            this.lastJumpTime = currentTime;
        }
    }

    /**
     * Updates the player's trail by adding current position
     * @private
     * @returns {void}
     */
    private updateTrail(): void {
        const currentPlayer = getGameStore().getPlayer();
        getGameStore().addTrailPoint({ x: currentPlayer.x, y: currentPlayer.y });
    }

    /**
     * Clamps player speed to the specified maximum value
     * @param {number} maxSpeed - Maximum allowed speed value
     * @returns {void}
     */
    clampSpeed(maxSpeed: number): void {
        const currentPlayer = getGameStore().getPlayer();
        if (Math.abs(currentPlayer.vx) > maxSpeed) {
            getGameStore().updatePlayer({
                vx: currentPlayer.vx >= 0 ? maxSpeed : -maxSpeed
            });
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
        getGameStore().updateTrail([]);
    }

    /**
     * Gets the current player trail points
     * @returns {TrailPoint[]} Array of trail points representing player's path
     */
    getTrail(): TrailPoint[] {
        return getGameStore().runtime.trail;
    }

    /**
     * Resets player to specified position and clears all state
     * @param {number} x - X coordinate to reset player to
     * @param {number} y - Y coordinate to reset player to
     * @returns {void}
     */
    reset(x: number, y: number): void {
        getGameStore().updatePlayer({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            grounded: false
        });
        this.hasMovedOnce = false;
        this.lastJumpTime = null;
        getGameStore().updateTrail([]);
    }

    /**
     * Gets whether the player has moved at least once
     * @returns {boolean} True if player has moved at least once, false otherwise
     */
    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

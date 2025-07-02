/**
 * @fileoverview Physics system for player movement and gravity calculations
 * @module systems/PhysicsSystem
 * @description Domain Layer - Pure physics calculations for player movement
 */

import { DEFAULT_PHYSICS_CONSTANTS } from '../constants/GameConstants.js';
import type { GameState } from '../stores/GameState.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';

/**
 * Physics system responsible for applying gravity and movement calculations
 * @class PhysicsSystem
 * @description Handles all physics-related calculations for player movement
 */
export class PhysicsSystem {
    /** @private {PhysicsConstants} Current physics constants configuration */
    private constants: PhysicsConstants;

    /** @private {GameState} Game state instance for direct state access */
    private gameState: GameState;

    /**
     * Creates a new PhysicsSystem instance
     * @constructor
     * @param {GameState} gameState - Game state instance for state management
     * @param {PhysicsConstants} constants - Physics constants for calculations
     */
    constructor(gameState: GameState, constants: PhysicsConstants) {
        this.gameState = gameState;
        this.constants = constants;
    }

    /**
     * Updates physics calculations for the current frame
     * @param {number} deltaTime - Time elapsed since last update in milliseconds
     * @returns {void}
     */
    update(deltaTime: number): void {
        const dtFactor = (deltaTime / (1000 / 60)) * this.constants.gameSpeed;

        // Get current player state from game state
        const player = this.gameState.runtime.player;

        // Calculate physics updates
        const newVy = this.calculateGravity(player, dtFactor);
        const newPosition = this.calculatePosition(player, newVy, dtFactor);

        // Update game state with new values
        player.x = newPosition.x;
        player.y = newPosition.y;
        player.vy = newVy;

        // Clamp horizontal velocity to maximum speed
        const maxSpeed = this.constants.moveSpeed;
        if (player.vx > maxSpeed) player.vx = maxSpeed;
        if (player.vx < -maxSpeed) player.vx = -maxSpeed;
    }

    /**
     * Calculates gravity effect on player velocity
     * @private
     * @param {Player} player - Current player state
     * @param {number} dtFactor - Delta time factor for frame-rate independent calculations
     * @returns {number} New vertical velocity after gravity application
     */
    private calculateGravity(player: Player, dtFactor: number): number {
        if (!player.grounded) {
            return player.vy + this.constants.gravity * dtFactor;
        }
        return player.vy;
    }

    /**
     * Calculates new player position based on velocity
     * @private
     * @param {Player} player - Current player state
     * @param {number} newVy - New vertical velocity
     * @param {number} dtFactor - Delta time factor for frame-rate independent calculations
     * @returns {{ x: number, y: number }} New position coordinates
     */
    private calculatePosition(
        player: Player,
        newVy: number,
        dtFactor: number
    ): { x: number; y: number } {
        return {
            x: player.x + player.vx * dtFactor,
            y: player.y + newVy * dtFactor
        };
    }

    /**
     * Gets a copy of current physics constants
     * @returns {PhysicsConstants} Copy of current physics constants
     */
    getPhysicsConstants(): PhysicsConstants {
        return { ...this.constants };
    }

    /**
     * Updates physics constants with new values
     * @param {Partial<PhysicsConstants>} newConstants - New constants to apply
     * @returns {void}
     */
    updateConstants(newConstants: Partial<PhysicsConstants>): void {
        this.constants = { ...this.constants, ...newConstants };
    }

    /**
     * Resets physics constants to default values
     * @returns {void}
     */
    resetConstants(): void {
        this.constants = { ...DEFAULT_PHYSICS_CONSTANTS };
    }
}

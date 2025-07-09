import type { GameState } from '../stores/GameState.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
import {
    type PlayerPhysicsState,
    copyPhysicsConstants,
    resetPhysicsConstants,
    updatePhysicsConstants,
    updatePlayerPhysics
} from '../utils/PhysicsUtils.js';

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
        const player = this.gameState.runtime.player;

        // Convert to pure state
        const playerState: PlayerPhysicsState = {
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            radius: player.radius,
            grounded: player.grounded
        };

        // Apply pure physics calculations
        const updatedState = updatePlayerPhysics(playerState, this.constants, deltaTime);

        // Update game state
        Object.assign(player, updatedState);
    }

    /**
     * Gets a copy of current physics constants
     * @returns {PhysicsConstants} Copy of current physics constants
     */
    getPhysicsConstants(): PhysicsConstants {
        return copyPhysicsConstants(this.constants);
    }

    /**
     * Updates physics constants with new values
     * @param {Partial<PhysicsConstants>} newConstants - New constants to apply
     * @returns {void}
     */
    updateConstants(newConstants: Partial<PhysicsConstants>): void {
        this.constants = updatePhysicsConstants(this.constants, newConstants);
    }

    /**
     * Resets physics constants to default values
     * @returns {void}
     */
    resetConstants(): void {
        this.constants = resetPhysicsConstants();
    }
}

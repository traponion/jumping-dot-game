/**
 * @fileoverview Dynamic element system for managing all dynamic stage elements
 * @module systems/DynamicElementSystem
 * @description Domain Layer - Unified management for moving spikes, falling ceilings, breakable platforms
 */

import type { FallingCeiling, MovingSpike } from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';

/**
 * Unified dynamic element management system
 * Follows the successful MovingPlatformSystem pattern for autonomous system design
 *
 * @class DynamicElementSystem
 * @description Manages state transitions for all dynamic stage elements
 */
export class DynamicElementSystem {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Unified update interface following MovingPlatformSystem pattern
     * Updates all dynamic elements in a single autonomous system
     *
     * @param deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime: number): void {
        // Ensure gameState access is established for future phases
        if (deltaTime < 0 || !this.gameState.stage) {
            return; // Invalid deltaTime or no stage loaded
        }

        // Phase 3: Update moving spikes
        this._updateMovingSpikes(deltaTime);

        // Phase 5: Update falling ceilings
        this._updateFallingCeilings(deltaTime);

        // Future phases will add:
        // - this._updateBreakablePlatforms(); (state-based, no deltaTime needed)
    }

    /**
     * Updates moving spikes position and direction
     * Implements boundary collision detection similar to MovingPlatformSystem
     * Supports both horizontal and vertical movement based on axis property
     *
     * @param deltaTime - Time elapsed since last update in milliseconds
     * @private
     */
    private _updateMovingSpikes(deltaTime: number): void {
        const movingSpikes = this.gameState.stage?.movingSpikes;
        if (!movingSpikes) return;

        const dtFactor = deltaTime / 16.67; // Normalize to ~60fps

        for (const spike of movingSpikes) {
            const movement = spike.speed * spike.direction * dtFactor;

            if (spike.axis === 'horizontal') {
                this._updateHorizontalSpike(spike, movement);
            } else if (spike.axis === 'vertical') {
                this._updateVerticalSpike(spike, movement);
            }
        }
    }

    /**
     * Updates horizontal moving spike position with boundary collision
     * @param spike - Moving spike to update
     * @param movement - Movement delta for this frame
     * @private
     */
    private _updateHorizontalSpike(spike: MovingSpike, movement: number): void {
        let newX = spike.x + movement;
        let newDirection = spike.direction;

        // Check boundaries and reverse direction if needed
        if (newDirection > 0 && newX >= spike.endX) {
            newDirection = -1;
            // Correct position to not exceed boundary
            const overshoot = newX - spike.endX;
            newX = spike.endX - overshoot;
        } else if (newDirection < 0 && newX <= spike.startX) {
            newDirection = 1;
            // Correct position to not exceed boundary
            const overshoot = spike.startX - newX;
            newX = spike.startX + overshoot;
        }

        // Direct mutation of GameState (following MovingPlatformSystem pattern)
        spike.x = newX;
        spike.direction = newDirection;
    }

    /**
     * Updates vertical moving spike position with boundary collision
     * @param spike - Moving spike to update
     * @param movement - Movement delta for this frame
     * @private
     */
    private _updateVerticalSpike(spike: MovingSpike, movement: number): void {
        let newY = spike.y + movement;
        let newDirection = spike.direction;

        // Check boundaries and reverse direction if needed
        if (newDirection > 0 && newY >= spike.endY) {
            newDirection = -1;
            // Correct position to not exceed boundary
            const overshoot = newY - spike.endY;
            newY = spike.endY - overshoot;
        } else if (newDirection < 0 && newY <= spike.startY) {
            newDirection = 1;
            // Correct position to not exceed boundary
            const overshoot = spike.startY - newY;
            newY = spike.startY + overshoot;
        }

        // Direct mutation of GameState (following MovingPlatformSystem pattern)
        spike.y = newY;
        spike.direction = newDirection;
    }

    /**
     * Updates falling ceilings position and activation state
     * Monitors player position for trigger activation
     *
     * @param deltaTime - Time elapsed since last update in milliseconds
     * @private
     */

    private _updateFallingCeilings(deltaTime: number): void {
        const fallingCeilings = this.gameState.stage?.fallingCeilings;
        if (!fallingCeilings) return;

        const dtFactor = deltaTime / 16.67; // Normalize to ~60fps
        const player = this.gameState.runtime.player;

        for (const ceiling of fallingCeilings) {
            // Find runtime state for this ceiling
            const runtimeState = this.gameState.runtime.dynamicElements.fallingCeilings.find(
                (state) => state.id === ceiling.id
            );

            if (!runtimeState) continue;

            // Check trigger activation
            this._checkCeilingTrigger(ceiling, runtimeState, player);

            // Update falling physics if activated
            if (runtimeState.activated) {
                this._updateCeilingFalling(ceiling, runtimeState, dtFactor);
            }
        }
    }

    /**
     * Checks if player is in trigger zone and activates ceiling
     * @param ceiling - Falling ceiling stage data
     * @param runtimeState - Runtime state for this ceiling
     * @param player - Player object
     * @private
     */
    private _checkCeilingTrigger(
        ceiling: FallingCeiling,
        runtimeState: { id: string; activated: boolean; currentY: number; originalY: number },
        player: { x: number; y: number; vx: number; vy: number; radius: number; grounded: boolean }
    ): void {
        // Don't reactivate already activated ceilings
        if (runtimeState.activated) return;

        // Check if player is within trigger zone
        const playerInTriggerZone =
            player.x >= ceiling.triggerX && player.x <= ceiling.triggerX + ceiling.triggerWidth;

        if (playerInTriggerZone) {
            runtimeState.activated = true;
            console.log(`🪨 Falling ceiling ${ceiling.id} activated! Player in trigger zone.`);
        }
    }

    /**
     * Updates falling ceiling position based on fall speed
     * @param ceiling - Falling ceiling stage data
     * @param runtimeState - Runtime state for this ceiling
     * @param dtFactor - Delta time factor for frame rate normalization
     * @private
     */
    private _updateCeilingFalling(
        ceiling: FallingCeiling,
        runtimeState: { id: string; activated: boolean; currentY: number; originalY: number },
        dtFactor: number
    ): void {
        // Only fall if not yet at stop position
        if (runtimeState.currentY < ceiling.stopY) {
            const fallAmount = ceiling.fallSpeed * dtFactor;
            const newY = runtimeState.currentY + fallAmount;

            // Don't exceed stop position
            runtimeState.currentY = Math.min(newY, ceiling.stopY);

            if (runtimeState.currentY === ceiling.stopY) {
                console.log(`🛑 Falling ceiling ${ceiling.id} stopped at Y=${ceiling.stopY}`);
            }
        }
    }

    /**
     * Updates breakable platform state based on hit counts
     * State-based updates, no deltaTime dependency
     *
     * @private
     */
    // @ts-ignore - Method for Phase 4 implementation
    private _updateBreakablePlatforms(): void {
        // Phase 4 implementation placeholder
        // Will process hit counts and broken states
        // Handle regeneration timers if implemented
    }
}

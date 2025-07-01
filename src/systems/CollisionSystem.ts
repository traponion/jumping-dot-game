/**
 * @fileoverview Collision detection system for game objects
 * @module systems/CollisionSystem
 * @description Domain Layer - Pure collision detection calculations
 */

import type { Goal, MovingPlatform, Platform, Spike } from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';
import type { Player } from '../types/GameTypes.js';
import { isCircleRectCollision } from '../utils/GameUtils.js';

/**
 * Extended collision result that includes platform reference for moving platforms
 */
export interface MovingPlatformCollisionResult extends Partial<Player> {
    platform?: MovingPlatform;
}

/**
 * Collision detection system for handling all game object collisions
 * @class CollisionSystem
 * @description Provides collision detection methods for platforms, spikes, goals, and boundaries
 */
export class CollisionSystem {
    private gameState: GameState;
    private prevPlayerY = 0;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.prevPlayerY = 0;
    }

    /**
     * Checks collision between player and a single platform
     * @param {Player} player - Current player state
     * @param {Platform} platform - Platform to check collision against
     * @param {number} prevPlayerFootY - Previous player foot Y position for movement detection
     * @returns {Partial<Player> | null} Player state updates if collision occurred, null otherwise
     */
    checkPlatformCollision(
        player: Player,
        platform: Platform,
        prevPlayerFootY: number
    ): Partial<Player> | null {
        const currentPlayerFootY = player.y + player.radius;

        // Basic horizontal overlap check
        if (
            player.x + player.radius <= platform.x1 ||
            player.x - player.radius >= platform.x2 ||
            player.vy < 0 // Don't collide when moving upward
        ) {
            return null;
        }

        // Enhanced collision detection for high-speed movement
        // Check if player crossed the platform during this frame
        const wasPreviouslyAbove = prevPlayerFootY <= platform.y1;
        const isCurrentlyBelowOrOn = currentPlayerFootY >= platform.y1;

        if (wasPreviouslyAbove && isCurrentlyBelowOrOn) {
            // Return collision update object instead of directly modifying player
            return {
                y: platform.y1 - player.radius,
                vy: 0,
                grounded: true
            };
        }

        return null;
    }

    /**
     * Handles collisions with multiple platforms
     * @param {Platform[]} platforms - Array of platforms to check
     * @param {number} prevPlayerFootY - Previous player foot Y position
     * @returns {Partial<Player> | null} Player state updates if any collision occurred
     */
    handlePlatformCollisions(
        platforms: Platform[],
        prevPlayerFootY: number
    ): Partial<Player> | null {
        const player = this.gameState.runtime.player;
        let collisionResult: Partial<Player> | null = { grounded: false }; // Start with grounded reset

        for (const platform of platforms) {
            const collisionUpdate = this.checkPlatformCollision(player, platform, prevPlayerFootY);
            if (collisionUpdate) {
                // Merge the collision update with the grounded reset
                collisionResult = { ...collisionResult, ...collisionUpdate };
                return collisionResult; // Return the first collision found
            }
        }

        // If no collision found, return just the grounded reset
        return collisionResult;
    }

    /**
     * Checks collision between player and a single spike
     * @param {Player} player - Current player state
     * @param {Spike} spike - Spike to check collision against
     * @returns {boolean} True if collision detected
     */
    checkSpikeCollision(player: Player, spike: Spike): boolean {
        return isCircleRectCollision(
            player.x,
            player.y,
            player.radius,
            spike.x,
            spike.y,
            spike.width,
            spike.height
        );
    }

    /**
     * Checks collisions with multiple spikes
     * @param {Player} player - Current player state
     * @param {Spike[]} spikes - Array of spikes to check
     * @returns {boolean} True if any spike collision detected
     */
    checkSpikeCollisions(player: Player, spikes: Spike[]): boolean {
        for (const spike of spikes) {
            if (this.checkSpikeCollision(player, spike)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks collision between player and goal area
     * @param {Player} player - Current player state
     * @param {Goal} goal - Goal area to check
     * @returns {boolean} True if player reached the goal
     */
    checkGoalCollision(player: Player, goal: Goal): boolean {
        return isCircleRectCollision(
            player.x,
            player.y,
            player.radius,
            goal.x,
            goal.y,
            goal.width,
            goal.height
        );
    }

    /**
     * Checks if player has fallen into a hole
     * @param {Player} player - Current player state
     * @param {number} holeThreshold - Y coordinate threshold for hole detection
     * @returns {boolean} True if player fell into hole
     */
    checkHoleCollision(player: Player, holeThreshold: number): boolean {
        return player.y > holeThreshold;
    }

    /**
     * Checks if player has gone beyond stage boundaries
     * @param {Player} player - Current player state
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {boolean} True if player is beyond boundaries
     */
    checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
        return player.y > canvasHeight + 100;
    }

    /**
     * Checks collision between player and a moving platform
     * Same logic as static platform but returns platform reference
     *
     * @param player - Player object to check collision for
     * @param movingPlatform - Moving platform to check collision against
     * @param prevPlayerFootY - Previous Y position of player's foot
     * @returns Collision result with platform reference or null if no collision
     */
    checkMovingPlatformCollision(
        player: Player,
        movingPlatform: MovingPlatform,
        prevPlayerFootY: number
    ): MovingPlatformCollisionResult | null {
        const currentPlayerFootY = player.y + player.radius;

        // Basic horizontal overlap check (same as static platform)
        if (
            player.x + player.radius <= movingPlatform.x1 ||
            player.x - player.radius >= movingPlatform.x2 ||
            player.vy < 0 // Don't collide when moving upward
        ) {
            return null;
        }

        // Enhanced collision detection for high-speed movement
        // Check if player crossed the platform during this frame
        const wasPreviouslyAbove = prevPlayerFootY <= movingPlatform.y1;
        const isCurrentlyBelowOrOn = currentPlayerFootY >= movingPlatform.y1;

        if (wasPreviouslyAbove && isCurrentlyBelowOrOn) {
            // Return collision update object with platform reference
            return {
                y: movingPlatform.y1 - player.radius,
                vy: 0,
                grounded: true,
                platform: movingPlatform
            };
        }

        return null;
    }

    /**
     * Handles collisions with multiple moving platforms
     * Similar to handlePlatformCollisions but for moving platforms
     *
     * @param movingPlatforms - Array of moving platforms to check
     * @param prevPlayerFootY - Previous Y position of player's foot
     * @returns Collision result with platform reference or grounded reset
     */
    handleMovingPlatformCollisions(
        movingPlatforms: MovingPlatform[],
        prevPlayerFootY: number
    ): MovingPlatformCollisionResult | null {
        const player = this.gameState.runtime.player;

        for (const movingPlatform of movingPlatforms) {
            const collisionUpdate = this.checkMovingPlatformCollision(
                player,
                movingPlatform,
                prevPlayerFootY
            );
            if (collisionUpdate) {
                // Return the first collision found
                return collisionUpdate;
            }
        }

        // If no collision found, return null (don't interfere with other collision systems)
        return null;
    }

    /**
     * Gets the previous player Y position
     * @returns {number} Previous player Y position
     */
    getPrevPlayerY(): number {
        return this.prevPlayerY;
    }

    /**
     * Updates the previous player Y position with current player position
     */
    updatePrevPlayerY(): void {
        this.prevPlayerY = this.gameState.runtime.player.y;
    }
}

/**
 * @fileoverview Collision detection system for game objects
 * @module systems/CollisionSystem
 * @description Domain Layer - Pure collision detection calculations
 */

import type { MovingPlatform, Platform } from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';
import type { Player } from '../types/GameTypes.js';
import {
    type MovingPlatformCollisionResult,
    checkBoundaryCollision,
    checkGoalCollision,
    checkHoleCollision,
    checkMovingPlatformCollision,
    checkPlatformCollision,
    checkSpikeCollisions
} from '../utils/CollisionUtils.js';

// Interface for PlayerSystem methods used by CollisionSystem
interface IPlayerSystem {
    resetJumpTimer(): void;
}

// Interface for RenderSystem methods used by CollisionSystem
interface IRenderSystem {
    addLandingHistory(x: number, y: number): void;
}

/**
 * Collision detection system for handling all game object collisions
 * @class CollisionSystem
 * @description Provides collision detection methods for platforms, spikes, goals, and boundaries
 */
export class CollisionSystem {
    private gameState: GameState;
    private canvas: HTMLCanvasElement | undefined;
    private prevPlayerY = 0;

    constructor(gameState: GameState, canvas?: HTMLCanvasElement) {
        this.gameState = gameState;
        this.canvas = canvas;
        // FIXED: Initialize with current player position instead of 0
        this.prevPlayerY = this.gameState.runtime.player.y;
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
            const collisionUpdate = checkPlatformCollision(player, platform, prevPlayerFootY);
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
            const collisionUpdate = checkMovingPlatformCollision(
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

    /**
     * Autonomous collision update - directly mutates GameState
     * Replaces GameManager.handleCollisions() logic
     * @param playerSystem - Player system for jump timer reset
     * @param renderSystem - Render system for landing history
     * @param deathHandler - Optional death handler callback
     * @param goalHandler - Optional goal reached handler callback
     */
    update(
        playerSystem?: IPlayerSystem,
        renderSystem?: IRenderSystem,
        deathHandler?: () => void,
        goalHandler?: () => void
    ): void {
        const stage = this.gameState.stage;
        if (!stage) return;

        const player = this.gameState.runtime.player;
        const prevPlayerFootY = this.prevPlayerY + player.radius;

        // Reset collision results at the start of each frame
        this.gameState.runtime.collisionResults.holeCollision = false;
        this.gameState.runtime.collisionResults.boundaryCollision = false;
        this.gameState.runtime.collisionResults.goalCollision = false;

        // Check boundary conditions and set flags
        const canvasHeight = this.canvas?.height ?? 600; // Fallback to 600 for backwards compatibility
        this.gameState.runtime.collisionResults.holeCollision = checkHoleCollision(
            player,
            canvasHeight
        );
        this.gameState.runtime.collisionResults.boundaryCollision = checkBoundaryCollision(
            player,
            canvasHeight
        );

        // Check goal collision and set flag
        this.gameState.runtime.collisionResults.goalCollision = checkGoalCollision(
            player,
            stage.goal
        );

        // Handle moving platform collisions first (higher priority)
        if (stage.movingPlatforms && stage.movingPlatforms.length > 0) {
            const movingPlatformCollisionUpdate = this.handleMovingPlatformCollisions(
                stage.movingPlatforms,
                prevPlayerFootY
            );

            if (movingPlatformCollisionUpdate) {
                // FIXED: Use Object.assign to ensure all properties are set properly
                Object.assign(this.gameState.runtime.player, movingPlatformCollisionUpdate);

                if (
                    movingPlatformCollisionUpdate.grounded &&
                    movingPlatformCollisionUpdate.platform &&
                    playerSystem
                ) {
                    playerSystem.resetJumpTimer();

                    // Move player with the platform
                    const movingPlatform = movingPlatformCollisionUpdate.platform;
                    const dtFactor = 16.67 / 16.67; // Normalize deltaTime
                    const platformMovement =
                        movingPlatform.speed * movingPlatform.direction * dtFactor;

                    this.gameState.runtime.player.x += platformMovement;

                    // Add landing history
                    if (renderSystem) {
                        renderSystem.addLandingHistory(
                            this.gameState.runtime.player.x,
                            this.gameState.runtime.player.y + this.gameState.runtime.player.radius
                        );
                    }
                }

                // Skip static platform collision check
                this.updatePrevPlayerY();
                return;
            }
        }

        // Handle static platform collisions
        const platformCollisionUpdate = this.handlePlatformCollisions(
            stage.platforms,
            prevPlayerFootY
        );

        // FIXED: Always apply platform collision result (including grounded: false)
        Object.assign(this.gameState.runtime.player, platformCollisionUpdate);

        if (platformCollisionUpdate?.grounded && playerSystem) {
            playerSystem.resetJumpTimer();

            if (renderSystem) {
                renderSystem.addLandingHistory(
                    this.gameState.runtime.player.x,
                    this.gameState.runtime.player.y + this.gameState.runtime.player.radius
                );
            }
        }

        // Check spike collisions
        if (checkSpikeCollisions(this.gameState.runtime.player, stage.spikes)) {
            if (deathHandler) {
                deathHandler();
            }
            this.updatePrevPlayerY();
            return;
        }

        // Check goal collision (legacy callback support)
        if (this.gameState.runtime.collisionResults.goalCollision) {
            if (goalHandler) {
                goalHandler();
            }
            this.updatePrevPlayerY();
            return;
        }

        // Update previous player Y for next frame
        this.updatePrevPlayerY();
    }
}

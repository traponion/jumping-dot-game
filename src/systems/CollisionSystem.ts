/**
 * @fileoverview Collision detection system for game objects
 * @module systems/CollisionSystem
 * @description Domain Layer - Pure collision detection calculations
 */

import type { Goal, MovingPlatform, Platform, Spike } from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';
import type { Player } from '../types/GameTypes.js';
import { isCircleRectCollision } from './PlayerSystem.js';

// Interface for PlayerSystem methods used by CollisionSystem
interface IPlayerSystem {
    resetJumpTimer(): void;
}

// Interface for RenderSystem methods used by CollisionSystem
interface IRenderSystem {
    addLandingHistory(x: number, y: number): void;
}

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
    private canvas: HTMLCanvasElement | undefined;
    private prevPlayerY = 0;

    constructor(gameState: GameState, canvas?: HTMLCanvasElement) {
        this.gameState = gameState;
        this.canvas = canvas;
        // FIXED: Initialize with current player position instead of 0
        this.prevPlayerY = this.gameState.runtime.player.y;
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
        this.gameState.runtime.collisionResults.holeCollision = this.checkHoleCollision(
            player,
            canvasHeight
        );
        this.gameState.runtime.collisionResults.boundaryCollision = this.checkBoundaryCollision(
            player,
            canvasHeight
        );

        // Check goal collision and set flag
        this.gameState.runtime.collisionResults.goalCollision = this.checkGoalCollision(
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
        if (this.checkSpikeCollisions(this.gameState.runtime.player, stage.spikes)) {
            console.log('🌡️ Spike collision detected!', {
                playerX: this.gameState.runtime.player.x,
                playerY: this.gameState.runtime.player.y,
                spikeCount: stage.spikes?.length || 0,
                deathHandlerExists: !!deathHandler
            });
            if (deathHandler) {
                console.log('💀 Calling deathHandler...');
                deathHandler();
                console.log('💀 deathHandler called!');
            } else {
                console.log('❌ No deathHandler provided!');
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

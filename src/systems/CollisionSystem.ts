/**
 * @fileoverview Collision detection system for game objects
 * @module systems/CollisionSystem
 * @description Domain Layer - Pure collision detection calculations
 */

import type {
    BreakablePlatform,
    FallingCeiling,
    Goal,
    GravityFlipPlatform,
    MovingPlatform,
    MovingSpike,
    Platform,
    Spike,
    StageData
} from '../core/StageLoader.js';
import type { GameState } from '../stores/GameState.js';
import type { Player } from '../types/GameTypes.js';
import type { PhysicsSystem } from './PhysicsSystem.js';
import { isCircleRectCollision } from './PlayerSystem.js';

// Interface for PlayerSystem methods used by CollisionSystem
interface IPlayerSystem {
    resetJumpTimer(): void;
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
    // @ts-ignore - canvas used by StaticCollisionHandler during Phase 1
    private canvas: HTMLCanvasElement | undefined;
    private prevPlayerY = 0;
    private staticCollisionHandler: StaticCollisionHandler;
    private dynamicCollisionHandler: DynamicCollisionHandler;

    constructor(gameState: GameState, physicsSystem?: PhysicsSystem, canvas?: HTMLCanvasElement) {
        this.gameState = gameState;
        this.canvas = canvas;
        // FIXED: Initialize with current player position instead of 0
        this.prevPlayerY = this.gameState.runtime.player.y;

        // Initialize collision handlers
        this.staticCollisionHandler = new StaticCollisionHandler(gameState, physicsSystem, canvas);
        this.dynamicCollisionHandler = new DynamicCollisionHandler(gameState);
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
        return this.staticCollisionHandler.checkPlatformCollision(
            player,
            platform,
            prevPlayerFootY
        );
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
        return this.staticCollisionHandler.handlePlatformCollisions(platforms, prevPlayerFootY);
    }

    /**
     * Checks collision between player and a single spike
     * @param {Player} player - Current player state
     * @param {Spike} spike - Spike to check collision against
     * @returns {boolean} True if collision detected
     */
    checkSpikeCollision(player: Player, spike: Spike): boolean {
        return this.staticCollisionHandler.checkSpikeCollision(player, spike);
    }

    /**
     * Checks collisions with multiple spikes
     * @param {Player} player - Current player state
     * @param {Spike[]} spikes - Array of spikes to check
     * @returns {boolean} True if any spike collision detected
     */
    checkSpikeCollisions(player: Player, spikes: Spike[]): boolean {
        return this.staticCollisionHandler.checkSpikeCollisions(player, spikes);
    }

    /**
     * Checks collision between player and goal area
     * @param {Player} player - Current player state
     * @param {Goal} goal - Goal area to check
     * @returns {boolean} True if player reached the goal
     */
    checkGoalCollision(player: Player, goal: Goal): boolean {
        return this.staticCollisionHandler.checkGoalCollision(player, goal);
    }

    /**
     * Checks if player has fallen into a hole
     * @param {Player} player - Current player state
     * @param {number} holeThreshold - Y coordinate threshold for hole detection
     * @returns {boolean} True if player fell into hole
     */
    checkHoleCollision(player: Player, holeThreshold: number): boolean {
        return this.staticCollisionHandler.checkHoleCollision(player, holeThreshold);
    }

    /**
     * Checks if player has gone beyond stage boundaries
     * @param {Player} player - Current player state
     * @param {number} canvasHeight - Height of the game canvas
     * @returns {boolean} True if player is beyond boundaries
     */
    checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
        return this.staticCollisionHandler.checkBoundaryCollision(player, canvasHeight);
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
        return this.dynamicCollisionHandler.checkMovingPlatformCollision(
            player,
            movingPlatform,
            prevPlayerFootY
        );
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
        return this.dynamicCollisionHandler.handleMovingPlatformCollisions(
            movingPlatforms,
            prevPlayerFootY
        );
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
        _renderSystem?: unknown,
        deathHandler?: () => void,
        goalHandler?: () => void
    ): void {
        const stage = this.gameState.stage;
        if (!stage) return;

        const player = this.gameState.runtime.player;
        const prevPlayerFootY = this.prevPlayerY + player.radius;

        // Reset collision results at the start of each frame
        this.staticCollisionHandler.resetCollisionFlags();

        // Check boundary conditions and set flags
        this.staticCollisionHandler.checkBoundaryConditions(player);

        // Check goal collision and set flag
        this.staticCollisionHandler.checkGoalCondition(player, stage.goal);

        // Handle dynamic platform collisions first (higher priority)
        const dynamicCollisionResult = this.dynamicCollisionHandler.handleDynamicCollisions(
            stage,
            prevPlayerFootY,
            playerSystem
        );

        if (dynamicCollisionResult) {
            // Dynamic collision handled, skip static collision check
            this.updatePrevPlayerY();
            return;
        }

        // Handle static collisions
        const staticCollisionResult = this.staticCollisionHandler.handleStaticCollisions(
            stage,
            prevPlayerFootY,
            playerSystem,
            deathHandler,
            goalHandler
        );

        if (staticCollisionResult) {
            // Static collision handled (death or goal)
            this.updatePrevPlayerY();
            return;
        }

        // Update previous player Y for next frame
        this.updatePrevPlayerY();
    }
}

/**
 * Handles all static collision detection and response
 * Manages platforms, spikes, goal, boundaries, and holes
 */
class StaticCollisionHandler {
    private gameState: GameState;
    private canvas: HTMLCanvasElement | undefined;
    private physicsSystem: PhysicsSystem | undefined;

    constructor(gameState: GameState, physicsSystem?: PhysicsSystem, canvas?: HTMLCanvasElement) {
        this.gameState = gameState;
        this.physicsSystem = physicsSystem;
        this.canvas = canvas;
    }

    /**
     * Resets collision result flags at the start of each frame
     */
    resetCollisionFlags(): void {
        this.gameState.runtime.collisionResults.holeCollision = false;
        this.gameState.runtime.collisionResults.boundaryCollision = false;
        this.gameState.runtime.collisionResults.goalCollision = false;
    }

    /**
     * Checks boundary conditions and updates collision flags
     * @param player - Current player state
     */
    checkBoundaryConditions(player: Player): void {
        const canvasHeight = this.canvas?.height ?? 600; // Fallback to 600 for backwards compatibility
        this.gameState.runtime.collisionResults.holeCollision = this.checkHoleCollision(
            player,
            canvasHeight
        );
        this.gameState.runtime.collisionResults.boundaryCollision = this.checkBoundaryCollision(
            player,
            canvasHeight
        );
    }

    /**
     * Checks goal condition and updates collision flag
     * @param player - Current player state
     * @param goal - Goal area
     */
    checkGoalCondition(player: Player, goal: Goal): void {
        this.gameState.runtime.collisionResults.goalCollision = this.checkGoalCollision(
            player,
            goal
        );
    }

    /**
     * Handles all static collisions (platforms, spikes, goal)
     * @param stage - Current stage data
     * @param prevPlayerFootY - Previous player foot Y position
     * @param playerSystem - Player system for jump timer reset
     * @param deathHandler - Death handler callback
     * @param goalHandler - Goal handler callback
     * @returns true if collision handled (death/goal), false to continue processing
     */
    handleStaticCollisions(
        stage: StageData,
        prevPlayerFootY: number,
        playerSystem?: IPlayerSystem,
        deathHandler?: () => void,
        goalHandler?: () => void
    ): boolean {
        // Handle static platform collisions
        const platformCollisionUpdate = this.handlePlatformCollisions(
            stage.platforms,
            prevPlayerFootY
        );

        // FIXED: Always apply platform collision result (including grounded: false)
        Object.assign(this.gameState.runtime.player, platformCollisionUpdate);

        if (platformCollisionUpdate?.grounded && playerSystem) {
            playerSystem.resetJumpTimer();
        }

        // Check static spike collisions
        if (this.checkSpikeCollisions(this.gameState.runtime.player, stage.spikes)) {
            console.log('🌡️ Static spike collision detected!', {
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
            return true; // Collision handled
        }

        // Check moving spike collisions (death on contact)
        if (stage.movingSpikes && stage.movingSpikes.length > 0) {
            // Use DynamicCollisionHandler for moving spike detection
            const dynamicHandler = new DynamicCollisionHandler(this.gameState);
            if (
                dynamicHandler.checkMovingSpikeCollisions(
                    this.gameState.runtime.player,
                    stage.movingSpikes
                )
            ) {
                console.log('⚡ Moving spike collision detected!', {
                    playerX: this.gameState.runtime.player.x,
                    playerY: this.gameState.runtime.player.y,
                    movingSpikeCount: stage.movingSpikes?.length || 0,
                    deathHandlerExists: !!deathHandler
                });
                if (deathHandler) {
                    console.log('💀 Calling deathHandler...');
                    deathHandler();
                    console.log('💀 deathHandler called!');
                } else {
                    console.log('❌ No deathHandler provided!');
                }
                return true; // Collision handled
            }
        }

        // Check falling ceiling collisions (crush detection)
        if (stage.fallingCeilings) {
            const crushDetected = this.checkFallingCeilingCollisions(stage.fallingCeilings);
            if (crushDetected && deathHandler) {
                console.log('🪨 Falling ceiling crush detected!');
                deathHandler();
                return true; // Collision handled
            }
        }

        // Check gravity flip platform collisions
        if (stage.gravityFlipPlatforms) {
            this.handleGravityFlipPlatformCollisions(stage.gravityFlipPlatforms, prevPlayerFootY);
        }

        // Check goal collision (legacy callback support)
        if (this.gameState.runtime.collisionResults.goalCollision) {
            if (goalHandler) {
                goalHandler();
            }
            return true; // Collision handled
        }

        return false; // No collision handled
    }

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

    checkSpikeCollisions(player: Player, spikes: Spike[]): boolean {
        for (const spike of spikes) {
            if (this.checkSpikeCollision(player, spike)) {
                return true;
            }
        }
        return false;
    }

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

    checkHoleCollision(player: Player, holeThreshold: number): boolean {
        return player.y > holeThreshold;
    }

    checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
        // Check lower boundary (normal gravity fall)
        if (player.y > canvasHeight + 100) {
            return true;
        }

        // Check upper boundary (reversed gravity fall)
        if (player.y < -100) {
            return true;
        }

        return false;
    }

    /**
     * Handles collisions with gravity flip platforms
     * @param gravityFlipPlatforms - Array of gravity flip platforms to check
     * @param prevPlayerFootY - Previous player foot Y position
     * @returns void - Applies gravity direction changes as side effect
     */
    private handleGravityFlipPlatformCollisions(
        gravityFlipPlatforms: GravityFlipPlatform[],
        prevPlayerFootY: number
    ): void {
        const player = this.gameState.runtime.player;

        for (const platform of gravityFlipPlatforms) {
            const collisionUpdate = this.checkPlatformCollision(player, platform, prevPlayerFootY);
            if (collisionUpdate && this.physicsSystem) {
                // Player landed on gravity flip platform - change gravity direction
                this.physicsSystem.setGravityDirection(platform.gravityDirection);
                break; // Only apply one gravity change per frame
            }
        }
    }

    /**
     * Checks collisions with falling ceilings for crush detection
     * @param fallingCeilings - Array of falling ceilings to check
     * @returns true if player is crushed by falling ceiling
     */
    private checkFallingCeilingCollisions(fallingCeilings: FallingCeiling[]): boolean {
        const player = this.gameState.runtime.player;

        for (const ceiling of fallingCeilings) {
            // Find runtime state for this ceiling
            const runtimeState = this.gameState.runtime.dynamicElements.fallingCeilings.find(
                (state) => state.id === ceiling.id
            );

            if (!runtimeState?.activated) continue;

            // Only check collision if ceiling is falling (not stopped)
            if (runtimeState.currentY >= ceiling.stopY) continue;

            // Check if player is under falling ceiling
            const playerUnderCeiling =
                player.x + player.radius >= ceiling.x &&
                player.x - player.radius <= ceiling.x + ceiling.width &&
                player.y + player.radius >= runtimeState.currentY &&
                player.y - player.radius <= runtimeState.currentY + ceiling.height;

            if (playerUnderCeiling) {
                console.log(`💥 Player crushed by falling ceiling ${ceiling.id}!`, {
                    playerX: player.x,
                    playerY: player.y,
                    ceilingX: ceiling.x,
                    ceilingY: runtimeState.currentY,
                    ceilingWidth: ceiling.width,
                    ceilingHeight: ceiling.height
                });
                return true;
            }
        }

        return false;
    }
}

/**
 * Handles all dynamic collision detection and response
 * Manages moving platforms and future dynamic elements
 */
class DynamicCollisionHandler {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Handles all dynamic collisions (moving platforms, future dynamic elements)
     * @param stage - Current stage data
     * @param prevPlayerFootY - Previous player foot Y position
     * @param playerSystem - Player system for jump timer reset
     * @returns true if dynamic collision handled, false to continue with static collisions
     */
    handleDynamicCollisions(
        stage: StageData,
        prevPlayerFootY: number,
        playerSystem?: IPlayerSystem
    ): boolean {
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
                }

                return true; // Dynamic collision handled
            }
        }

        // Handle breakable platform collisions
        if (stage.breakablePlatforms && stage.breakablePlatforms.length > 0) {
            const breakableCollisionHandled = this.handleBreakablePlatformCollisions(
                stage.breakablePlatforms,
                prevPlayerFootY
            );

            if (breakableCollisionHandled && playerSystem) {
                playerSystem.resetJumpTimer();
                return true; // Dynamic collision handled
            }
        }

        // Future dynamic elements will be added here
        // - Moving spikes (handled by StaticCollisionHandler for death detection)
        // - Falling ceilings

        return false; // No dynamic collision handled
    }

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
     * Checks collisions with multiple moving spikes
     * @param player - Current player state
     * @param movingSpikes - Array of moving spikes to check
     * @returns true if any moving spike collision detected
     */
    checkMovingSpikeCollisions(player: Player, movingSpikes: MovingSpike[]): boolean {
        for (const spike of movingSpikes) {
            if (this.checkMovingSpikeCollision(player, spike)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks collision between player and a single moving spike
     * @param player - Current player state
     * @param spike - Moving spike to check collision against
     * @returns true if collision detected
     */
    private checkMovingSpikeCollision(player: Player, spike: MovingSpike): boolean {
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
     * Handles collisions with breakable platforms
     * @param breakablePlatforms - Array of breakable platforms to check
     * @param prevPlayerFootY - Previous player foot Y position
     * @returns boolean - true if collision detected and handled, false otherwise
     */
    private handleBreakablePlatformCollisions(
        breakablePlatforms: BreakablePlatform[],
        prevPlayerFootY: number
    ): boolean {
        const player = this.gameState.runtime.player;

        for (const platform of breakablePlatforms) {
            // Find runtime state for this platform
            const runtimeState = this.gameState.runtime.dynamicElements.breakablePlatforms.find(
                (state) => state.id === platform.id
            );

            // Skip collision if platform is broken
            if (runtimeState?.broken) {
                continue;
            }

            // Check for collision using existing platform collision logic
            const collisionUpdate = this.checkPlatformCollision(player, platform, prevPlayerFootY);
            if (collisionUpdate) {
                // Apply collision (player lands on platform)
                Object.assign(this.gameState.runtime.player, collisionUpdate);

                // Increment hit count if runtime state exists
                if (runtimeState) {
                    runtimeState.currentHits++;

                    // Check if platform should break
                    if (runtimeState.currentHits >= runtimeState.maxHits) {
                        runtimeState.broken = true;
                        console.log(
                            `💥 Breakable platform ${platform.id} broken after ${runtimeState.currentHits} hits!`
                        );
                    } else {
                        console.log(
                            `🔨 Breakable platform ${platform.id} hit! (${runtimeState.currentHits}/${runtimeState.maxHits})`
                        );
                    }
                }

                return true; // Collision handled successfully
            }
        }

        return false; // No collision handled
    }

    /**
     * Checks platform collision (reused from StaticCollisionHandler logic)
     * @param player - Current player state
     * @param platform - Platform to check collision against
     * @param prevPlayerFootY - Previous player foot Y position
     * @returns Collision update object or null
     */
    private checkPlatformCollision(
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
}

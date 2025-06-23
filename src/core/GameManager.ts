/**
 * @fileoverview Game manager for coordinating all game systems and state
 * @module core/GameManager
 * @description Application Layer - Game systems coordination and state management
 */

import { DEFAULT_PHYSICS_CONSTANTS, GAME_CONFIG } from '../constants/GameConstants.js';
import { gameStore, getGameStore } from '../stores/GameZustandStore.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import type { FabricRenderSystem } from '../systems/FabricRenderSystem.js';
import { InputManager } from '../systems/InputManager.js';
import type { GameController } from '../systems/InputManager.js';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import { createGameRenderSystem } from '../systems/RenderSystemFactory.js';
import type { GameState, PhysicsConstants } from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import type { GameUI } from './GameUI.js';
import { type Platform, type StageData, StageLoader } from './StageLoader.js';

/**
 * GameManager - Manages game state, systems coordination, and game logic
 * @class GameManager
 * @description Application Layer - Orchestrates all game systems and manages game state
 *
 * Responsibilities:
 * - Game state management and transitions
 * - Systems initialization and coordination
 * - Game logic (collisions, boundaries, scoring)
 * - Stage loading and management
 * - Player lifecycle (death, goal, restart)
 *
 * This class follows Single Responsibility Principle by handling only game logic and state management.
 */
export class GameManager {
    /** @private {HTMLCanvasElement} The main game canvas */
    private canvas: HTMLCanvasElement;
    /** @private {any} Game controller reference for system initialization */
    private gameController: GameController;

    // Systems
    /** @private {PlayerSystem} Player input and movement system */
    private playerSystem!: PlayerSystem;
    /** @private {PhysicsSystem} Physics calculations system */
    private physicsSystem!: PhysicsSystem;
    /** @private {CollisionSystem} Collision detection system */
    private collisionSystem!: CollisionSystem;
    /** @private {AnimationSystem} Animation and visual effects system */
    private animationSystem!: AnimationSystem;
    /** @private {MovingPlatformSystem} Moving platform management system */
    private movingPlatformSystem!: MovingPlatformSystem;
    /** @private {FabricRenderSystem | MockRenderSystem} Rendering system */
    private renderSystem!:
        | FabricRenderSystem
        | import('../systems/MockRenderSystem.js').MockRenderSystem;
    /** @private {InputManager} Input handling system */
    private inputManager!: InputManager;

    // Stage
    /** @private {StageLoader} Stage data loading system */
    private stageLoader!: StageLoader;
    /** @private {StageData | null} Current stage data */
    private stage: StageData | null = null;

    // Game state tracking
    /** @private {number} Previous player Y position for collision detection */
    private prevPlayerY = 0;

    /**
     * Creates a new GameManager instance
     * @constructor
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {GameController} gameController - Game controller instance for UI integration
     */
    constructor(canvas: HTMLCanvasElement, gameController: GameController) {
        this.canvas = canvas;
        this.gameController = gameController;
        this.initializeEntities();
        this.initializeSystems(gameController);
    }

    private initializeEntities(): void {
        // Initialize Zustand store with default values
        gameStore.getState().reset();
        gameStore.getState().setCurrentStage(1);
        gameStore.getState().updateTimeRemaining(10);
        gameStore.getState().updatePlayer({
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: GAME_CONFIG.player.defaultRadius,
            grounded: false
        });
        gameStore.getState().updateCamera({ x: 0, y: 0 });

        this.stageLoader = new StageLoader();
    }

    private initializeSystems(gameController: GameController): void {
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        this.physicsSystem = new PhysicsSystem(physicsConstants);
        this.collisionSystem = new CollisionSystem();
        this.animationSystem = new AnimationSystem();
        this.movingPlatformSystem = new MovingPlatformSystem();
        // Environment-aware rendering system
        this.renderSystem = createGameRenderSystem(this.canvas);

        // Initialize InputManager with canvas and game controller
        this.inputManager = new InputManager(this.canvas, gameController);

        // Initialize PlayerSystem with InputManager
        this.playerSystem = new PlayerSystem(this.inputManager);
    }

    /**
     * Load a stage by number
     */
    async loadStage(stageNumber: number): Promise<void> {
        try {
            this.stage = await this.stageLoader.loadStageWithFallback(stageNumber);

            // Set timeLimit from stage data if available
            if (this.stage && this.stage.timeLimit !== undefined) {
                gameStore.getState().setTimeLimit(this.stage.timeLimit);
            } else {
                // Use default timeLimit from current store state
                const defaultTimeLimit = getGameStore().game.timeLimit;
                gameStore.getState().setTimeLimit(defaultTimeLimit);
            }
        } catch (error) {
            console.error('Failed to load stage:', error);
            this.stage = this.stageLoader.getHardcodedStage(stageNumber);

            // Set timeLimit from fallback stage data
            const fallbackTimeLimit = this.stage.timeLimit || getGameStore().game.timeLimit;
            gameStore.getState().setTimeLimit(fallbackTimeLimit);
        }
    }

    /**
     * Reset game state to initial values
     */
    async resetGameState(): Promise<void> {
        gameStore.getState().stopGame();
        gameStore.getState().updateTimeRemaining(getGameStore().game.timeLimit);
        gameStore.getState().restartGame();

        // Clean up all existing systems
        await this.cleanupSystems();

        // Reinitialize all systems with fresh instances
        this.initializeSystems(this.gameController);

        // Reload stage to get clean initial data
        const currentStageId = this.stage?.id || 1; // Use current stage ID or fallback to 1
        this.stage = await this.stageLoader.loadStageWithFallback(currentStageId);

        this.playerSystem.reset(100, 400);
        this.animationSystem.reset();

        gameStore.getState().updateCamera({ x: 0, y: 0 });

        // Clear inputs first before changing game state
        this.inputManager.clearInputs();
        this.prevPlayerY = 0;
    }

    /**
     * Start the game
     */
    startGame(): void {
        gameStore.getState().startGame();
        // Clear inputs on game start
        this.inputManager.clearInputs();
    }

    /**
     * Update game systems and logic
     */
    update(deltaTime: number): void {
        if (!getGameStore().isGameRunning() || getGameStore().isGameOver()) {
            this.animationSystem.updateClearAnimation();
            this.animationSystem.updateDeathAnimation();
            return;
        }

        this.updateSystems(deltaTime);
        this.handleCollisions();
        this.updateCamera();
        this.checkBoundaries();
        this.updateLandingPredictions();
    }

    private updateSystems(deltaTime: number): void {
        // Update input manager
        this.inputManager.update();

        const physicsConstants = this.physicsSystem.getPhysicsConstants();
        this.playerSystem.update(deltaTime, physicsConstants);

        this.physicsSystem.update(deltaTime);

        // Update moving platforms if stage has them
        if (this.stage?.movingPlatforms) {
            // Overwrite the old array with the new, updated array
            this.stage.movingPlatforms = this.movingPlatformSystem.update(
                this.stage.movingPlatforms,
                deltaTime
            );
        }

        // Use store action for clamping speed
        getGameStore().clampPlayerSpeed(physicsConstants.moveSpeed);

        this.animationSystem.updateClearAnimation();
        this.animationSystem.updateDeathAnimation();
    }

    private handleCollisions(): void {
        if (!this.stage) return;

        const player = getGameStore().getPlayer();
        const prevPlayerFootY = this.prevPlayerY + player.radius;

        // Handle moving platform collisions first (higher priority)
        if (this.stage.movingPlatforms && this.stage.movingPlatforms.length > 0) {
            const movingPlatformCollisionUpdate =
                this.collisionSystem.handleMovingPlatformCollisions(
                    this.stage.movingPlatforms,
                    prevPlayerFootY
                );

            if (movingPlatformCollisionUpdate) {
                // Apply collision update to player
                getGameStore().updatePlayer(movingPlatformCollisionUpdate);

                if (
                    movingPlatformCollisionUpdate.grounded &&
                    movingPlatformCollisionUpdate.platform
                ) {
                    this.playerSystem.resetJumpTimer();

                    // IMPORTANT: Move player with the platform!
                    const movingPlatform = movingPlatformCollisionUpdate.platform;
                    const dtFactor = 16.67 / 16.67; // Normalize deltaTime (should use actual deltaTime)
                    const platformMovement =
                        movingPlatform.speed * movingPlatform.direction * dtFactor;

                    // Get current player and apply platform movement
                    const currentPlayer = getGameStore().getPlayer();
                    getGameStore().updatePlayer({
                        x: currentPlayer.x + platformMovement
                    });

                    // Add landing history with updated position
                    const finalPlayer = getGameStore().getPlayer();
                    this.renderSystem.addLandingHistory(
                        finalPlayer.x,
                        finalPlayer.y + finalPlayer.radius
                    );
                }

                // Skip static platform collision check if moving platform collision found
                return;
            }
        }

        // Handle static platform collisions (only if no moving platform collision)
        const platformCollisionUpdate = this.collisionSystem.handlePlatformCollisions(
            this.stage.platforms,
            prevPlayerFootY
        );

        if (platformCollisionUpdate) {
            // GameManager is responsible for updating the store
            getGameStore().updatePlayer(platformCollisionUpdate);

            if (platformCollisionUpdate.grounded) {
                this.playerSystem.resetJumpTimer();
                // Get updated player state from store after collision
                const updatedPlayer = getGameStore().getPlayer();
                this.renderSystem.addLandingHistory(
                    updatedPlayer.x,
                    updatedPlayer.y + updatedPlayer.radius
                );
            }
        }

        // Get latest player state from store for other collision checks
        const latestPlayer = getGameStore().getPlayer();
        if (this.collisionSystem.checkSpikeCollisions(latestPlayer, this.stage.spikes)) {
            this.handlePlayerDeath('Hit by spike! Press R to restart');
            return;
        }

        if (this.collisionSystem.checkGoalCollision(latestPlayer, this.stage.goal)) {
            this.handleGoalReached();
            return;
        }
    }

    private updateCamera(): void {
        const player = getGameStore().getPlayer();
        gameStore
            .getState()
            .updateCamera({ x: player.x - this.canvas.width / 2, y: getGameStore().getCamera().y });
    }

    private checkBoundaries(): void {
        const player = getGameStore().getPlayer();
        if (this.collisionSystem.checkHoleCollision(player, 600)) {
            this.handlePlayerDeath('Fell into hole! Press R to restart', 'fall');
        } else if (this.collisionSystem.checkBoundaryCollision(player, this.canvas.height)) {
            this.handlePlayerDeath('Game Over - Press R to restart', 'fall');
        }
    }

    private updateLandingPredictions(): void {
        if (!this.stage) return;

        // Simple input-based prediction that grows from landing spot
        const inputKeys = this.inputManager.getMovementState();
        const futureDistance = this.calculateFutureMovement(inputKeys);
        const predictedX = getGameStore().getPlayer().x + futureDistance;

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

    private calculateFutureMovement(keys: Record<string, boolean>): number {
        // Estimate future movement for one jump (more realistic timing)
        const jumpDuration = 400; // Shorter, more realistic jump duration
        const baseMovement = getGameStore().getPlayer().vx * (jumpDuration / 16.67); // Movement during jump

        // Add smaller input-based movement
        let inputMovement = 0;
        if (keys.ArrowLeft) {
            inputMovement = -30; // Smaller left movement
        } else if (keys.ArrowRight) {
            inputMovement = 30; // Smaller right movement
        }

        return baseMovement + inputMovement;
    }

    private findNearestPlatform(targetX: number): Platform | null {
        if (!this.stage) return null;

        // Find platform that the player would likely land on
        let bestPlatform = null;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (const platform of this.stage.platforms) {
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
     * Handle player death
     */
    handlePlayerDeath(
        message: string,
        deathType = 'normal'
    ): { message: string; deathType: string } {
        gameStore.getState().gameOver();

        const player = getGameStore().getPlayer();
        const camera = getGameStore().getCamera();
        let deathMarkY = player.y;
        if (deathType === 'fall') {
            deathMarkY = camera.y + this.canvas.height - 20;
        }

        this.animationSystem.addDeathMark(player.x, deathMarkY);
        this.animationSystem.startDeathAnimation(player);
        this.playerSystem.clearTrail();

        return { message, deathType };
    }

    /**
     * Handle goal reached
     */
    handleGoalReached(): { finalScore: number } {
        gameStore.getState().gameOver();
        const finalScore = Math.ceil(getGameStore().getTimeRemaining());
        gameStore.getState().setFinalScore(finalScore);

        this.animationSystem.startClearAnimation(getGameStore().getPlayer());

        // Set up auto-return to stage select after clear animation
        setTimeout(() => {
            const event = new CustomEvent('requestStageSelect');
            if (typeof window.dispatchEvent === 'function') {
                window.dispatchEvent(event);
            }
        }, 3000);

        return { finalScore };
    }

    /**
     * Check if time is up
     */
    checkTimeUp(): boolean {
        const gameStartTime = getGameStore().game.gameStartTime;
        if (gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;
            const timeRemaining = Math.max(0, getGameStore().game.timeLimit - elapsedSeconds);
            gameStore.getState().updateTimeRemaining(timeRemaining);

            if (timeRemaining <= 0) {
                this.handlePlayerDeath('Time Up! Press R to restart');
                return true;
            }
        }
        return false;
    }

    /**
     * Update previous player position (for collision detection)
     */
    updatePrevPlayerY(): void {
        this.prevPlayerY = getGameStore().getPlayer().y;
    }

    /**
     * Render the game
     */
    render(ui?: GameUI): void {
        const renderer = this.renderSystem;

        renderer.clearCanvas();
        renderer.setDrawingStyle();
        renderer.applyCameraTransform(getGameStore().getCamera());

        if (this.stage) {
            renderer.renderStage(this.stage);
        }

        renderer.renderDeathMarks(getGameStore().runtime.deathMarks);

        if (getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            const player = getGameStore().getPlayer();
            renderer.renderTrail(this.playerSystem.getTrail(), player.radius);
            renderer.renderLandingPredictions();
            renderer.renderPlayer(player);
        }

        const deathAnim = this.animationSystem.getDeathAnimation();
        if (deathAnim.active) {
            renderer.renderDeathAnimation(deathAnim.particles);
        }

        const clearAnim = this.animationSystem.getClearAnimation();
        if (clearAnim.active && clearAnim.startTime) {
            const elapsed = getCurrentTime() - clearAnim.startTime;
            const progress = elapsed / clearAnim.duration;
            const player = getGameStore().getPlayer();
            renderer.renderClearAnimation(clearAnim.particles, progress, player.x, player.y);
        }

        renderer.restoreCameraTransform();

        // UI state-based rendering - consolidated in GameManager
        if (getGameStore().isGameOver()) {
            if (ui) {
                const menuData = ui.getGameOverMenuData();
                renderer.renderGameOverMenu(
                    menuData.options,
                    menuData.selectedIndex,
                    getGameStore().getFinalScore()
                );
            }
        } else if (!getGameStore().isGameRunning()) {
            renderer.renderStartInstruction();
        }

        renderer.renderCredits();

        // All rendering commands completed, now render everything
        renderer.renderAll();
    }

    /**
     * Render game over menu
     */
    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        if (this.renderSystem && 'renderGameOverMenu' in this.renderSystem) {
            (this.renderSystem as FabricRenderSystem).renderGameOverMenu(
                options,
                selectedIndex,
                finalScore
            );
        }
    }

    /**
     * Get current game state
     */
    getGameState(): GameState {
        return getGameStore().getGameState();
    }

    /**
     * Get current stage data
     */
    getCurrentStage(): StageData | null {
        return this.stage;
    }

    /**
     * Cleanup systems
     */
    async cleanup(): Promise<void> {
        this.inputManager.cleanup();

        // Cleanup render system to prevent canvas reinitialization issues
        if (this.renderSystem && 'cleanup' in this.renderSystem) {
            await (this.renderSystem as FabricRenderSystem).cleanup();
        }

        gameStore.getState().gameOver();
    }

    /**
     * Clean up all systems properly
     */
    private async cleanupSystems(): Promise<void> {
        this.inputManager.cleanup();
        if (this.renderSystem && 'cleanup' in this.renderSystem) {
            await (this.renderSystem as FabricRenderSystem).cleanup();
        }
    }
    /**
     * Get animation system (for external access)
     */
    getAnimationSystem(): AnimationSystem {
        return this.animationSystem;
    }

    /**
     * Get player system (for external access)
     */
    getPlayerSystem(): PlayerSystem {
        return this.playerSystem;
    }

    /**
     * Get input manager (for external access)
     */
    getInputManager(): InputManager {
        return this.inputManager;
    }
}

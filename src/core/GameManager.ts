/**
 * @fileoverview Game manager for coordinating all game systems and state
 * @module core/GameManager
 * @description Application Layer - Game systems coordination and state management
 */

import { DEFAULT_PHYSICS_CONSTANTS, GAME_CONFIG } from '../constants/GameConstants.js';
import type { GameState } from '../stores/GameState.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { GameRuleSystem } from '../systems/GameRuleSystem.js';
import type { IRenderSystem } from '../systems/IRenderSystem.js';
import { InputManager } from '../systems/InputManager.js';
import type { GameController } from '../systems/InputManager.js';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import { createGameRenderSystem } from '../systems/RenderSystemFactory.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import type { GameUI } from './GameUI.js';
import { type StageData, StageLoader } from './StageLoader.js';

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
    /** @private {HTMLElement} The main game container */
    private container: HTMLElement;
    /** @private {any} Game controller reference for system initialization */
    private gameController: GameController;
    /** @private {GameState} Game state instance */
    private gameState: GameState;

    // Systems
    /** @private {PlayerSystem} Player input and movement system */
    private playerSystem!: PlayerSystem;
    /** @private {PhysicsSystem} Physics calculations system */
    private physicsSystem!: PhysicsSystem;
    /** @private {CameraSystem} Camera positioning system */
    private cameraSystem!: CameraSystem;
    /** @private {CollisionSystem} Collision detection system */
    private collisionSystem!: CollisionSystem;
    /** @private {GameRuleSystem} Game rule enforcement system */
    private gameRuleSystem!: GameRuleSystem;
    /** @private {AnimationSystem} Animation and visual effects system */
    private animationSystem!: AnimationSystem;
    /** @private {MovingPlatformSystem} Moving platform management system */
    private movingPlatformSystem!: MovingPlatformSystem;
    /** @private {IRenderSystem} Rendering system */
    private renderSystem!: IRenderSystem;
    /** @private {InputManager} Input handling system */
    private inputManager!: InputManager;

    // Stage
    /** @private {StageLoader} Stage data loading system */
    private stageLoader!: StageLoader;
    /** @private {StageData | null} Current stage data */
    private stage: StageData | null = null;

    /**
     * Creates a new GameManager instance
     * @constructor
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {GameController} gameController - Game controller instance for UI integration
     */
    constructor(container: HTMLElement, gameController: GameController, gameState: GameState) {
        this.container = container;
        this.gameController = gameController;
        this.gameState = gameState;
        this.initializeEntities();
        this.initializeSystems(gameController);
    }

    private initializeEntities(): void {
        // Initialize GameState with default values
        this.gameState.currentStage = 1;
        this.gameState.timeRemaining = 10;
        Object.assign(this.gameState.runtime.player, {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: GAME_CONFIG.player.defaultRadius,
            grounded: false
        });
        this.gameState.runtime.camera.x = 0;
        this.gameState.runtime.camera.y = 0;

        this.stageLoader = new StageLoader();
    }

    private initializeSystems(gameController: GameController): void {
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        this.physicsSystem = new PhysicsSystem(this.gameState, physicsConstants);
        // Create canvas dimensions from container for camera system
        const canvasDimensions = { width: 800, height: 600 };
        this.cameraSystem = new CameraSystem(this.gameState, canvasDimensions);
        this.collisionSystem = new CollisionSystem(this.gameState);
        this.gameRuleSystem = new GameRuleSystem(this.gameState);
        this.animationSystem = new AnimationSystem(this.gameState);
        this.movingPlatformSystem = new MovingPlatformSystem(this.gameState);
        // Environment-aware rendering system
        this.renderSystem = createGameRenderSystem(this.container);

        // Initialize InputManager with canvas and game controller
        this.inputManager = new InputManager(this.gameState, this.container, gameController);

        // Initialize PlayerSystem with InputManager and inject render system
        this.playerSystem = new PlayerSystem(this.gameState, this.inputManager);
        this.playerSystem.setRenderSystem(this.renderSystem);
    }

    /**
     * Load a stage by number
     */
    async loadStage(stageNumber: number): Promise<void> {
        try {
            this.stage = await this.stageLoader.loadStageWithFallback(stageNumber);
            // Sync stage to GameState for CollisionSystem access
            this.gameState.stage = this.stage;

            // Set timeLimit from stage data if available
            if (this.stage && this.stage.timeLimit !== undefined) {
                this.gameState.timeLimit = this.stage.timeLimit;
                this.gameState.timeRemaining = this.stage.timeLimit; // Fix: Also update timeRemaining
            } else {
                // Use default timeLimit from current store state
                const defaultTimeLimit = this.gameState.timeLimit;
                this.gameState.timeLimit = defaultTimeLimit;
                this.gameState.timeRemaining = defaultTimeLimit; // Fix: Also update timeRemaining
            }
        } catch (error) {
            console.error('Failed to load stage:', error);
            this.stage = this.stageLoader.getHardcodedStage(stageNumber);
            // Sync stage to GameState for CollisionSystem access
            this.gameState.stage = this.stage;

            // Set timeLimit from fallback stage data
            const fallbackTimeLimit = this.stage.timeLimit || this.gameState.timeLimit;
            this.gameState.timeLimit = fallbackTimeLimit;
            this.gameState.timeRemaining = fallbackTimeLimit; // Fix: Also update timeRemaining
        }
    }

    /**
     * Reset game state to initial values
     */
    async resetGameState(): Promise<void> {
        this.gameState.gameRunning = false;
        this.gameState.gameStartTime = null;
        this.gameState.timeRemaining = this.gameState.timeLimit;
        this.gameState.gameOver = false;

        // Clean up all existing systems
        await this.cleanupSystems();

        // Reinitialize all systems with fresh instances
        this.initializeSystems(this.gameController);

        // Reload stage to get clean initial data
        const currentStageId = this.stage?.id || 1; // Use current stage ID or fallback to 1
        this.stage = await this.stageLoader.loadStageWithFallback(currentStageId);
        // Sync stage to GameState for CollisionSystem access
        this.gameState.stage = this.stage;

        this.playerSystem.reset(100, 400);
        this.animationSystem.reset();

        this.gameState.runtime.camera.x = 0;
        this.gameState.runtime.camera.y = 0;

        // Clear inputs first before changing game state
        this.inputManager.clearInputs();
    }

    /**
     * Start the game
     */
    startGame(): void {
        this.gameState.gameRunning = true;
        this.gameState.gameStartTime = getCurrentTime();
        // Clear inputs on game start
        this.inputManager.clearInputs();
    }

    /**
     * Update game systems and logic
     */
    update(deltaTime: number): void {
        // Always update camera system for smooth scrolling in all game states
        this.cameraSystem.update();

        if (!this.gameState.gameRunning || this.gameState.gameOver) {
            this.animationSystem.updateClearAnimation();
            this.animationSystem.updateDeathAnimation();
            this.animationSystem.updateSoulAnimation();
            return;
        }

        this.updateSystems(deltaTime);
        this.collisionSystem.update();
        this.gameRuleSystem.update();
    }

    private updateSystems(deltaTime: number): void {
        // Update input manager
        this.inputManager.update();

        const physicsConstants = this.physicsSystem.getPhysicsConstants();
        this.playerSystem.update(deltaTime, physicsConstants);

        this.physicsSystem.update(deltaTime);

        // Update moving platforms if stage has them
        this.movingPlatformSystem.update(deltaTime);

        this.animationSystem.updateClearAnimation();
        this.animationSystem.updateDeathAnimation();
        this.animationSystem.updateSoulAnimation();
    }

    /**
     * Render the game
     */
    render(ui?: GameUI): void {
        const renderer = this.renderSystem;

        renderer.clearCanvas();
        renderer.setDrawingStyle();
        renderer.applyCameraTransform(this.gameState.runtime.camera);

        if (this.stage) {
            renderer.renderStage(this.stage);
        }

        renderer.renderDeathMarks(this.gameState.runtime.deathMarks);

        if (this.gameState.gameRunning && !this.gameState.gameOver) {
            const player = this.gameState.runtime.player;
            renderer.renderTrail(this.playerSystem.getTrail(), player.radius);
            renderer.renderLandingPredictions();
            renderer.renderPlayer(player);
        }

        const deathAnim = this.animationSystem.getDeathAnimation();
        if (deathAnim.active) {
            renderer.renderDeathAnimation(deathAnim.particles);
        }

        const soulAnim = this.animationSystem.getSoulAnimation();
        if (soulAnim.active) {
            renderer.renderSoulAnimation(soulAnim.particles);
        }

        const clearAnim = this.animationSystem.getClearAnimation();
        if (clearAnim.active && clearAnim.startTime) {
            const elapsed = getCurrentTime() - clearAnim.startTime;
            const progress = elapsed / clearAnim.duration;
            const player = this.gameState.runtime.player;
            renderer.renderClearAnimation(clearAnim.particles, progress, player.x, player.y);
        }

        // Restore camera transform before UI rendering to ensure UI elements are in screen space
        renderer.restoreCameraTransform();

        // UI state-based rendering - consolidated in GameManager
        if (this.gameState.gameOver) {
            if (ui) {
                const menuData = ui.getGameOverMenuData();
                renderer.renderGameOverMenu(
                    menuData.options,
                    menuData.selectedIndex,
                    this.gameState.finalScore,
                    this.gameState.deathCount
                );
            }
        } else if (!this.gameState.gameRunning) {
            ui?.showStartScreen();
        }

        // Removed renderCredits() call - credits should not be displayed during gameplay
        // Credits should only be shown in specific menu screens, not during game

        // All rendering commands completed, now render everything
        renderer.renderAll();
    }

    /**
     * Render game over menu
     */
    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void {
        this.renderSystem.renderGameOverMenu(options, selectedIndex, finalScore, deathCount);
    }

    /**
     * Get current game state
     */
    getGameState(): GameState {
        return this.gameState;
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
        await this.renderSystem.cleanup();

        this.gameState.gameOver = true;
    }

    /**
     * Clean up all systems properly
     */
    private async cleanupSystems(): Promise<void> {
        this.inputManager.cleanup();
        await this.renderSystem.cleanup();
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

/**
 * Game manager for coordinating all game systems and state
 */

import { DEFAULT_PHYSICS_CONSTANTS, GAME_CONFIG } from '../stores/GameState.js';
import type { GameState } from '../stores/GameState.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { DynamicElementSystem } from '../systems/DynamicElementSystem.js';
import { GameRuleSystem } from '../systems/GameRuleSystem.js';
import { InputManager } from '../systems/InputManager.js';
import type { GameController } from '../systems/InputManager.js';
import { MovingPlatformSystem } from '../systems/PhysicsSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import type { IRenderSystem } from '../systems/PixiRenderSystem.js';
import { PixiRenderSystem } from '../systems/PixiRenderSystem.js';
import { CameraSystem } from '../systems/PlayerSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
// RenderSystemFactory merged here for simplification
import { MockRenderSystem } from '../test/mocks/MockRenderSystem.js';

/**
 * Creates appropriate render system based on environment
 */
function createGameRenderSystem(containerElement: HTMLElement) {
    // Environment detection for test vs production
    const isTestEnvironment =
        typeof globalThis.window === 'undefined' || globalThis.process?.env?.NODE_ENV === 'test';

    if (isTestEnvironment) {
        return new MockRenderSystem(containerElement);
    }
    return new PixiRenderSystem(containerElement);
}
import { getCurrentTime } from '../systems/PlayerSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
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
    /** @private {DynamicElementSystem} Dynamic element management system */
    private dynamicElementSystem!: DynamicElementSystem;
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
            y: 480, // Safe position above platform (platform is at y=500, radius=10)
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
        this.collisionSystem = new CollisionSystem(this.gameState, this.physicsSystem);
        this.gameRuleSystem = new GameRuleSystem(this.gameState);
        this.animationSystem = new AnimationSystem(this.gameState);
        this.movingPlatformSystem = new MovingPlatformSystem(this.gameState);
        this.dynamicElementSystem = new DynamicElementSystem(this.gameState);
        // Environment-aware rendering system
        this.renderSystem = createGameRenderSystem(this.container);

        // Initialize InputManager with canvas and game controller
        this.inputManager = new InputManager(this.gameState, this.container, gameController);

        // Initialize PlayerSystem with InputManager and inject render system
        this.playerSystem = new PlayerSystem(this.gameState, this.inputManager);
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

            // Initialize dynamic elements runtime state
            this.initializeDynamicElementsState();
        } catch (error) {
            console.error('Failed to load stage:', error);
            this.stage = this.stageLoader.getHardcodedStage(stageNumber);
            // Sync stage to GameState for CollisionSystem access
            this.gameState.stage = this.stage;

            // Set timeLimit from fallback stage data
            const fallbackTimeLimit = this.stage.timeLimit || this.gameState.timeLimit;
            this.gameState.timeLimit = fallbackTimeLimit;
            this.gameState.timeRemaining = fallbackTimeLimit; // Fix: Also update timeRemaining

            // Initialize dynamic elements runtime state
            this.initializeDynamicElementsState();
        }
    }

    /**
     * Initialize dynamic elements runtime state for the current stage
     */
    private initializeDynamicElementsState(): void {
        if (!this.stage) return;

        // Initialize breakable platforms runtime state
        this.gameState.runtime.dynamicElements.breakablePlatforms = [];
        if (this.stage.breakablePlatforms) {
            for (const platform of this.stage.breakablePlatforms) {
                this.gameState.runtime.dynamicElements.breakablePlatforms.push({
                    id: platform.id,
                    currentHits: 0,
                    broken: false,
                    maxHits: platform.maxHits
                });
            }
        }

        // Initialize falling ceilings runtime state
        this.gameState.runtime.dynamicElements.fallingCeilings = [];
        if (this.stage.fallingCeilings) {
            for (const ceiling of this.stage.fallingCeilings) {
                this.gameState.runtime.dynamicElements.fallingCeilings.push({
                    id: ceiling.id,
                    activated: false,
                    currentY: ceiling.y,
                    originalY: ceiling.y
                });
            }
        }

        // Initialize moving spikes runtime state
        this.gameState.runtime.dynamicElements.movingSpikes = [];
        if (this.stage.movingSpikes) {
            for (const spike of this.stage.movingSpikes) {
                this.gameState.runtime.dynamicElements.movingSpikes.push({
                    id: `moving-spike-${spike.x}-${spike.y}`, // Generate ID from position
                    currentX: spike.x,
                    currentY: spike.y,
                    direction: spike.direction
                });
            }
        }

        console.log('🔧 Dynamic elements initialized:', {
            breakablePlatforms: this.gameState.runtime.dynamicElements.breakablePlatforms.length,
            fallingCeilings: this.gameState.runtime.dynamicElements.fallingCeilings.length,
            movingSpikes: this.gameState.runtime.dynamicElements.movingSpikes.length
        });
    }

    /**
     * Filters out broken platforms from stage data for rendering
     * @param stage - Original stage data
     * @returns Stage data with broken platforms filtered out
     */
    private filterBrokenPlatforms(stage: StageData): StageData {
        if (!stage.breakablePlatforms) {
            return stage;
        }

        // Create a copy of stage with filtered breakable platforms
        const filteredBreakablePlatforms = stage.breakablePlatforms.filter((platform) => {
            const runtimeState = this.gameState.runtime.dynamicElements.breakablePlatforms.find(
                (state) => state.id === platform.id
            );
            return !runtimeState?.broken;
        });

        return {
            ...stage,
            breakablePlatforms: filteredBreakablePlatforms
        };
    }

    /**
     * Reset game state to initial values
     */
    async resetGameState(): Promise<void> {
        this.gameState.gameRunning = false;
        this.gameState.gameStartTime = null;
        this.gameState.timeRemaining = this.gameState.timeLimit;
        this.gameState.gameOver = false;
        this.gameState.gameCleared = false;

        // Clean up all existing systems
        await this.cleanupSystems();

        // Reinitialize most systems with fresh instances, but reuse renderSystem to prevent canvas duplication
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        this.physicsSystem = new PhysicsSystem(this.gameState, physicsConstants);
        // Create canvas dimensions from container for camera system
        const canvasDimensions = { width: 800, height: 600 };
        this.cameraSystem = new CameraSystem(this.gameState, canvasDimensions);
        this.collisionSystem = new CollisionSystem(this.gameState, this.physicsSystem);
        this.gameRuleSystem = new GameRuleSystem(this.gameState);
        this.animationSystem = new AnimationSystem(this.gameState);
        this.movingPlatformSystem = new MovingPlatformSystem(this.gameState);
        this.dynamicElementSystem = new DynamicElementSystem(this.gameState);
        // IMPORTANT: Do NOT recreate renderSystem to prevent canvas duplication
        // this.renderSystem is already initialized in constructor and should be reused

        // Initialize InputManager with canvas and game controller
        this.inputManager = new InputManager(this.gameState, this.container, this.gameController);

        // Initialize PlayerSystem with InputManager and inject render system
        this.playerSystem = new PlayerSystem(this.gameState, this.inputManager);

        // Reload stage to get clean initial data
        const currentStageId = this.stage?.id || 1; // Use current stage ID or fallback to 1
        this.stage = await this.stageLoader.loadStageWithFallback(currentStageId);
        // Sync stage to GameState for CollisionSystem access
        this.gameState.stage = this.stage;

        this.playerSystem.reset(100, 480); // Match the safe initial position
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
        this.collisionSystem.update(
            this.playerSystem,
            undefined, // Skip renderSystem for now due to interface mismatch
            () => this.gameRuleSystem.triggerPlayerDeath(), // Death handler
            () => this.gameRuleSystem.triggerGoalReached() // Goal handler
        );
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

        // Update dynamic elements (moving spikes, falling ceilings, breakable platforms)
        this.dynamicElementSystem.update(deltaTime);

        this.animationSystem.updateClearAnimation();
        this.animationSystem.updateDeathAnimation();
        this.animationSystem.updateSoulAnimation();
    }

    /**
     * Render the game
     */
    async render(ui?: GameUI): Promise<void> {
        const renderer = this.renderSystem;

        // Wait for PixiRenderSystem initialization before applying camera
        await renderer.waitForInitialization();

        renderer.clearCanvas();
        renderer.setDrawingStyle();
        renderer.applyCameraTransform(this.gameState.runtime.camera);

        if (this.stage) {
            // Create a copy of stage with broken platforms filtered out
            const renderStage = this.filterBrokenPlatforms(this.stage);
            renderer.renderStage(renderStage, this.gameState.runtime.camera);
        }

        renderer.renderDeathMarks(this.gameState.runtime.deathMarks);

        if (this.gameState.gameRunning && !this.gameState.gameOver) {
            const player = this.gameState.runtime.player;
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

        // ★★ No longer need restoreCameraTransform() - UI elements are now in separate uiContainer
        // worldContainer: affected by camera, uiContainer: fixed position

        // UI state management centralized in GameManager.render()
        if (ui) {
            if (this.gameState.gameCleared) {
                // Show congratulations screen with death count
                ui.showClearScreen(this.gameState.deathCount);
            } else if (this.gameState.gameOver) {
                // Show DOM-based game over screen only (Canvas version removed to prevent overlap)
                ui.showGameOverScreen();
            } else if (this.gameState.gameRunning) {
                // Show running game UI with timer and death count
                ui.updateUIVisibility(true, false);
            } else {
                // Show start screen
                ui.showStartScreen();
                ui.updateUIVisibility(false, false); // Hide running UI elements
            }
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

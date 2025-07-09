/**
 * @fileoverview Game manager for coordinating all game systems and state
 * @module core/GameManager
 * @description Application Layer - Game systems coordination and state management
 */

import type { GameState } from '../stores/GameState.js';
import type { GameController } from '../systems/InputManager.js';
import type { GameUI } from './GameUI.js';
import type { StageData } from './StageLoader.js';

import { GameManagerCore } from './GameManagerCore.js';
import { GameManagerInitialization, type GameSystems } from './GameManagerInitialization.js';
import { GameManagerRenderer } from './GameManagerRenderer.js';

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
    /** @private {GameState} Game state instance */
    private gameState: GameState;

    // Module instances
    /** @private {GameManagerInitialization} System initialization module */
    private initialization: GameManagerInitialization;
    /** @private {GameManagerRenderer} Rendering orchestration module */
    private renderer: GameManagerRenderer;
    /** @private {GameManagerCore} Game loop and lifecycle module */
    private core: GameManagerCore;

    // Systems (initialized by GameManagerInitialization)
    private systems!: GameSystems;

    // Stage
    /** @private {StageData | null} Current stage data */
    private stage: StageData | null = null;

    /**
     * Creates a new GameManager instance
     * @constructor
     * @param {HTMLCanvasElement} canvas - The game canvas element
     * @param {GameController} gameController - Game controller instance for UI integration
     * @param {GameState} gameState - Game state instance
     */
    constructor(canvas: HTMLCanvasElement, gameController: GameController, gameState: GameState) {
        this.gameState = gameState;

        // Initialize modules
        this.initialization = new GameManagerInitialization(canvas, gameController, gameState);

        // Initialize entities and systems
        this.initialization.initializeEntities();
        this.systems = this.initialization.initializeSystems();

        // Initialize renderer and core modules
        this.renderer = new GameManagerRenderer(
            gameState,
            this.systems.renderSystem,
            this.systems.animationSystem,
            this.systems.playerSystem
        );

        const stageLoader = this.initialization.getStageLoader();
        if (!stageLoader) {
            throw new Error('StageLoader initialization failed');
        }
        this.core = new GameManagerCore(gameState, this.systems, stageLoader);
    }

    /**
     * Update game state and all systems
     * @param {number} deltaTime - Time since last update in milliseconds
     */
    update(deltaTime: number): void {
        this.core.update(deltaTime);
    }

    /**
     * Render the game
     * @param {GameUI} [ui] - Optional UI instance for rendering UI elements
     */
    render(ui?: GameUI): void {
        this.renderer.render(ui, this.stage ?? undefined);
    }

    /**
     * Render game over menu
     * @param {GameUI} ui - UI instance for game over menu
     */
    renderGameOverMenu(ui: GameUI): void {
        this.renderer.renderGameOverMenu(ui);
    }

    /**
     * Load a stage by ID
     * @param {number} stageId - Stage ID to load
     * @returns {Promise<void>} Promise that resolves when stage is loaded
     */
    async loadStage(stageId: number): Promise<void> {
        this.stage = await this.core.loadStage(stageId);
    }

    /**
     * Start the game
     */
    startGame(): void {
        this.gameState.gameRunning = true;
    }

    /**
     * Reset game state to initial values
     * @returns {Promise<void>} Promise that resolves when game state is reset
     */
    async resetGameState(): Promise<void> {
        this.stage = await this.core.resetGameState();
    }

    /**
     * Get current game state
     * @returns {GameState} Current game state
     */
    getGameState(): GameState {
        return this.gameState;
    }

    /**
     * Get current stage
     * @returns {StageData | null} Current stage data
     */
    getCurrentStage(): StageData | null {
        return this.stage;
    }

    /**
     * Clean up resources
     * @returns {Promise<void>} Promise that resolves when cleanup is complete
     */
    async cleanup(): Promise<void> {
        await this.core.cleanup();
    }

    /**
     * Get animation system
     * @returns {AnimationSystem} Animation system instance
     */
    getAnimationSystem() {
        return this.systems.animationSystem;
    }

    /**
     * Get player system
     * @returns {PlayerSystem} Player system instance
     */
    getPlayerSystem() {
        return this.systems.playerSystem;
    }

    /**
     * Get input manager
     * @returns {InputManager} Input manager instance
     */
    getInputManager() {
        return this.systems.inputManager;
    }
}

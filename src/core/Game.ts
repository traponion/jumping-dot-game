/**
 * @fileoverview Main game class orchestrating all game components
 * @module core/Game
 * @description Application Layer - Main game orchestrator and entry point
 */

import { getGameStore } from '../stores/GameZustandStore.js';
import type { GameState } from '../types/GameTypes.js';
import { CleanGameManager } from './CleanGameManager.js';
import { GameLoop } from './GameLoop.js';
import { GameUI } from './GameUI.js';

/**
 * Main game class that orchestrates all game components
 * @class JumpingDotGame
 * @description Entry point for the jumping dot game, coordinates UI, loop, and manager
 */
export class JumpingDotGame {
    /** @private {HTMLCanvasElement} Main game canvas */
    private canvas: HTMLCanvasElement;

    // Component classes following Single Responsibility Principle
    /** @private {GameUI} UI management component */
    private gameUI: GameUI;
    /** @private {GameLoop} Game loop timing component */
    private gameLoop: GameLoop;
    /** @private {CleanGameManager} Game logic management component */
    private gameManager: CleanGameManager;

    /**
     * Creates a new JumpingDotGame instance
     * @constructor
     */
    constructor() {
        this.canvas = this.getRequiredElement('gameCanvas') as HTMLCanvasElement;

        // Initialize component classes
        this.gameUI = new GameUI();
        this.gameLoop = new GameLoop();
        this.gameManager = new CleanGameManager(this.canvas);

        // Connect GameUI to GameManager for UI state management
        this.gameManager.setGameUI(this.gameUI);

        // Set up game loop callbacks
        this.gameLoop.setUpdateCallback((deltaTime) => this.update(deltaTime));
        this.gameLoop.setRenderCallback(() => this.render());

        // Set up GameManager callbacks
        this.setupGameManagerCallbacks();
    }

    /**
     * Gets a required DOM element by ID, throws error if not found
     * @private
     * @param {string} id - DOM element ID to find
     * @returns {HTMLElement} The found DOM element
     * @throws {Error} If element is not found
     */
    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required DOM element with id "${id}" not found`);
        }
        return element;
    }

    /**
     * Initializes the game and loads the first stage
     * @async
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        this.gameLoop.resetCleanupState(); // Reset cleanup flag
        this.gameUI.showLoading();

        await this.gameManager.initialize();
        await this.gameManager.loadStage(getGameStore().getCurrentStage());

        this.gameUI.showReadyToStart();
        // Reset handled automatically by CleanGameManager
        this.gameUI.updateInitialUI();

        // Input management handled by CleanGameManager

        this.gameLoop.start();
    }

    async initWithStage(stageId: number): Promise<void> {
        getGameStore().setCurrentStage(stageId);
        this.gameUI.showLoading();

        await this.gameManager.initialize();
        await this.gameManager.loadStage(stageId);

        this.gameUI.showReadyToStart();
        // Reset handled automatically by CleanGameManager
        this.gameUI.updateInitialUI();

        // Input management handled by CleanGameManager

        this.gameLoop.start();
    }

    public startGame(): void {
        this.gameManager.startGame();
        // GameUI.showPlaying() is now handled by CleanGameManager
    }

    private update(_deltaTime: number): void {
        // Update timer UI if game is running
        const pixiGameState = this.gameManager.getPixiGameState();
        const isGameRunning = pixiGameState
            ? pixiGameState.isGameRunning()
            : getGameStore().isGameRunning();
        const isGameOver = pixiGameState ? pixiGameState.isGameOver() : getGameStore().isGameOver();

        if (isGameRunning && !isGameOver) {
            this.gameUI.updateTimer(pixiGameState);

            // Check for time up
            if (this.gameManager.checkTimeUp()) {
                this.gameUI.showPlayerDeath('Time Up! Press R to restart');
                return;
            }
        }

        // CleanGameManager handles updates via PixiJS ticker automatically
    }

    private setupGameManagerCallbacks(): void {
        // These callbacks would be set if GameManager supported them
        // For now, using the existing event-driven approach through store state
    }

    public returnToStageSelect(): void {
        this.gameUI.requestStageSelect();
    }

    public getGameState(): GameState {
        // CleanGameManager uses PixiGameState instead of legacy GameState
        const pixiGameState = this.gameManager.getPixiGameState();
        if (!pixiGameState) {
            throw new Error('PixiGameState not initialized');
        }

        // Convert PixiGameState to legacy GameState format
        return {
            gameRunning: pixiGameState.isGameRunning(),
            gameOver: pixiGameState.isGameOver(),
            currentStage: getGameStore().getCurrentStage(),
            timeLimit: pixiGameState.getTimeLimit(),
            timeRemaining: pixiGameState.getTimeRemaining(),
            gameStartTime: pixiGameState.getGameStartTime(),
            finalScore: pixiGameState.getFinalScore(),
            hasMovedOnce: pixiGameState.hasPlayerMoved()
        };
    }

    public handleGameOverNavigation(direction: 'up' | 'down'): void {
        this.gameUI.handleGameOverNavigation(direction);
    }

    public handleGameOverSelection(): void {
        const pixiGameState = this.gameManager.getPixiGameState();
        if (!pixiGameState?.isGameOver()) return;

        const selectedOption = this.gameUI.getGameOverSelection();

        switch (selectedOption) {
            case 'RESTART STAGE':
                this.init();
                break;
            case 'STAGE SELECT':
                this.returnToStageSelect();
                break;
        }
    }

    private render(): void {
        // Prevent rendering if game loop has been cleaned up
        if (this.gameLoop.isCleanedUpState()) {
            return;
        }

        // Call CleanGameManager render for compatibility
        this.gameManager.render(this.gameUI);

        // Update UI visibility during gameplay
        if (getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            this.gameUI.updateUIVisibility(true, false);
        }
    }

    async cleanup(): Promise<void> {
        this.gameLoop.cleanup();
        await this.gameManager.destroy();
    }

    // Public methods for testing
    setGameOver(): void {
        getGameStore().gameOver();
    }

    setAnimationId(id: number): void {
        this.gameLoop.setAnimationId(id);
    }

    testUpdate(deltaTime = 16.67): void {
        this.update(deltaTime);
    }

    testRender(): void {
        this.render();
    }

    async testLoadStage(stageNumber: number): Promise<void> {
        await this.gameManager.loadStage(stageNumber);
    }
}

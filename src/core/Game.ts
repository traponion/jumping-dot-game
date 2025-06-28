/**
 * @fileoverview Main game class orchestrating all game components
 * @module core/Game
 * @description Application Layer - Main game orchestrator and entry point
 */

import { getGameStore } from '../stores/GameZustandStore.js';
import type { GameState } from '../types/GameTypes.js';
import { GameLoop } from './GameLoop.js';
import { GameManager } from './GameManager.js';
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
    /** @private {GameManager} Game logic management component */
    private gameManager: GameManager;

    /**
     * Creates a new JumpingDotGame instance
     * @constructor
     */
    constructor() {
        this.canvas = this.getRequiredElement('gameCanvas') as HTMLCanvasElement;

        // Initialize component classes
        this.gameUI = new GameUI();
        this.gameLoop = new GameLoop();
        this.gameManager = new GameManager(this.canvas, this);

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
        await this.gameManager.resetGameState();
        this.gameUI.updateInitialUI();

        // Clear inputs after a short delay
        setTimeout(() => {
            this.gameManager.getInputManager().clearInputs();
        }, 0);

        this.gameLoop.start();
    }

    async initWithStage(stageId: number): Promise<void> {
        getGameStore().setCurrentStage(stageId);
        this.gameUI.showLoading();

        await this.gameManager.loadStage(stageId);

        this.gameUI.showReadyToStart();
        await this.gameManager.resetGameState();
        this.gameUI.updateInitialUI();

        // Clear inputs after a short delay
        setTimeout(() => {
            this.gameManager.getInputManager().clearInputs();
        }, 0);

        this.gameLoop.start();
    }

    public startGame(): void {
        this.gameManager.startGame();
        this.gameUI.showPlaying();
    }

    private update(deltaTime: number): void {
        // Update timer UI if game is running
        if (getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            this.gameUI.updateTimer();

            // Check for time up
            if (this.gameManager.checkTimeUp()) {
                this.gameUI.showPlayerDeath('Time Up! Press R to restart');
                return;
            }
        }

        // Delegate main update logic to GameManager
        this.gameManager.update(deltaTime);

        // Update previous player position for next frame
        this.gameManager.updatePrevPlayerY();
    }

    private setupGameManagerCallbacks(): void {
        // These callbacks would be set if GameManager supported them
        // For now, using the existing event-driven approach through store state
    }

    public returnToStageSelect(): void {
        this.gameUI.requestStageSelect();
    }

    public getGameState(): GameState {
        return this.gameManager.getGameState();
    }

    public handleGameOverNavigation(direction: 'up' | 'down'): void {
        this.gameUI.handleGameOverNavigation(direction);
    }

    public handleGameOverSelection(): void {
        if (!getGameStore().isGameOver()) return;

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

        // Delegate all rendering to GameManager, including UI state management
        this.gameManager.render(this.gameUI);

        // Update UI visibility during gameplay
        if (getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            this.gameUI.updateUIVisibility(true, false);
        }
    }

    async cleanup(): Promise<void> {
        this.gameLoop.cleanup();
        await this.gameManager.cleanup();
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

/**
 * @fileoverview Pure PixiJS game implementation without external state management
 * @module core/PurePixiGame
 * @description Main game controller using PixiJS-native patterns and clean architecture
 */

import { Application } from 'pixi.js';
import { PixiGameState } from './PixiGameState.js';
import { StageLoader } from './StageLoader.js';

/**
 * Pure PixiJS game implementation
 * Replaces the Zustand-dependent game classes with clean PixiJS-native architecture
 */
export class PurePixiGame {
    private app: Application | null = null;
    private gameState: PixiGameState | null = null;
    private stageLoader: StageLoader;

    /**
     * Initialize PixiJS game instance
     */
    constructor() {
        this.stageLoader = new StageLoader();
    }

    /**
     * Initialize PixiJS application and game state
     * @returns Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        // Create PixiJS Application with recommended settings
        this.app = new Application();
        await this.app.init({
            width: 800,
            height: 600,
            backgroundColor: 0x000000, // Black background
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        // Mount canvas to DOM
        const gameContainer = document.getElementById('gameCanvas');
        if (!gameContainer) {
            throw new Error('Game canvas container not found in DOM');
        }

        // Clear existing canvas if any
        gameContainer.innerHTML = '';
        gameContainer.appendChild(this.app.canvas);

        // Initialize PixiJS-native game state
        this.gameState = new PixiGameState(this.app);

        console.log('🎮 PurePixiGame: PixiJS application initialized successfully');
    }

    /**
     * Initialize game with specific stage
     * @param stageId - Stage ID to load and start
     * @returns Promise that resolves when stage is loaded and game starts
     */
    async initWithStage(stageId: number): Promise<void> {
        if (!this.gameState) {
            throw new Error('Game state not initialized. Call init() first.');
        }

        try {
            // Load stage data with fallback support
            const stageData = await this.stageLoader.loadStageWithFallback(stageId);

            // Apply stage data to game state
            this.gameState.loadStageData(stageData);

            // Set time limit if specified in stage data
            if (stageData.timeLimit) {
                this.gameState.setTimeLimit(stageData.timeLimit);
            }

            // Start the game
            this.startGame();

            console.log(`🎮 PurePixiGame: Stage ${stageId} loaded and game started`);
        } catch (error) {
            console.error(`❌ Failed to initialize with stage ${stageId}:`, error);
            throw error;
        }
    }

    /**
     * Start the game session
     * @private
     */
    private startGame(): void {
        if (!this.gameState) {
            throw new Error('Game state not initialized');
        }

        this.gameState.startGame();

        // TODO: Add game loop integration (app.ticker)
        // TODO: Add input system integration
        // TODO: Add physics system integration

        console.log('🎮 PurePixiGame: Game session started');
    }

    /**
     * Pause the current game
     */
    pauseGame(): void {
        if (this.gameState) {
            this.gameState.pauseGame();
        }
    }

    /**
     * Resume the paused game
     */
    resumeGame(): void {
        if (this.gameState) {
            this.gameState.resumeGame();
        }
    }

    /**
     * Restart the game
     */
    restartGame(): void {
        if (this.gameState) {
            this.gameState.restartGame();
        }
    }

    /**
     * Stop and cleanup the game
     * @returns Promise that resolves when cleanup is complete
     */
    async cleanup(): Promise<void> {
        console.log('🎮 PurePixiGame: Starting cleanup...');

        // Cleanup game state first
        if (this.gameState) {
            this.gameState.destroy();
            this.gameState = null;
        }

        // Cleanup PixiJS application
        if (this.app) {
            await this.app.destroy({ removeView: true }, true);
            this.app = null;
        }

        // Clear DOM canvas container
        const gameContainer = document.getElementById('gameCanvas');
        if (gameContainer) {
            gameContainer.innerHTML = '';
        }

        console.log('🎮 PurePixiGame: Cleanup complete');
    }

    /**
     * Check if game is currently running
     */
    isGameRunning(): boolean {
        return this.gameState?.isGameRunning() ?? false;
    }

    /**
     * Check if game is over
     */
    isGameOver(): boolean {
        return this.gameState?.isGameOver() ?? false;
    }

    /**
     * Get current game state (for debugging or external integration)
     */
    getGameState(): PixiGameState | null {
        return this.gameState;
    }

    /**
     * Get PixiJS application instance (for debugging or external integration)
     */
    getApp(): Application | null {
        return this.app;
    }
}

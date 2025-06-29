import { Application } from 'pixi.js';
import { CollisionSystem } from '../systems/CollisionSystem';
import { InputManager } from '../systems/InputManager';
import { PlayerSystem } from '../systems/PlayerSystem';
import type { GameUI } from './GameUI';
import { PixiGameState } from './PixiGameState';
import { StageLoader } from './StageLoader';

/**
 * Clean PixiJS-centric GameManager - complete rewrite following PixiJS recommended patterns
 * Replaces the complex legacy GameManager with a simple, app.stage-centered design
 */
export class CleanGameManager {
    private app: Application;
    private pixiGameState: PixiGameState | null = null;
    private stageLoader: StageLoader;
    // TODO: Add input and player management
    private inputManager: InputManager | null = null;
    private playerSystem: PlayerSystem | null = null;
    private gameUI: GameUI | null = null;
    private collisionSystem: CollisionSystem;
    private isInitialized = false;
    private gameTickerFn: (() => void) | null = null;

    constructor(canvasElement: HTMLCanvasElement) {
        // PixiJS推奨パターン: Application instance creation
        this.app = new Application();

        // Initialize StageLoader
        this.stageLoader = new StageLoader();

        // Initialize CollisionSystem
        this.collisionSystem = new CollisionSystem();

        // TODO: Initialize InputManager and PlayerSystem for game interaction
        // Will be integrated after app.init() for proper canvas reference

        // Store canvas reference for later use
        this.setupApplicationOptions(canvasElement);
    }

    /**
     * Setup PixiJS Application with recommended options
     * @private
     */
    private setupApplicationOptions(canvas: HTMLCanvasElement): void {
        // Canvas will be handled during app.init()
        // Store reference for initialization
        (this as any).targetCanvas = canvas;
    }

    /**
     * Initialize PixiJS Application and game systems
     * Context7 confirmed pattern: async app.init() required
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            console.warn('🎮 CleanGameManager: Already initialized');
            return;
        }

        try {
            // PixiJS推奨パターン: async initialization with options
            await this.app.init({
                width: 800,
                height: 600,
                backgroundColor: 0x000000,
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                preference: 'webgl', // Context7 confirmed: webgl preferred
                canvas: (this as any).targetCanvas
            });

            // Initialize PixiJS-native game state
            this.pixiGameState = new PixiGameState(this.app);

            // TODO: Initialize input and player systems
            this.initializeInputSystems();

            // Setup game ticker (PixiJS recommended over external GameLoop)
            this.setupGameTicker();

            this.isInitialized = true;
            console.log('🎮 CleanGameManager: PixiJS initialization complete');
        } catch (error) {
            console.error('🚨 CleanGameManager: Initialization failed', error);
            throw error;
        }
    }

    /**
     * Initialize input and player management systems
     * @private
     */
    private initializeInputSystems(): void {
        if (!this.pixiGameState) {
            throw new Error('PixiGameState must be initialized before input systems');
        }

        // Create game controller interface for InputManager
        const gameController = {
            init: () => this.restartGame(),
            startGame: () => this.startGame(),
            returnToStageSelect: () => {
                // TODO: Implement return to stage select
                console.log('🎮 Return to stage select');
            },
            handleGameOverNavigation: (direction: 'up' | 'down') => {
                // TODO: Implement game over menu navigation
                console.log(`🎮 Game over navigation: ${direction}`);
            },
            handleGameOverSelection: () => {
                // TODO: Implement game over selection
                console.log('🎮 Game over selection');
            },
            getGameState: () => {
                if (!this.pixiGameState) {
                    return { gameRunning: false, gameOver: false, finalScore: 0 };
                }
                return {
                    gameRunning: this.pixiGameState.isGameRunning(),
                    gameOver: this.pixiGameState.isGameOver(),
                    finalScore: this.pixiGameState.getFinalScore()
                };
            }
        };

        // Initialize InputManager with proper canvas reference
        const canvas = (this as any).targetCanvas as HTMLCanvasElement;
        this.inputManager = new InputManager(canvas, gameController);

        // Set PixiGameState getter for InputManager
        this.inputManager.setPixiGameStateGetter(() => this.pixiGameState);

        // Initialize PlayerSystem with InputManager
        this.playerSystem = new PlayerSystem(this.inputManager);

        console.log('🎮 CleanGameManager: Input systems initialized');
    }

    /**
     * Setup game update loop using PixiJS ticker (recommended pattern)
     * @private
     */
    private setupGameTicker(): void {
        // PixiJS推奨: app.ticker for game loop instead of external systems
        this.gameTickerFn = () => {
            this.updateGame();
        };

        // Add ticker callback
        this.app.ticker.add(this.gameTickerFn);

        // Configure ticker for game performance
        this.app.ticker.maxFPS = 60;
        this.app.ticker.minFPS = 10;
    }

    /**
     * Core game update logic (called by PixiJS ticker)
     * @private
     */
    private updateGame(): void {
        if (!this.pixiGameState?.isGameRunning()) {
            return;
        }

        // Update input and player systems
        this.updateGameLogic();
        // Rendering handled automatically by PixiJS Application
    }

    /**
     * Game logic update including player movement and physics
     * @private
     */
    private updateGameLogic(): void {
        if (!(this.inputManager && this.playerSystem && this.pixiGameState)) {
            return;
        }

        // Update input system
        this.inputManager.update();

        // TODO: Add proper physics constants and delta time calculation
        const deltaTime = this.app.ticker.deltaMS;
        const physics = {
            gravity: 0.8,
            jumpForce: -12,
            autoJumpInterval: 1000, // 1 second
            moveSpeed: 5.0,
            gameSpeed: 1.0
        };

        // Update player system with physics
        this.playerSystem.update(deltaTime, physics);

        // Check time limit only when game is running
        if (this.pixiGameState.isGameRunning() && this.pixiGameState.isTimeUp()) {
            this.pixiGameState.gameOver();
        }

        // Handle collision detection
        this.handleCollisions();
    }

    /**
     * Handle all collision detection
     * @private
     */
    private handleCollisions(): void {
        if (!(this.pixiGameState && this.playerSystem)) return;

        const player = this.pixiGameState.getPlayer();
        const stageData = (this.pixiGameState as any).stageData;

        if (!(stageData && player)) return;

        // Handle platform collisions
        const prevPlayerFootY = player.y + player.radius;
        const platformCollisionUpdate = this.collisionSystem.handlePlatformCollisions(
            stageData.platforms || [],
            prevPlayerFootY
        );

        if (platformCollisionUpdate) {
            // Apply collision update to player
            this.pixiGameState.updatePlayer(platformCollisionUpdate);

            // Update PlayerSystem with collision result
            // TODO: Implement proper collision result application in PlayerSystem
            // if (this.playerSystem) {
            //     this.playerSystem.applyUpdate(platformCollisionUpdate);
            // }
        }

        // Get updated player state after platform collision
        const updatedPlayer = this.pixiGameState.getPlayer();

        // Check spike collisions (death)
        if (this.collisionSystem.checkSpikeCollisions(updatedPlayer, stageData.spikes || [])) {
            this.handlePlayerDeath();
            return;
        }

        // Check goal collision (win)
        if (
            stageData.goal &&
            this.collisionSystem.checkGoalCollision(updatedPlayer, stageData.goal)
        ) {
            this.handleGoalReached();
            return;
        }

        // Check boundary collisions (death)
        if (
            this.collisionSystem.checkBoundaryCollision(updatedPlayer, 600) ||
            this.collisionSystem.checkHoleCollision(updatedPlayer, 600)
        ) {
            this.handlePlayerDeath();
        }
    }

    /**
     * Handle player death
     * @private
     */
    private handlePlayerDeath(): void {
        if (!this.pixiGameState) return;

        const player = this.pixiGameState.getPlayer();

        // Add death mark for visual feedback
        this.pixiGameState.addDeathMark({ x: player.x, y: player.y, timestamp: Date.now() });

        // Trigger game over
        this.pixiGameState.gameOver();

        console.log('🎮 CleanGameManager: Player death');
    }

    /**
     * Handle goal reached
     * @private
     */
    private handleGoalReached(): void {
        if (!this.pixiGameState) return;

        // Calculate final score based on remaining time
        const finalScore = Math.ceil(this.pixiGameState.getTimeRemaining());
        this.pixiGameState.setFinalScore(finalScore);

        // Trigger game over (success)
        this.pixiGameState.gameOver();

        console.log('🎮 CleanGameManager: Goal reached! Score:', finalScore);
    }

    /**
     * Load and start a game stage
     */
    async loadStage(stageNumber: number): Promise<void> {
        if (!(this.isInitialized && this.pixiGameState)) {
            throw new Error('CleanGameManager not initialized');
        }

        try {
            // Load stage data using StageLoader
            const stageData = await this.stageLoader.loadStageWithFallback(stageNumber);

            // Apply stage time limit to PixiGameState
            if (stageData.timeLimit) {
                this.pixiGameState.setTimeLimit(stageData.timeLimit);
            }

            // Load stage data into PixiGameState for rendering
            this.pixiGameState.loadStageData(stageData);

            // Reset game state for new stage
            this.pixiGameState.restartGame();

            // Reset player system for new stage to default position
            if (this.playerSystem) {
                // TODO: Get proper start position from stage data
                const defaultStartX = 50;
                const defaultStartY = 400;
                this.playerSystem.reset(defaultStartX, defaultStartY);
            }

            console.log(`🎮 CleanGameManager: Stage ${stageNumber} loaded successfully`);
        } catch (error) {
            console.error(`🚨 CleanGameManager: Failed to load stage ${stageNumber}:`, error);
            throw error;
        }
    }

    /**
     * Start the game
     */
    startGame(): void {
        if (!this.pixiGameState) {
            throw new Error('CleanGameManager not initialized');
        }

        this.pixiGameState.startGame();

        // Update UI state to show game is running
        if (this.gameUI) {
            this.gameUI.showPlaying();
        }

        // PixiJS ticker already running, just enable game updates
        console.log('🎮 CleanGameManager: Game started');
    }

    /**
     * Stop/pause the game
     */
    stopGame(): void {
        if (!this.pixiGameState) return;

        this.pixiGameState.pauseGame();
        console.log('🎮 CleanGameManager: Game stopped');
    }

    /**
     * Restart current game
     */
    restartGame(): void {
        if (!this.pixiGameState) return;

        this.pixiGameState.restartGame();

        // Reset player system to default position
        if (this.playerSystem) {
            // TODO: Get proper start position from stage data
            const defaultStartX = 50;
            const defaultStartY = 400;
            this.playerSystem.reset(defaultStartX, defaultStartY);
        }

        console.log('🎮 CleanGameManager: Game restarted');
    }

    /**
     * Get PixiJS Application instance
     */
    getApp(): Application {
        return this.app;
    }

    /**
     * Get PixiGameState for external access
     */
    getPixiGameState(): PixiGameState | null {
        return this.pixiGameState;
    }

    /**
     * Set GameUI instance for UI state management
     */
    setGameUI(gameUI: GameUI): void {
        this.gameUI = gameUI;
    }

    /**
     * Check if manager is initialized
     */
    isReady(): boolean {
        return this.isInitialized && this.pixiGameState !== null;
    }

    /**
     * Render method for backward compatibility with Game.ts
     * @param gameUI - UI component (ignored, PixiJS handles rendering)
     */
    render(_gameUI?: any): void {
        // PixiJS handles rendering automatically via app.ticker
        // This method exists for backward compatibility only
    }

    /**
     * Check if time is up (for backward compatibility)
     */
    checkTimeUp(): boolean {
        if (!this.pixiGameState) return false;
        return this.pixiGameState.isTimeUp();
    }

    /**
     * Clean shutdown - PixiJS recommended destroy pattern
     */
    async destroy(): Promise<void> {
        console.log('🎮 CleanGameManager: Starting cleanup...');

        // Remove ticker callback
        if (this.gameTickerFn) {
            this.app.ticker.remove(this.gameTickerFn);
            this.gameTickerFn = null;
        }

        // Cleanup input systems
        if (this.inputManager) {
            this.inputManager.cleanup();
            this.inputManager = null;
        }
        this.playerSystem = null;

        // Destroy game state
        if (this.pixiGameState) {
            this.pixiGameState.destroy();
            this.pixiGameState = null;
        }

        // PixiJS推奨パターン: Complete application cleanup
        if (this.app) {
            this.app.destroy(
                { removeView: true }, // Remove canvas
                {
                    children: true,
                    texture: true,
                    textureSource: true,
                    context: true // WebGL context cleanup
                }
            );
        }

        // Clear state
        this.isInitialized = false;

        console.log('🎮 CleanGameManager: Cleanup complete');
    }
}

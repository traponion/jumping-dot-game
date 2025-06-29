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

    // Input System properties
    private keys: Set<string> = new Set();
    private isInputEnabled = false;

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

        // Initialize input system
        this.setupInputSystem();
        
        // Start game loop
        this.startGameLoop();

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

        // Cleanup input system
        this.cleanupInputSystem();
        
        // Stop game loop
        this.stopGameLoop();

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

    /**
     * Setup keyboard input system
     * @private
     */
    private setupInputSystem(): void {
        // Enable input processing
        this.isInputEnabled = true;

        // Add keyboard event listeners
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));

        console.log('🎮 PurePixiGame: Input system initialized');
    }

    /**
     * Handle keydown events
     * @param event - Keyboard event
     * @private
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.isInputEnabled) return;

        // Prevent default browser behavior for game keys
        if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(event.code)) {
            event.preventDefault();
        }

        // Add key to active keys set
        this.keys.add(event.code);

        // Handle immediate key responses
        this.processKeyInput(event.code);
    }

    /**
     * Handle keyup events
     * @param event - Keyboard event
     * @private
     */
    private handleKeyUp(event: KeyboardEvent): void {
        if (!this.isInputEnabled) return;

        // Remove key from active keys set
        this.keys.delete(event.code);
    }

    /**
     * Process specific key input
     * @param keyCode - Key code to process
     * @private
     */
    private processKeyInput(keyCode: string): void {
        if (!this.gameState) return;

        switch (keyCode) {
            case 'Space':
                console.log('🎮 Input: SPACE key pressed');
                this.handleJump();
                break;
            case 'ArrowLeft':
                console.log('🎮 Input: LEFT arrow pressed');
                // Left movement handled in updatePhysics()
                break;
            case 'ArrowRight':
                console.log('🎮 Input: RIGHT arrow pressed');
                // Right movement handled in updatePhysics()
                break;
            case 'KeyR':
                console.log('🎮 Input: R key pressed - Restart game');
                this.restartGame();
                break;
        }
    }

    /**
     * Cleanup input system
     * @private
     */
    private cleanupInputSystem(): void {
        // Disable input processing
        this.isInputEnabled = false;

        // Clear all active keys
        this.keys.clear();

        // Remove event listeners
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
        document.removeEventListener('keyup', this.handleKeyUp.bind(this));

        console.log('🎮 PurePixiGame: Input system cleaned up');
    }

    
    /**
     * Start the main game loop using PixiJS ticker
     * @private
     */
    private startGameLoop(): void {
        if (!this.app) {
            throw new Error('PixiJS application not initialized');
        }
        
        // Add game update to PixiJS ticker
        this.app.ticker.add(this.updateGame.bind(this));
        
        console.log('🎮 PurePixiGame: Game loop started (PixiJS ticker)');
    }
    
    /**
     * Main game update loop
     * @param deltaTime - Delta time from PixiJS ticker
     * @private
     */
    private updateGame(ticker: any): void {
        const deltaTime = ticker.deltaTime;
        // Only update if game is running
        if (!this.gameState?.isGameRunning()) {
            return;
        }
        
        // Update continuous input (movement keys)
        this.updateContinuousInput(deltaTime);
        
        // Apply physics updates
        this.updatePhysics(deltaTime);
        
        // TODO: Add collision detection
        // TODO: Add particle system updates
        
        // Debug output (throttled)
        if (this.app?.ticker.FPS && Math.floor(this.app.ticker.lastTime / 1000) % 1 === 0) {
            console.log(`🎮 Game Loop: FPS=${Math.round(this.app.ticker.FPS)}, DeltaTime=${deltaTime.toFixed(2)}`);
        }
    }
    
    /**
     * Update continuous input processing (for held keys)
     * @param deltaTime - Delta time from PixiJS ticker
     * @private
     */
    private updateContinuousInput(deltaTime: number): void {
        if (!this.isInputEnabled) return;
        
        // Note: deltaTime parameter available for future continuous input features
        
        // Note: SPACE and R are handled in processKeyInput() for single press
    }

    
    /**
     * Update physics simulation
     * @param deltaTime - Delta time from PixiJS ticker
     * @private
     */
    private updatePhysics(deltaTime: number): void {
        if (!this.gameState) return;
        
        const player = this.gameState.getPlayer();
        
        // Physics constants
        const GRAVITY = 0.8;
        const MOVE_SPEED = 5.0;
        const JUMP_FORCE = -12;
        const MAX_SPEED = 10;
        
        // Apply gravity
        let newVy = player.vy + GRAVITY * deltaTime;
        
        // Handle continuous input for movement
        let newVx = player.vx;
        if (this.keys.has('ArrowLeft')) {
            newVx = -MOVE_SPEED;
        } else if (this.keys.has('ArrowRight')) {
            newVx = MOVE_SPEED;
        } else {
            // Apply friction when no input
            newVx *= 0.8;
        }
        
        // Clamp velocities
        newVx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, newVx));
        newVy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, newVy));
        
        // Update position
        const newX = player.x + newVx * deltaTime;
        const newY = player.y + newVy * deltaTime;
        
        // Basic boundary checks (prevent falling through bottom)
        const boundedY = Math.max(0, Math.min(600 - player.radius, newY));
        
        // Check if grounded (simple ground check)
        const isGrounded = boundedY >= 600 - player.radius - 1;
        if (isGrounded && newVy > 0) {
            newVy = 0; // Stop falling
        }
        
        // Update player state
        this.gameState.updatePlayer({
            x: newX,
            y: boundedY,
            vx: newVx,
            vy: newVy,
            grounded: isGrounded
        });
        
        console.log(`🎮 Physics: Player at (${newX.toFixed(1)}, ${boundedY.toFixed(1)}) vel=(${newVx.toFixed(1)}, ${newVy.toFixed(1)}) grounded=${isGrounded}`);
    }

    
    /**
     * Handle player jump
     * @private
     */
    private handleJump(): void {
        if (!this.gameState) return;
        
        const player = this.gameState.getPlayer();
        
        // Only allow jumping if grounded
        if (player.grounded) {
            const JUMP_FORCE = -12;
            
            this.gameState.updatePlayer({
                vy: JUMP_FORCE,
                grounded: false
            });
            
            console.log('🎮 Physics: Player jumped!');
        } else {
            console.log('🎮 Physics: Cannot jump - not grounded');
        }
    }

    
    /**
     * Stop the main game loop
     * @private
     */
    private stopGameLoop(): void {
        if (this.app) {
            if (this.app) {
            this.app.ticker.remove(this.updateGame.bind(this));
            console.log('🎮 PurePixiGame: Game loop stopped');
        }
            console.log('🎮 PurePixiGame: Game loop stopped');
        }
    }
}

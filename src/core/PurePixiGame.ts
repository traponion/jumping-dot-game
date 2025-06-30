/**
 * @fileoverview Pure PixiJS game implementation without external state management
 * @module core/PurePixiGame
 * @description Main game controller using PixiJS-native patterns and clean architecture
 */

import { Application } from 'pixi.js';
import type { Player } from '../types/GameTypes.js';
import { PixiGameState } from './PixiGameState.js';
import type { Goal, Platform, Spike } from './StageLoader.js';
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
     * Updates the game status display in the DOM
     */
    private updateGameStatus(status: string): void {
        const gameStatusElement = document.getElementById('gameStatus');
        if (gameStatusElement) {
            gameStatusElement.textContent = status;
            console.log(`🎮 PurePixiGame: UI status updated to "${status}"`);
        }
    }

    /**
     * Updates the timer display in the DOM
     */
    private updateTimer(timeRemaining: number): void {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            timerElement.textContent = `Time: ${timeRemaining}`;
        }
    }

    /**
     * Updates the score display in the DOM
     */
    private updateScore(score: number): void {
        const scoreElement = document.getElementById('score');
        if (scoreElement) {
            scoreElement.textContent = `Score: ${score}`;
        }
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

        // Replace existing canvas with PixiJS canvas
        const existingCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        if (!existingCanvas) {
            throw new Error('Game canvas element not found in DOM');
        }

        const parentElement = existingCanvas.parentElement;
        if (!parentElement) {
            throw new Error('Game canvas parent element not found');
        }

        // Set PixiJS canvas ID and replace existing canvas
        this.app.canvas.id = 'gameCanvas';
        parentElement.replaceChild(this.app.canvas, existingCanvas);

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

        // Update UI status to Playing
        this.updateGameStatus('Playing');

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
            this.updateGameStatus('Paused');
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
            this.updateGameStatus('Ready');
            // Reset timer and score displays
            this.updateTimer(20);
            this.updateScore(0);
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

        // Restore original canvas element before destroying PixiJS app
        if (this.app?.canvas?.parentElement) {
            const parentElement = this.app.canvas.parentElement;

            // Create new canvas element to restore original state
            const originalCanvas = document.createElement('canvas');
            originalCanvas.id = 'gameCanvas';
            originalCanvas.width = 800;
            originalCanvas.height = 600;

            // Replace PixiJS canvas with original canvas
            parentElement.replaceChild(originalCanvas, this.app.canvas);
        }

        // Cleanup PixiJS application
        if (this.app) {
            await this.app.destroy({ removeView: false }, true);
            this.app = null;
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
    private updateGame(ticker: { deltaTime: number }): void {
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
            console.log(
                `🎮 Game Loop: FPS=${Math.round(this.app.ticker.FPS)}, DeltaTime=${deltaTime.toFixed(2)}`
            );
        }
    }

    /**
     * Update continuous input processing (for held keys)
     * @param deltaTime - Delta time from PixiJS ticker
     * @private
     */
    private updateContinuousInput(_deltaTime: number): void {
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
        // const JUMP_FORCE = -12; // Reserved for future jump force adjustments
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

        // Create temporary player state for collision detection
        const tempPlayer = { ...player, x: newX, y: newY, vx: newVx, vy: newVy };

        // Check platform collisions for grounding
        const isOnPlatform = this.checkPlatformCollisions(tempPlayer);

        // Basic boundary checks (prevent falling through bottom)
        const boundedY = Math.max(0, Math.min(600 - player.radius, newY));

        // Check if grounded (platform collision or ground boundary)
        const isGrounded = isOnPlatform || boundedY >= 600 - player.radius - 1;
        if (isGrounded && newVy > 0) {
            newVy = 0; // Stop falling
        }

        // Update player state with new position and velocity
        this.gameState.updatePlayer({
            x: newX,
            y: boundedY,
            vx: newVx,
            vy: newVy,
            grounded: isGrounded
        });

        // Check spike collisions (after position update)
        this.checkSpikeCollisions(this.gameState.getPlayer());

        // Check goal collision (after position update)
        this.checkGoalCollision(this.gameState.getPlayer());

        console.log(
            `🎮 Physics: Player at (${newX.toFixed(1)}, ${boundedY.toFixed(1)}) vel=(${newVx.toFixed(1)}, ${newVy.toFixed(1)}) grounded=${isGrounded} onPlatform=${isOnPlatform}`
        );
    }

    /**
     * Check if player is colliding with any platform
     */
    private checkPlatformCollisions(player: Player): boolean {
        const stageData = this.gameState?.getStageData();
        if (!stageData?.platforms) return false;

        for (const platform of stageData.platforms) {
            if (this.isPlayerOnPlatform(player, platform)) {
                return true; // Grounded on platform
            }
        }
        return false; // Not on any platform
    }

    /**
     * Check if player is on a specific platform (line segment collision)
     */
    private isPlayerOnPlatform(player: Player, platform: Platform): boolean {
        // Platform is a line segment from (x1,y1) to (x2,y2)
        // Check if player (circle) is standing on the line

        // Check if player is horizontally within platform bounds
        const playerLeft = player.x - player.radius;
        const playerRight = player.x + player.radius;
        const platformLeft = Math.min(platform.x1, platform.x2);
        const platformRight = Math.max(platform.x1, platform.x2);

        if (playerRight < platformLeft || playerLeft > platformRight) {
            return false; // Not horizontally aligned
        }

        // Check if player is vertically touching the platform line
        // For line segments, we need to interpolate the y-value at player's x position
        const platformTop = Math.min(platform.y1, platform.y2);
        // const platformBottom = Math.max(platform.y1, platform.y2); // Reserved for complex platform collision

        // Simple approach: treat platform as horizontal line at the top edge
        const platformY = platformTop;
        const playerBottom = player.y + player.radius;

        // Player is on platform if bottom edge is close to platform top
        return Math.abs(playerBottom - platformY) <= 3 && player.vy >= 0;
    }

    /**
     * Check if player is colliding with any spike
     */
    private checkSpikeCollisions(player: Player): boolean {
        const stageData = this.gameState?.getStageData();
        if (!stageData?.spikes) return false;

        for (const spike of stageData.spikes) {
            if (this.isPlayerTouchingSpike(player, spike)) {
                this.handlePlayerDeath();
                return true;
            }
        }
        return false;
    }

    /**
     * Check if player (circle) is touching a spike (rectangle)
     */
    private isPlayerTouchingSpike(player: Player, spike: Spike): boolean {
        // Rectangle-circle collision detection
        const playerCenterX = player.x;
        const playerCenterY = player.y;
        const playerRadius = player.radius;

        // Find closest point on rectangle to circle center
        const closestX = Math.max(spike.x, Math.min(playerCenterX, spike.x + spike.width));
        const closestY = Math.max(spike.y, Math.min(playerCenterY, spike.y + spike.height));

        // Calculate distance from circle center to closest point
        const distanceX = playerCenterX - closestX;
        const distanceY = playerCenterY - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        return distanceSquared <= playerRadius * playerRadius;
    }

    /**
     * Handle player death
     */
    private handlePlayerDeath(): void {
        if (!this.gameState) return;

        const player = this.gameState.getPlayer();

        // Add death mark at current position
        this.gameState.addDeathMark({
            x: player.x,
            y: player.y,
            timestamp: Date.now()
        });

        // Reset player to starting position
        this.resetPlayerToStart();

        console.log('💀 Player died! Death mark added, player reset to start');
    }

    /**
     * Reset player to starting position
     */
    private resetPlayerToStart(): void {
        if (!this.gameState) return;

        const stageData = this.gameState.getStageData();
        if (!stageData) return;

        // Reset player to stage starting position (usually around x=50, y=100)
        this.gameState.updatePlayer({
            x: 50,
            y: 100,
            vx: 0,
            vy: 0,
            grounded: false
        });

        console.log('🔄 Player reset to starting position');
    }

    /**
     * Check if player is colliding with the goal
     */
    private checkGoalCollision(player: Player): boolean {
        const stageData = this.gameState?.getStageData();
        if (!stageData?.goal) return false;

        if (this.isPlayerTouchingGoal(player, stageData.goal)) {
            this.handleLevelComplete();
            return true;
        }
        return false;
    }

    /**
     * Check if player (circle) is touching the goal (rectangle)
     */
    private isPlayerTouchingGoal(player: Player, goal: Goal): boolean {
        // Rectangle-circle collision detection (same as spike collision)
        const playerCenterX = player.x;
        const playerCenterY = player.y;
        const playerRadius = player.radius;

        // Find closest point on rectangle to circle center
        const closestX = Math.max(goal.x, Math.min(playerCenterX, goal.x + goal.width));
        const closestY = Math.max(goal.y, Math.min(playerCenterY, goal.y + goal.height));

        // Calculate distance from circle center to closest point
        const distanceX = playerCenterX - closestX;
        const distanceY = playerCenterY - closestY;
        const distanceSquared = distanceX * distanceX + distanceY * distanceY;

        return distanceSquared <= playerRadius * playerRadius;
    }

    /**
     * Handle level completion
     */
    private handleLevelComplete(): void {
        if (!this.gameState) return;

        // Calculate final score based on time and deaths
        const timeRemaining = this.gameState.getTimeRemaining();
        const deathCount = this.gameState.getDeathMarks().length;
        const finalScore = Math.max(0, timeRemaining * 10 - deathCount * 50);

        this.gameState.setFinalScore(finalScore);
        this.gameState.gameOver();

        console.log(
            `🎉 Level Complete! Score: ${finalScore}, Time: ${timeRemaining}s, Deaths: ${deathCount}`
        );

        // TODO: Trigger level complete UI or transition to next stage
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

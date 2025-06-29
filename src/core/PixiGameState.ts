/**
 * @fileoverview PixiJS-native game state management
 * @module core/PixiGameState
 * @description Pure PixiJS-based game state management, independent of Zustand.
 * Manages player, camera, entities, and game timing within PixiJS Application lifecycle.
 */

import { type Application, Container, Graphics } from 'pixi.js';
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { StageData } from './StageLoader.js';

/**
 * Game timing state for PixiJS-native management
 */
interface GameTime {
    startTime: number;
    timeLimit: number;
    isRunning: boolean;
    isPaused: boolean;
    isGameOver: boolean;
}

/**
 * Game entities managed within PixiJS
 */
interface GameEntities {
    trail: TrailPoint[];
    particles: Particle[];
    deathMarks: DeathMark[];
}

/**
 * PixiJS-native game state management
 * Replaces Zustand for all game-related state, fully integrated with PixiJS lifecycle
 */
export class PixiGameState {
    private app: Application;

    // Core game state
    private player: Player;
    private camera: Camera;
    private gameTime: GameTime;
    private entities: GameEntities;

    // Game flow state
    private finalScore = 0;
    private hasMovedOnce = false;

    // PixiJS Display Objects for visual representation
    private playerShape: Graphics | null = null;
    private gameContainer: Container;
    private uiContainer: Container;
    /** Current stage data */
    private stageData: StageData | null = null;

    /** Stage visual objects */
    private stageContainer!: Container;
    private platformShapes: Graphics[] = [];
    private spikeShapes: Graphics[] = [];
    private goalShape!: Graphics;

    /**
     * Initialize PixiJS-native game state with clean app.stage-centric design
     * @param app PixiJS Application instance - manages game state lifecycle
     */
    constructor(app: Application) {
        this.app = app;

        // PixiJS推奨パターン: app.stageを直接管理
        this.gameContainer = new Container();
        this.uiContainer = new Container();

        // Clean hierarchy: app.stage -> game/ui containers
        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.uiContainer);

        // Initialize player with default values
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 15,
            grounded: false
        };

        // Initialize camera
        this.camera = {
            x: 0,
            y: 200
        };

        // Initialize game timing
        this.gameTime = {
            startTime: 0,
            timeLimit: 20, // Default 20 seconds time limit
            isRunning: false,
            isPaused: false,
            isGameOver: false
        };

        // Initialize entities
        this.entities = {
            trail: [],
            particles: [],
            deathMarks: []
        };

        // Visual representation setup (no external dependencies)
        this.setupVisualObjects();
    }

    /**
     * Setup visual objects with clean PixiJS patterns
     * @private
     */
    private setupVisualObjects(): void {
        // Clean app.stage hierarchy already established in constructor
        // Game visual elements go in gameContainer
        // UI elements go in uiContainer

        // Stage container for platforms, spikes, goals
        this.stageContainer = new Container();
        this.gameContainer.addChild(this.stageContainer);

        // Player visual representation (simple circle for now)
        this.playerShape = new Graphics();
        this.updatePlayerVisual();
        this.gameContainer.addChild(this.playerShape);

        console.log('🎮 PixiGameState: Clean PixiJS setup complete (app.stage-centric)');
    }

    /**
     * Update player visual representation
     * @private
     */
    private updatePlayerVisual(): void {
        if (!this.playerShape) return;

        this.playerShape.clear();
        this.playerShape.circle(0, 0, this.player.radius).fill(0x00ff00); // Green circle - PixiJS v8 pattern

        // Position the visual
        this.playerShape.x = this.player.x;
        this.playerShape.y = this.player.y;
    }

    /**
     * Load stage data and render stage objects
     * @param stageData Stage data to load
     */
    loadStageData(stageData: StageData): void {
        this.stageData = stageData;
        this.clearStageObjects();
        this.renderStageObjects();
    }

    /**
     * Clear all stage visual objects
     * @private
     */
    private clearStageObjects(): void {
        // Clear platform shapes
        for (const shape of this.platformShapes) {
            shape.destroy();
        }
        this.platformShapes = [];

        // Clear spike shapes
        for (const shape of this.spikeShapes) {
            shape.destroy();
        }
        this.spikeShapes = [];

        // Clear goal shape
        if (this.goalShape) {
            this.goalShape.destroy();
        }

        // Clear stage container
        this.stageContainer.removeChildren();
    }

    /**
     * Render all stage objects based on current stage data
     * @private
     */
    private renderStageObjects(): void {
        if (!this.stageData) return;

        this.renderPlatforms();
        this.renderSpikes();
        this.renderGoal();

        console.log(
            `🎮 PixiGameState: Stage objects rendered - ${this.stageData.platforms.length} platforms, ${this.stageData.spikes.length} spikes, 1 goal`
        );
    }

    /**
     * Render platform objects
     * @private
     */
    private renderPlatforms(): void {
        if (!this.stageData) return;

        for (const platform of this.stageData.platforms) {
            const platformShape = new Graphics();

            // Draw platform as a line from (x1,y1) to (x2,y2)
            platformShape
                .moveTo(platform.x1, platform.y1)
                .lineTo(platform.x2, platform.y2)
                .stroke({ width: 4, color: 0xffffff }); // White line, 4px width

            this.platformShapes.push(platformShape);
            this.stageContainer.addChild(platformShape);
        }
    }

    /**
     * Render spike objects
     * @private
     */
    private renderSpikes(): void {
        if (!this.stageData) return;

        for (const spike of this.stageData.spikes) {
            const spikeShape = new Graphics();

            // Draw spike as a red rectangle
            spikeShape.rect(spike.x, spike.y, spike.width, spike.height).fill(0xff0000); // Red color for danger

            this.spikeShapes.push(spikeShape);
            this.stageContainer.addChild(spikeShape);
        }
    }

    /**
     * Render goal object
     * @private
     */
    private renderGoal(): void {
        if (!this.stageData) return;

        const goal = this.stageData.goal;
        this.goalShape = new Graphics();

        // Draw goal as a green rectangle
        this.goalShape.rect(goal.x, goal.y, goal.width, goal.height).fill(0x00ff00); // Green color for goal

        this.stageContainer.addChild(this.goalShape);
    }

    // ===========================================
    // GAME STATE MANAGEMENT (replacing Zustand)
    // ===========================================

    /**
     * Start a new game session
     */
    startGame(): void {
        this.gameTime.startTime = Date.now();
        this.gameTime.isRunning = true;
        this.gameTime.isPaused = false;
        this.gameTime.isGameOver = false;
        this.hasMovedOnce = false;
    }

    /**
     * Pause the current game
     */
    pauseGame(): void {
        this.gameTime.isPaused = true;
        this.gameTime.isRunning = false;
    }

    /**
     * Resume a paused game
     */
    resumeGame(): void {
        if (!this.gameTime.isGameOver) {
            this.gameTime.isPaused = false;
            this.gameTime.isRunning = true;
        }
    }

    /**
     * Stop the game without game over
     */
    stopGame(): void {
        this.gameTime.isRunning = false;
        this.gameTime.isPaused = false;
    }

    /**
     * Trigger game over state
     */
    gameOver(): void {
        this.gameTime.isGameOver = true;
        this.gameTime.isRunning = false;
        this.gameTime.isPaused = false;
    }

    /**
     * Restart the game (reset state)
     */
    restartGame(): void {
        // Reset player position
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 15,
            grounded: false
        };

        // Reset camera
        this.camera = {
            x: 0,
            y: 200
        };

        // Reset game time
        this.gameTime = {
            startTime: Date.now(),
            timeLimit: this.gameTime.timeLimit, // Preserve time limit
            isRunning: false, // Wait for startGame() to set true
            isPaused: false,
            isGameOver: false
        };

        // Clear entities
        this.entities = {
            trail: [],
            particles: [],
            deathMarks: []
        };

        // Reset game flow
        this.finalScore = 0;
        this.hasMovedOnce = false;

        // Update visual representation immediately
        this.updatePlayerVisual();
        this.updateCameraTransform();
    }

    // ===========================================
    // PLAYER STATE MANAGEMENT
    // ===========================================

    /**
     * Get current player state
     */
    getPlayer(): Player {
        return { ...this.player }; // Return copy to prevent external mutation
    }

    /**
     * Update player state
     */
    updatePlayer(updates: Partial<Player>): void {
        this.player = { ...this.player, ...updates };

        // Update visual representation immediately
        this.updatePlayerVisual();

        // Mark player movement
        if (updates.x !== undefined || updates.y !== undefined) {
            this.hasMovedOnce = true;
        }
    }

    /**
     * Clamp player speed to maximum values
     */
    clampPlayerSpeed(maxSpeed: number): void {
        // Clamp horizontal velocity
        if (this.player.vx > maxSpeed) {
            this.player.vx = maxSpeed;
        } else if (this.player.vx < -maxSpeed) {
            this.player.vx = -maxSpeed;
        }

        // Update visual after velocity changes
        this.updatePlayerVisual();
    }

    // ===========================================
    // CAMERA STATE MANAGEMENT
    // ===========================================

    /**
     * Get current camera state
     */
    getCamera(): Camera {
        return { ...this.camera };
    }

    /**
     * Update camera position
     */
    updateCamera(position: Partial<Camera>): void {
        this.camera = { ...this.camera, ...position };
        this.updateCameraTransform();
    }

    /**
     * Apply camera transform to containers
     * @private
     */
    private updateCameraTransform(): void {
        // Apply camera transform to game container only (UI container stays fixed)
        this.gameContainer.x = -this.camera.x;
        this.gameContainer.y = -this.camera.y;

        // UI container remains unaffected by camera (always at screen-space 0,0)
    }

    // ===========================================
    // ENTITY MANAGEMENT (trail, particles, etc.)
    // ===========================================

    /**
     * Add trail point
     */
    addTrailPoint(point: TrailPoint): void {
        this.entities.trail.push(point);

        // Limit trail length
        const maxTrailLength = 50;
        if (this.entities.trail.length > maxTrailLength) {
            this.entities.trail.shift();
        }
    }

    /**
     * Update entire trail
     */
    updateTrail(trail: TrailPoint[]): void {
        this.entities.trail = [...trail];
    }

    /**
     * Get current trail
     */
    getTrail(): TrailPoint[] {
        return [...this.entities.trail];
    }

    /**
     * Add death mark
     */
    addDeathMark(mark: DeathMark): void {
        this.entities.deathMarks.push(mark);
    }

    /**
     * Get death marks
     */
    getDeathMarks(): DeathMark[] {
        return [...this.entities.deathMarks];
    }

    /**
     * Add particle
     */
    addParticle(particle: Particle): void {
        this.entities.particles.push(particle);
    }

    /**
     * Update particles
     */
    updateParticles(particles: Particle[]): void {
        this.entities.particles = [...particles];
    }

    /**
     * Get particles
     */
    getParticles(): Particle[] {
        return [...this.entities.particles];
    }

    // ===========================================
    // GAME TIME & SCORE MANAGEMENT
    // ===========================================

    /**
     * Set time limit
     */
    setTimeLimit(timeLimit: number): void {
        this.gameTime.timeLimit = timeLimit;
    }

    /**
     * Get time remaining
     */
    getTimeRemaining(): number {
        if (!this.gameTime.isRunning) {
            return this.gameTime.timeLimit;
        }

        const elapsed = (Date.now() - this.gameTime.startTime) / 1000;
        return Math.max(0, this.gameTime.timeLimit - elapsed);
    }

    /**
     * Check if time is up
     */
    isTimeUp(): boolean {
        return this.getTimeRemaining() <= 0;
    }

    /**
     * Set final score
     */
    setFinalScore(score: number): void {
        this.finalScore = score;
    }

    /**
     * Get final score
     */
    getFinalScore(): number {
        return this.finalScore;
    }

    // ===========================================
    // GAME STATE QUERIES
    // ===========================================

    /**
     * Check if game is running
     */
    isGameRunning(): boolean {
        return this.gameTime.isRunning;
    }

    /**
     * Check if game is over
     */
    isGameOver(): boolean {
        return this.gameTime.isGameOver;
    }

    /**
     * Check if player has moved
     */
    hasPlayerMoved(): boolean {
        return this.hasMovedOnce;
    }

    /**
     * Get game start time
     */
    getGameStartTime(): number {
        return this.gameTime.startTime;
    }

    /**
     * Get time limit
     */
    getTimeLimit(): number {
        return this.gameTime.timeLimit;
    }

    // ===========================================
    // PIXIJS INTEGRATION
    // ===========================================

    /**
     * Get PixiJS Application instance
     */
    getApp(): Application {
        return this.app;
    }

    /**
     * Get game container for rendering
     */
    getGameContainer(): Container {
        return this.gameContainer;
    }

    /**
     * Get UI container for rendering
     */
    getUIContainer(): Container {
        return this.uiContainer;
    }

    /**
     * Destroy PixiJS objects (called when PixiJS app is destroyed)
     */
    destroy(): void {
        // PixiJS推奨パターン: 明示的リソース破棄

        // Clear stage objects first
        this.clearStageObjects();

        if (this.playerShape) {
            this.playerShape.destroy();
            this.playerShape = null;
        }

        if (this.gameContainer) {
            this.gameContainer.destroy({ children: true });
        }

        if (this.uiContainer) {
            this.uiContainer.destroy({ children: true });
        }

        // Clear references (Application destroy handles the rest)
        this.gameContainer = null as any;
        this.uiContainer = null as any;
        this.stageData = null;
    }
}

import { Application, Container, Graphics } from 'pixi.js';
import type { MovingPlatform, StageData } from '../core/StageLoader.js';

import type { Camera, DeathMark, Player, TrailPoint } from '../types/GameTypes.js';

// Landing prediction interface for render system
export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, how certain we are about this prediction
    jumpNumber: number; // Which jump this represents (1, 2, 3...)
}

import { DeathMarkRenderingManager } from './DeathMarkRenderingManager.js';
import { GameOverMenuManager } from './GameOverMenuManager.js';
import { StageTransitionManager } from './StageTransitionManager.js';
/**
 * PixiJS-based rendering system for the jumping dot game.
 * Provides high-performance WebGL rendering with fallback to Canvas2D.
 */
import { TrailParticleManager } from './TrailParticleManager.js';

export class PixiRenderSystem {
    private app: Application;
    private gameContainer: Container;
    private uiContainer: Container;
    private isDestroyed = false;

    // Game objects
    private playerShape: Graphics | null = null;
    private platformGraphics: Graphics;
    private movingPlatformGraphics: Graphics;
    private spikeGraphics: Graphics;
    private goalGraphics: Graphics;
    private trailGraphics: Graphics;
    private trailParticleManager: TrailParticleManager;
    private deathMarkManager: DeathMarkRenderingManager;
    private gameOverMenuManager: GameOverMenuManager;
    private stageTransitionManager: StageTransitionManager;

    private effectsGraphics: Graphics;
    private uiGraphics: Graphics;

    // Landing prediction and history data
    // private landingPredictions: LandingPrediction[] = []; // TODO: implement landing predictions
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private landingHistoryGraphics: Graphics;
    // private readonly LERP_SPEED = 0.15; // TODO: implement interpolation
    private readonly HISTORY_FADE_TIME = 3000;

    constructor() {
        // This will be initialized in the initialize method
        this.app = undefined as unknown as Application;

        // Initialize graphics containers (will be properly set up in initialize)
        this.gameContainer = new Container();
        this.uiContainer = new Container();

        // Initialize graphics objects
        this.platformGraphics = new Graphics();
        this.movingPlatformGraphics = new Graphics();
        this.spikeGraphics = new Graphics();
        this.goalGraphics = new Graphics();
        this.trailGraphics = new Graphics();
        this.effectsGraphics = new Graphics();
        this.uiGraphics = new Graphics();
        this.landingHistoryGraphics = new Graphics();

        // Managers will be initialized in initialize method
        this.trailParticleManager = undefined as unknown as TrailParticleManager;
        this.deathMarkManager = undefined as unknown as DeathMarkRenderingManager;
        this.gameOverMenuManager = undefined as unknown as GameOverMenuManager;
        this.stageTransitionManager = undefined as unknown as StageTransitionManager;
    }

    /**
     * Initialize the PixiJS application and setup the stage
     */
    async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
        // PixiJS v8 standard initialization
        this.app = new Application();

        // Try the same simple configuration as official PixiJS samples
        await this.app.init({
            canvas: canvasElement,
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: 0x000000
        });

        // Initialize managers now that app is available
        this.trailParticleManager = new TrailParticleManager(this.app);
        this.deathMarkManager = new DeathMarkRenderingManager(this.app);
        this.gameOverMenuManager = new GameOverMenuManager(this.app);
        this.stageTransitionManager = new StageTransitionManager(this.app);

        // Setup container hierarchy
        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.uiContainer);

        // Add graphics objects to containers
        this.gameContainer.addChild(this.platformGraphics);
        this.gameContainer.addChild(this.movingPlatformGraphics);
        this.gameContainer.addChild(this.spikeGraphics);
        this.gameContainer.addChild(this.goalGraphics);
        this.gameContainer.addChild(this.trailGraphics);
        this.gameContainer.addChild(this.trailParticleManager.getParticleContainer());
        this.gameContainer.addChild(this.landingHistoryGraphics);
        this.gameContainer.addChild(this.effectsGraphics);
        this.uiContainer.addChild(this.uiGraphics);
        this.uiContainer.addChild(this.gameOverMenuManager.getMenuContainer());
        this.uiContainer.addChild(this.stageTransitionManager.getTransitionContainer());
    }

    /**
     * Render the player as a white circle
     */
    private playerLogCount = 0;
    renderPlayer(player: Player): void {
        if (this.playerLogCount < 3) {
            console.log('🎮 renderPlayer called:', {
                x: player.x,
                y: player.y,
                radius: player.radius
            });
            this.playerLogCount++;
        }

        if (!this.playerShape) {
            this.playerShape = new Graphics();
            this.gameContainer.addChild(this.playerShape);
            console.log('🎮 Player shape created and added to gameContainer');
        }

        this.playerShape.clear();
        // Test: Draw player at fixed position near canvas center for debugging
        this.playerShape.circle(400, 300, 20).fill(0xff0000); // Red fill for testing

        // Also try to draw at actual player position
        this.playerShape.circle(player.x, player.y, player.radius).fill(0xffffff); // White fill
    }

    /**
     * Render static platforms as white lines
     */
    private platformLogCount = 0;
    renderPlatforms(stageData: StageData): void {
        if (this.platformLogCount === 0) {
            console.log('🎮 renderPlatforms called with', stageData.platforms.length, 'platforms');
            stageData.platforms.forEach((platform, i) => {
                if (i < 3) console.log('🎮 Platform', i, ':', platform);
            });
            this.platformLogCount++;
        }
        this.platformGraphics.clear();

        for (const platform of stageData.platforms) {
            this.platformGraphics
                .moveTo(platform.x1, platform.y1)
                .lineTo(platform.x2, platform.y2)
                .stroke({ width: 2, color: 0xffffff });
        }
    }

    /**
     * Render moving platforms with dynamic positions
     */
    renderMovingPlatforms(movingPlatforms: MovingPlatform[]): void {
        this.movingPlatformGraphics.clear();

        for (const platform of movingPlatforms) {
            this.movingPlatformGraphics
                .moveTo(platform.x1, platform.y1)
                .lineTo(platform.x2, platform.y2)
                .stroke({ width: 2, color: 0xffffff });
        }
    }

    /**
     * Render spikes as white triangular shapes
     */
    renderSpikes(spikes: Array<{ x: number; y: number; width: number; height: number }>): void {
        this.spikeGraphics.clear();

        for (const spike of spikes) {
            // Create triangular spike shape with points at:
            // Bottom-left, top-center, bottom-right
            const points = [
                spike.x,
                spike.y + spike.height, // Bottom-left
                spike.x + spike.width / 2,
                spike.y, // Top-center
                spike.x + spike.width,
                spike.y + spike.height // Bottom-right
            ];

            this.spikeGraphics
                .poly(points)
                .fill(0xffffff) // White fill
                .stroke({ width: 1, color: 0xffffff });
        }
    }

    /**
     * Render goal as white rectangle frame with X pattern inside
     */
    renderGoal(goal: { x: number; y: number; width: number; height: number }): void {
        this.goalGraphics.clear();

        // Draw goal frame (rectangle outline)
        this.goalGraphics
            .rect(goal.x, goal.y, goal.width, goal.height)
            .stroke({ width: 2, color: 0xffffff });

        // Draw X pattern inside the goal (two diagonal lines)
        this.goalGraphics
            .moveTo(goal.x, goal.y)
            .lineTo(goal.x + goal.width, goal.y + goal.height)
            .stroke({ width: 2, color: 0xffffff });

        this.goalGraphics
            .moveTo(goal.x + goal.width, goal.y)
            .lineTo(goal.x, goal.y + goal.height)
            .stroke({ width: 2, color: 0xffffff });
    }

    /**
     * Render complete stage with all elements (platforms, spikes, goal)
     * Note: Text rendering will be added in Phase 2
     */
    renderStage(stage: StageData): void {
        this.renderPlatforms(stage);

        // Render moving platforms if they exist
        if (stage.movingPlatforms && stage.movingPlatforms.length > 0) {
            this.renderMovingPlatforms(stage.movingPlatforms);
        }

        this.renderSpikes(stage.spikes);
        this.renderGoal(stage.goal);

        // TODO Phase 2: Add renderStageTexts(stage) for text elements
    }

    /**
     * Render player trail with fade effect
     */
    /**
     * Render player trail with fade effect
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        // Use high-performance ParticleContainer for trail rendering
        this.trailParticleManager.renderTrail(trail, playerRadius);

        // Keep legacy Graphics trail clear for compatibility
        this.trailGraphics.clear();
    }

    /**
     * Renders death marks using PixiJS Graphics API
     */
    renderDeathMarks(deathMarks: DeathMark[]): void {
        this.deathMarkManager.renderDeathMarks(deathMarks);
    }

    /**
     * Render game over menu using PixiJS Container composition
     */
    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        // Get camera position for centering menu
        const cameraX = -this.gameContainer.x + this.app.renderer.width / 2;
        const cameraY = -this.gameContainer.y + this.app.renderer.height / 2;

        // Create and position menu
        this.gameOverMenuManager.createMenu(options, selectedIndex, finalScore);
        this.gameOverMenuManager.positionMenu(cameraX, cameraY);
        this.gameOverMenuManager.showMenu();
    }

    /**
     * Update game over menu selection
     */
    updateGameOverMenuSelection(
        options: string[],
        selectedIndex: number,
        finalScore: number
    ): void {
        this.gameOverMenuManager.updateSelection(options, selectedIndex, finalScore);
    }

    /**
     * Hide game over menu
     */
    hideGameOverMenu(): void {
        this.gameOverMenuManager.hideMenu();
    }

    /**
     * Stage transition effects
     */
    async fadeOutTransition(duration = 500): Promise<void> {
        return this.stageTransitionManager.fadeOut(duration);
    }

    async fadeInTransition(duration = 500): Promise<void> {
        return this.stageTransitionManager.fadeIn(duration);
    }

    showLoadingScreen(message: string): void {
        this.stageTransitionManager.showLoadingScreen(message);
    }

    hideLoadingScreen(): void {
        this.stageTransitionManager.hideLoadingScreen();
    }

    async flashEffect(color = 0xffffff, duration = 200): Promise<void> {
        return this.stageTransitionManager.flashEffect(color, duration);
    }

    async stageCompleteEffect(score: number): Promise<void> {
        return this.stageTransitionManager.stageCompleteEffect(score);
    }

    isTransitioning(): boolean {
        return this.stageTransitionManager.isTransitioning();
    }

    cancelTransition(): void {
        this.stageTransitionManager.cancelTransition();
    }

    /**
     * Adds a landing position to the history for collision feedback
     */
    addLandingHistory(x: number, y: number): void {
        this.landingHistory.push({
            x,
            y,
            timestamp: Date.now()
        });
    }

    /**
     * Renders landing predictions and history with fade effects
     */
    /**
     * Sets landing predictions (stub for MockRenderSystem compatibility)
     */
    setLandingPredictions(_predictions: unknown[]): void {
        // TODO: Implement landing predictions rendering
        // For now, this is a stub for compatibility with GameManager
    }

    renderLandingPredictions(): void {
        this.cleanupLandingHistory();
        this.renderLandingHistory();
    }

    /**
     * Cleans up old landing history entries
     */
    private cleanupLandingHistory(): void {
        const now = Date.now();
        this.landingHistory = this.landingHistory.filter(
            (landing) => now - landing.timestamp < this.HISTORY_FADE_TIME
        );
    }

    /**
     * Renders landing history as white vertical lines with fade effect
     */
    private renderLandingHistory(): void {
        // Clear previous history graphics
        this.landingHistoryGraphics.clear();

        if (this.landingHistory.length === 0) {
            return;
        }

        // TODO: Implement fade effect - uncomment when implementing alpha blending
        // const currentTime = Date.now();
        const lineHeight = 8;

        // Draw vertical lines for each landing position
        for (const history of this.landingHistory) {
            // TODO: Implement alpha fade effect based on age
            // const age = currentTime - history.timestamp;
            // const fadeProgress = age / this.HISTORY_FADE_TIME;
            // const alpha = Math.max(0.1, 0.6 * (1 - fadeProgress));

            // Draw vertical line (fade effect to be implemented later)
            this.landingHistoryGraphics.moveTo(history.x, history.y);
            this.landingHistoryGraphics.lineTo(history.x, history.y - lineHeight);
        }
        // Set stroke style for history lines
        this.landingHistoryGraphics.stroke({
            color: 0xffffff,
            width: 1
        });
    }

    /**
     * Apply camera transformation to game container
     */
    /**
     * Apply camera transformation to game container
     */
    private cameraLogCount = 0;
    applyCameraTransform(camera: Camera): void {
        // Center the game view in the renderer viewport
        const centerX = this.app.renderer.width / 2;
        const centerY = this.app.renderer.height / 2;
        const newX = -camera.x + centerX;

        // TEMPORARY FIX: Use hardcoded Y=200 to show platforms at y=500 in center
        const fixedCameraY = 200;
        const newY = -fixedCameraY + centerY; // This should put y=500 at screen center

        if (this.cameraLogCount < 5) {
            console.log('🎮 applyCameraTransform (TEMP FIX):', {
                cameraX: camera.x,
                originalCameraY: camera.y,
                fixedCameraY,
                centerX,
                centerY,
                newContainerX: newX,
                newContainerY: newY
            });
            this.cameraLogCount++;
        }

        this.gameContainer.x = newX;
        this.gameContainer.y = newY;
    }

    restoreCameraTransform(): void {
        // Keep camera transform for consistency (UI elements handle their own transforms)
    }

    /**
     * Clear all graphics and reset the stage
     */
    clear(): void {
        this.platformGraphics.clear();
        this.movingPlatformGraphics.clear();
        this.spikeGraphics.clear();
        this.goalGraphics.clear();
        this.trailGraphics.clear();
        this.landingHistoryGraphics.clear();
        this.effectsGraphics.clear();
        this.uiGraphics.clear();

        if (this.playerShape) {
            this.playerShape.clear();
        }
    }

    /**
     * Alias for clear() to maintain compatibility with MockRenderSystem
     */
    clearCanvas(): void {
        this.clear();
    }

    /**
     * Stub for setDrawingStyle (MockRenderSystem compatibility)
     */
    setDrawingStyle(): void {
        // PixiJS handles drawing styles internally per graphics object
        // This is a compatibility stub
    }

    /**
     * Renders all graphics (MockRenderSystem compatibility)
     */
    renderAll(): void {
        // PixiJS handles rendering automatically through the application ticker
        // This is a compatibility stub for MockRenderSystem
    }

    /**
     * Resize the renderer to match canvas dimensions
     */
    resize(width: number, height: number): void {
        this.app.renderer.resize(width, height);
    }

    /**
     * Clean up resources and destroy the application
     */
    destroy(): void {
        // Prevent double destruction
        if (this.isDestroyed) {
            return;
        }
        this.isDestroyed = true;

        try {
            // Safely destroy managers
            this.trailParticleManager?.destroy();
        } catch (error) {
            console.warn('Error destroying trailParticleManager:', error);
        }

        try {
            this.deathMarkManager?.destroy();
        } catch (error) {
            console.warn('Error destroying deathMarkManager:', error);
        }

        try {
            this.gameOverMenuManager?.destroy();
        } catch (error) {
            console.warn('Error destroying gameOverMenuManager:', error);
        }

        try {
            this.stageTransitionManager?.destroy();
        } catch (error) {
            console.warn('Error destroying stageTransitionManager:', error);
        }

        if (this.app) {
            try {
                // Manually destroy children of containers to prevent errors
                // from double-destroyed objects during stage transitions.
                if (this.gameContainer?.children?.length) {
                    for (const child of [...this.gameContainer.children]) {
                        if (child && !child.destroyed) {
                            try {
                                child.destroy();
                            } catch (error) {
                                console.warn('Error destroying game container child:', error);
                            }
                        }
                    }
                }
                if (this.uiContainer?.children?.length) {
                    for (const child of [...this.uiContainer.children]) {
                        if (child && !child.destroyed) {
                            try {
                                child.destroy();
                            } catch (error) {
                                console.warn('Error destroying UI container child:', error);
                            }
                        }
                    }
                }

                // Destroy the application itself
                this.app.destroy(true, { children: true, texture: true });
            } catch (error) {
                console.warn('Error destroying PixiJS application:', error);
            }
        }
    }

    /**
     * Alias for destroy() to maintain compatibility with MockRenderSystem
     */
    async cleanup(): Promise<void> {
        this.destroy();
    }

    /**
     * Renders start instruction (MockRenderSystem compatibility)
     */
    renderStartInstruction(): void {
        // TODO: Implement start instruction rendering with PixiJS
        // For now, this is a compatibility stub
    }

    /**
     * Renders credits (MockRenderSystem compatibility)
     */
    renderCredits(): void {
        // TODO: Implement credits rendering with PixiJS
        // For now, this is a compatibility stub
    }

    /**
     * Renders death animation (MockRenderSystem compatibility)
     */
    renderDeathAnimation(_particles: unknown[]): void {
        // TODO: Implement death animation rendering with PixiJS
        // For now, this is a compatibility stub
    }

    /**
     * Renders clear animation (MockRenderSystem compatibility)
     */
    renderClearAnimation(_particles: unknown[], _progress: number, _x: number, _y: number): void {
        // TODO: Implement clear animation rendering with PixiJS
        // For now, this is a compatibility stub
    }

    /**
     * Get the underlying PixiJS application
     */
    getApp(): Application {
        return this.app;
    }

    /**
     * Get the game container for advanced manipulations
     */
    getGameContainer(): Container {
        return this.gameContainer;
    }

    /**
     * Get the UI container for HUD elements
     */
    getUIContainer(): Container {
        return this.uiContainer;
    }
}

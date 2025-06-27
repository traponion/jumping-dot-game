import * as PIXI from 'pixi.js';
import type { MovingPlatform, StageData } from '../core/StageLoader.js';
import type { IBundleAnalysisService } from '../services/interfaces/IBundleAnalysisService.js';
import type { ICompatibilityCheckService } from '../services/interfaces/ICompatibilityCheckService.js';
import type { IPerformanceMonitorService } from '../services/interfaces/IPerformanceMonitorService.js';
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
    private app: PIXI.Application;
    private gameContainer: PIXI.Container;
    private uiContainer: PIXI.Container;

    // Game objects
    private playerShape: PIXI.Graphics | null = null;
    private platformGraphics: PIXI.Graphics;
    private movingPlatformGraphics: PIXI.Graphics;
    private spikeGraphics: PIXI.Graphics;
    private goalGraphics: PIXI.Graphics;
    private trailGraphics: PIXI.Graphics;
    private trailParticleManager: TrailParticleManager;
    private deathMarkManager: DeathMarkRenderingManager;
    private gameOverMenuManager: GameOverMenuManager;
    private stageTransitionManager: StageTransitionManager;

    private effectsGraphics: PIXI.Graphics;
    private uiGraphics: PIXI.Graphics;

    // Landing prediction and history data
    // private landingPredictions: LandingPrediction[] = []; // TODO: implement landing predictions
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private landingHistoryGraphics: PIXI.Graphics;
    // private readonly LERP_SPEED = 0.15; // TODO: implement interpolation
    private readonly HISTORY_FADE_TIME = 3000;

    constructor(
        private performanceService?: IPerformanceMonitorService,
        private compatibilityService?: ICompatibilityCheckService,
        private bundleService?: IBundleAnalysisService
    ) {
        // Initialize PixiJS application
        this.app = new PIXI.Application();

        // Initialize graphics containers
        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();

        // Initialize graphics objects
        this.platformGraphics = new PIXI.Graphics();
        this.movingPlatformGraphics = new PIXI.Graphics();
        this.spikeGraphics = new PIXI.Graphics();
        this.goalGraphics = new PIXI.Graphics();
        this.trailGraphics = new PIXI.Graphics();
        this.trailParticleManager = new TrailParticleManager(this.app);
        this.deathMarkManager = new DeathMarkRenderingManager(this.app);
        this.gameOverMenuManager = new GameOverMenuManager(this.app);
        this.stageTransitionManager = new StageTransitionManager(this.app);

        this.effectsGraphics = new PIXI.Graphics();
        this.uiGraphics = new PIXI.Graphics();
        this.landingHistoryGraphics = new PIXI.Graphics();
    }

    /**
     * Initialize the PixiJS application and setup the stage
     */
    async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
        await this.app.init({
            canvas: canvasElement,
            width: canvasElement.width,
            height: canvasElement.height,
            backgroundColor: 0x000000, // Black background
            antialias: false, // Disable for performance
            resolution: 1, // Standard resolution for performance
            autoDensity: false // Disable auto-density for performance
        });

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
    renderPlayer(player: Player): void {
        if (!this.playerShape) {
            this.playerShape = new PIXI.Graphics();
            this.gameContainer.addChild(this.playerShape);
        }

        this.playerShape.clear();
        this.playerShape.circle(0, 0, player.radius);
        this.playerShape.fill(0xffffff); // White fill
        this.playerShape.x = player.x;
        this.playerShape.y = player.y;
    }

    /**
     * Render static platforms as white lines
     */
    renderPlatforms(stageData: StageData): void {
        this.platformGraphics.clear();
        this.platformGraphics.stroke({ width: 2, color: 0xffffff });

        for (const platform of stageData.platforms) {
            this.platformGraphics.moveTo(platform.x1, platform.y1);
            this.platformGraphics.lineTo(platform.x2, platform.y2);
        }
    }

    /**
     * Render moving platforms with dynamic positions
     */
    renderMovingPlatforms(movingPlatforms: MovingPlatform[]): void {
        this.movingPlatformGraphics.clear();
        this.movingPlatformGraphics.stroke({ width: 2, color: 0xffffff });

        for (const platform of movingPlatforms) {
            this.movingPlatformGraphics.moveTo(platform.x1, platform.y1);
            this.movingPlatformGraphics.lineTo(platform.x2, platform.y2);
        }
    }

    /**
     * Render spikes as white triangular shapes
     */
    renderSpikes(spikes: Array<{ x: number; y: number; width: number; height: number }>): void {
        this.spikeGraphics.clear();
        this.spikeGraphics.fill(0xffffff); // White fill
        this.spikeGraphics.stroke({ width: 1, color: 0xffffff });

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

            this.spikeGraphics.poly(points);
        }
    }

    /**
     * Render goal as white rectangle frame with X pattern inside
     */
    renderGoal(goal: { x: number; y: number; width: number; height: number }): void {
        this.goalGraphics.clear();
        this.goalGraphics.stroke({ width: 2, color: 0xffffff });

        // Draw goal frame (rectangle outline)
        this.goalGraphics.rect(goal.x, goal.y, goal.width, goal.height);

        // Draw X pattern inside the goal (two diagonal lines)
        this.goalGraphics.moveTo(goal.x, goal.y);
        this.goalGraphics.lineTo(goal.x + goal.width, goal.y + goal.height);

        this.goalGraphics.moveTo(goal.x + goal.width, goal.y);
        this.goalGraphics.lineTo(goal.x, goal.y + goal.height);
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
     * Performance monitoring and profiling
     */
    enablePerformanceProfiling(): void {
        this.performanceService?.enableProfiling();
    }

    disablePerformanceProfiling(): void {
        this.performanceService?.disableProfiling();
    }

    getPerformanceMetrics(): {
        frameRate: number;
        averageFrameTime: number;
        frameCount: number;
        memoryUsage: number;
        sessionDuration: number;
        startTime: number;
    } {
        return (
            this.performanceService?.getMetrics() || {
                frameRate: 0,
                averageFrameTime: 0,
                frameCount: 0,
                memoryUsage: 0,
                sessionDuration: 0,
                startTime: 0
            }
        );
    }

    getPerformanceWarnings(): string[] {
        return this.performanceService?.getWarnings() || [];
    }

    generatePerformanceReport(): string {
        return this.performanceService?.generateReport() || 'Performance monitoring not available';
    }

    logPerformanceMetrics(): void {
        this.performanceService?.logMetrics();
    }

    startFrameProfiling(): void {
        this.performanceService?.startFrame();
    }

    endFrameProfiling(): void {
        this.performanceService?.endFrame();
    }

    /**
     * Cross-browser compatibility checking
     */
    getBrowserInfo(): { name: string; version: string; isSupported: boolean } {
        return (
            this.compatibilityService?.getBrowserInfo() || {
                name: 'Unknown',
                version: '0',
                isSupported: false
            }
        );
    }

    checkWebGLSupport(): {
        isSupported: boolean;
        version: number;
        renderer?: string;
        vendor?: string;
    } {
        return this.compatibilityService?.checkWebGLSupport() || { isSupported: false, version: 0 };
    }

    getCompatibilityIssues(): string[] {
        return this.compatibilityService?.getCompatibilityIssues() || [];
    }

    getCompatibilityWorkarounds(): string[] {
        return this.compatibilityService?.getCompatibilityWorkarounds() || [];
    }

    generateCompatibilityReport(): string {
        return (
            this.compatibilityService?.generateReport() || 'Compatibility checking not available'
        );
    }

    logCompatibilityReport(): void {
        this.compatibilityService?.logReport();
    }

    getBrowserSpecificConfig(): {
        requiresWorkarounds: boolean;
        recommendations: string[];
    } {
        return (
            this.compatibilityService?.getBrowserSpecificConfig() || {
                requiresWorkarounds: false,
                recommendations: []
            }
        );
    }

    /**
     * Bundle size analysis and optimization
     */
    getBundleInfo(): {
        totalSize: number;
        gzippedSize: number;
        modules: Array<{ name: string; size: number }>;
        pixiModules: Array<{ name: string; size: number }>;
    } {
        return (
            this.bundleService?.getBundleInfo() || {
                totalSize: 0,
                gzippedSize: 0,
                modules: [],
                pixiModules: []
            }
        );
    }

    getBundleMetrics(): {
        totalSizeKB: number;
        gzippedSizeKB: number;
        pixiSizeKB: number;
        isUnderTarget: boolean;
        loadTimeEstimate: number;
    } {
        return (
            this.bundleService?.getMetrics() || {
                totalSizeKB: 0,
                gzippedSizeKB: 0,
                pixiSizeKB: 0,
                isUnderTarget: true,
                loadTimeEstimate: 0
            }
        );
    }

    getOptimizationRecommendations(): {
        category: string;
        recommendations: string[];
        potentialSavings: number;
    }[] {
        return this.bundleService?.getOptimizationRecommendations() || [];
    }

    generateBundleReport(): string {
        return this.bundleService?.generateReport() || 'Bundle analysis not available';
    }

    logBundleAnalysis(): void {
        this.bundleService?.logAnalysis();
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
            // Set stroke style even for empty history (for consistency)
            this.landingHistoryGraphics.stroke({
                color: 0xffffff,
                width: 1
            });
            return;
        }

        // Set stroke style for history lines
        this.landingHistoryGraphics.stroke({
            color: 0xffffff,
            width: 1
        });

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
    }

    /**
     * Apply camera transformation to game container
     */
    /**
     * Apply camera transformation to game container
     */
    applyCameraTransform(camera: Camera): void {
        // Center the game view in the renderer viewport
        const centerX = this.app.renderer.width / 2;
        const centerY = this.app.renderer.height / 2;
        this.gameContainer.x = -camera.x + centerX;
        this.gameContainer.y = -camera.y + centerY;
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
     * Resize the renderer to match canvas dimensions
     */
    resize(width: number, height: number): void {
        this.app.renderer.resize(width, height);
    }

    /**
     * Clean up resources and destroy the application
     */
    destroy(): void {
        this.trailParticleManager.destroy();
        this.deathMarkManager.destroy();
        this.gameOverMenuManager.destroy();
        this.stageTransitionManager.destroy();
        this.app.destroy(true, { children: true, texture: true });
    }

    /**
     * Get the underlying PixiJS application
     */
    getApp(): PIXI.Application {
        return this.app;
    }

    /**
     * Get the game container for advanced manipulations
     */
    getGameContainer(): PIXI.Container {
        return this.gameContainer;
    }

    /**
     * Get the UI container for HUD elements
     */
    getUIContainer(): PIXI.Container {
        return this.uiContainer;
    }
}

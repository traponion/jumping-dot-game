import * as PIXI from 'pixi.js';
import type { MovingPlatform, StageData } from '../core/StageLoader.js';
import type { Camera, Player, TrailPoint } from '../types/GameTypes.js';

// Landing prediction interface for render system
export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, how certain we are about this prediction
    jumpNumber: number; // Which jump this represents (1, 2, 3...)
}

/**
 * PixiJS-based rendering system for the jumping dot game.
 * Provides high-performance WebGL rendering with fallback to Canvas2D.
 */
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
    private effectsGraphics: PIXI.Graphics;
    private uiGraphics: PIXI.Graphics;

    // Effect data (to be implemented in future phases)
    // private landingPredictions: LandingPrediction[] = [];
    // private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    // private readonly LERP_SPEED = 0.15;
    // private readonly HISTORY_FADE_TIME = 3000;

    constructor() {
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
        this.effectsGraphics = new PIXI.Graphics();
        this.uiGraphics = new PIXI.Graphics();
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
        this.gameContainer.addChild(this.effectsGraphics);
        this.uiContainer.addChild(this.uiGraphics);
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
     * Render player trail with fade effect
     */
    /**
     * Render player trail with fade effect
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        this.trailGraphics.clear();

        for (let i = 0; i < trail.length; i++) {
            const point = trail[i];
            const alpha = (i + 1) / trail.length; // Fade from old to new
            const radius = playerRadius * alpha * 0.8; // Scale radius based on age

            this.trailGraphics.circle(point.x, point.y, radius);
            this.trailGraphics.fill({ color: 0xffffff, alpha });
        }
    }

    /**
     * Apply camera transformation to game container
     */
    /**
     * Apply camera transformation to game container
     */
    applyCamera(camera: Camera): void {
        // Center the game view in the renderer viewport
        const centerX = this.app.renderer.width / 2;
        const centerY = this.app.renderer.height / 2;
        this.gameContainer.x = -camera.x + centerX;
        this.gameContainer.y = -camera.y + centerY;
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

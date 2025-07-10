/**
 * @fileoverview Pixi.JS implementation of IRenderSystem interface
 * @module systems/PixiRenderSystem
 * @description Clean Room Strategy implementation - no Fabric.js dependencies
 */

import * as PIXI from 'pixi.js';
import type { StageData } from '../core/StageLoader.js';
import type { LandingPrediction } from '../types/AnalyticsTypes.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { IRenderSystem, Position } from './IRenderSystem.js';

/**
 * PixiRenderSystem - Pixi.JS implementation of rendering system
 *
 * Design Philosophy:
 * - Implements IRenderSystem interface completely
 * - Uses modern Pixi.JS v8 patterns and APIs
 * - Container-based architecture (div attachment, not direct canvas)
 * - Clean Room Strategy: no Fabric.js references
 *
 * This implementation provides high-performance 2D rendering using WebGL/WebGPU
 * through Pixi.JS, optimized for game scenarios with real-time animations.
 */
export class PixiRenderSystem implements IRenderSystem {
    private app: PIXI.Application;
    private stage: PIXI.Container;
    private initialized = false;

    // Landing prediction state
    private landingPredictions: LandingPrediction[] = [];
    private landingHistory: Position[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.app = new PIXI.Application();
        this.stage = new PIXI.Container();

        // Initialize app asynchronously
        this.initializeApp(canvas);
    }

    private async initializeApp(canvas: HTMLCanvasElement): Promise<void> {
        try {
            // Modern Pixi.JS v8 initialization
            await this.app.init({
                width: canvas.width || 800,
                height: canvas.height || 600,
                backgroundColor: '#000000',
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // Replace original canvas with Pixi.JS canvas
            const parentContainer = canvas.parentElement;
            if (parentContainer) {
                // Set Pixi canvas to match original canvas attributes
                this.app.canvas.id = canvas.id;
                this.app.canvas.className = canvas.className;
                this.app.canvas.style.cssText = canvas.style.cssText;

                // Replace original canvas with Pixi canvas
                parentContainer.replaceChild(this.app.canvas, canvas);
            } else {
                // Fallback: attach to document body
                document.body.appendChild(this.app.canvas);
            }

            // Set up main stage
            this.app.stage.addChild(this.stage);
            console.log(
                'PixiRenderSystem initialized: app.stage children count:',
                this.app.stage.children.length
            );
            console.log(
                'PixiRenderSystem initialized: our stage added to app.stage:',
                this.app.stage.children.includes(this.stage)
            );

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize Pixi.JS application:', error);
            throw error;
        }
    }

    // ===== Canvas Management =====

    clearCanvas(): void {
        this.ensureInitialized();

        console.log(
            'PixiRenderSystem.clearCanvas called, stage children before:',
            this.stage.children.length
        );

        // Clear all children from stage
        this.stage.removeChildren();

        console.log(
            'PixiRenderSystem.clearCanvas called, stage children after:',
            this.stage.children.length
        );
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            // For synchronous methods, we need to handle initialization differently
            // In a real implementation, you might want to queue operations or throw an error
            console.warn('PixiRenderSystem not yet initialized, operation may not work correctly');

            // Try to wait a bit for initialization (not ideal but necessary for sync interface)
            // This is a workaround for the async initialization issue
            this.waitForInitialization();
        }
    }

    private waitForInitialization(): void {
        // Block execution until initialization completes (synchronous waiting)
        // This is a workaround for the async initialization vs sync interface issue
        const maxWaitTime = 5000; // 5 seconds max wait
        const checkInterval = 10; // Check every 10ms
        const startTime = Date.now();

        while (!this.initialized && Date.now() - startTime < maxWaitTime) {
            // Synchronous busy wait - not ideal but necessary for sync interface
            // Use synchronous delay to avoid blocking the event loop completely
            const now = Date.now();
            while (Date.now() - now < checkInterval) {
                // Busy wait for short interval
            }
        }

        if (!this.initialized) {
            console.error('PixiRenderSystem initialization timeout after', maxWaitTime, 'ms');
            throw new Error('PixiRenderSystem initialization timeout');
        }
    }

    setDrawingStyle(): void {
        this.ensureInitialized();

        // Set default drawing style for Pixi.JS context
        // In Pixi.JS, styles are typically applied per Graphics object
        // This method ensures consistent styling across renders
    }

    applyCameraTransform(camera: Camera): void {
        this.ensureInitialized();

        // Apply camera transformation to the main stage
        this.stage.position.set(-camera.x, -camera.y);
        // Note: Camera type doesn't have zoom property, using default scale
        this.stage.scale.set(1, 1);
    }

    restoreCameraTransform(): void {
        if (!this.initialized) return;

        // Reset stage transform to identity
        this.stage.position.set(0, 0);
        this.stage.scale.set(1, 1);
    }

    renderAll(): void {
        this.ensureInitialized();

        console.log('PixiRenderSystem.renderAll called');

        // Force a render of the current stage
        this.app.renderer.render(this.app.stage);

        // Force WebGL to finish all operations and flush to canvas
        // Check if using WebGL renderer and access context safely
        if ('gl' in this.app.renderer && this.app.renderer.gl) {
            const gl = this.app.renderer.gl as WebGLRenderingContext;
            gl.finish();
            gl.flush();
            console.log('WebGL flush and finish completed');
        }

        console.log('renderAll completed, stage children:', this.stage.children.length);
    }

    // ===== Game Objects =====

    renderPlayer(player: Player): void {
        this.ensureInitialized();

        console.log('PixiRenderSystem.renderPlayer called:', player.x, player.y, player.radius);

        // Create player graphics
        const playerGraphics = new PIXI.Graphics();
        playerGraphics.circle(player.x, player.y, player.radius);
        playerGraphics.fill(0xffffff); // White player

        this.stage.addChild(playerGraphics);

        // Force render immediately to ensure content is visible
        this.app.renderer.render(this.app.stage);
    }

    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        if (!this.initialized) return;

        if (trail.length < 2) return;

        // Create trail graphics
        const trailGraphics = new PIXI.Graphics();

        for (const point of trail) {
            // Calculate alpha based on timestamp (age-based fade)
            const currentTime = Date.now();
            const age = currentTime - point.timestamp;
            const maxAge = 1000; // 1 second fade time
            const alpha = Math.max(0, 1 - age / maxAge);
            const radius = playerRadius * alpha * 0.5;

            if (radius > 0.1) {
                trailGraphics.circle(point.x, point.y, radius);
                trailGraphics.fill({ color: 0xffffff, alpha });
            }
        }

        this.stage.addChild(trailGraphics);
    }

    renderStage(stage: StageData): void {
        this.ensureInitialized();

        // Render platforms
        if (stage.platforms) {
            for (const platform of stage.platforms) {
                const platformGraphics = new PIXI.Graphics();
                // Convert line-based platform (x1,y1,x2,y2) to rectangle
                const x = Math.min(platform.x1, platform.x2);
                const y = Math.min(platform.y1, platform.y2);
                const width = Math.abs(platform.x2 - platform.x1) || 1;
                const height = Math.abs(platform.y2 - platform.y1) || 10; // Default height for thin platforms
                platformGraphics.rect(x, y, width, height);
                platformGraphics.fill(0x00ff00); // Green platforms
                this.stage.addChild(platformGraphics);
            }
        }

        // Render goal
        if (stage.goal) {
            const goalGraphics = new PIXI.Graphics();
            goalGraphics.rect(stage.goal.x, stage.goal.y, stage.goal.width, stage.goal.height);
            goalGraphics.fill(0xffff00); // Yellow goal
            this.stage.addChild(goalGraphics);
        }

        // Render spikes
        if (stage.spikes) {
            for (const spike of stage.spikes) {
                const spikeGraphics = new PIXI.Graphics();
                spikeGraphics.rect(spike.x, spike.y, spike.width, spike.height);
                spikeGraphics.fill(0xff0000); // Red spikes
                this.stage.addChild(spikeGraphics);
            }
        }

        // Render text elements
        if (stage.startText) {
            const startText = new PIXI.Text({
                text: stage.startText.text,
                style: {
                    fontSize: 16,
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                }
            });
            startText.position.set(stage.startText.x, stage.startText.y);
            this.stage.addChild(startText);
        }

        if (stage.goalText) {
            const goalText = new PIXI.Text({
                text: stage.goalText.text,
                style: {
                    fontSize: 16,
                    fill: '#ffff00',
                    fontFamily: 'Arial'
                }
            });
            goalText.position.set(stage.goalText.x, stage.goalText.y);
            this.stage.addChild(goalText);
        }

        // Force render immediately
        this.app.renderer.render(this.app.stage);
    }

    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void {
        if (!this.initialized) return;

        for (const mark of deathMarks) {
            const markGraphics = new PIXI.Graphics();
            markGraphics.circle(mark.x, mark.y, 5);
            markGraphics.fill(0xff0000); // Red death marks
            this.stage.addChild(markGraphics);
        }
    }

    // ===== UI Elements =====

    renderStartInstruction(): void {
        this.ensureInitialized();

        const instruction = new PIXI.Text({
            text: 'Press SPACE to start',
            style: {
                fontSize: 24,
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        });
        instruction.anchor.set(0.5);
        instruction.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.stage.addChild(instruction);

        // Force render immediately
        this.app.renderer.render(this.app.stage);
    }

    renderGameOverMenu(options: string[], selectedIndex: number, deathCount?: number): void {
        if (!this.initialized) return;

        // Render game over title
        const title = new PIXI.Text({
            text: 'Game Over',
            style: {
                fontSize: 32,
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        });
        title.anchor.set(0.5);
        title.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 100);
        this.stage.addChild(title);

        // Render death count if provided
        if (deathCount !== undefined) {
            const deaths = new PIXI.Text({
                text: `Deaths: ${deathCount}`,
                style: {
                    fontSize: 20,
                    fill: '#ffffff',
                    fontFamily: 'Arial'
                }
            });
            deaths.anchor.set(0.5);
            deaths.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 30);
            this.stage.addChild(deaths);
        }

        // Render menu options
        options.forEach((option, index) => {
            const isSelected = index === selectedIndex;
            const optionText = new PIXI.Text({
                text: option,
                style: {
                    fontSize: 18,
                    fill: isSelected ? '#ffff00' : '#ffffff',
                    fontFamily: 'Arial'
                }
            });
            optionText.anchor.set(0.5);
            optionText.position.set(
                this.app.screen.width / 2,
                this.app.screen.height / 2 + index * 30
            );
            this.stage.addChild(optionText);
        });
    }

    renderCredits(): void {
        if (!this.initialized) return;

        const credits = new PIXI.Text({
            text: 'Credits\n\nDeveloped with Pixi.JS\nGame Engine Implementation',
            style: {
                fontSize: 20,
                fill: '#ffffff',
                fontFamily: 'Arial',
                align: 'center'
            }
        });
        credits.anchor.set(0.5);
        credits.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.stage.addChild(credits);
    }

    // ===== Animations =====

    renderDeathAnimation(particles: Particle[]): void {
        if (!this.initialized) return;

        for (const particle of particles) {
            const particleGraphics = new PIXI.Graphics();
            particleGraphics.circle(particle.x, particle.y, particle.size || 2);
            // Use life property to calculate alpha (higher life = more opaque)
            const alpha = Math.min(1, particle.life / 100);
            particleGraphics.fill({ color: 0xff0000, alpha });
            this.stage.addChild(particleGraphics);
        }
    }

    renderSoulAnimation(particles: Particle[]): void {
        if (!this.initialized) return;

        for (const particle of particles) {
            const soulGraphics = new PIXI.Graphics();
            soulGraphics.circle(particle.x, particle.y, particle.size || 3);
            // Use life property to calculate alpha (higher life = more opaque)
            const alpha = Math.min(1, particle.life / 100);
            soulGraphics.fill({ color: 0x00ffff, alpha });
            this.stage.addChild(soulGraphics);
        }
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        centerX: number,
        centerY: number
    ): void {
        if (!this.initialized) return;

        // Render stage clear particles
        for (const particle of particles) {
            const clearGraphics = new PIXI.Graphics();
            clearGraphics.circle(particle.x, particle.y, particle.size || 4);
            // Use life property to calculate alpha (higher life = more opaque)
            const alpha = Math.min(1, particle.life / 100);
            clearGraphics.fill({ color: 0x00ff00, alpha });
            this.stage.addChild(clearGraphics);
        }

        // Render progress indicator
        const progressText = new PIXI.Text({
            text: `Clear Progress: ${Math.round(progress * 100)}%`,
            style: {
                fontSize: 16,
                fill: '#00ff00',
                fontFamily: 'Arial'
            }
        });
        progressText.anchor.set(0.5);
        progressText.position.set(centerX, centerY - 50);
        this.stage.addChild(progressText);
    }

    // ===== Analytics & Predictions =====

    renderLandingPredictions(): void {
        if (!this.initialized) return;

        // Render landing predictions
        for (const prediction of this.landingPredictions) {
            const predictionGraphics = new PIXI.Graphics();
            predictionGraphics.circle(prediction.x, prediction.y, 8);
            predictionGraphics.fill({ color: 0x00ffff, alpha: 0.7 });
            this.stage.addChild(predictionGraphics);
        }

        // Render landing history
        for (const position of this.landingHistory) {
            const historyGraphics = new PIXI.Graphics();
            historyGraphics.circle(position.x, position.y, 4);
            historyGraphics.fill({ color: 0x0080ff, alpha: 0.5 });
            this.stage.addChild(historyGraphics);
        }
    }

    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = [...predictions];
    }

    addLandingHistory(position: Position): void {
        this.landingHistory.push({ ...position });

        // Limit history size for performance
        if (this.landingHistory.length > 100) {
            this.landingHistory.shift();
        }
    }

    updateLandingPredictionAnimations(): void {
        // Update prediction animations (can be expanded with more complex animations)
        // For now, this is a placeholder for future animation updates
    }

    // ===== System Management =====

    async cleanup(): Promise<void> {
        if (!this.initialized) return;

        try {
            // Clear all stage children
            this.stage.removeChildren();

            // Clear prediction data
            this.landingPredictions = [];
            this.landingHistory = [];

            console.log('PixiRenderSystem cleanup completed');
        } catch (error) {
            console.error('Error during PixiRenderSystem cleanup:', error);
            throw error;
        }
    }

    dispose(): void {
        if (!this.initialized) return;

        try {
            // Stop application ticker
            this.app.ticker.stop();

            // Destroy application and release resources
            this.app.destroy(true, { children: true, texture: true });

            // Clear references
            this.landingPredictions = [];
            this.landingHistory = [];

            this.initialized = false;

            console.log('PixiRenderSystem disposed successfully');
        } catch (error) {
            console.error('Error during PixiRenderSystem disposal:', error);
        }
    }
}

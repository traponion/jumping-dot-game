// Pixi.JS rendering system implementation

import * as PIXI from 'pixi.js';
import type { StageData } from '../core/StageLoader.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
// IRenderSystem interface and Position moved to this file for consolidation

// Position interface
export interface Position {
    x: number;
    y: number;
}

// IRenderSystem - Complete rendering abstraction interface
export interface IRenderSystem {
    // ===== Canvas Management =====

    clearCanvas(): void;

    setDrawingStyle(): void;

    applyCameraTransform(camera: Camera): void;

    restoreCameraTransform(): void;

    renderAll(): void;

    // ===== Game Objects =====

    renderPlayer(player: Player): void;

    renderTrail(trail: TrailPoint[], playerRadius: number): void;

    renderStage(stage: StageData, camera?: Camera): void;

    /**
     * Render death marks at previous death locations
     * @param deathMarks Array of death mark positions
     */
    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void;

    // ===== UI Elements =====

    /**
     * Render start instruction overlay
     */
    renderStartInstruction(): void;

    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void;

    renderCredits(): void;

    // ===== Animations =====

    renderDeathAnimation(particles: Particle[]): void;

    renderSoulAnimation(particles: Particle[]): void;

    /** Render stage clear animation */
    renderClearAnimation(
        particles: Particle[],
        progress: number,
        centerX: number,
        centerY: number
    ): void;

    // ===== Analytics & Predictions =====

    /** Render landing prediction visualization */

    /** Set landing predictions for visualization */

    /**
     * Add a new landing position to history
     * @param position Landing position to add
     */

    /**
     * Update landing prediction animations
     */

    // ===== System Management =====

    /**
     * Wait for render system initialization to complete
     */
    waitForInitialization(): Promise<void>;

    /**
     * Clean up rendering resources (async for complex cleanup)
     */
    cleanup(): Promise<void>;

    /** Dispose of rendering system and release all resources */
    dispose(): void;
}

/** PixiRenderSystem - Pixi.JS implementation of IRenderSystem */
export class PixiRenderSystem implements IRenderSystem {
    private app: PIXI.Application;
    private stage: PIXI.Container;
    private worldContainer: PIXI.Container; // Game elements (affected by camera)
    private uiContainer: PIXI.Container; // UI elements (fixed position)
    private initialized = false;
    private initializationPromise: Promise<void> | null = null;

    constructor(container: HTMLElement) {
        this.app = new PIXI.Application();
        this.stage = new PIXI.Container();
        this.worldContainer = new PIXI.Container(); // Game elements (affected by camera)
        this.uiContainer = new PIXI.Container(); // UI elements (fixed position)

        // Initialize app asynchronously and store the promise
        this.initializationPromise = this.initializeApp(container);
    }

    private async initializeApp(container: HTMLElement): Promise<void> {
        try {
            // Clean up existing canvases
            const existingCanvases = container.querySelectorAll('canvas');
            for (const canvas of existingCanvases) {
                canvas.remove();
            }

            const allCanvases = document.querySelectorAll('#gameCanvas canvas');
            for (const canvas of allCanvases) {
                canvas.remove();
            }

            // Wait for DOM cleanup
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Initialize Pixi.JS application
            await this.app.init({
                width: 800,
                height: 600,
                backgroundColor: '#000000',
                antialias: true,
                resolution: window.devicePixelRatio || 1,
                autoDensity: true
            });

            // Apply canvas styling
            this.app.canvas.style.border = '2px solid white';
            this.app.canvas.style.backgroundColor = '#000000';
            this.app.canvas.style.display = 'block';

            // Add canvas to container and set up stage
            container.appendChild(this.app.canvas);
            this.app.stage.addChild(this.stage);

            // ★★ Add worldContainer and uiContainer to stage
            this.stage.addChild(this.worldContainer, this.uiContainer);

            this.initialized = true;
        } catch (error) {
            console.error('Failed to initialize Pixi.JS application:', error);
            throw error;
        }
    }

    // ===== Canvas Management =====

    clearCanvas(): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping clearCanvas');
            return;
        }

        // ★★ Clear both containers
        this.worldContainer.removeChildren();
        this.uiContainer.removeChildren();
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping render operation');
            return;
        }
    }

    async waitForInitialization(): Promise<void> {
        if (this.initializationPromise) {
            await this.initializationPromise;
        }
    }

    setDrawingStyle(): void {
        this.ensureInitialized();

        // Set default drawing style for Pixi.JS context
        // In Pixi.JS, styles are typically applied per Graphics object
        // This method ensures consistent styling across renders
    }

    applyCameraTransform(camera: Camera): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping applyCameraTransform');
            return;
        }

        // ★★ Apply camera transformation only to worldContainer
        // UI elements in uiContainer remain fixed
        this.worldContainer.position.set(-camera.x, -camera.y);
    }

    restoreCameraTransform(): void {
        if (!this.initialized) return;

        // Reset stage transform to identity
        this.stage.position.set(0, 0);
        this.stage.scale.set(1, 1);
    }

    renderAll(): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping renderAll');
            return;
        }

        // Force a render of the current stage
        this.app.renderer.render(this.app.stage);

        // Force WebGL to finish all operations and flush to canvas
        // Check if using WebGL renderer and access context safely
        if ('gl' in this.app.renderer && this.app.renderer.gl) {
            const gl = this.app.renderer.gl as WebGLRenderingContext;
            gl.finish();
            gl.flush();
        }
    }

    // ===== Game Objects =====

    renderPlayer(player: Player): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping renderPlayer');
            return;
        }

        // Create player graphics with correct Pixi.js v8 API
        const playerGraphics = new PIXI.Graphics();
        const size = player.radius * 2;
        playerGraphics.rect(0, 0, size, size);
        playerGraphics.position.set(player.x - player.radius, player.y - player.radius);
        playerGraphics.fill(0xffffff); // White player

        // ★★ Add to worldContainer (affected by camera)
        this.worldContainer.addChild(playerGraphics);

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
            const size = playerRadius * alpha;

            if (size > 0.1) {
                trailGraphics.rect(0, 0, size, size);
                trailGraphics.position.set(point.x - size / 2, point.y - size / 2);
                trailGraphics.fill({ color: 0xffffff, alpha });
            }
        }

        // ★★ Add to worldContainer (affected by camera)
        this.worldContainer.addChild(trailGraphics);
    }

    renderStage(stage: StageData, _camera?: Camera): void {
        if (!this.initialized) {
            console.warn('PixiRenderSystem not yet initialized, skipping renderStage');
            return;
        }

        // Render platforms cleanly
        if (stage.platforms) {
            for (const platform of stage.platforms) {
                const platformGraphics = new PIXI.Graphics();
                const width = platform.x2 - platform.x1;
                const height = 2; // Ultra-thin platform height for better gameplay

                platformGraphics.rect(0, 0, width, height);
                platformGraphics.position.set(platform.x1, platform.y1);
                platformGraphics.fill(0xffffff); // White platforms
                // ★★ Add to worldContainer (affected by camera)
                this.worldContainer.addChild(platformGraphics);
            }
        } else {
        }

        // Render moving platforms
        if (stage.movingPlatforms) {
            for (const movingPlatform of stage.movingPlatforms) {
                const platformGraphics = new PIXI.Graphics();
                const width = movingPlatform.x2 - movingPlatform.x1;
                const height = 2; // Ultra-thin platform height

                platformGraphics.rect(0, 0, width, height);
                platformGraphics.position.set(movingPlatform.x1, movingPlatform.y1);
                platformGraphics.fill(0xffff00); // Yellow for moving platforms (different from static)
                // ★★ Add to worldContainer (affected by camera)
                this.worldContainer.addChild(platformGraphics);
            }
        }

        // Render goal
        if (stage.goal) {
            const goalGraphics = new PIXI.Graphics();

            // Draw goal as rectangle outline with X mark inside
            // Rectangle outline
            goalGraphics.rect(0, 0, stage.goal.width, stage.goal.height);
            goalGraphics.stroke({ width: 2, color: 0xffffff }); // White outline

            // Draw X mark inside
            goalGraphics.moveTo(2, 2);
            goalGraphics.lineTo(stage.goal.width - 2, stage.goal.height - 2);
            goalGraphics.moveTo(stage.goal.width - 2, 2);
            goalGraphics.lineTo(2, stage.goal.height - 2);
            goalGraphics.stroke({ width: 2, color: 0xffffff }); // White X

            goalGraphics.position.set(stage.goal.x, stage.goal.y);
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(goalGraphics);
        }

        // Render spikes
        if (stage.spikes) {
            for (const spike of stage.spikes) {
                const spikeGraphics = new PIXI.Graphics();

                // Draw spike shape (triangle pointing up)
                const centerX = spike.width / 2;
                const baseY = spike.height;

                spikeGraphics.moveTo(0, baseY); // Bottom left
                spikeGraphics.lineTo(centerX, 0); // Top point
                spikeGraphics.lineTo(spike.width, baseY); // Bottom right
                spikeGraphics.closePath();

                spikeGraphics.position.set(spike.x, spike.y);
                spikeGraphics.fill(0xffffff); // White spikes
                // ★★ Add to worldContainer (affected by camera)
                this.worldContainer.addChild(spikeGraphics);
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
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(startText);
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
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(goalText);
        }

        // Render leftEdgeMessage
        if (stage.leftEdgeMessage) {
            const leftEdgeText = new PIXI.Text({
                text: stage.leftEdgeMessage.text,
                style: {
                    fontSize: 18,
                    fill: '#ff6666',
                    fontFamily: 'Arial',
                    fontWeight: 'bold'
                }
            });
            leftEdgeText.position.set(stage.leftEdgeMessage.x, stage.leftEdgeMessage.y);
            this.worldContainer.addChild(leftEdgeText);
        }

        // Render leftEdgeSubMessage
        if (stage.leftEdgeSubMessage) {
            const leftEdgeSubText = new PIXI.Text({
                text: stage.leftEdgeSubMessage.text,
                style: {
                    fontSize: 14,
                    fill: '#ffaa66',
                    fontFamily: 'Arial'
                }
            });
            leftEdgeSubText.position.set(stage.leftEdgeSubMessage.x, stage.leftEdgeSubMessage.y);
            this.worldContainer.addChild(leftEdgeSubText);
        }

        // Render tutorialMessages
        if (stage.tutorialMessages) {
            for (const tutorialMessage of stage.tutorialMessages) {
                const tutorialText = new PIXI.Text({
                    text: tutorialMessage.text,
                    style: {
                        fontSize: 16,
                        fill: '#66ffff',
                        fontFamily: 'Arial',
                        fontWeight: 'bold'
                    }
                });
                tutorialText.position.set(tutorialMessage.x, tutorialMessage.y);
                this.worldContainer.addChild(tutorialText);
            }
        }

        // Force render immediately
        this.app.renderer.render(this.app.stage);
    }

    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void {
        if (!this.initialized) return;

        for (const mark of deathMarks) {
            const markGraphics = new PIXI.Graphics();

            // Draw red X mark at death location
            const size = 8; // X mark size
            markGraphics.moveTo(mark.x - size, mark.y - size);
            markGraphics.lineTo(mark.x + size, mark.y + size);
            markGraphics.moveTo(mark.x + size, mark.y - size);
            markGraphics.lineTo(mark.x - size, mark.y + size);
            markGraphics.stroke({ width: 2, color: 0xff0000 }); // Red X

            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(markGraphics);
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
        // ★★ Add to uiContainer (fixed position)
        this.uiContainer.addChild(instruction);

        // Force render immediately
        this.app.renderer.render(this.app.stage);
    }

    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void {
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
        // ★★ Add to uiContainer (fixed position)
        this.uiContainer.addChild(title);

        // Render score
        const score = new PIXI.Text({
            text: `Score: ${finalScore}`,
            style: {
                fontSize: 20,
                fill: '#ffffff',
                fontFamily: 'Arial'
            }
        });
        score.anchor.set(0.5);
        score.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 60);
        // ★★ Add to uiContainer (fixed position)
        this.uiContainer.addChild(score);

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
            // ★★ Add to uiContainer (fixed position)
            this.uiContainer.addChild(deaths);
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
            // ★★ Add to uiContainer (fixed position)
            this.uiContainer.addChild(optionText);
        });
    }

    renderCredits(): void {
        if (!this.initialized) return;

        const credits = new PIXI.Text({
            text: 'Credits\\n\\nDeveloped with Pixi.JS\\nGame Engine Implementation',
            style: {
                fontSize: 20,
                fill: '#ffffff',
                fontFamily: 'Arial',
                align: 'center'
            }
        });
        credits.anchor.set(0.5);
        credits.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        // ★★ Add to uiContainer (fixed position)
        this.uiContainer.addChild(credits);
    }

    // ===== Animations =====

    renderDeathAnimation(particles: Particle[]): void {
        if (!this.initialized) return;

        for (const particle of particles) {
            const particleGraphics = new PIXI.Graphics();
            particleGraphics.circle(particle.x, particle.y, particle.size || 2);
            // Use life property directly as alpha (particle.life is already 0-1)
            const alpha = particle.life;
            particleGraphics.fill({ color: 0xff0000, alpha });
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(particleGraphics);
        }
    }

    renderSoulAnimation(particles: Particle[]): void {
        if (!this.initialized) return;

        for (const particle of particles) {
            const soulGraphics = new PIXI.Graphics();
            soulGraphics.circle(particle.x, particle.y, particle.size || 3);
            // Use life property directly as alpha (particle.life is already 0-1)
            const alpha = particle.life;
            soulGraphics.fill({ color: 0x00ffff, alpha });
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(soulGraphics);
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
            // Use life property directly as alpha (particle.life is already 0-1)
            const alpha = particle.life;
            clearGraphics.fill({ color: 0x00ff00, alpha });
            // ★★ Add to worldContainer (affected by camera)
            this.worldContainer.addChild(clearGraphics);
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
        // ★★ Add to worldContainer (affected by camera)
        this.worldContainer.addChild(progressText);
    }

    // ===== System Management =====

    async cleanup(): Promise<void> {
        if (!this.initialized) return;

        try {
            // Clear worldContainer and uiContainer children only
            this.worldContainer.removeChildren();
            this.uiContainer.removeChildren();

            // Do NOT remove canvas from DOM - keep it for retry functionality
            // Canvas will be reused for subsequent game sessions
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

            this.initialized = false;
        } catch (error) {
            console.error('Error during PixiRenderSystem disposal:', error);
        }
    }
}

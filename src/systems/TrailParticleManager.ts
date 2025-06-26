/**
 * @fileoverview High-performance trail rendering using PixiJS ParticleContainer
 * @module systems/TrailParticleManager
 * @description Phase 2.1 - GPU-accelerated trail effects with particle pooling
 */

import * as PIXI from 'pixi.js';
import type { TrailPoint } from '../types/GameTypes.js';

/**
 * High-performance trail particle manager using PixiJS ParticleContainer
 * Provides GPU-accelerated trail rendering with particle pooling optimization
 */
export class TrailParticleManager {
    private readonly particleContainer: PIXI.ParticleContainer;
    private readonly particleTexture: PIXI.Texture;
    private readonly particles: PIXI.Particle[] = [];
    private activeParticleCount = 0;

    /**
     * Creates a new TrailParticleManager instance
     * @param app - PixiJS Application instance for texture generation
     */
    constructor(private readonly app: PIXI.Application) {
        // Configure ParticleContainer for optimal trail rendering
        this.particleContainer = new PIXI.ParticleContainer({
            dynamicProperties: {
                position: true, // Particles move dynamically
                scale: true, // Scale changes for fading effect
                rotation: false, // Static rotation for performance
                color: false // Static color for performance
            }
        });

        // Generate white circle texture for trail particles
        this.particleTexture = this.createTrailTexture();
    }

    /**
     * Creates a white circle texture for trail particles
     * @returns Generated texture for trail particles
     */
    private createTrailTexture(): PIXI.Texture {
        const graphics = new PIXI.Graphics();
        graphics.circle(0, 0, 8); // 8px radius circle
        graphics.fill({ color: 0xffffff }); // White fill

        const texture = this.app.renderer.generateTexture(graphics);
        graphics.destroy(); // Clean up temporary graphics

        return texture;
    }

    /**
     * Renders trail effect using ParticleContainer
     * @param trail - Array of trail points to render
     * @param playerRadius - Player radius for particle scaling
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        const targetCount = trail.length;

        // Handle trail shrinking - remove excess particles
        if (targetCount < this.activeParticleCount) {
            this.particleContainer.removeParticles(targetCount, this.activeParticleCount);
            this.activeParticleCount = targetCount;
        }

        // Handle trail growing - create additional particles
        while (this.particles.length < targetCount) {
            const particle = new PIXI.Particle({
                texture: this.particleTexture
            });
            this.particles.push(particle);
        }

        // Add new particles to container if needed
        while (this.activeParticleCount < targetCount) {
            this.particleContainer.addParticle(this.particles[this.activeParticleCount]);
            this.activeParticleCount++;
        }

        // Update particle properties based on trail data
        for (let i = 0; i < targetCount; i++) {
            const point = trail[i];
            const particle = this.particles[i];

            // Calculate fade effect - newer points have higher alpha
            const alpha = (i + 1) / targetCount;
            const radius = playerRadius * alpha * 0.8; // 80% scale factor
            const scale = radius / 8; // Scale relative to texture size (8px)

            // Update particle properties
            particle.x = point.x;
            particle.y = point.y;
            particle.scaleX = scale;
            particle.scaleY = scale;
            particle.alpha = alpha;
        }

        // Update ParticleContainer to reflect changes
        this.particleContainer.update();
    }

    /**
     * Gets the ParticleContainer for adding to scene graph
     * @returns The internal ParticleContainer instance
     */
    getParticleContainer(): PIXI.ParticleContainer {
        return this.particleContainer;
    }

    /**
     * Gets the current number of active particles
     * @returns Number of active particles being rendered
     */
    getActiveParticleCount(): number {
        return this.activeParticleCount;
    }

    /**
     * Destroys the trail manager and cleans up resources
     */
    destroy(): void {
        this.particleContainer.destroy();
        this.particleTexture.destroy();
        this.particles.length = 0;
        this.activeParticleCount = 0;
    }
}

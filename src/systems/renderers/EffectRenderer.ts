/**
 * @fileoverview Effects and animations rendering (particles, explosions, transitions)
 * @module systems/renderers/EffectRenderer
 * @description Specialized renderer for visual effects and animations.
 * Separated from FabricRenderSystem to maintain single responsibility principle.
 */

import * as fabric from 'fabric';

/**
 * Particle effect configuration
 */
interface ParticleConfig {
    count: number;
    size: number;
    speed: number;
    lifetime: number;
    color: string;
    fadeOut: boolean;
}

/**
 * Single particle data
 */
interface Particle {
    shape: fabric.Circle;
    velocityX: number;
    velocityY: number;
    lifetime: number;
    maxLifetime: number;
    fadeOut: boolean;
}

/**
 * Transition effect types
 */
export enum TransitionType {
    FADE_IN = 'fadeIn',
    FADE_OUT = 'fadeOut',
    SLIDE_UP = 'slideUp',
    SLIDE_DOWN = 'slideDown',
    ZOOM_IN = 'zoomIn',
    ZOOM_OUT = 'zoomOut'
}

/**
 * Renderer for visual effects and animations
 * @description Handles rendering of particles, explosions, transitions, and other effects.
 */
export class EffectRenderer {
    private canvas: fabric.Canvas;
    private particles: Particle[] = [];
    private animationId: number | null = null;
    private isAnimating: boolean = false;

    /**
     * Creates new EffectRenderer instance
     * @param canvas - Fabric.js canvas instance
     */
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Create explosion effect at position
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param config - Particle configuration
     */
    public createExplosion(x: number, y: number, config?: Partial<ParticleConfig>): void {
        const particleConfig: ParticleConfig = {
            count: 20,
            size: 3,
            speed: 100,
            lifetime: 1000,
            color: '#ff6b6b',
            fadeOut: true,
            ...config
        };

        for (let i = 0; i < particleConfig.count; i++) {
            this.createParticle(x, y, particleConfig);
        }

        this.startAnimation();
    }

    /**
     * Create goal reached effect
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    public createGoalEffect(x: number, y: number): void {
        this.createExplosion(x, y, {
            count: 30,
            size: 4,
            speed: 80,
            lifetime: 1500,
            color: '#68d391',
            fadeOut: true
        });
    }

    /**
     * Create death effect
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    public createDeathEffect(x: number, y: number): void {
        this.createExplosion(x, y, {
            count: 15,
            size: 5,
            speed: 120,
            lifetime: 800,
            color: '#e53e3e',
            fadeOut: true
        });
    }

    /**
     * Create single particle
     * @param x - X coordinate
     * @param y - Y coordinate
     * @param config - Particle configuration
     */
    private createParticle(x: number, y: number, config: ParticleConfig): void {
        const angle = Math.random() * Math.PI * 2;
        const speed = config.speed * (0.5 + Math.random() * 0.5);

        const particle = new fabric.Circle({
            left: x,
            top: y,
            radius: config.size,
            fill: config.color,
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false
        });

        this.canvas.add(particle);

        this.particles.push({
            shape: particle,
            velocityX: Math.cos(angle) * speed,
            velocityY: Math.sin(angle) * speed,
            lifetime: config.lifetime,
            maxLifetime: config.lifetime,
            fadeOut: config.fadeOut
        });
    }

    /**
     * Start particle animation loop
     */
    private startAnimation(): void {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.animate();
    }

    /**
     * Animation loop for particles
     */
    private animate(): void {
        const deltaTime = 16; // ~60fps

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update position
            const newLeft = particle.shape.left! + particle.velocityX * (deltaTime / 1000);
            const newTop = particle.shape.top! + particle.velocityY * (deltaTime / 1000);
            
            particle.shape.set({
                left: newLeft,
                top: newTop
            });

            // Update lifetime
            particle.lifetime -= deltaTime;

            // Update opacity if fade out is enabled
            if (particle.fadeOut) {
                const opacity = particle.lifetime / particle.maxLifetime;
                particle.shape.set({ opacity: Math.max(0, opacity) });
            }

            // Remove dead particles
            if (particle.lifetime <= 0) {
                this.canvas.remove(particle.shape);
                this.particles.splice(i, 1);
            }
        }

        // Continue animation if particles exist
        if (this.particles.length > 0) {
            this.canvas.renderAll();
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.isAnimating = false;
            this.animationId = null;
        }
    }

    /**
     * Create screen transition effect
     * @param type - Transition type
     * @param duration - Duration in milliseconds
     * @param onComplete - Callback when transition completes
     */
    public createTransition(
        type: TransitionType, 
        duration: number = 500, 
        onComplete?: () => void
    ): void {
        const overlay = new fabric.Rect({
            left: 0,
            top: 0,
            width: this.canvas.getWidth(),
            height: this.canvas.getHeight(),
            fill: '#000000',
            selectable: false,
            evented: false
        });

        switch (type) {
            case TransitionType.FADE_IN:
                overlay.set({ opacity: 1 });
                this.canvas.add(overlay);
                overlay.animate({ opacity: 0 }, {
                    duration,
                    onChange: this.canvas.renderAll.bind(this.canvas),
                    onComplete: () => {
                        this.canvas.remove(overlay);
                        onComplete?.();
                    }
                });
                break;

            case TransitionType.FADE_OUT:
                overlay.set({ opacity: 0 });
                this.canvas.add(overlay);
                overlay.animate({ opacity: 1 }, {
                    duration,
                    onChange: this.canvas.renderAll.bind(this.canvas),
                    onComplete: () => onComplete?.()
                });
                break;

            case TransitionType.SLIDE_UP:
                overlay.set({ top: this.canvas.getHeight() });
                this.canvas.add(overlay);
                overlay.animate({ top: 0 }, {
                    duration,
                    onChange: this.canvas.renderAll.bind(this.canvas),
                    onComplete: () => onComplete?.()
                });
                break;

            case TransitionType.SLIDE_DOWN:
                overlay.set({ top: -this.canvas.getHeight() });
                this.canvas.add(overlay);
                overlay.animate({ top: 0 }, {
                    duration,
                    onChange: this.canvas.renderAll.bind(this.canvas),
                    onComplete: () => onComplete?.()
                });
                break;
        }
    }

    /**
     * Clear all effects
     */
    public clearEffects(): void {
        // Stop animation
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.isAnimating = false;

        // Remove all particles
        this.particles.forEach(particle => {
            this.canvas.remove(particle.shape);
        });
        this.particles = [];
    }

    /**
     * Get active particles count
     */
    public getActiveParticlesCount(): number {
        return this.particles.length;
    }

    /**
     * Check if effects are currently animating
     */
    public isEffectAnimating(): boolean {
        return this.isAnimating;
    }

    /**
     * Cleanup renderer resources
     */
    public dispose(): void {
        this.clearEffects();
    }
    
    /**
         * Render player trail
         * @param trail - Array of trail points
         * @param playerRadius - Player radius for trail positioning
         */
        public renderTrail(_trail: Array<{x: number; y: number}>, _playerRadius: number): void {
                // Trail rendering implementation placeholder
                // See issue #57 for implementation task
            }

}
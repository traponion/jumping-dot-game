/**
 * @fileoverview Clear animation module for stage clear effects
 * @module modules/animation/ClearAnimationModule
 * @description Handles stage clear celebration animation with particles
 */

import { GAME_CONFIG } from '../../constants/GameConstants.js';
import type { GameState } from '../../stores/GameState.js';
import type { ClearAnimation, ClearAnimationModuleInterface } from '../../types/AnimationTypes.js';
import type { Player } from '../../types/GameTypes.js';
import { getCurrentTime } from '../../utils/GameUtils.js';
import { randomRange } from '../../utils/GameUtils.js';

/**
 * Clear animation module implementation
 * Handles stage clear celebration effects with particle system
 */
export class ClearAnimationModule implements ClearAnimationModuleInterface {
    private animation: ClearAnimation;
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.animation = {
            active: false,
            startTime: null,
            duration: 3000,
            particles: []
        };
    }

    /**
     * Start clear animation with particle generation
     * @param player - Player object to base animation on
     */
    start(player: Player): void {
        this.animation.active = true;
        this.animation.startTime = getCurrentTime();
        this.animation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            this.animation.particles.push({
                x: player.x + randomRange(-50, 50),
                y: player.y + randomRange(-50, 50),
                vx: randomRange(-4, 4),
                vy: randomRange(-6, 2),
                life: 1.0,
                decay: randomRange(0.02, 0.04)
            });
        }
    }

    /**
     * Update clear animation particles and check for auto-start
     */
    update(): void {
        // Check if we should start clear animation
        if (this.gameState.runtime.shouldStartClearAnimation && !this.animation.active) {
            if (this.gameState.runtime.player) {
                this.start(this.gameState.runtime.player);
                // Reset the flag to prevent multiple triggers
                this.gameState.runtime.shouldStartClearAnimation = false;
            }
        }

        if (!this.animation.active || this.animation.startTime === null) return;

        const currentTime = getCurrentTime();
        const elapsed = currentTime - this.animation.startTime;

        for (let i = this.animation.particles.length - 1; i >= 0; i--) {
            const particle = this.animation.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.animation.particles.splice(i, 1);
            }
        }

        if (elapsed > this.animation.duration) {
            this.animation.active = false;
        }
    }

    /**
     * Get current animation state
     * @returns Current clear animation state
     */
    get(): ClearAnimation {
        return this.animation;
    }

    /**
     * Reset animation to initial state
     */
    reset(): void {
        this.animation.active = false;
        this.animation.startTime = null;
        this.animation.particles = [];
    }

    /**
     * Check if animation is currently active
     * @returns Whether the animation is active
     */
    isActive(): boolean {
        return this.animation.active;
    }
}

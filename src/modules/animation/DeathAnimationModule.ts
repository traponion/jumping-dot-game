/**
 * @fileoverview Death animation module for player death effects
 * @module modules/animation/DeathAnimationModule
 * @description Handles player death animation with explosion particles and autonomous death handling
 */

import { GAME_CONFIG } from '../../constants/GameConstants.js';
import type { GameState } from '../../stores/GameState.js';
import type { DeathAnimation, DeathAnimationModuleInterface } from '../../types/AnimationTypes.js';
import type { Player } from '../../types/GameTypes.js';
import { getCurrentTime, randomRange } from '../../utils/GameUtils.js';

/**
 * Death animation module implementation
 * Handles player death effects with explosion particles and autonomous death handling
 */
export class DeathAnimationModule implements DeathAnimationModuleInterface {
    private animation: DeathAnimation;
    private gameState: GameState;
    private deathAnimationTriggered: boolean;

    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.deathAnimationTriggered = false;
        this.animation = {
            active: false,
            startTime: null,
            duration: 2000,
            particles: []
        };
    }

    /**
     * Start death animation with explosion particles
     * @param player - Player object to base animation on
     */
    start(player: Player): void {
        this.animation.active = true;
        this.animation.startTime = getCurrentTime();
        this.animation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.animation.particleCount;
            const speed = randomRange(3, 7);

            this.animation.particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                decay: randomRange(0.01, 0.03),
                size: randomRange(2, 4)
            });
        }
    }

    /**
     * Update death animation particles and handle autonomous death detection
     */
    update(): void {
        // Autonomous death handling: check if game over flag is set and animation hasn't started yet
        if (
            this.gameState.gameOver &&
            !this.animation.active &&
            !this.gameState.runtime.shouldStartDeathAnimation &&
            !this.deathAnimationTriggered
        ) {
            if (this.gameState.runtime.player) {
                // Add death marker with position adjustment for visibility
                const player = this.gameState.runtime.player;
                this.gameState.runtime.deathMarks.push({
                    x: player.x,
                    y: Math.min(player.y, 580), // Clamp Y position above bottom edge for optimal visibility
                    timestamp: getCurrentTime()
                });

                // Start death animation
                this.start(player);

                // Set flag to prevent retriggering
                this.deathAnimationTriggered = true;
            }

            return;
        }

        // Check if we should start death animation (legacy flag support)
        if (this.gameState.runtime.shouldStartDeathAnimation && !this.animation.active) {
            if (this.gameState.runtime.player) {
                this.start(this.gameState.runtime.player);
                // Reset the flag to prevent multiple triggers
                this.gameState.runtime.shouldStartDeathAnimation = false;
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
     * @returns Current death animation state
     */
    get(): DeathAnimation {
        return this.animation;
    }

    /**
     * Add death mark to game state
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    addDeathMark(x: number, y: number): void {
        this.gameState.runtime.deathMarks.push({
            x,
            y,
            timestamp: getCurrentTime()
        });
    }

    /**
     * Reset animation to initial state
     */
    reset(): void {
        this.animation.active = false;
        this.animation.startTime = null;
        this.animation.particles = [];

        // Reset death animation trigger flag for new game
        this.deathAnimationTriggered = false;
    }

    /**
     * Check if animation is currently active
     * @returns Whether the animation is active
     */
    isActive(): boolean {
        return this.animation.active;
    }
}

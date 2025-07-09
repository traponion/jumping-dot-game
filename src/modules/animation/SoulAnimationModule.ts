/**
 * @fileoverview Soul animation module for death counter UI animation
 * @module modules/animation/SoulAnimationModule
 * @description Handles soul movement animation from player to death counter with smooth easing
 */

import type { GameState } from '../../stores/GameState.js';
import type {
    SoulAnimation,
    SoulAnimationModuleInterface,
    SoulParticle
} from '../../types/AnimationTypes.js';
import type { Player } from '../../types/GameTypes.js';
import { getCurrentTime } from '../../utils/GameUtils.js';

/**
 * Soul animation module implementation
 * Handles soul movement from player position to death counter UI with smooth easing
 */
export class SoulAnimationModule implements SoulAnimationModuleInterface {
    private animation: SoulAnimation;

    constructor(_gameState: GameState) {
        // GameState is reserved for future features like autonomous animation
        this.animation = {
            active: false,
            startTime: null,
            duration: 1000, // 1 second for soul to reach counter
            particles: []
        };
    }

    /**
     * Start soul animation with target position from DOM
     * @param player - Player object to base animation on
     * @param onComplete - Optional completion callback
     */
    start(player: Player, onComplete?: () => void): void {
        this.animation.active = true;
        this.animation.startTime = getCurrentTime();
        this.animation.particles = [];

        // Get death counter position from DOM
        let targetX = 750; // Default right side
        let targetY = 25; // Default top

        if (typeof document !== 'undefined' && document && document.getElementById) {
            try {
                const deathCountElement = document.getElementById('deathCount');
                if (deathCountElement) {
                    const rect = deathCountElement.getBoundingClientRect();
                    targetX = rect.left + rect.width / 2;
                    targetY = rect.top + rect.height / 2;
                }
            } catch (_error) {
                // Fallback to default values if DOM access fails
                targetX = 750;
                targetY = 25;
            }
        }

        // Create soul particle with conditional onComplete
        const particle: SoulParticle = {
            x: player.x,
            y: player.y,
            targetX,
            targetY,
            vx: 0,
            vy: 0,
            life: 1.0,
            decay: 0,
            // Store initial positions for accurate calculation
            initialX: player.x,
            initialY: player.y
        };

        if (onComplete) {
            particle.onComplete = onComplete;
        }

        this.animation.particles.push(particle);
    }

    /**
     * Update soul animation with smooth easing movement
     */
    update(): void {
        if (!this.animation.active || this.animation.startTime === null) return;

        const currentTime = getCurrentTime();
        const elapsed = currentTime - this.animation.startTime;
        const progress = Math.min(elapsed / this.animation.duration, 1.0);

        for (let i = this.animation.particles.length - 1; i >= 0; i--) {
            const particle = this.animation.particles[i];

            // Smooth easing movement to target (with null checks)
            const easeProgress = 1 - (1 - progress) ** 3; // ease-out cubic
            if (particle.targetX !== undefined && particle.targetY !== undefined) {
                // Use initial position for accurate calculation
                const initialX = particle.initialX ?? particle.x;
                const initialY = particle.initialY ?? particle.y;
                particle.x = initialX + (particle.targetX - initialX) * easeProgress;
                particle.y = initialY + (particle.targetY - initialY) * easeProgress;
            }

            // Check if animation completed
            if (progress >= 1.0) {
                // Call completion callback if provided
                if (particle.onComplete) {
                    particle.onComplete();
                }
                this.animation.particles.splice(i, 1);
            }
        }

        // End animation when all particles are done
        if (progress >= 1.0) {
            this.animation.active = false;
        }
    }

    /**
     * Get current animation state
     * @returns Current soul animation state
     */
    get(): SoulAnimation {
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

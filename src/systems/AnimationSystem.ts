/**
 * @fileoverview Animation system for particle effects and visual feedback
 * @module systems/AnimationSystem
 * @description Domain Layer - Manages particle-based animations for game events.
 * Handles stage clear celebrations and death effect animations with physics simulation.
 */

import { GAME_CONFIG } from '../stores/GameState.js';
import type { GameState } from '../stores/GameState.js';
import type { AnimationSystem as AnimationData, Player } from '../types/GameTypes.js';
import { getCurrentTime, randomRange } from './PlayerSystem.js';

/**
 * Animation system for particle effects and visual feedback
 * @class AnimationSystem
 * @description Manages particle-based animations for stage clear and death events
 */
export class AnimationSystem {
    /** @private {AnimationData} Stage clear celebration animation */
    private clearAnimation: AnimationData;
    /** @private {AnimationData} Player death explosion animation */
    private deathAnimation: AnimationData;
    /** @private {AnimationData} Soul flying to death counter animation */
    private soulAnimation: AnimationData;
    /** @private {GameState} Game state instance for dependency injection */
    private gameState: GameState;
    /** @private {boolean} Flag to prevent death animation from triggering multiple times */
    private deathAnimationTriggered: boolean;

    /**
     * Creates a new AnimationSystem instance
     * @constructor
     * @param {GameState} gameState - Game state instance for dependency injection
     * @description Initializes clear and death animation configurations
     */
    constructor(gameState: GameState) {
        this.gameState = gameState;
        this.deathAnimationTriggered = false;
        this.clearAnimation = {
            active: false,
            startTime: null,
            duration: 3000,
            particles: []
        };

        this.deathAnimation = {
            active: false,
            startTime: null,
            duration: 2000,
            particles: []
        };

        this.soulAnimation = {
            active: false,
            startTime: null,
            duration: 1000, // 1 second for soul to reach counter
            particles: []
        };
    }

    /**
     * Start stage clear celebration animation
     * @param {Player} player - Player object for particle spawn position
     * @returns {void}
     * @description Creates celebratory particles around player position when stage is cleared
     */
    startClearAnimation(player: Player): void {
        console.log('🎉 Starting clear animation at:', player.x, player.y);
        this.clearAnimation.active = true;
        this.clearAnimation.startTime = getCurrentTime();
        this.clearAnimation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            // Create radial explosion pattern for clear animation fireworks
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.animation.particleCount;
            const speed = randomRange(6, 15); // Faster explosion for celebration

            this.clearAnimation.particles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Slight upward bias
                life: 1.0,
                decay: randomRange(0.015, 0.025), // Longer life for better visibility
                size: randomRange(3, 6) // Bigger particles for celebration
            });
        }
    }

    /**
     * Update stage clear animation particles
     * @returns {void}
     * @description Updates particle physics and removes expired particles
     */
    updateClearAnimation(): void {
        // Check if we should start clear animation
        if (this.gameState.runtime.shouldStartClearAnimation && !this.clearAnimation.active) {
            this.startClearAnimation(this.gameState.runtime.player);
            // Reset the flag to prevent multiple triggers
            this.gameState.runtime.shouldStartClearAnimation = false;
        }

        if (!this.clearAnimation.active || this.clearAnimation.startTime === null) return;

        const currentTime = getCurrentTime();
        const elapsed = currentTime - this.clearAnimation.startTime;

        for (let i = this.clearAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.clearAnimation.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.clearAnimation.particles.splice(i, 1);
            }
        }

        if (elapsed > this.clearAnimation.duration) {
            this.clearAnimation.active = false;
        }
    }

    /**
     * Start player death explosion animation
     * @param {Player} player - Player object for explosion center position
     * @returns {void}
     * @description Creates radial explosion particles when player dies
     */
    startDeathAnimation(player: Player): void {
        console.log('🎆 Starting death animation at:', player.x, player.y);
        this.deathAnimation.active = true;
        this.deathAnimation.startTime = getCurrentTime();
        this.deathAnimation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.animation.particleCount;
            const speed = randomRange(5, 12); // Faster explosion for fireworks effect

            this.deathAnimation.particles.push({
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
     * Update death animation particles
     * @returns {void}
     * @description Updates explosion particle physics and removes expired particles
     */
    updateDeathAnimation(): void {
        // Autonomous death handling: check if game over flag is set and animation hasn't started yet
        if (
            this.gameState.gameOver &&
            !this.deathAnimation.active &&
            !this.gameState.runtime.shouldStartDeathAnimation &&
            !this.deathAnimationTriggered
        ) {
            // Add death marker with position adjustment for visibility
            const player = this.gameState.runtime.player;
            this.gameState.runtime.deathMarks.push({
                x: player.x,
                y: Math.min(player.y, 580), // Clamp Y position above bottom edge for optimal visibility
                timestamp: getCurrentTime()
            });

            // Start death animation
            this.startDeathAnimation(player);

            // Set flag to prevent retriggering
            this.deathAnimationTriggered = true;

            // No soul animation - just death count is handled by GameRuleSystem

            return;
        }

        // Check if we should start death animation (legacy flag support)
        if (this.gameState.runtime.shouldStartDeathAnimation && !this.deathAnimation.active) {
            this.startDeathAnimation(this.gameState.runtime.player);
            // Reset the flag to prevent multiple triggers
            this.gameState.runtime.shouldStartDeathAnimation = false;
        }

        if (!this.deathAnimation.active || this.deathAnimation.startTime === null) return;

        const currentTime = getCurrentTime();
        const elapsed = currentTime - this.deathAnimation.startTime;

        for (let i = this.deathAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.deathAnimation.particles[i];

            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life -= particle.decay;

            if (particle.life <= 0) {
                this.deathAnimation.particles.splice(i, 1);
            }
        }

        if (elapsed > this.deathAnimation.duration) {
            this.deathAnimation.active = false;
        }
    }

    /**
     * Add death marker at specified location
     * @param {number} x - X coordinate of death location
     * @param {number} y - Y coordinate of death location
     * @returns {void}
     * @description Records death location for visual feedback
     */
    addDeathMark(x: number, y: number): void {
        this.gameState.runtime.deathMarks.push({
            x,
            y,
            timestamp: getCurrentTime()
        });
    }

    /**
     * Start soul animation flying to death counter
     * @param {Player} player - Player object for soul spawn position
     * @param {Function} [onComplete] - Optional callback when animation completes
     * @returns {void}
     * @description Creates a soul particle that flies from death location to death counter
     */
    startSoulAnimation(player: Player, onComplete?: () => void): void {
        this.soulAnimation.active = true;
        this.soulAnimation.startTime = getCurrentTime();
        this.soulAnimation.particles = [];

        // Get death counter position from DOM
        let targetX = 750; // Default right side
        let targetY = 25; // Default top

        if (typeof document !== 'undefined' && document && document.getElementById) {
            const deathCountElement = document.getElementById('deathCount');
            if (deathCountElement) {
                const rect = deathCountElement.getBoundingClientRect();
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2;
            }
        }

        // Create soul particle with conditional onComplete
        this.soulAnimation.particles.push({
            x: player.x,
            y: player.y,
            targetX,
            targetY,
            vx: 0,
            vy: 0,
            life: 1.0,
            decay: 0,
            ...(onComplete && { onComplete })
        });
    }

    /**
     * Update soul animation particles
     * @returns {void}
     * @description Updates soul particle movement towards death counter
     */
    updateSoulAnimation(): void {
        if (!this.soulAnimation.active || this.soulAnimation.startTime === null) return;

        const currentTime = getCurrentTime();
        const elapsed = currentTime - this.soulAnimation.startTime;
        const progress = Math.min(elapsed / this.soulAnimation.duration, 1.0);

        for (let i = this.soulAnimation.particles.length - 1; i >= 0; i--) {
            const particle = this.soulAnimation.particles[i];

            // Smooth easing movement to target (with null checks)
            const easeProgress = 1 - (1 - progress) ** 3; // ease-out cubic
            if (particle.targetX !== undefined && particle.targetY !== undefined) {
                particle.x = particle.x + (particle.targetX - particle.x) * easeProgress;
                particle.y = particle.y + (particle.targetY - particle.y) * easeProgress;
            }

            // Check if animation completed
            if (progress >= 1.0) {
                // Call completion callback if provided
                if (particle.onComplete) {
                    particle.onComplete();
                }
                this.soulAnimation.particles.splice(i, 1);
            }
        }

        // End animation when all particles are done
        if (progress >= 1.0) {
            this.soulAnimation.active = false;
        }
    }

    /**
     * Get stage clear animation data
     * @returns {AnimationData} Current clear animation state
     */
    getClearAnimation(): AnimationData {
        return this.clearAnimation;
    }

    /**
     * Get death animation data
     * @returns {AnimationData} Current death animation state
     */
    getDeathAnimation(): AnimationData {
        return this.deathAnimation;
    }

    /**
     * Get soul animation data
     * @returns {AnimationData} Current soul animation state
     */
    getSoulAnimation(): AnimationData {
        return this.soulAnimation;
    }

    /**
     * Reset all animations to initial state
     * @returns {void}
     * @description Stops all animations and clears particles
     */
    reset(): void {
        this.clearAnimation.active = false;
        this.clearAnimation.startTime = null;
        this.clearAnimation.particles = [];

        this.deathAnimation.active = false;
        this.deathAnimation.startTime = null;
        this.deathAnimation.particles = [];

        this.soulAnimation.active = false;
        this.soulAnimation.startTime = null;
        this.soulAnimation.particles = [];

        // Reset death animation trigger flag for new game
        this.deathAnimationTriggered = false;
    }

    /**
     * Check if any animation is currently active
     * @returns {boolean} True if any animation is running
     */
    isAnyAnimationActive(): boolean {
        return (
            this.clearAnimation.active || this.deathAnimation.active || this.soulAnimation.active
        );
    }
}

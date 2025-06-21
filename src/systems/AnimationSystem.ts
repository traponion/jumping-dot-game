/**
 * @fileoverview Animation system for particle effects and visual feedback
 * @module systems/AnimationSystem
 * @description Domain Layer - Manages particle-based animations for game events.
 * Handles stage clear celebrations and death effect animations with physics simulation.
 */

import { GAME_CONFIG } from '../constants/GameConstants.js';
import { getGameStore } from '../stores/GameZustandStore.js';
import type { AnimationSystem as AnimationData, Player } from '../types/GameTypes.js';
import { getCurrentTime, randomRange } from '../utils/GameUtils.js';

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

    /**
     * Creates a new AnimationSystem instance
     * @constructor
     * @description Initializes clear and death animation configurations
     */
    constructor() {
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
    }

    /**
     * Start stage clear celebration animation
     * @param {Player} player - Player object for particle spawn position
     * @returns {void}
     * @description Creates celebratory particles around player position when stage is cleared
     */
    startClearAnimation(player: Player): void {
        this.clearAnimation.active = true;
        this.clearAnimation.startTime = getCurrentTime();
        this.clearAnimation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            this.clearAnimation.particles.push({
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
     * Update stage clear animation particles
     * @returns {void}
     * @description Updates particle physics and removes expired particles
     */
    updateClearAnimation(): void {
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
        this.deathAnimation.active = true;
        this.deathAnimation.startTime = getCurrentTime();
        this.deathAnimation.particles = [];

        for (let i = 0; i < GAME_CONFIG.animation.particleCount; i++) {
            const angle = (Math.PI * 2 * i) / GAME_CONFIG.animation.particleCount;
            const speed = randomRange(3, 7);

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
        getGameStore().addDeathMark({
            x,
            y,
            timestamp: getCurrentTime()
        });
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
    }

    /**
     * Check if any animation is currently active
     * @returns {boolean} True if any animation is running
     */
    isAnyAnimationActive(): boolean {
        return this.clearAnimation.active || this.deathAnimation.active;
    }
}

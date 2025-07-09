/**
 * @fileoverview Animation system type definitions
 * @module types/AnimationTypes
 * @description Specialized animation interfaces for module splitting
 *
 * This file extends the base AnimationSystem interface from GameTypes.ts
 * to provide more specialized interfaces for each animation module.
 */

import type { AnimationSystem, Particle } from './GameTypes.js';

/**
 * Base animation interface extending GameTypes AnimationSystem
 * @interface BaseAnimation
 * @extends AnimationSystem
 */
export interface BaseAnimation extends AnimationSystem {
    active: boolean;
    startTime: number | null;
    duration: number;
    particles: Particle[];
}

/**
 * Clear animation specific interface
 * @interface ClearAnimation
 * @extends BaseAnimation
 */
export interface ClearAnimation extends BaseAnimation {
    particles: ClearParticle[];
}

/**
 * Death animation specific interface
 * @interface DeathAnimation
 * @extends BaseAnimation
 */
export interface DeathAnimation extends BaseAnimation {
    particles: DeathParticle[];
}

/**
 * Soul animation specific interface
 * @interface SoulAnimation
 * @extends BaseAnimation
 */
export interface SoulAnimation extends BaseAnimation {
    particles: SoulParticle[];
}

/**
 * Clear animation particle interface
 * @interface ClearParticle
 * @extends Particle
 */
export interface ClearParticle extends Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
}

/**
 * Death animation particle interface
 * @interface DeathParticle
 * @extends Particle
 */
export interface DeathParticle extends Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size: number;
}

/**
 * Soul animation particle interface
 * @interface SoulParticle
 * @extends Particle
 */
export interface SoulParticle extends Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    onComplete?: () => void;
}

/**
 * Animation module interface for common operations
 * @interface AnimationModule
 * @template T - The specific animation type
 * @template P - The specific particle type
 */
export interface AnimationModule<T extends BaseAnimation, _P extends Particle> {
    /**
     * Start the animation
     * @param player - Player object to base animation on
     * @param onComplete - Optional completion callback
     */
    start(player: import('./GameTypes.js').Player, onComplete?: () => void): void;

    /**
     * Update the animation
     */
    update(): void;

    /**
     * Get the current animation state
     * @returns The current animation state
     */
    get(): T;

    /**
     * Reset the animation to initial state
     */
    reset(): void;

    /**
     * Check if animation is currently active
     * @returns Whether the animation is active
     */
    isActive(): boolean;
}

/**
 * Clear animation module interface
 * @interface ClearAnimationModule
 */
export interface ClearAnimationModuleInterface
    extends AnimationModule<ClearAnimation, ClearParticle> {
    start(player: import('./GameTypes.js').Player): void;
}

/**
 * Death animation module interface
 * @interface DeathAnimationModule
 */
export interface DeathAnimationModuleInterface
    extends AnimationModule<DeathAnimation, DeathParticle> {
    start(player: import('./GameTypes.js').Player): void;
    addDeathMark(x: number, y: number): void;
}

/**
 * Soul animation module interface
 * @interface SoulAnimationModule
 */
export interface SoulAnimationModuleInterface extends AnimationModule<SoulAnimation, SoulParticle> {
    start(player: import('./GameTypes.js').Player, onComplete?: () => void): void;
}

/**
 * Animation core coordination interface
 * @interface AnimationCore
 */
export interface AnimationCore {
    /**
     * Start clear animation
     * @param player - Player object
     */
    startClearAnimation(player: import('./GameTypes.js').Player): void;

    /**
     * Update clear animation
     */
    updateClearAnimation(): void;

    /**
     * Get clear animation state
     * @returns Clear animation state
     */
    getClearAnimation(): ClearAnimation;

    /**
     * Start death animation
     * @param player - Player object
     */
    startDeathAnimation(player: import('./GameTypes.js').Player): void;

    /**
     * Update death animation
     */
    updateDeathAnimation(): void;

    /**
     * Get death animation state
     * @returns Death animation state
     */
    getDeathAnimation(): DeathAnimation;

    /**
     * Add death mark
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    addDeathMark(x: number, y: number): void;

    /**
     * Start soul animation
     * @param player - Player object
     * @param onComplete - Optional completion callback
     */
    startSoulAnimation(player: import('./GameTypes.js').Player, onComplete?: () => void): void;

    /**
     * Update soul animation
     */
    updateSoulAnimation(): void;

    /**
     * Get soul animation state
     * @returns Soul animation state
     */
    getSoulAnimation(): SoulAnimation;

    /**
     * Reset all animations
     */
    reset(): void;

    /**
     * Check if any animation is active
     * @returns Whether any animation is active
     */
    isAnyAnimationActive(): boolean;
}

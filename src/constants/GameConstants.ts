/**
 * @fileoverview Game constants and configuration values
 * @module GameConstants
 * @description Centralized configuration for game physics, rendering, and behavior.
 * This module belongs to the Domain layer and provides immutable constant values
 * used throughout the game systems for consistent behavior and easy tuning.
 */

/**
 * Default physics constants for game simulation
 * @constant {Object} DEFAULT_PHYSICS_CONSTANTS
 * @property {number} gravity - Downward acceleration force applied to entities (pixels/frame²)
 * @property {number} jumpForce - Initial upward velocity when jumping (negative = upward)
 * @property {number} autoJumpInterval - Time between automatic jumps in milliseconds
 * @property {number} moveSpeed - Base horizontal movement speed (pixels/frame)
 * @property {number} gameSpeed - Global game speed multiplier (1.0 = normal, 2.0 = double speed)
 * @example
 * // Apply gravity to player
 * player.vy += DEFAULT_PHYSICS_CONSTANTS.gravity * dtFactor;
 * 
 * // Trigger jump
 * player.vy = DEFAULT_PHYSICS_CONSTANTS.jumpForce;
 */
export const DEFAULT_PHYSICS_CONSTANTS = {
    gravity: 0.6,
    jumpForce: -12,
    autoJumpInterval: 150,
    moveSpeed: 4,
    gameSpeed: 2.0
} as const;

/**
 * Game configuration settings for rendering and gameplay
 * @constant {Object} GAME_CONFIG
 * @property {Object} canvas - Canvas rendering configuration
 * @property {number} canvas.defaultWidth - Default canvas width in pixels
 * @property {number} canvas.defaultHeight - Default canvas height in pixels
 * @property {Object} player - Player entity configuration
 * @property {number} player.defaultRadius - Default player collision radius in pixels
 * @property {number} player.maxTrailLength - Maximum number of trail points to maintain
 * @property {number} player.acceleration - Player acceleration rate (pixels/frame²)
 * @property {number} player.minVelocity - Minimum velocity threshold for movement detection
 * @property {Object} animation - Animation and visual effect settings
 * @property {number} animation.particleCount - Number of particles in particle effects
 * @property {number} animation.clearAnimationDuration - Duration of stage clear animation in milliseconds
 * @property {number} animation.deathAnimationDuration - Duration of death animation in milliseconds
 * @example
 * // Initialize canvas
 * canvas.width = GAME_CONFIG.canvas.defaultWidth;
 * canvas.height = GAME_CONFIG.canvas.defaultHeight;
 * 
 * // Create player with default settings
 * const player = {
 *   radius: GAME_CONFIG.player.defaultRadius,
 *   acceleration: GAME_CONFIG.player.acceleration
 * };
 * 
 * // Configure particle system
 * const particleSystem = new ParticleSystem(GAME_CONFIG.animation.particleCount);
 */
export const GAME_CONFIG = {
    canvas: {
        defaultWidth: 800,
        defaultHeight: 600
    },
    player: {
        defaultRadius: 3,
        maxTrailLength: 8,
        acceleration: 0.5,
        minVelocity: 0.2
    },
    animation: {
        particleCount: 15,
        clearAnimationDuration: 2000,
        deathAnimationDuration: 1000
    }
} as const;

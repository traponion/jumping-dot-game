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
        acceleration: 0.5,
        minVelocity: 0.2
    },
    animation: {
        particleCount: 15,
        clearAnimationDuration: 2000,
        deathAnimationDuration: 1000
    }
} as const;

/**
 * Rendering constants for UI and visual elements
 * @constant {Object} RENDERING_CONSTANTS
 * @property {number} TARGET_FRAME_TIME - Target frame time in milliseconds for smooth animation
 * @property {Object} TYPOGRAPHY - Font size constants for UI text elements
 * @property {number} TYPOGRAPHY.TITLE_SIZE - Font size for main titles (game over, etc.)
 * @property {number} TYPOGRAPHY.MENU_SIZE - Font size for menu options
 * @property {number} TYPOGRAPHY.INSTRUCTION_SIZE - Font size for instruction text
 * @property {number} TYPOGRAPHY.SMALL_SIZE - Font size for small text elements
 * @property {Object} ANIMATION - Animation-specific rendering constants
 * @property {number} ANIMATION.TRAJECTORY_OFFSET_X - X offset for trajectory prediction rendering
 * @property {number} ANIMATION.TRAJECTORY_OFFSET_Y - Y offset for trajectory prediction rendering
 * @property {number} ANIMATION.CROSSHAIR_SIZE - Size of crosshair elements in pixels
 * @property {number} ANIMATION.PARTICLE_RADIUS - Radius of particle effects in pixels
 * @example
 * // Use typography constants for consistent UI text
 * const titleText = new fabric.Text('GAME OVER', {
 *   fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.TITLE_SIZE
 * });
 *
 * // Apply animation constants for trajectory rendering
 * const trajectoryX = playerX + RENDERING_CONSTANTS.ANIMATION.TRAJECTORY_OFFSET_X;
 * const trajectoryY = playerY + RENDERING_CONSTANTS.ANIMATION.TRAJECTORY_OFFSET_Y;
 */
export const RENDERING_CONSTANTS = {
    TARGET_FRAME_TIME: 16.67,
    TYPOGRAPHY: {
        TITLE_SIZE: 32,
        MENU_SIZE: 24,
        INSTRUCTION_SIZE: 16,
        SMALL_SIZE: 14
    },
    ANIMATION: {
        TRAJECTORY_OFFSET_X: -30,
        TRAJECTORY_OFFSET_Y: -20,
        CROSSHAIR_SIZE: 10,
        PARTICLE_RADIUS: 2
    }
} as const;

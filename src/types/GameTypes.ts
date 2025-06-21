/**
 * @fileoverview Type definitions for game entities and state management
 * @module types/GameTypes
 * @description Domain Layer - Core type definitions for the jumping dot game
 */

/**
 * Player entity interface representing the main character
 * @interface Player
 * @property {number} x - X coordinate position
 * @property {number} y - Y coordinate position
 * @property {number} vx - Horizontal velocity
 * @property {number} vy - Vertical velocity
 * @property {number} radius - Player collision radius
 * @property {boolean} grounded - Whether player is touching ground
 */
export interface Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    grounded: boolean;
}

/**
 * Camera position interface for viewport management
 * @interface Camera
 * @property {number} x - Camera X offset
 * @property {number} y - Camera Y offset
 */
export interface Camera {
    x: number;
    y: number;
}

/**
 * Particle interface for visual effects system
 * @interface Particle
 * @property {number} x - Particle X position
 * @property {number} y - Particle Y position
 * @property {number} vx - Particle horizontal velocity
 * @property {number} vy - Particle vertical velocity
 * @property {number} life - Current particle life value
 * @property {number} decay - Particle decay rate per frame
 * @property {number} [size] - Optional particle size
 */
export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size?: number;
}

/**
 * Animation system state interface
 * @interface AnimationSystem
 * @property {boolean} active - Whether animation is currently running
 * @property {number | null} startTime - Animation start timestamp
 * @property {number} duration - Animation duration in milliseconds
 * @property {Particle[]} particles - Array of active particles
 */
export interface AnimationSystem {
    active: boolean;
    startTime: number | null;
    duration: number;
    particles: Particle[];
}

/**
 * Death mark interface for tracking player death locations
 * @interface DeathMark
 * @property {number} x - Death location X coordinate
 * @property {number} y - Death location Y coordinate
 * @property {number} timestamp - Death timestamp for cleanup
 */
export interface DeathMark {
    x: number;
    y: number;
    timestamp: number;
}

/**
 * Trail point interface for player movement trails
 * @interface TrailPoint
 * @property {number} x - Trail point X coordinate
 * @property {number} y - Trail point Y coordinate
 */
export interface TrailPoint {
    x: number;
    y: number;
}

/**
 * Key state mapping for input management
 * @interface KeyState
 * @property {boolean} [key] - Dynamic key mapping to boolean state
 */
export interface KeyState {
    [key: string]: boolean;
}

/**
 * Main game state interface
 * @interface GameState
 * @property {boolean} gameRunning - Whether game is currently running
 * @property {boolean} gameOver - Whether game is in game over state
 * @property {number} currentStage - Current stage number
 * @property {number} timeLimit - Stage time limit in seconds
 * @property {number} timeRemaining - Time remaining in current stage
 * @property {number | null} gameStartTime - Game start timestamp
 * @property {number} finalScore - Final score when game ends
 * @property {boolean} hasMovedOnce - Whether player has moved at least once
 */
export interface GameState {
    gameRunning: boolean;
    gameOver: boolean;
    currentStage: number;
    timeLimit: number;
    timeRemaining: number;
    gameStartTime: number | null;
    finalScore: number;
    hasMovedOnce: boolean;
}

/**
 * Physics constants configuration interface
 * @interface PhysicsConstants
 * @property {number} gravity - Gravity acceleration value
 * @property {number} jumpForce - Force applied when jumping
 * @property {number} autoJumpInterval - Interval for automatic jumping
 * @property {number} moveSpeed - Player horizontal movement speed
 * @property {number} gameSpeed - Overall game speed multiplier
 */
export interface PhysicsConstants {
    gravity: number;
    jumpForce: number;
    autoJumpInterval: number;
    moveSpeed: number;
    gameSpeed: number;
}

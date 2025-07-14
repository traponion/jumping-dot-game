import { GAME_CONFIG } from '../stores/GameState.js';
import type { GameState } from '../stores/GameState.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
// GameUtils functions merged here for consolidation

/**
 * Get current high-resolution timestamp using Performance API
 */
export function getCurrentTime(): number {
    return performance.now();
}

/**
 * Calculate delta time factor for frame-rate independent physics
 */
export function calculateDeltaFactor(deltaTime: number, gameSpeed: number): number {
    return (deltaTime / (1000 / 60)) * gameSpeed;
}

/**
 * Check if a point is within a rectangle's bounds
 */
export function isPointInRect(
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    return (
        pointX >= rectX &&
        pointX <= rectX + rectWidth &&
        pointY >= rectY &&
        pointY <= rectY + rectHeight
    );
}

/**
 * Check collision between a circle and rectangle using AABB detection
 */
export function isCircleRectCollision(
    circleX: number,
    circleY: number,
    circleRadius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    return (
        circleX + circleRadius >= rectX &&
        circleX - circleRadius <= rectX + rectWidth &&
        circleY + circleRadius >= rectY &&
        circleY - circleRadius <= rectY + rectHeight
    );
}

/**
 * Generate random floating-point number between min and max (inclusive)
 */
export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}
import type { InputManager } from './InputManager.js';

/**
 * Player system responsible for handling player movement, input processing, auto-jump mechanics, and trail management
 * @class PlayerSystem
 * @description Manages all player-related logic including movement, auto-jumping, and trail tracking through Zustand store
 */
export class PlayerSystem {
    /** @private {InputManager | null} Input manager instance for handling user input */
    private inputManager: InputManager | null = null;

    /** @private {GameState} Game state instance for direct state access */
    private gameState: GameState;

    /** @private {boolean} Flag tracking if player has moved at least once */
    private hasMovedOnce = false;

    /** @private {number | null} Timestamp of the last auto-jump execution */
    private lastJumpTime: number | null = null;

    /**
     * Creates a new PlayerSystem instance
     * @constructor
     * @param {GameState} gameState - Game state instance for state management
     * @param {InputManager} [inputManager] - Optional input manager for handling user input
     */
    constructor(gameState: GameState, inputManager?: InputManager) {
        this.gameState = gameState;
        this.inputManager = inputManager || null;
    }

    /**
     * Sets the input manager for handling user input
     * @param {InputManager} inputManager - Input manager instance to set
     * @returns {void}
     */
    setInputManager(inputManager: InputManager): void {
        this.inputManager = inputManager;
    }

    /**
     * Updates player system for the current frame
     * @param {number} deltaTime - Time elapsed since last frame in milliseconds
     * @param {PhysicsConstants} physics - Physics constants for calculations
     * @returns {void}
     */
    update(deltaTime: number, physics: PhysicsConstants): void {
        const dtFactor = calculateDeltaFactor(deltaTime, physics.gameSpeed);

        this.handleInput(dtFactor);
        this.handleAutoJump(physics);
    }

    /**
     * Handles player input processing and velocity updates
     * @private
     * @param {number} dtFactor - Delta time factor for frame-rate independent movement
     * @returns {void}
     */
    private handleInput(dtFactor: number): void {
        if (!this.inputManager) return;

        const leftInput = this.inputManager.isPressed('move-left');
        const rightInput = this.inputManager.isPressed('move-right');

        if (leftInput || rightInput) {
            const player = this.gameState.runtime.player;
            const direction = leftInput ? -1 : 1;
            const acceleration = GAME_CONFIG.player.acceleration * direction * dtFactor;

            player.vx += acceleration;
            this.hasMovedOnce = true;
        }

        // Apply minimum velocity if player has moved once
        if (
            this.hasMovedOnce &&
            Math.abs(this.gameState.runtime.player.vx) < GAME_CONFIG.player.minVelocity
        ) {
            const sign = this.gameState.runtime.player.vx >= 0 ? 1 : -1;
            this.gameState.runtime.player.vx = GAME_CONFIG.player.minVelocity * sign;
        }
    }

    /**
     * Handles automatic jumping mechanism for the player
     * @private
     * @param {PhysicsConstants} physics - Physics constants containing auto-jump configuration
     * @returns {void}
     */
    private handleAutoJump(physics: PhysicsConstants): void {
        const currentTime = getCurrentTime();
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - physics.autoJumpInterval;
        }

        const player = this.gameState.runtime.player;
        if (player.grounded && currentTime - this.lastJumpTime > physics.autoJumpInterval) {
            player.vy = physics.jumpForce;
            player.grounded = false;
            this.lastJumpTime = currentTime;
        }
    }

    /**
     * Clamps player speed to the specified maximum value
     * @param {number} maxSpeed - Maximum allowed speed value
     * @returns {void}
     */
    clampSpeed(maxSpeed: number): void {
        const player = this.gameState.runtime.player;
        if (Math.abs(player.vx) > maxSpeed) {
            player.vx = player.vx >= 0 ? maxSpeed : -maxSpeed;
        }
    }

    /**
     * Resets the jump timer to allow immediate auto-jump
     * @returns {void}
     */
    resetJumpTimer(): void {
        this.lastJumpTime = getCurrentTime() - 150;
    }

    /**
     * Resets player to specified position and clears all state
     * @param {number} x - X coordinate to reset player to
     * @param {number} y - Y coordinate to reset player to
     * @returns {void}
     */
    reset(x: number, y: number): void {
        const player = this.gameState.runtime.player;
        player.x = x;
        player.y = y;
        player.vx = 0;
        player.vy = 0;
        player.grounded = false;

        this.hasMovedOnce = false;
        this.lastJumpTime = null;
    }

    /**
     * Gets whether the player has moved at least once
     * @returns {boolean} True if player has moved at least once, false otherwise
     */
    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

/**
 * Canvas dimensions interface for camera calculations
 */
export interface CanvasDimensions {
    width: number;
    height: number;
}

/**
 * CameraSystem - Autonomous camera positioning system
 * Integrated with PlayerSystem for related player-based calculations
 */
export class CameraSystem {
    private gameState: GameState;
    private canvas: CanvasDimensions;

    /**
     * Create CameraSystem with GameState and canvas dependencies
     * @param gameState - Game state containing player and camera data
     * @param canvas - Canvas dimensions for camera calculations
     */
    constructor(gameState: GameState, canvas: CanvasDimensions) {
        this.gameState = gameState;
        this.canvas = canvas;
    }

    /**
     * Update camera position to center on player
     * Implements autonomous update pattern with direct GameState mutation
     *
     * Camera Positioning Logic:
     * - Center camera horizontally on player position
     * - Camera.x = Player.x - (canvas.width / 2)
     * - Direct mutation of gameState.runtime.camera.x
     */
    public update(): void {
        const player = this.gameState.runtime.player;

        // ★★ Fixed: Only follow player horizontally to prevent motion sickness
        // Center camera on player X position only
        const newCameraX = player.x - this.canvas.width / 2;

        // Keep Y axis fixed to prevent vertigo/motion sickness
        // The camera Y should stay at a reasonable level for platformer gameplay
        const fixedCameraY = 0; // Keep camera level fixed

        this.gameState.runtime.camera.x = newCameraX;
        this.gameState.runtime.camera.y = fixedCameraY;
    }
}

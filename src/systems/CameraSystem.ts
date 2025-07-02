/**
 * @fileoverview Camera system for managing game camera positioning
 * @module systems/CameraSystem
 * @description System Layer - Camera positioning and viewport management
 */

import type { GameState } from '../stores/GameState.js';

/**
 * Canvas dimensions interface for camera calculations
 */
interface CanvasDimensions {
    width: number;
    height: number;
}

/**
 * CameraSystem - Autonomous camera positioning system
 * @class CameraSystem
 * @description System Layer - Manages camera positioning following player movement
 *
 * Responsibilities:
 * - Center camera on player position
 * - Direct GameState.runtime.camera mutation
 * - Autonomous operation via update() method
 *
 * This system follows the autonomous update pattern established in Phase 2.1:
 * - Direct GameState mutation (no return values)
 * - Self-contained logic
 * - Dependency injection for required resources
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

        // Center camera on player position
        this.gameState.runtime.camera.x = player.x - this.canvas.width / 2;
    }
}

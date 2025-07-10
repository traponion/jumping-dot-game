/**
 * @fileoverview Rendering abstraction interface - SOLID principles implementation
 * @module systems/IRenderSystem
 * @description Based on FabricRenderSystem public methods for dependency inversion
 */

import type { StageData } from '../core/StageLoader.js';
import type { LandingPrediction } from '../types/AnalyticsTypes.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';

/**
 * Landing prediction interface (FabricRenderSystem compatible)
 */
// LandingPrediction moved to domain layer: src/types/AnalyticsTypes.ts

/**
 * Position interface for crosshair and history
 */
export interface Position {
    x: number;
    y: number;
}

/**
 * IRenderSystem - Complete rendering abstraction interface
 *
 * Design Philosophy:
 * - Based on FabricRenderSystem's actual public methods
 * - Matches GameManager's actual usage patterns
 * - Enables dependency inversion principle (DIP)
 * - Supports future renderer switching (Pixi.js, etc.)
 *
 * This interface provides the complete contract for game rendering,
 * allowing core logic to be completely independent of rendering implementation.
 */
export interface IRenderSystem {
    // ===== Canvas Management =====

    /**
     * Clear the canvas for new rendering
     */
    clearCanvas(): void;

    /**
     * Set drawing style for rendering context
     */
    setDrawingStyle(): void;

    /**
     * Apply camera transform to rendering context
     * @param camera Camera position and properties
     */
    applyCameraTransform(camera: Camera): void;

    /**
     * Restore original camera transform
     */
    restoreCameraTransform(): void;

    /**
     * Render all pending objects to the canvas
     */
    renderAll(): void;

    // ===== Game Objects =====

    /**
     * Render the player character
     * @param player Player object to render
     */
    renderPlayer(player: Player): void;

    /**
     * Render the player's trail
     * @param trail Array of trail points to render
     * @param playerRadius Player radius for trail scaling
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void;

    /**
     * Render complete stage (platforms, goal, spikes, texts)
     * @param stage Stage data object
     */
    renderStage(stage: StageData): void;

    /**
     * Render death marks at previous death locations
     * @param deathMarks Array of death mark positions
     */
    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void;

    // ===== UI Elements =====

    /**
     * Render start instruction overlay
     */
    renderStartInstruction(): void;

    /**
     * Render game over menu
     * @param options Menu options array
     * @param selectedIndex Currently selected option index
     * @param finalScore Final game score
     * @param deathCount Optional death count for this stage
     */
    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void;

    /**
     * Render credits screen
     */
    renderCredits(): void;

    // ===== Animations =====

    /**
     * Render death animation particles
     * @param particles Array of particle objects
     */
    renderDeathAnimation(particles: Particle[]): void;

    /**
     * Render soul animation flying to death counter
     * @param particles Array of soul particle objects
     */
    renderSoulAnimation(particles: Particle[]): void;

    /**
     * Render stage clear animation
     * @param particles Array of particle objects
     * @param progress Animation progress (0-1)
     * @param centerX Center X coordinate
     * @param centerY Center Y coordinate
     */
    renderClearAnimation(
        particles: Particle[],
        progress: number,
        centerX: number,
        centerY: number
    ): void;

    // ===== Analytics & Predictions =====

    /**
     * Render landing prediction visualization
     */
    renderLandingPredictions(): void;

    /**
     * Set landing predictions for visualization
     * @param predictions Array of landing predictions
     */
    setLandingPredictions(predictions: LandingPrediction[]): void;

    /**
     * Add a new landing position to history
     * @param position Landing position to add
     */
    addLandingHistory(position: Position): void;

    /**
     * Update landing prediction animations
     */
    updateLandingPredictionAnimations(): void;

    // ===== System Management =====

    /**
     * Wait for render system initialization to complete
     */
    waitForInitialization(): Promise<void>;

    /**
     * Clean up rendering resources (async for complex cleanup)
     */
    cleanup(): Promise<void>;

    /**
     * Dispose of rendering system and release all resources
     */
    dispose(): void;
}

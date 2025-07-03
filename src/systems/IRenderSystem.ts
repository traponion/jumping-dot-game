/**
 * IRenderSystem - Rendering abstraction interface
 *
 * Defines the contract for all rendering operations in the game.
 * This interface abstracts away the underlying rendering framework
 * (currently Fabric.js) and prepares for potential migration to
 * other rendering engines like Pixi.js.
 *
 * Design Principles:
 * - Framework agnostic: No library-specific types
 * - Single responsibility: Each method has one clear purpose
 * - Performance oriented: Maintains current rendering performance
 * - Future ready: Supports potential rendering engine migration
 */

import type {
    Goal,
    MovingPlatform,
    Platform,
    Spike,
    StageData as Stage
} from '../core/StageLoader';
import type { Camera, GameState, Player, TrailPoint } from '../types/GameTypes';

/**
 * Landing prediction data structure
 */
export interface LandingPrediction {
    x: number;
    y: number;
    velocity: { x: number; y: number };
    time: number;
    isValid: boolean;
}

/**
 * Animation effect data structures
 */
export interface DeathAnimation {
    x: number;
    y: number;
    progress: number;
    startTime: number;
}

export interface ClearAnimation {
    progress: number;
    startTime: number;
}

export interface DeathMark {
    x: number;
    y: number;
    timestamp: number;
}

export interface Position {
    x: number;
    y: number;
}

/**
 * Main rendering system interface
 *
 * This interface defines all rendering operations required by the game.
 * Implementations must handle all visual aspects including game objects,
 * UI elements, visual effects, and analytics overlays.
 */
export interface IRenderSystem {
    // ===== Canvas Management =====

    /**
     * Initialize the rendering system with a canvas element
     * @param canvas HTML canvas element to render to
     */
    initialize(canvas: HTMLCanvasElement): void;

    /**
     * Clear the entire canvas
     */
    clear(): void;

    /**
     * Render the complete game state
     * @param gameState Current game state to render
     */
    render(gameState: GameState): void;

    /**
     * Clean up rendering resources (shapes, objects, etc.)
     */
    cleanup(): void;

    /**
     * Dispose of the rendering system and release all resources
     */
    dispose(): void;

    // ===== Camera Management =====

    /**
     * Apply camera transformation to the rendering context
     * @param camera Camera state for transformation
     */
    applyCameraTransform(camera: Camera): void;

    /**
     * Restore the rendering context to original state
     */
    restoreCameraTransform(): void;

    // ===== Game Objects Rendering =====

    /**
     * Render the player character
     * @param player Player state to render
     */
    renderPlayer(player: Player): void;

    /**
     * Render the player's trail
     * @param trail Array of trail points to render
     */
    renderTrail(trail: TrailPoint[]): void;

    /**
     * Render static platforms
     * @param platforms Array of platforms to render
     */
    renderPlatforms(platforms: Platform[]): void;

    /**
     * Render moving platforms
     * @param platforms Array of moving platforms to render
     */
    renderMovingPlatforms(platforms: MovingPlatform[]): void;

    /**
     * Render the goal area
     * @param goal Goal state to render
     */
    renderGoal(goal: Goal): void;

    /**
     * Render spike obstacles
     * @param spikes Array of spikes to render
     */
    renderSpikes(spikes: Spike[]): void;

    /**
     * Render stage boundaries and background
     * @param stage Stage configuration to render
     */
    renderStage(stage: Stage): void;

    // ===== UI Elements Rendering =====

    /**
     * Render stage-specific text elements
     * @param stage Stage configuration containing text data
     */
    renderStageTexts(stage: Stage): void;

    /**
     * Render start instruction overlay
     */
    renderStartInstruction(): void;

    /**
     * Render game over menu
     * @param gameState Current game state for menu data
     */
    renderGameOverMenu(gameState: GameState): void;

    /**
     * Render game over screen
     */
    renderGameOver(): void;

    /**
     * Render credits screen
     */
    renderCredits(): void;

    // ===== Visual Effects =====

    /**
     * Render death animation effect
     * @param animation Death animation state
     */
    renderDeathAnimation(animation: DeathAnimation): void;

    /**
     * Render stage clear animation effect
     * @param animation Clear animation state
     */
    renderClearAnimation(animation: ClearAnimation): void;

    /**
     * Render death marks at previous death locations
     * @param deathMarks Array of death marks to render
     */
    renderDeathMarks(deathMarks: DeathMark[]): void;

    // ===== Analytics/Predictions =====

    /**
     * Set landing predictions for visualization
     * @param predictions Array of landing predictions
     */
    setLandingPredictions(predictions: LandingPrediction[]): void;

    /**
     * Render landing prediction visualization
     */
    renderLandingPredictions(): void;

    /**
     * Render landing history visualization
     */
    renderLandingHistory(): void;

    /**
     * Add a new landing position to history
     * @param position Landing position to add
     */
    addLandingHistory(position: Position): void;

    /**
     * Clean up old landing history entries
     */
    cleanupLandingHistory(): void;

    /**
     * Update landing prediction animations
     */
    updateLandingPredictionAnimations(): void;

    /**
     * Draw crosshair at specified position
     * @param position Position to draw crosshair
     */
    drawCrosshair(position: Position): void;
}

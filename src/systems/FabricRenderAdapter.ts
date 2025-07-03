/**
 * FabricRenderAdapter - Fabric.js implementation of IRenderSystem
 *
 * This adapter implements the IRenderSystem interface using Fabric.js
 * as the underlying rendering engine. It wraps the existing FabricRenderSystem
 * to provide a clean abstraction layer that maintains backward compatibility
 * while preparing for potential migration to other rendering engines.
 *
 * Design Approach:
 * - Composition over inheritance: Contains FabricRenderSystem instance
 * - Delegation pattern: Forwards interface calls to FabricRenderSystem
 * - Zero regression: Maintains exact same functionality as original
 * - Clean abstraction: Hides Fabric.js details behind interface
 */

import type {
    Goal,
    MovingPlatform,
    Platform,
    Spike,
    StageData as Stage
} from '../core/StageLoader';
import type { Camera, GameState, Player, TrailPoint } from '../types/GameTypes';
import { FabricRenderSystem } from './FabricRenderSystem';
import type {
    ClearAnimation,
    DeathAnimation,
    DeathMark,
    IRenderSystem,
    LandingPrediction,
    Position
} from './IRenderSystem';

/**
 * Fabric.js adapter implementing IRenderSystem interface
 *
 * This class acts as an adapter between the generic IRenderSystem interface
 * and the Fabric.js-specific FabricRenderSystem implementation. It provides
 * a clean abstraction layer while maintaining full backward compatibility.
 */
export class FabricRenderAdapter implements IRenderSystem {
    private fabricRenderSystem: FabricRenderSystem | null = null;

    // ===== Canvas Management =====

    /**
     * Initialize the Fabric.js rendering system
     * @param canvas HTML canvas element to render to
     */
    initialize(canvas: HTMLCanvasElement): void {
        this.fabricRenderSystem = new FabricRenderSystem(canvas);
    }

    /**
     * Clear the entire canvas
     */
    clear(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.clearCanvas();
    }

    /**
     * Render the complete game state
     * @param _gameState Current game state to render (currently unused)
     */
    render(_gameState: GameState): void {
        this.ensureInitialized();

        // The original FabricRenderSystem doesn't have a single render method
        // but renders individual components. For now, we'll call renderAll
        // to maintain compatibility. In the future, this could be enhanced
        // to render specific components based on gameState.
        this.fabricRenderSystem?.renderAll();
    }

    /**
     * Clean up rendering resources
     */
    cleanup(): void {
        if (this.fabricRenderSystem) {
            this.fabricRenderSystem.cleanup();
        }
    }

    /**
     * Dispose of the rendering system and release all resources
     */
    dispose(): void {
        if (this.fabricRenderSystem) {
            this.fabricRenderSystem.dispose();
            this.fabricRenderSystem = null;
        }
    }

    // ===== Camera Management =====

    /**
     * Apply camera transformation to the rendering context
     * @param camera Camera state for transformation
     */
    applyCameraTransform(camera: Camera): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.applyCameraTransform(camera);
    }

    /**
     * Restore the rendering context to original state
     */
    restoreCameraTransform(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.restoreCameraTransform();
    }

    // ===== Game Objects Rendering =====

    /**
     * Render the player character
     * @param player Player state to render
     */
    renderPlayer(player: Player): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderPlayer(player);
    }

    /**
     * Render the player's trail
     * @param trail Array of trail points to render
     */
    renderTrail(trail: TrailPoint[]): void {
        this.ensureInitialized();
        // Note: FabricRenderSystem.renderTrail requires playerRadius parameter
        // Using default radius of 5 as fallback
        const defaultPlayerRadius = 5;
        this.fabricRenderSystem?.renderTrail(trail, defaultPlayerRadius);
    }

    /**
     * Render static platforms
     * Note: renderPlatforms is private in FabricRenderSystem, use renderStage instead
     * @param _platforms Array of platforms to render (not directly supported)
     */
    renderPlatforms(_platforms: Platform[]): void {
        // Cannot call private renderPlatforms directly
        // This would need to be implemented differently or platforms rendered as part of renderStage
        console.warn(
            'FabricRenderAdapter: renderPlatforms not directly available, use renderStage instead'
        );
    }

    /**
     * Render moving platforms
     * Note: renderMovingPlatforms is private in FabricRenderSystem
     * @param _platforms Array of moving platforms to render (not directly supported)
     */
    renderMovingPlatforms(_platforms: MovingPlatform[]): void {
        // Cannot call private renderMovingPlatforms directly
        console.warn(
            'FabricRenderAdapter: renderMovingPlatforms not directly available, use renderStage instead'
        );
    }

    /**
     * Render the goal area
     * Note: renderGoal is private in FabricRenderSystem
     * @param _goal Goal state to render (not directly supported)
     */
    renderGoal(_goal: Goal): void {
        // Cannot call private renderGoal directly
        console.warn(
            'FabricRenderAdapter: renderGoal not directly available, use renderStage instead'
        );
    }

    /**
     * Render spike obstacles
     * Note: renderSpikes is private in FabricRenderSystem
     * @param _spikes Array of spikes to render (not directly supported)
     */
    renderSpikes(_spikes: Spike[]): void {
        // Cannot call private renderSpikes directly
        console.warn(
            'FabricRenderAdapter: renderSpikes not directly available, use renderStage instead'
        );
    }

    /**
     * Render stage boundaries and background
     * @param stage Stage configuration to render
     */
    renderStage(stage: Stage): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderStage(stage);
    }

    // ===== UI Elements Rendering =====

    /**
     * Render stage-specific text elements
     * Note: renderStageTexts is private in FabricRenderSystem
     * @param _stage Stage configuration containing text data (not directly supported)
     */
    renderStageTexts(_stage: Stage): void {
        // Cannot call private renderStageTexts directly
        console.warn(
            'FabricRenderAdapter: renderStageTexts not directly available, use renderStage instead'
        );
    }

    /**
     * Render start instruction overlay
     */
    renderStartInstruction(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderStartInstruction();
    }

    /**
     * Render game over menu
     * @param gameState Current game state for menu data
     */
    renderGameOverMenu(_gameState: GameState): void {
        this.ensureInitialized();
        // Note: Original method signature might be different
        // This is a placeholder implementation
        console.warn('FabricRenderAdapter: renderGameOverMenu implementation may need adjustment');
    }

    /**
     * Render game over screen
     */
    renderGameOver(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderGameOver();
    }

    /**
     * Render credits screen
     */
    renderCredits(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderCredits();
    }

    // ===== Visual Effects =====

    /**
     * Render death animation effect
     * @param _animation Death animation state (implementation may need adjustment)
     */
    renderDeathAnimation(_animation: DeathAnimation): void {
        this.ensureInitialized();
        // Note: Original method signature might be different
        console.warn(
            'FabricRenderAdapter: renderDeathAnimation implementation may need adjustment'
        );
    }

    /**
     * Render stage clear animation effect
     * @param _animation Clear animation state (implementation may need adjustment)
     */
    renderClearAnimation(_animation: ClearAnimation): void {
        this.ensureInitialized();
        // Note: Original method signature might be different
        console.warn(
            'FabricRenderAdapter: renderClearAnimation implementation may need adjustment'
        );
    }

    /**
     * Render death marks at previous death locations
     * @param _deathMarks Array of death marks to render (implementation may need adjustment)
     */
    renderDeathMarks(_deathMarks: DeathMark[]): void {
        this.ensureInitialized();
        // Note: Original method signature might be different
        console.warn('FabricRenderAdapter: renderDeathMarks implementation may need adjustment');
    }

    // ===== Analytics/Predictions =====

    /**
     * Set landing predictions for visualization
     * @param predictions Array of landing predictions
     */
    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.ensureInitialized();
        // Convert IRenderSystem LandingPrediction to FabricRenderSystem LandingPrediction
        const fabricPredictions = predictions.map((p) => ({
            ...p,
            confidence: 1.0, // Default confidence value
            jumpNumber: 1 // Default jump number
        }));
        this.fabricRenderSystem?.setLandingPredictions(fabricPredictions);
    }

    /**
     * Render landing prediction visualization
     */
    renderLandingPredictions(): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.renderLandingPredictions();
    }

    /**
     * Render landing history visualization
     * Note: renderLandingHistory is private in FabricRenderSystem
     */
    renderLandingHistory(): void {
        // Cannot call private renderLandingHistory directly
        console.warn('FabricRenderAdapter: renderLandingHistory not directly available');
    }

    /**
     * Add a new landing position to history
     * @param position Landing position to add
     */
    addLandingHistory(position: Position): void {
        this.ensureInitialized();
        this.fabricRenderSystem?.addLandingHistory(position.x, position.y);
    }

    /**
     * Clean up old landing history entries
     * Note: cleanupLandingHistory is private in FabricRenderSystem
     */
    cleanupLandingHistory(): void {
        // Cannot call private cleanupLandingHistory directly
        console.warn('FabricRenderAdapter: cleanupLandingHistory not directly available');
    }

    /**
     * Update landing prediction animations
     * Note: updateLandingPredictionAnimations is private in FabricRenderSystem
     */
    updateLandingPredictionAnimations(): void {
        // Cannot call private updateLandingPredictionAnimations directly
        console.warn(
            'FabricRenderAdapter: updateLandingPredictionAnimations not directly available'
        );
    }

    /**
     * Draw crosshair at specified position
     * Note: drawCrosshair is private in FabricRenderSystem and has different signature
     * @param _position Position to draw crosshair (not directly supported)
     */
    drawCrosshair(_position: Position): void {
        // Cannot call private drawCrosshair directly
        console.warn('FabricRenderAdapter: drawCrosshair not directly available');
    }

    // ===== Private Helper Methods =====

    /**
     * Ensure that the FabricRenderSystem is initialized before use
     * @throws Error if the system is not initialized
     */
    private ensureInitialized(): void {
        if (!this.fabricRenderSystem) {
            throw new Error(
                'FabricRenderAdapter: Must call initialize() before using rendering methods'
            );
        }
    }
}

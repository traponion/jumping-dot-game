import type { LandingPrediction } from '../../types/AnalyticsTypes';
import type { Position } from '../IRenderSystem';

/**
 * Analytics Renderer Interface
 * Responsible for rendering analytics and prediction visualizations
 */
export interface IAnalyticsRenderer {
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
}

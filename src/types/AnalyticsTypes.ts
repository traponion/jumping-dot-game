/**
 * @fileoverview Analytics and prediction type definitions for domain layer
 * @module types/AnalyticsTypes
 * @description Domain types for analytics, predictions, and metrics
 */

/**
 * Represents a predicted landing position for player movement analysis
 * @interface LandingPrediction
 * @description Analytics domain type for tracking where the player is predicted to land
 */
export interface LandingPrediction {
    /** X coordinate of predicted landing position */
    x: number;
    /** Y coordinate of predicted landing position */
    y: number;
    /** Confidence level of prediction (0-1, where 1 is most confident) */
    confidence: number;
    /** Sequential jump number this prediction represents (1, 2, 3...) */
    jumpNumber: number;
}

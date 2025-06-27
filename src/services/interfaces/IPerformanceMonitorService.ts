/**
 * Interface for performance monitoring service operations
 */
export interface IPerformanceMonitorService {
    /**
     * Enable performance profiling
     */
    enableProfiling(): void;

    /**
     * Disable performance profiling
     */
    disableProfiling(): void;

    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;

    /**
     * Start frame profiling
     */
    startFrame(): void;

    /**
     * End frame profiling
     */
    endFrame(): void;

    /**
     * Generate performance report
     */
    generateReport(): string;

    /**
     * Log performance metrics to console
     */
    logMetrics(): void;

    /**
     * Get performance warnings
     */
    getWarnings(): string[];
}

/**
 * Performance metrics data structure
 */
export interface PerformanceMetrics {
    frameRate: number;
    averageFrameTime: number;
    frameCount: number;
    memoryUsage: number;
    sessionDuration: number;
    startTime: number;
}

/**
 * Interface for bundle analysis service operations
 */
export interface IBundleAnalysisService {
    /**
     * Get bundle information
     */
    getBundleInfo(): BundleInfo;

    /**
     * Get bundle metrics
     */
    getMetrics(): BundleMetrics;

    /**
     * Generate bundle report
     */
    generateReport(): string;

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): OptimizationRecommendation[];

    /**
     * Log bundle analysis to console
     */
    logAnalysis(): void;

    /**
     * Analyze load time
     */
    analyzeLoadTime(): number;
}

/**
 * Bundle information
 */
export interface BundleInfo {
    totalSize: number;
    gzippedSize: number;
    modules: Array<{ name: string; size: number }>;
    pixiModules: Array<{ name: string; size: number }>;
}

/**
 * Bundle metrics
 */
export interface BundleMetrics {
    totalSizeKB: number;
    gzippedSizeKB: number;
    pixiSizeKB: number;
    isUnderTarget: boolean;
    loadTimeEstimate: number;
}

/**
 * Optimization recommendation
 */
export interface OptimizationRecommendation {
    category: string;
    recommendations: string[];
    potentialSavings: number;
}

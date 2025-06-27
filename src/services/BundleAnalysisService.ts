import type { BundleAnalyzer } from '../utils/BundleAnalyzer.js';
import type {
    BundleInfo,
    BundleMetrics,
    IBundleAnalysisService,
    OptimizationRecommendation
} from './interfaces/IBundleAnalysisService.js';

/**
 * Service wrapper for BundleAnalyzer utility
 * Implements bundle analysis operations following SOLID principles
 */
export class BundleAnalysisService implements IBundleAnalysisService {
    constructor(private bundleAnalyzer: BundleAnalyzer) {}

    /**
     * Get bundle information
     */
    getBundleInfo(): BundleInfo {
        return this.bundleAnalyzer.getBundleInfo();
    }

    /**
     * Get bundle metrics
     */
    getMetrics(): BundleMetrics {
        return this.bundleAnalyzer.getMetrics();
    }

    /**
     * Generate bundle report
     */
    generateReport(): string {
        return this.bundleAnalyzer.generateBundleReport();
    }

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): OptimizationRecommendation[] {
        return this.bundleAnalyzer.getOptimizationRecommendations();
    }

    /**
     * Log bundle analysis to console
     */
    logAnalysis(): void {
        this.bundleAnalyzer.logBundleAnalysis();
    }

    /**
     * Analyze load time
     */
    analyzeLoadTime(): number {
        // BundleAnalyzer doesn't have this method, so we'll implement basic load time calculation
        const bundleInfo = this.getBundleInfo();
        // Rough estimation: 1KB = 1ms on slow 3G connection
        return bundleInfo.totalSize / 1024;
    }
}

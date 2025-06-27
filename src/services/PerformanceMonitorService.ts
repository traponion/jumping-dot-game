import type { PerformanceMonitor } from '../utils/PerformanceMonitor.js';
import type {
    IPerformanceMonitorService,
    PerformanceMetrics
} from './interfaces/IPerformanceMonitorService.js';

/**
 * Service wrapper for PerformanceMonitor utility
 * Implements performance monitoring operations following SOLID principles
 */
export class PerformanceMonitorService implements IPerformanceMonitorService {
    constructor(private performanceMonitor: PerformanceMonitor) {}

    /**
     * Enable performance profiling
     */
    enableProfiling(): void {
        this.performanceMonitor.enableProfiling();
    }

    /**
     * Disable performance profiling
     */
    disableProfiling(): void {
        this.performanceMonitor.disableProfiling();
    }

    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics {
        return this.performanceMonitor.getMetrics();
    }

    /**
     * Start frame profiling
     */
    startFrame(): void {
        this.performanceMonitor.startFrame();
    }

    /**
     * End frame profiling
     */
    endFrame(): void {
        this.performanceMonitor.endFrame();
    }

    /**
     * Generate performance report
     */
    generateReport(): string {
        return this.performanceMonitor.generateReport();
    }

    /**
     * Log performance metrics to console
     */
    logMetrics(): void {
        this.performanceMonitor.logMetrics();
    }

    /**
     * Get performance warnings
     */
    getWarnings(): string[] {
        return this.performanceMonitor.getPerformanceWarnings();
    }
}

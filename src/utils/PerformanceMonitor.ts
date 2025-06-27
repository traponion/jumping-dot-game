/**
 * Performance monitoring and profiling utility for PixiJS rendering
 */
export class PerformanceMonitor {
    private frameStartTime = 0;
    private frameTimes: number[] = [];
    private frameCount = 0;
    private startTime = performance.now();
    private profilingEnabled = false;

    // Performance thresholds
    private readonly TARGET_FPS = 60;
    private readonly TARGET_FRAME_TIME = 1000 / 60; // 16.67ms
    private readonly MEMORY_WARNING_THRESHOLD = 100 * 1024 * 1024; // 100MB
    private readonly FRAME_TIME_HISTORY_SIZE = 60; // Keep last 60 frames

    constructor() {
        this.reset();
    }

    /**
     * Start frame timing measurement
     */
    startFrame(): void {
        if (!this.profilingEnabled) return;
        this.frameStartTime = performance.now();
    }

    /**
     * End frame timing measurement and record metrics
     */
    endFrame(): void {
        if (!this.profilingEnabled || this.frameStartTime === 0) return;

        const frameEndTime = performance.now();
        const frameTime = frameEndTime - this.frameStartTime;

        this.frameTimes.push(frameTime);
        this.frameCount++;

        // Keep only recent frame times for rolling average
        if (this.frameTimes.length > this.FRAME_TIME_HISTORY_SIZE) {
            this.frameTimes.shift();
        }

        this.frameStartTime = 0;
    }

    /**
     * Get current memory usage information
     */
    getMemoryUsage(): { used: number; total: number; limit: number } {
        // Type-safe performance memory access
        const perfWithMemory = performance as typeof performance & {
            memory?: {
                usedJSHeapSize: number;
                totalJSHeapSize: number;
                jsHeapSizeLimit: number;
            };
        };

        const memory = perfWithMemory.memory;
        if (!memory) {
            return { used: 0, total: 0, limit: 0 };
        }

        return {
            used: memory.usedJSHeapSize,
            total: memory.totalJSHeapSize,
            limit: memory.jsHeapSizeLimit
        };
    }

    /**
     * Format memory size in human-readable format
     */
    formatMemorySize(bytes: number): string {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    }

    /**
     * Get comprehensive performance metrics
     */
    getMetrics(): {
        frameRate: number;
        averageFrameTime: number;
        frameCount: number;
        memoryUsage: number;
        sessionDuration: number;
        startTime: number;
    } {
        const averageFrameTime =
            this.frameTimes.length > 0
                ? this.frameTimes.reduce((sum, time) => sum + time, 0) / this.frameTimes.length
                : 0;

        const frameRate = averageFrameTime > 0 ? 1000 / averageFrameTime : 0;
        const sessionDuration = performance.now() - this.startTime;
        const memoryUsage = this.getMemoryUsage().used;

        return {
            frameRate,
            averageFrameTime,
            frameCount: this.frameCount,
            memoryUsage,
            sessionDuration,
            startTime: this.startTime
        };
    }

    /**
     * Get performance warnings based on current metrics
     */
    getPerformanceWarnings(): string[] {
        const warnings: string[] = [];
        const metrics = this.getMetrics();
        const memoryUsage = this.getMemoryUsage().used;

        // Check frame rate
        if (metrics.frameRate > 0 && metrics.frameRate < this.TARGET_FPS - 5) {
            warnings.push('Frame rate below 60fps');
        }

        // Check memory usage
        if (memoryUsage > this.MEMORY_WARNING_THRESHOLD) {
            warnings.push('Memory usage above 100MB');
        }

        // Check frame time
        if (metrics.averageFrameTime > this.TARGET_FRAME_TIME + 5) {
            warnings.push('Frame time above 16.67ms');
        }

        return warnings;
    }

    /**
     * Enable performance profiling
     */
    enableProfiling(): void {
        this.profilingEnabled = true;
        this.reset();
    }

    /**
     * Disable performance profiling
     */
    disableProfiling(): void {
        this.profilingEnabled = false;
    }

    /**
     * Check if profiling is currently enabled
     */
    isProfilingEnabled(): boolean {
        return this.profilingEnabled;
    }

    /**
     * Reset all performance metrics
     */
    reset(): void {
        this.frameTimes = [];
        this.frameCount = 0;
        this.startTime = performance.now();
        this.frameStartTime = 0;
    }

    /**
     * Generate comprehensive performance report
     */
    generateReport(): string {
        const metrics = this.getMetrics();
        const memory = this.getMemoryUsage();
        const warnings = this.getPerformanceWarnings();

        let report = '=== Performance Report ===\n\n';

        report += `Frame Rate: ${metrics.frameRate.toFixed(2)} fps\n`;
        report += `Average Frame Time: ${metrics.averageFrameTime.toFixed(2)} ms\n`;
        report += `Frame Count: ${metrics.frameCount}\n`;
        report += `Session Duration: ${(metrics.sessionDuration / 1000).toFixed(2)} seconds\n\n`;

        report += `Memory Usage: ${this.formatMemorySize(memory.used)}\n`;
        report += `Memory Total: ${this.formatMemorySize(memory.total)}\n`;
        report += `Memory Limit: ${this.formatMemorySize(memory.limit)}\n\n`;

        if (warnings.length > 0) {
            report += 'Performance Warnings:\n';
            for (const warning of warnings) {
                report += `- ${warning}\n`;
            }
        } else {
            report += 'No performance warnings detected.\n';
        }

        return report;
    }

    /**
     * Log performance metrics to console
     */
    logMetrics(): void {
        if (!this.profilingEnabled) {
            console.log('Performance profiling is disabled');
            return;
        }

        const metrics = this.getMetrics();
        const memory = this.getMemoryUsage();

        console.group('Performance Metrics');
        console.log(`Frame Rate: ${metrics.frameRate.toFixed(2)} fps`);
        console.log(`Average Frame Time: ${metrics.averageFrameTime.toFixed(2)} ms`);
        console.log(`Frame Count: ${metrics.frameCount}`);
        console.log(`Memory Usage: ${this.formatMemorySize(memory.used)}`);

        const warnings = this.getPerformanceWarnings();
        if (warnings.length > 0) {
            console.warn('Performance Warnings:', warnings);
        }

        console.groupEnd();
    }

    /**
     * Benchmark a function's execution time
     */
    benchmark<T>(fn: () => T, label = 'Function'): T {
        const start = performance.now();
        const result = fn();
        const end = performance.now();

        console.log(`${label} execution time: ${(end - start).toFixed(2)}ms`);
        return result;
    }

    /**
     * Profile async function execution
     */
    async profileAsync<T>(fn: () => Promise<T>, label = 'Async Function'): Promise<T> {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();

        console.log(`${label} execution time: ${(end - start).toFixed(2)}ms`);
        return result;
    }
}

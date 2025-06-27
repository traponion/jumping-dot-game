import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';

// Mock performance API
const mockPerformance = {
    now: vi.fn(() => Date.now()),
    memory: {
        usedJSHeapSize: 50 * 1024 * 1024, // 50MB
        totalJSHeapSize: 100 * 1024 * 1024, // 100MB
        jsHeapSizeLimit: 4 * 1024 * 1024 * 1024 // 4GB
    }
};

global.performance = mockPerformance as any;

describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
        vi.clearAllMocks();
        monitor = new PerformanceMonitor();
        monitor.enableProfiling(); // Enable profiling for tests
    });

    describe('constructor', () => {
        it('should create PerformanceMonitor instance', () => {
            expect(monitor).toBeInstanceOf(PerformanceMonitor);
        });

        it('should initialize with empty metrics', () => {
            const metrics = monitor.getMetrics();
            expect(metrics.frameRate).toBe(0);
            expect(metrics.averageFrameTime).toBe(0);
            expect(metrics.memoryUsage).toBeGreaterThan(0);
        });
    });

    describe('frame tracking', () => {
        it('should start frame measurement', () => {
            monitor.startFrame();

            expect(mockPerformance.now).toHaveBeenCalled();
        });

        it('should end frame measurement and calculate frame time', () => {
            mockPerformance.now
                .mockReturnValueOnce(1000) // start time
                .mockReturnValueOnce(1016); // end time (16ms later for 60fps)

            monitor.startFrame();
            monitor.endFrame();

            const metrics = monitor.getMetrics();
            expect(metrics.averageFrameTime).toBeCloseTo(16, 1);
        });

        it('should calculate frame rate correctly', () => {
            // Simulate multiple frames for stable frame rate calculation
            let timeCounter = 0;
            mockPerformance.now.mockClear();
            mockPerformance.now.mockImplementation(() => {
                const currentTime = timeCounter;
                timeCounter += 16.67; // Increment by 16.67ms each call
                return currentTime;
            });

            for (let i = 0; i < 5; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            const metrics = monitor.getMetrics();
            expect(metrics.frameRate).toBeCloseTo(60, 1);
        });

        it('should track frame count', () => {
            for (let i = 0; i < 5; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            const metrics = monitor.getMetrics();
            expect(metrics.frameCount).toBe(5);
        });
    });

    describe('memory tracking', () => {
        it('should get current memory usage', () => {
            const memory = monitor.getMemoryUsage();

            expect(memory.used).toBe(50 * 1024 * 1024); // 50MB
            expect(memory.total).toBe(100 * 1024 * 1024); // 100MB
            expect(memory.limit).toBe(4 * 1024 * 1024 * 1024); // 4GB
        });

        it('should track memory usage over time', () => {
            const initialMemory = monitor.getMemoryUsage();

            // Simulate memory increase
            mockPerformance.memory.usedJSHeapSize = 60 * 1024 * 1024; // 60MB

            const updatedMemory = monitor.getMemoryUsage();
            expect(updatedMemory.used).toBeGreaterThan(initialMemory.used);
        });

        it('should format memory size in MB', () => {
            const testSize = 50 * 1024 * 1024; // 50MB
            const formatted = monitor.formatMemorySize(testSize);

            expect(formatted).toBe('50.00 MB');
        });
    });

    describe('performance metrics', () => {
        it('should provide comprehensive metrics', () => {
            // Simulate some frames
            for (let i = 0; i < 3; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            const metrics = monitor.getMetrics();

            expect(metrics).toHaveProperty('frameRate');
            expect(metrics).toHaveProperty('averageFrameTime');
            expect(metrics).toHaveProperty('frameCount');
            expect(metrics).toHaveProperty('memoryUsage');
            expect(metrics).toHaveProperty('startTime');
        });

        it('should track session duration', () => {
            // Complete isolation - clear all mocks and start fresh
            vi.clearAllMocks();
            mockPerformance.now.mockClear();

            const startTime = 1000;
            const endTime = 6000; // 5 seconds later

            // Correct mock sequence for PerformanceMonitor lifecycle:
            // 1st: constructor -> reset() -> startTime
            // 2nd: enableProfiling() -> reset() -> startTime (same value)
            // 3rd: unknown internal call -> keep startTime consistent
            // 4th: getMetrics() -> performance.now() for sessionDuration calculation
            mockPerformance.now
                .mockReturnValueOnce(startTime) // constructor
                .mockReturnValueOnce(startTime) // enableProfiling
                .mockReturnValueOnce(startTime) // internal call
                .mockReturnValue(endTime); // getMetrics + any additional calls

            // Create fresh monitor completely isolated
            const freshMonitor = new PerformanceMonitor();
            freshMonitor.enableProfiling();

            const metrics = freshMonitor.getMetrics();

            expect(metrics.sessionDuration).toBe(5000); // Exactly 5 seconds
        });
    });

    describe('performance warnings', () => {
        it('should detect low frame rate', () => {
            // Simulate multiple slow frames (30fps = 33.33ms) to establish pattern
            let timeCounter = 0;
            mockPerformance.now.mockClear();
            mockPerformance.now.mockImplementation(() => {
                const currentTime = timeCounter;
                timeCounter += 33.33; // Increment by 33.33ms each call (30fps)
                return currentTime;
            });

            for (let i = 0; i < 5; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            const warnings = monitor.getPerformanceWarnings();
            expect(warnings).toContain('Frame rate below 60fps');
        });

        it('should detect high memory usage', () => {
            // Simulate high memory usage (150MB)
            mockPerformance.memory.usedJSHeapSize = 150 * 1024 * 1024;

            const warnings = monitor.getPerformanceWarnings();
            expect(warnings).toContain('Memory usage above 100MB');
        });

        it('should detect long frame times', () => {
            // Simulate long frame (50ms)
            mockPerformance.now
                .mockReturnValueOnce(1000) // start time
                .mockReturnValueOnce(1050); // end time (50ms later)

            monitor.startFrame();
            monitor.endFrame();

            const warnings = monitor.getPerformanceWarnings();
            expect(warnings).toContain('Frame time above 16.67ms');
        });
    });

    describe('reset functionality', () => {
        it('should reset all metrics', () => {
            // Generate some data
            for (let i = 0; i < 3; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            monitor.reset();

            const metrics = monitor.getMetrics();
            expect(metrics.frameCount).toBe(0);
            expect(metrics.frameRate).toBe(0);
            expect(metrics.averageFrameTime).toBe(0);
        });
    });

    describe('profiling mode', () => {
        it('should enable and disable profiling', () => {
            // Start fresh without beforeEach enabling
            const freshMonitor = new PerformanceMonitor();
            expect(freshMonitor.isProfilingEnabled()).toBe(false);

            freshMonitor.enableProfiling();
            expect(freshMonitor.isProfilingEnabled()).toBe(true);

            freshMonitor.disableProfiling();
            expect(freshMonitor.isProfilingEnabled()).toBe(false);
        });

        it('should only track when profiling is enabled', () => {
            monitor.disableProfiling();

            monitor.startFrame();
            monitor.endFrame();

            const metrics = monitor.getMetrics();
            expect(metrics.frameCount).toBe(0);
        });

        it('should generate performance report', () => {
            monitor.enableProfiling();

            // Simulate some frames
            for (let i = 0; i < 5; i++) {
                monitor.startFrame();
                monitor.endFrame();
            }

            const report = monitor.generateReport();

            expect(report).toContain('Performance Report');
            expect(report).toContain('Frame Rate:');
            expect(report).toContain('Memory Usage:');
            expect(report).toContain('Frame Count:');
        });
    });

    describe('logging and profiling utilities', () => {
        it('should log metrics to console when profiling enabled', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
            const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

            monitor.enableProfiling();
            monitor.logMetrics();

            expect(consoleGroupSpy).toHaveBeenCalledWith('Performance Metrics');
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleGroupEndSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleGroupSpy.mockRestore();
            consoleGroupEndSpy.mockRestore();
        });

        it('should log disabled message when profiling is disabled', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

            monitor.disableProfiling();
            monitor.logMetrics();

            expect(consoleSpy).toHaveBeenCalledWith('Performance profiling is disabled');

            consoleSpy.mockRestore();
        });

        it('should benchmark function execution time', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const testFunction = vi.fn(() => 42);

            const result = monitor.benchmark(testFunction, 'Test Function');

            expect(result).toBe(42);
            expect(testFunction).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Test Function execution time:')
            );

            consoleSpy.mockRestore();
        });

        it('should benchmark function with default label', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const testFunction = vi.fn(() => 'test');

            const result = monitor.benchmark(testFunction);

            expect(result).toBe('test');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Function execution time:')
            );

            consoleSpy.mockRestore();
        });

        it('should profile async function execution time', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const asyncFunction = vi.fn(async () => 'async result');

            const result = await monitor.profileAsync(asyncFunction, 'Async Test');

            expect(result).toBe('async result');
            expect(asyncFunction).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Async Test execution time:')
            );

            consoleSpy.mockRestore();
        });

        it('should profile async function with default label', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const asyncFunction = vi.fn(async () => 'default');

            const result = await monitor.profileAsync(asyncFunction);

            expect(result).toBe('default');
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Async Function execution time:')
            );

            consoleSpy.mockRestore();
        });
    });
});

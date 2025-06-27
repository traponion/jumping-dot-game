import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService.js';
import type { PerformanceMetrics } from '../services/interfaces/IPerformanceMonitorService.js';
import { PerformanceMonitor } from '../utils/PerformanceMonitor.js';

describe('PerformanceMonitorService', () => {
    let performanceMonitorService: PerformanceMonitorService;
    let mockPerformanceMonitor: PerformanceMonitor;

    beforeEach(() => {
        // Create mock PerformanceMonitor
        mockPerformanceMonitor = {
            enableProfiling: vi.fn(),
            disableProfiling: vi.fn(),
            getMetrics: vi.fn(),
            startFrame: vi.fn(),
            endFrame: vi.fn(),
            generateReport: vi.fn(),
            logMetrics: vi.fn(),
            getPerformanceWarnings: vi.fn()
        } as unknown as PerformanceMonitor;

        performanceMonitorService = new PerformanceMonitorService(mockPerformanceMonitor);
    });

    describe('enableProfiling', () => {
        it('should call enableProfiling on the performance monitor', () => {
            performanceMonitorService.enableProfiling();

            expect(mockPerformanceMonitor.enableProfiling).toHaveBeenCalledOnce();
        });
    });

    describe('disableProfiling', () => {
        it('should call disableProfiling on the performance monitor', () => {
            performanceMonitorService.disableProfiling();

            expect(mockPerformanceMonitor.disableProfiling).toHaveBeenCalledOnce();
        });
    });

    describe('getMetrics', () => {
        it('should return metrics from the performance monitor', () => {
            const mockMetrics: PerformanceMetrics = {
                frameRate: 60,
                averageFrameTime: 16.67,
                frameCount: 1000,
                memoryUsage: 50000000,
                sessionDuration: 16670,
                startTime: 1234567890
            };
            vi.mocked(mockPerformanceMonitor.getMetrics).mockReturnValue(mockMetrics);

            const result = performanceMonitorService.getMetrics();

            expect(mockPerformanceMonitor.getMetrics).toHaveBeenCalledOnce();
            expect(result).toEqual(mockMetrics);
        });
    });

    describe('startFrame', () => {
        it('should call startFrame on the performance monitor', () => {
            performanceMonitorService.startFrame();

            expect(mockPerformanceMonitor.startFrame).toHaveBeenCalledOnce();
        });
    });

    describe('endFrame', () => {
        it('should call endFrame on the performance monitor', () => {
            performanceMonitorService.endFrame();

            expect(mockPerformanceMonitor.endFrame).toHaveBeenCalledOnce();
        });
    });

    describe('generateReport', () => {
        it('should return report from the performance monitor', () => {
            const mockReport = 'Performance Report: 60 FPS, 16.67ms avg frame time';
            vi.mocked(mockPerformanceMonitor.generateReport).mockReturnValue(mockReport);

            const result = performanceMonitorService.generateReport();

            expect(mockPerformanceMonitor.generateReport).toHaveBeenCalledOnce();
            expect(result).toBe(mockReport);
        });
    });

    describe('logMetrics', () => {
        it('should call logMetrics on the performance monitor', () => {
            performanceMonitorService.logMetrics();

            expect(mockPerformanceMonitor.logMetrics).toHaveBeenCalledOnce();
        });
    });

    describe('getWarnings', () => {
        it('should return warnings from the performance monitor', () => {
            const mockWarnings = ['High memory usage detected', 'Frame rate below target'];
            vi.mocked(mockPerformanceMonitor.getPerformanceWarnings).mockReturnValue(mockWarnings);

            const result = performanceMonitorService.getWarnings();

            expect(mockPerformanceMonitor.getPerformanceWarnings).toHaveBeenCalledOnce();
            expect(result).toEqual(mockWarnings);
        });
    });

    describe('constructor dependency injection', () => {
        it('should accept PerformanceMonitor dependency through constructor', () => {
            const customMonitor = new PerformanceMonitor();
            const service = new PerformanceMonitorService(customMonitor);

            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(PerformanceMonitorService);
        });
    });
});

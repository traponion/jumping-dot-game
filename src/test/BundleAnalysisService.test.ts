import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BundleAnalysisService } from '../services/BundleAnalysisService.js';
import type {
    BundleInfo,
    BundleMetrics,
    OptimizationRecommendation
} from '../services/interfaces/IBundleAnalysisService.js';
import { BundleAnalyzer } from '../utils/BundleAnalyzer.js';

describe('BundleAnalysisService', () => {
    let bundleAnalysisService: BundleAnalysisService;
    let mockBundleAnalyzer: BundleAnalyzer;

    beforeEach(() => {
        // Create mock BundleAnalyzer
        mockBundleAnalyzer = {
            getBundleInfo: vi.fn(),
            getMetrics: vi.fn(),
            generateBundleReport: vi.fn(),
            getOptimizationRecommendations: vi.fn(),
            logBundleAnalysis: vi.fn()
        } as unknown as BundleAnalyzer;

        bundleAnalysisService = new BundleAnalysisService(mockBundleAnalyzer);
    });

    describe('getBundleInfo', () => {
        it('should return bundle info from the bundle analyzer', () => {
            const mockBundleInfo: BundleInfo = {
                totalSize: 1024000,
                gzippedSize: 256000,
                modules: [
                    { name: 'main.js', size: 512000 },
                    { name: 'vendor.js', size: 512000 }
                ],
                pixiModules: [{ name: 'pixi.js', size: 300000 }]
            };
            vi.mocked(mockBundleAnalyzer.getBundleInfo).mockReturnValue(mockBundleInfo);

            const result = bundleAnalysisService.getBundleInfo();

            expect(mockBundleAnalyzer.getBundleInfo).toHaveBeenCalledOnce();
            expect(result).toEqual(mockBundleInfo);
        });
    });

    describe('getMetrics', () => {
        it('should return bundle metrics from the bundle analyzer', () => {
            const mockMetrics: BundleMetrics = {
                totalSizeKB: 1000,
                gzippedSizeKB: 250,
                pixiSizeKB: 300,
                isUnderTarget: true,
                loadTimeEstimate: 2.5
            };
            vi.mocked(mockBundleAnalyzer.getMetrics).mockReturnValue(mockMetrics);

            const result = bundleAnalysisService.getMetrics();

            expect(mockBundleAnalyzer.getMetrics).toHaveBeenCalledOnce();
            expect(result).toEqual(mockMetrics);
        });
    });

    describe('generateReport', () => {
        it('should return report from the bundle analyzer', () => {
            const mockReport = 'Bundle Report: Total size 1MB, Gzipped 256KB';
            vi.mocked(mockBundleAnalyzer.generateBundleReport).mockReturnValue(mockReport);

            const result = bundleAnalysisService.generateReport();

            expect(mockBundleAnalyzer.generateBundleReport).toHaveBeenCalledOnce();
            expect(result).toBe(mockReport);
        });
    });

    describe('getOptimizationRecommendations', () => {
        it('should return optimization recommendations from the bundle analyzer', () => {
            const mockRecommendations: OptimizationRecommendation[] = [
                {
                    category: 'PixiJS Tree-shaking',
                    recommendations: [
                        'Import only required PixiJS modules',
                        'Use @pixi/core instead of full pixi.js'
                    ],
                    potentialSavings: 50000
                },
                {
                    category: 'Asset Optimization',
                    recommendations: ['Compress textures with WebP format', 'Use texture atlases'],
                    potentialSavings: 20000
                }
            ];
            vi.mocked(mockBundleAnalyzer.getOptimizationRecommendations).mockReturnValue(
                mockRecommendations
            );

            const result = bundleAnalysisService.getOptimizationRecommendations();

            expect(mockBundleAnalyzer.getOptimizationRecommendations).toHaveBeenCalledOnce();
            expect(result).toEqual(mockRecommendations);
        });
    });

    describe('logAnalysis', () => {
        it('should call logBundleAnalysis on the bundle analyzer', () => {
            bundleAnalysisService.logAnalysis();

            expect(mockBundleAnalyzer.logBundleAnalysis).toHaveBeenCalledOnce();
        });
    });

    describe('analyzeLoadTime', () => {
        it('should calculate load time based on bundle size', () => {
            const mockBundleInfo: BundleInfo = {
                totalSize: 2048000, // 2MB
                gzippedSize: 512000,
                modules: [],
                pixiModules: []
            };
            vi.mocked(mockBundleAnalyzer.getBundleInfo).mockReturnValue(mockBundleInfo);

            const result = bundleAnalysisService.analyzeLoadTime();

            expect(mockBundleAnalyzer.getBundleInfo).toHaveBeenCalledOnce();
            // 2MB = 2048KB, estimated load time = 2048ms
            expect(result).toBe(2000);
        });

        it('should handle zero bundle size', () => {
            const mockBundleInfo: BundleInfo = {
                totalSize: 0,
                gzippedSize: 0,
                modules: [],
                pixiModules: []
            };
            vi.mocked(mockBundleAnalyzer.getBundleInfo).mockReturnValue(mockBundleInfo);

            const result = bundleAnalysisService.analyzeLoadTime();

            expect(result).toBe(0);
        });
    });

    describe('constructor dependency injection', () => {
        it('should accept BundleAnalyzer dependency through constructor', () => {
            const customAnalyzer = new BundleAnalyzer();
            const service = new BundleAnalysisService(customAnalyzer);

            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(BundleAnalysisService);
        });
    });
});

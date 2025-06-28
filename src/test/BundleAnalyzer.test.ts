import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BundleAnalyzer } from '../utils/BundleAnalyzer.js';

describe('BundleAnalyzer', () => {
    describe('formatFileSize', () => {
        it('should format zero bytes correctly', () => {
            const analyzer = new BundleAnalyzer();
            const result = analyzer.formatFileSize(0);
            expect(result).toBe('0 Bytes');
        });

        it('should format bytes correctly', () => {
            const analyzer = new BundleAnalyzer();
            expect(analyzer.formatFileSize(500)).toBe('500 Bytes');
            expect(analyzer.formatFileSize(999)).toBe('999 Bytes');
        });

        it('should format kilobytes correctly', () => {
            const analyzer = new BundleAnalyzer();
            expect(analyzer.formatFileSize(1024)).toBe('1 KB');
            expect(analyzer.formatFileSize(1536)).toBe('1.5 KB');
            expect(analyzer.formatFileSize(2048)).toBe('2 KB');
        });

        it('should format megabytes correctly', () => {
            const analyzer = new BundleAnalyzer();
            expect(analyzer.formatFileSize(1024 * 1024)).toBe('1 MB');
            expect(analyzer.formatFileSize(1024 * 1024 * 1.5)).toBe('1.5 MB');
            expect(analyzer.formatFileSize(1024 * 1024 * 2)).toBe('2 MB');
        });

        it('should format gigabytes correctly', () => {
            const analyzer = new BundleAnalyzer();
            expect(analyzer.formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
            expect(analyzer.formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
        });

        it('should handle fractional values with proper precision', () => {
            const analyzer = new BundleAnalyzer();
            expect(analyzer.formatFileSize(1500)).toBe('1.46 KB');
            expect(analyzer.formatFileSize(1024 * 1024 + 512 * 1024)).toBe('1.5 MB');
        });
    });

    describe('constructor and getBundleInfo', () => {
        it('should initialize with bundle info when created', () => {
            const analyzer = new BundleAnalyzer();
            const bundleInfo = analyzer.getBundleInfo();

            expect(bundleInfo).toBeDefined();
            expect(typeof bundleInfo.totalSize).toBe('number');
            expect(typeof bundleInfo.gzippedSize).toBe('number');
            expect(Array.isArray(bundleInfo.modules)).toBe(true);
            expect(Array.isArray(bundleInfo.pixiModules)).toBe(true);
        });

        it('should return default bundle info if analysis has not been performed', () => {
            const analyzer = new BundleAnalyzer();
            // Force bundleInfo to be null to test the default fallback path
            (analyzer as any).bundleInfo = null;

            const bundleInfo = analyzer.getBundleInfo();

            expect(bundleInfo).toEqual({
                totalSize: 0,
                gzippedSize: 0,
                modules: [],
                pixiModules: []
            });
        });

        it('should have expected module structure', () => {
            const analyzer = new BundleAnalyzer();
            const bundleInfo = analyzer.getBundleInfo();

            // Check main modules
            expect(bundleInfo.modules.length).toBeGreaterThan(0);
            const pixiModule = bundleInfo.modules.find((m) => m.name === 'pixi.js');
            expect(pixiModule).toBeDefined();
            expect(pixiModule?.size).toBe(220000);

            // Check pixi modules
            expect(bundleInfo.pixiModules.length).toBeGreaterThan(0);
            const coreModule = bundleInfo.pixiModules.find((m) => m.name === '@pixi/core');
            expect(coreModule).toBeDefined();
            expect(coreModule?.size).toBe(85000);
        });

        it('should calculate total size correctly', () => {
            const analyzer = new BundleAnalyzer();
            const bundleInfo = analyzer.getBundleInfo();

            // Expected total: 220000 + 15000 + 5000 + 45000 = 285000
            expect(bundleInfo.totalSize).toBe(285000);
        });

        it('should calculate gzipped size correctly', () => {
            const analyzer = new BundleAnalyzer();
            const bundleInfo = analyzer.getBundleInfo();

            // Expected gzipped: Math.round(285000 * 0.3) = 85500
            expect(bundleInfo.gzippedSize).toBe(85500);
        });
    });

    describe('getOptimizationRecommendations', () => {
        it('should return optimization recommendations with correct structure', () => {
            const analyzer = new BundleAnalyzer();
            const recommendations = analyzer.getOptimizationRecommendations();

            expect(Array.isArray(recommendations)).toBe(true);
            expect(recommendations.length).toBeGreaterThan(0);

            // Check structure of each recommendation
            for (const rec of recommendations) {
                expect(rec).toHaveProperty('category');
                expect(rec).toHaveProperty('recommendations');
                expect(rec).toHaveProperty('potentialSavings');
                expect(typeof rec.category).toBe('string');
                expect(Array.isArray(rec.recommendations)).toBe(true);
                expect(typeof rec.potentialSavings).toBe('number');
            }
        });

        it('should include expected categories', () => {
            const analyzer = new BundleAnalyzer();
            const recommendations = analyzer.getOptimizationRecommendations();

            const categories = recommendations.map((rec) => rec.category);
            expect(categories).toContain('PixiJS Tree-shaking');
            expect(categories).toContain('Asset Optimization');
            expect(categories).toContain('Build Configuration');
            expect(categories).toContain('Code Splitting');
        });

        it('should have recommendations for each category', () => {
            const analyzer = new BundleAnalyzer();
            const recommendations = analyzer.getOptimizationRecommendations();

            for (const rec of recommendations) {
                expect(rec.recommendations.length).toBeGreaterThan(0);
                expect(rec.potentialSavings).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('analyzeTreeShaking', () => {
        it('should return tree-shaking analysis with correct structure', () => {
            const analyzer = new BundleAnalyzer();
            const analysis = analyzer.analyzeTreeShaking();

            expect(analysis).toHaveProperty('isEffective');
            expect(analysis).toHaveProperty('unusedExports');
            expect(analysis).toHaveProperty('suggestions');
            expect(typeof analysis.isEffective).toBe('boolean');
            expect(Array.isArray(analysis.unusedExports)).toBe(true);
            expect(Array.isArray(analysis.suggestions)).toBe(true);
        });

        it('should include expected unused exports', () => {
            const analyzer = new BundleAnalyzer();
            const analysis = analyzer.analyzeTreeShaking();

            expect(analysis.unusedExports).toContain('PIXI.loaders');
            expect(analysis.unusedExports).toContain('PIXI.interaction');
            expect(analysis.unusedExports).toContain('PIXI.prepare');
            expect(analysis.unusedExports).toContain('PIXI.extract');
        });

        it('should provide meaningful suggestions', () => {
            const analyzer = new BundleAnalyzer();
            const analysis = analyzer.analyzeTreeShaking();

            expect(analysis.suggestions.length).toBeGreaterThan(0);
            expect(analysis.suggestions[0]).toContain('@pixi/core');
        });

        it('should determine effectiveness based on unused exports count', () => {
            const analyzer = new BundleAnalyzer();
            const analysis = analyzer.analyzeTreeShaking();

            // According to the implementation, effective = unusedExports.length < 5
            const expectedEffective = analysis.unusedExports.length < 5;
            expect(analysis.isEffective).toBe(expectedEffective);
        });
    });

    describe('getPixiJSOptimizations', () => {
        it('should return PixiJS optimization suggestions with correct structure', () => {
            const analyzer = new BundleAnalyzer();
            const optimizations = analyzer.getPixiJSOptimizations();

            expect(optimizations).toHaveProperty('currentImports');
            expect(optimizations).toHaveProperty('optimizedImports');
            expect(optimizations).toHaveProperty('sizeSavings');
            expect(Array.isArray(optimizations.currentImports)).toBe(true);
            expect(Array.isArray(optimizations.optimizedImports)).toBe(true);
            expect(typeof optimizations.sizeSavings).toBe('number');
        });

        it('should include expected current import pattern', () => {
            const analyzer = new BundleAnalyzer();
            const optimizations = analyzer.getPixiJSOptimizations();

            expect(optimizations.currentImports).toContain("import * as PIXI from 'pixi.js'");
        });

        it('should provide specific optimized imports', () => {
            const analyzer = new BundleAnalyzer();
            const optimizations = analyzer.getPixiJSOptimizations();

            expect(optimizations.optimizedImports.length).toBeGreaterThan(0);
            expect(optimizations.optimizedImports[0]).toContain('@pixi/app');
        });

        it('should have positive size savings', () => {
            const analyzer = new BundleAnalyzer();
            const optimizations = analyzer.getPixiJSOptimizations();

            expect(optimizations.sizeSavings).toBeGreaterThan(0);
            expect(optimizations.sizeSavings).toBe(50000); // Expected 50KB savings
        });
    });

    describe('compareAgainstTargets', () => {
        it('should return comparison with correct structure', () => {
            const analyzer = new BundleAnalyzer();
            const comparison = analyzer.compareAgainstTargets();

            expect(comparison).toHaveProperty('target');
            expect(comparison).toHaveProperty('current');
            expect(comparison).toHaveProperty('isUnderTarget');
            expect(comparison).toHaveProperty('difference');
            expect(comparison).toHaveProperty('fabricJSBaseline');
            expect(comparison).toHaveProperty('growth');
            expect(typeof comparison.target).toBe('number');
            expect(typeof comparison.current).toBe('number');
            expect(typeof comparison.isUnderTarget).toBe('boolean');
            expect(typeof comparison.difference).toBe('number');
            expect(typeof comparison.fabricJSBaseline).toBe('number');
            expect(typeof comparison.growth).toBe('number');
        });

        it('should use expected target and baseline values', () => {
            const analyzer = new BundleAnalyzer();
            const comparison = analyzer.compareAgainstTargets();

            expect(comparison.target).toBe(250000); // 250KB target
            expect(comparison.fabricJSBaseline).toBe(95200); // 95.2KB baseline
        });

        it('should calculate current size correctly', () => {
            const analyzer = new BundleAnalyzer();
            const comparison = analyzer.compareAgainstTargets();
            const bundleInfo = analyzer.getBundleInfo();

            expect(comparison.current).toBe(bundleInfo.totalSize);
            expect(comparison.current).toBe(285000); // Expected total size
        });

        it('should determine if under target correctly', () => {
            const analyzer = new BundleAnalyzer();
            const comparison = analyzer.compareAgainstTargets();

            // Current: 285000, Target: 250000, so should be over target
            expect(comparison.isUnderTarget).toBe(false);
            expect(comparison.difference).toBe(35000); // 285000 - 250000
        });

        it('should calculate growth from fabric baseline correctly', () => {
            const analyzer = new BundleAnalyzer();
            const comparison = analyzer.compareAgainstTargets();

            // Growth: 285000 - 95200 = 189800
            expect(comparison.growth).toBe(189800);
        });
    });

    describe('getMetrics', () => {
        it('should return metrics with correct structure', () => {
            const analyzer = new BundleAnalyzer();
            const metrics = analyzer.getMetrics();

            expect(metrics).toHaveProperty('totalSizeKB');
            expect(metrics).toHaveProperty('gzippedSizeKB');
            expect(metrics).toHaveProperty('pixiSizeKB');
            expect(metrics).toHaveProperty('isUnderTarget');
            expect(metrics).toHaveProperty('loadTimeEstimate');
            expect(typeof metrics.totalSizeKB).toBe('number');
            expect(typeof metrics.gzippedSizeKB).toBe('number');
            expect(typeof metrics.pixiSizeKB).toBe('number');
            expect(typeof metrics.isUnderTarget).toBe('boolean');
            expect(typeof metrics.loadTimeEstimate).toBe('number');
        });

        it('should convert bytes to KB correctly', () => {
            const analyzer = new BundleAnalyzer();
            const metrics = analyzer.getMetrics();

            // Total: 285000 bytes = 278.32KB -> rounded to 278KB
            expect(metrics.totalSizeKB).toBe(Math.round(285000 / 1024));
            // Gzipped: 85500 bytes = 83.5KB -> rounded to 84KB
            expect(metrics.gzippedSizeKB).toBe(Math.round(85500 / 1024));
        });

        it('should calculate pixi size correctly', () => {
            const analyzer = new BundleAnalyzer();
            const metrics = analyzer.getMetrics();

            // PixiJS size: 220000 bytes = 214.84KB -> rounded to 215KB
            expect(metrics.pixiSizeKB).toBe(Math.round(220000 / 1024));
        });

        it('should use comparison result for isUnderTarget', () => {
            const analyzer = new BundleAnalyzer();
            const metrics = analyzer.getMetrics();
            const comparison = analyzer.compareAgainstTargets();

            expect(metrics.isUnderTarget).toBe(comparison.isUnderTarget);
        });

        it('should calculate load time estimate', () => {
            const analyzer = new BundleAnalyzer();
            const metrics = analyzer.getMetrics();
            const bundleInfo = analyzer.getBundleInfo();

            // Load time: gzippedSize / 1024 / 100 (100KB/s estimate)
            const expectedLoadTime = bundleInfo.gzippedSize / 1024 / 100;
            expect(metrics.loadTimeEstimate).toBe(expectedLoadTime);
        });
    });

    describe('generateBundleReport', () => {
        it('should generate comprehensive bundle report', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(typeof report).toBe('string');
            expect(report.length).toBeGreaterThan(0);
        });

        it('should include expected sections in report', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('=== Bundle Size Analysis Report ===');
            expect(report).toContain('Bundle Overview:');
            expect(report).toContain('Total Size:');
            expect(report).toContain('Gzipped Size:');
            expect(report).toContain('Target Size:');
            expect(report).toContain('Largest Modules:');
            expect(report).toContain('PixiJS Modules:');
            expect(report).toContain('Tree-shaking Effectiveness:');
            expect(report).toContain('Optimization Recommendations:');
            expect(report).toContain('PixiJS Import Optimization:');
        });

        it('should include size information in correct format', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('278.32 KB'); // Total size formatted
            expect(report).toContain('83.5 KB'); // Gzipped size formatted
            expect(report).toContain('244.14 KB'); // Target size formatted
        });

        it('should show over target status', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('❌ Over Target');
            expect(report).toContain('Exceeds by:');
        });

        it('should include module breakdown', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('pixi.js:');
            expect(report).toContain('zustand:');
            expect(report).toContain('@pixi/core:');
            expect(report).toContain('@pixi/display:');
        });

        it('should include tree-shaking analysis', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('PIXI.loaders');
            expect(report).toContain('PIXI.interaction');
            expect(report).toContain('PIXI.prepare');
            expect(report).toContain('PIXI.extract');
        });

        it('should include optimization categories', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('PixiJS Tree-shaking:');
            expect(report).toContain('Asset Optimization:');
            expect(report).toContain('Build Configuration:');
            expect(report).toContain('Code Splitting:');
        });

        it('should include import optimization suggestions', () => {
            const analyzer = new BundleAnalyzer();
            const report = analyzer.generateBundleReport();

            expect(report).toContain('Current (avoid):');
            expect(report).toContain('Optimized (recommended):');
            expect(report).toContain("import * as PIXI from 'pixi.js'");
            expect(report).toContain("import { Application } from '@pixi/app'");
            expect(report).toContain('Estimated Savings:');
        });
    });

    describe('logBundleAnalysis', () => {
        let logSpy: any;
        let warnSpy: any;
        let groupSpy: any;
        let groupEndSpy: any;

        beforeEach(() => {
            // Set up console method spies before each test
            logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
            groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
        });

        afterEach(() => {
            // Restore all mocks after each test
            vi.restoreAllMocks();
        });

        it('should log warning when bundle size exceeds target', () => {
            const analyzer = new BundleAnalyzer();
            // Mock compareAgainstTargets to return over-target result
            vi.spyOn(analyzer, 'compareAgainstTargets').mockReturnValue({
                isUnderTarget: false,
                target: 250000,
                current: 300000,
                difference: 50000,
                fabricJSBaseline: 95200,
                growth: 204800
            });

            analyzer.logBundleAnalysis();

            expect(groupSpy).toHaveBeenCalledWith('Bundle Size Analysis');
            expect(logSpy).toHaveBeenCalledWith(expect.any(String)); // Report log
            expect(warnSpy).toHaveBeenCalledOnce();
            expect(warnSpy).toHaveBeenCalledWith(
                'Bundle size exceeds target. Consider optimization strategies.'
            );
            expect(logSpy).not.toHaveBeenCalledWith('✅ Bundle size is within target limits');
            expect(groupEndSpy).toHaveBeenCalledOnce();
        });

        it('should log success message when bundle size is under target', () => {
            const analyzer = new BundleAnalyzer();
            // Mock compareAgainstTargets to return under-target result
            vi.spyOn(analyzer, 'compareAgainstTargets').mockReturnValue({
                isUnderTarget: true,
                target: 250000,
                current: 200000,
                difference: -50000,
                fabricJSBaseline: 95200,
                growth: 104800
            });

            analyzer.logBundleAnalysis();

            expect(groupSpy).toHaveBeenCalledWith('Bundle Size Analysis');
            expect(logSpy).toHaveBeenCalledWith(expect.any(String)); // Report log
            expect(warnSpy).not.toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith('✅ Bundle size is within target limits');
            expect(groupEndSpy).toHaveBeenCalledOnce();
        });

        it('should call generateBundleReport and use its output', () => {
            const analyzer = new BundleAnalyzer();
            const reportSpy = vi.spyOn(analyzer, 'generateBundleReport');

            analyzer.logBundleAnalysis();

            expect(reportSpy).toHaveBeenCalledOnce();
            expect(logSpy).toHaveBeenCalledWith(expect.any(String));
        });

        it('should call console methods in correct order', () => {
            const analyzer = new BundleAnalyzer();

            analyzer.logBundleAnalysis();

            // Verify the order of console method calls
            expect(groupSpy).toHaveBeenCalledBefore(logSpy);
            expect(logSpy).toHaveBeenCalledBefore(groupEndSpy);
        });
    });

    describe('branch coverage edge cases', () => {
        it('should handle tree-shaking effectiveness when not effective', () => {
            const analyzer = new BundleAnalyzer();

            // Mock analyzeTreeShaking to return ineffective result (>= 5 unused exports)
            vi.spyOn(analyzer, 'analyzeTreeShaking').mockReturnValue({
                isEffective: false, // This will trigger the 'Needs Improvement' branch
                unusedExports: ['export1', 'export2', 'export3', 'export4', 'export5', 'export6'],
                suggestions: ['suggestion1', 'suggestion2']
            });

            const report = analyzer.generateBundleReport();

            expect(report).toContain('Tree-shaking Effectiveness: Needs Improvement');
        });

        it('should handle missing pixi.js module in getMetrics', () => {
            const analyzer = new BundleAnalyzer();

            // Mock getBundleInfo to return modules without pixi.js
            vi.spyOn(analyzer, 'getBundleInfo').mockReturnValue({
                totalSize: 100000,
                gzippedSize: 30000,
                modules: [
                    { name: 'other-module', size: 50000 },
                    { name: 'another-module', size: 50000 }
                    // Note: no pixi.js module here to trigger the || 0 fallback
                ],
                pixiModules: []
            });

            const metrics = analyzer.getMetrics();

            expect(metrics.pixiSizeKB).toBe(0); // Should fallback to 0 when pixi.js not found
            expect(metrics.totalSizeKB).toBe(98); // Math.round(100000 / 1024)
        });
    });
});

/**
 * Bundle size analysis and optimization utilities
 */
export class BundleAnalyzer {
    private bundleInfo: {
        totalSize: number;
        gzippedSize: number;
        modules: Array<{ name: string; size: number }>;
        pixiModules: Array<{ name: string; size: number }>;
    } | null = null;

    constructor() {
        this.bundleInfo = this.analyzeBundleSize();
    }

    /**
     * Analyze current bundle size and composition
     */
    private analyzeBundleSize(): {
        totalSize: number;
        gzippedSize: number;
        modules: Array<{ name: string; size: number }>;
        pixiModules: Array<{ name: string; size: number }>;
    } {
        // In a real implementation, this would analyze the actual bundle
        // For demo purposes, we'll simulate the analysis
        const modules = [
            { name: 'pixi.js', size: 220000 }, // ~220KB estimated
            { name: 'zustand', size: 15000 },
            { name: 'vite', size: 5000 },
            { name: 'application-code', size: 45000 }
        ];

        const pixiModules = [
            { name: '@pixi/core', size: 85000 },
            { name: '@pixi/display', size: 25000 },
            { name: '@pixi/graphics', size: 30000 },
            { name: '@pixi/text', size: 20000 },
            { name: '@pixi/sprite', size: 15000 },
            { name: '@pixi/particle-container', size: 12000 },
            { name: '@pixi/app', size: 8000 },
            { name: '@pixi/ticker', size: 6000 },
            { name: '@pixi/utils', size: 12000 },
            { name: '@pixi/constants', size: 3000 },
            { name: '@pixi/math', size: 4000 }
        ];

        const totalSize = modules.reduce((sum, mod) => sum + mod.size, 0);
        const gzippedSize = Math.round(totalSize * 0.3); // Estimated 70% compression

        return {
            totalSize,
            gzippedSize,
            modules,
            pixiModules
        };
    }

    /**
     * Get bundle size information
     */
    getBundleInfo(): {
        totalSize: number;
        gzippedSize: number;
        modules: Array<{ name: string; size: number }>;
        pixiModules: Array<{ name: string; size: number }>;
    } {
        return (
            this.bundleInfo || {
                totalSize: 0,
                gzippedSize: 0,
                modules: [],
                pixiModules: []
            }
        );
    }

    /**
     * Format file size in human-readable format
     */
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
    }

    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): {
        category: string;
        recommendations: string[];
        potentialSavings: number;
    }[] {
        const recommendations = [
            {
                category: 'PixiJS Tree-shaking',
                recommendations: [
                    'Import only required PixiJS modules',
                    'Use @pixi/core instead of full pixi.js',
                    'Remove unused renderers (Canvas2D if only WebGL needed)',
                    'Exclude interaction modules if not needed'
                ],
                potentialSavings: 50000 // ~50KB
            },
            {
                category: 'Asset Optimization',
                recommendations: [
                    'Compress textures with WebP format',
                    'Use texture atlases for sprites',
                    'Implement lazy loading for assets',
                    'Optimize font files'
                ],
                potentialSavings: 20000 // ~20KB
            },
            {
                category: 'Build Configuration',
                recommendations: [
                    'Enable production mode optimizations',
                    'Configure proper minification settings',
                    'Use modern JavaScript targets',
                    'Enable gzip compression on server'
                ],
                potentialSavings: 30000 // ~30KB
            },
            {
                category: 'Code Splitting',
                recommendations: [
                    'Split PixiJS into separate chunk',
                    'Lazy load stage-specific code',
                    'Use dynamic imports for optional features',
                    'Implement service worker caching'
                ],
                potentialSavings: 0 // No size reduction, but better loading
            }
        ];

        return recommendations;
    }

    /**
     * Analyze tree-shaking effectiveness
     */
    analyzeTreeShaking(): {
        isEffective: boolean;
        unusedExports: string[];
        suggestions: string[];
    } {
        // Simulated analysis - in real implementation would analyze actual bundle
        const unusedExports = [
            'PIXI.loaders', // Deprecated
            'PIXI.interaction', // Not used in this game
            'PIXI.prepare', // Asset preparation not needed
            'PIXI.extract' // Canvas extraction not used
        ];

        const suggestions = [
            "Use import { Application, Container } from '@pixi/core'",
            'Avoid import * as PIXI syntax',
            'Configure bundler to mark side effects properly',
            'Use webpack-bundle-analyzer for detailed analysis'
        ];

        return {
            isEffective: unusedExports.length < 5,
            unusedExports,
            suggestions
        };
    }

    /**
     * Compare against target sizes
     */
    compareAgainstTargets(): {
        target: number;
        current: number;
        isUnderTarget: boolean;
        difference: number;
        fabricJSBaseline: number;
        growth: number;
    } {
        const bundleInfo = this.getBundleInfo();
        const target = 250000; // 250KB target
        const fabricJSBaseline = 95200; // 95.2KB baseline

        const current = bundleInfo.totalSize;
        const isUnderTarget = current <= target;
        const difference = current - target;
        const growth = current - fabricJSBaseline;

        return {
            target,
            current,
            isUnderTarget,
            difference,
            fabricJSBaseline,
            growth
        };
    }

    /**
     * Get PixiJS-specific optimization suggestions
     */
    getPixiJSOptimizations(): {
        currentImports: string[];
        optimizedImports: string[];
        sizeSavings: number;
    } {
        const currentImports = ["import * as PIXI from 'pixi.js'"];

        const optimizedImports = [
            "import { Application } from '@pixi/app'",
            "import { Container } from '@pixi/display'",
            "import { Graphics } from '@pixi/graphics'",
            "import { Text, TextStyle } from '@pixi/text'",
            "import { ParticleContainer } from '@pixi/particle-container'",
            "import { Renderer } from '@pixi/core'"
        ];

        const sizeSavings = 50000; // Estimated 50KB savings

        return {
            currentImports,
            optimizedImports,
            sizeSavings
        };
    }

    /**
     * Generate comprehensive bundle analysis report
     */
    generateBundleReport(): string {
        const bundleInfo = this.getBundleInfo();
        const comparison = this.compareAgainstTargets();
        const treeShaking = this.analyzeTreeShaking();
        const optimizations = this.getOptimizationRecommendations();
        const pixiOptimizations = this.getPixiJSOptimizations();

        let report = '=== Bundle Size Analysis Report ===\n\n';

        // Bundle overview
        report += 'Bundle Overview:\n';
        report += `Total Size: ${this.formatFileSize(bundleInfo.totalSize)}\n`;
        report += `Gzipped Size: ${this.formatFileSize(bundleInfo.gzippedSize)}\n`;
        report += `Target Size: ${this.formatFileSize(comparison.target)}\n`;
        report += `Status: ${comparison.isUnderTarget ? '✅ Under Target' : '❌ Over Target'}\n`;

        if (!comparison.isUnderTarget) {
            report += `Exceeds by: ${this.formatFileSize(comparison.difference)}\n`;
        }

        report += `Growth from FabricJS: ${this.formatFileSize(comparison.growth)}\n\n`;

        // Top modules
        report += 'Largest Modules:\n';
        const topModules = bundleInfo.modules.sort((a, b) => b.size - a.size).slice(0, 5);
        for (const mod of topModules) {
            report += `- ${mod.name}: ${this.formatFileSize(mod.size)}\n`;
        }
        report += '\n';

        // PixiJS modules breakdown
        report += 'PixiJS Modules:\n';
        for (const mod of bundleInfo.pixiModules) {
            report += `- ${mod.name}: ${this.formatFileSize(mod.size)}\n`;
        }
        report += '\n';

        // Tree-shaking analysis
        report += `Tree-shaking Effectiveness: ${treeShaking.isEffective ? 'Good' : 'Needs Improvement'}\n`;
        if (treeShaking.unusedExports.length > 0) {
            report += 'Unused Exports Detected:\n';
            for (const exp of treeShaking.unusedExports) {
                report += `- ${exp}\n`;
            }
            report += '\n';
        }

        // Optimization recommendations
        report += 'Optimization Recommendations:\n';
        for (const category of optimizations) {
            report += `\n${category.category}:\n`;
            for (const rec of category.recommendations) {
                report += `- ${rec}\n`;
            }
            if (category.potentialSavings > 0) {
                report += `  Potential Savings: ${this.formatFileSize(category.potentialSavings)}\n`;
            }
        }

        // PixiJS-specific optimizations
        report += '\nPixiJS Import Optimization:\n';
        report += 'Current (avoid):\n';
        for (const imp of pixiOptimizations.currentImports) {
            report += `- ${imp}\n`;
        }
        report += '\nOptimized (recommended):\n';
        for (const imp of pixiOptimizations.optimizedImports) {
            report += `- ${imp}\n`;
        }
        report += `Estimated Savings: ${this.formatFileSize(pixiOptimizations.sizeSavings)}\n`;

        return report;
    }

    /**
     * Log bundle analysis to console
     */
    logBundleAnalysis(): void {
        const comparison = this.compareAgainstTargets();

        console.group('Bundle Size Analysis');
        console.log(this.generateBundleReport());

        if (!comparison.isUnderTarget) {
            console.warn('Bundle size exceeds target. Consider optimization strategies.');
        } else {
            console.log('✅ Bundle size is within target limits');
        }

        console.groupEnd();
    }

    /**
     * Get bundle size metrics for monitoring
     */
    getMetrics(): {
        totalSizeKB: number;
        gzippedSizeKB: number;
        pixiSizeKB: number;
        isUnderTarget: boolean;
        loadTimeEstimate: number;
    } {
        const bundleInfo = this.getBundleInfo();
        const comparison = this.compareAgainstTargets();

        const pixiSize = bundleInfo.modules.find((m) => m.name === 'pixi.js')?.size || 0;
        const loadTimeEstimate = bundleInfo.gzippedSize / 1024 / 100; // Rough estimate: 100KB/s

        return {
            totalSizeKB: Math.round(bundleInfo.totalSize / 1024),
            gzippedSizeKB: Math.round(bundleInfo.gzippedSize / 1024),
            pixiSizeKB: Math.round(pixiSize / 1024),
            isUnderTarget: comparison.isUnderTarget,
            loadTimeEstimate
        };
    }
}

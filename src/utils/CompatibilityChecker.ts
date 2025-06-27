/**
 * Cross-browser compatibility checker for PixiJS features
 */
export class CompatibilityChecker {
    private browserInfo: {
        name: string;
        version: string;
        isSupported: boolean;
    } | null = null;

    constructor() {
        this.browserInfo = this.detectBrowser();
    }

    /**
     * Detect browser type and version
     */
    private detectBrowser(): { name: string; version: string; isSupported: boolean } {
        const userAgent = navigator.userAgent;
        let name = 'Unknown';
        let version = '0';
        let isSupported = false;

        // Chrome
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            name = 'Chrome';
            const match = userAgent.match(/Chrome\/(\d+)/);
            version = match ? match[1] : '0';
            isSupported = Number.parseInt(version) >= 60;
        }
        // Edge
        else if (userAgent.includes('Edg')) {
            name = 'Edge';
            const match = userAgent.match(/Edg\/(\d+)/);
            version = match ? match[1] : '0';
            isSupported = Number.parseInt(version) >= 79;
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            name = 'Firefox';
            const match = userAgent.match(/Firefox\/(\d+)/);
            version = match ? match[1] : '0';
            isSupported = Number.parseInt(version) >= 60;
        }
        // Safari
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            name = 'Safari';
            const match = userAgent.match(/Version\/(\d+)/);
            version = match ? match[1] : '0';
            isSupported = Number.parseInt(version) >= 12;
        }

        return { name, version, isSupported };
    }

    /**
     * Get browser information
     */
    getBrowserInfo(): { name: string; version: string; isSupported: boolean } {
        return this.browserInfo || { name: 'Unknown', version: '0', isSupported: false };
    }

    /**
     * Check WebGL support and version
     */
    checkWebGLSupport(): {
        isSupported: boolean;
        version: number;
        renderer?: string;
        vendor?: string;
    } {
        const canvas = document.createElement('canvas');

        // Try WebGL2 first
        let gl: WebGL2RenderingContext | WebGLRenderingContext | null = canvas.getContext('webgl2');
        let version = 2;

        // Fall back to WebGL1
        if (!gl) {
            gl = canvas.getContext('webgl');
            version = 1;
        }

        if (!gl) {
            return { isSupported: false, version: 0 };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'Unknown';
        const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'Unknown';

        return {
            isSupported: true,
            version,
            renderer,
            vendor
        };
    }

    /**
     * Check Canvas2D support
     */
    checkCanvas2DSupport(): boolean {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        return context !== null;
    }

    /**
     * Check requestAnimationFrame support
     */
    checkRequestAnimationFrameSupport(): boolean {
        return typeof requestAnimationFrame === 'function';
    }

    /**
     * Get available WebGL extensions
     */
    getWebGLExtensions(): string[] {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');

        if (!gl) {
            return [];
        }

        const extensions = gl.getSupportedExtensions();
        return extensions || [];
    }

    /**
     * Test basic rendering performance
     */
    testRenderingPerformance(): {
        framesRendered: number;
        averageFrameTime: number;
        estimatedFPS: number;
    } {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return { framesRendered: 0, averageFrameTime: 0, estimatedFPS: 0 };
        }

        const startTime = performance.now();
        let frameCount = 0;
        const maxFrames = 60; // Test for 60 frames

        // Simple rendering test
        while (frameCount < maxFrames) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'red';
            ctx.fillRect(Math.random() * 700, Math.random() * 500, 100, 100);
            frameCount++;
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const averageFrameTime = totalTime / frameCount;
        const estimatedFPS = 1000 / averageFrameTime;

        return {
            framesRendered: frameCount,
            averageFrameTime,
            estimatedFPS
        };
    }

    /**
     * Test memory usage (if supported)
     */
    testMemoryUsage(): {
        heapUsed: number;
        heapTotal: number;
        isSupported: boolean;
    } {
        // Type-safe window performance access
        const windowWithPerf = window as typeof window & {
            performance?: Performance & {
                memory?: {
                    usedJSHeapSize: number;
                    totalJSHeapSize: number;
                    jsHeapSizeLimit: number;
                };
            };
        };

        const performanceObj = windowWithPerf.performance;

        if (!performanceObj?.memory) {
            return { heapUsed: 0, heapTotal: 0, isSupported: false };
        }

        return {
            heapUsed: performanceObj.memory.usedJSHeapSize,
            heapTotal: performanceObj.memory.totalJSHeapSize,
            isSupported: true
        };
    }

    /**
     * Get device information
     */
    getDeviceInfo(): {
        platform: string;
        isMobile: boolean;
        isTablet: boolean;
        screenResolution: string;
        pixelRatio: number;
    } {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(
            userAgent
        );
        const isTablet = /iPad|Android.*(?!.*Mobile)/i.test(userAgent);

        const screenResolution = `${screen.width}x${screen.height}`;
        const pixelRatio = window.devicePixelRatio || 1;

        return {
            platform,
            isMobile,
            isTablet,
            screenResolution,
            pixelRatio
        };
    }

    /**
     * Get browser-specific configuration recommendations
     */
    getBrowserSpecificConfig(): {
        requiresWorkarounds: boolean;
        recommendations: string[];
    } {
        const browserInfo = this.getBrowserInfo();
        const recommendations: string[] = [];
        let requiresWorkarounds = false;

        switch (browserInfo.name) {
            case 'Safari':
                requiresWorkarounds = true;
                recommendations.push('antialias: false');
                recommendations.push('powerPreference: "default"');
                recommendations.push('preserveDrawingBuffer: false');
                break;

            case 'Firefox':
                recommendations.push('powerPreference: "high-performance"');
                recommendations.push('preserveDrawingBuffer: false');
                break;

            case 'Chrome':
            case 'Edge':
                recommendations.push('powerPreference: "high-performance"');
                recommendations.push('antialias: true');
                break;

            default:
                requiresWorkarounds = true;
                recommendations.push('Use Canvas2D fallback');
                recommendations.push('Disable advanced features');
                break;
        }

        return { requiresWorkarounds, recommendations };
    }

    /**
     * Get compatibility issues
     */
    getCompatibilityIssues(): string[] {
        const issues: string[] = [];
        const browserInfo = this.getBrowserInfo();
        const webglSupport = this.checkWebGLSupport();
        const canvas2dSupport = this.checkCanvas2DSupport();

        if (!browserInfo.isSupported) {
            issues.push('Browser not supported');
        }

        if (!webglSupport.isSupported) {
            issues.push('WebGL not supported');
        }

        if (!canvas2dSupport) {
            issues.push('Canvas2D not supported');
        }

        if (!this.checkRequestAnimationFrameSupport()) {
            issues.push('requestAnimationFrame not supported');
        }

        const deviceInfo = this.getDeviceInfo();
        if (deviceInfo.isMobile && deviceInfo.pixelRatio > 2) {
            issues.push('High DPI mobile device may have performance issues');
        }

        return issues;
    }

    /**
     * Get workarounds for compatibility issues
     */
    getWorkarounds(): string[] {
        const issues = this.getCompatibilityIssues();
        const workarounds: string[] = [];

        if (issues.includes('WebGL not supported')) {
            workarounds.push('Use Canvas2D renderer as fallback');
            workarounds.push('Disable WebGL-specific features');
        }

        if (issues.includes('Browser not supported')) {
            workarounds.push('Display browser upgrade message');
            workarounds.push('Provide download links for supported browsers');
        }

        if (issues.includes('requestAnimationFrame not supported')) {
            workarounds.push('Use setTimeout fallback for animation');
        }

        if (issues.includes('High DPI mobile device may have performance issues')) {
            workarounds.push('Reduce canvas resolution');
            workarounds.push('Disable anti-aliasing');
            workarounds.push('Limit particle effects');
        }

        return workarounds;
    }

    /**
     * Generate comprehensive compatibility report
     */
    generateCompatibilityReport(): string {
        const browserInfo = this.getBrowserInfo();
        const webglSupport = this.checkWebGLSupport();
        const canvas2dSupport = this.checkCanvas2DSupport();

        const deviceInfo = this.getDeviceInfo();
        const issues = this.getCompatibilityIssues();
        const workarounds = this.getWorkarounds();

        let report = '=== Browser Compatibility Report ===\n\n';

        // Browser information
        report += `Browser: ${browserInfo.name} ${browserInfo.version}\n`;
        report += `Supported: ${browserInfo.isSupported ? 'Yes' : 'No'}\n\n`;

        // WebGL support
        report += `WebGL Support: ${webglSupport.isSupported ? 'Yes' : 'No'}\n`;
        if (webglSupport.isSupported) {
            report += `WebGL Version: ${webglSupport.version}\n`;
            report += `Renderer: ${webglSupport.renderer}\n`;
            report += `Vendor: ${webglSupport.vendor}\n`;
        }
        report += '\n';

        // Canvas2D support
        report += `Canvas2D Support: ${canvas2dSupport ? 'Yes' : 'No'}

`;

        // Device information
        report += `Platform: ${deviceInfo.platform}\n`;
        report += `Mobile: ${deviceInfo.isMobile ? 'Yes' : 'No'}\n`;
        report += `Tablet: ${deviceInfo.isTablet ? 'Yes' : 'No'}\n`;
        report += `Screen Resolution: ${deviceInfo.screenResolution}\n`;
        report += `Pixel Ratio: ${deviceInfo.pixelRatio}\n\n`;

        // Issues and workarounds
        if (issues.length > 0) {
            report += 'Compatibility Issues:\n';
            for (const issue of issues) {
                report += `- ${issue}\n`;
            }
            report += '\n';

            if (workarounds.length > 0) {
                report += 'Recommended Workarounds:\n';
                for (const workaround of workarounds) {
                    report += `- ${workaround}\n`;
                }
            }
        } else {
            report += 'No compatibility issues detected.\n';
        }

        return report;
    }

    /**
     * Log compatibility report to console
     */
    logCompatibilityReport(): void {
        console.group('Browser Compatibility Report');
        console.log(this.generateCompatibilityReport());

        const issues = this.getCompatibilityIssues();
        if (issues.length > 0) {
            console.warn('Compatibility Issues Detected:', issues);
        } else {
            console.log('✅ No compatibility issues detected');
        }

        console.groupEnd();
    }
}

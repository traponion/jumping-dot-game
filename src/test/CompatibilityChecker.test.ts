import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompatibilityChecker } from '../utils/CompatibilityChecker';

// Mock navigator and other browser APIs
const mockNavigator = {
    userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    platform: 'Win32',
    maxTouchPoints: 0
};

const mockWebGLContext = {
    getParameter: vi.fn(),
    getExtension: vi.fn(),
    getSupportedExtensions: vi.fn(() => [
        'OES_vertex_array_object',
        'WEBGL_lose_context',
        'OES_element_index_uint'
    ])
};

const mockCanvas2DContext = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    fillStyle: 'red'
};

const mockCanvas = {
    getContext: vi.fn((type: string) => {
        if (type === 'webgl2' || type === 'webgl') return mockWebGLContext;
        if (type === '2d') return mockCanvas2DContext;
        return null;
    }),
    width: 800,
    height: 600
};

// Mock document.createElement
global.document = {
    createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
            return mockCanvas;
        }
        return {};
    })
} as any;

global.navigator = mockNavigator as any;

describe('CompatibilityChecker', () => {
    let checker: CompatibilityChecker;

    beforeEach(() => {
        vi.clearAllMocks();
        checker = new CompatibilityChecker();
    });

    describe('constructor', () => {
        it('should create CompatibilityChecker instance', () => {
            expect(checker).toBeInstanceOf(CompatibilityChecker);
        });
    });

    describe('browser detection', () => {
        it('should detect Chrome browser', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

            const browserInfo = checker.getBrowserInfo();

            expect(browserInfo.name).toBe('Chrome');
            expect(browserInfo.version).toMatch(/91/);
            expect(browserInfo.isSupported).toBe(true);
        });

        it('should detect Firefox browser', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0';

            // Create new instance after changing userAgent
            const firefoxChecker = new CompatibilityChecker();
            const browserInfo = firefoxChecker.getBrowserInfo();

            expect(browserInfo.name).toBe('Firefox');
            expect(browserInfo.version).toMatch(/89/);
            expect(browserInfo.isSupported).toBe(true);
        });

        it('should detect Safari browser', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';

            // Create new instance after changing userAgent
            const safariChecker = new CompatibilityChecker();
            const browserInfo = safariChecker.getBrowserInfo();

            expect(browserInfo.name).toBe('Safari');
            expect(browserInfo.version).toMatch(/14/);
            expect(browserInfo.isSupported).toBe(true);
        });

        it('should detect Edge browser', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59';

            // Create new instance after changing userAgent
            const edgeChecker = new CompatibilityChecker();
            const browserInfo = edgeChecker.getBrowserInfo();

            expect(browserInfo.name).toBe('Edge');
            expect(browserInfo.version).toMatch(/91/);
            expect(browserInfo.isSupported).toBe(true);
        });

        it('should detect unsupported browser', () => {
            mockNavigator.userAgent = 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)';

            // Create new instance after changing userAgent
            const unknownChecker = new CompatibilityChecker();
            const browserInfo = unknownChecker.getBrowserInfo();

            expect(browserInfo.isSupported).toBe(false);
            expect(browserInfo.name).toBe('Unknown');
        });
    });

    describe('WebGL support detection', () => {
        it('should detect WebGL support', () => {
            mockCanvas.getContext.mockReturnValue(mockWebGLContext);

            const webglSupport = checker.checkWebGLSupport();

            expect(webglSupport.isSupported).toBe(true);
            expect(webglSupport.version).toBeGreaterThan(0);
        });

        it('should handle WebGL not supported', () => {
            mockCanvas.getContext.mockReturnValue(null as any);

            const webglSupport = checker.checkWebGLSupport();

            expect(webglSupport.isSupported).toBe(false);
            expect(webglSupport.version).toBe(0);
        });

        it('should detect WebGL extensions', () => {
            mockWebGLContext.getExtension.mockImplementation((ext: string) => {
                if (ext === 'OES_vertex_array_object') return {};
                if (ext === 'WEBGL_lose_context') return {};
                return null;
            });

            const extensions = checker.getWebGLExtensions();

            expect(extensions).toContain('OES_vertex_array_object');
            expect(extensions).toContain('WEBGL_lose_context');
        });
    });

    describe('feature detection', () => {
        it('should detect Canvas2D support', () => {
            const canvas2dSupport = checker.checkCanvas2DSupport();
            expect(canvas2dSupport).toBe(true);
        });

        it('should detect touch support', () => {
            mockNavigator.maxTouchPoints = 5;

            const touchSupport = checker.checkTouchSupport();

            expect(touchSupport.isSupported).toBe(true);
            expect(touchSupport.maxTouchPoints).toBe(5);
        });

        it('should detect requestAnimationFrame support', () => {
            global.requestAnimationFrame = vi.fn();

            const rafSupport = checker.checkRequestAnimationFrameSupport();

            expect(rafSupport).toBe(true);
        });
    });

    describe('compatibility report', () => {
        it('should generate comprehensive compatibility report', () => {
            const report = checker.generateCompatibilityReport();

            expect(report).toContain('Browser Compatibility Report');
            expect(report).toContain('Browser:');
            expect(report).toContain('WebGL Support:');
            expect(report).toContain('Canvas2D Support:');
            expect(report).toContain('Touch Support:');
        });

        it('should identify compatibility issues', () => {
            // Mock unsupported browser
            mockNavigator.userAgent = 'Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)';
            mockCanvas.getContext.mockReturnValue(null as any); // No WebGL

            const issues = checker.getCompatibilityIssues();

            expect(issues.length).toBeGreaterThan(0);
            expect(issues).toContain('Browser not supported');
            expect(issues).toContain('WebGL not supported');
        });

        it('should suggest workarounds for issues', () => {
            mockCanvas.getContext.mockReturnValue(null as any); // No WebGL

            const workarounds = checker.getWorkarounds();

            expect(workarounds.length).toBeGreaterThan(0);
            expect(workarounds.some((w) => w.includes('Canvas2D'))).toBe(true);
        });
    });

    describe('device information', () => {
        it('should get device information', () => {
            const deviceInfo = checker.getDeviceInfo();

            expect(deviceInfo).toHaveProperty('platform');
            expect(deviceInfo).toHaveProperty('isMobile');
            expect(deviceInfo).toHaveProperty('isTablet');
            expect(deviceInfo).toHaveProperty('screenResolution');
        });

        it('should detect mobile devices', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15';
            mockNavigator.maxTouchPoints = 5;

            const deviceInfo = checker.getDeviceInfo();

            expect(deviceInfo.isMobile).toBe(true);
            expect(deviceInfo.isTablet).toBe(false);
        });
    });

    describe('browser-specific workarounds', () => {
        it('should provide Safari-specific configurations', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';

            // Create new instance for Safari
            const safariChecker = new CompatibilityChecker();
            const config = safariChecker.getBrowserSpecificConfig();

            expect(config.requiresWorkarounds).toBe(true);
            expect(config.recommendations).toContain('antialias: false');
        });

        it('should provide default configuration for supported browsers', () => {
            mockNavigator.userAgent =
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

            // Create new instance for Chrome
            const chromeChecker = new CompatibilityChecker();
            const config = chromeChecker.getBrowserSpecificConfig();

            expect(config.requiresWorkarounds).toBe(false);
            expect(config.recommendations.length).toBeGreaterThan(0);
        });
    });
});

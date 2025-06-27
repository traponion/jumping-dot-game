import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
    let originalCreateElement: any;

    beforeEach(() => {
        // Store original createElement for restoration
        originalCreateElement = global.document.createElement;

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

    describe('additional support checks', () => {
        it('should check requestAnimationFrame support', () => {
            // Mock requestAnimationFrame as available
            global.requestAnimationFrame = vi.fn();

            const support = checker.checkRequestAnimationFrameSupport();

            expect(support).toBe(true);
        });

        it('should handle missing requestAnimationFrame', () => {
            // Remove requestAnimationFrame
            const originalRAF = global.requestAnimationFrame;
            (global as any).requestAnimationFrame = undefined;

            const support = checker.checkRequestAnimationFrameSupport();

            expect(support).toBe(false);

            // Restore
            global.requestAnimationFrame = originalRAF;
        });

        it('should get WebGL extensions list', () => {
            mockCanvas.getContext.mockReturnValue(mockWebGLContext);

            const extensions = checker.getWebGLExtensions();

            expect(Array.isArray(extensions)).toBe(true);
            expect(extensions.length).toBeGreaterThan(0);
        });

        it('should handle WebGL extensions when WebGL unavailable', () => {
            mockCanvas.getContext.mockReturnValue(null);

            const extensions = checker.getWebGLExtensions();

            expect(extensions).toEqual([]);
        });

        it('should test rendering performance', () => {
            mockCanvas.getContext.mockReturnValue(mockCanvas2DContext);

            const performance = checker.testRenderingPerformance();

            expect(performance).toHaveProperty('framesRendered');
            expect(performance).toHaveProperty('averageFrameTime');
            expect(performance).toHaveProperty('estimatedFPS');
            expect(performance.framesRendered).toBeGreaterThan(0);
        });

        it('should handle rendering performance test without 2D context', () => {
            mockCanvas.getContext.mockReturnValue(null);

            const performance = checker.testRenderingPerformance();

            expect(performance.framesRendered).toBe(0);
            expect(performance.averageFrameTime).toBe(0);
            expect(performance.estimatedFPS).toBe(0);
        });

        it('should test memory usage when supported', () => {
            // Mock performance.memory
            const mockPerformance = {
                memory: {
                    usedJSHeapSize: 1000000,
                    totalJSHeapSize: 2000000,
                    jsHeapSizeLimit: 4000000
                }
            };
            (global as any).window = { performance: mockPerformance };

            const memory = checker.testMemoryUsage();

            expect(memory.isSupported).toBe(true);
            expect(memory.heapUsed).toBe(1000000);
            expect(memory.heapTotal).toBe(2000000);
        });

        it('should handle memory usage test when not supported', () => {
            (global as any).window = { performance: {} };

            const memory = checker.testMemoryUsage();

            expect(memory.isSupported).toBe(false);
            expect(memory.heapUsed).toBe(0);
            expect(memory.heapTotal).toBe(0);
        });
    });

    describe('compatibility reporting', () => {
        it('should get compatibility issues', () => {
            const issues = checker.getCompatibilityIssues();

            expect(Array.isArray(issues)).toBe(true);
        });

        it('should get workarounds for issues', () => {
            const workarounds = checker.getWorkarounds();

            expect(Array.isArray(workarounds)).toBe(true);
        });

        it('should generate comprehensive compatibility report', () => {
            const report = checker.generateCompatibilityReport();

            expect(typeof report).toBe('string');
            expect(report).toContain('Browser Compatibility Report');
            expect(report).toContain('Browser:');
            expect(report).toContain('WebGL Support:');
        });

        it('should log compatibility report to console', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
            const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

            checker.logCompatibilityReport();

            expect(consoleGroupSpy).toHaveBeenCalledWith('Browser Compatibility Report');
            expect(consoleSpy).toHaveBeenCalled();
            expect(consoleGroupEndSpy).toHaveBeenCalled();

            consoleSpy.mockRestore();
            consoleGroupSpy.mockRestore();
            consoleGroupEndSpy.mockRestore();
        });
    });

    describe('edge cases and branch coverage', () => {
        it('should handle browser version extraction failures', () => {
            // Test Chrome without version
            global.navigator = { userAgent: 'Chrome' } as any;
            const checker1 = new CompatibilityChecker();
            const browserInfo1 = checker1.getBrowserInfo();
            expect(browserInfo1.version).toBe('0');

            // Test Firefox without version
            global.navigator = { userAgent: 'Firefox' } as any;
            const checker2 = new CompatibilityChecker();
            const browserInfo2 = checker2.getBrowserInfo();
            expect(browserInfo2.version).toBe('0');

            // Test Edge without version
            global.navigator = { userAgent: 'Edg' } as any;
            const checker3 = new CompatibilityChecker();
            const browserInfo3 = checker3.getBrowserInfo();
            expect(browserInfo3.version).toBe('0');

            // Test Safari without version
            global.navigator = { userAgent: 'Safari' } as any;
            const checker4 = new CompatibilityChecker();
            const browserInfo4 = checker4.getBrowserInfo();
            expect(browserInfo4.version).toBe('0');
        });

        it('should handle old browser versions as unsupported', () => {
            // Old Chrome
            global.navigator = { userAgent: 'Chrome/59' } as any;
            const checker1 = new CompatibilityChecker();
            expect(checker1.getBrowserInfo().isSupported).toBe(false);

            // Old Firefox
            global.navigator = { userAgent: 'Firefox/59' } as any;
            const checker2 = new CompatibilityChecker();
            expect(checker2.getBrowserInfo().isSupported).toBe(false);

            // Old Edge
            global.navigator = { userAgent: 'Edg/78' } as any;
            const checker3 = new CompatibilityChecker();
            expect(checker3.getBrowserInfo().isSupported).toBe(false);

            // Old Safari
            global.navigator = { userAgent: 'Safari Version/11' } as any;
            const checker4 = new CompatibilityChecker();
            expect(checker4.getBrowserInfo().isSupported).toBe(false);
        });

        it('should handle WebGL context creation edge cases', () => {
            // WebGL2 fails, WebGL1 succeeds
            const mockCanvasWebGL1Only = {
                getContext: vi.fn((type: string) => {
                    if (type === 'webgl2') return null;
                    if (type === 'webgl')
                        return {
                            getParameter: vi.fn(),
                            getExtension: vi.fn(() => null)
                        };
                    return null;
                })
            };

            global.document.createElement = vi.fn((tag: string) => {
                if (tag === 'canvas') return mockCanvasWebGL1Only;
                return {};
            }) as any;

            const checker = new CompatibilityChecker();
            const webglSupport = checker.checkWebGLSupport();

            expect(webglSupport.isSupported).toBe(true);
            expect(webglSupport.version).toBe(1);
            expect(webglSupport.renderer).toBe('Unknown');
            expect(webglSupport.vendor).toBe('Unknown');

            // Restore original createElement
            global.document.createElement = originalCreateElement;
        });

        it('should handle missing requestAnimationFrame', () => {
            const originalRAF = global.requestAnimationFrame;
            (global as any).requestAnimationFrame = undefined;

            const checker = new CompatibilityChecker();
            const rafSupport = checker.checkRequestAnimationFrameSupport();

            expect(rafSupport).toBe(false);

            // Restore
            if (originalRAF) {
                global.requestAnimationFrame = originalRAF;
            }
        });

        it('should handle performance memory API unavailable', () => {
            const originalPerformance = global.performance;
            global.performance = {} as any;

            const checker = new CompatibilityChecker();
            const memoryTest = checker.testMemoryUsage();

            expect(memoryTest.heapUsed).toBe(0);
            expect(memoryTest.heapTotal).toBe(0);
            expect(memoryTest.isSupported).toBe(false);

            // Restore
            global.performance = originalPerformance;
        });

        it('should handle Canvas 2D context unavailable', () => {
            const mockCanvasNo2D = {
                getContext: vi.fn(() => null)
            };

            global.document.createElement = vi.fn((tag: string) => {
                if (tag === 'canvas') return mockCanvasNo2D;
                return {};
            }) as any;

            const checker = new CompatibilityChecker();
            const canvas2DSupport = checker.checkCanvas2DSupport();

            expect(canvas2DSupport).toBe(false);

            // Restore original createElement
            global.document.createElement = originalCreateElement;
        });

        it('should test all browser-specific configuration branches', () => {
            // Test Unknown browser
            global.navigator = { userAgent: 'UnknownBrowser/1.0' } as any;
            const checker1 = new CompatibilityChecker();
            const config1 = checker1.getBrowserSpecificConfig();
            expect(config1.requiresWorkarounds).toBe(true);
            expect(config1.recommendations).toContain('Use Canvas2D fallback');

            // Test Firefox specific config
            global.navigator = { userAgent: 'Firefox/91' } as any;
            const checker2 = new CompatibilityChecker();
            const config2 = checker2.getBrowserSpecificConfig();
            expect(config2.recommendations).toContain('powerPreference: "high-performance"');

            // Test Safari specific config
            global.navigator = { userAgent: 'Safari Version/14' } as any;
            const checker3 = new CompatibilityChecker();
            const config3 = checker3.getBrowserSpecificConfig();
            expect(config3.requiresWorkarounds).toBe(true);
            expect(config3.recommendations).toContain('antialias: false');
        });

        it('should handle high DPI mobile device issues', () => {
            // Mock high DPI mobile device
            global.navigator = {
                userAgent:
                    'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                maxTouchPoints: 0
            } as any;

            // Mock high pixel ratio
            Object.defineProperty(window, 'devicePixelRatio', {
                writable: true,
                value: 3.0
            });

            const checker = new CompatibilityChecker();
            const issues = checker.getCompatibilityIssues();

            expect(issues).toContain('High DPI mobile device may have performance issues');
        });

        it('should handle all compatibility issue conditions', () => {
            // Mock unsupported environment
            global.navigator = { userAgent: 'UnknownBrowser/1.0' } as any;
            global.requestAnimationFrame = undefined as any;

            const mockCanvasNoSupport = {
                getContext: vi.fn(() => null)
            };

            global.document.createElement = vi.fn((tag: string) => {
                if (tag === 'canvas') return mockCanvasNoSupport;
                return {};
            }) as any;

            const checker = new CompatibilityChecker();
            const issues = checker.getCompatibilityIssues();

            expect(issues).toContain('Browser not supported');
            expect(issues).toContain('WebGL not supported');
            expect(issues).toContain('Canvas2D not supported');
            expect(issues).toContain('requestAnimationFrame not supported');

            // Restore
            global.document.createElement = originalCreateElement;
            global.requestAnimationFrame = vi.fn();
        });

        it('should provide workarounds for requestAnimationFrame issues', () => {
            // Mock environment without requestAnimationFrame
            const originalRAF = global.requestAnimationFrame;
            global.requestAnimationFrame = undefined as any;

            const checker = new CompatibilityChecker();
            const issues = checker.getCompatibilityIssues();
            const workarounds = checker.getWorkarounds();

            expect(issues).toContain('requestAnimationFrame not supported');
            expect(workarounds).toContain('Use setTimeout fallback for animation');

            // Restore
            global.requestAnimationFrame = originalRAF;
        });

        it('should provide workarounds for high DPI mobile performance issues', () => {
            // Store originals
            const originalUserAgent = global.navigator.userAgent;

            const originalScreenWidth = global.screen.width;
            const originalScreenHeight = global.screen.height;

            // Mock mobile device with high DPI
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });

            // Mock devicePixelRatio safely with vi.stubGlobal
            vi.stubGlobal('devicePixelRatio', 3.0);

            Object.defineProperty(global.screen, 'width', {
                value: 1125,
                configurable: true
            });
            Object.defineProperty(global.screen, 'height', {
                value: 2436,
                configurable: true
            });

            const checker = new CompatibilityChecker();
            const issues = checker.getCompatibilityIssues();
            const workarounds = checker.getWorkarounds();

            expect(issues).toContain('High DPI mobile device may have performance issues');
            expect(workarounds).toContain('Reduce canvas resolution');
            expect(workarounds).toContain('Disable anti-aliasing');
            expect(workarounds).toContain('Limit particle effects');

            // Restore originals
            Object.defineProperty(global.navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
            // Restore globals
            vi.unstubAllGlobals();
            Object.defineProperty(global.screen, 'width', {
                value: originalScreenWidth,
                configurable: true
            });
            Object.defineProperty(global.screen, 'height', {
                value: originalScreenHeight,
                configurable: true
            });
        });

        it('should generate compatibility report with WebGL unsupported', () => {
            // Mock environment without WebGL support
            const originalCreateElement = global.document.createElement;
            global.document.createElement = vi.fn().mockImplementation((tag: string) => {
                if (tag === 'canvas') {
                    return {
                        getContext: vi.fn().mockReturnValue(null) // WebGL not supported
                    };
                }
                return originalCreateElement.call(global.document, tag);
            }) as any;

            const checker = new CompatibilityChecker();
            const report = checker.generateCompatibilityReport();

            expect(report).toContain('WebGL Support: No');
            expect(report).not.toContain('WebGL Version:');
            expect(report).not.toContain('Renderer:');
            expect(report).not.toContain('Vendor:');

            // Restore
            global.document.createElement = originalCreateElement;
        });

        it('should generate compatibility report with no compatibility issues', () => {
            // Mock perfect compatibility environment
            const originalUserAgent = global.navigator.userAgent;
            const originalCreateElement = global.document.createElement;

            // Modern browser
            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0',
                configurable: true
            });

            // Mock canvas with full support
            global.document.createElement = vi.fn().mockImplementation((tag: string) => {
                if (tag === 'canvas') {
                    return {
                        getContext: vi.fn().mockImplementation((type: string) => {
                            if (type === 'webgl' || type === 'experimental-webgl') {
                                return {
                                    getParameter: vi.fn().mockImplementation((param: number) => {
                                        if (param === 37445) return 'WebGL 2.0'; // VERSION
                                        if (param === 37446) return 'Test Renderer'; // RENDERER
                                        if (param === 37445) return 'Test Vendor'; // VENDOR
                                        return 'Test Value';
                                    }),
                                    getExtension: vi.fn().mockReturnValue(null),
                                    getSupportedExtensions: vi
                                        .fn()
                                        .mockReturnValue(['EXT_texture_filter_anisotropic'])
                                };
                            }
                            if (type === '2d') {
                                return {}; // Canvas2D context
                            }
                            return null;
                        })
                    };
                }
                return originalCreateElement.call(global.document, tag);
            }) as any;

            const checker = new CompatibilityChecker();
            const report = checker.generateCompatibilityReport();

            expect(report).toContain('No compatibility issues detected');

            // Restore
            Object.defineProperty(global.navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
            global.document.createElement = originalCreateElement;
        });

        it('should handle WebGL getSupportedExtensions returning null', () => {
            // Mock WebGL context with getSupportedExtensions returning null
            const mockWebGLContextNullExtensions = {
                getParameter: vi.fn(),
                getExtension: vi.fn(),
                getSupportedExtensions: vi.fn().mockReturnValue(null)
            };

            const mockCanvasNullExt = {
                getContext: vi.fn((type: string) => {
                    if (type === 'webgl2' || type === 'webgl')
                        return mockWebGLContextNullExtensions;
                    return null;
                })
            };

            const originalCreateElement = global.document.createElement;
            global.document.createElement = vi.fn((tag: string) => {
                if (tag === 'canvas') return mockCanvasNullExt;
                return originalCreateElement.call(global.document, tag);
            }) as any;

            const checker = new CompatibilityChecker();
            const extensions = checker.getWebGLExtensions();

            expect(extensions).toEqual([]);

            // Restore
            global.document.createElement = originalCreateElement;
        });

        it('should generate report with tablet device information', () => {
            // Mock tablet environment
            const originalUserAgent = global.navigator.userAgent;

            Object.defineProperty(global.navigator, 'userAgent', {
                value: 'Mozilla/5.0 (iPad; CPU OS 14_6 like Mac OS X) AppleWebKit/605.1.15',
                configurable: true
            });

            const checker = new CompatibilityChecker();
            const report = checker.generateCompatibilityReport();

            expect(report).toContain('Mobile: Yes');
            expect(report).toContain('Tablet: Yes');

            // Restore
            Object.defineProperty(global.navigator, 'userAgent', {
                value: originalUserAgent,
                configurable: true
            });
        });
    });

    // Global cleanup after all CompatibilityChecker tests
    afterAll(() => {
        if (originalCreateElement) {
            global.document.createElement = originalCreateElement;
        }
    });
});

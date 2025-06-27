import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CompatibilityCheckService } from '../services/CompatibilityCheckService.js';
import type {
    BrowserConfig,
    BrowserInfo,
    WebGLSupportInfo
} from '../services/interfaces/ICompatibilityCheckService.js';
import { CompatibilityChecker } from '../utils/CompatibilityChecker.js';

describe('CompatibilityCheckService', () => {
    let compatibilityCheckService: CompatibilityCheckService;
    let mockCompatibilityChecker: CompatibilityChecker;

    beforeEach(() => {
        // Create mock CompatibilityChecker
        mockCompatibilityChecker = {
            checkWebGLSupport: vi.fn(),
            getBrowserInfo: vi.fn(),
            getCompatibilityIssues: vi.fn(),
            getWorkarounds: vi.fn(),
            getBrowserSpecificConfig: vi.fn(),
            generateCompatibilityReport: vi.fn(),
            logCompatibilityReport: vi.fn()
        } as unknown as CompatibilityChecker;

        compatibilityCheckService = new CompatibilityCheckService(mockCompatibilityChecker);
    });

    describe('checkWebGLSupport', () => {
        it('should return WebGL support info from the compatibility checker', () => {
            const mockWebGLInfo: WebGLSupportInfo = {
                isSupported: true,
                version: 2,
                renderer: 'NVIDIA GeForce RTX 3080',
                vendor: 'NVIDIA Corporation'
            };
            vi.mocked(mockCompatibilityChecker.checkWebGLSupport).mockReturnValue(mockWebGLInfo);

            const result = compatibilityCheckService.checkWebGLSupport();

            expect(mockCompatibilityChecker.checkWebGLSupport).toHaveBeenCalledOnce();
            expect(result).toEqual(mockWebGLInfo);
        });
    });

    describe('getBrowserInfo', () => {
        it('should return browser info from the compatibility checker', () => {
            const mockBrowserInfo: BrowserInfo = {
                name: 'Chrome',
                version: '118.0.0.0',
                isSupported: true
            };
            vi.mocked(mockCompatibilityChecker.getBrowserInfo).mockReturnValue(mockBrowserInfo);

            const result = compatibilityCheckService.getBrowserInfo();

            expect(mockCompatibilityChecker.getBrowserInfo).toHaveBeenCalledOnce();
            expect(result).toEqual(mockBrowserInfo);
        });
    });

    describe('getCompatibilityIssues', () => {
        it('should return compatibility issues from the compatibility checker', () => {
            const mockIssues = ['WebGL context lost support missing', 'High DPI scaling issues'];
            vi.mocked(mockCompatibilityChecker.getCompatibilityIssues).mockReturnValue(mockIssues);

            const result = compatibilityCheckService.getCompatibilityIssues();

            expect(mockCompatibilityChecker.getCompatibilityIssues).toHaveBeenCalledOnce();
            expect(result).toEqual(mockIssues);
        });
    });

    describe('getCompatibilityWorkarounds', () => {
        it('should return workarounds from the compatibility checker', () => {
            const mockWorkarounds = ['Enable hardware acceleration', 'Update graphics drivers'];
            vi.mocked(mockCompatibilityChecker.getWorkarounds).mockReturnValue(mockWorkarounds);

            const result = compatibilityCheckService.getCompatibilityWorkarounds();

            expect(mockCompatibilityChecker.getWorkarounds).toHaveBeenCalledOnce();
            expect(result).toEqual(mockWorkarounds);
        });
    });

    describe('getBrowserSpecificConfig', () => {
        it('should return browser config from the compatibility checker', () => {
            const mockConfig: BrowserConfig = {
                requiresWorkarounds: false,
                recommendations: ['Enable GPU acceleration', 'Use texture pooling']
            };
            vi.mocked(mockCompatibilityChecker.getBrowserSpecificConfig).mockReturnValue(
                mockConfig
            );

            const result = compatibilityCheckService.getBrowserSpecificConfig();

            expect(mockCompatibilityChecker.getBrowserSpecificConfig).toHaveBeenCalledOnce();
            expect(result).toEqual(mockConfig);
        });
    });

    describe('generateReport', () => {
        it('should return report from the compatibility checker', () => {
            const mockReport = 'Compatibility Report: Chrome 118, WebGL 2.0 supported';
            vi.mocked(mockCompatibilityChecker.generateCompatibilityReport).mockReturnValue(
                mockReport
            );

            const result = compatibilityCheckService.generateReport();

            expect(mockCompatibilityChecker.generateCompatibilityReport).toHaveBeenCalledOnce();
            expect(result).toBe(mockReport);
        });
    });

    describe('logReport', () => {
        it('should call logCompatibilityReport on the compatibility checker', () => {
            compatibilityCheckService.logReport();

            expect(mockCompatibilityChecker.logCompatibilityReport).toHaveBeenCalledOnce();
        });
    });

    describe('constructor dependency injection', () => {
        it('should accept CompatibilityChecker dependency through constructor', () => {
            const customChecker = new CompatibilityChecker();
            const service = new CompatibilityCheckService(customChecker);

            expect(service).toBeDefined();
            expect(service).toBeInstanceOf(CompatibilityCheckService);
        });
    });
});

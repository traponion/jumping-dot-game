import type { CompatibilityChecker } from '../utils/CompatibilityChecker.js';
import type {
    BrowserConfig,
    BrowserInfo,
    ICompatibilityCheckService,
    WebGLSupportInfo
} from './interfaces/ICompatibilityCheckService.js';

/**
 * Service wrapper for CompatibilityChecker utility
 * Implements compatibility checking operations following SOLID principles
 */
export class CompatibilityCheckService implements ICompatibilityCheckService {
    constructor(private compatibilityChecker: CompatibilityChecker) {}

    /**
     * Check WebGL support information
     */
    checkWebGLSupport(): WebGLSupportInfo {
        return this.compatibilityChecker.checkWebGLSupport();
    }

    /**
     * Get browser information
     */
    getBrowserInfo(): BrowserInfo {
        return this.compatibilityChecker.getBrowserInfo();
    }

    /**
     * Get compatibility issues
     */
    getCompatibilityIssues(): string[] {
        return this.compatibilityChecker.getCompatibilityIssues();
    }

    /**
     * Get compatibility workarounds
     */
    getCompatibilityWorkarounds(): string[] {
        return this.compatibilityChecker.getWorkarounds();
    }

    /**
     * Get browser-specific configuration
     */
    getBrowserSpecificConfig(): BrowserConfig {
        return this.compatibilityChecker.getBrowserSpecificConfig();
    }

    /**
     * Generate compatibility report
     */
    generateReport(): string {
        return this.compatibilityChecker.generateCompatibilityReport();
    }

    /**
     * Log compatibility report to console
     */
    logReport(): void {
        this.compatibilityChecker.logCompatibilityReport();
    }
}

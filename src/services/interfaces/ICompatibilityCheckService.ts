/**
 * Interface for compatibility checking service operations
 */
export interface ICompatibilityCheckService {
    /**
     * Check WebGL support information
     */
    checkWebGLSupport(): WebGLSupportInfo;

    /**
     * Get browser information
     */
    getBrowserInfo(): BrowserInfo;

    /**
     * Get compatibility issues
     */
    getCompatibilityIssues(): string[];

    /**
     * Get compatibility workarounds
     */
    getCompatibilityWorkarounds(): string[];

    /**
     * Get browser-specific configuration
     */
    getBrowserSpecificConfig(): BrowserConfig;

    /**
     * Generate compatibility report
     */
    generateReport(): string;

    /**
     * Log compatibility report to console
     */
    logReport(): void;
}

/**
 * WebGL support information
 */
export interface WebGLSupportInfo {
    isSupported: boolean;
    version: number;
    renderer?: string;
    vendor?: string;
}

/**
 * Browser information
 */
export interface BrowserInfo {
    name: string;
    version: string;
    isSupported: boolean;
}

/**
 * Browser-specific configuration
 */
export interface BrowserConfig {
    requiresWorkarounds: boolean;
    recommendations: string[];
}

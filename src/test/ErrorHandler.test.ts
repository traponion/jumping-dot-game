// ErrorHandler unit tests - Game error handling
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ConsoleErrorReporter,
    ErrorHandler,
    type ErrorReporter,
    UIErrorReporter
} from '../utils/ErrorHandler.js';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;

    beforeEach(() => {
        // Get fresh instance for each test
        errorHandler = ErrorHandler.getInstance();
        errorHandler.clearReporters();
    });

    afterEach(() => {
        // Clean up after each test
        errorHandler.clearReporters();
        // Reset singleton for testing
        (ErrorHandler as any).instance = undefined;
    });

    describe('Singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ErrorHandler.getInstance();
            const instance2 = ErrorHandler.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('Reporter management', () => {
        it('should add and remove reporters', () => {
            const mockReporter: ErrorReporter = {
                reportError: vi.fn()
            };

            errorHandler.addReporter(mockReporter);
            errorHandler.reportError(new Error('Test error'));
            expect(mockReporter.reportError).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Test error' })
            );

            errorHandler.removeReporter(mockReporter);
            (mockReporter.reportError as any).mockClear();
            errorHandler.reportError(new Error('Another error'));
            expect(mockReporter.reportError).not.toHaveBeenCalled();
        });

        it('should clear all reporters', () => {
            const mockReporter1: ErrorReporter = { reportError: vi.fn() };
            const mockReporter2: ErrorReporter = { reportError: vi.fn() };

            errorHandler.addReporter(mockReporter1);
            errorHandler.addReporter(mockReporter2);
            errorHandler.clearReporters();

            errorHandler.reportError(new Error('Test error'));
            expect(mockReporter1.reportError).not.toHaveBeenCalled();
            expect(mockReporter2.reportError).not.toHaveBeenCalled();
        });
    });

    describe('Error reporting', () => {
        it('should report errors to all reporters', () => {
            const mockReporter1: ErrorReporter = { reportError: vi.fn() };
            const mockReporter2: ErrorReporter = { reportError: vi.fn() };

            errorHandler.addReporter(mockReporter1);
            errorHandler.addReporter(mockReporter2);

            const testError = new Error('Test error message');
            errorHandler.reportError(testError);

            expect(mockReporter1.reportError).toHaveBeenCalledWith(testError);
            expect(mockReporter2.reportError).toHaveBeenCalledWith(testError);
        });
    });
});

describe('ConsoleErrorReporter', () => {
    it('should log error to console', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const reporter = new ConsoleErrorReporter();
        const testError = new Error('Test console error');

        reporter.reportError(testError);

        expect(consoleSpy).toHaveBeenCalledWith('Error:', 'Test console error');
        consoleSpy.mockRestore();
    });
});

describe('UIErrorReporter', () => {
    it('should log error to console as fallback', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const reporter = new UIErrorReporter();
        const testError = new Error('Test UI error');

        reporter.reportError(testError);

        expect(consoleSpy).toHaveBeenCalledWith('UI Error:', 'Test UI error');
        consoleSpy.mockRestore();
    });
});

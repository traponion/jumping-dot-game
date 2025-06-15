// ErrorHandler unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorHandler, type ErrorReporter } from '../utils/ErrorHandler.js';
import { EditorError, ERROR_CODES, ERROR_TYPES } from '../types/EditorTypes.js';

describe('ErrorHandler', () => {
    let errorHandler: ErrorHandler;
    let mockReporter: ErrorReporter;

    beforeEach(() => {
        // Clear any existing instance
        (ErrorHandler as any).instance = undefined;
        
        errorHandler = ErrorHandler.getInstance();
        
        mockReporter = {
            reportError: vi.fn(),
            reportWarning: vi.fn(),
            reportInfo: vi.fn()
        };
        
        errorHandler.addReporter(mockReporter);
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const instance1 = ErrorHandler.getInstance();
            const instance2 = ErrorHandler.getInstance();
            
            expect(instance1).toBe(instance2);
        });
    });

    describe('Error Handling', () => {
        it('should handle EditorError correctly', () => {
            const error = new EditorError(
                'Test error',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC,
                { details: 'test' }
            );
            
            errorHandler.handleError(error);
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(error);
        });

        it('should handle regular Error objects', () => {
            const error = new Error('Regular error');
            
            errorHandler.handleError(error);
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Regular error',
                    code: ERROR_CODES.UNKNOWN_ERROR,
                    type: ERROR_TYPES.SYSTEM
                })
            );
        });

        it('should handle string errors', () => {
            const errorMessage = 'String error message';
            
            errorHandler.handleError(errorMessage as any);
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.objectContaining({
                        originalError: errorMessage
                    })
                })
            );
        });
    });

    describe('Error Statistics', () => {
        it('should track error statistics', () => {
            const error1 = new EditorError(
                'Error 1',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            const error2 = new EditorError(
                'Error 2',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.VALIDATION
            );
            
            errorHandler.handleError(error1);
            errorHandler.handleError(error2);
            
            const stats = errorHandler.getStatistics();
            
            expect(stats.totalErrors).toBe(2);
            expect(stats.errorsByType[ERROR_TYPES.FABRIC]).toBe(1);
            expect(stats.errorsByType[ERROR_TYPES.VALIDATION]).toBe(1);
            expect(stats.lastError).toBe(error2);
        });

        it('should reset statistics', () => {
            const error = new EditorError(
                'Test error',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            
            errorHandler.handleError(error);
            errorHandler.resetStatistics();
            
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(0);
        });
    });

    describe('Error Filtering', () => {
        it('should filter errors based on custom filters', () => {
            // Add filter that only allows fabric errors
            errorHandler.addFilter((error) => 
                error.type === ERROR_TYPES.FABRIC
            );
            
            const fabricError = new EditorError(
                'Fabric error',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            const validationError = new EditorError(
                'Validation error',
                ERROR_CODES.STAGE_VALIDATION_FAILED,
                ERROR_TYPES.VALIDATION
            );
            
            errorHandler.handleError(fabricError);
            errorHandler.handleError(validationError);
            
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(1);
            expect(stats.errorsByType[ERROR_TYPES.FABRIC]).toBe(1);
            expect(stats.errorsByType[ERROR_TYPES.VALIDATION]).toBe(0);
        });

        it('should remove error filters', () => {
            const filter = (error: EditorError) => error.type === ERROR_TYPES.FABRIC;
            
            errorHandler.addFilter(filter);
            errorHandler.removeFilter(filter);
            
            const validationError = new EditorError(
                'Validation error',
                ERROR_CODES.STAGE_VALIDATION_FAILED,
                ERROR_TYPES.VALIDATION
            );
            
            errorHandler.handleError(validationError);
            
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(1);
        });
    });

    describe('Reporter Management', () => {
        it('should add and remove reporters', () => {
            const anotherReporter: ErrorReporter = {
                reportError: vi.fn(),
                reportWarning: vi.fn(),
                reportInfo: vi.fn()
            };
            
            errorHandler.addReporter(anotherReporter);
            
            const error = new EditorError(
                'Test error',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            
            errorHandler.handleError(error);
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(error);
            expect(anotherReporter.reportError).toHaveBeenCalledWith(error);
            
            // Remove one reporter
            errorHandler.removeReporter(anotherReporter);
            
            const error2 = new EditorError(
                'Test error 2',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC
            );
            
            errorHandler.handleError(error2);
            
            expect(mockReporter.reportError).toHaveBeenCalledTimes(2);
            expect(anotherReporter.reportError).toHaveBeenCalledTimes(1);
        });
    });


    describe('Error History', () => {
        it('should maintain error history', () => {
            const error1 = new EditorError(
                'Error 1',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            const error2 = new EditorError(
                'Error 2',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.VALIDATION
            );
            
            errorHandler.handleError(error1);
            errorHandler.handleError(error2);
            
            const history = errorHandler.getErrorHistory();
            expect(history).toHaveLength(2);
            expect(history[0]).toBe(error1);
            expect(history[1]).toBe(error2);
        });

    });
});
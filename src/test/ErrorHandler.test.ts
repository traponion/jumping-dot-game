// ErrorHandler unit tests
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
    ErrorHandler, 
    type ErrorReporter, 
    ConsoleErrorReporter,
    UIErrorReporter 
} from '../utils/ErrorHandler.js';
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

        it('should get errors by type', () => {
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
            
            const fabricErrors = errorHandler.getErrorsByType(ERROR_TYPES.FABRIC);
            const validationErrors = errorHandler.getErrorsByType(ERROR_TYPES.VALIDATION);
            
            expect(fabricErrors).toHaveLength(1);
            expect(fabricErrors[0]).toBe(fabricError);
            expect(validationErrors).toHaveLength(1);
            expect(validationErrors[0]).toBe(validationError);
        });

        it('should get last error', () => {
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
            
            expect(errorHandler.getLastError()).toBeUndefined();
            
            errorHandler.handleError(error1);
            expect(errorHandler.getLastError()).toBe(error1);
            
            errorHandler.handleError(error2);
            expect(errorHandler.getLastError()).toBe(error2);
        });

        it('should get frequent error codes', () => {
            const error1 = new EditorError(
                'Error 1',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            const error2 = new EditorError(
                'Error 2',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            const error3 = new EditorError(
                'Error 3',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.VALIDATION
            );
            
            errorHandler.handleError(error1);
            errorHandler.handleError(error2);
            errorHandler.handleError(error3);
            
            const frequentCodes = errorHandler.getFrequentErrorCodes(2);
            
            expect(frequentCodes).toHaveLength(2);
            expect(frequentCodes[0]).toEqual({
                code: ERROR_CODES.CANVAS_INIT_FAILED,
                count: 2
            });
            expect(frequentCodes[1]).toEqual({
                code: ERROR_CODES.OBJECT_CREATION_FAILED,
                count: 1
            });
        });
    });

    describe('Batch Error Handling', () => {
        it('should handle multiple errors', () => {
            const errors = [
                new EditorError('Error 1', ERROR_CODES.CANVAS_INIT_FAILED, ERROR_TYPES.FABRIC),
                new Error('Regular error'),
                new EditorError('Error 3', ERROR_CODES.STAGE_VALIDATION_FAILED, ERROR_TYPES.VALIDATION)
            ];
            
            errorHandler.handleErrors(errors);
            
            expect(mockReporter.reportError).toHaveBeenCalledTimes(3);
            
            const stats = errorHandler.getStatistics();
            expect(stats.totalErrors).toBe(3);
        });
    });

    describe('Safe Execution', () => {
        it('should execute function safely and return result', () => {
            const successfulFunction = () => 'success result';
            
            const result = errorHandler.safeExecuteSync(
                successfulFunction,
                'default result'
            );
            
            expect(result).toBe('success result');
        });

        it('should handle function errors and return default', () => {
            const errorFunction = () => {
                throw new Error('Test error');
            };
            
            const result = errorHandler.safeExecuteSync(
                errorFunction,
                'default result'
            );
            
            expect(result).toBe('default result');
            expect(mockReporter.reportError).toHaveBeenCalled();
        });

        it('should execute async function safely', async () => {
            const asyncFunction = async () => 'async success';
            
            const result = await errorHandler.safeExecute(
                asyncFunction,
                'default result'
            );
            
            expect(result).toBe('async success');
        });

        it('should handle async function errors', async () => {
            const asyncErrorFunction = async () => {
                throw new Error('Async test error');
            };
            
            const result = await errorHandler.safeExecute(
                asyncErrorFunction,
                'default result'
            );
            
            expect(result).toBe('default result');
            expect(mockReporter.reportError).toHaveBeenCalled();
        });
    });

    describe('Static Factory Methods', () => {
        it('should create validation errors', () => {
            const error = ErrorHandler.createValidationError('Invalid data', { field: 'name' });
            
            expect(error.type).toBe(ERROR_TYPES.VALIDATION);
            expect(error.message).toBe('Invalid data');
            expect(error.details).toEqual({ field: 'name' });
        });

        it('should create DOM errors', () => {
            const error = ErrorHandler.createDOMError('Element not found', 'my-element');
            
            expect(error.type).toBe(ERROR_TYPES.DOM);
            expect(error.message).toBe('Element not found');
            expect(error.details).toEqual({ elementId: 'my-element' });
        });

        it('should create Fabric errors', () => {
            const error = ErrorHandler.createFabricError('Canvas error', { width: 800 });
            
            expect(error.type).toBe(ERROR_TYPES.FABRIC);
            expect(error.message).toBe('Canvas error');
            expect(error.details).toEqual({ width: 800 });
        });

        it('should create IO errors', () => {
            const error = ErrorHandler.createIOError('File not found', { path: '/test.json' });
            
            expect(error.type).toBe(ERROR_TYPES.IO);
            expect(error.message).toBe('File not found');
            expect(error.details).toEqual({ path: '/test.json' });
        });

        it('should create performance errors', () => {
            const error = ErrorHandler.createPerformanceError('Slow operation', { duration: 5000 });
            
            expect(error.type).toBe(ERROR_TYPES.PERFORMANCE);
            expect(error.message).toBe('Slow operation');
            expect(error.details).toEqual({ duration: 5000 });
        });
    });

    describe('ErrorFilter Management', () => {
        it('should add and use error filters', () => {
            const filter = (error: EditorError) => error.type !== ERROR_TYPES.FABRIC;
            errorHandler.addFilter(filter);
            
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
            
            // Only validation error should be reported (fabric error filtered out)
            expect(mockReporter.reportError).toHaveBeenCalledTimes(1);
            expect(mockReporter.reportError).toHaveBeenCalledWith(validationError);
        });

        it('should remove error filters', () => {
            const filter = (error: EditorError) => error.type !== ERROR_TYPES.FABRIC;
            errorHandler.addFilter(filter);
            errorHandler.removeFilter(filter);
            
            const fabricError = new EditorError(
                'Fabric error',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC
            );
            
            errorHandler.handleError(fabricError);
            
            // Filter removed, so error should be reported
            expect(mockReporter.reportError).toHaveBeenCalledWith(fabricError);
        });

        it('should handle removing non-existent filter gracefully', () => {
            const filter = (error: EditorError) => error.type !== ERROR_TYPES.FABRIC;
            
            // Should not throw error when removing non-existent filter
            expect(() => {
                errorHandler.removeFilter(filter);
            }).not.toThrow();
        });
    });

    describe('Safe Execute with Context', () => {
        it('should add context to sync errors', () => {
            const errorFunction = () => {
                throw new Error('Test error');
            };
            
            errorHandler.safeExecuteSync(
                errorFunction,
                'default',
                'test context'
            );
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.objectContaining({
                        context: 'test context'
                    })
                })
            );
        });

        it('should add context to async errors', async () => {
            const asyncErrorFunction = async () => {
                throw new Error('Async test error');
            };
            
            await errorHandler.safeExecute(
                asyncErrorFunction,
                'default',
                'async context'
            );
            
            expect(mockReporter.reportError).toHaveBeenCalledWith(
                expect.objectContaining({
                    details: expect.objectContaining({
                        context: 'async context'
                    })
                })
            );
        });
    });
});

describe('ConsoleErrorReporter', () => {
    let consoleErrorReporter: ConsoleErrorReporter;
    let consoleSpy: any;
    let consoleWarnSpy: any;
    let consoleInfoSpy: any;

    beforeEach(() => {
        consoleErrorReporter = new ConsoleErrorReporter();
        consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleSpy.mockRestore();
        consoleWarnSpy.mockRestore();
        consoleInfoSpy.mockRestore();
    });

    it('should report error to console', () => {
        const error = new EditorError(
            'Test error',
            ERROR_CODES.CANVAS_INIT_FAILED,
            ERROR_TYPES.FABRIC,
            { test: 'details' }
        );
        
        consoleErrorReporter.reportError(error);
        
        expect(consoleSpy).toHaveBeenCalledWith(
            expect.stringContaining('🚨'),
            error.getDetails()
        );
    });

    it('should report warning to console with details', () => {
        consoleErrorReporter.reportWarning('Test warning', { detail: 'value' });
        
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            '⚠️ Test warning',
            { detail: 'value' }
        );
    });

    it('should report warning to console without details', () => {
        consoleErrorReporter.reportWarning('Test warning');
        
        expect(consoleWarnSpy).toHaveBeenCalledWith('⚠️ Test warning');
    });

    it('should report info to console with details', () => {
        consoleErrorReporter.reportInfo('Test info', { detail: 'value' });
        
        expect(consoleInfoSpy).toHaveBeenCalledWith(
            'ℹ️ Test info',
            { detail: 'value' }
        );
    });

    it('should report info to console without details', () => {
        consoleErrorReporter.reportInfo('Test info');
        
        expect(consoleInfoSpy).toHaveBeenCalledWith('ℹ️ Test info');
    });
});

describe('UIErrorReporter', () => {
    let uiErrorReporter: UIErrorReporter;
    let mockShowMessage: any;

    beforeEach(() => {
        mockShowMessage = vi.fn();
        uiErrorReporter = new UIErrorReporter(mockShowMessage);
    });

    it('should report error to UI', () => {
        const error = new EditorError(
            'Test error',
            ERROR_CODES.CANVAS_INIT_FAILED,
            ERROR_TYPES.FABRIC
        );
        
        uiErrorReporter.reportError(error);
        
        expect(mockShowMessage).toHaveBeenCalledWith(
            error.getUserMessage(),
            'error'
        );
    });

    it('should report warning to UI', () => {
        uiErrorReporter.reportWarning('Test warning', { detail: 'value' });
        
        expect(mockShowMessage).toHaveBeenCalledWith('Test warning', 'warning');
    });

    it('should report info to UI', () => {
        uiErrorReporter.reportInfo('Test info', { detail: 'value' });
        
        expect(mockShowMessage).toHaveBeenCalledWith('Test info', 'info');
    });
});
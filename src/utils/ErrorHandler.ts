// ErrorHandler - Game error handling utility
// Basic error handling functionality only

/**
 * Simple error reporter interface
 */
export interface ErrorReporter {
    reportError(error: Error): void;
}

/**
 * Console error reporter - logs errors to console
 */
export class ConsoleErrorReporter implements ErrorReporter {
    reportError(error: Error): void {
        console.error('Error:', error.message);
    }
}

/**
 * UI error reporter - shows errors in UI
 */
export class UIErrorReporter implements ErrorReporter {
    reportError(error: Error): void {
        // Simple alert fallback for game errors
        console.warn('UI Error:', error.message);
    }
}

/**
 * Game ErrorHandler for unified error management
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private reporters: ErrorReporter[] = [];

    private constructor() {
        this.reporters.push(new ConsoleErrorReporter());
    }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    addReporter(reporter: ErrorReporter): void {
        this.reporters.push(reporter);
    }

    removeReporter(reporter: ErrorReporter): void {
        const index = this.reporters.indexOf(reporter);
        if (index > -1) {
            this.reporters.splice(index, 1);
        }
    }

    reportError(error: Error): void {
        for (const reporter of this.reporters) {
            reporter.reportError(error);
        }
    }

    clearReporters(): void {
        this.reporters = [];
    }
}

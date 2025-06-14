// エラーハンドリングとレポーティングの統一管理
import {
    EditorError,
    ERROR_TYPES,
    ERROR_CODES,
    type ErrorType,
    type ErrorCode
} from '../types/EditorTypes.js';
import { DebugHelper } from './EditorUtils.js';

/**
 * エラーレポーターインターフェース
 */
export interface ErrorReporter {
    reportError(error: EditorError): void;
    reportWarning(message: string, details?: any): void;
    reportInfo(message: string, details?: any): void;
}

/**
 * エラー統計情報の型定義
 */
export interface ErrorStatistics {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsByCode: Record<ErrorCode, number>;
    recoverableErrors: number;
    nonRecoverableErrors: number;
    lastError?: EditorError;
    averageErrorsPerSession: number;
}

/**
 * エラーフィルター関数の型定義
 */
export type ErrorFilter = (error: EditorError) => boolean;

/**
 * 統一的なエラーハンドリングマネージャー
 * - エラーの分類と処理
 * - エラー統計の収集
 * - ユーザー向けフィードバック
 * - 開発者向けレポーティング
 */
export class ErrorHandler {
    private static instance: ErrorHandler;
    private reporters: ErrorReporter[] = [];
    private errorHistory: EditorError[] = [];
    private errorFilters: ErrorFilter[] = [];
    private maxHistorySize = 100;
    private sessionStartTime = Date.now();
    
    // エラー統計
    private statistics: ErrorStatistics = {
        totalErrors: 0,
        errorsByType: {} as Record<ErrorType, number>,
        errorsByCode: {} as Record<ErrorCode, number>,
        recoverableErrors: 0,
        nonRecoverableErrors: 0,
        averageErrorsPerSession: 0
    };

    private constructor() {
        this.initializeStatistics();
        DebugHelper.log('ErrorHandler initialized');
    }

    /**
     * シングルトンインスタンスを取得
     */
    public static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    // === エラー作成ユーティリティ ===

    /**
     * EditorErrorを作成
     */
    public static createError(
        message: string,
        code: ErrorCode,
        type: ErrorType = ERROR_TYPES.SYSTEM,
        details?: any,
        recoverable: boolean = true
    ): EditorError {
        return new EditorError(message, code, type, details, recoverable);
    }

    /**
     * Validationエラーを作成
     */
    public static createValidationError(message: string, details?: any): EditorError {
        return new EditorError(
            message,
            ERROR_CODES.INVALID_INPUT,
            ERROR_TYPES.VALIDATION,
            details,
            true
        );
    }

    /**
     * DOMエラーを作成
     */
    public static createDOMError(message: string, elementId?: string): EditorError {
        return new EditorError(
            message,
            ERROR_CODES.DOM_ELEMENT_NOT_FOUND,
            ERROR_TYPES.DOM,
            { elementId },
            true
        );
    }

    /**
     * Fabricエラーを作成
     */
    public static createFabricError(message: string, details?: any): EditorError {
        return new EditorError(
            message,
            ERROR_CODES.CANVAS_RENDER_FAILED,
            ERROR_TYPES.FABRIC,
            details,
            true
        );
    }

    /**
     * IOエラーを作成
     */
    public static createIOError(message: string, details?: any): EditorError {
        return new EditorError(
            message,
            ERROR_CODES.STAGE_LOAD_FAILED,
            ERROR_TYPES.IO,
            details,
            true
        );
    }

    /**
     * パフォーマンスエラーを作成
     */
    public static createPerformanceError(message: string, details?: any): EditorError {
        return new EditorError(
            message,
            ERROR_CODES.MEMORY_LIMIT_EXCEEDED,
            ERROR_TYPES.PERFORMANCE,
            details,
            false // パフォーマンス問題は通常リカバリ困難
        );
    }

    // === エラー処理 ===

    /**
     * エラーを処理
     */
    public handleError(error: Error | EditorError): void {
        const editorError = this.normalizeError(error);
        
        // フィルターチェック
        if (!this.passesFilters(editorError)) {
            return;
        }

        // 履歴に追加
        this.addToHistory(editorError);
        
        // 統計を更新
        this.updateStatistics(editorError);
        
        // レポーターに通知
        this.notifyReporters(editorError);
        
        // 開発者ログ
        DebugHelper.log('Error handled', editorError.getDetails());
    }

    /**
     * 複数のエラーを一括処理
     */
    public handleErrors(errors: (Error | EditorError)[]): void {
        errors.forEach(error => this.handleError(error));
    }

    /**
     * try-catchヘルパー関数
     */
    public async safeExecute<T>(
        operation: () => Promise<T> | T,
        fallback?: T,
        errorContext?: string
    ): Promise<T | undefined> {
        try {
            const result = await operation();
            return result;
        } catch (error) {
            const editorError = this.normalizeError(error as Error);
            if (errorContext) {
                // 新しいEditorErrorを作成してcontextを追加
                const errorWithContext = new EditorError(
                    editorError.message,
                    editorError.code,
                    editorError.type,
                    { ...editorError.details, context: errorContext },
                    editorError.recoverable
                );
                this.handleError(errorWithContext);
            } else {
                this.handleError(editorError);
            }
            return fallback;
        }
    }

    /**
     * 同期版のsafeExecute
     */
    public safeExecuteSync<T>(
        operation: () => T,
        fallback?: T,
        errorContext?: string
    ): T | undefined {
        try {
            return operation();
        } catch (error) {
            const editorError = this.normalizeError(error as Error);
            if (errorContext) {
                // 新しいEditorErrorを作成してcontextを追加
                const errorWithContext = new EditorError(
                    editorError.message,
                    editorError.code,
                    editorError.type,
                    { ...editorError.details, context: errorContext },
                    editorError.recoverable
                );
                this.handleError(errorWithContext);
            } else {
                this.handleError(editorError);
            }
            return fallback;
        }
    }

    // === レポーター管理 ===

    /**
     * エラーレポーターを追加
     */
    public addReporter(reporter: ErrorReporter): void {
        this.reporters.push(reporter);
        DebugHelper.log('Error reporter added', { reporterCount: this.reporters.length });
    }

    /**
     * エラーレポーターを削除
     */
    public removeReporter(reporter: ErrorReporter): void {
        const index = this.reporters.indexOf(reporter);
        if (index > -1) {
            this.reporters.splice(index, 1);
            DebugHelper.log('Error reporter removed', { reporterCount: this.reporters.length });
        }
    }

    // === フィルター管理 ===

    /**
     * エラーフィルターを追加
     */
    public addFilter(filter: ErrorFilter): void {
        this.errorFilters.push(filter);
    }

    /**
     * エラーフィルターを削除
     */
    public removeFilter(filter: ErrorFilter): void {
        const index = this.errorFilters.indexOf(filter);
        if (index > -1) {
            this.errorFilters.splice(index, 1);
        }
    }

    // === 統計とレポート ===

    /**
     * エラー統計を取得
     */
    public getStatistics(): ErrorStatistics {
        const sessionDuration = (Date.now() - this.sessionStartTime) / (1000 * 60); // 分
        return {
            ...this.statistics,
            averageErrorsPerSession: sessionDuration > 0 ? 
                this.statistics.totalErrors / (sessionDuration / 60) : 0
        };
    }

    /**
     * エラー履歴を取得
     */
    public getErrorHistory(): EditorError[] {
        return [...this.errorHistory];
    }

    /**
     * 指定タイプのエラー履歴を取得
     */
    public getErrorsByType(type: ErrorType): EditorError[] {
        return this.errorHistory.filter(error => error.type === type);
    }

    /**
     * 最新のエラーを取得
     */
    public getLastError(): EditorError | undefined {
        return this.errorHistory[this.errorHistory.length - 1];
    }

    /**
     * エラー率の高いコードを取得
     */
    public getFrequentErrorCodes(limit: number = 5): Array<{ code: ErrorCode; count: number }> {
        return Object.entries(this.statistics.errorsByCode)
            .map(([code, count]) => ({ code: code as ErrorCode, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    }

    /**
     * 統計をリセット
     */
    public resetStatistics(): void {
        this.initializeStatistics();
        this.errorHistory = [];
        this.sessionStartTime = Date.now();
        DebugHelper.log('Error statistics reset');
    }

    // === プライベートメソッド ===

    /**
     * エラーを正規化
     */
    private normalizeError(error: Error | EditorError): EditorError {
        if (error instanceof EditorError) {
            return error;
        }
        
        return new EditorError(
            error.message || 'Unknown error',
            ERROR_CODES.UNKNOWN_ERROR,
            ERROR_TYPES.SYSTEM,
            { originalError: error },
            true
        );
    }

    /**
     * フィルターを通過するかチェック
     */
    private passesFilters(error: EditorError): boolean {
        return this.errorFilters.every(filter => filter(error));
    }

    /**
     * エラー履歴に追加
     */
    private addToHistory(error: EditorError): void {
        this.errorHistory.push(error);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * 統計を更新
     */
    private updateStatistics(error: EditorError): void {
        this.statistics.totalErrors++;
        this.statistics.errorsByType[error.type] = (this.statistics.errorsByType[error.type] || 0) + 1;
        this.statistics.errorsByCode[error.code] = (this.statistics.errorsByCode[error.code] || 0) + 1;
        
        if (error.isRecoverable()) {
            this.statistics.recoverableErrors++;
        } else {
            this.statistics.nonRecoverableErrors++;
        }
        
        this.statistics.lastError = error;
    }

    /**
     * レポーターに通知
     */
    private notifyReporters(error: EditorError): void {
        this.reporters.forEach(reporter => {
            try {
                reporter.reportError(error);
            } catch (reporterError) {
                // レポーター自体のエラーは無限ループを避けるためログのみ
                DebugHelper.log('Error in error reporter', reporterError);
            }
        });
    }

    /**
     * 統計を初期化
     */
    private initializeStatistics(): void {
        this.statistics = {
            totalErrors: 0,
            errorsByType: Object.fromEntries(
                Object.values(ERROR_TYPES).map(type => [type, 0])
            ) as Record<ErrorType, number>,
            errorsByCode: Object.fromEntries(
                Object.values(ERROR_CODES).map(code => [code, 0])
            ) as Record<ErrorCode, number>,
            recoverableErrors: 0,
            nonRecoverableErrors: 0,
            averageErrorsPerSession: 0
        };
    }
}

/**
 * デフォルトのコンソールエラーレポーター
 */
export class ConsoleErrorReporter implements ErrorReporter {
    public reportError(error: EditorError): void {
        console.error(`🚨 ${error.getDeveloperMessage()}`, error.getDetails());
    }

    public reportWarning(message: string, details?: any): void {
        if (details) {
            console.warn(`⚠️ ${message}`, details);
        } else {
            console.warn(`⚠️ ${message}`);
        }
    }

    public reportInfo(message: string, details?: any): void {
        if (details) {
            console.info(`ℹ️ ${message}`, details);
        } else {
            console.info(`ℹ️ ${message}`);
        }
    }
}

/**
 * UI表示用エラーレポーター
 */
export class UIErrorReporter implements ErrorReporter {
    constructor(private showMessage: (message: string, type: 'error' | 'warning' | 'info') => void) {}

    public reportError(error: EditorError): void {
        this.showMessage(error.getUserMessage(), 'error');
    }

    public reportWarning(message: string, _details?: any): void {
        this.showMessage(message, 'warning');
    }

    public reportInfo(message: string, _details?: any): void {
        this.showMessage(message, 'info');
    }
}

// グローバルエラーハンドラーインスタンス
export const globalErrorHandler = ErrorHandler.getInstance();

// デフォルトでコンソールレポーターを追加
globalErrorHandler.addReporter(new ConsoleErrorReporter());
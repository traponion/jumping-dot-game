/**
 * @fileoverview Stage editor main entry point with MVC architecture integration
 * @module editor
 * @description Application Layer - Main entry point for the stage editor application.
 * Implements MVC pattern with comprehensive error handling and lifecycle management.
 */

import { EditorController } from './controllers/EditorController.js';
import { EditorControllerBuilder } from './controllers/EditorControllerBuilder.js';
import { EditorModel } from './models/EditorModel.js';
import { ERROR_CODES, ERROR_TYPES, EditorError } from './types/EditorTypes.js';
import { DOMHelper, DebugHelper } from './utils/EditorUtils.js';
import { globalErrorHandler } from './utils/ErrorHandler.js';
import { EditorView } from './views/EditorView.js';

/**
 * Main editor application class
 * @class EditorApplication 
 * @description Integrates MVC components for stage editor functionality.
 * Manages application lifecycle, error handling, and component coordination.
 */
class EditorApplication {
    /** @private {EditorController} MVC Controller component */
    private controller!: EditorController;
    /** @private {EditorView} MVC View component */
    private view!: EditorView;
    /** @private {EditorModel} MVC Model component */
    private model!: EditorModel;
    /** @private {HTMLCanvasElement} Main editor canvas element */
    private canvas!: HTMLCanvasElement;

    /**
     * Creates a new EditorApplication instance
     * @constructor
     * @description Initializes the editor application with error handling
     */
    constructor() {
        DebugHelper.log('Initializing Editor Application...');
        this.initialize().catch((error) => {
            globalErrorHandler.handleError(error);
            console.error('❌ Failed to initialize Editor Application:', error);
        });
    }

    /**
     * Initialize the editor application
     * @private
     * @async
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     * @description Sets up canvas, MVC components, and error handling
     */
    private async initialize(): Promise<void> {
        try {
            // 1. キャンバス要素を取得
            this.canvas = DOMHelper.getRequiredElement<HTMLCanvasElement>('editorCanvas');
            DebugHelper.log('Canvas element found', {
                width: this.canvas.width,
                height: this.canvas.height
            });

            // 2. MVCコンポーネントを初期化
            this.initializeMVCComponents();

            // 3. コントローラーを初期化（非同期）
            await this.controller.initialize();

            // 4. エラーハンドラーを設定
            this.setupGlobalErrorHandling();

            // 5. 初期化完了
            DebugHelper.log('Editor Application initialized successfully');
            this.showSuccessMessage('🎮 Stage Editor ready!');
        } catch (error) {
            const editorError = new EditorError(
                'Failed to initialize editor application',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.SYSTEM,
                { error }
            );

            globalErrorHandler.handleError(editorError);
            throw editorError;
        }
    }

    /**
     * Initialize MVC components
     * @private
     * @returns {void}
     * @description Creates and connects Model, View, and Controller components
     */
    private initializeMVCComponents(): void {
        try {
            // Model - データ管理
            this.model = new EditorModel();
            DebugHelper.log('EditorModel initialized');

            // View - UI管理
            this.view = new EditorView(this.canvas);
            DebugHelper.log('EditorView initialized');

            // Controller - ビジネスロジック制御 (using Builder pattern)
            const builder = new EditorControllerBuilder(this.canvas, this.view, this.model);
            this.controller = builder.build();

            // View にController参照を設定
            this.view.setController(this.controller);

            DebugHelper.log('All MVC components initialized');
        } catch (error) {
            throw new EditorError(
                'Failed to initialize MVC components',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.SYSTEM,
                { error }
            );
        }
    }

    /**
     * Setup global error handling
     * @private
     * @returns {void}
     * @description Configures window error events and editor-specific error reporting
     */
    private setupGlobalErrorHandling(): void {
        // 未処理のエラーをキャッチ
        window.addEventListener('error', (event) => {
            globalErrorHandler.handleError(new Error(event.message));
        });

        // Promise の未処理のリジェクションをキャッチ
        window.addEventListener('unhandledrejection', (event) => {
            globalErrorHandler.handleError(event.reason);
            event.preventDefault();
        });

        // エディター特有のエラーレポーター追加
        const viewRef = this.view;
        globalErrorHandler.addReporter({
            async reportError(error) {
                // UIにエラーメッセージを表示
                if (viewRef) {
                    const message =
                        error instanceof EditorError
                            ? error.getUserMessage()
                            : 'An unexpected error occurred';
                    viewRef.showErrorMessage(message);
                }
            },
            async reportWarning(warning) {
                console.warn('Editor warning:', warning);
            },
            async reportInfo(info) {
                console.info('Editor info:', info);
            }
        });

        DebugHelper.log('Global error handling setup complete');
    }

    /**
     * Show success message
     * @private
     * @param {string} message - Success message to display
     * @returns {void}
     * @description Displays success message in console and UI
     */
    private showSuccessMessage(message: string): void {
        // コンソールに表示
        console.log(`✅ ${message}`);

        // UIに表示（Viewが初期化されている場合）
        if (this.view) {
            this.view.showSuccessMessage(message);
        }
    }

    /**
     * Cleanup the application
     * @public
     * @returns {void}
     * @description Disposes of MVC components and cleans up resources
     */
    public dispose(): void {
        try {
            this.controller?.dispose();
            this.view?.dispose();

            DebugHelper.log('Editor Application disposed');
        } catch (error) {
            globalErrorHandler.handleError(error as Error);
        }
    }
}

/**
 * Initialize and launch the editor application
 * @function initializeEditor
 * @returns {void}
 * @description Entry point function that sets up DOM loading and error handling
 */
function initializeEditor(): void {
    try {
        // DOM準備完了後にエディターを初期化
        let editorApp: EditorApplication | null = null;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                editorApp = new EditorApplication();
            });
        } else {
            // すでにDOMが読み込まれている場合
            editorApp = new EditorApplication();
        }

        // ページ離脱時のクリーンアップ
        window.addEventListener('beforeunload', () => {
            editorApp?.dispose();
        });
    } catch (error) {
        console.error('❌ Critical error during editor initialization:', error);

        // 最後の手段：基本的なエラーメッセージを表示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4444;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            z-index: 10000;
        `;
        errorDiv.textContent = 'Failed to initialize Stage Editor. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
}

/**
 * Debug information output
 * @description Logs editor module loading information for debugging
 */
DebugHelper.log('Editor module loaded', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
});

/**
 * Execute editor initialization
 * @description Starts the editor application initialization process
 */
initializeEditor();

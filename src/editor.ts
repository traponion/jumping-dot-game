// エディターメインファイル - MVCアーキテクチャ統合版
import { EditorController } from './controllers/EditorController.js';
import { EditorModel } from './models/EditorModel.js';
import { ERROR_CODES, ERROR_TYPES, EditorError } from './types/EditorTypes.js';
import { DOMHelper, DebugHelper } from './utils/EditorUtils.js';
import { globalErrorHandler } from './utils/ErrorHandler.js';
import { EditorView } from './views/EditorView.js';

/**
 * エディターアプリケーションのメインクラス
 * MVCパターンによる構成で各コンポーネントを統合
 */
class EditorApplication {
    private controller!: EditorController;
    private view!: EditorView;
    private model!: EditorModel;
    private canvas!: HTMLCanvasElement;

    constructor() {
        DebugHelper.log('Initializing Editor Application...');
        this.initialize().catch((error) => {
            globalErrorHandler.handleError(error);
            console.error('❌ Failed to initialize Editor Application:', error);
        });
    }

    /**
     * エディターアプリケーションを初期化
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
     * MVCコンポーネントを初期化
     */
    private initializeMVCComponents(): void {
        try {
            // Model - データ管理
            this.model = new EditorModel();
            DebugHelper.log('EditorModel initialized');

            // View - UI管理
            this.view = new EditorView(this.canvas);
            DebugHelper.log('EditorView initialized');

            // Controller - ビジネスロジック制御
            this.controller = new EditorController(this.canvas, this.view, this.model);

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
     * グローバルエラーハンドリングを設定
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
     * 成功メッセージを表示
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
     * アプリケーションをクリーンアップ
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
 * エディターアプリケーションの初期化と起動
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

// デバッグ情報の出力
DebugHelper.log('Editor module loaded', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href
});

// エディター初期化を実行
initializeEditor();

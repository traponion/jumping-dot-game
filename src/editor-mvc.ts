// MVC アーキテクチャによるエディターエントリーポイント
import { EditorController } from './controllers/EditorController.js';
import { EditorView } from './views/EditorView.js';
import { EditorModel } from './models/EditorModel.js';
import { editorStore } from './stores/EditorStore.js';
import {
    DOMHelper,
    DebugHelper
} from './utils/EditorUtils.js';

/**
 * MVCパターンによるエディターアプリケーション
 * - 責務分離された設計
 * - 一元的な状態管理
 * - テスタブルなアーキテクチャ
 */
class EditorApplication {
    private controller!: EditorController;
    private view!: EditorView;
    private model!: EditorModel;
    private canvas!: HTMLCanvasElement;
    
    private isInitialized = false;
    private unsubscribeStore?: () => void;

    constructor() {
        DebugHelper.log('EditorApplication constructed');
    }

    /**
     * アプリケーションを初期化
     */
    public async initialize(): Promise<void> {
        try {
            DebugHelper.time('EditorApplication.initialize', async () => {
                await this.initializeComponents();
                this.connectComponents();
                this.setupStoreIntegration();
                await this.controller.initialize();
                this.isInitialized = true;
            });
            
            DebugHelper.log('EditorApplication initialized successfully', {
                storeState: editorStore.getDebugInfo()
            });
            
            // 初期化完了をストアに通知
            editorStore.dispatch({ type: 'SET_INITIALIZED', payload: true });
            
        } catch (error) {
            DebugHelper.log('EditorApplication initialization failed', error);
            editorStore.dispatch({ 
                type: 'SET_ERROR', 
                payload: `Failed to initialize editor: ${error}` 
            });
            throw error;
        }
    }

    /**
     * コンポーネントを初期化
     */
    private async initializeComponents(): Promise<void> {
        // Canvas要素を取得
        this.canvas = DOMHelper.getRequiredElement<HTMLCanvasElement>('editorCanvas');
        
        // MVC コンポーネントを作成
        this.model = new EditorModel();
        this.view = new EditorView(this.canvas);
        this.controller = new EditorController(this.canvas, this.view, this.model);
        
        DebugHelper.log('MVC components created', {
            canvasSize: { width: this.canvas.width, height: this.canvas.height }
        });
    }

    /**
     * コンポーネント間の接続を設定
     */
    private connectComponents(): void {
        // ViewにControllerを設定
        this.view.setController(this.controller);
        
        // ModelにChangeListenerを設定
        this.model.addChangeListener({
            onStageDataChanged: (stageData) => {
                if (stageData) {
                    editorStore.dispatch({ type: 'SET_CURRENT_STAGE', payload: stageData });
                }
            },
            onEditorStateChanged: (editorState) => {
                editorStore.batchDispatch([
                    { type: 'SET_SELECTED_TOOL', payload: editorState.selectedTool },
                    { type: 'SET_SELECTED_OBJECT', payload: editorState.selectedObject },
                    { type: 'SET_DRAWING_STATE', payload: editorState.isDrawing }
                ]);
            },
            onValidationError: (error) => {
                editorStore.dispatch({ type: 'SET_ERROR', payload: error });
            }
        });
        
        DebugHelper.log('Component connections established');
    }

    /**
     * ストア統合を設定
     */
    private setupStoreIntegration(): void {
        // ストアの変更を監視してViewに反映
        this.unsubscribeStore = editorStore.subscribe((state, action) => {
            this.handleStoreChange(state, action);
        });
        
        // パフォーマンス監視
        this.setupPerformanceMonitoring();
        
        DebugHelper.log('Store integration setup completed');
    }

    /**
     * ストア変更時の処理
     */
    private handleStoreChange(state: any, action: any): void {
        // UI状態の同期
        const uiState = state.uiState;
        
        if (uiState.lastError) {
            this.view.showErrorMessage(uiState.lastError);
            // エラー表示後にクリア
            setTimeout(() => {
                editorStore.dispatch({ type: 'CLEAR_MESSAGES' });
            }, 100);
        }
        
        if (uiState.lastSuccess) {
            this.view.showSuccessMessage(uiState.lastSuccess);
            // 成功メッセージ表示後にクリア
            setTimeout(() => {
                editorStore.dispatch({ type: 'CLEAR_MESSAGES' });
            }, 100);
        }
        
        // オブジェクト数の更新
        const objectCount = editorStore.getObjectCount();
        this.view.updateObjectCount(objectCount);
        
        // パフォーマンス情報の更新
        editorStore.dispatch({
            type: 'UPDATE_PERFORMANCE',
            payload: {
                objectCount,
                lastOperation: action.type,
                operationTime: performance.now()
            }
        });
    }

    /**
     * パフォーマンス監視を設定
     */
    private setupPerformanceMonitoring(): void {
        // メモリ使用量の監視
        setInterval(() => {
            if (this.isInitialized && (performance as any).memory) {
                const memInfo = (performance as any).memory;
                DebugHelper.log('Memory usage', {
                    used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
                    total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
                    limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
                });
            }
        }, 30000); // 30秒間隔

        // レンダリングパフォーマンスの監視
        let lastRenderTime = 0;
        const monitorRendering = () => {
            const now = performance.now();
            const deltaTime = now - lastRenderTime;
            
            if (deltaTime > 16.67) { // 60FPS以下の場合
                editorStore.dispatch({
                    type: 'UPDATE_PERFORMANCE',
                    payload: { renderTime: deltaTime }
                });
            }
            
            lastRenderTime = now;
            requestAnimationFrame(monitorRendering);
        };
        
        requestAnimationFrame(monitorRendering);
    }

    /**
     * アプリケーションの状態を取得
     */
    public getApplicationState(): {
        initialized: boolean;
        storeState: any;
        debugInfo: any;
    } {
        return {
            initialized: this.isInitialized,
            storeState: editorStore.getState(),
            debugInfo: editorStore.getDebugInfo()
        };
    }

    /**
     * リソースを解放
     */
    public dispose(): void {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        
        if (this.controller) {
            this.controller.dispose();
        }
        
        if (this.view) {
            this.view.dispose();
        }
        
        editorStore.reset();
        this.isInitialized = false;
        
        DebugHelper.log('EditorApplication disposed');
    }

    /**
     * デバッグ用：手動でアクションを実行
     */
    public debugDispatch(action: any): void {
        if (process.env.NODE_ENV === 'development') {
            editorStore.dispatch(action);
            DebugHelper.log('Debug action dispatched', action);
        }
    }

    /**
     * デバッグ用：コンポーネントアクセス
     */
    public getDebugComponents(): {
        controller: EditorController;
        view: EditorView;
        model: EditorModel;
        store: typeof editorStore;
    } | null {
        if (process.env.NODE_ENV === 'development' && this.isInitialized) {
            return {
                controller: this.controller,
                view: this.view,
                model: this.model,
                store: editorStore
            };
        }
        return null;
    }
}

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
    DebugHelper.log('Global error caught', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
    
    editorStore.dispatch({
        type: 'SET_ERROR',
        payload: `Unexpected error: ${event.message}`
    });
});

// 未処理のPromise拒否をキャッチ
window.addEventListener('unhandledrejection', (event) => {
    DebugHelper.log('Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
    });
    
    editorStore.dispatch({
        type: 'SET_ERROR',
        payload: `Promise rejection: ${event.reason}`
    });
});

// アプリケーションインスタンス
let editorApp: EditorApplication;

// DOM読み込み完了時にエディターを初期化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        editorApp = new EditorApplication();
        await editorApp.initialize();
        
        // デバッグ用にグローバルに公開
        if (process.env.NODE_ENV === 'development') {
            (window as any).editorApp = editorApp;
            (window as any).editorStore = editorStore;
        }
        
        console.log('🎮 Stage Editor (MVC) initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize Stage Editor:', error);
        
        // フォールバック：基本的なエラーメッセージを表示
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff4757;
            color: white;
            padding: 20px;
            border-radius: 8px;
            font-family: monospace;
            z-index: 10000;
            text-align: center;
            max-width: 400px;
        `;
        errorDiv.innerHTML = `
            <h3>❌ Editor Initialization Failed</h3>
            <p>${error}</p>
            <p><small>Please check the console for details.</small></p>
        `;
        document.body.appendChild(errorDiv);
    }
});

// ページアンロード時のクリーンアップ
window.addEventListener('beforeunload', () => {
    if (editorApp) {
        editorApp.dispose();
    }
});

export { EditorApplication, editorStore };
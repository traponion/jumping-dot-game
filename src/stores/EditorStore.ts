// エディターの状態管理ストア - 一元的なステート管理
import type { StageData } from '../core/StageLoader.js';
import {
    type EditorState,
    type FabricObjectWithData,
    EDITOR_TOOLS
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';

// ストアの状態を定義
export interface EditorStoreState {
    // エディター状態
    editorState: EditorState;
    
    // ステージデータ
    currentStage: StageData | null;
    stageHistory: StageData[];
    
    // UI状態
    uiState: {
        isInitialized: boolean;
        isLoading: boolean;
        activeModal: string | null;
        lastError: string | null;
        lastSuccess: string | null;
        mousePosition: { x: number; y: number };
    };
    
    // 設定
    preferences: {
        autoSave: boolean;
        autoSaveInterval: number;
        gridSize: number;
        snapTolerance: number;
        recentFiles: string[];
    };
    
    // パフォーマンス関連
    performance: {
        objectCount: number;
        renderTime: number;
        lastOperation: string;
        operationTime: number;
    };
}

// アクションの型定義
export type EditorAction = 
    // エディター状態変更
    | { type: 'SET_SELECTED_TOOL'; payload: string }
    | { type: 'SET_SELECTED_OBJECT'; payload: FabricObjectWithData | null }
    | { type: 'SET_DRAWING_STATE'; payload: boolean }
    | { type: 'TOGGLE_GRID' }
    | { type: 'TOGGLE_SNAP' }
    
    // ステージ変更
    | { type: 'SET_CURRENT_STAGE'; payload: StageData }
    | { type: 'ADD_TO_HISTORY'; payload: StageData }
    | { type: 'CLEAR_HISTORY' }
    
    // UI状態変更
    | { type: 'SET_INITIALIZED'; payload: boolean }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SHOW_MODAL'; payload: string }
    | { type: 'HIDE_MODAL' }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'SET_SUCCESS'; payload: string }
    | { type: 'CLEAR_MESSAGES' }
    | { type: 'UPDATE_MOUSE_POSITION'; payload: { x: number; y: number } }
    
    // 設定変更
    | { type: 'UPDATE_PREFERENCES'; payload: Partial<EditorStoreState['preferences']> }
    
    // パフォーマンス更新
    | { type: 'UPDATE_PERFORMANCE'; payload: Partial<EditorStoreState['performance']> };

// ストアリスナーの型定義
export type StoreListener = (state: EditorStoreState, action: EditorAction) => void;

/**
 * エディターの一元的状態管理ストア
 * - Redux風のアーキテクチャ
 * - Immutableな状態管理
 * - アクション駆動の状態変更
 * - リスナーパターンによる変更通知
 */
export class EditorStore {
    private state: EditorStoreState;
    private listeners: StoreListener[] = [];
    private actionHistory: EditorAction[] = [];
    private maxHistorySize = 100;

    constructor() {
        this.state = this.createInitialState();
        DebugHelper.log('EditorStore initialized', { 
            initialState: this.state 
        });
    }

    // === 状態アクセス ===

    /**
     * 現在の状態を取得（Immutable）
     */
    public getState(): EditorStoreState {
        return this.deepClone(this.state);
    }

    /**
     * 特定の状態部分を取得
     */
    public getEditorState(): EditorState {
        return { ...this.state.editorState };
    }

    public getCurrentStage(): StageData | null {
        return this.state.currentStage ? { ...this.state.currentStage } : null;
    }

    public getUIState(): EditorStoreState['uiState'] {
        return { ...this.state.uiState };
    }

    public getPreferences(): EditorStoreState['preferences'] {
        return { ...this.state.preferences };
    }

    public getPerformance(): EditorStoreState['performance'] {
        return { ...this.state.performance };
    }

    // === アクション実行 ===

    /**
     * アクションを実行して状態を更新
     */
    public dispatch(action: EditorAction): void {
        const previousState = this.deepClone(this.state);
        
        DebugHelper.time(`Action: ${action.type}`, () => {
            this.state = this.reduce(this.state, action);
        });
        
        // アクション履歴に追加
        this.addToActionHistory(action);
        
        // リスナーに通知
        this.notifyListeners(action);
        
        DebugHelper.log('Action dispatched', {
            action: action.type,
            payload: 'payload' in action ? action.payload : undefined,
            stateChanged: !this.deepEqual(previousState, this.state)
        });
    }

    // === リスナー管理 ===

    /**
     * 状態変更リスナーを追加
     */
    public subscribe(listener: StoreListener): () => void {
        this.listeners.push(listener);
        
        DebugHelper.log('Store listener added', { 
            listenerCount: this.listeners.length 
        });
        
        // Unsubscribe関数を返す
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
                DebugHelper.log('Store listener removed', { 
                    listenerCount: this.listeners.length 
                });
            }
        };
    }

    /**
     * すべてのリスナーに変更を通知
     */
    private notifyListeners(action: EditorAction): void {
        this.listeners.forEach(listener => {
            try {
                listener(this.getState(), action);
            } catch (error) {
                DebugHelper.log('Error in store listener', { error, action });
            }
        });
    }

    // === セレクター（計算済みプロパティ）===

    /**
     * オブジェクト数を計算
     */
    public getObjectCount(): number {
        const stage = this.state.currentStage;
        if (!stage) return 0;
        
        return stage.platforms.length + stage.spikes.length + 1; // +1 for goal
    }

    /**
     * 変更状態を取得
     */
    public hasUnsavedChanges(): boolean {
        return this.state.stageHistory.length > 0;
    }

    /**
     * アクティブなツールを取得
     */
    public getActiveTool(): string {
        return this.state.editorState.selectedTool;
    }

    /**
     * 選択されたオブジェクトを取得
     */
    public getSelectedObject(): FabricObjectWithData | null {
        return this.state.editorState.selectedObject;
    }

    /**
     * エラー状態を取得
     */
    public hasError(): boolean {
        return !!this.state.uiState.lastError;
    }

    /**
     * ローディング状態を取得
     */
    public isLoading(): boolean {
        return this.state.uiState.isLoading;
    }

    // === ユーティリティアクション ===

    /**
     * 複数のアクションを一括実行
     */
    public batchDispatch(actions: EditorAction[]): void {
        DebugHelper.time('Batch dispatch', () => {
            actions.forEach(action => {
                this.state = this.reduce(this.state, action);
                this.addToActionHistory(action);
            });
        });
        
        // 最後のアクションで一括通知
        const lastAction = actions[actions.length - 1];
        if (lastAction) {
            this.notifyListeners(lastAction);
        }
        
        DebugHelper.log('Batch dispatch completed', { 
            actionCount: actions.length 
        });
    }

    /**
     * 状態をリセット
     */
    public reset(): void {
        this.state = this.createInitialState();
        this.actionHistory = [];
        this.dispatch({ type: 'CLEAR_MESSAGES' });
        DebugHelper.log('Store reset');
    }

    /**
     * デバッグ情報を取得
     */
    public getDebugInfo(): {
        stateSize: number;
        listenerCount: number;
        actionHistorySize: number;
        lastActions: EditorAction[];
    } {
        return {
            stateSize: JSON.stringify(this.state).length,
            listenerCount: this.listeners.length,
            actionHistorySize: this.actionHistory.length,
            lastActions: this.actionHistory.slice(-5)
        };
    }

    // === プライベートメソッド ===

    /**
     * 初期状態を作成
     */
    private createInitialState(): EditorStoreState {
        return {
            editorState: {
                selectedTool: EDITOR_TOOLS.SELECT,
                selectedObject: null,
                isDrawing: false,
                gridEnabled: true,
                snapToGrid: true
            },
            currentStage: null,
            stageHistory: [],
            uiState: {
                isInitialized: false,
                isLoading: false,
                activeModal: null,
                lastError: null,
                lastSuccess: null,
                mousePosition: { x: 0, y: 0 }
            },
            preferences: {
                autoSave: true,
                autoSaveInterval: 30000, // 30秒
                gridSize: 20,
                snapTolerance: 5,
                recentFiles: []
            },
            performance: {
                objectCount: 0,
                renderTime: 0,
                lastOperation: '',
                operationTime: 0
            }
        };
    }

    /**
     * Reducerパターンによる状態更新
     */
    private reduce(state: EditorStoreState, action: EditorAction): EditorStoreState {
        switch (action.type) {
            // エディター状態変更
            case 'SET_SELECTED_TOOL':
                return {
                    ...state,
                    editorState: {
                        ...state.editorState,
                        selectedTool: action.payload as any
                    }
                };
                
            case 'SET_SELECTED_OBJECT':
                return {
                    ...state,
                    editorState: {
                        ...state.editorState,
                        selectedObject: action.payload
                    }
                };
                
            case 'SET_DRAWING_STATE':
                return {
                    ...state,
                    editorState: {
                        ...state.editorState,
                        isDrawing: action.payload
                    }
                };
                
            case 'TOGGLE_GRID':
                return {
                    ...state,
                    editorState: {
                        ...state.editorState,
                        gridEnabled: !state.editorState.gridEnabled
                    }
                };
                
            case 'TOGGLE_SNAP':
                return {
                    ...state,
                    editorState: {
                        ...state.editorState,
                        snapToGrid: !state.editorState.snapToGrid
                    }
                };
                
            // ステージ変更
            case 'SET_CURRENT_STAGE':
                return {
                    ...state,
                    currentStage: action.payload,
                    performance: {
                        ...state.performance,
                        objectCount: this.calculateObjectCount(action.payload)
                    }
                };
                
            case 'ADD_TO_HISTORY':
                return {
                    ...state,
                    stageHistory: [...state.stageHistory, action.payload].slice(-50) // 最大50個
                };
                
            case 'CLEAR_HISTORY':
                return {
                    ...state,
                    stageHistory: []
                };
                
            // UI状態変更
            case 'SET_INITIALIZED':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        isInitialized: action.payload
                    }
                };
                
            case 'SET_LOADING':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        isLoading: action.payload
                    }
                };
                
            case 'SHOW_MODAL':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        activeModal: action.payload
                    }
                };
                
            case 'HIDE_MODAL':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        activeModal: null
                    }
                };
                
            case 'SET_ERROR':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        lastError: action.payload,
                        lastSuccess: null
                    }
                };
                
            case 'SET_SUCCESS':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        lastSuccess: action.payload,
                        lastError: null
                    }
                };
                
            case 'CLEAR_MESSAGES':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        lastError: null,
                        lastSuccess: null
                    }
                };
                
            case 'UPDATE_MOUSE_POSITION':
                return {
                    ...state,
                    uiState: {
                        ...state.uiState,
                        mousePosition: action.payload
                    }
                };
                
            // 設定変更
            case 'UPDATE_PREFERENCES':
                return {
                    ...state,
                    preferences: {
                        ...state.preferences,
                        ...action.payload
                    }
                };
                
            // パフォーマンス更新
            case 'UPDATE_PERFORMANCE':
                return {
                    ...state,
                    performance: {
                        ...state.performance,
                        ...action.payload
                    }
                };
                
            default:
                return state;
        }
    }

    /**
     * アクション履歴に追加
     */
    private addToActionHistory(action: EditorAction): void {
        this.actionHistory.push(action);
        if (this.actionHistory.length > this.maxHistorySize) {
            this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
        }
    }

    /**
     * オブジェクト数を計算
     */
    private calculateObjectCount(stageData: StageData): number {
        return stageData.platforms.length + stageData.spikes.length + 1;
    }

    /**
     * オブジェクトの深いクローンを作成
     */
    private deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * オブジェクトの深い等価性チェック
     */
    private deepEqual(obj1: any, obj2: any): boolean {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    }
}

// シングルトンインスタンス
export const editorStore = new EditorStore();
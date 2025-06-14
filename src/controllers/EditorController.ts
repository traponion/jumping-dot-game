// エディターのメインコントローラー - MVCパターンのController層
import { EditorRenderSystem } from '../systems/EditorRenderSystem.js';
import { StageLoader, type StageData } from '../core/StageLoader.js';
import {
    type EditorState,
    type EditorCallbacks,
    type FabricObjectWithData,
    type KeyboardEventHandler,
    KEYBOARD_SHORTCUTS,
    isValidEditorTool,
    EditorError
} from '../types/EditorTypes.js';
import {
    TypeHelper,
    EventHelper,
    DebugHelper
} from '../utils/EditorUtils.js';

// Controller層のインターフェース定義
export interface IEditorController {
    initialize(): Promise<void>;
    selectTool(tool: string): void;
    createNewStage(): void;
    loadStage(stageId?: number): Promise<void>;
    saveStage(): void;
    testStage(): void;
    clearStage(): void;
    deleteSelectedObject(): void;
    duplicateSelectedObject(): void;
    toggleGrid(): void;
    toggleSnap(): void;
    dispose(): void;
}

// View層とModel層のインターフェース
export interface IEditorView {
    initialize(): void;
    updateToolSelection(tool: string): void;
    updateObjectCount(count: number): void;
    updateMouseCoordinates(x: number, y: number): void;
    updateCurrentTool(tool: string): void;
    updateStageInfo(stageData: StageData): void;
    showObjectProperties(object: FabricObjectWithData | null): void;
    enableActionButtons(enabled: boolean): void;
    showErrorMessage(message: string): void;
    showSuccessMessage(message: string): void;
    dispose(): void;
}

export interface IEditorModel {
    getCurrentStage(): StageData | null;
    setCurrentStage(stageData: StageData): void;
    getEditorState(): EditorState;
    updateEditorState(updates: Partial<EditorState>): void;
    getObjectCount(): number;
    validateStageData(stageData: StageData): boolean;
    exportStageAsJson(): string;
    importStageFromJson(json: string): StageData;
}

/**
 * エディターのメインコントローラークラス
 * - ユーザーアクションの調整
 * - View層とModel層の連携
 * - ビジネスロジックの制御
 */
export class EditorController implements IEditorController {
    private editorSystem!: EditorRenderSystem;
    private stageLoader: StageLoader;
    private view!: IEditorView;
    private model!: IEditorModel;
    
    // イベントハンドラー（デバウンス処理済み）
    private debouncedSave = EventHelper.debounce(() => this.autoSave(), 5000);
    private keyboardHandler: KeyboardEventHandler;
    
    // ステート
    private isInitialized = false;
    private autoSaveEnabled = false;

    constructor(
        private canvas: HTMLCanvasElement,
        view: IEditorView,
        model: IEditorModel
    ) {
        this.stageLoader = new StageLoader();
        this.view = view;
        this.model = model;
        this.keyboardHandler = this.handleKeyboard.bind(this);
        
        DebugHelper.log('EditorController constructed', {
            canvasSize: { width: canvas.width, height: canvas.height }
        });
    }

    /**
     * エディターを初期化
     */
    public async initialize(): Promise<void> {
        try {
            DebugHelper.time('EditorController.initialize', () => {
                this.initializeEditorSystem();
                this.view.initialize();
                this.setupEventListeners();
                this.createNewStage();
                this.isInitialized = true;
            });
            
            DebugHelper.log('EditorController initialized successfully');
        } catch (error) {
            DebugHelper.log('EditorController initialization failed', error);
            throw new EditorError(
                'Failed to initialize editor controller',
                'CANVAS_INIT_FAILED',
                { error }
            );
        }
    }

    /**
     * エディターシステムを初期化
     */
    private initializeEditorSystem(): void {
        const callbacks: EditorCallbacks = {
            onObjectSelected: (object) => this.handleObjectSelection(object),
            onObjectModified: (object) => this.handleObjectModified(object),
            onStageModified: (stageData) => this.handleStageModified(stageData)
        };

        this.editorSystem = new EditorRenderSystem(this.canvas, callbacks);
        DebugHelper.log('EditorRenderSystem initialized');
    }

    /**
     * グローバルイベントリスナーを設定
     */
    private setupEventListeners(): void {
        document.addEventListener('keydown', this.keyboardHandler);
        
        // ページ離脱時の警告
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'Unsaved changes will be lost. Are you sure?';
            }
        });
        
        DebugHelper.log('Global event listeners setup');
    }

    /**
     * ツール選択
     */
    public selectTool(tool: string): void {
        if (!this.isInitialized) {
            DebugHelper.log('Controller not initialized');
            return;
        }

        if (!isValidEditorTool(tool)) {
            DebugHelper.log('Invalid tool selected', { tool });
            this.view.showErrorMessage(`Invalid tool: ${tool}`);
            return;
        }

        try {
            this.editorSystem.setSelectedTool(tool);
            this.model.updateEditorState({ selectedTool: tool });
            this.view.updateToolSelection(tool);
            this.view.updateCurrentTool(tool);
            
            DebugHelper.log('Tool selected', { tool });
        } catch (error) {
            DebugHelper.log('Tool selection failed', { tool, error });
            this.view.showErrorMessage('Failed to select tool');
        }
    }

    /**
     * 新しいステージを作成
     */
    public createNewStage(): void {
        try {
            const newStage: StageData = this.createDefaultStageData();
            
            this.model.setCurrentStage(newStage);
            this.editorSystem.loadStageForEditing(newStage);
            this.view.updateStageInfo(newStage);
            this.updateUIFromModel();
            
            DebugHelper.log('New stage created', { stageId: newStage.id });
            this.view.showSuccessMessage('New stage created');
        } catch (error) {
            DebugHelper.log('New stage creation failed', error);
            this.view.showErrorMessage('Failed to create new stage');
        }
    }

    /**
     * ステージを読み込み
     */
    public async loadStage(stageId?: number): Promise<void> {
        try {
            let targetStageId: number;
            
            if (stageId !== undefined) {
                targetStageId = stageId;
            } else {
                const stageIdStr = prompt('Enter stage ID to load:');
                if (!stageIdStr) return;
                targetStageId = TypeHelper.safeParseInt(stageIdStr, 1);
            }
            
            const stageData = await this.stageLoader.loadStage(targetStageId);
            
            if (!this.model.validateStageData(stageData)) {
                throw new EditorError(
                    'Invalid stage data format',
                    'INVALID_TOOL',
                    { stageData }
                );
            }
            
            this.model.setCurrentStage(stageData);
            this.editorSystem.loadStageForEditing(stageData);
            this.view.updateStageInfo(stageData);
            this.updateUIFromModel();
            
            DebugHelper.log('Stage loaded successfully', { stageId: stageData.id });
            this.view.showSuccessMessage(`Stage ${stageData.id} loaded successfully`);
        } catch (error) {
            DebugHelper.log('Stage loading failed', error);
            this.view.showErrorMessage(`Failed to load stage: ${error}`);
        }
    }

    /**
     * ステージを保存
     */
    public saveStage(): void {
        try {
            const currentStage = this.model.getCurrentStage();
            if (!currentStage) {
                this.view.showErrorMessage('No stage to save');
                return;
            }

            const stageData = this.editorSystem.exportStageData();
            stageData.id = currentStage.id;
            stageData.name = currentStage.name;

            this.downloadStageAsJson(stageData);
            this.model.setCurrentStage(stageData);
            
            DebugHelper.log('Stage saved', { stageId: stageData.id, name: stageData.name });
            this.view.showSuccessMessage(`Stage "${stageData.name}" saved successfully`);
        } catch (error) {
            DebugHelper.log('Stage saving failed', error);
            this.view.showErrorMessage('Failed to save stage');
        }
    }

    /**
     * ステージをテスト
     */
    public testStage(): void {
        try {
            const currentStage = this.model.getCurrentStage();
            if (!currentStage) {
                this.view.showErrorMessage('No stage to test');
                return;
            }

            const stageData = this.editorSystem.exportStageData();
            
            if (!this.model.validateStageData(stageData)) {
                this.view.showErrorMessage('Stage validation failed');
                return;
            }

            const json = this.model.exportStageAsJson();
            localStorage.setItem('testStage', json);
            window.open('/index.html?test=true', '_blank');
            
            DebugHelper.log('Stage testing started', { stageId: stageData.id });
            this.view.showSuccessMessage('Test stage opened in new tab');
        } catch (error) {
            DebugHelper.log('Stage testing failed', error);
            this.view.showErrorMessage('Failed to start stage test');
        }
    }

    /**
     * ステージをクリア
     */
    public clearStage(): void {
        if (confirm('Are you sure you want to clear all objects?')) {
            this.createNewStage();
            DebugHelper.log('Stage cleared');
        }
    }

    /**
     * 選択オブジェクトを削除
     */
    public deleteSelectedObject(): void {
        try {
            this.editorSystem.deleteSelectedObject();
            this.updateUIFromModel();
            DebugHelper.log('Selected object deleted');
        } catch (error) {
            DebugHelper.log('Object deletion failed', error);
            this.view.showErrorMessage('Failed to delete object');
        }
    }

    /**
     * 選択オブジェクトを複製
     */
    public duplicateSelectedObject(): void {
        try {
            // TODO: 複製機能の実装
            DebugHelper.log('Duplicate function not implemented yet');
            this.view.showErrorMessage('Duplicate function not implemented yet');
        } catch (error) {
            DebugHelper.log('Object duplication failed', error);
            this.view.showErrorMessage('Failed to duplicate object');
        }
    }

    /**
     * グリッド表示切り替え
     */
    public toggleGrid(): void {
        try {
            this.editorSystem.toggleGrid();
            const state = this.editorSystem.getEditorState();
            this.model.updateEditorState({ gridEnabled: state.gridEnabled });
            DebugHelper.log('Grid toggled', { enabled: state.gridEnabled });
        } catch (error) {
            DebugHelper.log('Grid toggle failed', error);
            this.view.showErrorMessage('Failed to toggle grid');
        }
    }

    /**
     * スナップ機能切り替え
     */
    public toggleSnap(): void {
        try {
            this.editorSystem.toggleSnapToGrid();
            const state = this.editorSystem.getEditorState();
            this.model.updateEditorState({ snapToGrid: state.snapToGrid });
            DebugHelper.log('Snap toggled', { enabled: state.snapToGrid });
        } catch (error) {
            DebugHelper.log('Snap toggle failed', error);
            this.view.showErrorMessage('Failed to toggle snap');
        }
    }

    /**
     * リソースを解放
     */
    public dispose(): void {
        document.removeEventListener('keydown', this.keyboardHandler);
        this.view.dispose();
        this.isInitialized = false;
        DebugHelper.log('EditorController disposed');
    }

    // === プライベートメソッド ===

    /**
     * オブジェクト選択時の処理
     */
    private handleObjectSelection(object: FabricObjectWithData | null): void {
        this.model.updateEditorState({ selectedObject: object });
        this.view.showObjectProperties(object);
        this.view.enableActionButtons(!!object);
        
        DebugHelper.log('Object selection handled', { 
            hasObject: !!object,
            objectType: object ? (object as any).data?.type : null 
        });
    }

    /**
     * オブジェクト変更時の処理
     */
    private handleObjectModified(object: FabricObjectWithData): void {
        this.updateUIFromModel();
        this.triggerAutoSave();
        
        DebugHelper.log('Object modification handled', { 
            objectType: (object as any).data?.type 
        });
    }

    /**
     * ステージ変更時の処理
     */
    private handleStageModified(stageData: StageData): void {
        this.model.setCurrentStage(stageData);
        this.updateUIFromModel();
        this.triggerAutoSave();
        
        DebugHelper.log('Stage modification handled', { 
            objectCount: this.model.getObjectCount() 
        });
    }

    /**
     * キーボードイベント処理
     */
    private handleKeyboard: KeyboardEventHandler = (e) => {
        if (!this.isInitialized) return;

        const normalizedKey = EventHelper.normalizeKeyboardEvent(e);
        
        // ツールショートカット
        const toolShortcut = KEYBOARD_SHORTCUTS.TOOLS[e.key as keyof typeof KEYBOARD_SHORTCUTS.TOOLS];
        if (toolShortcut) {
            this.selectTool(toolShortcut);
            return;
        }
        
        // アクションショートカット
        switch (normalizedKey) {
            case 'Delete':
            case 'Backspace':
                this.deleteSelectedObject();
                e.preventDefault();
                break;
            case 'Ctrl+KeyG':
            case 'Cmd+KeyG':
                this.toggleGrid();
                e.preventDefault();
                break;
            case 'Ctrl+KeyS':
            case 'Cmd+KeyS':
                this.saveStage();
                e.preventDefault();
                break;
            case 'Ctrl+KeyN':
            case 'Cmd+KeyN':
                this.createNewStage();
                e.preventDefault();
                break;
            case 'Ctrl+KeyO':
            case 'Cmd+KeyO':
                this.loadStage();
                e.preventDefault();
                break;
        }
    };

    /**
     * デフォルトのステージデータを作成
     */
    private createDefaultStageData(): StageData {
        return {
            id: 1,
            name: 'New Stage',
            platforms: [],
            spikes: [],
            goal: { x: 400, y: 300, width: 40, height: 50 },
            startText: { x: 50, y: 450, text: 'START' },
            goalText: { x: 420, y: 280, text: 'GOAL' }
        };
    }

    /**
     * ステージをJSONファイルとしてダウンロード
     */
    private downloadStageAsJson(stageData: StageData): void {
        const json = JSON.stringify(stageData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `stage${stageData.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * ModelからUIを更新
     */
    private updateUIFromModel(): void {
        const objectCount = this.model.getObjectCount();
        this.view.updateObjectCount(objectCount);
    }

    /**
     * 自動保存をトリガー
     */
    private triggerAutoSave(): void {
        if (this.autoSaveEnabled) {
            this.debouncedSave();
        }
    }

    /**
     * 自動保存処理
     */
    private autoSave(): void {
        try {
            const currentStage = this.model.getCurrentStage();
            if (currentStage) {
                const json = this.model.exportStageAsJson();
                localStorage.setItem('editorAutoSave', json);
                DebugHelper.log('Auto-save completed');
            }
        } catch (error) {
            DebugHelper.log('Auto-save failed', error);
        }
    }

    /**
     * 未保存の変更があるかチェック
     */
    private hasUnsavedChanges(): boolean {
        // TODO: 実装 - ステージの変更状態を追跡
        return false;
    }
}
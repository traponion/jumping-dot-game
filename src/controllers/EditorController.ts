import { type StageData } from '../core/StageLoader.js';
import {
    type EditorStore,
    subscribeEditorStore
} from '../stores/EditorZustandStore.js';
import type { EditorRenderSystem } from '../systems/EditorRenderSystem.js';
import {
    ERROR_CODES,
    ERROR_TYPES,
    EditorError,
    type FabricObjectWithData,
    type EditorState
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import { EditorFileManager } from './EditorFileManager.js';
import { EditorKeyboardHandler } from './EditorKeyboardHandler.js';
import { EditorDrawingManager } from './EditorDrawingManager.js';
import { EditorUIManager } from './EditorUIManager.js';
import { EditorToolManager } from './EditorToolManager.js';

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

    // テストや統合用の追加API
    createObject(event: any): void;
    startPlatformDrawing(event: any): void;
    finishPlatformDrawing(event: any): void;
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
    clearCurrentStage(): void;
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
    private view!: IEditorView;
    private model!: IEditorModel;
    private store!: EditorStore;
    private unsubscribeStore: (() => void) | null = null;

    // Manager dependencies injected by Builder
    private fileManager!: EditorFileManager;
    private keyboardHandler!: EditorKeyboardHandler;
    private drawingManager!: EditorDrawingManager;
    private uiManager!: EditorUIManager;
    private toolManager!: EditorToolManager;

    // State
    private isInitialized = false;
    private autoSaveEnabled = false;

    constructor(
        view: IEditorView,
        model: IEditorModel
    ) {
        this.view = view;
        this.model = model;
        DebugHelper.log('EditorController constructed');
    }

    /**
     * Set manager dependencies (called by Builder)
     */
    public setManagers(
        fileManager: EditorFileManager,
        keyboardHandler: EditorKeyboardHandler,
        drawingManager: EditorDrawingManager,
        uiManager: EditorUIManager,
        toolManager: EditorToolManager
    ): void {
        this.fileManager = fileManager;
        this.keyboardHandler = keyboardHandler;
        this.drawingManager = drawingManager;
        this.uiManager = uiManager;
        this.toolManager = toolManager;
    }

    /**
     * Set editor system dependency (called by Builder)
     */
    public setEditorSystem(editorSystem: EditorRenderSystem): void {
        this.editorSystem = editorSystem;
    }

    /**
     * Set store dependency (called by Builder)
     */
    public setStore(store: EditorStore): void {
        this.store = store;
        // Subscribe to store changes
        this.unsubscribeStore = subscribeEditorStore((state) => {
            this.uiManager.handleStoreChange(state);
        });
    }

    /**
     * Initialize editor controller
     */
    public async initialize(): Promise<void> {
        try {
            DebugHelper.time('EditorController.initialize', () => {
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
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.SYSTEM,
                { error }
            );
        }
    }

    /**
     * Setup global event listeners
     */
    private setupEventListeners(): void {
        document.addEventListener('keydown', this.keyboardHandler.handleKeyboard);
        window.addEventListener('beforeunload', (e) => {
            if (this.hasUnsavedChanges()) {
                e.preventDefault();
                e.returnValue = 'Unsaved changes will be lost. Are you sure?';
            }
        });
        DebugHelper.log('Global event listeners setup');
    }

    // === Public API Implementation ===

    public selectTool(tool: string): void {
        if (!this.isInitialized) {
            DebugHelper.log('Controller not initialized');
            return;
        }
        this.toolManager.selectTool(tool);
    }

    public createNewStage(): void {
        this.fileManager.createNewStage(this.store, (stageData) => {
            this.editorSystem.loadStageForEditing(stageData);
        });
    }

    public async loadStage(stageId?: number): Promise<void> {
        try {
            const stageData = await this.fileManager.loadStage(stageId);
            this.store.setStageData(stageData);
            this.editorSystem.loadStageForEditing(stageData);
            this.view.updateStageInfo(stageData);
            this.uiManager.updateUIFromModel();
        } catch (error) {
            // Error handling done in fileManager
        }
    }

    public saveStage(): void {
        this.fileManager.saveStage();
    }

    public testStage(): void {
        this.fileManager.testStage();
    }

    public clearStage(): void {
        this.fileManager.clearStage(this.store, () => this.uiManager.updateUIFromModel());
    }

    public deleteSelectedObject(): void {
        this.drawingManager.deleteSelectedObject(() => this.uiManager.updateUIFromModel());
    }

    public duplicateSelectedObject(): void {
        this.drawingManager.duplicateSelectedObject(() => this.uiManager.updateUIFromModel());
    }

    public toggleGrid(): void {
        this.toolManager.toggleGrid();
    }

    public toggleSnap(): void {
        this.toolManager.toggleSnap();
    }

    public dispose(): void {
        document.removeEventListener('keydown', this.keyboardHandler.handleKeyboard);
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
            this.unsubscribeStore = null;
        }
        if (this.editorSystem) {
            this.editorSystem.dispose();
        }
        this.view.dispose();
        this.isInitialized = false;
        DebugHelper.log('EditorController disposed');
    }

    // === Test API ===

    public createObject(event: any): void {
        this.drawingManager.createObject(event);
    }

    public startPlatformDrawing(event: any): void {
        this.drawingManager.startPlatformDrawing(event);
    }

    public finishPlatformDrawing(event: any): void {
        this.drawingManager.finishPlatformDrawing(event);
    }

    // === Callback handlers for render system ===

    public handleObjectSelection(object: FabricObjectWithData | null): void {
        this.uiManager.handleObjectSelection(object);
    }

    public handleObjectModified(object: FabricObjectWithData): void {
        this.uiManager.updateUIFromModel();
        this.triggerAutoSave();
        DebugHelper.log('Object modification handled', {
            objectType: (object as any).data?.type
        });
    }

    public handleStageModified(stageData: StageData): void {
        this.store.setStageData(stageData);
        this.model.setCurrentStage(stageData);
        this.uiManager.updateUIFromModel();
        this.triggerAutoSave();
        DebugHelper.log('Stage modification handled', {
            objectCount: this.model.getObjectCount()
        });
    }

    // === Private helpers ===

    private triggerAutoSave(): void {
        if (this.autoSaveEnabled) {
            this.fileManager.autoSave();
        }
    }

    private hasUnsavedChanges(): boolean {
            // Unsaved changes tracking placeholder
            // See issue #58 for implementation task
            return false;
        }

}


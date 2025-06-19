/**
 * @fileoverview UI state management and event handling for the stage editor
 * @module controllers/EditorUIManager
 * @description Manages UI updates, store changes, and object selection events.
 * Separated to maintain single responsibility principle.
 */

import { DebugHelper } from '../utils/EditorUtils.js';
import type { FabricObjectWithData } from '../types/EditorTypes.js';
import type { StageData } from '../core/StageLoader.js';

/**
 * Editor store interface for state management
 */
export interface EditorStore {
    editor: { selectedTool: string };
    performance: { objectCount: number };
    stage: StageData | null;
    setSelectedObject(object: FabricObjectWithData | null): void;
    setStageData(stageData: StageData): void;
}

/**
 * View interface for UI updates
 */
export interface IEditorView {
    updateToolSelection(tool: string): void;
    updateCurrentTool(tool: string): void;
    updateObjectCount(count: number): void;
    updateStageInfo(stageData: StageData): void;
    showObjectProperties(object: FabricObjectWithData | null): void;
    enableActionButtons(enabled: boolean): void;
}

/**
 * Model interface for data access
 */
export interface IEditorModel {
    getObjectCount(): number;
    setCurrentStage(stageData: StageData): void;
}

/**
 * UI state management and event handling for the stage editor
 * @description Manages UI updates, store changes, and object selection events.
 * Separated to maintain single responsibility principle.
 */
export class EditorUIManager {
    private view: IEditorView;
    private model: IEditorModel;
    private store: EditorStore;
    private isInitialized: boolean = false;

    /**
     * Creates new EditorUIManager instance
     * @param view - Editor view for UI updates
     * @param model - Editor model for data access
     * @param store - Editor store for state management
     */
    constructor(view: IEditorView, model: IEditorModel, store: EditorStore) {
        this.view = view;
        this.model = model;
        this.store = store;
    }

    /**
     * Initialize UI manager
     */
    public initialize(): void {
        this.isInitialized = true;
    }

    /**
     * Handle store state changes
     */
    public handleStoreChange(state: EditorStore): void {
        // Update view based on store changes
        if (this.view && this.isInitialized) {
            this.view.updateToolSelection(state.editor.selectedTool);
            this.view.updateCurrentTool(state.editor.selectedTool);
            this.view.updateObjectCount(state.performance.objectCount);

            if (state.stage) {
                this.view.updateStageInfo(state.stage);
            }
        }
    }

    /**
     * Handle object selection events
     */
    public handleObjectSelection(object: FabricObjectWithData | null): void {
        // Update store instead of model directly
        this.store.setSelectedObject(object);

        this.view.showObjectProperties(object);
        this.view.enableActionButtons(!!object);

        DebugHelper.log('Object selection handled', {
            hasObject: !!object,
            objectType: object ? (object as any).data?.type : null
        });
    }

    /**
     * Handle object modification events
     */
    public handleObjectModified(object: FabricObjectWithData, autoSaveCallback: () => void): void {
        this.updateUIFromModel();
        autoSaveCallback();

        DebugHelper.log('Object modification handled', {
            objectType: (object as any).data?.type
        });
    }

    /**
     * Handle stage modification events
     */
    public handleStageModified(stageData: StageData, autoSaveCallback: () => void): void {
        // Update both store and model
        this.store.setStageData(stageData);
        this.model.setCurrentStage(stageData);
        this.updateUIFromModel();
        autoSaveCallback();

        DebugHelper.log('Stage modification handled', {
            objectCount: this.model.getObjectCount()
        });
    }

    /**
     * Update UI from model data
     */
    public updateUIFromModel(): void {
        const objectCount = this.model.getObjectCount();
        this.view.updateObjectCount(objectCount);
    }
}
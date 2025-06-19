/**
 * @fileoverview File management operations for the stage editor
 * @module controllers/EditorFileManager
 * @description Handles save, load, and export operations for stage data.
 * Separated from EditorController to maintain single responsibility principle.
 */

import type { StageData, StageLoader } from '../core/StageLoader.js';
import { ERROR_CODES, ERROR_TYPES, EditorError } from '../types/EditorTypes.js';
import { DebugHelper, TypeHelper } from '../utils/EditorUtils.js';
import type { EditorRenderSystem } from '../systems/EditorRenderSystem.js';

/** 
 * View layer interface for user feedback operations
 */
export interface IEditorView {
    showErrorMessage(message: string): void;
    showSuccessMessage(message: string): void;
    updateStageInfo(stageData: StageData): void;
}

/**
 * Model layer interface for stage data management
 */
export interface IEditorModel {
    getCurrentStage(): StageData | null;
    setCurrentStage(stageData: StageData): void;
    clearCurrentStage(): void;
    validateStageData(stageData: StageData): boolean;
    exportStageAsJson(): string;
}

/**
 * File management operations for the stage editor
 * @description Handles save, load, and export operations for stage data.
 * Separated from EditorController to maintain single responsibility principle.
 */
export class EditorFileManager {
    private model: IEditorModel;
    private view: IEditorView;
    private stageLoader: StageLoader;
    private editorSystem: EditorRenderSystem;

    /**
     * Creates new EditorFileManager instance
     * @param model - Editor model for stage data management
     * @param view - Editor view for user feedback  
     * @param stageLoader - Stage loader for loading operations
     * @param editorSystem - Editor system for data export
     */
    constructor(
        model: IEditorModel,
        view: IEditorView,
        stageLoader: StageLoader,
        editorSystem: EditorRenderSystem
    ) {
        this.model = model;
        this.view = view;
        this.stageLoader = stageLoader;
        this.editorSystem = editorSystem;
    }

    /**
     * Save current stage data as JSON file
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
     * Load stage data from file
     * @param stageId - Optional stage ID to load
     * @returns Loaded stage data for controller to handle UI updates
     */
    public async loadStage(stageId?: number): Promise<StageData> {
        try {
            let targetStageId: number;

            if (stageId !== undefined) {
                targetStageId = stageId;
            } else {
                const stageIdStr = prompt('Enter stage ID to load:');
                if (!stageIdStr) throw new Error('Load cancelled by user');
                targetStageId = TypeHelper.safeParseInt(stageIdStr, 1);
            }

            const stageData = await this.stageLoader.loadStage(targetStageId);

            if (!this.model.validateStageData(stageData)) {
                throw new EditorError(
                    'Invalid stage data format',
                    ERROR_CODES.STAGE_VALIDATION_FAILED,
                    ERROR_TYPES.VALIDATION,
                    { stageData }
                );
            }

            // Update model and return stage data for controller to handle UI updates
            this.model.setCurrentStage(stageData);

            DebugHelper.log('Stage loaded successfully', { stageId: stageData.id });
            this.view.showSuccessMessage(`Stage ${stageData.id} loaded successfully`);
            
            return stageData;
        } catch (error) {
            DebugHelper.log('Stage loading failed', error);
            this.view.showErrorMessage(`Failed to load stage: ${error}`);
            throw error;
        }
    }

    /**
     * Test stage in a new tab
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
     * Clear all stage objects
     * @param store - Editor store for state management
     * @param updateUICallback - Callback to update UI after clearing
     */
    public clearStage(store: any, updateUICallback: () => void): void {
        if (confirm('Are you sure you want to clear all objects?')) {
            // Clear store first
            store.setStageData(null);

            // Clear render system - use existing methods if available
            if (this.editorSystem) {
                // Try to clear via existing functionality
                try {
                    // Clear the canvas using the new adapter pattern
                    this.editorSystem.clearCanvas();
                    this.editorSystem.updateStageDataFromCanvas();
                } catch (error) {
                    // Fallback - just update stage data
                    this.editorSystem.updateStageDataFromCanvas();
                }
            }

            // Clear model using type-safe method
            this.model.clearCurrentStage();

            // Update UI
            updateUICallback();

            DebugHelper.log('Stage cleared');
        }
    }

    /**
     * Create new stage with default data
     * @param store - Editor store for state management
     * @param updateCallback - Callback to update UI and systems
     */
    public createNewStage(store: any, updateCallback: (stageData: StageData) => void): void {
        try {
            const newStage: StageData = this.createDefaultStageData();

            // Update Zustand store first
            store.setStageData(newStage);

            // Update other systems
            this.model.setCurrentStage(newStage);
            updateCallback(newStage);

            // View will be updated via store subscription
            DebugHelper.log('New stage created', { stageId: newStage.id });
            this.view.showSuccessMessage('New stage created');
        } catch (error) {
            DebugHelper.log('New stage creation failed', error);
            this.view.showErrorMessage('Failed to create new stage');
        }
    }

    /**
     * Create default stage data template
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
     * Auto-save current stage to localStorage
     */
    public autoSave(): void {
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
     * Download stage data as JSON file
     * @param stageData - Stage data to export
     */
    private downloadStageAsJson(stageData: StageData): void {
        this.model.setCurrentStage(stageData);
        const json = this.model.exportStageAsJson();
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
}
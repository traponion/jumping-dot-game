/**
 * @fileoverview Drawing and object creation management for the stage editor
 * @module controllers/EditorDrawingManager
 * @description Manages platform drawing and object creation operations.
 * Separated to maintain single responsibility principle.
 */

import { DebugHelper } from '../utils/EditorUtils.js';
import type { EditorRenderSystem } from '../systems/EditorRenderSystem.js';

/**
 * Model interface for drawing operations
 */
export interface IEditorModel {
    getEditorState(): { selectedTool: string };
}

/**
 * View interface for user feedback
 */
export interface IEditorView {
    showErrorMessage(message: string): void;
    updateObjectCount(count: number): void;
}

/**
 * Drawing and object creation management for the stage editor
 * @description Manages platform drawing and object creation operations.
 * Separated to maintain single responsibility principle.
 */
export class EditorDrawingManager {
    private editorSystem: EditorRenderSystem;
    private model: IEditorModel;
    private view: IEditorView;

    /**
     * Creates new EditorDrawingManager instance
     * @param editorSystem - Render system for drawing operations
     * @param model - Editor model for state access
     * @param view - Editor view for user feedback
     */
    constructor(
        editorSystem: EditorRenderSystem,
        model: IEditorModel,
        view: IEditorView
    ) {
        this.editorSystem = editorSystem;
        this.model = model;
        this.view = view;
    }

    /**
     * Create object based on current tool
     * @param event - Mouse/pointer event with position data
     */
    public createObject(event: any): void {
        try {
            if (!event?.absolutePointer && !event?.pointer) {
                DebugHelper.log('Invalid event object for createObject');
                return;
            }

            const pointer = event.absolutePointer || event.pointer;
            const currentTool = this.model.getEditorState().selectedTool;

            switch (currentTool) {
                case 'spike':
                    this.editorSystem.createSpike(pointer.x, pointer.y);
                    break;
                case 'goal':
                    this.editorSystem.createGoal(pointer.x, pointer.y);
                    break;
                case 'text':
                    this.editorSystem.createText(pointer.x, pointer.y, 'TEXT');
                    break;
                default:
                    DebugHelper.log('Cannot create object for tool', { tool: currentTool });
                    return;
            }

            // Update stage data and UI
            this.updateAfterDrawing();
            DebugHelper.log('Object created via createObject API', {
                tool: currentTool,
                position: pointer
            });
        } catch (error) {
            DebugHelper.log('createObject failed', error);
            this.view.showErrorMessage('Failed to create object');
        }
    }

    /**
     * Start platform drawing operation
     * @param event - Mouse/pointer event with position data
     */
    public startPlatformDrawing(event: any): void {
        try {
            if (!event?.absolutePointer && !event?.pointer) {
                DebugHelper.log('Invalid event object for startPlatformDrawing');
                return;
            }

            const pointer = event.absolutePointer || event.pointer;
            this.editorSystem.startPlatformDrawing(pointer.x, pointer.y);

            DebugHelper.log('Platform drawing started', { position: pointer });
        } catch (error) {
            DebugHelper.log('startPlatformDrawing failed', error);
            this.view.showErrorMessage('Failed to start platform drawing');
        }
    }

    /**
     * Finish platform drawing operation
     * @param event - Mouse/pointer event with position data
     */
    public finishPlatformDrawing(event: any): void {
        try {
            if (!event?.absolutePointer && !event?.pointer) {
                DebugHelper.log('Invalid event object for finishPlatformDrawing');
                return;
            }

            const pointer = event.absolutePointer || event.pointer;
            this.editorSystem.finishPlatformDrawing(pointer.x, pointer.y);

            // Update stage data and UI
            this.updateAfterDrawing();

            DebugHelper.log('Platform drawing finished', { position: pointer });
        } catch (error) {
            DebugHelper.log('finishPlatformDrawing failed', error);
            this.view.showErrorMessage('Failed to finish platform drawing');
        }
    }

    /**
     * Delete selected object
     */
    public deleteSelectedObject(updateUICallback: () => void): void {
        try {
            this.editorSystem.deleteSelectedObject();

            // Update stage data and sync with store
            this.editorSystem.updateStageDataFromCanvas();
            updateUICallback();
            DebugHelper.log('Selected object deleted');
        } catch (error) {
            DebugHelper.log('Object deletion failed', error);
            this.view.showErrorMessage('Failed to delete object');
        }
    }

    /**
     * Duplicate selected object
     */
    public duplicateSelectedObject(updateUICallback: () => void): void {
        try {
            this.editorSystem.duplicateSelectedObject();

            // Update stage data and sync with store
            this.editorSystem.updateStageDataFromCanvas();
            updateUICallback();
            DebugHelper.log('Selected object duplicated');
        } catch (error) {
            DebugHelper.log('Object duplication failed', error);
            this.view.showErrorMessage('Failed to duplicate object');
        }
    }

    /**
     * Update stage data and UI after drawing operations
     */
    private updateAfterDrawing(): void {
        this.editorSystem.updateStageDataFromCanvas();
        // Note: Object count update would need to be handled by the main controller
        // since it requires model access that this class doesn't have
    }
}
/**
 * @fileoverview Tool selection and editor mode management
 * @module controllers/EditorToolManager
 * @description Manages tool selection, grid toggle, snap functionality.
 * Separated to maintain single responsibility principle.
 */

import { DebugHelper } from '../utils/EditorUtils.js';
import { isValidEditorTool } from '../types/EditorTypes.js';

/**
 * Store interface for tool management
 */
export interface EditorStore {
    selectTool(tool: string): void;
    toggleGrid(): void;
    toggleSnap(): void;
    getEditorState(): { gridEnabled: boolean; snapToGrid: boolean };
}

/**
 * View interface for error messages
 */
export interface IEditorView {
    showErrorMessage(message: string): void;
}

/**
 * Editor system interface for tool operations
 */
export interface EditorRenderSystem {
    setSelectedTool(tool: string): void;
    toggleGrid(): void;
    toggleSnapToGrid(): void;
}

/**
 * Tool selection and editor mode management
 * @description Manages tool selection, grid toggle, snap functionality.
 * Separated to maintain single responsibility principle.
 */
export class EditorToolManager {
    private store: EditorStore;
    private view: IEditorView;
    private editorSystem: EditorRenderSystem;
    private isInitialized: boolean = false;

    /**
     * Creates new EditorToolManager instance
     * @param store - Editor store for state management
     * @param view - Editor view for user feedback
     * @param editorSystem - Editor render system for tool operations
     */
    constructor(store: EditorStore, view: IEditorView, editorSystem: EditorRenderSystem) {
        this.store = store;
        this.view = view;
        this.editorSystem = editorSystem;
    }

    /**
     * Initialize tool manager
     */
    public initialize(): void {
        this.isInitialized = true;
    }

    /**
     * Select editor tool
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
            // Update Zustand store first
            this.store.selectTool(tool);

            // Update render system
            this.editorSystem.setSelectedTool(tool);

            // View will be updated via store subscription
            DebugHelper.log('Tool selected', { tool });
        } catch (error) {
            DebugHelper.log('Tool selection failed', { tool, error });
            this.view.showErrorMessage('Failed to select tool');
        }
    }

    /**
     * Toggle grid display
     */
    public toggleGrid(): void {
        try {
            // Update Zustand store first
            this.store.toggleGrid();

            // Update render system
            this.editorSystem.toggleGrid();

            DebugHelper.log('Grid toggled', { enabled: this.store.getEditorState().gridEnabled });
        } catch (error) {
            DebugHelper.log('Grid toggle failed', error);
            this.view.showErrorMessage('Failed to toggle grid');
        }
    }

    /**
     * Toggle snap to grid functionality
     */
    public toggleSnap(): void {
        try {
            // Update Zustand store first
            this.store.toggleSnap();

            // Update render system
            this.editorSystem.toggleSnapToGrid();

            DebugHelper.log('Snap toggled', { enabled: this.store.getEditorState().snapToGrid });
        } catch (error) {
            DebugHelper.log('Snap toggle failed', error);
            this.view.showErrorMessage('Failed to toggle snap');
        }
    }
}
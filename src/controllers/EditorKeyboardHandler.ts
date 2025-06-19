/**
 * @fileoverview Keyboard input handling for the stage editor
 * @module controllers/EditorKeyboardHandler
 * @description Manages keyboard shortcuts and input events.
 * Separated to maintain single responsibility principle.
 */

import { KEYBOARD_SHORTCUTS, type KeyboardEventHandler } from '../types/EditorTypes.js';
import { EventHelper } from '../utils/EditorUtils.js';

/**
 * Controller interface for keyboard handler callbacks
 */
export interface IEditorController {
    selectTool(tool: string): void;
    deleteSelectedObject(): void;
    duplicateSelectedObject(): void;
    toggleGrid(): void;
    saveStage(): void;
    createNewStage(): void;
    loadStage(stageId?: number): Promise<void>;
}

/**
 * Keyboard input handling for the stage editor
 * @description Manages keyboard shortcuts and input events.
 * Separated to maintain single responsibility principle.
 */
export class EditorKeyboardHandler {
    private controller: IEditorController;
    private isInitialized: boolean = false;

    /**
     * Creates new EditorKeyboardHandler instance
     * @param controller - Main editor controller reference
     */
    constructor(controller: IEditorController) {
        this.controller = controller;
    }

    /**
     * Initialize keyboard handler
     */
    public initialize(): void {
        this.isInitialized = true;
        this.setupKeyboardListeners();
    }

    /**
     * Setup keyboard event listeners
     */
    private setupKeyboardListeners(): void {
        document.addEventListener('keydown', this.handleKeyboard);
    }

    /**
     * Handle keyboard events with shortcuts
     */
    public handleKeyboard: KeyboardEventHandler = (e) => {
        if (!this.isInitialized) return;

        const normalizedKey = EventHelper.normalizeKeyboardEvent(e);

        // Tool shortcuts
        const toolShortcut =
            KEYBOARD_SHORTCUTS.TOOLS[e.key as keyof typeof KEYBOARD_SHORTCUTS.TOOLS];
        if (toolShortcut) {
            this.controller.selectTool(toolShortcut);
            return;
        }

        // Action shortcuts
        switch (normalizedKey) {
            case 'Delete':
            case 'Backspace':
                this.controller.deleteSelectedObject();
                e.preventDefault();
                break;
            case 'Ctrl+KeyD':
            case 'Cmd+KeyD':
                this.controller.duplicateSelectedObject();
                e.preventDefault();
                break;
            case 'Ctrl+KeyG':
            case 'Cmd+KeyG':
                this.controller.toggleGrid();
                e.preventDefault();
                break;
            case 'Ctrl+KeyS':
            case 'Cmd+KeyS':
                this.controller.saveStage();
                e.preventDefault();
                break;
            case 'Ctrl+KeyN':
            case 'Cmd+KeyN':
                this.controller.createNewStage();
                e.preventDefault();
                break;
            case 'Ctrl+KeyO':
            case 'Cmd+KeyO':
                this.controller.loadStage();
                e.preventDefault();
                break;
        }
    };

    /**
     * Dispose keyboard handler
     */
    public dispose(): void {
        document.removeEventListener('keydown', this.handleKeyboard);
        this.isInitialized = false;
    }
}
/**
 * @fileoverview Builder pattern for EditorController construction
 * @module controllers/EditorControllerBuilder
 * @description Separates manager initialization logic from EditorController.
 * Implements Builder pattern for clean dependency injection.
 */

import { EditorController, type IEditorView, type IEditorModel } from './EditorController.js';
import { EditorFileManager } from './EditorFileManager.js';
import { EditorKeyboardHandler } from './EditorKeyboardHandler.js';
import { EditorDrawingManager } from './EditorDrawingManager.js';
import { EditorUIManager } from './EditorUIManager.js';
import { EditorToolManager } from './EditorToolManager.js';
import { StageLoader } from '../core/StageLoader.js';
import { createEditorRenderSystem } from '../systems/RenderSystemFactory.js';
import { getEditorStore } from '../stores/EditorZustandStore.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import type { EditorCallbacks } from '../types/EditorTypes.js';

/**
 * Builder for constructing EditorController with all dependencies
 * @description Uses Builder pattern to separate construction logic from business logic.
 * Handles manager initialization and dependency injection.
 */
export class EditorControllerBuilder {
    private canvas: HTMLCanvasElement;
    private view: IEditorView;
    private model: IEditorModel;

    /**
     * Creates new EditorControllerBuilder
     * @param canvas - Canvas element for rendering
     * @param view - Editor view implementation
     * @param model - Editor model implementation
     */
    constructor(canvas: HTMLCanvasElement, view: IEditorView, model: IEditorModel) {
        this.canvas = canvas;
        this.view = view;
        this.model = model;
    }

    /**
     * Build fully configured EditorController
     * @returns Configured EditorController with all managers injected
     */
    public build(): EditorController {
        const controller = new EditorController(this.view, this.model);
        
        // Get dependencies
        const stageLoader = new StageLoader();
        const store = getEditorStore();
        
        // Initialize editor system with callbacks
        const callbacks: EditorCallbacks = {
            onObjectSelected: (object) => controller.handleObjectSelection(object),
            onObjectModified: (object) => controller.handleObjectModified(object),
            onStageModified: (stageData) => controller.handleStageModified(stageData)
        };
        const editorSystem = createEditorRenderSystem(this.canvas, callbacks as any);
        
        // Create managers with proper interfaces
        const fileManager = new EditorFileManager(this.model, this.view, stageLoader, editorSystem);
        const keyboardHandler = new EditorKeyboardHandler(controller);
        const drawingManager = new EditorDrawingManager(editorSystem, this.model, this.view);
        const uiManager = new EditorUIManager(this.view, this.model, store);
        const toolManager = new EditorToolManager(store, this.view, editorSystem);
        
        // Initialize UI-related managers
        uiManager.initialize(controller);
        toolManager.initialize();
        keyboardHandler.initialize();
        
        // Inject all dependencies into controller
        controller.setManagers(fileManager, keyboardHandler, drawingManager, uiManager, toolManager);
        controller.setEditorSystem(editorSystem);
        controller.setStore(store);
        
        DebugHelper.log('EditorController built with all managers');
        
        return controller;
    }
}

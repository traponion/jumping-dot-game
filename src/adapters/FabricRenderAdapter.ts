import * as fabric from 'fabric';
import {
    EDITOR_CONFIG,
    EDITOR_TOOLS,
    ERROR_CODES,
    ERROR_TYPES,
    EditorError,
    type EditorTool
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import { EditorInputHandler } from './EditorInputHandler.js';
import type { EditorCallbacks, EditorState, IRenderAdapter, StageData } from './IRenderAdapter.js';
import { ObjectDrawer } from './ObjectDrawer.js';
import { StageDataConverter } from './StageDataConverter.js';

/**
 * FabricRenderAdapter (v2) - Pure adapter implementation following Nana-chan's guidance
 *
 * Key Changes from v1:
 * - NO INHERITANCE from FabricRenderSystem (composition over inheritance)
 * - Uses delegation pattern with focused component classes
 * - Cleaner separation of concerns
 * - Follows Dependency Inversion Principle
 *
 * Architecture:
 * - FabricRenderAdapter: Core adapter orchestration
 * - EditorInputHandler: Input processing
 * - StageDataConverter: Data conversion
 * - ObjectDrawer: Drawing operations
 *
 * This follows the "Adapter should make A usable as B" principle correctly.
 */
export class FabricRenderAdapter implements IRenderAdapter {
    private canvas: fabric.Canvas;
    private editorState: EditorState;
    private callbacks: EditorCallbacks;

    // Component delegation (composition over inheritance)
    private inputHandler: EditorInputHandler;
    private stageConverter: StageDataConverter;
    private objectDrawer: ObjectDrawer;

    constructor(canvasElement: HTMLCanvasElement, callbacks: EditorCallbacks = {}) {
        this.callbacks = callbacks;
        this.editorState = {
            selectedTool: EDITOR_TOOLS.SELECT,
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };

        // Initialize Fabric.js canvas
        this.canvas = this.initializeFabricCanvas(canvasElement);

        // Create component instances (delegation pattern)
        this.objectDrawer = new ObjectDrawer(this.canvas);
        this.inputHandler = new EditorInputHandler(this, this.objectDrawer);
        this.stageConverter = new StageDataConverter(this, this.objectDrawer);

        // Set up event system
        this.setupEventListeners(callbacks);

        DebugHelper.log('FabricRenderAdapter v2 initialized', {
            canvasSize: { width: this.canvas.width, height: this.canvas.height },
            state: this.editorState
        });
    }

    // ===== IRenderAdapter Core Implementation =====

    /**
     * Render all canvas objects
     */
    renderAll(): void {
        try {
            this.canvas.renderAll();
        } catch (error) {
            DebugHelper.log('Error during renderAll', error);
        }
    }

    /**
     * Clear the canvas
     */
    clearCanvas(): void {
        try {
            this.canvas.clear();
            DebugHelper.log('Canvas cleared');
        } catch (error) {
            throw new EditorError(
                'Failed to clear canvas',
                ERROR_CODES.CANVAS_OPERATION_FAILED,
                ERROR_TYPES.FABRIC,
                { error }
            );
        }
    }

    /**
     * Dispose of the canvas and clean up resources
     */
    dispose(): void {
        try {
            this.removeEventListeners();
            this.canvas.dispose();
            DebugHelper.log('Canvas disposed');
        } catch (error) {
            DebugHelper.log('Error during disposal', error);
        }
    }

    /**
     * Get current editor state
     */
    getEditorState(): EditorState {
        return { ...this.editorState };
    }

    /**
     * Render grid based on enabled state
     */
    renderGrid(enabled: boolean): void {
        try {
            this.editorState.gridEnabled = enabled;

            // Remove existing grid objects
            this.removeGridObjects();

            if (!enabled) {
                this.renderAll();
                return;
            }

            // Draw new grid
            this.drawGrid();
            this.renderAll();

            DebugHelper.log('Grid rendered', { enabled });
        } catch (error) {
            throw new EditorError(
                'Failed to render grid',
                ERROR_CODES.CANVAS_OPERATION_FAILED,
                ERROR_TYPES.FABRIC,
                { enabled, error }
            );
        }
    }

    /**
     * Get currently selected object
     */
    getSelectedObject(): unknown | null {
        return this.editorState.selectedObject;
    }

    /**
     * Select an object
     */
    selectObject(object: unknown | null): void {
        this.editorState.selectedObject = object;

        if (object && object instanceof fabric.Object) {
            this.canvas.setActiveObject(object);
        } else {
            this.canvas.discardActiveObject();
        }

        this.callbacks.onObjectSelected?.(object);
        this.renderAll();

        DebugHelper.log('Object selected', { hasObject: !!object });
    }

    /**
     * Delete currently selected object
     */
    deleteSelectedObject(): void {
        if (
            this.editorState.selectedObject &&
            this.editorState.selectedObject instanceof fabric.Object
        ) {
            this.canvas.remove(this.editorState.selectedObject);
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
            this.notifyStageModified();
            this.renderAll();

            DebugHelper.log('Object deleted');
        }
    }

    /**
     * Duplicate currently selected object
     */
    duplicateSelectedObject(): void {
        if (
            !(
                this.editorState.selectedObject &&
                this.editorState.selectedObject instanceof fabric.Object
            )
        ) {
            return;
        }

        try {
            const original = this.editorState.selectedObject;
            const bounds = this.objectDrawer.getObjectBounds(original);
            const offset = { x: 20, y: 20 };
            const newPosition = { x: bounds.x + offset.x, y: bounds.y + offset.y };

            // Get object type from data
            const objectData = this.objectDrawer.getObjectData(original);
            const objectType = objectData?.type;

            switch (objectType) {
                case EDITOR_TOOLS.PLATFORM:
                    this.objectDrawer.createPlatform(newPosition, {
                        x: newPosition.x + bounds.width,
                        y: newPosition.y
                    });
                    break;
                case EDITOR_TOOLS.SPIKE:
                    this.objectDrawer.createSpike(newPosition, {
                        width: bounds.width,
                        height: bounds.height
                    });
                    break;
                case EDITOR_TOOLS.GOAL:
                    this.objectDrawer.createGoal(newPosition, {
                        width: bounds.width,
                        height: bounds.height
                    });
                    break;
                case EDITOR_TOOLS.TEXT:
                    this.objectDrawer.createText(newPosition, 'TEXT');
                    break;
                default:
                    throw new EditorError(
                        `Cannot duplicate object of type: ${objectType}`,
                        ERROR_CODES.UNSUPPORTED_OPERATION,
                        ERROR_TYPES.EDITOR,
                        { objectType, original }
                    );
            }

            this.notifyStageModified();
            this.renderAll();

            DebugHelper.log('Object duplicated', { objectType, newPosition });
        } catch (error) {
            throw new EditorError(
                'Failed to duplicate object',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { selectedObject: this.editorState.selectedObject, error }
            );
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners(callbacks: EditorCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };

        // Selection events
        this.canvas.on('selection:created', (e: any) => {
            const selectedObject = e.selected?.[0] || null;
            this.handleObjectSelection(selectedObject);
        });

        this.canvas.on('selection:updated', (e: any) => {
            const selectedObject = e.selected?.[0] || null;
            this.handleObjectSelection(selectedObject);
        });

        this.canvas.on('selection:cleared', () => {
            this.handleObjectSelection(null);
        });

        // Modification events
        this.canvas.on('object:modified', (e: any) => {
            if (e.target) {
                this.callbacks.onObjectModified?.(e.target);
                this.notifyStageModified();
            }
        });

        // Mouse events - delegate to input handler
        this.canvas.on('mouse:down', (e: any) => {
            const pointer = this.canvas.getPointer(e.e);
            this.inputHandler.handleMouseDown(pointer);
        });

        this.canvas.on('mouse:move', (e: any) => {
            const pointer = this.canvas.getPointer(e.e);
            this.inputHandler.handleMouseMove(pointer);
        });

        this.canvas.on('mouse:up', (e: any) => {
            const pointer = this.canvas.getPointer(e.e);
            this.inputHandler.handleMouseUp(pointer);
        });
    }

    /**
     * Remove event listeners
     */
    removeEventListeners(): void {
        this.canvas.off(); // Remove all event listeners
    }

    // ===== Public API for Editor Integration =====

    // ===== Private Implementation Methods =====

    /**
     * Initialize Fabric.js canvas with editor settings
     */
    private initializeFabricCanvas(canvasElement: HTMLCanvasElement): fabric.Canvas {
        try {
            const canvas = new fabric.Canvas(canvasElement, {
                width: canvasElement.width,
                height: canvasElement.height,
                backgroundColor: 'white',
                selection: true, // Enable selection in editor mode
                renderOnAddRemove: true, // Auto-render when objects are added/removed
                allowTouchScrolling: false,
                interactive: true, // Enable interaction in editor mode
                enableRetinaScaling: true,
                stopContextMenu: true
            });

            return canvas;
        } catch (error) {
            throw new EditorError(
                'Failed to initialize Fabric.js canvas',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC,
                { canvasElement, error }
            );
        }
    }

    /**
     * Handle object selection
     */
    private handleObjectSelection(object: fabric.Object | null): void {
        this.editorState.selectedObject = object;
        this.callbacks.onObjectSelected?.(object);

        DebugHelper.log('Object selection changed', {
            hasObject: !!object,
            objectType: object ? this.objectDrawer.getObjectData(object)?.type : null
        });
    }

    /**
     * Remove grid objects from canvas
     */
    private removeGridObjects(): void {
        const objects = this.canvas.getObjects();
        const gridObjects = objects.filter((obj) => {
            const data = this.objectDrawer.getObjectData(obj);
            return data?.isGrid === true;
        });

        gridObjects.forEach((obj) => this.canvas.remove(obj));
    }

    /**
     * Draw grid lines
     */
    private drawGrid(): void {
        const canvasWidth = this.canvas.width || EDITOR_CONFIG.CANVAS_SIZE.width;
        const canvasHeight = this.canvas.height || EDITOR_CONFIG.CANVAS_SIZE.height;
        const gridSize = EDITOR_CONFIG.GRID_SIZE;

        // Draw vertical lines
        for (let x = 0; x <= canvasWidth; x += gridSize) {
            this.objectDrawer.createGridLine({ x, y: 0 }, { x, y: canvasHeight });
        }

        // Draw horizontal lines
        for (let y = 0; y <= canvasHeight; y += gridSize) {
            this.objectDrawer.createGridLine({ x: 0, y }, { x: canvasWidth, y });
        }
    }

    /**
     * Notify that stage has been modified
     */
    private notifyStageModified(): void {
        try {
            const stageData = this.stageConverter.exportStageData();
            this.callbacks.onStageModified?.(stageData);
        } catch (error) {
            DebugHelper.log('Failed to notify stage modified', error);
        }
    }

    // ===== Legacy Compatibility Methods =====
    // These methods maintain compatibility with EditorRenderSystem
    // They delegate to appropriate component classes

    /**
     * Create spike at position (legacy compatibility)
     */
    createSpike(x: number, y: number): void {
        const position = { x, y };
        const spike = this.objectDrawer.createSpike(position);
        if (spike instanceof fabric.Object) {
            this.canvas.add(spike);
            this.notifyStageModified();
            this.renderAll();
        }
        DebugHelper.log('Legacy createSpike called', { x, y });
    }

    /**
     * Create goal at position (legacy compatibility)
     */
    createGoal(x: number, y: number, width = 40, height = 50): void {
        const position = { x, y };
        const size = { width, height };
        const goal = this.objectDrawer.createGoal(position, size);
        if (goal instanceof fabric.Object) {
            this.canvas.add(goal);
            this.notifyStageModified();
            this.renderAll();
        }
        DebugHelper.log('Legacy createGoal called', { x, y, width, height });
    }

    /**
     * Create text at position (legacy compatibility)
     */
    createText(x: number, y: number, text: string): void {
        const position = { x, y };
        const textObject = this.objectDrawer.createText(position, text);
        if (textObject instanceof fabric.Object) {
            this.canvas.add(textObject);
            this.notifyStageModified();
            this.renderAll();
        }
        DebugHelper.log('Legacy createText called', { x, y, text });
    }

    /**
     * Start platform drawing (legacy compatibility)
     */
    startPlatformDrawing(x: number, y: number): void {
        const position = { x, y };
        this.inputHandler.startPlatformDrawing(position);
        DebugHelper.log('Legacy startPlatformDrawing called', { x, y });
    }

    /**
     * Finish platform drawing (legacy compatibility)
     */
    finishPlatformDrawing(x: number, y: number): void {
        // InputHandler tracks drawing state internally, so we just call finish
        this.inputHandler.finishPlatformDrawing();
        DebugHelper.log('Legacy finishPlatformDrawing called', { x, y });
    }

    /**
     * Set selected tool (legacy compatibility)
     */
    setSelectedTool(tool: string): void {
        this.editorState.selectedTool = tool as EditorTool;

        // Update canvas interaction mode
        if (tool === EDITOR_TOOLS.SELECT) {
            this.canvas.selection = true;
        } else {
            this.canvas.discardActiveObject();
            this.canvas.selection = false;
        }

        this.renderAll();
        this.inputHandler.setSelectedTool(tool);
        DebugHelper.log('Legacy setSelectedTool called', { tool });
    }

    /**
     * Toggle grid (legacy compatibility)
     */
    toggleGrid(): void {
        this.inputHandler.toggleGrid();
        DebugHelper.log('Legacy toggleGrid called');
    }

    /**
     * Toggle snap to grid (legacy compatibility)
     */
    toggleSnapToGrid(): void {
        this.editorState.snapToGrid = !this.editorState.snapToGrid;
        this.inputHandler.toggleSnapToGrid();
        DebugHelper.log('Legacy toggleSnapToGrid called');
    }

    /**
     * Load stage for editing (legacy compatibility)
     */
    loadStageForEditing(stageData: StageData): void {
        this.stageConverter.loadStageForEditing(stageData);
        DebugHelper.log('Legacy loadStageForEditing called');
    }

    /**
     * Export stage data (legacy compatibility)
     */
    exportStageData(): StageData {
        const stageData = this.stageConverter.exportStageData();
        DebugHelper.log('Legacy exportStageData called');
        return stageData;
    }

    // ===== Public API for Components =====
    // These methods allow component classes to access canvas state

    /**
     * Get all editable objects from canvas (excluding grid objects)
     * Used by StageDataConverter to export stage data
     */
    public getEditableObjects(): fabric.Object[] {
        const allObjects = this.canvas.getObjects();
        return allObjects.filter((obj) => {
            const data = this.objectDrawer.getObjectData(obj);
            return !data?.isGrid; // Exclude grid objects
        });
    }

    /**
     * Get canvas reference for advanced operations
     * Used by component classes when needed
     */
    public getCanvas(): fabric.Canvas {
        return this.canvas;
    }
}

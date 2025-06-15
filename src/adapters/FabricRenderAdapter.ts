import * as fabric from 'fabric';
import { FabricRenderSystem } from '../systems/FabricRenderSystem.js';
import type { Platform, Spike, Goal, StageData, TextElement } from '../core/StageLoader.js';
import type { IRenderAdapter, EditorState, EditorCallbacks, StageData as AdapterStageData } from './IRenderAdapter.js';
import {
    type FabricObjectWithData,
    type MouseEventHandler,
    type ObjectCreationParams,
    EDITOR_TOOLS,
    EDITOR_CONFIG,
    isFabricObjectWithData,
    isPlatformObject,
    isSpikeObject,
    isGoalObject,
    isTextObject,
    isGridObject,
    EditorError,
    ERROR_CODES,
    ERROR_TYPES
} from '../types/EditorTypes.js';

import {
    FabricHelper,
    ObjectFactory,
    DebugHelper
} from '../utils/EditorUtils.js';

/**
 * Fabric.js implementation of IRenderAdapter
 * Handles all rendering operations using Fabric.js library
 */
export class FabricRenderAdapter extends FabricRenderSystem implements IRenderAdapter {
    private editorState: EditorState;
    private callbacks: EditorCallbacks;
    private stageData: StageData | null = null;
    
    constructor(canvasElement: HTMLCanvasElement, callbacks: EditorCallbacks = {}) {
        super(canvasElement);
        
        this.callbacks = callbacks;
        this.editorState = {
            selectedTool: EDITOR_TOOLS.SELECT,
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };
        
        this.initializeEditorMode();
        this.setupEventListeners();
        
        DebugHelper.log('FabricRenderAdapter initialized', {
            canvasSize: { width: this.canvas.width, height: this.canvas.height },
            state: this.editorState
        });
    }

    // IRenderAdapter implementation
    public renderAll(): void {
        this.canvas.renderAll();
    }

    public clearCanvas(): void {
        this.canvas.clear();
    }

    public dispose(): void {
        this.canvas.dispose();
    }

    public getEditorState(): EditorState {
        return { ...this.editorState };
    }

    public setSelectedTool(tool: string): void {
        this.editorState.selectedTool = tool as typeof EDITOR_TOOLS[keyof typeof EDITOR_TOOLS];
        
        // Update canvas selection mode
        if (tool === EDITOR_TOOLS.SELECT) {
            this.canvas.selection = true;
        } else {
            this.canvas.discardActiveObject();
            this.canvas.selection = false;
        }
        
        this.canvas.renderAll();
        DebugHelper.log('Tool selected', { tool });
    }

    public toggleGrid(): void {
        this.editorState.gridEnabled = !this.editorState.gridEnabled;
        this.renderGrid();
        DebugHelper.log('Grid toggled', { enabled: this.editorState.gridEnabled });
    }

    public toggleSnapToGrid(): void {
        this.editorState.snapToGrid = !this.editorState.snapToGrid;
        DebugHelper.log('Snap to grid toggled', { enabled: this.editorState.snapToGrid });
    }

    public deleteSelectedObject(): void {
        if (this.editorState.selectedObject) {
            this.canvas.remove(this.editorState.selectedObject as fabric.Object);
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
            this.updateStageDataFromCanvas();
            this.canvas.renderAll();
            
            DebugHelper.log('Object deleted');
        }
    }

    public duplicateSelectedObject(): void {
        if (this.editorState.selectedObject) {
            const original = this.editorState.selectedObject;
            // Create a copy offset by 20 pixels
            const bounds = FabricHelper.getObjectBounds(original);
            const newPosition = { x: bounds.left + 20, y: bounds.top + 20 };
            
            if (isPlatformObject(original)) {
                const line = original as unknown as fabric.Line;
                const newLine = new fabric.Line([
                    line.x1! + 20, line.y1! + 20,
                    line.x2! + 20, line.y2! + 20
                ], {
                    stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                    strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                    selectable: true
                });
                FabricHelper.setObjectData(newLine, { type: EDITOR_TOOLS.PLATFORM });
                this.canvas.add(newLine);
            } else if (isSpikeObject(original)) {
                const spike = ObjectFactory.createSpike({
                    position: newPosition,
                    size: { width: bounds.width, height: bounds.height }
                });
                this.canvas.add(spike);
            } else if (isGoalObject(original)) {
                const goal = ObjectFactory.createGoal({
                    position: newPosition,
                    size: { width: bounds.width, height: bounds.height }
                });
                this.canvas.add(goal);
            } else if (isTextObject(original)) {
                const text = original as unknown as fabric.Text;
                const newText = ObjectFactory.createText({
                    position: newPosition,
                    text: text.text || 'TEXT'
                });
                this.canvas.add(newText);
            }
            
            this.updateStageDataFromCanvas();
            this.canvas.renderAll();
            DebugHelper.log('Object duplicated');
        }
    }

    public loadStageForEditing(stageData: AdapterStageData): void {
        this.stageData = stageData as StageData;
        this.clearCanvas();
        this.renderGrid();
        
        // Render stage objects as editable Fabric.js objects
        this.renderEditableObjects(stageData as StageData);
        
        this.canvas.renderAll();
        DebugHelper.log('Stage loaded for editing', { stageId: stageData.id });
    }

    public exportStageData(): AdapterStageData {
        return this.generateStageDataFromCanvas() as AdapterStageData;
    }

    // Private methods for editor functionality
    private initializeEditorMode(): void {
        try {
            // Enable Fabric.js interactive features
            this.canvas.selection = true;
            this.canvas.allowTouchScrolling = true;
            this.canvas.preserveObjectStacking = true;
            
            DebugHelper.log('Editor mode enabled');
        } catch (error) {
            throw new EditorError(
                'Failed to initialize editor mode',
                ERROR_CODES.CANVAS_INIT_FAILED,
                ERROR_TYPES.FABRIC,
                { error }
            );
        }
    }

    private setupEventListeners(): void {
        this.setupSelectionEvents();
        this.setupModificationEvents();
        this.setupMouseEvents();
    }

    private setupSelectionEvents(): void {
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
    }

    private setupModificationEvents(): void {
        this.canvas.on('object:modified', (e: any) => {
            if (e.target && isFabricObjectWithData(e.target)) {
                this.callbacks.onObjectModified?.(e.target);
                this.updateStageDataFromCanvas();
            }
        });
    }

    private setupMouseEvents(): void {
        this.canvas.on('mouse:down', this.handleMouseDown.bind(this));
        this.canvas.on('mouse:move', this.handleMouseMove.bind(this));
        this.canvas.on('mouse:up', this.handleMouseUp.bind(this));
    }

    private handleObjectSelection(object: fabric.Object | null): void {
        const typedObject = object && isFabricObjectWithData(object) ? object : null;
        this.editorState.selectedObject = typedObject;
        this.callbacks.onObjectSelected?.(typedObject);
        
        DebugHelper.log('Object selected', {
            objectType: typedObject ? FabricHelper.getObjectType(typedObject) : null,
            objectData: typedObject?.data
        });
    }

    private handleMouseDown: MouseEventHandler = (e) => {
        if (this.editorState.selectedTool === EDITOR_TOOLS.SELECT) return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.getSnappedPosition(pointer);
        
        this.editorState.isDrawing = true;
        
        try {
            switch (this.editorState.selectedTool) {
                case EDITOR_TOOLS.PLATFORM:
                    this.startDrawingPlatform(snappedPointer);
                    break;
                case EDITOR_TOOLS.SPIKE:
                    this.placeObject(EDITOR_TOOLS.SPIKE, snappedPointer);
                    break;
                case EDITOR_TOOLS.GOAL:
                    this.placeObject(EDITOR_TOOLS.GOAL, snappedPointer);
                    break;
                case EDITOR_TOOLS.TEXT:
                    this.placeObject(EDITOR_TOOLS.TEXT, snappedPointer);
                    break;
            }
        } catch (error) {
            DebugHelper.log('Error during object creation', error);
            this.editorState.isDrawing = false;
        }
    };

    private handleMouseMove: MouseEventHandler = (e) => {
        if (!this.editorState.isDrawing) return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.getSnappedPosition(pointer);

        if (this.editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.updateDrawingPlatform(snappedPointer);
        }
    };

    private handleMouseUp: MouseEventHandler = () => {
        if (!this.editorState.isDrawing) return;

        this.editorState.isDrawing = false;

        if (this.editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.finishDrawingPlatform();
        }

        this.updateStageDataFromCanvas();
    };

    private getSnappedPosition(pointer: { x: number; y: number }): { x: number; y: number } {
        if (!this.editorState.snapToGrid) return pointer;
        return FabricHelper.snapToGrid(pointer, EDITOR_CONFIG.GRID_SIZE);
    }

    private startDrawingPlatform(pointer: { x: number; y: number }): void {
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: EDITOR_CONFIG.COLORS.PLATFORM,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
            selectable: false
        });
        
        FabricHelper.setObjectData(line, { type: EDITOR_TOOLS.PLATFORM, isDrawing: true });
        this.canvas.add(line);
        this.canvas.renderAll();
    }

    private updateDrawingPlatform(pointer: { x: number; y: number }): void {
        const objects = this.canvas.getObjects();
        const drawingPlatform = objects.find(obj => 
            isFabricObjectWithData(obj) && 
            obj.data?.type === EDITOR_TOOLS.PLATFORM && 
            obj.data?.isDrawing
        ) as fabric.Line;

        if (drawingPlatform) {
            drawingPlatform.set({
                x2: pointer.x,
                y2: pointer.y
            });
            this.canvas.renderAll();
        }
    }

    private finishDrawingPlatform(): void {
        const objects = this.canvas.getObjects();
        const drawingPlatform = objects.find(obj => 
            isFabricObjectWithData(obj) && 
            obj.data?.type === EDITOR_TOOLS.PLATFORM && 
            obj.data?.isDrawing
        ) as fabric.Line;

        if (drawingPlatform) {
            drawingPlatform.set({ selectable: true });
            FabricHelper.setObjectData(drawingPlatform, { 
                type: EDITOR_TOOLS.PLATFORM, 
                isDrawing: false 
            });
            this.canvas.renderAll();
        }
    }

    private placeObject(type: typeof EDITOR_TOOLS[keyof typeof EDITOR_TOOLS], position: { x: number; y: number }): void {
        let object: fabric.Object;
        
        const params: ObjectCreationParams = { position };
        
        switch (type) {
            case EDITOR_TOOLS.SPIKE:
                object = ObjectFactory.createSpike(params);
                break;
            case EDITOR_TOOLS.GOAL:
                object = ObjectFactory.createGoal(params);
                break;
            case EDITOR_TOOLS.TEXT:
                object = ObjectFactory.createText(params);
                break;
            default:
                throw new EditorError(
                    `Unsupported object type: ${type}`,
                    ERROR_CODES.OBJECT_CREATION_FAILED,
                    ERROR_TYPES.FABRIC,
                    { type, position }
                );
        }

        this.canvas.add(object);
        this.canvas.renderAll();
    }

    private renderGrid(): void {
        // Remove existing grid objects
        const gridObjects = this.canvas.getObjects().filter(obj => 
            isFabricObjectWithData(obj) && isGridObject(obj)
        );
        gridObjects.forEach(obj => this.canvas.remove(obj));

        if (!this.editorState.gridEnabled) {
            this.canvas.renderAll();
            return;
        }

        const canvasWidth = this.canvas.width!;
        const canvasHeight = this.canvas.height!;

        // Draw vertical lines
        for (let x = 0; x <= canvasWidth; x += EDITOR_CONFIG.GRID_SIZE) {
            const line = ObjectFactory.createGridLine(
                { x, y: 0 },
                { x, y: canvasHeight }
            );
            this.canvas.add(line);
        }

        // Draw horizontal lines
        for (let y = 0; y <= canvasHeight; y += EDITOR_CONFIG.GRID_SIZE) {
            const line = ObjectFactory.createGridLine(
                { x: 0, y },
                { x: canvasWidth, y }
            );
            this.canvas.add(line);
        }

        this.canvas.renderAll();
    }

    private renderEditableObjects(stageData: StageData): void {
        // Platforms
        stageData.platforms.forEach(platform => {
            const line = ObjectFactory.createPlatform(
                { x: platform.x1, y: platform.y1 },
                { x: platform.x2, y: platform.y2 }
            );
            this.canvas.add(line);
        });

        // Spikes
        stageData.spikes.forEach(spike => {
            const triangle = ObjectFactory.createSpike({
                position: { x: spike.x, y: spike.y },
                size: { width: spike.width, height: spike.height }
            });
            this.canvas.add(triangle);
        });

        // Goal
        const goal = ObjectFactory.createGoal({
            position: { x: stageData.goal.x, y: stageData.goal.y },
            size: { width: stageData.goal.width, height: stageData.goal.height }
        });
        this.canvas.add(goal);

        // Text elements
        const texts = [
            stageData.startText,
            stageData.goalText,
            stageData.leftEdgeMessage,
            stageData.leftEdgeSubMessage
        ].filter(Boolean) as TextElement[];

        texts.forEach(textElement => {
            const text = ObjectFactory.createText({
                position: { x: textElement.x, y: textElement.y },
                text: textElement.text
            });
            this.canvas.add(text);
        });
    }

    public updateStageDataFromCanvas(): void {
        const newStageData = this.generateStageDataFromCanvas();
        this.callbacks.onStageModified?.(newStageData);
    }

    private generateStageDataFromCanvas(): StageData {
        const objects = this.canvas.getObjects().filter(obj => 
            isFabricObjectWithData(obj) && !isGridObject(obj)
        );
        
        const platforms: Platform[] = [];
        const spikes: Spike[] = [];
        let goal: Goal = { x: 0, y: 0, width: 40, height: 50 };
        const texts: TextElement[] = [];

        objects.forEach(obj => {
            if (!isFabricObjectWithData(obj)) return;
            
            if (isPlatformObject(obj)) {
                const line = obj as unknown as fabric.Line;
                platforms.push({
                    x1: line.x1!,
                    y1: line.y1!,
                    x2: line.x2!,
                    y2: line.y2!
                });
            } else if (isSpikeObject(obj)) {
                const bounds = FabricHelper.getObjectBounds(obj);
                spikes.push({
                    x: bounds.left + bounds.width / 2,
                    y: bounds.top + bounds.height,
                    width: bounds.width,
                    height: bounds.height
                });
            } else if (isGoalObject(obj)) {
                const rect = obj as unknown as fabric.Rect;
                goal = {
                    x: rect.left!,
                    y: rect.top!,
                    width: rect.width!,
                    height: rect.height!
                };
            } else if (isTextObject(obj)) {
                const text = obj as unknown as fabric.Text;
                texts.push({
                    x: text.left!,
                    y: text.top!,
                    text: text.text!
                });
            }
        });

        return {
            id: this.stageData?.id || 1,
            name: this.stageData?.name || 'New Stage',
            platforms,
            spikes,
            goal,
            startText: texts[0] || { x: 50, y: 450, text: 'START' },
            goalText: texts[1] || { x: goal.x + 20, y: goal.y - 20, text: 'GOAL' }
        };
    }
}
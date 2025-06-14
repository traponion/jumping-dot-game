import * as fabric from 'fabric';
import { FabricRenderSystem } from './FabricRenderSystem.js';
import type { Platform, Spike, Goal, StageData, TextElement } from '../core/StageLoader.js';

export interface EditorState {
    selectedTool: 'platform' | 'spike' | 'goal' | 'text' | 'select';
    selectedObject: fabric.Object | null;
    isDrawing: boolean;
    gridEnabled: boolean;
    snapToGrid: boolean;
}

export interface EditorCallbacks {
    onObjectSelected?: (object: fabric.Object | null) => void;
    onObjectModified?: (object: fabric.Object) => void;
    onStageModified?: (stageData: StageData) => void;
}

export class EditorRenderSystem extends FabricRenderSystem {
    private editorState: EditorState;
    private callbacks: EditorCallbacks;
    private gridSize = 20;
    private stageData: StageData | null = null;
    
    constructor(canvasElement: HTMLCanvasElement, callbacks: EditorCallbacks = {}) {
        super(canvasElement);
        
        this.callbacks = callbacks;
        this.editorState = {
            selectedTool: 'select',
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };
        
        this.enableEditorMode();
        this.setupEventListeners();
    }

    public enableEditorMode(): void {
        // Enable Fabric.js interactive features for editor
        this.canvas.selection = true;
        this.canvas.allowTouchScrolling = true;
        
        // Enable object selection and modification
        this.canvas.preserveObjectStacking = true;
    }

    private setupEventListeners(): void {
        // Object selection
        this.canvas.on('selection:created', (e: any) => {
            this.editorState.selectedObject = e.selected?.[0] || null;
            this.callbacks.onObjectSelected?.(this.editorState.selectedObject);
        });

        this.canvas.on('selection:updated', (e: any) => {
            this.editorState.selectedObject = e.selected?.[0] || null;
            this.callbacks.onObjectSelected?.(this.editorState.selectedObject);
        });

        this.canvas.on('selection:cleared', () => {
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
        });

        // Object modification
        this.canvas.on('object:modified', (e: any) => {
            if (e.target) {
                this.callbacks.onObjectModified?.(e.target);
                this.updateStageDataFromCanvas();
            }
        });

        // Mouse events for drawing
        this.canvas.on('mouse:down', (e) => this.handleMouseDown(e));
        this.canvas.on('mouse:move', (e) => this.handleMouseMove(e));
        this.canvas.on('mouse:up', () => this.handleMouseUp());
    }

    private handleMouseDown(e: fabric.TEvent<Event>): void {
        if (this.editorState.selectedTool === 'select') return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.snapToGridIfEnabled(pointer);

        this.editorState.isDrawing = true;

        switch (this.editorState.selectedTool) {
            case 'platform':
                this.startDrawingPlatform(snappedPointer);
                break;
            case 'spike':
                this.placeSpikeAt(snappedPointer);
                break;
            case 'goal':
                this.placeGoalAt(snappedPointer);
                break;
            case 'text':
                this.placeTextAt(snappedPointer);
                break;
        }
    }

    private handleMouseMove(e: fabric.TEvent<Event>): void {
        if (!this.editorState.isDrawing) return;

        const pointer = this.canvas.getPointer(e.e as any);
        const snappedPointer = this.snapToGridIfEnabled(pointer);

        if (this.editorState.selectedTool === 'platform') {
            this.updateDrawingPlatform(snappedPointer);
        }
    }

    private handleMouseUp(): void {
        if (!this.editorState.isDrawing) return;

        this.editorState.isDrawing = false;

        if (this.editorState.selectedTool === 'platform') {
            this.finishDrawingPlatform();
        }

        this.updateStageDataFromCanvas();
    }

    private snapToGridIfEnabled(pointer: { x: number; y: number }): { x: number; y: number } {
        if (!this.editorState.snapToGrid) return pointer;

        return {
            x: Math.round(pointer.x / this.gridSize) * this.gridSize,
            y: Math.round(pointer.y / this.gridSize) * this.gridSize
        };
    }

    private startDrawingPlatform(pointer: { x: number; y: number }): void {
        const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: 'white',
            strokeWidth: 3,
            selectable: false
        });
        
        (line as any).data = { type: 'platform', isDrawing: true };
        this.canvas.add(line);
        this.canvas.renderAll();
    }

    private updateDrawingPlatform(pointer: { x: number; y: number }): void {
        const objects = this.canvas.getObjects();
        const drawingPlatform = objects.find(obj => 
            (obj as any).data?.type === 'platform' && (obj as any).data?.isDrawing
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
            (obj as any).data?.type === 'platform' && (obj as any).data?.isDrawing
        ) as fabric.Line;

        if (drawingPlatform) {
            // Convert to selectable platform
            drawingPlatform.set({ selectable: true });
            (drawingPlatform as any).data = { type: 'platform', isDrawing: false };
            this.canvas.renderAll();
        }
    }

    private placeSpikeAt(pointer: { x: number; y: number }): void {
        const spikeSize = 15;
        const triangle = new fabric.Polygon([
            { x: 0, y: spikeSize },
            { x: spikeSize / 2, y: 0 },
            { x: spikeSize, y: spikeSize }
        ], {
            left: pointer.x - spikeSize / 2,
            top: pointer.y - spikeSize,
            fill: 'white'
        });
        
        (triangle as any).data = { type: 'spike' };
        this.canvas.add(triangle);
        this.canvas.renderAll();
    }

    private placeGoalAt(pointer: { x: number; y: number }): void {
        const goalWidth = 40;
        const goalHeight = 50;
        
        const goal = new fabric.Rect({
            left: pointer.x - goalWidth / 2,
            top: pointer.y - goalHeight,
            width: goalWidth,
            height: goalHeight,
            fill: 'transparent',
            stroke: 'yellow',
            strokeWidth: 2
        });
        
        (goal as any).data = { type: 'goal' };
        this.canvas.add(goal);
        this.canvas.renderAll();
    }

    private placeTextAt(pointer: { x: number; y: number }): void {
        const text = new fabric.Text('TEXT', {
            left: pointer.x,
            top: pointer.y,
            fontFamily: 'monospace',
            fontSize: 16,
            fill: 'white'
        });
        
        (text as any).data = { type: 'text' };
        this.canvas.add(text);
        this.canvas.renderAll();
    }

    public setSelectedTool(tool: EditorState['selectedTool']): void {
        this.editorState.selectedTool = tool;
        
        // Update canvas selection mode
        if (tool === 'select') {
            this.canvas.selection = true;
        } else {
            this.canvas.discardActiveObject();
            this.canvas.selection = false;
        }
        
        this.canvas.renderAll();
    }

    public deleteSelectedObject(): void {
        if (this.editorState.selectedObject) {
            this.canvas.remove(this.editorState.selectedObject);
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
            this.updateStageDataFromCanvas();
            this.canvas.renderAll();
        }
    }

    public toggleGrid(): void {
        this.editorState.gridEnabled = !this.editorState.gridEnabled;
        this.renderGrid();
    }

    public toggleSnapToGrid(): void {
        this.editorState.snapToGrid = !this.editorState.snapToGrid;
    }

    private renderGrid(): void {
        // Remove existing grid
        const gridObjects = this.canvas.getObjects().filter(obj => (obj as any).data?.type === 'grid');
        gridObjects.forEach(obj => this.canvas.remove(obj));

        if (!this.editorState.gridEnabled) {
            this.canvas.renderAll();
            return;
        }

        const canvasWidth = this.canvas.width!;
        const canvasHeight = this.canvas.height!;

        // Draw grid lines
        for (let i = 0; i <= canvasWidth; i += this.gridSize) {
            const line = new fabric.Line([i, 0, i, canvasHeight], {
                stroke: 'rgba(255, 255, 255, 0.1)',
                strokeWidth: 1,
                selectable: false,
                evented: false
            });
            (line as any).data = { type: 'grid' };
            this.canvas.add(line);
        }

        for (let i = 0; i <= canvasHeight; i += this.gridSize) {
            const line = new fabric.Line([0, i, canvasWidth, i], {
                stroke: 'rgba(255, 255, 255, 0.1)',
                strokeWidth: 1,
                selectable: false,
                evented: false
            });
            (line as any).data = { type: 'grid' };
            this.canvas.add(line);
        }

        this.canvas.renderAll();
    }

    public loadStageForEditing(stageData: StageData): void {
        this.stageData = stageData;
        this.clearCanvas();
        this.renderGrid();
        
        // Render stage objects as editable Fabric.js objects
        this.renderEditablePlatforms(stageData.platforms);
        this.renderEditableSpikes(stageData.spikes);
        this.renderEditableGoal(stageData.goal);
        this.renderEditableTexts(stageData);
        
        this.canvas.renderAll();
    }

    private renderEditablePlatforms(platforms: Platform[]): void {
        platforms.forEach(platform => {
            const line = new fabric.Line([platform.x1, platform.y1, platform.x2, platform.y2], {
                stroke: 'white',
                strokeWidth: 3
            });
            (line as any).data = { type: 'platform' };
            this.canvas.add(line);
        });
    }

    private renderEditableSpikes(spikes: Spike[]): void {
        spikes.forEach(spike => {
            const triangle = new fabric.Polygon([
                { x: 0, y: spike.height },
                { x: spike.width / 2, y: 0 },
                { x: spike.width, y: spike.height }
            ], {
                left: spike.x - spike.width / 2,
                top: spike.y - spike.height,
                fill: 'white'
            });
            (triangle as any).data = { type: 'spike' };
            this.canvas.add(triangle);
        });
    }

    private renderEditableGoal(goal: Goal): void {
        const goalRect = new fabric.Rect({
            left: goal.x,
            top: goal.y,
            width: goal.width,
            height: goal.height,
            fill: 'transparent',
            stroke: 'yellow',
            strokeWidth: 2
        });
        (goalRect as any).data = { type: 'goal' };
        this.canvas.add(goalRect);
    }

    private renderEditableTexts(stageData: StageData): void {
        const texts = [
            stageData.startText,
            stageData.goalText,
            stageData.leftEdgeMessage,
            stageData.leftEdgeSubMessage
        ].filter(Boolean) as TextElement[];

        texts.forEach(textElement => {
            const text = new fabric.Text(textElement.text, {
                left: textElement.x,
                top: textElement.y,
                fontFamily: 'monospace',
                fontSize: 16,
                fill: 'white'
            });
            (text as any).data = { type: 'text' };
            this.canvas.add(text);
        });
    }

    public exportStageData(): StageData {
        return this.generateStageDataFromCanvas();
    }

    private updateStageDataFromCanvas(): void {
        const newStageData = this.generateStageDataFromCanvas();
        this.callbacks.onStageModified?.(newStageData);
    }

    private generateStageDataFromCanvas(): StageData {
        const objects = this.canvas.getObjects().filter(obj => (obj as any).data?.type !== 'grid');
        
        const platforms: Platform[] = [];
        const spikes: Spike[] = [];
        let goal: Goal = { x: 0, y: 0, width: 40, height: 50 };
        const texts: TextElement[] = [];

        objects.forEach(obj => {
            const type = (obj as any).data?.type;
            
            switch (type) {
                case 'platform':
                    const line = obj as fabric.Line;
                    platforms.push({
                        x1: line.x1!,
                        y1: line.y1!,
                        x2: line.x2!,
                        y2: line.y2!
                    });
                    break;
                    
                case 'spike':
                    const triangle = obj as fabric.Polygon;
                    const bounds = triangle.getBoundingRect();
                    spikes.push({
                        x: bounds.left + bounds.width / 2,
                        y: bounds.top + bounds.height,
                        width: bounds.width,
                        height: bounds.height
                    });
                    break;
                    
                case 'goal':
                    const rect = obj as fabric.Rect;
                    goal = {
                        x: rect.left!,
                        y: rect.top!,
                        width: rect.width!,
                        height: rect.height!
                    };
                    break;
                    
                case 'text':
                    const text = obj as fabric.Text;
                    texts.push({
                        x: text.left!,
                        y: text.top!,
                        text: text.text!
                    });
                    break;
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

    public getEditorState(): EditorState {
        return { ...this.editorState };
    }
}
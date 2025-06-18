import type { EditorCallbacks, EditorState, IRenderAdapter, StageData } from './IRenderAdapter.v2.js';

/**
 * Mock implementation of IRenderAdapter for testing
 * Does not depend on Fabric.js or DOM elements
 */
export class MockRenderAdapter implements IRenderAdapter {
    private editorState: EditorState;
    private stageData: StageData | null = null;
    private callbacks: EditorCallbacks;

    // Track method calls for testing
    public renderAllCalled = 0;
    public clearCanvasCalled = 0;
    public disposeCalled = 0;
    public toolChanges: string[] = [];
    public gridToggles = 0;
    public snapToggles = 0;
    public deleteObjectCalls = 0;
    public duplicateObjectCalls = 0;
    public stageLoads: StageData[] = [];
    public stageExports = 0;

    constructor(callbacks: EditorCallbacks = {}) {
        this.callbacks = callbacks;
        this.editorState = {
            selectedTool: 'select',
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };
    }

    // IRenderAdapter implementation
    public renderAll(): void {
        this.renderAllCalled++;
    }

    public clearCanvas(): void {
        this.clearCanvasCalled++;
        this.stageData = null;
    }

    public dispose(): void {
        this.disposeCalled++;
    }

    public getEditorState(): EditorState {
        return { ...this.editorState };
    }

    public renderGrid(enabled: boolean): void {
        this.editorState.gridEnabled = enabled;
    }

    public getSelectedObject(): unknown | null {
        return this.editorState.selectedObject;
    }

    public selectObject(object: unknown | null): void {
        this.editorState.selectedObject = object;
        this.callbacks.onObjectSelected?.(object);
    }

    public setupEventListeners(callbacks: EditorCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    public removeEventListeners(): void {
        // Mock implementation - no-op
    }

    public setSelectedTool(tool: string): void {
        this.editorState.selectedTool = tool;
        this.toolChanges.push(tool);
    }

    public toggleGrid(): void {
        this.editorState.gridEnabled = !this.editorState.gridEnabled;
        this.gridToggles++;
    }

    public toggleSnapToGrid(): void {
        this.editorState.snapToGrid = !this.editorState.snapToGrid;
        this.snapToggles++;
    }

    public deleteSelectedObject(): void {
        if (this.editorState.selectedObject) {
            this.editorState.selectedObject = null;
            this.callbacks.onObjectSelected?.(null);
            this.deleteObjectCalls++;
        }
    }

    public duplicateSelectedObject(): void {
        if (this.editorState.selectedObject) {
            this.duplicateObjectCalls++;
            // Simulate creating a duplicate object
            this.callbacks.onObjectModified?.(this.editorState.selectedObject);
        }
    }

    public loadStageForEditing(stageData: StageData): void {
        this.stageData = { ...stageData };
        this.stageLoads.push({ ...stageData });
    }

    public exportStageData(): StageData {
        this.stageExports++;

        // Return a default stage if none loaded
        if (!this.stageData) {
            return {
                id: 1,
                name: 'Mock Stage',
                platforms: [],
                spikes: [],
                goal: { x: 400, y: 200, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 420, y: 180, text: 'GOAL' }
            };
        }

        return { ...this.stageData };
    }

    // Helper methods for testing
    public reset(): void {
        this.renderAllCalled = 0;
        this.clearCanvasCalled = 0;
        this.disposeCalled = 0;
        this.toolChanges = [];
        this.gridToggles = 0;
        this.snapToggles = 0;
        this.deleteObjectCalls = 0;
        this.duplicateObjectCalls = 0;
        this.stageLoads = [];
        this.stageExports = 0;

        this.editorState = {
            selectedTool: 'select',
            selectedObject: null,
            isDrawing: false,
            gridEnabled: true,
            snapToGrid: true
        };

        this.stageData = null;
    }

    public simulateObjectModification(): void {
        if (this.editorState.selectedObject) {
            this.callbacks.onObjectModified?.(this.editorState.selectedObject);
        }
    }

    public simulateStageModification(stageData: StageData): void {
        this.stageData = { ...stageData };
        this.callbacks.onStageModified?.(stageData);
    }

    // Getters for test validation
    public getLastToolChange(): string | undefined {
        return this.toolChanges[this.toolChanges.length - 1];
    }

    public getLastStageLoad(): StageData | undefined {
        return this.stageLoads[this.stageLoads.length - 1];
    }

    public isGridEnabled(): boolean {
        return this.editorState.gridEnabled;
    }

    public isSnapToGridEnabled(): boolean {
        return this.editorState.snapToGrid;
    }

    public hasSelectedObject(): boolean {
        return this.editorState.selectedObject !== null;
    }

    // Object creation methods (for interface compliance)
    public createSpike(_x: number, _y: number): void {
        // Mock implementation - just log the call
    }

    public createGoal(_x: number, _y: number, _width?: number, _height?: number): void {
        // Mock implementation - just log the call
    }

    public createText(_x: number, _y: number, _text: string): void {
        // Mock implementation - just log the call
    }

    public startPlatformDrawing(_x: number, _y: number): void {
        // Mock implementation - just log the call
    }

    public finishPlatformDrawing(_x: number, _y: number): void {
        // Mock implementation - just log the call
    }
    
    // ===== Component Support Methods =====
    
    /**
     * Get editable objects (mock implementation)
     */
    public getEditableObjects(): any[] {
        // Return mock objects for testing
        return [
            { type: 'platform', data: { objectType: 'platform', x1: 100, y1: 200, x2: 200, y2: 200 } },
            { type: 'spike', data: { objectType: 'spike', x: 150, y: 180, width: 20, height: 20 } }
        ];
    }
}

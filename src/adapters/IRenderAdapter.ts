/**
 * Render Adapter Interface
 * Abstracts rendering functionality from specific library implementations
 */

export interface EditorState {
    selectedTool: string;
    selectedObject: any | null;
    isDrawing: boolean;
    gridEnabled: boolean;
    snapToGrid: boolean;
}

export interface StageData {
    id: number;
    name: string;
    platforms: Array<{x1: number, y1: number, x2: number, y2: number}>;
    spikes: Array<{x: number, y: number, width: number, height: number}>;
    goal: {x: number, y: number, width: number, height: number};
    startText: {x: number, y: number, text: string};
    goalText: {x: number, y: number, text: string};
}

export interface EditorCallbacks {
    onObjectSelected?: (object: any) => void;
    onObjectModified?: (object: any) => void;
    onStageModified?: () => void;
}

/**
 * Abstract interface for rendering operations
 * Concrete implementations: FabricRenderAdapter (production), MockRenderAdapter (testing)
 */
export interface IRenderAdapter {
    // Core rendering operations
    renderAll(): void;
    clearCanvas(): void;
    dispose(): void;
    
    // Editor state management
    getEditorState(): EditorState;
    setSelectedTool(tool: string): void;
    toggleGrid(): void;
    toggleSnapToGrid(): void;
    
    // Object operations
    deleteSelectedObject(): void;
    duplicateSelectedObject(): void;
    
    // Stage operations
    loadStageForEditing(stageData: StageData): void;
    exportStageData(): StageData;
    
    // Object creation methods
    createSpike(x: number, y: number): void;
    createGoal(x: number, y: number, width: number, height: number): void;
    createText(x: number, y: number, text: string): void;
    startPlatformDrawing(x: number, y: number): void;
    finishPlatformDrawing(x: number, y: number): void;
}
/**
 * Pure Render Adapter Interface (v2) - Following Nana-chan's architectural guidance
 * 
 * This interface defines a clean adapter pattern where:
 * - Adapter is NOT a subclass of any rendering system (composition over inheritance)
 * - Focuses on adapter-specific concerns: translation between abstract operations and concrete library calls
 * - EditorRenderSystem will use this adapter via delegation (has-a relationship)
 * 
 * Responsibilities separated into focused interfaces:
 * - IRenderAdapter: Core rendering operations adapter
 * - IEditorInputHandler: Editor-specific input processing
 * - IStageDataConverter: Stage data ↔ Canvas object conversion
 * - IObjectDrawer: Individual object drawing details
 */

import type { StageData } from '../core/StageLoader.js';

// Re-export StageData for backward compatibility
export type { StageData };

// ===== Core Types =====
export interface EditorState {
    selectedTool: string;
    selectedObject: unknown | null;
    isDrawing: boolean;
    gridEnabled: boolean;
    snapToGrid: boolean;
}

export interface EditorCallbacks {
    onObjectSelected?: (object: unknown) => void;
    onObjectModified?: (object: unknown) => void;
    onStageModified?: (stageData: StageData) => void;
}

// ===== Position and Size Types =====
export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface Bounds extends Position, Size {}

// ===== Core Adapter Interface =====
/**
 * Pure render adapter interface - abstracts canvas library specifics
 * This is what EditorRenderSystem will depend on (Dependency Inversion Principle)
 */
export interface IRenderAdapter {
    // ===== Core Rendering Operations =====
    renderAll(): void;
    clearCanvas(): void;
    dispose(): void;
    
    // ===== State Management =====
    getEditorState(): EditorState;
    
    // ===== Grid Operations =====
    renderGrid(enabled: boolean): void;
    
    // ===== Object Selection =====
    getSelectedObject(): unknown | null;
    selectObject(object: unknown | null): void;
    deleteSelectedObject(): void;
    duplicateSelectedObject(): void;
    
    // ===== Canvas Events =====
    setupEventListeners(callbacks: EditorCallbacks): void;
    removeEventListeners(): void;
    
    // ===== Legacy Compatibility Methods =====
    // These methods provide backward compatibility with existing EditorRenderSystem
    setSelectedTool(tool: string): void;
    toggleGrid(): void;
    toggleSnapToGrid(): void;
    loadStageForEditing(stageData: StageData): void;
    exportStageData(): StageData;
    createSpike(x: number, y: number): void;
    createGoal(x: number, y: number, width?: number, height?: number): void;
    createText(x: number, y: number, text: string): void;
    startPlatformDrawing(x: number, y: number): void;
    finishPlatformDrawing(x: number, y: number): void;
}

// ===== Focused Sub-interfaces =====

/**
 * Handles editor-specific input processing
 * Separated from core adapter to follow Single Responsibility Principle
 */
export interface IEditorInputHandler {
    setSelectedTool(tool: string): void;
    toggleGrid(): void;
    toggleSnapToGrid(): void;
    
    // Mouse event handlers
    handleMouseDown(position: Position): void;
    handleMouseMove(position: Position): void;
    handleMouseUp(position: Position): void;
    
    // Tool-specific operations
    startPlatformDrawing(position: Position): void;
    updatePlatformDrawing(position: Position): void;
    finishPlatformDrawing(): void;
    
    // Object placement
    placeSpike(position: Position): void;
    placeGoal(position: Position): void;
    placeText(position: Position, text: string): void;
}

/**
 * Handles Stage Data ↔ Canvas Object conversion
 * Pure data transformation responsibilities
 */
export interface IStageDataConverter {
    // Stage → Canvas
    loadStageForEditing(stageData: StageData): void;
    
    // Canvas → Stage  
    exportStageData(): StageData;
    
    // Individual conversions
    convertPlatformToCanvasObject(platform: { x1: number; y1: number; x2: number; y2: number }): unknown;
    convertSpikeToCanvasObject(spike: { x: number; y: number; width: number; height: number }): unknown;
    convertGoalToCanvasObject(goal: { x: number; y: number; width: number; height: number }): unknown;
    convertTextToCanvasObject(text: { x: number; y: number; text: string }): unknown;
    
    // Reverse conversions
    extractPlatformData(canvasObject: unknown): { x1: number; y1: number; x2: number; y2: number } | null;
    extractSpikeData(canvasObject: unknown): { x: number; y: number; width: number; height: number } | null;
    extractGoalData(canvasObject: unknown): { x: number; y: number; width: number; height: number } | null;
    extractTextData(canvasObject: unknown): { x: number; y: number; text: string } | null;
}

/**
 * Handles individual object drawing details
 * Separated to isolate drawing complexity
 */
export interface IObjectDrawer {
    // Object creation
    createPlatform(start: Position, end: Position): unknown;
    createSpike(position: Position, size?: Size): unknown;
    createGoal(position: Position, size?: Size): unknown;
    createText(position: Position, text: string): unknown;
    createGridLine(start: Position, end: Position): unknown;
    
    // Object styling
    applyPlatformStyle(object: unknown): void;
    applySpikeStyle(object: unknown): void;
    applyGoalStyle(object: unknown): void;
    applyTextStyle(object: unknown): void;
    applyGridStyle(object: unknown): void;
    
    // Object utilities
    getObjectBounds(object: unknown): Bounds;
    setObjectData(object: unknown, data: Record<string, unknown>): void;
    getObjectData(object: unknown): Record<string, unknown> | null;
    snapToGrid(position: Position, gridSize: number): Position;
}

// ===== Factory Interface =====
/**
 * Factory for creating render adapter and its components
 * Enables dependency injection and testing
 */
export interface IRenderAdapterFactory {
    createRenderAdapter(canvasElement: HTMLCanvasElement, callbacks?: EditorCallbacks): IRenderAdapter;
    createInputHandler(adapter: IRenderAdapter): IEditorInputHandler;
    createStageDataConverter(adapter: IRenderAdapter): IStageDataConverter;
    createObjectDrawer(adapter: IRenderAdapter): IObjectDrawer;
}
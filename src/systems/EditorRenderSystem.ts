import type { IRenderAdapter, EditorState, EditorCallbacks, StageData as AdapterStageData } from '../adapters/IRenderAdapter.js';
import type { StageData } from '../core/StageLoader.js';
import { DebugHelper } from '../utils/EditorUtils.js';

// 型定義を再エクスポート
export type { EditorState, EditorCallbacks };

/**
 * EditorRenderSystem now acts as a orchestrator using the Adapter Pattern
 * All rendering operations are delegated to the IRenderAdapter implementation
 */
export class EditorRenderSystem {
    private renderAdapter: IRenderAdapter;
    
    constructor(renderAdapter: IRenderAdapter) {
        this.renderAdapter = renderAdapter;
        
        DebugHelper.log('EditorRenderSystem initialized with adapter', {
            adapterType: renderAdapter.constructor.name
        });
    }

    /**
     * Get current editor state
     */
    public getEditorState(): EditorState {
        return this.renderAdapter.getEditorState();
    }

    /**
     * Render all objects on canvas
     */
    public renderAll(): void {
        this.renderAdapter.renderAll();
    }

    /**
     * Clear the canvas
     */
    public clearCanvas(): void {
        this.renderAdapter.clearCanvas();
    }

    /**
     * Dispose the render system
     */
    public dispose(): void {
        this.renderAdapter.dispose();
    }

    /**
     * Set selected tool
     */
    public setSelectedTool(tool: string): void {
        this.renderAdapter.setSelectedTool(tool);
        DebugHelper.log('Tool selected', { tool });
    }

    /**
     * Delete selected object
     */
    public deleteSelectedObject(): void {
        this.renderAdapter.deleteSelectedObject();
        DebugHelper.log('Object deleted');
    }

    /**
     * Toggle grid display
     */
    public toggleGrid(): void {
        this.renderAdapter.toggleGrid();
        const state = this.renderAdapter.getEditorState();
        DebugHelper.log('Grid toggled', { enabled: state.gridEnabled });
    }

    /**
     * Toggle snap to grid
     */
    public toggleSnapToGrid(): void {
        this.renderAdapter.toggleSnapToGrid();
        const state = this.renderAdapter.getEditorState();
        DebugHelper.log('Snap to grid toggled', { enabled: state.snapToGrid });
    }

    /**
     * Duplicate selected object
     */
    public duplicateSelectedObject(): void {
        this.renderAdapter.duplicateSelectedObject();
        DebugHelper.log('Object duplicated');
    }

    /**
     * Load stage data for editing
     */
    public loadStageForEditing(stageData: StageData): void {
        this.renderAdapter.loadStageForEditing(stageData as AdapterStageData);
        DebugHelper.log('Stage loaded for editing', { stageId: stageData.id });
    }


    /**
     * Export stage data
     */
    public exportStageData(): StageData {
        return this.renderAdapter.exportStageData() as StageData;
    }

    /**
     * Update stage data from canvas (for compatibility)
     * Note: This is handled internally by the adapter
     */
    public updateStageDataFromCanvas(): void {
        // This operation is now handled by the adapter internally
        DebugHelper.log('updateStageDataFromCanvas called (delegated to adapter)');
    }

    /**
     * Get selected object (for compatibility)
     */
    public getSelectedObject(): any {
        const state = this.renderAdapter.getEditorState();
        return state.selectedObject;
    }

    /**
     * Get render adapter for advanced operations
     */
    public getRenderAdapter(): IRenderAdapter {
        return this.renderAdapter;
    }

    /**
     * Add object to canvas (for compatibility)
     */
    public addObject(object: any): void {
        // This is legacy functionality that's now handled by the adapter
        DebugHelper.log('addObject called (legacy compatibility)', { object });
    }

    /**
     * Select object (for compatibility)
     */
    public selectObject(object: any): void {
        // This is legacy functionality that's now handled by the adapter
        DebugHelper.log('selectObject called (legacy compatibility)', { object });
    }

    /**
     * Get Fabric canvas (for compatibility)
     */
    public getFabricCanvas(): any {
        // For compatibility with legacy code that expects Fabric canvas
        DebugHelper.log('getFabricCanvas called (legacy compatibility)');
        return null; // Returns null since we're now using adapters
    }
}
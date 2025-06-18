import {
    EDITOR_CONFIG,
    EDITOR_TOOLS,
    ERROR_CODES,
    ERROR_TYPES,
    EditorError
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import type {
    IEditorInputHandler,
    IRenderAdapter,
    IObjectDrawer,
    Position
} from './IRenderAdapter.js';

/**
 * EditorInputHandler - Handles editor-specific input processing
 * 
 * Responsibilities:
 * - Tool selection and mode management
 * - Mouse event processing
 * - Drawing state management (platform drawing, object placement)
 * - Grid and snap functionality
 * 
 * This class follows Single Responsibility Principle by handling only input concerns.
 */
export class EditorInputHandler implements IEditorInputHandler {
    private adapter: IRenderAdapter;
    private objectDrawer: IObjectDrawer;
    private isDrawing = false;
    private drawingObject: unknown | null = null;

    constructor(adapter: IRenderAdapter, objectDrawer: IObjectDrawer) {
        this.adapter = adapter;
        this.objectDrawer = objectDrawer;
    }

    /**
     * Set the currently selected tool
     */
    setSelectedTool(tool: string): void {
        // Validate tool
        const validTools = Object.values(EDITOR_TOOLS);
        if (!validTools.includes(tool as any)) {
            throw new EditorError(
                `Invalid tool: ${tool}`,
                ERROR_CODES.INVALID_TOOL,
                ERROR_TYPES.VALIDATION,
                { tool, validTools }
            );
        }

        // Update state (this will be handled by the adapter)
        // For now, we'll need a way to update the adapter's state
        // This might require extending the IRenderAdapter interface
        
        DebugHelper.log('Tool selected', { tool });
    }

    /**
     * Toggle grid visibility
     */
    toggleGrid(): void {
        const editorState = this.adapter.getEditorState();
        const newGridState = !editorState.gridEnabled;
        
        this.adapter.renderGrid(newGridState);
        
        DebugHelper.log('Grid toggled', { enabled: newGridState });
    }

    /**
     * Toggle snap to grid functionality
     */
    toggleSnapToGrid(): void {
        const editorState = this.adapter.getEditorState();
        const newSnapState = !editorState.snapToGrid;
        
        // Update state - this requires adapter state update capability
        // Will need to extend IRenderAdapter interface
        
        DebugHelper.log('Snap to grid toggled', { enabled: newSnapState });
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(position: Position): void {
        const editorState = this.adapter.getEditorState();
        
        if (editorState.selectedTool === EDITOR_TOOLS.SELECT) {
            return; // Selection is handled by canvas event system
        }

        const snappedPosition = this.getSnappedPosition(position);
        this.isDrawing = true;

        try {
            switch (editorState.selectedTool) {
                case EDITOR_TOOLS.PLATFORM:
                    this.startPlatformDrawing(snappedPosition);
                    break;
                case EDITOR_TOOLS.SPIKE:
                    this.placeSpike(snappedPosition);
                    break;
                case EDITOR_TOOLS.GOAL:
                    this.placeGoal(snappedPosition);
                    break;
                case EDITOR_TOOLS.TEXT:
                    this.placeText(snappedPosition, 'TEXT');
                    break;
                default:
                    throw new EditorError(
                        `Unsupported tool for mouse down: ${editorState.selectedTool}`,
                        ERROR_CODES.UNSUPPORTED_OPERATION,
                        ERROR_TYPES.EDITOR,
                        { tool: editorState.selectedTool, position: snappedPosition }
                    );
            }
        } catch (error) {
            DebugHelper.log('Error during mouse down handling', error);
            this.isDrawing = false;
            throw error;
        }
    }

    /**
     * Handle mouse move events
     */
    handleMouseMove(position: Position): void {
        if (!this.isDrawing) {
            return;
        }

        const editorState = this.adapter.getEditorState();
        const snappedPosition = this.getSnappedPosition(position);

        if (editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.updatePlatformDrawing(snappedPosition);
        }
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp(_position: Position): void {
        if (!this.isDrawing) {
            return;
        }

        const editorState = this.adapter.getEditorState();
        this.isDrawing = false;

        if (editorState.selectedTool === EDITOR_TOOLS.PLATFORM) {
            this.finishPlatformDrawing();
        }

        this.adapter.renderAll();
    }

    /**
     * Start drawing a platform
     */
    startPlatformDrawing(position: Position): void {
        try {
            // Create initial platform line from position to position
            const platformObject = this.objectDrawer.createPlatform(position, position);
            this.objectDrawer.setObjectData(platformObject, { 
                type: EDITOR_TOOLS.PLATFORM, 
                isDrawing: true 
            });
            
            this.drawingObject = platformObject;
            
            DebugHelper.log('Started platform drawing', { position });
        } catch (error) {
            throw new EditorError(
                'Failed to start platform drawing',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, error }
            );
        }
    }

    /**
     * Update platform drawing as mouse moves
     */
    updatePlatformDrawing(position: Position): void {
        if (!this.drawingObject) {
            return;
        }

        try {
            // Update the end position of the drawing platform
            // This is platform-specific and needs to be handled by ObjectDrawer
            // For now, we'll need to add a method to ObjectDrawer for updating platforms
            
            DebugHelper.log('Updated platform drawing', { position });
        } catch (error) {
            DebugHelper.log('Error updating platform drawing', { position, error });
        }
    }

    /**
     * Finish drawing a platform
     */
    finishPlatformDrawing(): void {
        if (!this.drawingObject) {
            return;
        }

        try {
            // Mark the platform as finished drawing
            this.objectDrawer.setObjectData(this.drawingObject, { 
                type: EDITOR_TOOLS.PLATFORM, 
                isDrawing: false 
            });
            
            this.drawingObject = null;
            
            DebugHelper.log('Finished platform drawing');
        } catch (error) {
            DebugHelper.log('Error finishing platform drawing', error);
        }
    }

    /**
     * Place a spike object
     */
    placeSpike(position: Position): void {
        try {
            const spike = this.objectDrawer.createSpike(position);
            this.objectDrawer.applySpikeStyle(spike);
            
            DebugHelper.log('Placed spike', { position });
        } catch (error) {
            throw new EditorError(
                'Failed to place spike',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, error }
            );
        }
    }

    /**
     * Place a goal object
     */
    placeGoal(position: Position): void {
        try {
            const goal = this.objectDrawer.createGoal(position);
            this.objectDrawer.applyGoalStyle(goal);
            
            DebugHelper.log('Placed goal', { position });
        } catch (error) {
            throw new EditorError(
                'Failed to place goal',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, error }
            );
        }
    }

    /**
     * Place a text object
     */
    placeText(position: Position, text: string): void {
        try {
            const textObject = this.objectDrawer.createText(position, text);
            this.objectDrawer.applyTextStyle(textObject);
            
            DebugHelper.log('Placed text', { position, text });
        } catch (error) {
            throw new EditorError(
                'Failed to place text',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, text, error }
            );
        }
    }

    /**
     * Get snapped position based on grid settings
     */
    private getSnappedPosition(position: Position): Position {
        const editorState = this.adapter.getEditorState();
        
        if (!editorState.snapToGrid) {
            return position;
        }
        
        return this.objectDrawer.snapToGrid(position, EDITOR_CONFIG.GRID_SIZE);
    }
}
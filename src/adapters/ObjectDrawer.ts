import * as fabric from 'fabric';
import {
    EDITOR_CONFIG,
    EDITOR_TOOLS,
    ERROR_CODES,
    ERROR_TYPES,
    EditorError
} from '../types/EditorTypes.js';
import { DebugHelper } from '../utils/EditorUtils.js';
import type { Bounds, IObjectDrawer, Position, Size } from './IRenderAdapter.js';

/**
 * ObjectDrawer - Handles individual object drawing details
 *
 * Responsibilities:
 * - Create Fabric.js objects for each game element type
 * - Apply consistent styling to objects
 * - Handle object data management
 * - Provide utility functions for object manipulation
 *
 * This class follows Single Responsibility Principle by handling only drawing concerns.
 */
export class ObjectDrawer implements IObjectDrawer {
    private canvas: fabric.Canvas;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Create a platform object (line)
     */
    createPlatform(start: Position, end: Position): fabric.Line {
        try {
            const line = new fabric.Line([start.x, start.y, end.x, end.y], {
                stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                selectable: true,
                hoverCursor: 'pointer',
                moveCursor: 'pointer'
            });

            this.setObjectData(line, { type: EDITOR_TOOLS.PLATFORM });
            this.canvas.add(line);

            DebugHelper.log('Platform created', { start, end });
            return line;
        } catch (error) {
            throw new EditorError(
                'Failed to create platform',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { start, end, error }
            );
        }
    }

    /**
     * Create a spike object (triangle)
     */
    createSpike(position: Position, size?: Size): fabric.Polygon {
        try {
            const spikeSize = size || { width: 30, height: 30 };
            const points = [
                { x: position.x, y: position.y - spikeSize.height / 2 }, // Top point
                { x: position.x - spikeSize.width / 2, y: position.y + spikeSize.height / 2 }, // Bottom left
                { x: position.x + spikeSize.width / 2, y: position.y + spikeSize.height / 2 } // Bottom right
            ];

            const spike = new fabric.Polygon(points, {
                fill: EDITOR_CONFIG.COLORS.SPIKE,
                stroke: EDITOR_CONFIG.COLORS.SPIKE_BORDER,
                strokeWidth: 2,
                selectable: true,
                hoverCursor: 'pointer',
                moveCursor: 'pointer'
            });

            this.setObjectData(spike, { type: EDITOR_TOOLS.SPIKE });
            this.canvas.add(spike);

            DebugHelper.log('Spike created', { position, size: spikeSize });
            return spike;
        } catch (error) {
            throw new EditorError(
                'Failed to create spike',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, size, error }
            );
        }
    }

    /**
     * Create a goal object (rectangle)
     */
    createGoal(position: Position, size?: Size): fabric.Rect {
        try {
            const goalSize = size || { width: 40, height: 50 };

            const goal = new fabric.Rect({
                left: position.x,
                top: position.y,
                width: goalSize.width,
                height: goalSize.height,
                fill: EDITOR_CONFIG.COLORS.GOAL,
                stroke: EDITOR_CONFIG.COLORS.GOAL_BORDER,
                strokeWidth: 2,
                selectable: true,
                hoverCursor: 'pointer',
                moveCursor: 'pointer'
            });

            this.setObjectData(goal, { type: EDITOR_TOOLS.GOAL });
            this.canvas.add(goal);

            DebugHelper.log('Goal created', { position, size: goalSize });
            return goal;
        } catch (error) {
            throw new EditorError(
                'Failed to create goal',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, size, error }
            );
        }
    }

    /**
     * Create a text object
     */
    createText(position: Position, text: string): fabric.Text {
        try {
            const textObject = new fabric.Text(text, {
                left: position.x,
                top: position.y,
                fontSize: EDITOR_CONFIG.TEXT.FONT_SIZE,
                fontFamily: EDITOR_CONFIG.TEXT.FONT_FAMILY,
                fill: EDITOR_CONFIG.COLORS.TEXT,
                selectable: true,
                hoverCursor: 'pointer',
                moveCursor: 'pointer'
            });

            this.setObjectData(textObject, { type: EDITOR_TOOLS.TEXT });
            this.canvas.add(textObject);

            DebugHelper.log('Text created', { position, text });
            return textObject;
        } catch (error) {
            throw new EditorError(
                'Failed to create text',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { position, text, error }
            );
        }
    }

    /**
     * Create a grid line
     */
    createGridLine(start: Position, end: Position): fabric.Line {
        try {
            const gridLine = new fabric.Line([start.x, start.y, end.x, end.y], {
                stroke: EDITOR_CONFIG.COLORS.GRID,
                strokeWidth: 1,
                selectable: false,
                evented: false, // Don't respond to events
                hoverCursor: 'default',
                moveCursor: 'default'
            });

            this.setObjectData(gridLine, { type: 'grid', isGrid: true });
            this.canvas.add(gridLine);

            return gridLine;
        } catch (error) {
            throw new EditorError(
                'Failed to create grid line',
                ERROR_CODES.OBJECT_CREATION_FAILED,
                ERROR_TYPES.FABRIC,
                { start, end, error }
            );
        }
    }

    /**
     * Apply platform styling
     */
    applyPlatformStyle(object: unknown): void {
        if (!(object instanceof fabric.Line)) {
            return;
        }

        object.set({
            stroke: EDITOR_CONFIG.COLORS.PLATFORM,
            strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
            selectable: true
        });
    }

    /**
     * Apply spike styling
     */
    applySpikeStyle(object: unknown): void {
        if (!(object instanceof fabric.Polygon)) {
            return;
        }

        object.set({
            fill: EDITOR_CONFIG.COLORS.SPIKE,
            stroke: EDITOR_CONFIG.COLORS.SPIKE_BORDER,
            strokeWidth: 2,
            selectable: true
        });
    }

    /**
     * Apply goal styling
     */
    applyGoalStyle(object: unknown): void {
        if (!(object instanceof fabric.Rect)) {
            return;
        }

        object.set({
            fill: EDITOR_CONFIG.COLORS.GOAL,
            stroke: EDITOR_CONFIG.COLORS.GOAL_BORDER,
            strokeWidth: 2,
            selectable: true
        });
    }

    /**
     * Apply text styling
     */
    applyTextStyle(object: unknown): void {
        if (!(object instanceof fabric.Text)) {
            return;
        }

        object.set({
            fontSize: EDITOR_CONFIG.TEXT.FONT_SIZE,
            fontFamily: EDITOR_CONFIG.TEXT.FONT_FAMILY,
            fill: EDITOR_CONFIG.COLORS.TEXT,
            selectable: true
        });
    }

    /**
     * Apply grid styling
     */
    applyGridStyle(object: unknown): void {
        if (!(object instanceof fabric.Line)) {
            return;
        }

        object.set({
            stroke: EDITOR_CONFIG.COLORS.GRID,
            strokeWidth: 1,
            selectable: false,
            evented: false
        });
    }

    /**
     * Get object bounds
     */
    getObjectBounds(object: unknown): Bounds {
        if (!(object instanceof fabric.Object)) {
            throw new EditorError(
                'Object is not a Fabric.js object',
                ERROR_CODES.INVALID_OBJECT_TYPE,
                ERROR_TYPES.FABRIC,
                { object }
            );
        }

        const boundingRect = object.getBoundingRect();
        return {
            x: boundingRect.left,
            y: boundingRect.top,
            width: boundingRect.width,
            height: boundingRect.height
        };
    }

    /**
     * Set object data
     */
    setObjectData(object: unknown, data: Record<string, unknown>): void {
        if (!(object instanceof fabric.Object)) {
            throw new EditorError(
                'Object is not a Fabric.js object',
                ERROR_CODES.INVALID_OBJECT_TYPE,
                ERROR_TYPES.FABRIC,
                { object, data }
            );
        }

        // Store data in the object
        (object as any).data = { ...(object as any).data, ...data };

        DebugHelper.log('Object data set', { objectType: object.type, data });
    }

    /**
     * Get object data
     */
    getObjectData(object: unknown): Record<string, unknown> | null {
        if (!(object instanceof fabric.Object)) {
            return null;
        }

        return (object as any).data || null;
    }

    /**
     * Snap position to grid
     */
    snapToGrid(position: Position, gridSize: number): Position {
        return {
            x: Math.round(position.x / gridSize) * gridSize,
            y: Math.round(position.y / gridSize) * gridSize
        };
    }

    /**
     * Update platform end position (for drawing)
     */
    updatePlatformEndPosition(platformObject: unknown, endPosition: Position): void {
        if (!(platformObject instanceof fabric.Line)) {
            throw new EditorError(
                'Object is not a platform (Line)',
                ERROR_CODES.INVALID_OBJECT_TYPE,
                ERROR_TYPES.FABRIC,
                { platformObject, endPosition }
            );
        }

        platformObject.set({
            x2: endPosition.x,
            y2: endPosition.y
        });

        this.canvas.renderAll();
    }

    /**
     * Check if object is currently being drawn
     */
    isObjectBeingDrawn(object: unknown): boolean {
        const data = this.getObjectData(object);
        return data?.isDrawing === true;
    }

    /**
     * Mark object as finished drawing
     */
    finishObjectDrawing(object: unknown): void {
        if (!(object instanceof fabric.Object)) {
            return;
        }

        const currentData = this.getObjectData(object) || {};
        this.setObjectData(object, { ...currentData, isDrawing: false });

        object.set({ selectable: true });
        this.canvas.renderAll();
    }
}

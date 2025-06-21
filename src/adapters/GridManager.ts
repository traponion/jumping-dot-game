/**
 * @fileoverview Grid management for editor canvas
 * @module adapters/GridManager
 * @description Handles grid display, snapping, and grid-related operations
 */

import * as fabric from 'fabric';
import { EDITOR_CONFIG } from '../types/EditorTypes.js';
import { ObjectDrawer } from './ObjectDrawer.js';

/**
 * Grid manager for editor canvas
 * @description Manages grid display, object snapping, and grid operations
 */
export class GridManager {
    private canvas: fabric.Canvas;
    private objectDrawer: ObjectDrawer;
    private gridEnabled: boolean = false;
    private snapToGridEnabled: boolean = false;

    /**
     * Create grid manager instance
     * @param canvas - Fabric canvas for grid rendering
     * @param objectDrawer - Object drawer for creating grid lines
     */
    constructor(canvas: fabric.Canvas, objectDrawer: ObjectDrawer) {
        this.canvas = canvas;
        this.objectDrawer = objectDrawer;
    }

    /**
     * Toggle grid display
     */
    public toggleGrid(): void {
        if (this.gridEnabled) {
            this.hideGrid();
        } else {
            this.showGrid();
        }
    }

    /**
     * Show grid on canvas
     */
    public showGrid(): void {
        if (this.gridEnabled) return;
        
        this.drawGrid();
        this.gridEnabled = true;
        this.canvas.renderAll();
    }

    /**
     * Hide grid from canvas
     */
    public hideGrid(): void {
        if (!this.gridEnabled) return;
        
        this.removeGridObjects();
        this.gridEnabled = false;
        this.canvas.renderAll();
    }

    /**
     * Toggle snap to grid functionality
     */
    public toggleSnapToGrid(): void {
        this.snapToGridEnabled = !this.snapToGridEnabled;
    }
    
    /**
     * Set snap to grid state
     */
    public setSnapToGrid(enabled: boolean): void {
        this.snapToGridEnabled = enabled;
    }
    /**
     * Check if grid is enabled
     */
    public isGridEnabled(): boolean {
        return this.gridEnabled;
    }

    /**
     * Check if snap to grid is enabled
     */
    public isSnapToGridEnabled(): boolean {
        return this.snapToGridEnabled;
    }

    /**
     * Snap position to grid
     * @param x - X coordinate
     * @param y - Y coordinate
     * @returns Snapped coordinates
     */
    public snapToGrid(x: number, y: number): { x: number; y: number } {
        if (!this.snapToGridEnabled) {
            return { x, y };
        }

        const gridSize = EDITOR_CONFIG.GRID_SIZE;
        return {
            x: Math.round(x / gridSize) * gridSize,
            y: Math.round(y / gridSize) * gridSize
        };
    }

    /**
     * Draw grid lines on canvas
     */
    private drawGrid(): void {
        const canvasWidth = this.canvas.width!;
        const canvasHeight = this.canvas.height!;
        const gridSize = EDITOR_CONFIG.GRID_SIZE;

        // Draw vertical lines
        for (let x = 0; x <= canvasWidth; x += gridSize) {
            this.objectDrawer.createGridLine(
                { x, y: 0 },
                { x, y: canvasHeight }
            );
        }

        // Draw horizontal lines
        for (let y = 0; y <= canvasHeight; y += gridSize) {
            this.objectDrawer.createGridLine(
                { x: 0, y },
                { x: canvasWidth, y }
            );
        }
    }

    /**
     * Remove all grid objects from canvas
     */
    private removeGridObjects(): void {
        const objects = this.canvas.getObjects();
        const gridObjects = objects.filter(obj => {
            const data = (obj as any).data;
            return data && data.type === 'grid';
        });

        gridObjects.forEach(obj => {
            this.canvas.remove(obj);
        });
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.hideGrid();
    }
}
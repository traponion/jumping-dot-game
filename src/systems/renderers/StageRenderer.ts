/**
 * @fileoverview Stage elements rendering (platforms, spikes, goals, texts)
 * @module systems/renderers/StageRenderer
 * @description Specialized renderer for stage elements like platforms, spikes, and goals.
 * Separated from FabricRenderSystem to maintain single responsibility principle.
 */

import * as fabric from 'fabric';
import type { StageData, Platform, Spike, Goal, TextElement } from '../../core/StageLoader.js';

/**
 * Renderer for stage elements (platforms, spikes, goals, texts)
 * @description Handles rendering of all stage-related visual elements.
 */
export class StageRenderer {
    private canvas: fabric.Canvas;
    private platformShapes: fabric.Rect[] = [];
    private spikeShapes: fabric.Group[] = [];
    private goalShape: fabric.Group | null = null;

    /**
     * Creates new StageRenderer instance
     * @param canvas - Fabric.js canvas instance
     */
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Render complete stage data
     * @param stage - Stage data to render
     */
    public renderStage(stage: StageData): void {
        this.renderPlatforms(stage.platforms);
        this.renderSpikes(stage.spikes);
        this.renderGoal(stage.goal);
        this.renderStageTexts(stage.startText, stage.goalText);
    }

    /**
     * Render platform elements
     * @param platforms - Array of platform data
     */
    private renderPlatforms(platforms: Platform[]): void {
        // Clear existing platform shapes
        this.platformShapes.forEach(shape => this.canvas.remove(shape));
        this.platformShapes = [];

        platforms.forEach(platform => {
            const rect = new fabric.Rect({
                left: platform.x1,
                top: platform.y1,
                width: platform.x2 - platform.x1,
                height: platform.y2 - platform.y1,
                fill: '#4a5568',
                stroke: '#2d3748',
                strokeWidth: 2,
                selectable: false,
                evented: false
            });

            this.platformShapes.push(rect);
            this.canvas.add(rect);
        });
    }

    /**
     * Render spike elements
     * @param spikes - Array of spike data
     */
    private renderSpikes(spikes: Spike[]): void {
        // Clear existing spike shapes
        this.spikeShapes.forEach(shape => this.canvas.remove(shape));
        this.spikeShapes = [];

        spikes.forEach(spike => {
            const triangle = new fabric.Triangle({
                left: spike.x,
                top: spike.y,
                width: spike.width,
                height: spike.height,
                fill: '#e53e3e',
                stroke: '#c53030',
                strokeWidth: 2,
                selectable: false,
                evented: false,
                originX: 'center',
                originY: 'center'
            });

            const group = new fabric.Group([triangle], {
                left: spike.x,
                top: spike.y,
                selectable: false,
                evented: false
            });

            this.spikeShapes.push(group);
            this.canvas.add(group);
        });
    }

    /**
     * Render goal element
     * @param goal - Goal data
     */
    private renderGoal(goal: Goal): void {
        // Clear existing goal shape
        if (this.goalShape) {
            this.canvas.remove(this.goalShape);
            this.goalShape = null;
        }

        const rect = new fabric.Rect({
            left: 0,
            top: 0,
            width: goal.width,
            height: goal.height,
            fill: '#38a169',
            stroke: '#2f855a',
            strokeWidth: 3,
            selectable: false,
            evented: false
        });

        const innerRect = new fabric.Rect({
            left: 3,
            top: 3,
            width: goal.width - 6,
            height: goal.height - 6,
            fill: 'transparent',
            stroke: '#68d391',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });

        this.goalShape = new fabric.Group([rect, innerRect], {
            left: goal.x,
            top: goal.y,
            selectable: false,
            evented: false
        });

        this.canvas.add(this.goalShape);
    }

    /**
     * Render stage text elements
     * @param startText - Start text data
     * @param goalText - Goal text data
     */
    private renderStageTexts(startText: TextElement, goalText: TextElement): void {
        const startTextObj = new fabric.Text(startText.text, {
            left: startText.x,
            top: startText.y,
            fontSize: 16,
            fill: '#e2e8f0',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false
        });

        const goalTextObj = new fabric.Text(goalText.text, {
            left: goalText.x,
            top: goalText.y,
            fontSize: 16,
            fill: '#68d391',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false
        });

        this.canvas.add(startTextObj);
        this.canvas.add(goalTextObj);
    }

    /**
     * Clear all stage elements
     */
    public clearStage(): void {
        this.platformShapes.forEach(shape => this.canvas.remove(shape));
        this.spikeShapes.forEach(shape => this.canvas.remove(shape));
        if (this.goalShape) {
            this.canvas.remove(this.goalShape);
        }
        
        this.platformShapes = [];
        this.spikeShapes = [];
        this.goalShape = null;
    }

    /**
     * Cleanup renderer resources
     */
    public dispose(): void {
        this.clearStage();
    }
}
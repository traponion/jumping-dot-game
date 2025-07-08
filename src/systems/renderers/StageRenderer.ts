import * as fabric from 'fabric';
import type { Goal, MovingPlatform, Platform, Spike, StageData } from '../../core/StageLoader';
import { createNonInteractiveShape } from '../../utils/FabricObjectFactory';

/**
 * StageRenderer - Handles stage element rendering
 * Extracted from FabricRenderSystem for single responsibility
 */
export class StageRenderer {
    private platformShapes: fabric.Object[] = [];
    private movingPlatformShapes: fabric.Object[] = [];
    private spikeShapes: fabric.Object[] = [];
    private goalShape: fabric.Object | null = null;
    private textShapes: fabric.Object[] = [];

    constructor(private canvas: fabric.Canvas) {}

    /**
     * Render complete stage with all elements
     */
    renderStage(stageData: StageData): void {
        this.cleanup();
        this.renderPlatforms(stageData.platforms);

        // Render moving platforms if they exist
        if (stageData.movingPlatforms && stageData.movingPlatforms.length > 0) {
            this.renderMovingPlatforms(stageData.movingPlatforms);
        }

        this.renderSpikes(stageData.spikes);
        this.renderGoal(stageData.goal);
        this.renderStageTexts(stageData);
    }

    /**
     * Render static platforms as white lines
     */
    renderPlatforms(platforms: Platform[]): void {
        // Clean up existing platform shapes
        for (const shape of this.platformShapes) {
            this.canvas.remove(shape);
        }
        this.platformShapes = [];

        for (const platform of platforms) {
            const platformLine = new fabric.Line(
                [platform.x1, platform.y1, platform.x2, platform.y2],
                createNonInteractiveShape({
                    stroke: 'white',
                    strokeWidth: 2
                })
            );

            this.platformShapes.push(platformLine);
            this.canvas.add(platformLine);
        }
    }

    /**
     * Render moving platforms with distinct gold styling
     */
    renderMovingPlatforms(movingPlatforms: MovingPlatform[]): void {
        // Clean up existing moving platform shapes
        for (const shape of this.movingPlatformShapes) {
            this.canvas.remove(shape);
        }
        this.movingPlatformShapes = [];

        for (const platform of movingPlatforms) {
            const platformLine = new fabric.Line(
                [platform.x1, platform.y1, platform.x2, platform.y2],
                createNonInteractiveShape({
                    stroke: '#FFD700', // Gold color for moving platforms
                    strokeWidth: 3 // Slightly thicker to indicate movement
                })
            );

            this.movingPlatformShapes.push(platformLine);
            this.canvas.add(platformLine);
        }
    }

    /**
     * Render spikes as triangular polygons
     */
    renderSpikes(spikes: Spike[]): void {
        // Clean up existing spike shapes
        for (const shape of this.spikeShapes) {
            this.canvas.remove(shape);
        }
        this.spikeShapes = [];

        for (const spike of spikes) {
            // Create triangular spike points
            const points = [
                { x: spike.x, y: spike.y + spike.height },
                { x: spike.x + spike.width / 2, y: spike.y },
                { x: spike.x + spike.width, y: spike.y + spike.height }
            ];

            const spikeShape = new fabric.Polygon(
                points,
                createNonInteractiveShape({
                    fill: 'white',
                    stroke: 'white',
                    strokeWidth: 1
                })
            );

            this.spikeShapes.push(spikeShape);
            this.canvas.add(spikeShape);
        }
    }

    /**
     * Render goal as rectangular frame with cross pattern
     */
    renderGoal(goal: Goal): void {
        // Clean up existing goal shape
        if (this.goalShape) {
            this.canvas.remove(this.goalShape);
        }

        // Create goal frame
        this.goalShape = new fabric.Rect(
            createNonInteractiveShape({
                left: goal.x,
                top: goal.y,
                width: goal.width,
                height: goal.height,
                fill: 'transparent',
                stroke: 'white',
                strokeWidth: 2
            })
        );

        this.canvas.add(this.goalShape);

        // Add cross pattern
        const line1 = new fabric.Line(
            [goal.x, goal.y, goal.x + goal.width, goal.y + goal.height],
            createNonInteractiveShape({
                stroke: 'white',
                strokeWidth: 2
            })
        );

        const line2 = new fabric.Line(
            [goal.x + goal.width, goal.y, goal.x, goal.y + goal.height],
            createNonInteractiveShape({
                stroke: 'white',
                strokeWidth: 2
            })
        );

        this.canvas.add(line1);
        this.canvas.add(line2);
    }

    /**
     * Render stage text elements
     */
    renderStageTexts(stage: StageData): void {
        // Clean up existing text shapes
        for (const shape of this.textShapes) {
            this.canvas.remove(shape);
        }
        this.textShapes = [];

        // Render start text
        const startText = new fabric.Text(
            stage.startText.text,
            createNonInteractiveShape({
                left: stage.startText.x,
                top: stage.startText.y,
                fill: 'white',
                fontSize: 16,
                fontFamily: 'Arial'
            })
        );

        this.textShapes.push(startText);
        this.canvas.add(startText);

        // Render goal text
        const goalText = new fabric.Text(
            stage.goalText.text,
            createNonInteractiveShape({
                left: stage.goalText.x,
                top: stage.goalText.y,
                fill: 'white',
                fontSize: 16,
                fontFamily: 'Arial'
            })
        );

        this.textShapes.push(goalText);
        this.canvas.add(goalText);

        // Render optional text elements
        if (stage.leftEdgeMessage) {
            const leftEdgeText = new fabric.Text(
                stage.leftEdgeMessage.text,
                createNonInteractiveShape({
                    left: stage.leftEdgeMessage.x,
                    top: stage.leftEdgeMessage.y,
                    fill: 'white',
                    fontSize: 14,
                    fontFamily: 'Arial'
                })
            );

            this.textShapes.push(leftEdgeText);
            this.canvas.add(leftEdgeText);
        }

        if (stage.leftEdgeSubMessage) {
            const leftEdgeSubText = new fabric.Text(
                stage.leftEdgeSubMessage.text,
                createNonInteractiveShape({
                    left: stage.leftEdgeSubMessage.x,
                    top: stage.leftEdgeSubMessage.y,
                    fill: 'white',
                    fontSize: 12,
                    fontFamily: 'Arial'
                })
            );

            this.textShapes.push(leftEdgeSubText);
            this.canvas.add(leftEdgeSubText);
        }
    }

    /**
     * Clean up all stage-related shapes
     */
    cleanup(): void {
        // Clean up platform shapes
        for (const shape of this.platformShapes) {
            this.canvas.remove(shape);
        }
        this.platformShapes = [];

        // Clean up moving platform shapes
        for (const shape of this.movingPlatformShapes) {
            this.canvas.remove(shape);
        }
        this.movingPlatformShapes = [];

        // Clean up spike shapes
        for (const shape of this.spikeShapes) {
            this.canvas.remove(shape);
        }
        this.spikeShapes = [];

        // Clean up goal shape
        if (this.goalShape) {
            this.canvas.remove(this.goalShape);
            this.goalShape = null;
        }

        // Clean up text shapes
        for (const shape of this.textShapes) {
            this.canvas.remove(shape);
        }
        this.textShapes = [];
    }
}

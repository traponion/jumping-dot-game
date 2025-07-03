import * as fabric from 'fabric';
import type { Player, TrailPoint } from '../../types/GameTypes';

/**
 * PlayerRenderer - Handles player and trail rendering
 * Extracted from FabricRenderSystem for single responsibility
 */
export class PlayerRenderer {
    private playerShape: fabric.Circle | null = null;
    private trailShapes: fabric.Circle[] = [];

    constructor(private canvas: fabric.Canvas) {}

    /**
     * Render player as white circle
     */
    renderPlayer(player: Player): void {
        if (this.playerShape) {
            // Update existing player shape
            this.playerShape.set({
                left: player.x - player.radius,
                top: player.y - player.radius
            });
        } else {
            // Create new player shape
            this.playerShape = new fabric.Circle({
                left: player.x - player.radius,
                top: player.y - player.radius,
                radius: player.radius,
                fill: 'white',
                selectable: false,
                evented: false
            });
            this.canvas.add(this.playerShape);
        }
    }

    /**
     * Render player trail with fading effect
     */
    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        // Clear existing trail shapes
        for (const shape of this.trailShapes) {
            this.canvas.remove(shape);
        }
        this.trailShapes = [];

        // Limit trail points to maximum of 50
        const maxTrailPoints = Math.min(trail.length, 50);

        for (let i = 0; i < maxTrailPoints; i++) {
            const point = trail[trail.length - 1 - i]; // Latest first
            const alpha = (maxTrailPoints - i) / maxTrailPoints;
            const radius = playerRadius * alpha * 0.8;

            const trailShape = new fabric.Circle({
                left: point.x - radius,
                top: point.y - radius,
                radius: radius,
                fill: `rgba(255, 255, 255, ${alpha * 0.6})`,
                selectable: false,
                evented: false
            });

            this.trailShapes.push(trailShape);
            this.canvas.add(trailShape);
        }
    }

    /**
     * Clean up all player-related shapes
     */
    cleanup(): void {
        if (this.playerShape) {
            this.canvas.remove(this.playerShape);
            this.playerShape = null;
        }

        for (const shape of this.trailShapes) {
            this.canvas.remove(shape);
        }
        this.trailShapes = [];
    }
}

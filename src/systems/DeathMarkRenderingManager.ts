import type { Application, Graphics } from 'pixi.js';
import { Graphics as PIXIGraphics } from 'pixi.js';
import type { DeathMark } from '../types/GameTypes';

/**
 * Manages death mark rendering using PixiJS Graphics API
 
 */
export class DeathMarkRenderingManager {
    private app: Application;
    private deathMarkGraphics: Graphics | null = null;
    private isAddedToStage = false;

    constructor(app: Application) {
        this.app = app;
    }

    /**
     * Renders all death marks as red X symbols using PixiJS Graphics
     */
    renderDeathMarks(deathMarks: DeathMark[]): void {
        // Create graphics object if it doesn't exist
        if (!this.deathMarkGraphics) {
            this.deathMarkGraphics = new PIXIGraphics();
            this.app.stage.addChild(this.deathMarkGraphics);
            this.isAddedToStage = true;
        }

        // Clear previous death marks
        this.deathMarkGraphics.clear();

        if (deathMarks.length === 0) {
            this.deathMarkGraphics.visible = true;
            return;
        }

        // Set stroke style for red X marks
        this.deathMarkGraphics.stroke({
            color: 0xff0000, // Red color (rgba(255, 0, 0, 0.8) equivalent)
            width: 3,
            alpha: 0.8
        });

        // Draw all death marks as X symbols
        for (const mark of deathMarks) {
            this.drawXMark(mark.x, mark.y);
        }
        this.deathMarkGraphics.visible = true;
    }

    /**
     * Draws a single X mark at the specified coordinates
     */
    private drawXMark(x: number, y: number): void {
        if (!this.deathMarkGraphics) return;

        const size = 8; // X mark size (half-width/height)

        // First line of X: top-left to bottom-right
        this.deathMarkGraphics.moveTo(x - size, y - size);
        this.deathMarkGraphics.lineTo(x + size, y + size);

        // Second line of X: top-right to bottom-left
        this.deathMarkGraphics.moveTo(x + size, y - size);
        this.deathMarkGraphics.lineTo(x - size, y + size);
    }

    /**
     * Destroys the graphics object and cleans up resources
     */
    destroy(): void {
        if (this.deathMarkGraphics) {
            if (this.isAddedToStage && this.deathMarkGraphics.parent) {
                this.app.stage.removeChild(this.deathMarkGraphics);
            }
            this.deathMarkGraphics.destroy();
            this.deathMarkGraphics = null;
            this.isAddedToStage = false;
        }
    }
}

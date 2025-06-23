import * as fabric from 'fabric';
import type { DeathMarkData, IDeathMarkRenderer } from './IDeathMarkRenderer.js';

/**
 * Fabric.js implementation of death mark renderer
 * This class is intentionally NOT tested due to fabric.js complexity
 * Business logic should be tested in DeathMarkManager instead
 */
export class FabricDeathMarkRenderer implements IDeathMarkRenderer {
    private canvas: fabric.Canvas;
    private deathMarkPath: fabric.Path | null = null;

    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    renderDeathMarks(deathMarks: DeathMarkData[]): void {
        // Remove previous path if it exists
        this.clearDeathMarks();

        if (deathMarks.length === 0) {
            return;
        }

        // Generate combined path data for all death marks
        const pathData = deathMarks
            .map((mark) => {
                const size = 8;
                // Create X mark using SVG path commands
                const line1 = `M ${mark.x - size} ${mark.y - size} L ${mark.x + size} ${mark.y + size}`;
                const line2 = `M ${mark.x + size} ${mark.y - size} L ${mark.x - size} ${mark.y + size}`;
                return `${line1} ${line2}`;
            })
            .join(' ');

        // Create single Path object for all death marks
        this.deathMarkPath = new fabric.Path(pathData, {
            stroke: 'rgba(255, 0, 0, 0.8)',
            strokeWidth: 3,
            selectable: false,
            evented: false,
            objectCaching: false // Performance optimization for dynamic objects
        });

        this.canvas.add(this.deathMarkPath);
    }

    clearDeathMarks(): void {
        if (this.deathMarkPath) {
            this.canvas.remove(this.deathMarkPath);
            this.deathMarkPath = null;
        }
    }

    async cleanup(): Promise<void> {
        this.clearDeathMarks();
    }
}

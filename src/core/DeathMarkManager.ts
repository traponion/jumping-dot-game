import type { DeathMarkData, IDeathMarkRenderer } from '../adapters/IDeathMarkRenderer.js';
import type { DeathMark } from '../types/GameTypes.js';

/**
 * Manages death mark business logic
 * This class contains the core logic and should be thoroughly tested
 */
export class DeathMarkManager {
    private renderer: IDeathMarkRenderer;
    private deathMarks: DeathMark[] = [];

    constructor(renderer: IDeathMarkRenderer) {
        this.renderer = renderer;
    }

    /**
     * Add a new death mark
     */
    addDeathMark(x: number, y: number): void {
        const deathMark: DeathMark = {
            x,
            y,
            timestamp: Date.now()
        };

        this.deathMarks.push(deathMark);
        this.updateRenderer();
    }

    /**
     * Clear all death marks
     */
    clearDeathMarks(): void {
        this.deathMarks = [];
        this.renderer.clearDeathMarks();
    }

    /**
     * Get current death mark count
     */
    getDeathMarkCount(): number {
        return this.deathMarks.length;
    }

    /**
     * Get all death marks (for testing)
     */
    getDeathMarks(): DeathMark[] {
        return [...this.deathMarks];
    }

    /**
     * Remove old death marks (if needed in the future)
     */
    removeOldDeathMarks(maxAge: number): void {
        const now = Date.now();
        const before = this.deathMarks.length;

        this.deathMarks = this.deathMarks.filter((mark) => now - mark.timestamp < maxAge);

        if (this.deathMarks.length !== before) {
            this.updateRenderer();
        }
    }

    /**
     * Update renderer with current death marks
     */
    private updateRenderer(): void {
        const renderData: DeathMarkData[] = this.deathMarks.map((mark) => ({
            x: mark.x,
            y: mark.y,
            timestamp: mark.timestamp
        }));

        this.renderer.renderDeathMarks(renderData);
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        this.deathMarks = [];
        await this.renderer.cleanup();
    }
}

import type { Application } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeathMarkRenderingManager } from '../systems/DeathMarkRenderingManager';
import type { DeathMark } from '../types/GameTypes';

// Mock PIXI.js Graphics
const mockGraphicsDestroy = vi.fn();
const mockGraphicsClear = vi.fn();
const mockGraphicsMoveTo = vi.fn();
const mockGraphicsLineTo = vi.fn();
const mockGraphicsStroke = vi.fn();

const mockApp = {
    stage: {
        addChild: vi.fn(),
        removeChild: vi.fn()
    },
    renderer: {
        width: 800,
        height: 600
    }
} as unknown as Application;

const createMockGraphics = () => ({
    clear: mockGraphicsClear,
    moveTo: mockGraphicsMoveTo,
    lineTo: mockGraphicsLineTo,
    stroke: mockGraphicsStroke,
    destroy: mockGraphicsDestroy,
    visible: true,
    parent: mockApp.stage // Set parent to simulate being added to stage
});

vi.mock('pixi.js', () => ({
    Graphics: vi.fn(() => createMockGraphics())
}));

describe('DeathMarkRenderingManager', () => {
    let deathMarkManager: DeathMarkRenderingManager;

    beforeEach(() => {
        vi.clearAllMocks();
        deathMarkManager = new DeathMarkRenderingManager(mockApp);
    });

    describe('initialization', () => {
        it('should initialize with PIXI application', () => {
            expect(deathMarkManager).toBeInstanceOf(DeathMarkRenderingManager);
        });

        it('should create Graphics object for death marks', () => {
            expect(createMockGraphics).toBeDefined();
        });
    });

    describe('renderDeathMarks', () => {
        const mockDeathMarks: DeathMark[] = [
            { x: 100, y: 200, timestamp: Date.now() },
            { x: 150, y: 250, timestamp: Date.now() - 1000 },
            { x: 200, y: 300, timestamp: Date.now() - 2000 }
        ];

        it('should clear previous death marks before rendering', () => {
            deathMarkManager.renderDeathMarks(mockDeathMarks);

            expect(mockGraphicsClear).toHaveBeenCalled();
        });

        it('should render X marks for each death mark', () => {
            deathMarkManager.renderDeathMarks(mockDeathMarks);

            // Each X mark requires 4 moveTo/lineTo calls (2 lines, each with start and end)
            expect(mockGraphicsMoveTo).toHaveBeenCalledTimes(6); // 3 marks * 2 lines per mark
            expect(mockGraphicsLineTo).toHaveBeenCalledTimes(6); // 3 marks * 2 lines per mark
        });

        it('should position X marks correctly', () => {
            const singleMark: DeathMark[] = [{ x: 100, y: 200, timestamp: Date.now() }];

            deathMarkManager.renderDeathMarks(singleMark);

            const size = 8; // Expected X mark size
            // First line of X: top-left to bottom-right
            expect(mockGraphicsMoveTo).toHaveBeenCalledWith(100 - size, 200 - size);
            expect(mockGraphicsLineTo).toHaveBeenCalledWith(100 + size, 200 + size);
            // Second line of X: top-right to bottom-left
            expect(mockGraphicsMoveTo).toHaveBeenCalledWith(100 + size, 200 - size);
            expect(mockGraphicsLineTo).toHaveBeenCalledWith(100 - size, 200 + size);
        });

        it('should apply stroke style after drawing all marks', () => {
            deathMarkManager.renderDeathMarks(mockDeathMarks);

            expect(mockGraphicsStroke).toHaveBeenCalled();
        });

        it('should handle empty death marks array gracefully', () => {
            deathMarkManager.renderDeathMarks([]);

            expect(mockGraphicsClear).toHaveBeenCalled();
            expect(mockGraphicsMoveTo).not.toHaveBeenCalled();
            expect(mockGraphicsLineTo).not.toHaveBeenCalled();
        });

        it('should make graphics visible when death marks exist', () => {
            const graphics = createMockGraphics();
            deathMarkManager.renderDeathMarks(mockDeathMarks);

            expect(graphics.visible).toBe(true);
        });

        it('should hide graphics when no death marks exist', () => {
            const graphics = createMockGraphics();
            deathMarkManager.renderDeathMarks([]);

            expect(graphics.visible).toBe(true); // Should still be visible but cleared
        });

        it('should add graphics to stage on first render', () => {
            deathMarkManager.renderDeathMarks(mockDeathMarks);

            expect(mockApp.stage.addChild).toHaveBeenCalled();
        });
    });

    describe('performance optimization', () => {
        it('should render multiple death marks efficiently in single graphics object', () => {
            const manyDeathMarks: DeathMark[] = Array.from({ length: 100 }, (_, i) => ({
                x: i * 10,
                y: i * 5,
                timestamp: Date.now() - i * 100
            }));

            deathMarkManager.renderDeathMarks(manyDeathMarks);

            // Should clear once regardless of number of marks
            expect(mockGraphicsClear).toHaveBeenCalledTimes(1);
            // Should create one stroke call for all marks
            expect(mockGraphicsStroke).toHaveBeenCalledTimes(1);
            // Should handle 100 marks * 2 lines * 2 calls each = 400 total calls
            expect(mockGraphicsMoveTo).toHaveBeenCalledTimes(200); // 100 marks * 2 lines
            expect(mockGraphicsLineTo).toHaveBeenCalledTimes(200); // 100 marks * 2 lines
        });

        it('should reuse graphics object across multiple renders', () => {
            const marks1: DeathMark[] = [{ x: 100, y: 100, timestamp: Date.now() }];
            const marks2: DeathMark[] = [{ x: 200, y: 200, timestamp: Date.now() }];

            deathMarkManager.renderDeathMarks(marks1);
            deathMarkManager.renderDeathMarks(marks2);

            // Should only add to stage once (reusing graphics object)
            expect(mockApp.stage.addChild).toHaveBeenCalledTimes(1);
            // Should clear twice (once for each render)
            expect(mockGraphicsClear).toHaveBeenCalledTimes(2);
        });
    });

    describe('visual styling', () => {
        it('should use red color for death marks', () => {
            const mockDeathMarks: DeathMark[] = [{ x: 100, y: 200, timestamp: Date.now() }];

            deathMarkManager.renderDeathMarks(mockDeathMarks);

            // Graphics stroke should be called with red color and proper width
            expect(mockGraphicsStroke).toHaveBeenCalled();
        });

        it('should use correct line width for visibility', () => {
            const mockDeathMarks: DeathMark[] = [{ x: 100, y: 200, timestamp: Date.now() }];

            deathMarkManager.renderDeathMarks(mockDeathMarks);

            // Should apply stroke with appropriate line width
            expect(mockGraphicsStroke).toHaveBeenCalled();
        });

        it('should maintain consistent X mark size', () => {
            const mockDeathMarks: DeathMark[] = [
                { x: 50, y: 100, timestamp: Date.now() },
                { x: 500, y: 400, timestamp: Date.now() }
            ];

            deathMarkManager.renderDeathMarks(mockDeathMarks);

            const size = 8;
            // First mark
            expect(mockGraphicsMoveTo).toHaveBeenCalledWith(50 - size, 100 - size);
            expect(mockGraphicsLineTo).toHaveBeenCalledWith(50 + size, 100 + size);
            // Second mark should have same relative size
            expect(mockGraphicsMoveTo).toHaveBeenCalledWith(500 - size, 400 - size);
            expect(mockGraphicsLineTo).toHaveBeenCalledWith(500 + size, 400 + size);
        });
    });

    describe('cleanup and resource management', () => {
        it('should destroy graphics object on cleanup', () => {
            deathMarkManager.renderDeathMarks([{ x: 100, y: 200, timestamp: Date.now() }]);
            deathMarkManager.destroy();

            expect(mockGraphicsDestroy).toHaveBeenCalled();
        });

        it('should remove graphics from stage on cleanup', () => {
            deathMarkManager.renderDeathMarks([{ x: 100, y: 200, timestamp: Date.now() }]);
            deathMarkManager.destroy();

            expect(mockApp.stage.removeChild).toHaveBeenCalled();
        });

        it('should handle destroy when no graphics exist', () => {
            // Should not throw error when destroying without prior rendering
            expect(() => deathMarkManager.destroy()).not.toThrow();
        });

        it('should be safe to call destroy multiple times', () => {
            deathMarkManager.destroy();
            deathMarkManager.destroy();

            // Should not throw error on multiple destroy calls
            expect(mockGraphicsDestroy).toHaveBeenCalledTimes(0); // No graphics created yet
        });
    });

    describe('edge cases', () => {
        it('should handle death marks at screen boundaries', () => {
            const boundaryMarks: DeathMark[] = [
                { x: 0, y: 0, timestamp: Date.now() }, // Top-left corner
                { x: 800, y: 600, timestamp: Date.now() }, // Bottom-right corner
                { x: -10, y: -10, timestamp: Date.now() }, // Off-screen negative
                { x: 1000, y: 1000, timestamp: Date.now() } // Off-screen positive
            ];

            expect(() => deathMarkManager.renderDeathMarks(boundaryMarks)).not.toThrow();
            expect(mockGraphicsMoveTo).toHaveBeenCalledTimes(8); // 4 marks * 2 lines
            expect(mockGraphicsLineTo).toHaveBeenCalledTimes(8);
        });

        it('should handle very large numbers of death marks', () => {
            const massiveDeathMarks: DeathMark[] = Array.from({ length: 1000 }, (_, i) => ({
                x: (i % 100) * 8,
                y: Math.floor(i / 100) * 8,
                timestamp: Date.now() - i
            }));

            expect(() => deathMarkManager.renderDeathMarks(massiveDeathMarks)).not.toThrow();
            expect(mockGraphicsClear).toHaveBeenCalledTimes(1);
            expect(mockGraphicsStroke).toHaveBeenCalledTimes(1);
        });

        it('should handle death marks with same coordinates', () => {
            const duplicateMarks: DeathMark[] = [
                { x: 100, y: 100, timestamp: Date.now() },
                { x: 100, y: 100, timestamp: Date.now() - 1000 },
                { x: 100, y: 100, timestamp: Date.now() - 2000 }
            ];

            expect(() => deathMarkManager.renderDeathMarks(duplicateMarks)).not.toThrow();
            // Should still render all marks even if overlapping
            expect(mockGraphicsMoveTo).toHaveBeenCalledTimes(6); // 3 marks * 2 lines
        });
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FabricRenderSystem } from '../systems/FabricRenderSystem';
import type { DeathMark } from '../types/GameTypes';

// Mock fabric.js
vi.mock('fabric', () => {
    const mockCanvas = {
        add: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn(),
        dispose: vi.fn().mockResolvedValue(undefined),
        renderAll: vi.fn(),
        setViewportTransform: vi.fn(),
        upperCanvasEl: {
            style: {}
        },
        getElement: vi.fn().mockReturnValue({
            getContext: vi.fn().mockReturnValue({
                clearRect: vi.fn()
            }),
            width: 800,
            height: 600
        })
    };

    return {
        Canvas: vi.fn().mockImplementation(() => mockCanvas),
        Path: vi.fn().mockImplementation((pathData, options) => ({
            pathData,
            options,
            type: 'path'
        })),
        Line: vi.fn().mockImplementation((coords, options) => ({
            coords,
            options,
            type: 'line'
        })),
        fabric: {
            Canvas: vi.fn().mockImplementation(() => mockCanvas),
            Path: vi.fn().mockImplementation((pathData, options) => ({
                pathData,
                options,
                type: 'path'
            })),
            Line: vi.fn().mockImplementation((coords, options) => ({
                coords,
                options,
                type: 'line'
            }))
        }
    };
});

describe.skip('FabricRenderSystem - Death Marks Performance', () => {
    let renderSystem: FabricRenderSystem;
    let mockCanvasElement: HTMLCanvasElement;

    beforeEach(() => {
        mockCanvasElement = {
            getContext: vi.fn().mockReturnValue({
                clearRect: vi.fn()
            }),
            width: 800,
            height: 600
        } as unknown as HTMLCanvasElement;

        renderSystem = new FabricRenderSystem(mockCanvasElement);
    });

    afterEach(async () => {
        await renderSystem.cleanup();
    });

    describe('deathMarkPath property', () => {
        it('should initialize deathMarkPath as null', () => {
            // Access private property for testing
            expect((renderSystem as any).deathMarkPath).toBeNull();
        });
    });

    describe('renderDeathMarks with single fabric.Path implementation', () => {
        it('should create single fabric.Path for multiple death marks', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            const mockPath = { type: 'path' };
            const mockCanvas = (renderSystem as any).canvas;

            fabric.Path = vi.fn().mockReturnValue(mockPath);
            mockCanvas.add = vi.fn();
            mockCanvas.remove = vi.fn();

            const deathMarks: DeathMark[] = [
                { x: 100, y: 100, timestamp: Date.now() },
                { x: 200, y: 150, timestamp: Date.now() },
                { x: 300, y: 200, timestamp: Date.now() }
            ];

            renderSystem.renderDeathMarks(deathMarks);

            // Should create exactly one fabric.Path
            expect(fabric.Path).toHaveBeenCalledTimes(1);

            // Should add exactly one object to canvas
            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
            expect(mockCanvas.add).toHaveBeenCalledWith(mockPath);

            // Should store the path in deathMarkPath property
            expect((renderSystem as any).deathMarkPath).toBe(mockPath);
        });

        it('should generate correct SVG path data for X marks', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            fabric.Path = vi.fn();

            const deathMarks: DeathMark[] = [
                { x: 100, y: 100, timestamp: Date.now() },
                { x: 200, y: 150, timestamp: Date.now() }
            ];

            renderSystem.renderDeathMarks(deathMarks);

            const pathDataCall = fabric.Path.mock.calls[0][0];

            // Should contain path data for both marks
            expect(pathDataCall).toContain('M 92 92 L 108 108'); // First mark line1
            expect(pathDataCall).toContain('M 108 92 L 92 108'); // First mark line2
            expect(pathDataCall).toContain('M 192 142 L 208 158'); // Second mark line1
            expect(pathDataCall).toContain('M 208 142 L 192 158'); // Second mark line2
        });

        it('should use correct fabric.Path options', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            fabric.Path = vi.fn();

            const deathMarks: DeathMark[] = [{ x: 100, y: 100, timestamp: Date.now() }];

            renderSystem.renderDeathMarks(deathMarks);

            const pathOptions = fabric.Path.mock.calls[0][1];

            expect(pathOptions).toEqual({
                stroke: 'rgba(255, 0, 0, 0.8)',
                strokeWidth: 3,
                selectable: false,
                evented: false,
                objectCaching: false
            });
        });

        it('should remove previous deathMarkPath before creating new one', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            const mockPath1 = { type: 'path', id: 1 };
            const mockPath2 = { type: 'path', id: 2 };
            const mockCanvas = (renderSystem as any).canvas;

            fabric.Path = vi.fn().mockReturnValueOnce(mockPath1).mockReturnValueOnce(mockPath2);
            mockCanvas.remove = vi.fn();
            mockCanvas.add = vi.fn();

            const deathMarks: DeathMark[] = [{ x: 100, y: 100, timestamp: Date.now() }];

            // First render
            renderSystem.renderDeathMarks(deathMarks);
            expect((renderSystem as any).deathMarkPath).toBe(mockPath1);

            // Second render should remove previous path
            renderSystem.renderDeathMarks(deathMarks);

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockPath1);
            expect((renderSystem as any).deathMarkPath).toBe(mockPath2);
        });

        it('should handle empty death marks array', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            const mockCanvas = (renderSystem as any).canvas;

            fabric.Path = vi.fn();
            mockCanvas.add = vi.fn();
            mockCanvas.remove = vi.fn();

            renderSystem.renderDeathMarks([]);

            // Should not create any fabric.Path
            expect(fabric.Path).not.toHaveBeenCalled();
            expect(mockCanvas.add).not.toHaveBeenCalled();
        });
    });

    describe('cleanup method integration', () => {
        it('should remove deathMarkPath during cleanup', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            const mockPath = { type: 'path' };
            const mockCanvas = (renderSystem as any).canvas;

            fabric.Path = vi.fn().mockReturnValue(mockPath);
            mockCanvas.add = vi.fn();
            mockCanvas.remove = vi.fn();

            // Create death mark path
            const deathMarks: DeathMark[] = [{ x: 100, y: 100, timestamp: Date.now() }];
            renderSystem.renderDeathMarks(deathMarks);

            expect((renderSystem as any).deathMarkPath).toBe(mockPath);

            // Cleanup should remove the path
            await renderSystem.cleanup();

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockPath);
            expect((renderSystem as any).deathMarkPath).toBeNull();
        });
    });

    describe('performance characteristics', () => {
        it('should maintain constant canvas object count regardless of death mark count', async () => {
            const fabricModule = await import('fabric');
            const { fabric } = fabricModule as any;
            const mockCanvas = (renderSystem as any).canvas;

            fabric.Path = vi.fn().mockReturnValue({ type: 'path' });
            mockCanvas.add = vi.fn();

            // Test with varying death mark counts
            const smallSet: DeathMark[] = [{ x: 100, y: 100, timestamp: Date.now() }];
            const largeSet: DeathMark[] = Array.from({ length: 100 }, (_, i) => ({
                x: i * 10,
                y: i * 10,
                timestamp: Date.now()
            }));

            // Both should result in exactly one canvas.add call
            renderSystem.renderDeathMarks(smallSet);
            expect(mockCanvas.add).toHaveBeenCalledTimes(1);

            mockCanvas.add.mockClear();

            renderSystem.renderDeathMarks(largeSet);
            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
        });
    });
});

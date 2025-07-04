import * as fabric from 'fabric';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceManager } from '../systems/renderers/ResourceManager.js';

// Mock fabric canvas and related objects
vi.mock('fabric', () => ({
    Canvas: vi.fn(() => ({
        dispose: vi.fn().mockResolvedValue(undefined),
        getElement: vi.fn(),
        renderAll: vi.fn(),
        clear: vi.fn(),
        backgroundColor: 'black',
        remove: vi.fn()
    })),
    Circle: vi.fn(),
    Path: vi.fn()
}));

describe('ResourceManager', () => {
    let mockCanvas: any;
    let resourceManager: ResourceManager;
    let mockCanvasElement: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create mock canvas element and context
        mockContext = {
            clearRect: vi.fn()
        } as any;

        mockCanvasElement = {
            width: 800,
            height: 600,
            getContext: vi.fn(() => mockContext),
            __fabric: {},
            _fabric: {}
        } as unknown as HTMLCanvasElement & {
            __fabric?: unknown;
            _fabric?: unknown;
        };

        // Create mock fabric canvas
        mockCanvas = {
            dispose: vi.fn().mockResolvedValue(undefined),
            getElement: vi.fn(() => mockCanvasElement),
            renderAll: vi.fn(),
            clear: vi.fn(),
            backgroundColor: 'black',
            remove: vi.fn()
        };

        // Mock the fabric Canvas constructor
        (fabric.Canvas as any).mockImplementation(() => mockCanvas);

        resourceManager = new ResourceManager(mockCanvas);
    });

    describe('renderAll', () => {
        it('should call canvas renderAll method', () => {
            resourceManager.renderAll();
            expect(mockCanvas.renderAll).toHaveBeenCalledOnce();
        });

        it('should handle null canvas gracefully', () => {
            const resourceManagerWithNullCanvas = new ResourceManager(null as any);
            expect(() => resourceManagerWithNullCanvas.renderAll()).not.toThrow();
        });
    });

    describe('clearCanvas', () => {
        it('should clear canvas and set background to black', () => {
            resourceManager.clearCanvas();

            expect(mockCanvas.backgroundColor).toBe('black');
            expect(mockCanvas.clear).toHaveBeenCalledOnce();
            expect(mockCanvas.renderAll).toHaveBeenCalledOnce();
        });

        it('should handle null canvas gracefully', () => {
            const resourceManagerWithNullCanvas = new ResourceManager(null as any);
            expect(() => resourceManagerWithNullCanvas.clearCanvas()).not.toThrow();
        });
    });

    describe('dispose', () => {
        it('should call canvas dispose method', () => {
            resourceManager.dispose();
            expect(mockCanvas.dispose).toHaveBeenCalledOnce();
        });
    });

    describe('cleanup', () => {
        it('should perform complete cleanup with valid canvas', async () => {
            await resourceManager.cleanup();

            expect(mockCanvas.dispose).toHaveBeenCalledOnce();
            expect(mockCanvasElement.getContext).toHaveBeenCalledWith('2d');
            expect(mockContext.clearRect).toHaveBeenCalledWith(0, 0, 800, 600);
            expect((mockCanvasElement as any).__fabric).toBeUndefined();
            expect((mockCanvasElement as any)._fabric).toBeUndefined();
        });

        it('should handle canvas element without context', async () => {
            mockCanvasElement.getContext = vi.fn(() => null);

            await expect(resourceManager.cleanup()).resolves.not.toThrow();
            expect(mockCanvas.dispose).toHaveBeenCalledOnce();
        });

        it('should handle null canvas element', async () => {
            mockCanvas.getElement = vi.fn(() => null);

            await expect(resourceManager.cleanup()).resolves.not.toThrow();
            expect(mockCanvas.dispose).toHaveBeenCalledOnce();
        });

        it('should handle disposal errors gracefully', async () => {
            mockCanvas.dispose = vi.fn().mockRejectedValue(new Error('Disposal failed'));

            // Should not throw errors even when disposal fails
            await expect(resourceManager.cleanup()).resolves.not.toThrow();
            expect(mockCanvas.dispose).toHaveBeenCalledOnce();
        });

        it('should handle null canvas gracefully', async () => {
            const resourceManagerWithNullCanvas = new ResourceManager(null as any);
            await expect(resourceManagerWithNullCanvas.cleanup()).resolves.not.toThrow();
        });
    });
});

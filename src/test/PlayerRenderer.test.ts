import * as fabric from 'fabric';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerRenderer } from '../systems/renderers/PlayerRenderer';
import type { Player } from '../types/GameTypes';

// Mock fabric.js
vi.mock('fabric', () => ({
    Circle: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    }))
}));

describe('PlayerRenderer', () => {
    let renderer: PlayerRenderer;
    let mockCanvas: any;
    let mockPlayer: Player;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn()
        };

        mockPlayer = {
            x: 100,
            y: 200,
            radius: 15,
            vx: 0,
            vy: 0,
            grounded: false
        };

        renderer = new PlayerRenderer(mockCanvas);
    });

    describe('renderPlayer', () => {
        it('should create new player shape when none exists', () => {
            renderer.renderPlayer(mockPlayer);

            expect(fabric.Circle).toHaveBeenCalledWith({
                left: 85, // x - radius
                top: 185, // y - radius
                radius: 15,
                fill: 'white',
                selectable: false,
                evented: false
            });
            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should update existing player shape position', () => {
            // First call creates the shape
            renderer.renderPlayer(mockPlayer);
            const mockShape = { set: vi.fn() };
            (renderer as any).playerShape = mockShape;

            // Second call should update position
            const updatedPlayer = { ...mockPlayer, x: 150, y: 250 };
            renderer.renderPlayer(updatedPlayer);

            expect(mockShape.set).toHaveBeenCalledWith({
                left: 135, // 150 - 15
                top: 235 // 250 - 15
            });
        });
    });

    describe('cleanup', () => {
        it('should remove all shapes from canvas', () => {
            const mockPlayerShape = {};

            (renderer as any).playerShape = mockPlayerShape;

            renderer.cleanup();

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockPlayerShape);
        });
    });
});

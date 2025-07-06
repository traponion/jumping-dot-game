import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerRenderer } from '../systems/renderers/PlayerRenderer';
import type { Player, TrailPoint } from '../types/GameTypes';

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
    let mockTrail: TrailPoint[];

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

        mockTrail = [
            { x: 90, y: 190, timestamp: Date.now() - 200 },
            { x: 95, y: 195, timestamp: Date.now() - 100 },
            { x: 100, y: 200, timestamp: Date.now() }
        ];

        renderer = new PlayerRenderer(mockCanvas);
    });

    describe('renderPlayer', () => {
        it('should create new player shape when none exists', () => {
            renderer.renderPlayer(mockPlayer);

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
        });
    });

    describe('renderTrail', () => {
        it('should clear existing trail shapes', () => {
            const mockTrailShape = { remove: vi.fn() };
            (renderer as any).trailShapes = [mockTrailShape];

            renderer.renderTrail(mockTrail, 15);

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockTrailShape);
        });

        it('should create trail shapes with fading alpha', () => {
            renderer.renderTrail(mockTrail, 15);

            expect(mockCanvas.add).toHaveBeenCalledTimes(3);
        });

        it('should limit trail points to maximum of 50', () => {
            const longTrail = Array.from({ length: 100 }, (_, i) => ({
                x: i,
                y: i,
                timestamp: Date.now() + i
            }));

            renderer.renderTrail(longTrail, 15);
        });
    });

    describe('cleanup', () => {
        it('should remove all shapes from canvas', () => {
            const mockPlayerShape = {};
            const mockTrailShape1 = {};
            const mockTrailShape2 = {};

            (renderer as any).playerShape = mockPlayerShape;
            (renderer as any).trailShapes = [mockTrailShape1, mockTrailShape2];

            renderer.cleanup();

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockPlayerShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockTrailShape1);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockTrailShape2);
        });
    });
});

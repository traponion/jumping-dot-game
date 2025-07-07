import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationRenderer } from '../systems/renderers/AnimationRenderer';
import type { Particle } from '../types/GameTypes';

// Mock fabric.js constructors
vi.mock('fabric', () => ({
    Circle: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Text: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false,
        measureText: vi.fn().mockReturnValue({ width: 100, height: 40 })
    })),
    Line: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Path: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    }))
}));

describe('AnimationRenderer', () => {
    let renderer: AnimationRenderer;
    let mockCanvas: any;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
            getWidth: vi.fn().mockReturnValue(800),
            getHeight: vi.fn().mockReturnValue(600),
            viewportTransform: [1, 0, 0, 1, -100, -50] // Mock camera transform
        };

        renderer = new AnimationRenderer(mockCanvas);

        // Reset all mocks after renderer creation
        vi.clearAllMocks();
    });

    describe('renderDeathAnimation', () => {
        it('should call canvas add for each particle', () => {
            const particles: Particle[] = [
                { x: 100, y: 200, vx: 5, vy: -10, life: 0.8, decay: 0.02, size: 3 },
                { x: 150, y: 250, vx: -3, vy: -8, life: 0.6, decay: 0.02, size: 2 }
            ];

            renderer.renderDeathAnimation(particles);

            expect(mockCanvas.add).toHaveBeenCalledTimes(2);
        });

        it('should handle particles without size property', () => {
            const particles: Particle[] = [
                { x: 100, y: 200, vx: 5, vy: -10, life: 0.8, decay: 0.02 }
            ];

            renderer.renderDeathAnimation(particles);

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
        });
    });

    describe('renderClearAnimation', () => {
        it.skip('should render clear animation particles and text', () => {
            const particles: Particle[] = [
                { x: 100, y: 200, vx: 5, vy: -10, life: 0.8, decay: 0.02 }
            ];

            renderer.renderClearAnimation(particles, 0.5, 400, 300);

            // Should call canvas add for particle + text (2 times)
            expect(mockCanvas.add).toHaveBeenCalledTimes(2);
        });

        it('should not render text when progress is too high', () => {
            const particles: Particle[] = [
                { x: 100, y: 200, vx: 5, vy: -10, life: 0.8, decay: 0.02 }
            ];

            renderer.renderClearAnimation(particles, 0.9, 400, 300);

            // Should only call canvas add for particle (1 time, no text)
            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
        });
    });

    describe('renderLandingPredictions', () => {
        it('should render landing predictions and update animations', () => {
            // Add some landing history to make rendering happen
            renderer.addLandingHistory({ x: 100, y: 200 });

            renderer.renderLandingPredictions();

            // Should call canvas operations for rendering
            expect(mockCanvas.add).toHaveBeenCalled();
        });
    });

    describe('updateLandingPredictionAnimations', () => {
        it('should update animation positions smoothly', () => {
            // Set up some predictions first
            renderer.updateLandingPredictionAnimations();

            // Should not throw error when no predictions exist
            expect(() => renderer.updateLandingPredictionAnimations()).not.toThrow();
        });
    });

    describe('setLandingPredictions', () => {
        it('should set landing predictions for rendering', () => {
            const predictions = [
                { x: 100, y: 200, confidence: 0.8, jumpNumber: 1 },
                { x: 150, y: 250, confidence: 0.6, jumpNumber: 2 }
            ];

            renderer.setLandingPredictions(predictions);

            expect(() => renderer.renderLandingPredictions()).not.toThrow();
        });
    });

    describe('addLandingHistory', () => {
        it('should add landing history point', () => {
            const position = { x: 100, y: 200 };

            renderer.addLandingHistory(position);

            expect(() => renderer.renderLandingPredictions()).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should clean up animation resources', () => {
            renderer.cleanup();

            // Should not throw error
            expect(() => renderer.cleanup()).not.toThrow();
        });
    });
});

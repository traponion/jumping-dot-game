/**
 * @fileoverview Tests for TrailParticleManager - High-performance trail rendering with PixiJS ParticleContainer
 * @module test/TrailParticleManager
 * @description TDD tests for Phase 2.1 - Trail effects migration to PixiJS ParticleContainer
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrailPoint } from '../types/GameTypes.js';

// Mock PIXI classes - must be hoisted before imports
vi.mock('pixi.js', () => {
    const mockTexture = {
        width: 16,
        height: 16,
        destroy: vi.fn()
    };

    const mockParticleContainer = {
        addParticle: vi.fn(),
        removeParticle: vi.fn(),
        removeParticles: vi.fn(),
        particleChildren: [],
        update: vi.fn(),
        destroy: vi.fn(),
        clear: vi.fn()
    };

    const mockParticle = {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        texture: null
    };

    const mockGraphics = {
        circle: vi.fn().mockReturnThis(),
        fill: vi.fn().mockReturnThis(),
        clear: vi.fn().mockReturnThis(),
        destroy: vi.fn()
    };

    return {
        ParticleContainer: vi.fn(() => mockParticleContainer),
        Particle: vi.fn(() => ({ ...mockParticle })),
        Texture: {
            from: vi.fn(() => mockTexture),
            EMPTY: mockTexture
        },
        Graphics: vi.fn(() => mockGraphics),
        RenderTexture: {
            create: vi.fn(() => mockTexture)
        }
    };
});

import * as PIXI from 'pixi.js';

// Import after mocking
import { TrailParticleManager } from '../systems/TrailParticleManager.js';

describe('TrailParticleManager', () => {
    let trailManager: TrailParticleManager;
    let mockApp: PIXI.Application;
    let mockTexture: any;

    beforeEach(() => {
        vi.clearAllMocks();

        // Setup mock texture for testing
        mockTexture = { width: 16, height: 16, destroy: vi.fn() };

        // Mock PIXI Application
        mockApp = {
            renderer: {
                generateTexture: vi.fn(() => mockTexture)
            }
        } as unknown as PIXI.Application;

        trailManager = new TrailParticleManager(mockApp);
    });

    afterEach(() => {
        trailManager?.destroy();
    });

    describe('initialization', () => {
        it('should create TrailParticleManager with ParticleContainer', () => {
            expect(PIXI.ParticleContainer).toHaveBeenCalledWith({
                dynamicProperties: {
                    position: true,
                    scale: true,
                    rotation: false,
                    color: false
                }
            });
            expect(trailManager).toBeDefined();
        });

        it('should create white circle texture for trail particles on first render', () => {
            // Texture should not be created on initialization
            expect(PIXI.Graphics).not.toHaveBeenCalled();
            expect(mockApp.renderer.generateTexture).not.toHaveBeenCalled();

            // Render a trail to trigger texture creation
            trailManager.renderTrail([{ x: 0, y: 0 }], 8);

            // Now, texture should be created
            expect(PIXI.Graphics).toHaveBeenCalled();
            expect(mockApp.renderer.generateTexture).toHaveBeenCalled();
        });

        it('should initialize particle pool as empty', () => {
            expect(trailManager.getActiveParticleCount()).toBe(0);
        });
    });

    describe('renderTrail', () => {
        const sampleTrail: TrailPoint[] = [
            { x: 100, y: 200 },
            { x: 110, y: 210 },
            { x: 120, y: 220 }
        ];

        it('should handle empty trail gracefully', () => {
            trailManager.renderTrail([], 8);
            expect(trailManager.getActiveParticleCount()).toBe(0);
        });

        it('should create particles for each trail point', () => {
            trailManager.renderTrail(sampleTrail, 8);

            expect(PIXI.Particle).toHaveBeenCalledTimes(3);
            expect(trailManager.getActiveParticleCount()).toBe(3);
        });

        it('should process trail points correctly', () => {
            trailManager.renderTrail(sampleTrail, 8);

            // Should create particles for all trail points
            expect(PIXI.Particle).toHaveBeenCalledTimes(3);
            expect(trailManager.getActiveParticleCount()).toBe(3);
        });

        it('should handle different player radius values', () => {
            const playerRadius = 10;
            trailManager.renderTrail(sampleTrail, playerRadius);

            // Should successfully render without errors
            expect(trailManager.getActiveParticleCount()).toBe(3);
        });

        it('should handle trail rendering consistently', () => {
            trailManager.renderTrail(sampleTrail, 8);

            // Verify particle creation and container state
            expect(trailManager.getActiveParticleCount()).toBe(sampleTrail.length);
        });
    });

    describe('particle pooling and cleanup', () => {
        it('should reuse particles when trail count remains same', () => {
            const trail1: TrailPoint[] = [
                { x: 100, y: 200 },
                { x: 110, y: 210 }
            ];
            const trail2: TrailPoint[] = [
                { x: 120, y: 220 },
                { x: 130, y: 230 }
            ];

            trailManager.renderTrail(trail1, 8);
            expect(trailManager.getActiveParticleCount()).toBe(2);

            trailManager.renderTrail(trail2, 8);
            expect(trailManager.getActiveParticleCount()).toBe(2);
        });

        it('should clean up excess particles when trail shrinks', () => {
            const longTrail: TrailPoint[] = [
                { x: 100, y: 200 },
                { x: 110, y: 210 },
                { x: 120, y: 220 }
            ];
            const shortTrail: TrailPoint[] = [{ x: 130, y: 230 }];

            trailManager.renderTrail(longTrail, 8);
            expect(trailManager.getActiveParticleCount()).toBe(3);

            trailManager.renderTrail(shortTrail, 8);
            expect(trailManager.getActiveParticleCount()).toBe(1);
        });

        it('should create additional particles when trail grows', () => {
            const shortTrail: TrailPoint[] = [{ x: 100, y: 200 }];
            const longTrail: TrailPoint[] = [
                { x: 110, y: 210 },
                { x: 120, y: 220 },
                { x: 130, y: 230 }
            ];

            trailManager.renderTrail(shortTrail, 8);
            expect(trailManager.getActiveParticleCount()).toBe(1);

            trailManager.renderTrail(longTrail, 8);
            expect(trailManager.getActiveParticleCount()).toBe(3);
        });
    });

    describe('performance and memory management', () => {
        it('should handle large trail arrays efficiently', () => {
            const largeTrail: TrailPoint[] = Array.from({ length: 50 }, (_, i) => ({
                x: i * 10,
                y: i * 10
            }));

            trailManager.renderTrail(largeTrail, 8);

            expect(trailManager.getActiveParticleCount()).toBe(50);
        });

        it('should maintain particle count consistency', () => {
            const trail: TrailPoint[] = [{ x: 100, y: 200 }];

            trailManager.renderTrail(trail, 8);

            expect(trailManager.getActiveParticleCount()).toBe(1);
        });

        it('should provide access to ParticleContainer', () => {
            const container = trailManager.getParticleContainer();
            expect(container).toBeDefined();
        });
    });

    describe('edge cases', () => {
        it('should handle zero player radius gracefully', () => {
            const trail: TrailPoint[] = [{ x: 100, y: 200 }];

            // Should not throw error
            expect(() => trailManager.renderTrail(trail, 0)).not.toThrow();
            expect(trailManager.getActiveParticleCount()).toBe(1);
        });

        it('should handle negative coordinates', () => {
            const trail: TrailPoint[] = [{ x: -50, y: -100 }];

            // Should not throw error
            expect(() => trailManager.renderTrail(trail, 8)).not.toThrow();
            expect(trailManager.getActiveParticleCount()).toBe(1);
        });

        it('should handle empty trail array', () => {
            trailManager.renderTrail([], 8);
            expect(trailManager.getActiveParticleCount()).toBe(0);
        });
    });
});

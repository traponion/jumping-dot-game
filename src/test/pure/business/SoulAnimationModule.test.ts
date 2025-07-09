import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SoulAnimationModule } from '../../../modules/animation/SoulAnimationModule.js';
import { GameState } from '../../../stores/GameState.js';
import type { Player } from '../../../types/GameTypes.js';

describe('SoulAnimationModule', () => {
    let soulAnimationModule: SoulAnimationModule;
    let gameState: GameState;
    let mockPlayer: Player;

    beforeEach(() => {
        gameState = new GameState();
        soulAnimationModule = new SoulAnimationModule(gameState);
        mockPlayer = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };

        vi.clearAllMocks();

        // Mock performance.now
        vi.spyOn(globalThis.performance, 'now').mockReturnValue(1000);

        // Mock DOM elements
        const mockElement = {
            getBoundingClientRect: vi.fn().mockReturnValue({
                left: 700,
                top: 20,
                width: 100,
                height: 30
            })
        };

        // Mock document and getElementById
        Object.defineProperty(globalThis, 'document', {
            value: {
                getElementById: vi.fn().mockReturnValue(mockElement)
            },
            writable: true
        });
    });

    describe('initialization', () => {
        it('should initialize with inactive animation', () => {
            const animation = soulAnimationModule.get();

            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(1000);
        });

        it('should not be active initially', () => {
            expect(soulAnimationModule.isActive()).toBe(false);
        });
    });

    describe('start animation', () => {
        it('should start soul animation with target position', () => {
            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBe(1);
        });

        it('should create soul particle with DOM target position', () => {
            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];

            expect(particle.x).toBe(mockPlayer.x);
            expect(particle.y).toBe(mockPlayer.y);
            expect(particle.targetX).toBe(750); // 700 + 100/2
            expect(particle.targetY).toBe(35); // 20 + 30/2
            expect(particle.life).toBe(1.0);
            expect(particle.decay).toBe(0);
        });

        it('should use default target position when DOM element not found', () => {
            // Mock getElementById to return null
            Object.defineProperty(globalThis, 'document', {
                value: {
                    getElementById: vi.fn().mockReturnValue(null)
                },
                writable: true
            });

            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];

            expect(particle.targetX).toBe(750); // Default right side
            expect(particle.targetY).toBe(25); // Default top
        });

        it('should use default target when document is undefined', () => {
            Object.defineProperty(globalThis, 'document', {
                value: undefined,
                writable: true
            });

            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];

            expect(particle.targetX).toBe(750);
            expect(particle.targetY).toBe(25);
        });

        it('should store onComplete callback when provided', () => {
            const mockCallback = vi.fn();
            soulAnimationModule.start(mockPlayer, mockCallback);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];

            expect(particle.onComplete).toBe(mockCallback);
        });

        it('should not store onComplete callback when not provided', () => {
            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];

            expect(particle.onComplete).toBeUndefined();
        });

        it('should set module as active after starting', () => {
            soulAnimationModule.start(mockPlayer);

            expect(soulAnimationModule.isActive()).toBe(true);
        });
    });

    describe('update animation', () => {
        it('should update particle position using ease-out cubic', () => {
            soulAnimationModule.start(mockPlayer);

            // Advance time to 50% completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1500);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];
            const initialX = particle.x;
            const initialY = particle.y;

            soulAnimationModule.update();

            // Position should have moved towards target with ease-out cubic
            expect(particle.x).not.toBe(initialX);
            expect(particle.y).not.toBe(initialY);
            expect(particle.x).toBeGreaterThan(initialX); // Moving towards target
            expect(particle.y).toBeLessThan(initialY); // Moving towards target
        });

        it('should call onComplete callback when animation completes', () => {
            const mockCallback = vi.fn();
            soulAnimationModule.start(mockPlayer, mockCallback);

            // Advance time to completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000);

            soulAnimationModule.update();

            expect(mockCallback).toHaveBeenCalled();
        });

        it('should remove particles when animation completes', () => {
            soulAnimationModule.start(mockPlayer);

            // Advance time to completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000);

            soulAnimationModule.update();

            const animation = soulAnimationModule.get();
            expect(animation.particles.length).toBe(0);
        });

        it('should end animation when all particles are done', () => {
            soulAnimationModule.start(mockPlayer);

            // Advance time to completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000);

            soulAnimationModule.update();

            const animation = soulAnimationModule.get();
            expect(animation.active).toBe(false);
        });

        it('should not update inactive animation', () => {
            const animation = soulAnimationModule.get();
            expect(animation.active).toBe(false);

            soulAnimationModule.update();

            expect(animation.active).toBe(false);
            expect(animation.particles.length).toBe(0);
        });

        it('should handle multiple particles correctly', () => {
            const mockCallback1 = vi.fn();
            const mockCallback2 = vi.fn();

            soulAnimationModule.start(mockPlayer, mockCallback1);

            // Manually add another particle for testing
            const animation = soulAnimationModule.get();
            animation.particles.push({
                x: mockPlayer.x + 50,
                y: mockPlayer.y + 50,
                targetX: 800,
                targetY: 50,
                vx: 0,
                vy: 0,
                life: 1.0,
                decay: 0,
                onComplete: mockCallback2
            });

            // Advance time to completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000);

            soulAnimationModule.update();

            expect(mockCallback1).toHaveBeenCalled();
            expect(mockCallback2).toHaveBeenCalled();
            expect(animation.particles.length).toBe(0);
        });

        it('should handle particles without onComplete callback', () => {
            soulAnimationModule.start(mockPlayer); // No callback

            // Advance time to completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000);

            expect(() => soulAnimationModule.update()).not.toThrow();

            const animation = soulAnimationModule.get();
            expect(animation.particles.length).toBe(0);
        });

        it('should handle particles without targetX/targetY', () => {
            soulAnimationModule.start(mockPlayer);

            // Manually modify particle to remove targets
            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];
            particle.targetX = undefined;
            particle.targetY = undefined;

            expect(() => soulAnimationModule.update()).not.toThrow();
        });
    });

    describe('reset animation', () => {
        it('should reset animation to initial state', () => {
            soulAnimationModule.start(mockPlayer);

            soulAnimationModule.reset();

            const animation = soulAnimationModule.get();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles.length).toBe(0);
        });

        it('should set module as inactive after reset', () => {
            soulAnimationModule.start(mockPlayer);
            expect(soulAnimationModule.isActive()).toBe(true);

            soulAnimationModule.reset();

            expect(soulAnimationModule.isActive()).toBe(false);
        });
    });

    describe('getter methods', () => {
        it('should return current animation state', () => {
            const animation = soulAnimationModule.get();

            expect(animation).toBeDefined();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(1000);
        });

        it('should return updated animation state after starting', () => {
            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBe(1);
        });
    });

    describe('DOM interaction', () => {
        it('should handle missing getElementById function', () => {
            Object.defineProperty(globalThis, 'document', {
                value: {},
                writable: true
            });

            expect(() => soulAnimationModule.start(mockPlayer)).not.toThrow();

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];
            expect(particle.targetX).toBe(750);
            expect(particle.targetY).toBe(25);
        });

        it('should handle getBoundingClientRect exception', () => {
            const mockElement = {
                getBoundingClientRect: vi.fn().mockImplementation(() => {
                    throw new Error('DOM error');
                })
            };

            Object.defineProperty(globalThis, 'document', {
                value: {
                    getElementById: vi.fn().mockReturnValue(mockElement)
                },
                writable: true
            });

            expect(() => soulAnimationModule.start(mockPlayer)).not.toThrow();

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];
            expect(particle.targetX).toBe(750);
            expect(particle.targetY).toBe(25);
        });
    });

    describe('ease-out cubic animation', () => {
        it('should use ease-out cubic function for smooth movement', () => {
            soulAnimationModule.start(mockPlayer);

            const animation = soulAnimationModule.get();
            const particle = animation.particles[0];
            const initialX = particle.x;
            const targetX = particle.targetX!;

            // Test at 25% completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1250);
            soulAnimationModule.update();

            const progress25 = 0.25;
            const easeProgress25 = 1 - (1 - progress25) ** 3;
            const expectedX25 = initialX + (targetX! - initialX) * easeProgress25;

            expect(particle.x).toBeCloseTo(expectedX25, 1);

            // Test at 75% completion
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1750);
            soulAnimationModule.update();

            const progress75 = 0.75;
            const easeProgress75 = 1 - (1 - progress75) ** 3;
            const expectedX75 = initialX + (targetX! - initialX) * easeProgress75;

            expect(particle.x).toBeCloseTo(expectedX75, 1);
        });
    });
});

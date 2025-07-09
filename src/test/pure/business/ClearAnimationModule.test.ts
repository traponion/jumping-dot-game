import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ClearAnimationModule } from '../../../modules/animation/ClearAnimationModule.js';
import { GameState } from '../../../stores/GameState.js';
import type { Player } from '../../../types/GameTypes.js';

describe('ClearAnimationModule', () => {
    let clearAnimationModule: ClearAnimationModule;
    let gameState: GameState;
    let mockPlayer: Player;

    beforeEach(() => {
        gameState = new GameState();
        clearAnimationModule = new ClearAnimationModule(gameState);
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
    });

    describe('initialization', () => {
        it('should initialize with inactive animation', () => {
            const animation = clearAnimationModule.get();

            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(3000);
        });

        it('should not be active initially', () => {
            expect(clearAnimationModule.isActive()).toBe(false);
        });
    });

    describe('start animation', () => {
        it('should start clear animation with particles', () => {
            clearAnimationModule.start(mockPlayer);

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBeGreaterThan(0);
        });

        it('should create particles around player position', () => {
            clearAnimationModule.start(mockPlayer);

            const animation = clearAnimationModule.get();
            for (const particle of animation.particles) {
                expect(particle.x).toBeGreaterThan(mockPlayer.x - 60);
                expect(particle.x).toBeLessThan(mockPlayer.x + 60);
                expect(particle.y).toBeGreaterThan(mockPlayer.y - 60);
                expect(particle.y).toBeLessThan(mockPlayer.y + 60);
                expect(particle.life).toBe(1.0);
                expect(particle.decay).toBeGreaterThan(0);
            }
        });

        it('should set module as active after starting', () => {
            clearAnimationModule.start(mockPlayer);

            expect(clearAnimationModule.isActive()).toBe(true);
        });
    });

    describe('update animation', () => {
        it('should start animation when shouldStartClearAnimation flag is set', () => {
            gameState.runtime.shouldStartClearAnimation = true;
            gameState.runtime.player = mockPlayer;

            clearAnimationModule.update();

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(gameState.runtime.shouldStartClearAnimation).toBe(false);
        });

        it('should not start animation if already active', () => {
            clearAnimationModule.start(mockPlayer);
            const initialParticleCount = clearAnimationModule.get().particles.length;

            gameState.runtime.shouldStartClearAnimation = true;
            gameState.runtime.player = mockPlayer;

            clearAnimationModule.update();

            expect(clearAnimationModule.get().particles.length).toBe(initialParticleCount);
        });

        it('should update particle positions and life', () => {
            clearAnimationModule.start(mockPlayer);

            // Advance time slightly
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1100);
            clearAnimationModule.update();

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(true);

            // Particles should have updated positions and life
            for (const particle of animation.particles) {
                expect(particle.life).toBeLessThan(1.0);
            }
        });

        it('should apply gravity to particles', () => {
            clearAnimationModule.start(mockPlayer);

            const animation = clearAnimationModule.get();
            const initialVy = animation.particles[0].vy;

            clearAnimationModule.update();

            // Gravity should increase vy
            expect(animation.particles[0].vy).toBeGreaterThan(initialVy);
        });

        it('should remove particles with zero life', () => {
            clearAnimationModule.start(mockPlayer);

            const animation = clearAnimationModule.get();
            // Manually set all particles to have zero life
            for (const particle of animation.particles) {
                particle.life = 0;
            }

            clearAnimationModule.update();

            expect(animation.particles.length).toBe(0);
        });

        it('should end animation after duration', () => {
            clearAnimationModule.start(mockPlayer);

            // Advance time beyond duration (3000ms)
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(4100);
            clearAnimationModule.update();

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(false);
        });

        it('should not update inactive animation', () => {
            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(false);

            clearAnimationModule.update();

            expect(animation.active).toBe(false);
            expect(animation.particles.length).toBe(0);
        });
    });

    describe('reset animation', () => {
        it('should reset animation to initial state', () => {
            clearAnimationModule.start(mockPlayer);

            clearAnimationModule.reset();

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles.length).toBe(0);
        });

        it('should set module as inactive after reset', () => {
            clearAnimationModule.start(mockPlayer);
            expect(clearAnimationModule.isActive()).toBe(true);

            clearAnimationModule.reset();

            expect(clearAnimationModule.isActive()).toBe(false);
        });
    });

    describe('getter methods', () => {
        it('should return current animation state', () => {
            const animation = clearAnimationModule.get();

            expect(animation).toBeDefined();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(3000);
        });

        it('should return updated animation state after starting', () => {
            clearAnimationModule.start(mockPlayer);

            const animation = clearAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBeGreaterThan(0);
        });
    });

    describe('integration with GameState', () => {
        it('should respond to gameState runtime flags', () => {
            gameState.runtime.shouldStartClearAnimation = true;
            gameState.runtime.player = mockPlayer;

            clearAnimationModule.update();

            expect(clearAnimationModule.isActive()).toBe(true);
            expect(gameState.runtime.shouldStartClearAnimation).toBe(false);
        });

        it('should not start without player in gameState', () => {
            gameState.runtime.shouldStartClearAnimation = true;
            gameState.runtime.player = null as any;

            clearAnimationModule.update();

            expect(clearAnimationModule.isActive()).toBe(false);
        });
    });
});

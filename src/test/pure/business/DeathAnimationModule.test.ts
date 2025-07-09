import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeathAnimationModule } from '../../../modules/animation/DeathAnimationModule.js';
import { GameState } from '../../../stores/GameState.js';
import type { Player } from '../../../types/GameTypes.js';

describe('DeathAnimationModule', () => {
    let deathAnimationModule: DeathAnimationModule;
    let gameState: GameState;
    let mockPlayer: Player;

    beforeEach(() => {
        gameState = new GameState();
        deathAnimationModule = new DeathAnimationModule(gameState);
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
            const animation = deathAnimationModule.get();

            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(2000);
        });

        it('should not be active initially', () => {
            expect(deathAnimationModule.isActive()).toBe(false);
        });
    });

    describe('start animation', () => {
        it('should start death animation with explosion particles', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBeGreaterThan(0);
        });

        it('should create particles in circular pattern', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            expect(animation.particles.length).toBe(15); // Expected number of explosion particles

            // Check that particles have different velocities (circular pattern)
            const velocities = animation.particles.map((p) => ({ vx: p.vx, vy: p.vy }));
            const uniqueVelocities = new Set(velocities.map((v) => `${v.vx},${v.vy}`));
            expect(uniqueVelocities.size).toBeGreaterThan(1);
        });

        it('should create particles at player position', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            for (const particle of animation.particles) {
                expect(particle.x).toBe(mockPlayer.x);
                expect(particle.y).toBe(mockPlayer.y);
                expect(particle.life).toBe(1.0);
                expect(particle.decay).toBeGreaterThan(0);
                expect(particle.size).toBeGreaterThan(0);
            }
        });

        it('should set module as active after starting', () => {
            deathAnimationModule.start(mockPlayer);

            expect(deathAnimationModule.isActive()).toBe(true);
        });
    });

    describe('update animation', () => {
        it('should start animation when gameOver is true and animation not active', () => {
            // Set game over state
            gameState.gameOver = true;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            // Should have added death mark
            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: Math.min(mockPlayer.y, 580),
                timestamp: 1000
            });

            // Should have started death animation
            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(true);
        });

        it('should not trigger death animation multiple times with deathAnimationTriggered flag', () => {
            // Set game over state
            gameState.gameOver = true;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;

            // First call should trigger animation
            deathAnimationModule.update();
            expect(gameState.runtime.deathMarks).toHaveLength(1);

            // Second call should NOT trigger again (infinite loop prevention)
            deathAnimationModule.update();
            expect(gameState.runtime.deathMarks).toHaveLength(1); // Still only 1
        });

        it('should handle legacy shouldStartDeathAnimation flag', () => {
            // Set legacy flag
            gameState.runtime.shouldStartDeathAnimation = true;
            gameState.runtime.player = mockPlayer;

            deathAnimationModule.update();

            // Should start death animation
            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(true);

            // Should reset the flag
            expect(gameState.runtime.shouldStartDeathAnimation).toBe(false);
        });

        it('should not start death animation if already active', () => {
            // Start animation first
            deathAnimationModule.start(mockPlayer);
            const initialParticleCount = deathAnimationModule.get().particles.length;

            // Set game over
            gameState.gameOver = true;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            // Should not add additional death marks
            expect(gameState.runtime.deathMarks).toHaveLength(0);

            // Particle count should remain the same
            expect(deathAnimationModule.get().particles.length).toBe(initialParticleCount);
        });

        it('should clamp death mark Y position for visibility', () => {
            // Set player below screen
            gameState.runtime.player = { ...mockPlayer, y: 600 };
            gameState.gameOver = true;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            // Y position should be clamped to 580
            expect(gameState.runtime.deathMarks[0].y).toBe(580);
        });

        it('should update particle positions with gravity', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            const initialVy = animation.particles[0].vy;

            deathAnimationModule.update();

            // Gravity should increase vy
            expect(animation.particles[0].vy).toBeGreaterThan(initialVy);
        });

        it('should remove particles with zero life', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            // Manually set all particles to have zero life
            for (const particle of animation.particles) {
                particle.life = 0;
            }

            deathAnimationModule.update();

            expect(animation.particles.length).toBe(0);
        });

        it('should end animation after duration', () => {
            deathAnimationModule.start(mockPlayer);

            // Advance time beyond duration (2000ms)
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(3100);
            deathAnimationModule.update();

            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(false);
        });

        it('should not update inactive animation', () => {
            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(false);

            deathAnimationModule.update();

            expect(animation.active).toBe(false);
            expect(animation.particles.length).toBe(0);
        });
    });

    describe('death marks', () => {
        it('should add death mark to store', () => {
            deathAnimationModule.addDeathMark(mockPlayer.x, mockPlayer.y);

            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: mockPlayer.y,
                timestamp: 1000
            });
        });

        it('should add death mark with adjusted position for fall deaths', () => {
            const adjustedY = 500;

            deathAnimationModule.addDeathMark(mockPlayer.x, adjustedY);

            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: adjustedY,
                timestamp: 1000
            });
        });

        it('should handle multiple death mark calls', () => {
            deathAnimationModule.addDeathMark(100, 200);
            deathAnimationModule.addDeathMark(150, 250);
            deathAnimationModule.addDeathMark(200, 300);

            expect(gameState.runtime.deathMarks).toHaveLength(3);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: 100,
                y: 200,
                timestamp: 1000
            });
            expect(gameState.runtime.deathMarks[1]).toEqual({
                x: 150,
                y: 250,
                timestamp: 1000
            });
            expect(gameState.runtime.deathMarks[2]).toEqual({
                x: 200,
                y: 300,
                timestamp: 1000
            });
        });
    });

    describe('reset animation', () => {
        it('should reset animation to initial state', () => {
            deathAnimationModule.start(mockPlayer);

            deathAnimationModule.reset();

            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles.length).toBe(0);
        });

        it('should reset deathAnimationTriggered flag on reset', () => {
            // Trigger death animation
            gameState.gameOver = true;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;
            deathAnimationModule.update();

            // Reset should clear the flag
            deathAnimationModule.reset();

            // Should be able to trigger again after reset
            gameState.runtime.deathMarks = []; // Clear previous marks
            deathAnimationModule.update();
            expect(gameState.runtime.deathMarks).toHaveLength(1);
        });

        it('should set module as inactive after reset', () => {
            deathAnimationModule.start(mockPlayer);
            expect(deathAnimationModule.isActive()).toBe(true);

            deathAnimationModule.reset();

            expect(deathAnimationModule.isActive()).toBe(false);
        });
    });

    describe('getter methods', () => {
        it('should return current animation state', () => {
            const animation = deathAnimationModule.get();

            expect(animation).toBeDefined();
            expect(animation.active).toBe(false);
            expect(animation.startTime).toBe(null);
            expect(animation.particles).toEqual([]);
            expect(animation.duration).toBe(2000);
        });

        it('should return updated animation state after starting', () => {
            deathAnimationModule.start(mockPlayer);

            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(true);
            expect(animation.startTime).toBe(1000);
            expect(animation.particles.length).toBeGreaterThan(0);
        });
    });

    describe('autonomous death handling', () => {
        it('should automatically start death animation when gameOver is true', () => {
            // Set game over state
            gameState.gameOver = true;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            // Should have started death animation
            const animation = deathAnimationModule.get();
            expect(animation.active).toBe(true);
        });

        it('should not start if gameOver is false', () => {
            gameState.gameOver = false;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            expect(deathAnimationModule.isActive()).toBe(false);
            expect(gameState.runtime.deathMarks).toHaveLength(0);
        });

        it('should not start without player in gameState', () => {
            gameState.gameOver = true;
            gameState.runtime.player = null as any;
            gameState.runtime.shouldStartDeathAnimation = false;

            deathAnimationModule.update();

            expect(deathAnimationModule.isActive()).toBe(false);
            expect(gameState.runtime.deathMarks).toHaveLength(0);
        });
    });
});

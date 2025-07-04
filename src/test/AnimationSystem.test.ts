import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameState } from '../stores/GameState.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import type { Player } from '../types/GameTypes.js';

describe('AnimationSystem', () => {
    let animationSystem: AnimationSystem;
    let gameState: GameState;
    let mockPlayer: Player;

    beforeEach(() => {
        gameState = new GameState();
        animationSystem = new AnimationSystem(gameState);
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

        // Mock document for soul animation
        const mockDeathDisplay = {
            getBoundingClientRect: () => ({ left: 750, top: 10, width: 100, height: 20 })
        };
        vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
            if (id === 'deathCount') return mockDeathDisplay as any;
            return null;
        });
    });

    describe('clear animation', () => {
        it('should start clear animation with particles', () => {
            animationSystem.startClearAnimation(mockPlayer);

            const clearAnim = animationSystem.getClearAnimation();
            expect(clearAnim.active).toBe(true);
            expect(clearAnim.startTime).toBe(1000);
            expect(clearAnim.particles.length).toBeGreaterThan(0);
        });

        it('should update clear animation particles', () => {
            animationSystem.startClearAnimation(mockPlayer);

            // Advance time
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1100);
            animationSystem.updateClearAnimation();

            const clearAnim = animationSystem.getClearAnimation();
            expect(clearAnim.active).toBe(true);

            // Particles should have updated positions and life
            for (const particle of clearAnim.particles) {
                expect(particle.life).toBeLessThan(1.0);
            }
        });

        it('should end clear animation after duration', () => {
            animationSystem.startClearAnimation(mockPlayer);

            // Advance time beyond duration (3000ms)
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(4100);
            animationSystem.updateClearAnimation();

            const clearAnim = animationSystem.getClearAnimation();
            expect(clearAnim.active).toBe(false);
        });

        it('should remove particles with zero life', () => {
            animationSystem.startClearAnimation(mockPlayer);

            // Manually set all particles to have zero life
            const clearAnim = animationSystem.getClearAnimation();
            for (const particle of clearAnim.particles) {
                particle.life = 0;
            }

            animationSystem.updateClearAnimation();

            expect(clearAnim.particles.length).toBe(0);
        });
    });

    describe('death animation', () => {
        it('should start death animation with explosion particles', () => {
            animationSystem.startDeathAnimation(mockPlayer);

            const deathAnim = animationSystem.getDeathAnimation();
            expect(deathAnim.active).toBe(true);
            expect(deathAnim.startTime).toBe(1000);
            expect(deathAnim.particles.length).toBeGreaterThan(0);
        });

        it('should create particles in circular pattern for death animation', () => {
            animationSystem.startDeathAnimation(mockPlayer);

            const deathAnim = animationSystem.getDeathAnimation();
            expect(deathAnim.particles.length).toBe(15); // Expected number of explosion particles

            // Check that particles have different velocities (circular pattern)
            const velocities = deathAnim.particles.map((p) => ({ vx: p.vx, vy: p.vy }));
            const uniqueVelocities = new Set(velocities.map((v) => `${v.vx},${v.vy}`));
            expect(uniqueVelocities.size).toBeGreaterThan(1);
        });

        it('should update death animation particles with gravity', () => {
            animationSystem.startDeathAnimation(mockPlayer);

            const deathAnim = animationSystem.getDeathAnimation();
            const initialVy = deathAnim.particles[0].vy;

            animationSystem.updateDeathAnimation();

            // Gravity should increase vy
            expect(deathAnim.particles[0].vy).toBeGreaterThan(initialVy);
        });

        it('should end death animation after duration', () => {
            animationSystem.startDeathAnimation(mockPlayer);

            // Advance time beyond duration (2000ms)
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(3100);
            animationSystem.updateDeathAnimation();

            const deathAnim = animationSystem.getDeathAnimation();
            expect(deathAnim.active).toBe(false);
        });

        it('should remove particles with zero life', () => {
            animationSystem.startDeathAnimation(mockPlayer);

            // Manually set all particles to have zero life
            const deathAnim = animationSystem.getDeathAnimation();
            for (const particle of deathAnim.particles) {
                particle.life = 0;
            }

            animationSystem.updateDeathAnimation();

            expect(deathAnim.particles.length).toBe(0);
        });
    });

    describe('death marks', () => {
        it('should add death mark to store', () => {
            animationSystem.addDeathMark(mockPlayer.x, mockPlayer.y);

            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: mockPlayer.y,
                timestamp: 1000
            });
        });

        it('should add death mark with adjusted position for fall deaths', () => {
            const adjustedY = 500;

            animationSystem.addDeathMark(mockPlayer.x, adjustedY);

            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: adjustedY,
                timestamp: 1000
            });
        });

        it('should handle multiple death mark calls', () => {
            animationSystem.addDeathMark(100, 200);
            animationSystem.addDeathMark(150, 250);
            animationSystem.addDeathMark(200, 300);

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

    describe('autonomous death handling', () => {
        it('should automatically start death animation when gameOver is true and animation not active', () => {
            // Set game over state
            gameState.gameOver = true;
            gameState.runtime.player = mockPlayer;
            gameState.runtime.shouldStartDeathAnimation = false;

            // Call update method that should trigger autonomous death handling
            animationSystem.updateDeathAnimation();

            // Should have added death mark
            expect(gameState.runtime.deathMarks).toHaveLength(1);
            expect(gameState.runtime.deathMarks[0]).toEqual({
                x: mockPlayer.x,
                y: Math.min(mockPlayer.y, 580),
                timestamp: 1000
            });

            // Should have started death animation
            const deathAnim = animationSystem.getDeathAnimation();
            expect(deathAnim.active).toBe(true);
        });

        it('should handle legacy shouldStartDeathAnimation flag', () => {
            // Set legacy flag
            gameState.runtime.shouldStartDeathAnimation = true;
            gameState.runtime.player = mockPlayer;

            animationSystem.updateDeathAnimation();

            // Should start death animation
            const deathAnim = animationSystem.getDeathAnimation();
            expect(deathAnim.active).toBe(true);

            // Should reset the flag
            expect(gameState.runtime.shouldStartDeathAnimation).toBe(false);
        });

        it('should not start death animation if already active', () => {
            // Start animation first
            animationSystem.startDeathAnimation(mockPlayer);
            const initialParticleCount = animationSystem.getDeathAnimation().particles.length;

            // Set game over
            gameState.gameOver = true;
            gameState.runtime.shouldStartDeathAnimation = false;

            animationSystem.updateDeathAnimation();

            // Should not add additional death marks
            expect(gameState.runtime.deathMarks).toHaveLength(0);

            // Particle count should remain the same
            expect(animationSystem.getDeathAnimation().particles.length).toBe(initialParticleCount);
        });

        it('should clamp death mark Y position for visibility', () => {
            // Set player below screen
            gameState.runtime.player = { ...mockPlayer, y: 600 };
            gameState.gameOver = true;
            gameState.runtime.shouldStartDeathAnimation = false;

            animationSystem.updateDeathAnimation();

            // Y position should be clamped to 580
            expect(gameState.runtime.deathMarks[0].y).toBe(580);
        });
    });

    describe('soul animation', () => {
        it('should start soul animation when player dies', () => {
            // Setup: Player dies at specific position
            gameState.runtime.player = { ...mockPlayer, x: 200, y: 300 };

            // Action: Start soul animation
            animationSystem.startSoulAnimation(gameState.runtime.player);

            // Assert: Soul animation should be active
            const soulAnim = animationSystem.getSoulAnimation();
            expect(soulAnim.active).toBe(true);
            expect(soulAnim.particles).toHaveLength(1);
            expect(soulAnim.particles[0].x).toBe(200);
            expect(soulAnim.particles[0].y).toBe(300);
        });

        it('should animate soul flying to death counter', () => {
            // Setup: Start soul animation
            gameState.runtime.player = { ...mockPlayer, x: 100, y: 400 };
            animationSystem.startSoulAnimation(gameState.runtime.player);

            // Advance time to test animation progress
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(1500); // 500ms later

            // Action: Update animation
            animationSystem.updateSoulAnimation();

            // Assert: Soul should move toward death counter
            const soulAnim = animationSystem.getSoulAnimation();
            const particle = soulAnim.particles[0];
            expect(particle.x).toBeGreaterThan(100); // Moving right
            expect(particle.y).toBeLessThan(400); // Moving up
        });

        it('should complete soul animation and trigger death count increment', () => {
            const mockCallback = vi.fn();

            // Setup: Start soul animation with callback
            gameState.runtime.player = { ...mockPlayer, x: 100, y: 400 };
            animationSystem.startSoulAnimation(gameState.runtime.player, mockCallback);

            // Advance time past animation duration
            vi.spyOn(globalThis.performance, 'now').mockReturnValue(2000); // 1000ms later (animation complete)

            // Action: Update animation
            animationSystem.updateSoulAnimation();

            // Assert: Animation completed and callback called
            const soulAnim = animationSystem.getSoulAnimation();
            expect(soulAnim.active).toBe(false);
            expect(mockCallback).toHaveBeenCalledOnce();
        });

        it('should handle missing death counter element gracefully', () => {
            // Setup: Mock getElementById to return null
            vi.spyOn(document, 'getElementById').mockReturnValue(null);

            // Action: Start soul animation (should not throw)
            expect(() => {
                animationSystem.startSoulAnimation(mockPlayer);
            }).not.toThrow();

            // Assert: Animation should still work with fallback target
            const soulAnim = animationSystem.getSoulAnimation();
            expect(soulAnim.active).toBe(true);
        });
    });

    describe('animation state management', () => {
        it('should reset all animations including soul animation', () => {
            animationSystem.startClearAnimation(mockPlayer);
            animationSystem.startDeathAnimation(mockPlayer);
            animationSystem.startSoulAnimation(mockPlayer);

            animationSystem.reset();

            expect(animationSystem.getClearAnimation().active).toBe(false);
            expect(animationSystem.getDeathAnimation().active).toBe(false);
            expect(animationSystem.getSoulAnimation().active).toBe(false);
            expect(animationSystem.getClearAnimation().particles.length).toBe(0);
            expect(animationSystem.getDeathAnimation().particles.length).toBe(0);
            expect(animationSystem.getSoulAnimation().particles.length).toBe(0);
        });

        it('should check if any animation is active including soul animation', () => {
            expect(animationSystem.isAnyAnimationActive()).toBe(false);

            animationSystem.startClearAnimation(mockPlayer);
            expect(animationSystem.isAnyAnimationActive()).toBe(true);

            animationSystem.reset();
            animationSystem.startDeathAnimation(mockPlayer);
            expect(animationSystem.isAnyAnimationActive()).toBe(true);

            animationSystem.reset();
            animationSystem.startSoulAnimation(mockPlayer);
            expect(animationSystem.isAnyAnimationActive()).toBe(true);

            animationSystem.reset();
            expect(animationSystem.isAnyAnimationActive()).toBe(false);
        });
    });
});

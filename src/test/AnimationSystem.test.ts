import { beforeEach, describe, expect, it, vi } from 'vitest';
// Disabled: AnimationSystem was removed in Zustand elimination
// import { AnimationSystem } from '../systems/AnimationSystem.js';
import type { DeathMark, Player } from '../types/GameTypes.js';

// Mock GameZustandStore
const mockGameStore = {
    addDeathMark: vi.fn(),
    runtime: {
        deathMarks: [] as DeathMark[]
    }
};

vi.mock('../stores/GameZustandStore.js', () => ({
    getGameStore: () => mockGameStore
}));

describe.skip('AnimationSystem - DISABLED (removed in Zustand elimination)', () => {
    let animationSystem: any; // AnimationSystem removed
    let mockPlayer: Player;

    beforeEach(() => {
        // animationSystem = new AnimationSystem(); // DISABLED
        mockPlayer = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };

        // Reset mock store state
        mockGameStore.runtime.deathMarks = [];
        vi.clearAllMocks();

        // Mock performance.now
        vi.spyOn(globalThis.performance, 'now').mockReturnValue(1000);
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

            expect(mockGameStore.addDeathMark).toHaveBeenCalledOnce();
            expect(mockGameStore.addDeathMark).toHaveBeenCalledWith({
                x: mockPlayer.x,
                y: mockPlayer.y,
                timestamp: 1000
            });
        });

        it('should add death mark with adjusted position for fall deaths', () => {
            const adjustedY = 500;

            animationSystem.addDeathMark(mockPlayer.x, adjustedY);

            expect(mockGameStore.addDeathMark).toHaveBeenCalledWith({
                x: mockPlayer.x,
                y: adjustedY,
                timestamp: 1000
            });
        });

        it('should handle multiple death mark calls', () => {
            animationSystem.addDeathMark(100, 200);
            animationSystem.addDeathMark(150, 250);
            animationSystem.addDeathMark(200, 300);

            expect(mockGameStore.addDeathMark).toHaveBeenCalledTimes(3);
            expect(mockGameStore.addDeathMark).toHaveBeenNthCalledWith(1, {
                x: 100,
                y: 200,
                timestamp: 1000
            });
            expect(mockGameStore.addDeathMark).toHaveBeenNthCalledWith(2, {
                x: 150,
                y: 250,
                timestamp: 1000
            });
            expect(mockGameStore.addDeathMark).toHaveBeenNthCalledWith(3, {
                x: 200,
                y: 300,
                timestamp: 1000
            });
        });
    });

    describe('animation state management', () => {
        it('should reset all animations', () => {
            animationSystem.startClearAnimation(mockPlayer);
            animationSystem.startDeathAnimation(mockPlayer);

            animationSystem.reset();

            expect(animationSystem.getClearAnimation().active).toBe(false);
            expect(animationSystem.getDeathAnimation().active).toBe(false);
            expect(animationSystem.getClearAnimation().particles.length).toBe(0);
            expect(animationSystem.getDeathAnimation().particles.length).toBe(0);
            // Note: AnimationSystem no longer manages death marks - they're in the store
        });

        it('should check if any animation is active', () => {
            expect(animationSystem.isAnyAnimationActive()).toBe(false);

            animationSystem.startClearAnimation(mockPlayer);
            expect(animationSystem.isAnyAnimationActive()).toBe(true);

            animationSystem.reset();
            animationSystem.startDeathAnimation(mockPlayer);
            expect(animationSystem.isAnyAnimationActive()).toBe(true);

            animationSystem.reset();
            expect(animationSystem.isAnyAnimationActive()).toBe(false);
        });
    });
});

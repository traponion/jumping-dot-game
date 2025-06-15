import { beforeEach, describe, expect, it } from 'vitest';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import type { KeyState, PhysicsConstants, Player } from '../types/GameTypes.js';

describe('PlayerSystem', () => {
    let player: Player;
    let keys: KeyState;
    let playerSystem: PlayerSystem;
    let physics: PhysicsConstants;

    beforeEach(() => {
        player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };

        keys = {};

        physics = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        playerSystem = new PlayerSystem(player);
    });

    describe('input handling', () => {
        it.skip('should move player left when ArrowLeft is pressed', () => {
            keys.ArrowLeft = true;
            const initialVx = player.vx;

            playerSystem.update(16.67, physics); // 60fps frame

            expect(player.vx).toBeLessThan(initialVx);
            expect(playerSystem.getHasMovedOnce()).toBe(true);
        });

        it.skip('should move player right when ArrowRight is pressed', () => {
            keys.ArrowRight = true;
            const initialVx = player.vx;

            playerSystem.update(16.67, physics);

            expect(player.vx).toBeGreaterThan(initialVx);
            expect(playerSystem.getHasMovedOnce()).toBe(true);
        });

        it.skip('should maintain minimal movement once started', () => {
            keys.ArrowRight = true;
            playerSystem.update(16.67, physics);
            keys.ArrowRight = false;

            // Simulate multiple frames to let velocity decay
            for (let i = 0; i < 10; i++) {
                playerSystem.update(16.67, physics);
            }

            expect(Math.abs(player.vx)).toBeGreaterThanOrEqual(0.2);
        });

        it.skip('should apply minimum velocity when hasMovedOnce and velocity is low', () => {
            // First move to trigger hasMovedOnce
            keys.ArrowRight = true;
            playerSystem.update(16.67, physics);
            keys.ArrowRight = false;

            // Set a very small velocity
            player.vx = 0.1;
            
            playerSystem.update(16.67, physics);

            expect(player.vx).toBe(0.2); // minVelocity from config
        });

        it.skip('should apply negative minimum velocity for negative velocities', () => {
            // First move to trigger hasMovedOnce
            keys.ArrowLeft = true;
            playerSystem.update(16.67, physics);
            keys.ArrowLeft = false;

            // Set a very small negative velocity
            player.vx = -0.1;
            
            playerSystem.update(16.67, physics);

            expect(player.vx).toBe(-0.2); // -minVelocity from config
        });
    });

    describe('auto jump system', () => {
        it('should auto jump when grounded and interval passed', () => {
            player.grounded = true;

            // Mock performance.now to simulate time passage
            const originalNow = globalThis.performance.now;
            let mockTime = 0;
            globalThis.performance.now = () => mockTime;

            // First update to set lastJumpTime
            playerSystem.update(16.67, physics);

            // Advance time beyond auto jump interval
            mockTime += physics.autoJumpInterval + 10;
            playerSystem.update(16.67, physics);

            expect(player.vy).toBe(physics.jumpForce);
            expect(player.grounded).toBe(false);

            globalThis.performance.now = originalNow;
        });
    });

    describe('trail system', () => {
        it('should update trail with player position', () => {
            const initialTrailLength = playerSystem.getTrail().length;

            playerSystem.update(16.67, physics);

            const trail = playerSystem.getTrail();
            expect(trail.length).toBe(initialTrailLength + 1);
            expect(trail[trail.length - 1]).toEqual({ x: player.x, y: player.y });
        });

        it('should limit trail length to maximum', () => {
            // Update many times to exceed max trail length
            for (let i = 0; i < 20; i++) {
                player.x = i; // Change position each time
                playerSystem.update(16.67, physics);
            }

            expect(playerSystem.getTrail().length).toBeLessThanOrEqual(8);
        });
    });

    describe('speed clamping', () => {
        it('should clamp velocity to max speed', () => {
            player.vx = 10; // Exceed max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(player.vx).toBe(physics.moveSpeed);
        });

        it('should clamp negative velocity to negative max speed', () => {
            player.vx = -10; // Exceed negative max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(player.vx).toBe(-physics.moveSpeed);
        });
    });

    describe('reset functionality', () => {
        it('should reset player to specified position', () => {
            player.vx = 5;
            player.vy = -3;
            keys.ArrowRight = true;
            playerSystem.update(16.67, physics); // Make some changes

            playerSystem.reset(200, 300);

            expect(player.x).toBe(200);
            expect(player.y).toBe(300);
            expect(player.vx).toBe(0);
            expect(player.vy).toBe(0);
            expect(player.grounded).toBe(false);
            expect(playerSystem.getHasMovedOnce()).toBe(false);
            expect(playerSystem.getTrail().length).toBe(0);
        });

        it('should reset jump timer', () => {
            const originalNow = globalThis.performance.now;
            let mockTime = 1000;
            globalThis.performance.now = () => mockTime;

            // First establish a baseline - do an initial update to set lastJumpTime
            player.grounded = true;
            playerSystem.update(16.67, physics);

            // Reset the player state for the actual test
            player.vy = 0;
            player.grounded = true;

            // Now call resetJumpTimer
            playerSystem.resetJumpTimer();

            // Advance time slightly to ensure we're past the interval
            mockTime += 10;
            playerSystem.update(16.67, physics);

            expect(player.vy).toBe(physics.jumpForce);
            expect(player.grounded).toBe(false);

            globalThis.performance.now = originalNow;
        });

        it('should clear trail', () => {
            // Add some trail points
            playerSystem.update(16.67, physics);
            playerSystem.update(16.67, physics);
            expect(playerSystem.getTrail().length).toBeGreaterThan(0);

            playerSystem.clearTrail();

            expect(playerSystem.getTrail().length).toBe(0);
        });
    });
});

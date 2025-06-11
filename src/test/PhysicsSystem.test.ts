import { beforeEach, describe, expect, it } from 'vitest';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';

describe('PhysicsSystem', () => {
    let player: Player;
    let physicsSystem: PhysicsSystem;
    let constants: PhysicsConstants;

    beforeEach(() => {
        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: -5,
            radius: 3,
            grounded: false
        };

        constants = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        physicsSystem = new PhysicsSystem(constants);
    });

    describe('gravity application', () => {
        it('should apply gravity when player is not grounded', () => {
            player.grounded = false;
            const initialVy = player.vy;

            physicsSystem.update(player, 16.67); // 60fps frame

            // Gravity should increase downward velocity
            expect(player.vy).toBeGreaterThan(initialVy);
        });

        it('should not apply gravity when player is grounded', () => {
            player.grounded = true;
            const initialVy = player.vy;

            physicsSystem.update(player, 16.67);

            expect(player.vy).toBe(initialVy);
        });
    });

    describe('position updates', () => {
        it('should update player position based on velocity', () => {
            const initialX = player.x;
            const initialY = player.y;

            physicsSystem.update(player, 16.67);

            // Position should change based on velocity and game speed
            expect(player.x).not.toBe(initialX);
            expect(player.y).not.toBe(initialY);
        });

        it('should account for game speed in position updates', () => {
            const slowConstants = { ...constants, gameSpeed: 1.0 };
            const fastConstants = { ...constants, gameSpeed: 2.0 };

            const slowPhysics = new PhysicsSystem(slowConstants);
            const fastPhysics = new PhysicsSystem(fastConstants);

            const slowPlayer = { ...player };
            const fastPlayer = { ...player };

            slowPhysics.update(slowPlayer, 16.67);
            fastPhysics.update(fastPlayer, 16.67);

            // Fast physics should move player further
            const slowDistance = Math.abs(slowPlayer.x - player.x);
            const fastDistance = Math.abs(fastPlayer.x - player.x);
            expect(fastDistance).toBeGreaterThan(slowDistance);
        });
    });

    describe('constants management', () => {
        it('should return copy of physics constants', () => {
            const returned = physicsSystem.getPhysicsConstants();

            expect(returned).toEqual(constants);
            expect(returned).not.toBe(constants); // Should be a copy
        });

        it('should update physics constants partially', () => {
            const newGravity = 1.2;

            physicsSystem.updateConstants({ gravity: newGravity });

            const updated = physicsSystem.getPhysicsConstants();
            expect(updated.gravity).toBe(newGravity);
            expect(updated.gameSpeed).toBe(constants.gameSpeed); // Other values unchanged
        });

        it('should reset constants to defaults', () => {
            physicsSystem.updateConstants({ gravity: 999, gameSpeed: 10 });

            physicsSystem.resetConstants();

            const reset = physicsSystem.getPhysicsConstants();
            expect(reset.gravity).toBe(0.6);
            expect(reset.gameSpeed).toBe(2.0);
            expect(reset.jumpForce).toBe(-12);
        });
    });

    describe('frame rate independence', () => {
        it('should produce reasonably consistent results with different frame rates', () => {
            const player1 = { ...player };
            const player2 = { ...player };

            // Simulate 30fps (33.33ms per frame)
            physicsSystem.update(player1, 33.33);

            // Simulate 60fps (16.67ms per frame) x2
            physicsSystem.update(player2, 16.67);
            physicsSystem.update(player2, 16.67);

            // Results should be reasonably close (allowing for gravity accumulation)
            expect(Math.abs(player1.x - player2.x)).toBeLessThan(1.0);
            expect(Math.abs(player1.y - player2.y)).toBeLessThan(3.0);
        });
    });
});

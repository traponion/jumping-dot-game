import { beforeEach, describe, expect, it } from 'vitest';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';
import { getGameStore } from '../stores/GameZustandStore.js';

describe('PhysicsSystem', () => {
    let player: Player;
    let physicsSystem: PhysicsSystem;
    let constants: PhysicsConstants;

    beforeEach(() => {
        // Reset store to clean state
        getGameStore().reset();
        
        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: -5,
            radius: 3,
            grounded: false
        };
        
        // Set up initial player state in store
        getGameStore().updatePlayer(player);

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
            const testPlayer = { ...player, grounded: false };
            const initialVy = testPlayer.vy;

            const result = physicsSystem.update(testPlayer, 16.67); // 60fps frame

            // Gravity should increase downward velocity
            expect(result.player.vy).toBeGreaterThan(initialVy);
        });

        it('should not apply gravity when player is grounded', () => {
            const testPlayer = { ...player, grounded: true };
            const initialVy = testPlayer.vy;

            const result = physicsSystem.update(testPlayer, 16.67);

            expect(result.player.vy).toBe(initialVy);
        });
    });

    describe('position updates', () => {
        it('should update player position based on velocity', () => {
            const testPlayer = { ...player };
            const initialX = testPlayer.x;
            const initialY = testPlayer.y;

            const result = physicsSystem.update(testPlayer, 16.67);

            // Position should change based on velocity and game speed
            expect(result.player.x).not.toBe(initialX);
            expect(result.player.y).not.toBe(initialY);
        });

        it('should account for game speed in position updates', () => {
            const slowConstants = { ...constants, gameSpeed: 1.0 };
            const fastConstants = { ...constants, gameSpeed: 2.0 };

            const slowPhysics = new PhysicsSystem(slowConstants);
            const fastPhysics = new PhysicsSystem(fastConstants);

            const testPlayer = { ...player };
            const initialX = testPlayer.x;
            
            const slowResult = slowPhysics.update(testPlayer, 16.67);
            const slowDistance = Math.abs(slowResult.player.x! - initialX);

            const fastResult = fastPhysics.update(testPlayer, 16.67);
            const fastDistance = Math.abs(fastResult.player.x! - initialX);

            // Fast physics should move player further
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
            const testPlayer1 = { ...player };
            const testPlayer2 = { ...player };

            // Simulate 30fps (33.33ms per frame)
            const result30fps = physicsSystem.update(testPlayer1, 33.33);

            // Simulate 60fps (16.67ms per frame) x2
            const result60fps_1 = physicsSystem.update(testPlayer2, 16.67);
            const result60fps_2 = physicsSystem.update({
                ...testPlayer2,
                ...result60fps_1.player
            }, 16.67);

            // Results should be reasonably close (allowing for gravity accumulation)
            expect(Math.abs(result30fps.player.x! - result60fps_2.player.x!)).toBeLessThan(1.0);
            expect(Math.abs(result30fps.player.y! - result60fps_2.player.y!)).toBeLessThan(3.0);
        });
    });
});

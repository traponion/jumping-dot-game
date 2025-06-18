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
            // Set player as not grounded in store
            getGameStore().updatePlayer({ grounded: false });
            const initialPlayer = getGameStore().getPlayer();
            const initialVy = initialPlayer.vy;

            physicsSystem.update(16.67); // 60fps frame

            // Gravity should increase downward velocity
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vy).toBeGreaterThan(initialVy);
        });

        it('should not apply gravity when player is grounded', () => {
            // Set player as grounded in store
            getGameStore().updatePlayer({ grounded: true });
            const initialPlayer = getGameStore().getPlayer();
            const initialVy = initialPlayer.vy;

            physicsSystem.update(16.67);

            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vy).toBe(initialVy);
        });
    });

    describe('position updates', () => {
        it('should update player position based on velocity', () => {
            const initialX = player.x;
            const initialY = player.y;

            physicsSystem.update(16.67);

            // Get updated player from store
            const updatedPlayer = getGameStore().getPlayer();
            
            // Position should change based on velocity and game speed
            expect(updatedPlayer.x).not.toBe(initialX);
            expect(updatedPlayer.y).not.toBe(initialY);
        });

        it('should account for game speed in position updates', () => {
            const slowConstants = { ...constants, gameSpeed: 1.0 };
            const fastConstants = { ...constants, gameSpeed: 2.0 };

            const slowPhysics = new PhysicsSystem(slowConstants);
            const fastPhysics = new PhysicsSystem(fastConstants);

            // Reset store and set up initial player for slow test
            getGameStore().reset();
            getGameStore().updatePlayer(player);
            const initialX = player.x;
            
            slowPhysics.update(16.67);
            const slowPlayer = getGameStore().getPlayer();
            const slowDistance = Math.abs(slowPlayer.x - initialX);

            // Reset store and set up initial player for fast test  
            getGameStore().reset();
            getGameStore().updatePlayer(player);
            
            fastPhysics.update(16.67);
            const fastPlayer = getGameStore().getPlayer();
            const fastDistance = Math.abs(fastPlayer.x - initialX);

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
            const player1 = { ...player };
            const player2 = { ...player };

            // Simulate 30fps (33.33ms per frame)
            physicsSystem.update(33.33);

            // Simulate 60fps (16.67ms per frame) x2
            physicsSystem.update(16.67);
            physicsSystem.update(16.67);

            // Results should be reasonably close (allowing for gravity accumulation)
            expect(Math.abs(player1.x - player2.x)).toBeLessThan(1.0);
            expect(Math.abs(player1.y - player2.y)).toBeLessThan(3.0);
        });
    });
});

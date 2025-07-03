import { beforeEach, describe, expect, it } from 'vitest';
import { GameState } from '../stores/GameState.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';

describe('PhysicsSystem', () => {
    let gameState: GameState;
    let physicsSystem: PhysicsSystem;
    let constants: PhysicsConstants;

    beforeEach(() => {
        // Create fresh GameState instance for each test
        gameState = new GameState();

        // Set up initial player state
        gameState.runtime.player = {
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

        physicsSystem = new PhysicsSystem(gameState, constants);
    });

    describe('gravity application', () => {
        it('should apply gravity when player is not grounded', () => {
            // Set player as not grounded
            gameState.runtime.player.grounded = false;
            const initialVy = gameState.runtime.player.vy;

            physicsSystem.update(16.67); // 60fps frame

            // Gravity should increase downward velocity
            expect(gameState.runtime.player.vy).toBeGreaterThan(initialVy);
        });

        it('should not apply gravity when player is grounded', () => {
            // Set player as grounded
            gameState.runtime.player.grounded = true;
            const initialVy = gameState.runtime.player.vy;

            physicsSystem.update(16.67);

            expect(gameState.runtime.player.vy).toBe(initialVy);
        });
    });

    describe('position updates', () => {
        it('should update player position based on velocity', () => {
            const initialX = gameState.runtime.player.x;
            const initialY = gameState.runtime.player.y;

            physicsSystem.update(16.67);

            // Position should change based on velocity and game speed
            expect(gameState.runtime.player.x).not.toBe(initialX);
            expect(gameState.runtime.player.y).not.toBe(initialY);
        });

        it('should account for game speed in position updates', () => {
            const slowConstants = { ...constants, gameSpeed: 1.0 };
            const fastConstants = { ...constants, gameSpeed: 2.0 };

            // Create separate game states for isolated testing
            const slowGameState = new GameState();
            const fastGameState = new GameState();

            // Set up identical initial conditions
            const initialPlayer = {
                x: 100,
                y: 400,
                vx: 2,
                vy: -5,
                radius: 3,
                grounded: false
            };

            slowGameState.runtime.player = { ...initialPlayer };
            fastGameState.runtime.player = { ...initialPlayer };

            const slowPhysics = new PhysicsSystem(slowGameState, slowConstants);
            const fastPhysics = new PhysicsSystem(fastGameState, fastConstants);

            slowPhysics.update(16.67);
            const slowDistance = Math.abs(slowGameState.runtime.player.x - initialPlayer.x);

            fastPhysics.update(16.67);
            const fastDistance = Math.abs(fastGameState.runtime.player.x - initialPlayer.x);

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

    describe('velocity clamping', () => {
        it('should clamp positive horizontal velocity to maximum speed', () => {
            // Set velocity above maximum speed
            gameState.runtime.player.vx = 10; // Above moveSpeed (4)

            physicsSystem.update(16.67);

            // Velocity should be clamped to maximum speed
            expect(gameState.runtime.player.vx).toBe(constants.moveSpeed);
        });

        it('should clamp negative horizontal velocity to maximum speed', () => {
            // Set velocity below negative maximum speed
            gameState.runtime.player.vx = -10; // Below -moveSpeed (-4)

            physicsSystem.update(16.67);

            // Velocity should be clamped to negative maximum speed
            expect(gameState.runtime.player.vx).toBe(-constants.moveSpeed);
        });

        it('should not modify velocity within normal range', () => {
            // Set velocity within normal range
            gameState.runtime.player.vx = 2; // Within moveSpeed range

            physicsSystem.update(16.67);

            // Position should be updated but vx should remain valid (allowing for position-based changes)
            expect(Math.abs(gameState.runtime.player.vx)).toBeLessThanOrEqual(constants.moveSpeed);
        });
    });

    describe('frame rate independence', () => {
        it('should produce reasonably consistent results with different frame rates', () => {
            // Create two identical game states for comparison
            const gameState1 = new GameState();
            const gameState2 = new GameState();

            const initialPlayer = {
                x: 100,
                y: 400,
                vx: 2,
                vy: -5,
                radius: 3,
                grounded: false
            };

            gameState1.runtime.player = { ...initialPlayer };
            gameState2.runtime.player = { ...initialPlayer };

            const physics1 = new PhysicsSystem(gameState1, constants);
            const physics2 = new PhysicsSystem(gameState2, constants);

            // Simulate 30fps (33.33ms per frame)
            physics1.update(33.33);

            // Simulate 60fps (16.67ms per frame) x2
            physics2.update(16.67);
            physics2.update(16.67);

            // Results should be reasonably close (allowing for gravity accumulation)
            expect(
                Math.abs(gameState1.runtime.player.x - gameState2.runtime.player.x)
            ).toBeLessThan(1.0);
            expect(
                Math.abs(gameState1.runtime.player.y - gameState2.runtime.player.y)
            ).toBeLessThan(3.0);
        });
    });
});

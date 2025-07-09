/**
 * Pure business logic tests for PhysicsSystem
 * Tests framework-independent physics calculations
 */

import { describe, expect, it } from 'vitest';
import type { PhysicsConstants } from '../../../types/GameTypes.js';
import {
    DEFAULT_PHYSICS_CONSTANTS,
    type PlayerPhysicsState,
    applyGravity,
    clampVelocity,
    copyPhysicsConstants,
    resetPhysicsConstants,
    updatePhysicsConstants,
    updatePlayerPhysics,
    updatePlayerPosition
} from '../../../utils/PhysicsUtils.js';

describe('PhysicsSystem - Pure Business Logic', () => {
    const createTestPlayer = (): PlayerPhysicsState => ({
        x: 100,
        y: 400,
        vx: 2,
        vy: -5,
        radius: 3,
        grounded: false
    });

    const createTestConstants = (): PhysicsConstants => ({
        gravity: 0.6,
        jumpForce: -12,
        autoJumpInterval: 150,
        moveSpeed: 4,
        gameSpeed: 2.0
    });

    describe('gravity application', () => {
        it('should apply gravity when player is not grounded', () => {
            const player = createTestPlayer();
            player.grounded = false;
            const constants = createTestConstants();
            const deltaTime = 16.67; // 60fps frame

            const result = applyGravity(player, constants, deltaTime);

            // Gravity should increase downward velocity
            expect(result.vy).toBeGreaterThan(player.vy);
            expect(result.vy).toBe(player.vy + constants.gravity);

            // Other properties should remain unchanged
            expect(result.x).toBe(player.x);
            expect(result.vx).toBe(player.vx);
            expect(result.grounded).toBe(player.grounded);
        });

        it('should not apply gravity when player is grounded', () => {
            const player = createTestPlayer();
            player.grounded = true;
            const constants = createTestConstants();
            const deltaTime = 16.67;

            const result = applyGravity(player, constants, deltaTime);

            // Velocity should remain unchanged when grounded
            expect(result.vy).toBe(player.vy);
            expect(result).toEqual(player);
        });

        it('should scale gravity with delta time', () => {
            const player = createTestPlayer();
            player.grounded = false;
            const constants = createTestConstants();

            const result30fps = applyGravity(player, constants, 33.33); // 30fps
            const result60fps = applyGravity(player, constants, 16.67); // 60fps

            // 30fps should apply double the gravity per frame
            expect(result30fps.vy - player.vy).toBeCloseTo((result60fps.vy - player.vy) * 2, 3);
        });
    });

    describe('position updates', () => {
        it('should update player position based on velocity', () => {
            const player = createTestPlayer();
            const constants = createTestConstants();
            const deltaTime = 16.67;

            const result = updatePlayerPosition(player, constants, deltaTime);

            // Position should change based on velocity and game speed
            const expectedX = player.x + player.vx * constants.gameSpeed;
            const expectedY = player.y + player.vy * constants.gameSpeed;

            expect(result.x).toBeCloseTo(expectedX, 5);
            expect(result.y).toBeCloseTo(expectedY, 5);

            // Velocity should remain unchanged
            expect(result.vx).toBe(player.vx);
            expect(result.vy).toBe(player.vy);
        });

        it('should account for game speed in position updates', () => {
            const player = createTestPlayer();
            const slowConstants = { ...createTestConstants(), gameSpeed: 1.0 };
            const fastConstants = { ...createTestConstants(), gameSpeed: 2.0 };
            const deltaTime = 16.67;

            const slowResult = updatePlayerPosition(player, slowConstants, deltaTime);
            const fastResult = updatePlayerPosition(player, fastConstants, deltaTime);

            // Fast physics should move player further
            const slowDistance = Math.abs(slowResult.x - player.x);
            const fastDistance = Math.abs(fastResult.x - player.x);

            expect(fastDistance).toBeGreaterThan(slowDistance);
            expect(fastDistance).toBeCloseTo(slowDistance * 2, 5);
        });

        it('should scale position updates with delta time', () => {
            const player = createTestPlayer();
            const constants = createTestConstants();

            const result30fps = updatePlayerPosition(player, constants, 33.33); // 30fps
            const result60fps = updatePlayerPosition(player, constants, 16.67); // 60fps

            // 30fps should move double the distance per frame
            const distance30 = Math.abs(result30fps.x - player.x);
            const distance60 = Math.abs(result60fps.x - player.x);

            expect(distance30).toBeCloseTo(distance60 * 2, 2);
        });
    });

    describe('velocity clamping', () => {
        it('should clamp positive horizontal velocity to maximum speed', () => {
            const player = createTestPlayer();
            player.vx = 10; // Above moveSpeed (4)
            const constants = createTestConstants();

            const result = clampVelocity(player, constants);

            expect(result.vx).toBe(constants.moveSpeed);
            // Other properties should remain unchanged
            expect(result.vy).toBe(player.vy);
            expect(result.x).toBe(player.x);
        });

        it('should clamp negative horizontal velocity to maximum speed', () => {
            const player = createTestPlayer();
            player.vx = -10; // Below -moveSpeed (-4)
            const constants = createTestConstants();

            const result = clampVelocity(player, constants);

            expect(result.vx).toBe(-constants.moveSpeed);
            // Other properties should remain unchanged
            expect(result.vy).toBe(player.vy);
            expect(result.x).toBe(player.x);
        });

        it('should not modify velocity within normal range', () => {
            const player = createTestPlayer();
            player.vx = 2; // Within moveSpeed range
            const constants = createTestConstants();

            const result = clampVelocity(player, constants);

            expect(result.vx).toBe(player.vx);
            expect(result).toEqual(player);
        });

        it('should handle edge case velocities', () => {
            const player = createTestPlayer();
            const constants = createTestConstants();

            // Test exact boundary values
            player.vx = constants.moveSpeed;
            let result = clampVelocity(player, constants);
            expect(result.vx).toBe(constants.moveSpeed);

            player.vx = -constants.moveSpeed;
            result = clampVelocity(player, constants);
            expect(result.vx).toBe(-constants.moveSpeed);

            // Test zero velocity
            player.vx = 0;
            result = clampVelocity(player, constants);
            expect(result.vx).toBe(0);
        });
    });

    describe('constants management', () => {
        it('should return copy of physics constants', () => {
            const constants = createTestConstants();
            const copied = copyPhysicsConstants(constants);

            expect(copied).toEqual(constants);
            expect(copied).not.toBe(constants); // Should be a different object
        });

        it('should update physics constants partially', () => {
            const constants = createTestConstants();
            const newGravity = 1.2;

            const updated = updatePhysicsConstants(constants, { gravity: newGravity });

            expect(updated.gravity).toBe(newGravity);
            expect(updated.gameSpeed).toBe(constants.gameSpeed); // Other values unchanged
            expect(updated.jumpForce).toBe(constants.jumpForce);
            expect(updated).not.toBe(constants); // Should be a new object
        });

        it('should reset constants to defaults', () => {
            const reset = resetPhysicsConstants();

            expect(reset.gravity).toBe(0.6);
            expect(reset.gameSpeed).toBe(2.0);
            expect(reset.jumpForce).toBe(-12);
            expect(reset.moveSpeed).toBe(4);
            expect(reset.autoJumpInterval).toBe(150);
            expect(reset).toEqual(DEFAULT_PHYSICS_CONSTANTS);
        });

        it('should handle multiple partial updates', () => {
            const constants = createTestConstants();

            let updated = updatePhysicsConstants(constants, { gravity: 1.0 });
            updated = updatePhysicsConstants(updated, { gameSpeed: 3.0 });
            updated = updatePhysicsConstants(updated, { moveSpeed: 6 });

            expect(updated.gravity).toBe(1.0);
            expect(updated.gameSpeed).toBe(3.0);
            expect(updated.moveSpeed).toBe(6);
            expect(updated.jumpForce).toBe(constants.jumpForce); // Unchanged
        });
    });

    describe('complete physics update', () => {
        it('should combine gravity, position, and velocity in correct order', () => {
            const player = createTestPlayer();
            player.grounded = false;
            player.vx = 10; // Will be clamped
            const constants = createTestConstants();
            const deltaTime = 16.67;

            const result = updatePlayerPhysics(player, constants, deltaTime);

            // Gravity should be applied
            expect(result.vy).toBe(player.vy + constants.gravity);

            // Position should be updated with original velocity (before clamping)
            const expectedX = player.x + player.vx * constants.gameSpeed; // Original vx used for position
            const expectedY = player.y + (player.vy + constants.gravity) * constants.gameSpeed;

            expect(result.x).toBeCloseTo(expectedX, 3);
            expect(result.y).toBeCloseTo(expectedY, 3);

            // Velocity should be clamped after position update
            expect(result.vx).toBe(constants.moveSpeed);
        });

        it('should handle grounded player correctly', () => {
            const player = createTestPlayer();
            player.grounded = true;
            player.vx = 10; // Will be clamped
            const constants = createTestConstants();
            const deltaTime = 16.67;

            const result = updatePlayerPhysics(player, constants, deltaTime);

            // Gravity should NOT be applied when grounded
            expect(result.vy).toBe(player.vy);

            // Position should be updated with original velocity (before clamping)
            const expectedX = player.x + player.vx * constants.gameSpeed;
            const expectedY = player.y + player.vy * constants.gameSpeed;

            expect(result.x).toBeCloseTo(expectedX, 3);
            expect(result.y).toBeCloseTo(expectedY, 3);

            // Velocity should be clamped after position update
            expect(result.vx).toBe(constants.moveSpeed);
        });
    });

    describe('frame rate independence validation', () => {
        it('should produce consistent results across different frame rates', () => {
            const player1 = createTestPlayer();
            const player2 = createTestPlayer();
            const constants = createTestConstants();

            // Simulate 30fps (33.33ms per frame)
            const result30fps = updatePlayerPhysics(player1, constants, 33.33);

            // Simulate 60fps (16.67ms per frame) x2
            let result60fps = updatePlayerPhysics(player2, constants, 16.67);
            result60fps = updatePlayerPhysics(result60fps, constants, 16.67);

            // Results should be reasonably close (allowing for gravity accumulation)
            expect(Math.abs(result30fps.x - result60fps.x)).toBeLessThan(1.0);
            expect(Math.abs(result30fps.y - result60fps.y)).toBeLessThan(3.0);
        });
    });
});

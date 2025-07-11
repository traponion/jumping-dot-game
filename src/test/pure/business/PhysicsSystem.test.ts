/**
 * Pure business logic tests for PhysicsSystem
 * Tests framework-independent physics calculations
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PHYSICS_CONSTANTS } from '../../../constants/GameConstants.js';
import { GameState } from '../../../stores/GameState.js';
import { PhysicsSystem } from '../../../systems/PhysicsSystem.js';

describe('PhysicsSystem - Pure Business Logic', () => {
    let gameState: GameState;
    let physicsSystem: PhysicsSystem;

    beforeEach(() => {
        gameState = new GameState();
        gameState.runtime.player = {
            x: 100,
            y: 400,
            vx: 5,
            vy: 0,
            radius: 3,
            grounded: false
        };
        physicsSystem = new PhysicsSystem(gameState, DEFAULT_PHYSICS_CONSTANTS);
    });

    describe('gravity application', () => {
        it('should apply gravity when player is not grounded', () => {
            gameState.runtime.player.grounded = false;
            gameState.runtime.player.vy = 0;

            physicsSystem.update(16.67); // 60fps frame

            expect(gameState.runtime.player.vy).toBeGreaterThan(0);
        });

        it('should not apply gravity when player is grounded', () => {
            gameState.runtime.player.grounded = true;
            gameState.runtime.player.vy = 0;

            physicsSystem.update(16.67);

            expect(gameState.runtime.player.vy).toBe(0);
        });
    });

    describe('position updates', () => {
        it('should update position based on velocity', () => {
            const initialX = gameState.runtime.player.x;
            const initialY = gameState.runtime.player.y;
            gameState.runtime.player.vx = 5;
            gameState.runtime.player.vy = 3;

            physicsSystem.update(16.67);

            expect(gameState.runtime.player.x).toBeGreaterThan(initialX);
            expect(gameState.runtime.player.y).toBeGreaterThan(initialY);
        });
    });

    describe('velocity clamping', () => {
        it('should clamp horizontal velocity to maximum speed', () => {
            gameState.runtime.player.vx = 1000; // Excessive speed

            physicsSystem.update(16.67);

            expect(gameState.runtime.player.vx).toBeLessThanOrEqual(
                DEFAULT_PHYSICS_CONSTANTS.moveSpeed
            );
        });
    });

    describe('constants management', () => {
        it('should allow updating physics constants', () => {
            const newGravity = 2.0;
            physicsSystem.updateConstants({ gravity: newGravity });

            const constants = physicsSystem.getPhysicsConstants();
            expect(constants.gravity).toBe(newGravity);
        });

        it('should allow resetting constants', () => {
            physicsSystem.updateConstants({ gravity: 5.0 });
            physicsSystem.resetConstants();

            const constants = physicsSystem.getPhysicsConstants();
            expect(constants.gravity).toBe(DEFAULT_PHYSICS_CONSTANTS.gravity);
        });
    });
});

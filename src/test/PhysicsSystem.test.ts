/**
 * PhysicsSystem integration tests
 * Tests framework-dependent system integration and GameState interactions
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { GameState } from '../stores/GameState.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';

describe('PhysicsSystem - Framework Integration', () => {
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

    describe('GameState integration', () => {
        it('should directly modify GameState player properties', () => {
            // Test that PhysicsSystem modifies the actual GameState
            const initialState = { ...gameState.runtime.player };

            physicsSystem.update(16.67);

            // GameState should be modified directly (not a copy)
            expect(gameState.runtime.player).not.toEqual(initialState);
            expect(gameState.runtime.player.x).not.toBe(initialState.x);
            expect(gameState.runtime.player.y).not.toBe(initialState.y);
        });

        it('should maintain reference integrity with GameState', () => {
            // Ensure PhysicsSystem maintains proper reference to GameState
            const playerRef = gameState.runtime.player;

            physicsSystem.update(16.67);

            // Should be the same object reference
            expect(gameState.runtime.player).toBe(playerRef);
        });
    });

    describe('system lifecycle', () => {
        it('should properly initialize with GameState and constants', () => {
            // Test system initialization
            expect(physicsSystem).toBeDefined();
            expect(physicsSystem.getPhysicsConstants()).toEqual(constants);

            // System should not modify state during initialization
            expect(gameState.runtime.player.x).toBe(100);
            expect(gameState.runtime.player.y).toBe(400);
        });

        it('should handle multiple consecutive updates', () => {
            // Test system behavior over multiple frames
            const initialX = gameState.runtime.player.x;

            physicsSystem.update(16.67);
            const firstX = gameState.runtime.player.x;

            physicsSystem.update(16.67);
            const secondX = gameState.runtime.player.x;

            // Position should continue changing
            expect(firstX).not.toBe(initialX);
            expect(secondX).not.toBe(firstX);
        });
    });

    describe('constants management integration', () => {
        it('should reflect constant changes in subsequent updates', () => {
            // Update constants through system
            physicsSystem.updateConstants({ gameSpeed: 4.0 });

            const initialX = gameState.runtime.player.x;
            physicsSystem.update(16.67);
            const fastMovement = Math.abs(gameState.runtime.player.x - initialX);

            // Reset and test with slower speed
            gameState.runtime.player.x = initialX;
            physicsSystem.updateConstants({ gameSpeed: 1.0 });
            physicsSystem.update(16.67);
            const slowMovement = Math.abs(gameState.runtime.player.x - initialX);

            expect(fastMovement).toBeGreaterThan(slowMovement);
        });

        it('should persist constant updates across multiple frames', () => {
            const newGravity = 1.2;
            physicsSystem.updateConstants({ gravity: newGravity });

            // Multiple updates should use the new gravity
            for (let i = 0; i < 5; i++) {
                physicsSystem.update(16.67);
            }

            expect(physicsSystem.getPhysicsConstants().gravity).toBe(newGravity);
        });
    });
});

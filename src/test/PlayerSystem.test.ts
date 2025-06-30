import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GAME_CONFIG } from '../constants/GameConstants.js';
import { GameState } from '../stores/GameState.js';
import type { InputManager } from '../systems/InputManager.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';

describe('PlayerSystem', () => {
    let playerSystem: PlayerSystem;
    let gameState: GameState;
    let physics: PhysicsConstants;
    let mockInputManager: InputManager;

    beforeEach(() => {
        // Create fresh GameState instance for each test
        gameState = new GameState();

        // Set up test player state
        gameState.runtime.player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        physics = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        // Create mock InputManager
        mockInputManager = {
            isPressed: vi.fn(),
            getMovementState: vi.fn().mockReturnValue({}),
            clearInputs: vi.fn(),
            handleKeyEvent: vi.fn(),
            lastInputTime: 0,
            inputCooldown: 100,
            inputs: new Map(),
            gameController: null,
            canvas: null
        } as unknown as InputManager;

        playerSystem = new PlayerSystem(gameState, mockInputManager);
    });

    describe('input handling', () => {
        it('should initialize with hasMovedOnce as false', () => {
            expect(playerSystem.getHasMovedOnce()).toBe(false);
        });
    });

    describe('auto jump system', () => {
        it('should auto jump when grounded and interval passed', () => {
            gameState.runtime.player.grounded = true;

            // Mock performance.now to simulate time passage
            const originalNow = globalThis.performance.now;
            let mockTime = 0;
            globalThis.performance.now = () => mockTime;

            // First update to set lastJumpTime
            playerSystem.update(16.67, physics);

            // Advance time beyond auto jump interval
            mockTime += physics.autoJumpInterval + 10;
            playerSystem.update(16.67, physics);

            expect(gameState.runtime.player.vy).toBe(physics.jumpForce);
            expect(gameState.runtime.player.grounded).toBe(false);

            globalThis.performance.now = originalNow;
        });
    });

    describe('trail system', () => {
        it('should update trail with player position', () => {
            const initialTrailLength = gameState.runtime.trail.length;

            playerSystem.update(16.67, physics);

            const trail = gameState.runtime.trail;
            expect(trail.length).toBe(initialTrailLength + 1);
            expect(trail[trail.length - 1]).toEqual({
                x: gameState.runtime.player.x,
                y: gameState.runtime.player.y
            });
        });

        it('should limit trail length to maximum', () => {
            // Update many times to exceed max trail length
            for (let i = 0; i < 20; i++) {
                gameState.runtime.player.x = i; // Change position each time
                playerSystem.update(16.67, physics);
            }

            expect(gameState.runtime.trail.length).toBeLessThanOrEqual(
                GAME_CONFIG.player.maxTrailLength
            );
        });

        it('should clear trail', () => {
            // Arrange: Add some trail points
            for (let i = 0; i < 5; i++) {
                gameState.runtime.player.x = i * 10;
                gameState.runtime.player.y = i * 10;
                playerSystem.update(16.67, physics);
            }
            expect(gameState.runtime.trail.length).toBeGreaterThan(0);

            // Act
            playerSystem.clearTrail();

            // Assert
            expect(gameState.runtime.trail.length).toBe(0);
            expect(playerSystem.getTrail().length).toBe(0);
        });

        it('should get trail from game state', () => {
            // Arrange: Directly add trail points to state
            const directTrail = [
                { x: 100, y: 200 },
                { x: 150, y: 250 }
            ];
            gameState.runtime.trail = [...directTrail];

            // Act & Assert: PlayerSystem should return the game state's trail
            expect(playerSystem.getTrail()).toEqual(directTrail);
        });

        it('should respect GAME_CONFIG.player.maxTrailLength', () => {
            // Arrange: Use the actual config value
            const maxLength = GAME_CONFIG.player.maxTrailLength;

            // Act: Add more points than max
            for (let i = 0; i < maxLength + 3; i++) {
                gameState.runtime.player.x = i;
                gameState.runtime.player.y = i;
                playerSystem.update(16.67, physics);
            }

            // Assert
            expect(gameState.runtime.trail.length).toBe(maxLength);
        });

        it('should maintain trail consistency', () => {
            // Arrange: Add trail points through PlayerSystem
            for (let i = 0; i < 3; i++) {
                gameState.runtime.player.x = i * 50;
                gameState.runtime.player.y = i * 50;
                playerSystem.update(16.67, physics);
            }

            // Assert: Both should return the same trail
            const playerSystemTrail = playerSystem.getTrail();
            const stateTrail = gameState.runtime.trail;

            expect(playerSystemTrail).toEqual(stateTrail);
            expect(playerSystemTrail.length).toBe(stateTrail.length);
        });
    });

    describe('speed clamping', () => {
        it('should clamp velocity to max speed', () => {
            gameState.runtime.player.vx = 10; // Exceed max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(gameState.runtime.player.vx).toBe(physics.moveSpeed);
        });

        it('should clamp negative velocity to negative max speed', () => {
            gameState.runtime.player.vx = -10; // Exceed negative max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(gameState.runtime.player.vx).toBe(-physics.moveSpeed);
        });
    });

    describe('reset functionality', () => {
        it('should reset player to specified position', () => {
            gameState.runtime.player.vx = 5;
            gameState.runtime.player.vy = -3;
            playerSystem.update(16.67, physics); // Make some changes

            playerSystem.reset(200, 300);

            expect(gameState.runtime.player.x).toBe(200);
            expect(gameState.runtime.player.y).toBe(300);
            expect(gameState.runtime.player.vx).toBe(0);
            expect(gameState.runtime.player.vy).toBe(0);
            expect(gameState.runtime.player.grounded).toBe(false);
            expect(playerSystem.getHasMovedOnce()).toBe(false);
            expect(playerSystem.getTrail().length).toBe(0);
        });

        it('should reset jump timer', () => {
            const originalNow = globalThis.performance.now;
            let mockTime = 1000;
            globalThis.performance.now = () => mockTime;

            // First establish a baseline - do an initial update to set lastJumpTime
            gameState.runtime.player.grounded = true;
            playerSystem.update(16.67, physics);

            // Reset the player state for the actual test
            gameState.runtime.player.vy = 0;
            gameState.runtime.player.grounded = true;

            // Now call resetJumpTimer
            playerSystem.resetJumpTimer();

            // Advance time slightly to ensure we're past the interval
            mockTime += 10;
            playerSystem.update(16.67, physics);

            expect(gameState.runtime.player.vy).toBe(physics.jumpForce);
            expect(gameState.runtime.player.grounded).toBe(false);

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

    describe('input integration', () => {
        it('should process left movement input', () => {
            // Mock left key press
            (mockInputManager.isPressed as any).mockImplementation(
                (key: string) => key === 'move-left'
            );

            // Get initial velocity
            const initialVx = gameState.runtime.player.vx;

            // Update PlayerSystem
            playerSystem.update(16.67, physics);

            // Check if player moved left (negative velocity change)
            expect(gameState.runtime.player.vx).toBeLessThan(initialVx);
            expect(playerSystem.getHasMovedOnce()).toBe(true);
        });

        it('should process right movement input', () => {
            // Mock right key press
            (mockInputManager.isPressed as any).mockImplementation(
                (key: string) => key === 'move-right'
            );

            // Get initial velocity
            const initialVx = gameState.runtime.player.vx;

            // Update PlayerSystem
            playerSystem.update(16.67, physics);

            // Check if player moved right (positive velocity change)
            expect(gameState.runtime.player.vx).toBeGreaterThan(initialVx);
            expect(playerSystem.getHasMovedOnce()).toBe(true);
        });
    });
});

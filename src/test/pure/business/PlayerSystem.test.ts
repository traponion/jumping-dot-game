import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameState } from '../../../stores/GameState.js';
import type { InputManager } from '../../../systems/InputManager.js';
import { PlayerSystem } from '../../../systems/PlayerSystem.js';
import type { PhysicsConstants } from '../../../types/GameTypes.js';

describe('PlayerSystem - Pure Business Logic', () => {
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

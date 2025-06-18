import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
import type { InputManager } from '../systems/InputManager.js';
import { getGameStore } from '../stores/GameZustandStore.js';
import { GAME_CONFIG } from '../constants/GameConstants.js';

describe('PlayerSystem', () => {
    let playerSystem: PlayerSystem;
    let physics: PhysicsConstants;
    let mockInputManager: InputManager;

    beforeEach(() => {
        // Reset store to clean state
        getGameStore().reset();
        
        // Set up test player state in store
        getGameStore().updatePlayer({
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        });

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

        playerSystem = new PlayerSystem(mockInputManager);
    });

    describe('input handling', () => {
        // Note: Input handling tests were skipped due to complex integration requirements
        // with the InputManager system. PlayerSystem movement is primarily tested through
        // integration tests where the full system is available.

        it('should initialize with hasMovedOnce as false', () => {
            expect(playerSystem.getHasMovedOnce()).toBe(false);
        });
    });

    describe('auto jump system', () => {
        it('should auto jump when grounded and interval passed', () => {
            getGameStore().updatePlayer({ grounded: true });

            // Mock performance.now to simulate time passage
            const originalNow = globalThis.performance.now;
            let mockTime = 0;
            globalThis.performance.now = () => mockTime;

            // First update to set lastJumpTime
            playerSystem.update(16.67, physics);

            // Advance time beyond auto jump interval
            mockTime += physics.autoJumpInterval + 10;
            playerSystem.update(16.67, physics);

            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vy).toBe(physics.jumpForce);
            expect(updatedPlayer.grounded).toBe(false);

            globalThis.performance.now = originalNow;
        });
    });

    describe('trail system (Zustand integration)', () => {
        it('should update trail with player position via Zustand store', () => {
            const initialTrailLength = playerSystem.getTrail().length;

            playerSystem.update(16.67, physics);

            const trail = playerSystem.getTrail();
            expect(trail.length).toBe(initialTrailLength + 1);
            const currentPlayer = getGameStore().getPlayer();
            expect(trail[trail.length - 1]).toEqual({ x: currentPlayer.x, y: currentPlayer.y });
        });

        it('should limit trail length to maximum via Zustand store', () => {
            // Update many times to exceed max trail length
            for (let i = 0; i < 20; i++) {
                getGameStore().updatePlayer({ x: i }); // Change position each time
                playerSystem.update(16.67, physics);
            }

            expect(playerSystem.getTrail().length).toBeLessThanOrEqual(8);
        });

        it('should clear trail via Zustand store action', () => {
            // Arrange: Add some trail points
            for (let i = 0; i < 5; i++) {
                getGameStore().updatePlayer({ x: i * 10, y: i * 10 });
                playerSystem.update(16.67, physics);
            }
            expect(playerSystem.getTrail().length).toBeGreaterThan(0);

            // Act
            playerSystem.clearTrail();

            // Assert
            expect(playerSystem.getTrail().length).toBe(0);
            expect(getGameStore().runtime.trail.length).toBe(0);
        });

        it('should get trail from Zustand store, not local state', () => {
            // Arrange: Directly add trail points to store
            const directTrail = [{ x: 100, y: 200 }, { x: 150, y: 250 }];
            getGameStore().updateTrail(directTrail);

            // Act & Assert: PlayerSystem should return the store's trail
            expect(playerSystem.getTrail()).toEqual(directTrail);
        });

        it('should respect GAME_CONFIG.player.maxTrailLength', () => {
            // Arrange: Use the actual config value
            const maxLength = GAME_CONFIG.player.maxTrailLength;
            
            // Act: Add more points than max
            for (let i = 0; i < maxLength + 3; i++) {
                getGameStore().updatePlayer({ x: i, y: i });
                playerSystem.update(16.67, physics);
            }

            // Assert
            expect(playerSystem.getTrail().length).toBe(maxLength);
            expect(getGameStore().runtime.trail.length).toBe(maxLength);
        });

        it('should maintain trail consistency between PlayerSystem and store', () => {
            // Arrange: Add trail points through PlayerSystem
            for (let i = 0; i < 3; i++) {
                getGameStore().updatePlayer({ x: i * 50, y: i * 50 });
                playerSystem.update(16.67, physics);
            }

            // Assert: Both should return the same trail
            const playerSystemTrail = playerSystem.getTrail();
            const storeTrail = getGameStore().runtime.trail;
            
            expect(playerSystemTrail).toEqual(storeTrail);
            expect(playerSystemTrail.length).toBe(storeTrail.length);
        });
    });

    describe('speed clamping', () => {
        it('should clamp velocity to max speed', () => {
            getGameStore().updatePlayer({ vx: 10 }); // Exceed max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vx).toBe(physics.moveSpeed);
        });

        it('should clamp negative velocity to negative max speed', () => {
            getGameStore().updatePlayer({ vx: -10 }); // Exceed negative max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vx).toBe(-physics.moveSpeed);
        });
    });

    describe('reset functionality', () => {
        it('should reset player to specified position', () => {
            getGameStore().updatePlayer({ vx: 5, vy: -3 });
            playerSystem.update(16.67, physics); // Make some changes

            playerSystem.reset(200, 300);

            const resetPlayer = getGameStore().getPlayer();
            expect(resetPlayer.x).toBe(200);
            expect(resetPlayer.y).toBe(300);
            expect(resetPlayer.vx).toBe(0);
            expect(resetPlayer.vy).toBe(0);
            expect(resetPlayer.grounded).toBe(false);
            expect(playerSystem.getHasMovedOnce()).toBe(false);
            expect(playerSystem.getTrail().length).toBe(0);
        });

        it('should reset jump timer', () => {
            const originalNow = globalThis.performance.now;
            let mockTime = 1000;
            globalThis.performance.now = () => mockTime;

            // First establish a baseline - do an initial update to set lastJumpTime
            getGameStore().updatePlayer({ grounded: true });
            playerSystem.update(16.67, physics);

            // Reset the player state for the actual test
            getGameStore().updatePlayer({ vy: 0 });
            getGameStore().updatePlayer({ grounded: true });

            // Now call resetJumpTimer
            playerSystem.resetJumpTimer();

            // Advance time slightly to ensure we're past the interval
            mockTime += 10;
            playerSystem.update(16.67, physics);

            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vy).toBe(physics.jumpForce);
            expect(updatedPlayer.grounded).toBe(false);

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

    describe('Zustand store integration (TDD - should fail before fix)', () => {
        it('should update Zustand store when player moves horizontally', () => {
            // Reset store state for clean test
            getGameStore().reset();
            
            // Mock InputManager to simulate key press
            const mockInputManager = {
                isPressed: vi.fn()
            };
            
            // Create PlayerSystem with InputManager
            const playerSystemWithInput = new PlayerSystem(mockInputManager as any);
            
            // Mock left key press
            mockInputManager.isPressed.mockImplementation((key: string) => key === 'move-left');
            
            // Get initial store state
            const initialPlayer = getGameStore().getPlayer();
            expect(initialPlayer.vx).toBe(0);
            
            // Update PlayerSystem (this should update the store, but currently doesn't)
            playerSystemWithInput.update(16.67, physics);
            
            // Check if store was updated (this will fail before fix)
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vx).toBeLessThan(0); // Should be negative for left movement
            expect(getGameStore().game.hasMovedOnce).toBe(true);
        });

        it('should update Zustand store when player moves right', () => {
            // Reset store state for clean test
            getGameStore().reset();
            
            // Mock InputManager to simulate right key press
            const mockInputManager = {
                isPressed: vi.fn()
            };
            
            const playerSystemWithInput = new PlayerSystem(mockInputManager as any);
            
            // Mock right key press
            mockInputManager.isPressed.mockImplementation((key: string) => key === 'move-right');
            
            // Get initial store state
            const initialPlayer = getGameStore().getPlayer();
            expect(initialPlayer.vx).toBe(0);
            
            // Update PlayerSystem
            playerSystemWithInput.update(16.67, physics);
            
            // Check if store was updated
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vx).toBeGreaterThan(0); // Should be positive for right movement
            expect(getGameStore().game.hasMovedOnce).toBe(true);
        });
    });
});

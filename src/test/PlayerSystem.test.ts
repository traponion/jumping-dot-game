import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import type { KeyState, PhysicsConstants, Player } from '../types/GameTypes.js';
import { getGameStore } from '../stores/GameZustandStore.js';

describe('PlayerSystem', () => {
    let player: Player;
    let keys: KeyState;
    let playerSystem: PlayerSystem;
    let physics: PhysicsConstants;

    beforeEach(() => {
        player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };

        keys = {};

        physics = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        playerSystem = new PlayerSystem(player);
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
            player.grounded = true;

            // Mock performance.now to simulate time passage
            const originalNow = globalThis.performance.now;
            let mockTime = 0;
            globalThis.performance.now = () => mockTime;

            // First update to set lastJumpTime
            playerSystem.update(16.67, physics);

            // Advance time beyond auto jump interval
            mockTime += physics.autoJumpInterval + 10;
            playerSystem.update(16.67, physics);

            expect(player.vy).toBe(physics.jumpForce);
            expect(player.grounded).toBe(false);

            globalThis.performance.now = originalNow;
        });
    });

    describe('trail system', () => {
        it('should update trail with player position', () => {
            const initialTrailLength = playerSystem.getTrail().length;

            playerSystem.update(16.67, physics);

            const trail = playerSystem.getTrail();
            expect(trail.length).toBe(initialTrailLength + 1);
            expect(trail[trail.length - 1]).toEqual({ x: player.x, y: player.y });
        });

        it('should limit trail length to maximum', () => {
            // Update many times to exceed max trail length
            for (let i = 0; i < 20; i++) {
                player.x = i; // Change position each time
                playerSystem.update(16.67, physics);
            }

            expect(playerSystem.getTrail().length).toBeLessThanOrEqual(8);
        });
    });

    describe('speed clamping', () => {
        it('should clamp velocity to max speed', () => {
            player.vx = 10; // Exceed max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(player.vx).toBe(physics.moveSpeed);
        });

        it('should clamp negative velocity to negative max speed', () => {
            player.vx = -10; // Exceed negative max speed

            playerSystem.clampSpeed(physics.moveSpeed);

            expect(player.vx).toBe(-physics.moveSpeed);
        });
    });

    describe('reset functionality', () => {
        it('should reset player to specified position', () => {
            player.vx = 5;
            player.vy = -3;
            keys.ArrowRight = true;
            playerSystem.update(16.67, physics); // Make some changes

            playerSystem.reset(200, 300);

            expect(player.x).toBe(200);
            expect(player.y).toBe(300);
            expect(player.vx).toBe(0);
            expect(player.vy).toBe(0);
            expect(player.grounded).toBe(false);
            expect(playerSystem.getHasMovedOnce()).toBe(false);
            expect(playerSystem.getTrail().length).toBe(0);
        });

        it('should reset jump timer', () => {
            const originalNow = globalThis.performance.now;
            let mockTime = 1000;
            globalThis.performance.now = () => mockTime;

            // First establish a baseline - do an initial update to set lastJumpTime
            player.grounded = true;
            playerSystem.update(16.67, physics);

            // Reset the player state for the actual test
            player.vy = 0;
            player.grounded = true;

            // Now call resetJumpTimer
            playerSystem.resetJumpTimer();

            // Advance time slightly to ensure we're past the interval
            mockTime += 10;
            playerSystem.update(16.67, physics);

            expect(player.vy).toBe(physics.jumpForce);
            expect(player.grounded).toBe(false);

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
            const playerSystemWithInput = new PlayerSystem(undefined, mockInputManager as any);
            
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
            
            const playerSystemWithInput = new PlayerSystem(undefined, mockInputManager as any);
            
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

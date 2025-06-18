import { beforeEach, describe, expect, it } from 'vitest';
import type { Goal, Platform, Spike } from '../core/StageLoader.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import type { Player } from '../types/GameTypes.js';
import { getGameStore } from '../stores/GameZustandStore.js';

describe('CollisionSystem', () => {
    let player: Player;
    let collisionSystem: CollisionSystem;

    beforeEach(() => {
        // Reset store to clean state
        getGameStore().reset();
        
        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        // Set initial player state in store
        getGameStore().updatePlayer(player);

        collisionSystem = new CollisionSystem();
    });

    describe('platform collision', () => {
        it('should detect platform collision when falling onto platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            getGameStore().updatePlayer(fallingPlayer);
            const prevPlayerFootY = 405; // Player was above platform

            const result = collisionSystem.checkPlatformCollision(
                getGameStore().getPlayer(),
                platform,
                prevPlayerFootY
            );

            expect(result).toEqual({
                y: 407, // platform.y1 - player.radius
                vy: 0,
                grounded: true
            });
        });

        it('should not detect collision when moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const upwardPlayer = { ...player, vy: -5 };
            getGameStore().updatePlayer(upwardPlayer);
            const prevPlayerFootY = 415;

            const result = collisionSystem.checkPlatformCollision(
                getGameStore().getPlayer(),
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should not detect collision when player is horizontally outside platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const outsidePlayer = { ...player, x: 120 };
            getGameStore().updatePlayer(outsidePlayer);
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkPlatformCollision(
                getGameStore().getPlayer(),
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should handle multiple platforms and return true for first collision', () => {
            const platforms: Platform[] = [
                { x1: 90, y1: 410, x2: 110, y2: 410 },
                { x1: 90, y1: 420, x2: 110, y2: 420 }
            ];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            getGameStore().updatePlayer(fallingPlayer);
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(
                platforms,
                prevPlayerFootY
            );

            expect(result).toBe(true);
            // Check that store was updated with collision result
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.y).toBe(407); // Should land on first platform
            expect(updatedPlayer.grounded).toBe(true);
        });

        it('should prevent clipping through platform with high speed movement', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            // Simulate high-speed movement that could clip through platform
            const fastPlayer = { ...player, y: 430, vy: 20 };
            getGameStore().updatePlayer(fastPlayer);
            const prevPlayerFootY = 405; // Player was above platform in previous frame

            const result = collisionSystem.checkPlatformCollision(
                getGameStore().getPlayer(),
                platform,
                prevPlayerFootY
            );

            expect(result).toEqual({
                y: 407, // Should be corrected to platform surface
                vy: 0,
                grounded: true
            });
        });

        it('should not falsely detect collision when teleporting far below platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            // Simulate case where player has teleported far below without crossing
            const teleportedPlayer = { ...player, y: 500, vy: 5 };
            getGameStore().updatePlayer(teleportedPlayer);
            const prevPlayerFootY = 495; // Was also below platform

            const result = collisionSystem.checkPlatformCollision(
                getGameStore().getPlayer(),
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull(); // Should not detect collision
        });

        it('should update store when handlePlatformCollisions detects collision', () => {
            const platforms: Platform[] = [
                { x1: 90, y1: 410, x2: 110, y2: 410 }
            ];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            getGameStore().updatePlayer(fallingPlayer);
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBe(true);
            // Verify store was updated
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.y).toBe(407);
            expect(updatedPlayer.vy).toBe(0);
            expect(updatedPlayer.grounded).toBe(true);
        });

        it('should reset grounded to false when handlePlatformCollisions finds no collision', () => {
            // Setup: Player initially grounded
            getGameStore().updatePlayer({ grounded: true });
            
            const platforms: Platform[] = [
                { x1: 90, y1: 410, x2: 110, y2: 410 }
            ];
            const prevPlayerFootY = 350; // No collision

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBe(false);
            // Grounded should be reset to false
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.grounded).toBe(false);
        });
    });

    describe('spike collision', () => {
        it('should detect spike collision when player overlaps spike', () => {
            const spike: Spike = { x: 95, y: 395, width: 10, height: 10 };

            const result = collisionSystem.checkSpikeCollision(player, spike);

            expect(result).toBe(true);
        });

        it('should not detect spike collision when player is outside spike area', () => {
            const spike: Spike = { x: 120, y: 395, width: 10, height: 10 };

            const result = collisionSystem.checkSpikeCollision(player, spike);

            expect(result).toBe(false);
        });

        it('should check multiple spikes and return true if any collision', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 }, // No collision
                { x: 95, y: 395, width: 10, height: 10 } // Collision
            ];

            const result = collisionSystem.checkSpikeCollisions(player, spikes);

            expect(result).toBe(true);
        });

        it('should return false when no spike collisions', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 },
                { x: 130, y: 395, width: 10, height: 10 }
            ];

            const result = collisionSystem.checkSpikeCollisions(player, spikes);

            expect(result).toBe(false);
        });
    });

    describe('goal collision', () => {
        it('should detect goal collision when player overlaps goal', () => {
            const goal: Goal = { x: 95, y: 395, width: 10, height: 10 };

            const result = collisionSystem.checkGoalCollision(player, goal);

            expect(result).toBe(true);
        });

        it('should not detect goal collision when player is outside goal area', () => {
            const goal: Goal = { x: 120, y: 395, width: 10, height: 10 };

            const result = collisionSystem.checkGoalCollision(player, goal);

            expect(result).toBe(false);
        });
    });

    describe('hole collision', () => {
        it('should detect hole collision when player falls below threshold', () => {
            player.y = 650; // Below hole threshold

            const result = collisionSystem.checkHoleCollision(player, 600);

            expect(result).toBe(true);
        });

        it('should not detect hole collision when player is above threshold', () => {
            player.y = 550; // Above hole threshold

            const result = collisionSystem.checkHoleCollision(player, 600);

            expect(result).toBe(false);
        });
    });

    describe('general boundary collision', () => {
        it('should detect when player falls too far down', () => {
            player.y = 750; // Way below screen
            const canvasHeight = 600;

            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);

            expect(result).toBe(true);
        });

        it('should not detect boundary collision for normal positions', () => {
            player.y = 400; // Normal position
            const canvasHeight = 600;

            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);

            expect(result).toBe(false);
        });
    });
});

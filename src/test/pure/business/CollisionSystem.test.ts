import { beforeEach, describe, expect, it } from 'vitest';
import type { Goal, MovingPlatform, Platform, Spike } from '../../../core/StageLoader.js';
import type { Player } from '../../../types/GameTypes.js';
import {
    checkBoundaryCollision,
    checkGoalCollision,
    checkHoleCollision,
    checkMovingPlatformCollision,
    checkPlatformCollision,
    checkSpikeCollision,
    checkSpikeCollisions
} from '../../../utils/CollisionUtils.js';

// Pure business logic tests
describe('CollisionSystem Business Logic', () => {
    let player: Player;

    beforeEach(() => {
        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };
    });

    describe('platform collision', () => {
        it('should detect platform collision when falling onto platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            const prevPlayerFootY = 405; // Player was above platform

            const result = checkPlatformCollision(fallingPlayer, platform, prevPlayerFootY);

            expect(result).toEqual({
                y: 407, // platform.y1 - player.radius
                vy: 0,
                grounded: true
            });
        });

        it('should not detect collision when moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const upwardPlayer = { ...player, vy: -5 };
            const prevPlayerFootY = 415;

            const result = checkPlatformCollision(upwardPlayer, platform, prevPlayerFootY);

            expect(result).toBeNull();
        });

        it('should not detect collision when player is horizontally outside platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const outsidePlayer = { ...player, x: 120 };
            const prevPlayerFootY = 405;

            const result = checkPlatformCollision(outsidePlayer, platform, prevPlayerFootY);

            expect(result).toBeNull();
        });

        it('should prevent clipping through platform with high speed movement', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            // Simulate high-speed movement that could clip through platform
            const fastPlayer = { ...player, y: 430, vy: 20 };
            const prevPlayerFootY = 405; // Player was above platform in previous frame

            const result = checkPlatformCollision(fastPlayer, platform, prevPlayerFootY);

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
            const prevPlayerFootY = 495; // Was also below platform

            const result = checkPlatformCollision(teleportedPlayer, platform, prevPlayerFootY);

            expect(result).toBeNull(); // Should not detect collision
        });

        it('should detect collision when player exactly touches platform edge', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const edgePlayer = { ...player, x: 90, y: 408, vy: 2, radius: 3 };
            const prevPlayerFootY = 405;

            const result = checkPlatformCollision(edgePlayer, platform, prevPlayerFootY);

            expect(result).toBeDefined();
            expect(result?.grounded).toBe(true);
        });

        it('should not detect collision when player is just outside platform horizontally', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const outsidePlayer = { ...player, x: 86, y: 408, vy: 2, radius: 3 }; // 86 + 3 = 89 < 90
            const prevPlayerFootY = 405;

            const result = checkPlatformCollision(outsidePlayer, platform, prevPlayerFootY);

            expect(result).toBeNull();
        });

        it('should not detect collision when player is horizontally aligned but moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const upwardMovingPlayer = { ...player, x: 100, y: 420, vy: -5, radius: 3 };
            const prevPlayerFootY = 420;

            const result = checkPlatformCollision(upwardMovingPlayer, platform, prevPlayerFootY);

            expect(result).toBeNull();
        });
    });

    describe('spike collision', () => {
        it('should detect spike collision when player overlaps spike', () => {
            const spike: Spike = { x: 95, y: 395, width: 10, height: 10 };

            const result = checkSpikeCollision(player, spike);

            expect(result).toBe(true);
        });

        it('should not detect spike collision when player is outside spike area', () => {
            const spike: Spike = { x: 120, y: 395, width: 10, height: 10 };

            const result = checkSpikeCollision(player, spike);

            expect(result).toBe(false);
        });

        it('should detect collision when player center is at spike edge', () => {
            const spike: Spike = { x: 100, y: 400, width: 10, height: 10 };
            const edgePlayer = { ...player, x: 105, y: 405, radius: 3 };

            const result = checkSpikeCollision(edgePlayer, spike);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is just outside spike', () => {
            const spike: Spike = { x: 100, y: 400, width: 10, height: 10 };
            const outsidePlayer = { ...player, x: 90, y: 405, radius: 3 };

            const result = checkSpikeCollision(outsidePlayer, spike);

            expect(result).toBe(false);
        });

        it('should check multiple spikes and return true if any collision', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 }, // No collision
                { x: 95, y: 395, width: 10, height: 10 } // Collision
            ];

            const result = checkSpikeCollisions(player, spikes);

            expect(result).toBe(true);
        });

        it('should return false when no spike collisions', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 },
                { x: 130, y: 395, width: 10, height: 10 }
            ];

            const result = checkSpikeCollisions(player, spikes);

            expect(result).toBe(false);
        });

        it('should handle empty spike array', () => {
            const emptySpikes: Spike[] = [];

            const result = checkSpikeCollisions(player, emptySpikes);

            expect(result).toBe(false);
        });
    });

    describe('goal collision', () => {
        it('should detect goal collision when player overlaps goal', () => {
            const goal: Goal = { x: 95, y: 395, width: 10, height: 10 };

            const result = checkGoalCollision(player, goal);

            expect(result).toBe(true);
        });

        it('should not detect goal collision when player is outside goal area', () => {
            const goal: Goal = { x: 120, y: 395, width: 10, height: 10 };

            const result = checkGoalCollision(player, goal);

            expect(result).toBe(false);
        });

        it('should detect collision when player center is at goal edge', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const edgePlayer = { ...player, x: 110, y: 410, radius: 3 };

            const result = checkGoalCollision(edgePlayer, goal);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is just outside goal', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const outsidePlayer = { ...player, x: 90, y: 410, radius: 3 };

            const result = checkGoalCollision(outsidePlayer, goal);

            expect(result).toBe(false);
        });

        it('should handle goal collision with different player radius', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const largePlayer = { ...player, x: 105, y: 405, radius: 10 };

            const result = checkGoalCollision(largePlayer, goal);

            expect(result).toBe(true);
        });
    });

    describe('hole collision', () => {
        it('should detect hole collision when player falls below threshold', () => {
            const testPlayer = { ...player, y: 650 }; // Below hole threshold

            const result = checkHoleCollision(testPlayer, 600);

            expect(result).toBe(true);
        });

        it('should not detect hole collision when player is above threshold', () => {
            const testPlayer = { ...player, y: 550 }; // Above hole threshold

            const result = checkHoleCollision(testPlayer, 600);

            expect(result).toBe(false);
        });

        it('should detect hole collision exactly at threshold', () => {
            const holeThreshold = 500;
            const testPlayer = { ...player, y: holeThreshold }; // Exactly at threshold

            const result = checkHoleCollision(testPlayer, holeThreshold);

            expect(result).toBe(false); // Should be false when exactly at threshold
        });

        it('should detect hole collision just above threshold', () => {
            const holeThreshold = 500;
            const testPlayer = { ...player, y: holeThreshold + 0.1 }; // Just above threshold

            const result = checkHoleCollision(testPlayer, holeThreshold);

            expect(result).toBe(true);
        });

        it('should not detect hole collision below threshold', () => {
            const holeThreshold = 500;
            const testPlayer = { ...player, y: holeThreshold - 1 }; // Below threshold

            const result = checkHoleCollision(testPlayer, holeThreshold);

            expect(result).toBe(false);
        });
    });

    describe('general boundary collision', () => {
        it('should detect when player falls too far down', () => {
            const testPlayer = { ...player, y: 750 }; // Way below screen
            const canvasHeight = 600;

            const result = checkBoundaryCollision(testPlayer, canvasHeight);

            expect(result).toBe(true);
        });

        it('should not detect boundary collision for normal positions', () => {
            const testPlayer = { ...player, y: 400 }; // Normal position
            const canvasHeight = 600;

            const result = checkBoundaryCollision(testPlayer, canvasHeight);

            expect(result).toBe(false);
        });

        it('should detect boundary collision exactly above threshold', () => {
            const canvasHeight = 600;
            const testPlayer = { ...player, y: canvasHeight + 100.1 }; // Just above threshold

            const result = checkBoundaryCollision(testPlayer, canvasHeight);

            expect(result).toBe(true);
        });

        it('should not detect boundary collision just below threshold', () => {
            const canvasHeight = 600;
            const testPlayer = { ...player, y: canvasHeight + 99 }; // Just below threshold

            const result = checkBoundaryCollision(testPlayer, canvasHeight);

            expect(result).toBe(false);
        });
    });

    describe('moving platform collision', () => {
        let movingPlatform: MovingPlatform;

        beforeEach(() => {
            movingPlatform = {
                x1: 90,
                y1: 410,
                x2: 110,
                y2: 410,
                startX: 80,
                endX: 120,
                speed: 1,
                direction: 1
            };
        });

        it('should detect collision with moving platform like static platform', () => {
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            const prevPlayerFootY = 405;

            const result = checkMovingPlatformCollision(
                fallingPlayer,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeDefined();
            expect(result?.y).toBe(407); // 410 - 3 (radius)
            expect(result?.vy).toBe(0);
            expect(result?.grounded).toBe(true);
        });

        it('should return collision info including platform reference', () => {
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            const prevPlayerFootY = 405;

            const result = checkMovingPlatformCollision(
                fallingPlayer,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeDefined();
            expect(result?.platform).toBe(movingPlatform);
        });

        it('should not collide when moving upward', () => {
            const jumpingPlayer = { ...player, y: 408, vy: -5 };
            const prevPlayerFootY = 405;

            const result = checkMovingPlatformCollision(
                jumpingPlayer,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should not collide when outside horizontal bounds', () => {
            const outsidePlayer = { ...player, x: 150, y: 408, vy: 5 };
            const prevPlayerFootY = 405;

            const result = checkMovingPlatformCollision(
                outsidePlayer,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });
    });
});

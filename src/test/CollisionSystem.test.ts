import { beforeEach, describe, expect, it } from 'vitest';
import type { Goal, MovingPlatform, Platform, Spike } from '../core/StageLoader.js';
import { GameState } from '../stores/GameState.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import type { Player } from '../types/GameTypes.js';

describe('CollisionSystem', () => {
    let player: Player;
    let gameState: GameState;
    let collisionSystem: CollisionSystem;

    beforeEach(() => {
        gameState = new GameState();

        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        gameState.runtime.player = player;
        collisionSystem = new CollisionSystem(gameState);
    });

    describe('platform collision', () => {
        it('should detect platform collision when falling onto platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405; // Player was above platform

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
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
            gameState.runtime.player = upwardPlayer;
            const prevPlayerFootY = 415;

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should not detect collision when player is horizontally outside platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const outsidePlayer = { ...player, x: 120 };
            gameState.runtime.player = outsidePlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
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
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBeDefined();
            expect(result).toEqual({
                y: 407, // Should land on first platform
                vy: 0,
                grounded: true
            });
        });

        it('should prevent clipping through platform with high speed movement', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            // Simulate high-speed movement that could clip through platform
            const fastPlayer = { ...player, y: 430, vy: 20 };
            gameState.runtime.player = fastPlayer;
            const prevPlayerFootY = 405; // Player was above platform in previous frame

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
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
            gameState.runtime.player = teleportedPlayer;
            const prevPlayerFootY = 495; // Was also below platform

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull(); // Should not detect collision
        });

        it('should update store when handlePlatformCollisions detects collision', () => {
            const platforms: Platform[] = [{ x1: 90, y1: 410, x2: 110, y2: 410 }];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBeDefined();
            expect(result).toEqual({
                y: 407,
                vy: 0,
                grounded: true // Collision sets grounded to true
            });
        });

        it('should reset grounded to false when handlePlatformCollisions finds no collision', () => {
            // Setup: Player initially grounded
            gameState.runtime.player.grounded = true;

            const platforms: Platform[] = [{ x1: 90, y1: 410, x2: 110, y2: 410 }];
            const prevPlayerFootY = 350; // No collision

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toEqual({
                grounded: false // No collision, just grounded reset
            });
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

        it('should detect boundary collision exactly above threshold', () => {
            const canvasHeight = 600;
            player.y = canvasHeight + 100.1; // Just above threshold

            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);

            expect(result).toBe(true);
        });

        it('should not detect boundary collision just below threshold', () => {
            const canvasHeight = 600;
            player.y = canvasHeight + 99; // Just below threshold

            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);

            expect(result).toBe(false);
        });
    });

    describe('hole collision edge cases', () => {
        it('should detect hole collision exactly at threshold', () => {
            const holeThreshold = 500;
            player.y = holeThreshold; // Exactly at threshold

            const result = collisionSystem.checkHoleCollision(player, holeThreshold);

            expect(result).toBe(false); // Should be false when exactly at threshold
        });

        it('should detect hole collision just above threshold', () => {
            const holeThreshold = 500;
            player.y = holeThreshold + 0.1; // Just above threshold

            const result = collisionSystem.checkHoleCollision(player, holeThreshold);

            expect(result).toBe(true);
        });

        it('should not detect hole collision below threshold', () => {
            const holeThreshold = 500;
            player.y = holeThreshold - 1; // Below threshold

            const result = collisionSystem.checkHoleCollision(player, holeThreshold);

            expect(result).toBe(false);
        });
    });

    describe('platform collision edge cases', () => {
        beforeEach(() => {
            gameState = new GameState();
            gameState.runtime.player = player;
        });

        it('should not detect collision when player is horizontally aligned but moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const upwardMovingPlayer = { ...player, x: 100, y: 420, vy: -5, radius: 3 };
            const prevPlayerFootY = 420;

            const result = collisionSystem.checkPlatformCollision(
                upwardMovingPlayer,
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should detect collision when player exactly touches platform edge', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const edgePlayer = { ...player, x: 90, y: 408, vy: 2, radius: 3 };
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkPlatformCollision(
                edgePlayer,
                platform,
                prevPlayerFootY
            );

            expect(result).toBeDefined();
            expect(result?.grounded).toBe(true);
        });

        it('should not detect collision when player is just outside platform horizontally', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            const outsidePlayer = { ...player, x: 86, y: 408, vy: 2, radius: 3 }; // 86 + 3 = 89 < 90
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkPlatformCollision(
                outsidePlayer,
                platform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should handle multiple platform collisions correctly', () => {
            const platforms: Platform[] = [
                { x1: 90, y1: 410, x2: 110, y2: 410 },
                { x1: 90, y1: 420, x2: 110, y2: 420 },
                { x1: 90, y1: 400, x2: 110, y2: 400 }
            ];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBeDefined();
            expect(result?.grounded).toBe(false);
            // No collision expected due to platform arrangement
        });
    });

    describe('spike collision precision', () => {
        it('should detect collision when player center is at spike edge', () => {
            const spike: Spike = { x: 100, y: 400, width: 10, height: 10 };
            const edgePlayer = { ...player, x: 105, y: 405, radius: 3 };

            const result = collisionSystem.checkSpikeCollision(edgePlayer, spike);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is just outside spike', () => {
            const spike: Spike = { x: 100, y: 400, width: 10, height: 10 };
            const outsidePlayer = { ...player, x: 90, y: 405, radius: 3 };

            const result = collisionSystem.checkSpikeCollision(outsidePlayer, spike);

            expect(result).toBe(false);
        });

        it('should handle empty spike array', () => {
            const emptySpikes: Spike[] = [];

            const result = collisionSystem.checkSpikeCollisions(player, emptySpikes);

            expect(result).toBe(false);
        });
    });

    describe('goal collision precision', () => {
        it('should detect collision when player center is at goal edge', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const edgePlayer = { ...player, x: 110, y: 410, radius: 3 };

            const result = collisionSystem.checkGoalCollision(edgePlayer, goal);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is just outside goal', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const outsidePlayer = { ...player, x: 90, y: 410, radius: 3 };

            const result = collisionSystem.checkGoalCollision(outsidePlayer, goal);

            expect(result).toBe(false);
        });

        it('should handle goal collision with different player radius', () => {
            const goal: Goal = { x: 100, y: 400, width: 20, height: 30 };
            const largePlayer = { ...player, x: 105, y: 405, radius: 10 };

            const result = collisionSystem.checkGoalCollision(largePlayer, goal);

            expect(result).toBe(true);
        });
    });

    describe('grounded state management', () => {
        beforeEach(() => {
            gameState = new GameState();
            gameState.runtime.player = player;
        });

        it('should always reset grounded to false first in handlePlatformCollisions', () => {
            // Arrange: Set player as grounded
            gameState.runtime.player.grounded = true;
            const platforms: Platform[] = []; // No platforms
            const prevPlayerFootY = 400;

            // Act
            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            // Assert: Should return grounded: false when no collisions
            expect(result).toEqual({ grounded: false });
        });

        it('should return first collision found when multiple platforms', () => {
            const platforms: Platform[] = [
                { x1: 90, y1: 420, x2: 110, y2: 420 }, // Lower platform (first in array)
                { x1: 90, y1: 410, x2: 110, y2: 410 } // Higher platform
            ];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.handlePlatformCollisions(platforms, prevPlayerFootY);

            expect(result).toBeDefined();
            expect(result?.grounded).toBe(false);
            // No collision expected due to platform arrangement
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
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkMovingPlatformCollision(
                gameState.runtime.player,
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
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkMovingPlatformCollision(
                gameState.runtime.player,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeDefined();
            expect(result?.platform).toBe(movingPlatform);
        });

        it('should handle multiple moving platforms', () => {
            const movingPlatforms: MovingPlatform[] = [
                movingPlatform,
                {
                    x1: 90,
                    y1: 420,
                    x2: 110,
                    y2: 420,
                    startX: 80,
                    endX: 120,
                    speed: 1.5,
                    direction: -1
                }
            ];
            const fallingPlayer = { ...player, y: 408, vy: 5 };
            gameState.runtime.player = fallingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.handleMovingPlatformCollisions(
                movingPlatforms,
                prevPlayerFootY
            );

            expect(result).toBeDefined();
            expect(result?.grounded).toBe(true);
            expect(result?.platform).toBeDefined();
        });

        it('should not collide when moving upward', () => {
            const jumpingPlayer = { ...player, y: 408, vy: -5 };
            gameState.runtime.player = jumpingPlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkMovingPlatformCollision(
                gameState.runtime.player,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });

        it('should not collide when outside horizontal bounds', () => {
            const outsidePlayer = { ...player, x: 150, y: 408, vy: 5 };
            gameState.runtime.player = outsidePlayer;
            const prevPlayerFootY = 405;

            const result = collisionSystem.checkMovingPlatformCollision(
                gameState.runtime.player,
                movingPlatform,
                prevPlayerFootY
            );

            expect(result).toBeNull();
        });
    });

    describe('prevPlayerY tracking', () => {
        it('should initialize prevPlayerY to 0', () => {
            // B/A pattern: Before - check initial state
            expect(collisionSystem.getPrevPlayerY()).toBe(0);
        });

        it('should update prevPlayerY when updatePrevPlayerY is called', () => {
            // B/A pattern: Before - set player position
            gameState.runtime.player.y = 250;

            // Action - update prevPlayerY
            collisionSystem.updatePrevPlayerY();

            // After - verify prevPlayerY was updated
            expect(collisionSystem.getPrevPlayerY()).toBe(250);
        });

        it('should track player Y position changes across multiple updates', () => {
            // B/A pattern: Before - initial position
            gameState.runtime.player.y = 100;
            collisionSystem.updatePrevPlayerY();
            expect(collisionSystem.getPrevPlayerY()).toBe(100);

            // Action - move player and update
            gameState.runtime.player.y = 200;
            collisionSystem.updatePrevPlayerY();

            // After - verify tracking
            expect(collisionSystem.getPrevPlayerY()).toBe(200);
        });

        it('should provide prevPlayerFootY for collision detection', () => {
            // B/A pattern: Before - set up player state
            gameState.runtime.player.y = 150;
            gameState.runtime.player.radius = 5;
            collisionSystem.updatePrevPlayerY();

            // After - verify calculated prevPlayerFootY
            const prevPlayerFootY =
                collisionSystem.getPrevPlayerY() + gameState.runtime.player.radius;
            expect(prevPlayerFootY).toBe(155);
        });
    });
});

import { beforeEach, describe, expect, it } from 'vitest';
import { GameState } from '../../../stores/GameState.js';
import { CollisionSystem } from '../../../systems/CollisionSystem.js';

/**
 * Refactoring validation tests for CollisionSystem decomposition
 * These tests verify that the decomposed collision handlers maintain
 * identical behavior to the original monolithic implementation.
 */
describe('CollisionSystem Refactoring Validation', () => {
    let collisionSystem: CollisionSystem;
    let gameState: GameState;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        gameState = new GameState();

        // Set up complete game stage data
        gameState.stage = {
            id: 1,
            name: 'Test Stage',
            startText: { x: 100, y: 50, text: 'Test Start' },
            goalText: { x: 700, y: 50, text: 'Test Goal' },
            platforms: [
                { x1: 90, y1: 410, x2: 110, y2: 410 },
                { x1: 200, y1: 300, x2: 250, y2: 300 }
            ],
            spikes: [{ x: 150, y: 395, width: 10, height: 10 }],
            movingPlatforms: [
                {
                    x1: 300,
                    y1: 200,
                    x2: 350,
                    y2: 200,
                    startX: 280,
                    endX: 400,
                    speed: 2,
                    direction: 1
                }
            ],
            goal: { x: 500, y: 100, width: 20, height: 20 }
        };

        gameState.runtime.player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        // Mock canvas for boundary collision calculations
        mockCanvas = {
            width: 800,
            height: 600
        } as HTMLCanvasElement;

        collisionSystem = new CollisionSystem(gameState, mockCanvas);
    });

    describe('Static Collision Handler Behavior', () => {
        it('should handle static platform landing correctly', () => {
            // Position player to fall onto static platform
            gameState.runtime.player.x = 100;
            gameState.runtime.player.y = 408;
            gameState.runtime.player.vy = 5;
            gameState.runtime.player.grounded = false;

            // Capture initial state
            const initialPlayer = { ...gameState.runtime.player };

            // Mock player system for jump timer reset
            const mockPlayerSystem = {
                resetJumpTimer: () => {}
            };

            // Execute collision update
            collisionSystem.update(mockPlayerSystem);

            // Verify platform collision results
            expect(gameState.runtime.player.y).toBe(407); // platform.y1 - radius
            expect(gameState.runtime.player.vy).toBe(0);
            expect(gameState.runtime.player.grounded).toBe(true);
            expect(gameState.runtime.player.x).toBe(initialPlayer.x); // No horizontal movement for static platforms
        });

        it('should detect spike collision and trigger death', () => {
            // Position player to overlap with spike
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 400;
            gameState.runtime.player.grounded = true;

            let deathCalled = false;
            const mockDeathHandler = () => {
                deathCalled = true;
            };

            // Execute collision update
            collisionSystem.update(undefined, undefined, mockDeathHandler);

            // Verify spike collision triggered death
            expect(deathCalled).toBe(true);
        });

        it('should detect goal collision and trigger goal handler', () => {
            // Position player to overlap with goal
            gameState.runtime.player.x = 510;
            gameState.runtime.player.y = 110;
            gameState.runtime.player.grounded = true;

            let goalReached = false;
            const mockGoalHandler = () => {
                goalReached = true;
            };

            // Execute collision update
            collisionSystem.update(undefined, undefined, undefined, mockGoalHandler);

            // Verify goal collision triggered handler
            expect(goalReached).toBe(true);
            expect(gameState.runtime.collisionResults.goalCollision).toBe(true);
        });

        it('should detect boundary collision correctly', () => {
            // Position player outside canvas boundaries
            gameState.runtime.player.y = 750; // Below canvas height + threshold

            // Execute collision update
            collisionSystem.update();

            // Verify boundary collision detected
            expect(gameState.runtime.collisionResults.boundaryCollision).toBe(true);
            expect(gameState.runtime.collisionResults.holeCollision).toBe(true);
        });
    });

    describe('Dynamic Collision Handler Behavior', () => {
        it('should handle moving platform collision with player movement', () => {
            // Position player above moving platform to trigger collision detection
            gameState.runtime.player.x = 325;
            gameState.runtime.player.y = 195; // Well above platform at y=200
            gameState.runtime.player.vy = 5;
            gameState.runtime.player.grounded = false;

            // Set proper previous position for collision detection
            // prevPlayerFootY needs to be <= platform.y1 (200)
            // Current: player.y=195, radius=3, so prevPlayerFootY = 195+3 = 198 <= 200 ✓
            collisionSystem.updatePrevPlayerY(); // Record current position as previous
            gameState.runtime.player.y = 202; // Move player below platform for collision
            // currentPlayerFootY = 202+3 = 205 >= 200 ✓

            const initialPlayerX = gameState.runtime.player.x;

            // Mock player system for jump timer reset
            const mockPlayerSystem = {
                resetJumpTimer: () => {}
            };

            // Execute collision update
            collisionSystem.update(mockPlayerSystem);

            // Verify moving platform collision results
            expect(gameState.runtime.player.y).toBe(197); // platform.y1 - radius (200 - 3)
            expect(gameState.runtime.player.vy).toBe(0);
            expect(gameState.runtime.player.grounded).toBe(true);
            // Player should move with platform (direction=1, speed=2)
            expect(gameState.runtime.player.x).toBe(initialPlayerX + 2);
        });

        it('should prioritize moving platform over static platform collision', () => {
            // Set up overlapping collision scenario
            // Add a static platform at same level as moving platform
            gameState.stage!.platforms.push({ x1: 320, y1: 200, x2: 340, y2: 200 });

            gameState.runtime.player.x = 325;
            gameState.runtime.player.y = 195; // Well above both platforms
            gameState.runtime.player.vy = 5;
            gameState.runtime.player.grounded = false;

            // Set proper previous position for collision detection
            // prevPlayerFootY needs to be <= platform.y1 (200)
            // Current: player.y=195, radius=3, so prevPlayerFootY = 195+3 = 198 <= 200 ✓
            collisionSystem.updatePrevPlayerY(); // Record current position as previous
            gameState.runtime.player.y = 202; // Move player below platforms for collision
            // currentPlayerFootY = 202+3 = 205 >= 200 ✓

            const initialPlayerX = gameState.runtime.player.x;

            const mockPlayerSystem = {
                resetJumpTimer: () => {}
            };

            // Execute collision update
            collisionSystem.update(mockPlayerSystem);

            // Verify moving platform takes priority (player moves with platform)
            expect(gameState.runtime.player.grounded).toBe(true);
            expect(gameState.runtime.player.y).toBe(197); // Collision detected
            expect(gameState.runtime.player.x).toBe(initialPlayerX + 2); // Moved with platform
        });
    });

    describe('Collision Result State Management', () => {
        it('should reset collision flags at start of each update', () => {
            // Set collision flags to true
            gameState.runtime.collisionResults.holeCollision = true;
            gameState.runtime.collisionResults.boundaryCollision = true;
            gameState.runtime.collisionResults.goalCollision = true;

            // Position player in safe area (no collisions)
            gameState.runtime.player.x = 50;
            gameState.runtime.player.y = 50;
            gameState.runtime.player.grounded = true;

            // Execute collision update
            collisionSystem.update();

            // Verify flags were reset correctly
            expect(gameState.runtime.collisionResults.holeCollision).toBe(false);
            expect(gameState.runtime.collisionResults.boundaryCollision).toBe(false);
            expect(gameState.runtime.collisionResults.goalCollision).toBe(false);
        });

        it('should handle grounded state reset when no platform collision occurs', () => {
            // Start with grounded player
            gameState.runtime.player.grounded = true;
            gameState.runtime.player.x = 50; // Away from all platforms
            gameState.runtime.player.y = 50;

            // Execute collision update
            collisionSystem.update();

            // Verify grounded state was reset
            expect(gameState.runtime.player.grounded).toBe(false);
        });
    });

    describe('Previous Player Position Tracking', () => {
        it('should update previous player Y position after collision processing', () => {
            const initialY = gameState.runtime.player.y;

            // Execute collision update
            collisionSystem.update();

            // Verify previous Y was updated to current Y
            expect(collisionSystem.getPrevPlayerY()).toBe(initialY);
        });
    });
});

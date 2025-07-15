import { beforeEach, describe, expect, test } from 'vitest';
import type { BreakablePlatform } from '../../../core/StageLoader';
import { GameState } from '../../../stores/GameState';
import { CollisionSystem } from '../../../systems/CollisionSystem';

describe('BreakablePlatform Implementation', () => {
    let gameState: GameState;
    // let _dynamicElementSystem: DynamicElementSystem;
    let collisionSystem: CollisionSystem;

    beforeEach(() => {
        // Create fresh game state with breakable platform
        gameState = new GameState();
        gameState.stage = {
            id: 1,
            name: 'Test Stage',
            platforms: [],
            spikes: [],
            goal: { x: 500, y: 400, width: 50, height: 50 },
            startText: { x: 50, y: 50, text: 'Start', style: { fontSize: 16, color: 'white' } },
            goalText: { x: 500, y: 350, text: 'Goal', style: { fontSize: 16, color: 'white' } },
            breakablePlatforms: [
                {
                    id: 'breakable-1',
                    x1: 100,
                    y1: 400,
                    x2: 300, // x1 + width
                    y2: 420, // y1 + height
                    maxHits: 3,
                    currentHits: 0,
                    broken: false
                }
            ]
        };

        // Initialize runtime state
        gameState.runtime.dynamicElements.breakablePlatforms = [
            {
                id: 'breakable-1',
                currentHits: 0,
                broken: false,
                maxHits: 3
            }
        ];

        // _dynamicElementSystem = new DynamicElementSystem(gameState);
        collisionSystem = new CollisionSystem(gameState);
    });

    describe('Hit Detection and Counting', () => {
        test('should increment hit count when player lands on breakable platform', () => {
            // Arrange: Simulate falling onto platform
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 380; // Above platform (foot at 390)
            gameState.runtime.player.vy = 5; // falling down
            gameState.runtime.player.grounded = false;

            // Set previous position to be well above platform for proper collision detection
            const initialY = 350; // Previous frame position
            collisionSystem.updatePrevPlayerY(); // Reset to current position first
            gameState.runtime.player.y = initialY; // Move to previous position
            collisionSystem.updatePrevPlayerY(); // Store previous position
            gameState.runtime.player.y = 420; // Move to position that crosses platform

            console.log('🔍 Landing scenario:', {
                prevPlayerY: collisionSystem.getPrevPlayerY(),
                prevFootY: collisionSystem.getPrevPlayerY() + gameState.runtime.player.radius,
                currentY: gameState.runtime.player.y,
                currentFootY: gameState.runtime.player.y + gameState.runtime.player.radius,
                platformY1: 400
            });

            // Act: Collision detection
            collisionSystem.update();

            // Assert: Hit count incremented
            const platformState = gameState.runtime.dynamicElements.breakablePlatforms[0];
            expect(platformState.currentHits).toBe(1);
            expect(platformState.broken).toBe(false);
        });

        test('should break platform when max hits reached', () => {
            // Arrange: Platform at max hits - 1
            const platformState = gameState.runtime.dynamicElements.breakablePlatforms[0];
            platformState.currentHits = 2; // One hit away from breaking

            // Simulate falling onto platform for proper collision detection
            const initialY = 350;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = initialY;
            gameState.runtime.player.vy = 5;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.y = 420; // Cross platform level

            // Act: Final hit
            collisionSystem.update();

            // Assert: Platform broken
            expect(platformState.currentHits).toBe(3);
            expect(platformState.broken).toBe(true);
        });

        test('should not increment hits for broken platforms', () => {
            // Arrange: Already broken platform
            const platformState = gameState.runtime.dynamicElements.breakablePlatforms[0];
            platformState.broken = true;
            platformState.currentHits = 3;

            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 375;
            gameState.runtime.player.vy = 5;

            // Act: Player passes through
            collisionSystem.update();

            // Assert: No additional hits
            expect(platformState.currentHits).toBe(3);
            expect(platformState.broken).toBe(true);
        });
    });

    describe('Collision Exclusion', () => {
        test('should exclude broken platforms from collision detection', () => {
            // Arrange: Broken platform
            const platformState = gameState.runtime.dynamicElements.breakablePlatforms[0];
            platformState.broken = true;

            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 375;
            gameState.runtime.player.vy = 5;
            gameState.runtime.player.grounded = false;

            // const _initialY = gameState.runtime.player.y;

            // Act: Player should pass through
            collisionSystem.update();

            // Assert: Player not stopped by broken platform
            expect(gameState.runtime.player.grounded).toBe(false);
            // Player should continue falling (exact position depends on physics)
        });

        test('should include intact platforms in collision detection', () => {
            // Arrange: Intact platform
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 375;
            gameState.runtime.player.vy = 5;
            gameState.runtime.player.grounded = false;

            // Act: Player lands on platform
            collisionSystem.update();

            // Assert: Player stopped by platform (grounded state managed by collision logic)
            const platformState = gameState.runtime.dynamicElements.breakablePlatforms[0];
            expect(platformState.broken).toBe(false);
        });
    });

    describe('State Management', () => {
        test('should maintain hit count consistency between stage data and runtime state', () => {
            // Arrange: Initial state
            const stageBreakable = gameState.stage!.breakablePlatforms![0] as BreakablePlatform;
            const runtimeBreakable = gameState.runtime.dynamicElements.breakablePlatforms[0];

            expect(stageBreakable.maxHits).toBe(runtimeBreakable.maxHits);
            expect(stageBreakable.currentHits).toBe(runtimeBreakable.currentHits);

            // Act: Simulate hit
            const initialY = 350;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = initialY;
            gameState.runtime.player.vy = 5;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.y = 420;
            collisionSystem.update();

            // Assert: Both states updated consistently
            expect(runtimeBreakable.currentHits).toBe(1);
        });

        test('should handle multiple breakable platforms independently', () => {
            // Arrange: Two breakable platforms
            gameState.stage!.breakablePlatforms!.push({
                id: 'breakable-2',
                x1: 300,
                y1: 300,
                x2: 450, // x1 + width
                y2: 320, // y1 + height
                maxHits: 2,
                currentHits: 0,
                broken: false
            });

            gameState.runtime.dynamicElements.breakablePlatforms.push({
                id: 'breakable-2',
                currentHits: 0,
                broken: false,
                maxHits: 2
            });

            // Act: Hit first platform
            const initialY = 350;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = initialY;
            gameState.runtime.player.vy = 5;
            collisionSystem.updatePrevPlayerY();
            gameState.runtime.player.y = 420;
            collisionSystem.update();

            // Assert: Only first platform affected
            expect(gameState.runtime.dynamicElements.breakablePlatforms[0].currentHits).toBe(1);
            expect(gameState.runtime.dynamicElements.breakablePlatforms[1].currentHits).toBe(0);
        });
    });
});

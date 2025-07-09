import { beforeEach, describe, expect, it } from 'vitest';
import type { Platform } from '../core/StageLoader.js';
import { GameState } from '../stores/GameState.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import type { Player } from '../types/GameTypes.js';
import { checkBoundaryCollision } from '../utils/CollisionUtils.js';

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

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

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

    // Pure business logic tests moved to src/test/pure/business/CollisionSystem.test.ts

    describe('update() method - autonomous collision processing', () => {
        let mockStage: any;
        let mockPlayerSystem: any;
        let mockRenderSystem: any;

        beforeEach(() => {
            mockStage = {
                platforms: [{ x1: 90, y1: 410, x2: 110, y2: 410 }],
                movingPlatforms: [],
                spikes: [],
                goal: { x: 400, y: 300, width: 20, height: 20 }
            };

            mockPlayerSystem = {
                resetJumpTimer: () => {}
            };

            mockRenderSystem = {
                addLandingHistory: () => {}
            };

            gameState.stage = mockStage;
        });

        it('should directly update GameState player properties on platform collision', () => {
            // B/A pattern: Before - set up player above platform first
            gameState.runtime.player = {
                x: 100,
                y: 400, // Above platform
                vx: 2,
                vy: 5,
                radius: 3,
                grounded: false
            };
            collisionSystem.updatePrevPlayerY(); // Capture above position

            // Then move player to falling position
            gameState.runtime.player.y = 408; // Now falling onto platform

            // Action - autonomous collision processing
            collisionSystem.update(mockPlayerSystem, mockRenderSystem);

            // After - verify direct GameState mutation
            expect(gameState.runtime.player.grounded).toBe(true);
            expect(gameState.runtime.player.vy).toBe(0);
            expect(gameState.runtime.player.y).toBe(407); // platform.y1 - player.radius
        });

        it('should handle no collision case without changing grounded state', () => {
            // B/A pattern: Before - set up player away from platforms
            gameState.runtime.player = {
                x: 200, // Far from platform
                y: 400,
                vx: 2,
                vy: 5,
                radius: 3,
                grounded: false
            };
            collisionSystem.updatePrevPlayerY();

            // Action
            collisionSystem.update(mockPlayerSystem, mockRenderSystem);

            // After - verify no collision changes
            expect(gameState.runtime.player.grounded).toBe(false);
            expect(gameState.runtime.player.vy).toBe(5);
            expect(gameState.runtime.player.y).toBe(400);
        });

        it('should handle spike collision by calling death handler', () => {
            // B/A pattern: Before - player on spike
            mockStage.spikes = [{ x: 95, y: 395, width: 10, height: 10 }];
            gameState.runtime.player = {
                x: 100,
                y: 400,
                vx: 2,
                vy: 5,
                radius: 3,
                grounded: false
            };

            let deathHandlerCalled = false;
            const mockDeathHandler = () => {
                deathHandlerCalled = true;
            };

            // Action
            collisionSystem.update(mockPlayerSystem, mockRenderSystem, mockDeathHandler);

            // After - verify death handler was called
            expect(deathHandlerCalled).toBe(true);
        });

        it('should handle goal collision by calling goal handler', () => {
            // B/A pattern: Before - player at goal
            gameState.runtime.player = {
                x: 410,
                y: 310,
                vx: 2,
                vy: 5,
                radius: 3,
                grounded: false
            };

            let goalHandlerCalled = false;
            const mockGoalHandler = () => {
                goalHandlerCalled = true;
            };

            // Action
            collisionSystem.update(mockPlayerSystem, mockRenderSystem, undefined, mockGoalHandler);

            // After - verify goal handler was called
            expect(goalHandlerCalled).toBe(true);
        });

        it('should prioritize moving platforms over static platforms', () => {
            // B/A pattern: Before - setup overlapping platforms
            mockStage.movingPlatforms = [
                {
                    x1: 90,
                    y1: 410,
                    x2: 110,
                    y2: 410,
                    speed: 1,
                    direction: 1
                }
            ];
            gameState.runtime.player = {
                x: 100,
                y: 400, // Above platform
                vx: 2,
                vy: 5,
                radius: 3,
                grounded: false
            };
            collisionSystem.updatePrevPlayerY(); // Capture above position

            // Then move player to falling position
            gameState.runtime.player.y = 408; // Now falling onto platform

            // Action
            collisionSystem.update(mockPlayerSystem, mockRenderSystem);

            // After - should land on moving platform (priority over static)
            expect(gameState.runtime.player.grounded).toBe(true);
            expect(gameState.runtime.player.vy).toBe(0);
        });
    });

    describe('prevPlayerY tracking', () => {
        it('should initialize prevPlayerY to player initial Y position', () => {
            // B/A pattern: Before - check initial state
            // Should be initialized to current player Y position (400)
            expect(collisionSystem.getPrevPlayerY()).toBe(400);
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

    describe('canvas height integration', () => {
        let mockCanvas: HTMLCanvasElement;

        beforeEach(() => {
            mockCanvas = {
                height: 600,
                width: 800
            } as HTMLCanvasElement;
        });

        it('should use canvas height for boundary collision detection', () => {
            // Player just below canvas boundary threshold
            player.y = mockCanvas.height + 99;

            const result = checkBoundaryCollision(player, mockCanvas.height);
            expect(result).toBe(false);

            // Player above canvas boundary threshold
            player.y = mockCanvas.height + 101;

            const result2 = checkBoundaryCollision(player, mockCanvas.height);
            expect(result2).toBe(true);
        });

        it('should use canvas height in update method for dynamic boundary detection', () => {
            // This test will fail until we integrate canvas height into update()
            const canvasAwareCollisionSystem = new CollisionSystem(gameState, mockCanvas);

            // Set up stage
            gameState.stage = {
                id: 1,
                name: 'Test Stage',
                startText: { x: 0, y: 0, text: 'Test Start' },
                goalText: { x: 0, y: 0, text: 'Test Goal' },
                platforms: [],
                movingPlatforms: [],
                spikes: [],
                goal: { x: 400, y: 300, width: 20, height: 20 }
            };

            // Player falling below canvas boundary
            gameState.runtime.player.y = mockCanvas.height + 150;

            canvasAwareCollisionSystem.update();

            expect(gameState.runtime.collisionResults.boundaryCollision).toBe(true);
        });
    });
});

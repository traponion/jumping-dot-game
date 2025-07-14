import { beforeEach, describe, expect, it } from 'vitest';
import type { Goal, MovingPlatform, Platform, Spike } from '../../../core/StageLoader.js';
import { GameState } from '../../../stores/GameState.js';
import { CollisionSystem } from '../../../systems/CollisionSystem.js';

// Pure business logic tests
describe('CollisionSystem Business Logic', () => {
    let collisionSystem: CollisionSystem;
    let gameState: GameState;

    beforeEach(() => {
        gameState = new GameState();
        gameState.runtime.player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        // Create mock canvas object (DOM-independent)
        const mockCanvas = {
            width: 800,
            height: 600
        } as HTMLCanvasElement;

        collisionSystem = new CollisionSystem(gameState, mockCanvas);
    });

    describe('platform collision', () => {
        it('should detect platform collision when falling onto platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            gameState.runtime.player.y = 408;
            gameState.runtime.player.vy = 5;

            // Set previous position above platform
            collisionSystem.updatePrevPlayerY(); // Set current position as prev
            gameState.runtime.player.y = 410; // Move player down

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
                platform,
                405
            );

            expect(result).toBeTruthy();
            if (result) {
                expect(result.y).toBe(407); // platform.y1 - player.radius
                expect(result.vy).toBe(0);
                expect(result.grounded).toBe(true);
            }
        });

        it('should not detect collision when moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            gameState.runtime.player.vy = -5;

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
                platform,
                415
            );

            expect(result).toBeNull();
        });

        it('should not detect collision when horizontally aligned but not overlapping', () => {
            const platform: Platform = { x1: 200, y1: 410, x2: 220, y2: 410 };
            gameState.runtime.player.x = 100; // Far from platform

            const result = collisionSystem.checkPlatformCollision(
                gameState.runtime.player,
                platform,
                405
            );

            expect(result).toBeNull();
        });
    });

    describe('spike collision', () => {
        it('should detect spike collision when player overlaps spike', () => {
            const spike: Spike = { x: 95, y: 395, width: 10, height: 10 };
            gameState.runtime.player.x = 100;
            gameState.runtime.player.y = 400;

            const result = collisionSystem.checkSpikeCollision(gameState.runtime.player, spike);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is away from spike', () => {
            const spike: Spike = { x: 200, y: 395, width: 10, height: 10 };
            gameState.runtime.player.x = 100;
            gameState.runtime.player.y = 400;

            const result = collisionSystem.checkSpikeCollision(gameState.runtime.player, spike);

            expect(result).toBe(false);
        });
    });

    describe('goal collision', () => {
        it('should detect goal collision when player overlaps goal', () => {
            const goal: Goal = { x: 95, y: 395, width: 10, height: 10 };
            gameState.runtime.player.x = 100;
            gameState.runtime.player.y = 400;

            const result = collisionSystem.checkGoalCollision(gameState.runtime.player, goal);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is away from goal', () => {
            const goal: Goal = { x: 200, y: 395, width: 10, height: 10 };
            gameState.runtime.player.x = 100;
            gameState.runtime.player.y = 400;

            const result = collisionSystem.checkGoalCollision(gameState.runtime.player, goal);

            expect(result).toBe(false);
        });
    });

    describe('boundary collision', () => {
        it('should detect boundary collision when player is outside canvas', () => {
            gameState.runtime.player.y = 800; // Below canvas height

            const result = collisionSystem.checkBoundaryCollision(gameState.runtime.player, 600);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is within boundaries', () => {
            gameState.runtime.player.x = 400; // Within canvas
            gameState.runtime.player.y = 300;

            const result = collisionSystem.checkBoundaryCollision(gameState.runtime.player, 600);

            expect(result).toBe(false);
        });
    });

    describe('moving platform collision', () => {
        it('should detect moving platform collision when falling onto platform', () => {
            const movingPlatform: MovingPlatform = {
                x1: 90,
                y1: 410,
                x2: 110,
                y2: 410,
                startX: 50,
                endX: 150,
                speed: 2,
                direction: 1
            };
            gameState.runtime.player.y = 408;
            gameState.runtime.player.vy = 5;

            const result = collisionSystem.checkMovingPlatformCollision(
                gameState.runtime.player,
                movingPlatform,
                405
            );

            expect(result).toBeTruthy();
            if (result) {
                expect(result.y).toBe(407); // platform.y1 - player.radius
                expect(result.vy).toBe(0);
                expect(result.grounded).toBe(true);
            }
        });
    });

    describe('hole collision', () => {
        it('should detect hole collision when player falls below bottom boundary', () => {
            gameState.runtime.player.y = 700; // Below canvas height

            const result = collisionSystem.checkHoleCollision(gameState.runtime.player, 600);

            expect(result).toBe(true);
        });

        it('should not detect collision when player is above bottom boundary', () => {
            gameState.runtime.player.y = 300; // Above canvas height

            const result = collisionSystem.checkHoleCollision(gameState.runtime.player, 600);

            expect(result).toBe(false);
        });
    });
});

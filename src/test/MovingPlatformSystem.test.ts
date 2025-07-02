import { beforeEach, describe, expect, it } from 'vitest';
import type { MovingPlatform } from '../core/StageLoader';
import type { GameState } from '../stores/GameState';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem';

describe('MovingPlatformSystem', () => {
    let movingPlatformSystem: MovingPlatformSystem;
    let gameState: GameState;
    let mockMovingPlatforms: MovingPlatform[];

    beforeEach(() => {
        mockMovingPlatforms = [
            {
                x1: 350,
                y1: 450,
                x2: 450,
                y2: 450,
                startX: 350,
                endX: 450,
                speed: 1,
                direction: 1
            },
            {
                x1: 800,
                y1: 430,
                x2: 900,
                y2: 430,
                startX: 750,
                endX: 850,
                speed: 1.5,
                direction: -1
            }
        ];

        gameState = {
            gameRunning: false,
            gameOver: false,
            currentStage: 1,
            timeLimit: 10,
            timeRemaining: 10,
            finalScore: 0,
            gameStartTime: null,
            runtime: {
                player: { x: 100, y: 400, vx: 0, vy: 0, radius: 10, grounded: false },
                camera: { x: 0, y: 0 },
                particles: [],
                trail: [],
                deathMarks: [],
                collisionResults: {
                    holeCollision: false,
                    boundaryCollision: false,
                    goalCollision: false
                },
                shouldStartClearAnimation: false,
                shouldStartDeathAnimation: false,
                isInitialized: false,
                lastUpdateTime: 0
            },
            stage: {
                id: 1,
                platforms: [],
                movingPlatforms: [...mockMovingPlatforms],
                holes: [],
                goal: { x1: 900, y1: 400, x2: 950, y2: 450 },
                timeLimit: 10
            }
        };

        movingPlatformSystem = new MovingPlatformSystem(gameState);
    });

    describe('update', () => {
        it('should directly mutate platforms in GameState', () => {
            const deltaTime = 16.67;
            const originalX1 = gameState.stage?.movingPlatforms?.[0].x1;

            movingPlatformSystem.update(deltaTime);

            // Platform should be mutated directly
            const expectedMovement =
                mockMovingPlatforms[0].speed *
                mockMovingPlatforms[0].direction *
                (deltaTime / 16.67);
            expect(gameState.stage?.movingPlatforms?.[0].x1).toBeCloseTo(
                originalX1 + expectedMovement,
                2
            );
        });

        it('should move platforms according to speed and direction', () => {
            const deltaTime = 16.67;
            const initialX1_platform1 = gameState.stage?.movingPlatforms?.[0].x1;

            movingPlatformSystem.update(deltaTime);

            // Platform 1 moves right (direction: 1)
            const expectedMovement1 =
                mockMovingPlatforms[0].speed *
                mockMovingPlatforms[0].direction *
                (deltaTime / 16.67);
            expect(gameState.stage?.movingPlatforms?.[0].x1).toBeCloseTo(
                initialX1_platform1 + expectedMovement1,
                2
            );
        });

        it('should reverse direction when platform reaches endX', () => {
            const deltaTime = 16.67;
            // Set platform close to endX
            gameState.stage?.movingPlatforms?.[0].x1 = 449.5;
            gameState.stage?.movingPlatforms?.[0].x2 = 549.5;
            gameState.stage?.movingPlatforms?.[0].direction = 1;

            movingPlatformSystem.update(deltaTime);

            // Direction should be reversed
            expect(gameState.stage?.movingPlatforms?.[0].direction).toBe(-1);
        });

        it('should reverse direction when platform reaches startX', () => {
            const deltaTime = 16.67;
            // Set platform close to startX
            gameState.stage?.movingPlatforms?.[0].x1 = 350.5;
            gameState.stage?.movingPlatforms?.[0].x2 = 450.5;
            gameState.stage?.movingPlatforms?.[0].direction = -1;

            movingPlatformSystem.update(deltaTime);

            // Direction should be reversed
            expect(gameState.stage?.movingPlatforms?.[0].direction).toBe(1);
        });

        it('should maintain platform width during movement', () => {
            const deltaTime = 16.67;
            const originalWidth1 =
                gameState.stage?.movingPlatforms?.[0].x2 - gameState.stage?.movingPlatforms?.[0].x1;

            movingPlatformSystem.update(deltaTime);

            const newWidth1 =
                gameState.stage?.movingPlatforms?.[0].x2 - gameState.stage?.movingPlatforms?.[0].x1;

            expect(newWidth1).toBeCloseTo(originalWidth1, 5);
        });

        it('should handle missing stage gracefully', () => {
            gameState.stage = null;

            expect(() => {
                movingPlatformSystem.update(16.67);
            }).not.toThrow();
        });
    });
});

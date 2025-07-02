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
            hasMovedOnce: false,
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
                name: 'Test Stage',
                platforms: [],
                movingPlatforms: [...mockMovingPlatforms],
                holes: [],
                spikes: [],
                goal: { x: 900, y: 400, width: 50, height: 50 },
                startText: { x: 0, y: 0, text: 'Start' },
                goalText: { x: 900, y: 400, text: 'Goal' },
                timeLimit: 10
            },
            performance: {
                frameRate: 0,
                renderTime: 0,
                lastOperation: '',
                operationTime: 0
            },
            reset: () => {}
        };

        movingPlatformSystem = new MovingPlatformSystem(gameState);
    });

    describe('update', () => {
        it('should directly mutate platforms in GameState', () => {
            const deltaTime = 16.67;
            const movingPlatforms = gameState.stage?.movingPlatforms;
            expect(movingPlatforms).toBeDefined();
            const platform = movingPlatforms?.[0];
            expect(platform).toBeDefined();
            const originalX1 = platform!.x1;

            movingPlatformSystem.update(deltaTime);

            // Platform should be mutated directly
            const expectedMovement =
                mockMovingPlatforms[0].speed *
                mockMovingPlatforms[0].direction *
                (deltaTime / 16.67);
            expect(platform?.x1).toBeCloseTo(originalX1 + expectedMovement, 2);
        });

        it('should move platforms according to speed and direction', () => {
            const deltaTime = 16.67;
            const movingPlatforms = gameState.stage?.movingPlatforms;
            expect(movingPlatforms).toBeDefined();
            const platform = movingPlatforms?.[0];
            expect(platform).toBeDefined();
            const initialX1_platform1 = platform!.x1;

            movingPlatformSystem.update(deltaTime);

            // Platform 1 moves right (direction: 1)
            const expectedMovement1 =
                mockMovingPlatforms[0].speed *
                mockMovingPlatforms[0].direction *
                (deltaTime / 16.67);
            expect(platform?.x1).toBeCloseTo(initialX1_platform1 + expectedMovement1, 2);
        });

        it('should reverse direction when platform reaches endX', () => {
            const deltaTime = 16.67;
            const movingPlatforms = gameState.stage?.movingPlatforms;
            expect(movingPlatforms).toBeDefined();
            const platform = movingPlatforms?.[0];
            expect(platform).toBeDefined();

            // Set platform close to endX
            platform!.x1 = 449.5;
            platform!.x2 = 549.5;
            platform!.direction = 1;

            movingPlatformSystem.update(deltaTime);

            // Direction should be reversed
            expect(platform?.direction).toBe(-1);
        });

        it('should reverse direction when platform reaches startX', () => {
            const deltaTime = 16.67;
            const movingPlatforms = gameState.stage?.movingPlatforms;
            expect(movingPlatforms).toBeDefined();
            const platform = movingPlatforms?.[0];
            expect(platform).toBeDefined();

            // Set platform close to startX
            platform!.x1 = 350.5;
            platform!.x2 = 450.5;
            platform!.direction = -1;

            movingPlatformSystem.update(deltaTime);

            // Direction should be reversed
            expect(platform?.direction).toBe(1);
        });

        it('should maintain platform width during movement', () => {
            const deltaTime = 16.67;
            const movingPlatforms = gameState.stage?.movingPlatforms;
            expect(movingPlatforms).toBeDefined();
            const platform = movingPlatforms?.[0];
            expect(platform).toBeDefined();
            const originalWidth1 = platform!.x2 - platform!.x1;

            movingPlatformSystem.update(deltaTime);

            const newWidth1 = platform!.x2 - platform!.x1;

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

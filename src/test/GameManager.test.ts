import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../core/GameManager.js';
import { GameState } from '../stores/GameState.js';
// getGameStore import removed - using direct GameState instances

// Mock all dependencies
vi.mock('../systems/CollisionSystem');
vi.mock('../systems/AnimationSystem');
vi.mock('../systems/PlayerSystem');
vi.mock('../systems/PhysicsSystem');
vi.mock('../systems/InputManager');
vi.mock('../core/StageLoader');

// Mock RenderSystemFactory to return a mock render system
vi.mock('../systems/RenderSystemFactory', () => ({
    createGameRenderSystem: vi.fn(() => ({
        addLandingHistory: vi.fn(),
        setLandingPredictions: vi.fn(),
        render: vi.fn(),
        cleanup: vi.fn()
    }))
}));

describe('GameManager', () => {
    let gameManager: GameManager;
    let gameState: GameState;
    let mockCollisionSystem: unknown;
    let mockAnimationSystem: unknown;
    let mockPlayerSystem: unknown;
    let mockPhysicsSystem: unknown;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        // Create canvas, GameState, and GameManager
        canvas = document.createElement('canvas');
        gameState = new GameState();
        gameManager = new GameManager(
            canvas,
            {
                startGame: vi.fn(),
                init: vi.fn(),
                returnToStageSelect: vi.fn(),
                handleGameOverNavigation: vi.fn(),
                handleGameOverSelection: vi.fn(),
                getGameState: vi.fn().mockReturnValue(gameState),
                getGameUI: vi.fn()
            },
            gameState
        );

        // Get mock instances
        mockCollisionSystem = (gameManager as any).collisionSystem;
        mockAnimationSystem = (gameManager as any).animationSystem;
        mockPlayerSystem = (gameManager as any).playerSystem;
        mockPhysicsSystem = (gameManager as any).physicsSystem;

        // Setup InputManager mock
        const mockInputManager = (gameManager as any).inputManager;
        (mockInputManager as any).getMovementState = vi.fn().mockReturnValue({
            ArrowLeft: false,
            ArrowRight: false
        });

        // Setup basic mocks
        (mockCollisionSystem as any).checkSpikeCollisions = vi.fn().mockReturnValue(false);
        (mockCollisionSystem as any).checkGoalCollision = vi.fn().mockReturnValue(false);
        (mockCollisionSystem as any).checkHoleCollision = vi.fn().mockReturnValue(false);
        (mockCollisionSystem as any).checkBoundaryCollision = vi.fn().mockReturnValue(false);
        (mockCollisionSystem as any).handlePlatformCollisions = vi.fn().mockReturnValue(null);
        // Add default mock for CollisionSystem.update (new API)
        (mockCollisionSystem as any).update = vi.fn();

        (mockPlayerSystem as any).resetJumpTimer = vi.fn();
        (mockPlayerSystem as any).update = vi.fn();
        (mockPlayerSystem as any).clearTrail = vi.fn();
        (mockPhysicsSystem as any).update = vi.fn();
        (mockPhysicsSystem as any).getPhysicsConstants = vi.fn().mockReturnValue({
            gravity: 0.5,
            jumpForce: -10,
            autoJumpInterval: 10,
            moveSpeed: 5,
            gameSpeed: 1
        });
        (mockAnimationSystem as any).update = vi.fn();
        (mockAnimationSystem as any).updateClearAnimation = vi.fn();
        (mockAnimationSystem as any).updateDeathAnimation = vi.fn();
        (mockAnimationSystem as any).addDeathMark = vi.fn();
        (mockAnimationSystem as any).startDeathAnimation = vi.fn();
        (mockAnimationSystem as any).startClearAnimation = vi.fn();

        // Reset store
        // Note: gameState is created fresh in GameManager constructor
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('update method conditions', () => {
        it('should not call updateSystems when game is not running', () => {
            // Arrange: Game is stopped
            gameState.gameRunning = false;
            const updateSystemsSpy = vi.spyOn(
                gameManager as unknown as { updateSystems: () => void },
                'updateSystems'
            );

            // Act
            gameManager.update(16.67);

            // Assert
            expect(updateSystemsSpy).not.toHaveBeenCalled();
        });

        it('should not call updateSystems when game is over', () => {
            // Arrange: Game is over
            gameState.gameRunning = true;
            gameState.gameOver = true;
            const updateSystemsSpy = vi.spyOn(
                gameManager as unknown as { updateSystems: () => void },
                'updateSystems'
            );

            // Act
            gameManager.update(16.67);

            // Assert
            expect(updateSystemsSpy).not.toHaveBeenCalled();
        });

        it('should call updateSystems when game is running and not over', () => {
            // Arrange: Game is running
            gameState.gameRunning = true;
            const updateSystemsSpy = vi.spyOn(
                gameManager as unknown as { updateSystems: () => void },
                'updateSystems'
            );

            // Act
            gameManager.update(16.67);

            // Assert
            expect(updateSystemsSpy).toHaveBeenCalledWith(16.67);
        });
    });

    describe('collision system integration', () => {
        it('should integrate with CollisionSystem for collision handling', () => {
            // Arrange: Set up game state
            gameState.gameRunning = true;
            gameState.gameOver = false;

            // Act: Update game (which calls CollisionSystem.update())
            gameManager.update(16.67);

            // Assert: CollisionSystem should be working (no errors thrown)
            expect(gameState.gameRunning).toBe(true);
        });
    });

    describe('game rule integration', () => {
        beforeEach(() => {
            gameState.gameRunning = true;
        });

        it('should integrate with GameRuleSystem for boundary checking', () => {
            // Arrange: Set up game state
            gameState.gameOver = false;

            // Act: Update game (which calls GameRuleSystem.update())
            gameManager.update(16.67);

            // Assert: GameRuleSystem should be working (no errors thrown)
            expect(gameState.gameRunning).toBe(true);
        });
    });

    describe('loadStage method', () => {
        it('should load stage and set time limit', async () => {
            // Arrange
            const mockStage = {
                id: 1,
                name: 'Test Stage',
                timeLimit: 15,
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            };
            const mockStageLoader = (gameManager as unknown as Record<string, unknown>).stageLoader;
            (mockStageLoader as any).loadStageWithFallback = vi.fn().mockResolvedValue(mockStage);

            // Act
            await gameManager.loadStage(1);

            // Assert
            expect(gameState.timeLimit).toBe(15);
            expect(gameState.timeRemaining).toBe(15);
        });

        it('should use default time limit when stage has no timeLimit', async () => {
            // Arrange
            const mockStage = {
                id: 1,
                name: 'Test Stage',
                // No timeLimit property
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            };
            const mockStageLoader = (gameManager as unknown as Record<string, unknown>).stageLoader;
            (mockStageLoader as any).loadStageWithFallback = vi.fn().mockResolvedValue(mockStage);
            const defaultTimeLimit = gameState.timeLimit;

            // Act
            await gameManager.loadStage(1);

            // Assert
            expect(gameState.timeLimit).toBe(defaultTimeLimit);
        });
    });

    describe('updateSystems method', () => {
        beforeEach(() => {
            gameState.gameRunning = true;
            (gameManager as unknown as Record<string, unknown>).stage = {
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 }
            };
        });

        it('should update all systems in correct order', () => {
            // Arrange
            const updateSystemsSpy = vi.spyOn(
                gameManager as unknown as { updateSystems: () => void },
                'updateSystems'
            );

            // Act
            gameManager.update(16.67);

            // Assert
            expect(updateSystemsSpy).toHaveBeenCalledWith(16.67);
            expect((mockPhysicsSystem as any).update).toHaveBeenCalledWith(16.67);
            expect((mockAnimationSystem as any).updateClearAnimation).toHaveBeenCalled();
            expect((mockAnimationSystem as any).updateDeathAnimation).toHaveBeenCalled();
        });
    });

    describe('resetGameState method', () => {
        it('should reset moving platforms to their initial positions on game restart', async () => {
            // Arrange: Load a stage with moving platforms
            const mockStage = {
                id: 2,
                name: 'Test Stage with Moving Platforms',
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                movingPlatforms: [
                    {
                        x1: 200,
                        x2: 250,
                        y1: 400,
                        y2: 400,
                        startX: 200,
                        endX: 300,
                        speed: 2,
                        direction: 1
                    },
                    {
                        x1: 500,
                        x2: 550,
                        y1: 350,
                        y2: 350,
                        startX: 500,
                        endX: 600,
                        speed: 1.5,
                        direction: -1
                    }
                ]
            };
            const mockStageLoader = (gameManager as unknown as Record<string, unknown>).stageLoader;
            // Return a deep copy each time to avoid reference sharing
            (mockStageLoader as any).loadStageWithFallback = vi
                .fn()
                .mockImplementation(() => Promise.resolve(JSON.parse(JSON.stringify(mockStage))));

            await gameManager.loadStage(2);
            gameManager.startGame();

            // Store initial platform positions
            const initialPlatforms = JSON.parse(
                JSON.stringify(gameManager.getCurrentStage()?.movingPlatforms)
            );

            // Act: Simulate time progression to move platforms
            for (let i = 0; i < 10; i++) {
                gameManager.update(16.67);
            }

            // Verify platforms have moved from initial positions
            const movedPlatforms = gameManager.getCurrentStage()?.movingPlatforms;
            expect(movedPlatforms?.[0].x1).not.toBe(initialPlatforms[0].x1);

            // Act: Reset game state
            await gameManager.resetGameState();

            // Assert: Platforms should be back to initial positions
            const resetPlatforms = gameManager.getCurrentStage()?.movingPlatforms;
            expect(resetPlatforms).toEqual(initialPlatforms);
        });
    });
    describe('edge cases and error handling', () => {
        it('should handle missing stage gracefully', () => {
            // Arrange
            (gameManager as unknown as Record<string, unknown>).stage = null;
            gameState.gameRunning = true;

            // Act & Assert - should not throw
            expect(() => gameManager.update(16.67)).not.toThrow();
        });

        it('should handle zero delta time', () => {
            // Arrange
            gameState.gameRunning = true;
            (gameManager as unknown as Record<string, unknown>).stage = {
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 }
            };

            // Act & Assert - should not throw
            expect(() => gameManager.update(0)).not.toThrow();
        });

        it('should handle negative delta time', () => {
            // Arrange
            gameState.gameRunning = true;
            (gameManager as unknown as Record<string, unknown>).stage = {
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 }
            };

            // Act & Assert - should not throw
            expect(() => gameManager.update(-5)).not.toThrow();
        });
    });
});

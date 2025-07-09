import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../core/GameManager.js';
import { GameState } from '../stores/GameState.js';
// getGameStore import removed - using direct GameState instances

describe('GameManager timeLimit integration', () => {
    let gameManager: GameManager;
    let gameState: GameState;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset store to clean state
        // Note: gameState is created fresh in GameManager constructor

        // Create mock canvas (CI-safe approach)
        canvas = {
            width: 800,
            height: 600,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            getContext: vi.fn(() => ({
                clearRect: vi.fn(),
                fillRect: vi.fn()
            }))
        } as unknown as HTMLCanvasElement;

        // Create GameManager
        const mockGameController = {
            startGame: vi.fn(),
            init: vi.fn(),
            returnToStageSelect: vi.fn(),
            handleGameOverNavigation: vi.fn(),
            handleGameOverSelection: vi.fn(),
            getGameState: vi
                .fn()
                .mockReturnValue({ gameRunning: false, gameOver: false, finalScore: 0 }),
            getGameUI: vi.fn()
        };
        gameState = new GameState();
        gameManager = new GameManager(canvas, mockGameController, gameState);
    });

    describe('when loading stage with timeLimit', () => {
        it('should set timeLimit in store when stage has timeLimit', async () => {
            // Mock stage data with timeLimit
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                timeLimit: 10,
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            // Mock the stage loader
            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'loadStageWithFallback'
            ).mockResolvedValue(mockStageData);

            // Act: Load stage
            await gameManager.loadStage(1);

            // Assert: timeLimit should be set in gameState
            expect(gameState.timeRemaining).toBe(10);
            expect(gameState.timeLimit).toBe(10);
        });

        it('should set different timeLimit for different stages', async () => {
            // Mock stage 2 data with different timeLimit
            const mockStage2Data = {
                id: 2,
                name: 'Stage 2',
                timeLimit: 45,
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 2' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'loadStageWithFallback'
            ).mockResolvedValue(mockStage2Data);

            // Act: Load stage 2
            await gameManager.loadStage(2);

            // Assert: Different timeLimit should be set
            expect(gameState.timeRemaining).toBe(45);
            expect(gameState.timeLimit).toBe(45);
        });

        it('should use default timeLimit when stage has no timeLimit', async () => {
            // Mock stage data WITHOUT timeLimit
            const mockStageWithoutTimeLimit = {
                id: 3,
                name: 'Stage 3',
                // No timeLimit field
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 3' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'loadStageWithFallback'
            ).mockResolvedValue(mockStageWithoutTimeLimit);

            // Act: Load stage
            await gameManager.loadStage(3);

            // Assert: Should use default timeLimit (20 seconds from initial GameState)
            expect(gameState.timeRemaining).toBe(20);
            expect(gameState.timeLimit).toBe(20);
        });

        it('should handle fallback to hardcoded stage with timeLimit', async () => {
            // Mock stage loader to throw error, triggering fallback
            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'loadStageWithFallback'
            ).mockRejectedValue(new Error('Network error'));

            // Mock getHardcodedStage to return stage with timeLimit
            const hardcodedStageWithTimeLimit = {
                id: 1,
                name: 'Hardcoded Stage 1',
                timeLimit: 10,
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'getHardcodedStage'
            ).mockReturnValue(hardcodedStageWithTimeLimit);

            // Act: Load stage (will fallback to hardcoded)
            await gameManager.loadStage(1);

            // Assert: Should use hardcoded stage's timeLimit
            expect(gameState.timeRemaining).toBe(10);
            expect(gameState.timeLimit).toBe(10);
        });
    });

    describe('when resetting game state', () => {
        it('should preserve current timeLimit when resetting', async () => {
            // Setup: Load stage with specific timeLimit
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                timeLimit: 15,
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.spyOn(
                (gameManager as any).initialization.getStageLoader(),
                'loadStageWithFallback'
            ).mockResolvedValue(mockStageData);

            await gameManager.loadStage(1);

            // Simulate game running and time decreasing
            gameState.timeRemaining = 5;
            expect(gameState.timeRemaining).toBe(5);

            // Act: Reset game state
            await gameManager.resetGameState();

            // Assert: timeRemaining should be reset to timeLimit
            expect(gameState.timeRemaining).toBe(15);
            expect(gameState.timeLimit).toBe(15);
        });
    });
});

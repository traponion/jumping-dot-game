import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../core/GameManager.js';
import { getGameStore } from '../stores/GameZustandStore.js';

describe('GameManager timeLimit integration', () => {
    let gameManager: GameManager;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset store to clean state
        getGameStore().reset();

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Create GameManager
        const mockGameController = {
            startGame: vi.fn(),
            init: vi.fn(),
            returnToStageSelect: vi.fn(),
            handleGameOverNavigation: vi.fn(),
            handleGameOverSelection: vi.fn(),
            getGameState: vi
                .fn()
                .mockReturnValue({ gameRunning: false, gameOver: false, finalScore: 0 })
        };
        gameManager = new GameManager(canvas, mockGameController);
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
            vi.spyOn((gameManager as any).stageLoader, 'loadStageWithFallback').mockResolvedValue(
                mockStageData
            );

            // Act: Load stage
            await gameManager.loadStage(1);

            // Assert: timeLimit should be set in store
            expect(getGameStore().getTimeRemaining()).toBe(10);
            expect(getGameStore().game.timeLimit).toBe(10);
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

            vi.spyOn((gameManager as any).stageLoader, 'loadStageWithFallback').mockResolvedValue(
                mockStage2Data
            );

            // Act: Load stage 2
            await gameManager.loadStage(2);

            // Assert: Different timeLimit should be set
            expect(getGameStore().getTimeRemaining()).toBe(45);
            expect(getGameStore().game.timeLimit).toBe(45);
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

            vi.spyOn((gameManager as any).stageLoader, 'loadStageWithFallback').mockResolvedValue(
                mockStageWithoutTimeLimit
            );

            // Act: Load stage
            await gameManager.loadStage(3);

            // Assert: Should use default timeLimit (20 seconds from initial store state)
            expect(getGameStore().getTimeRemaining()).toBe(20);
            expect(getGameStore().game.timeLimit).toBe(20);
        });

        it('should handle fallback to hardcoded stage with timeLimit', async () => {
            // Mock stage loader to throw error, triggering fallback
            vi.spyOn((gameManager as any).stageLoader, 'loadStageWithFallback').mockRejectedValue(
                new Error('Network error')
            );

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

            vi.spyOn((gameManager as any).stageLoader, 'getHardcodedStage').mockReturnValue(
                hardcodedStageWithTimeLimit
            );

            // Act: Load stage (will fallback to hardcoded)
            await gameManager.loadStage(1);

            // Assert: Should use hardcoded stage's timeLimit
            expect(getGameStore().getTimeRemaining()).toBe(10);
            expect(getGameStore().game.timeLimit).toBe(10);
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

            vi.spyOn((gameManager as any).stageLoader, 'loadStageWithFallback').mockResolvedValue(
                mockStageData
            );

            await gameManager.loadStage(1);

            // Simulate game running and time decreasing
            getGameStore().updateTimeRemaining(5);
            expect(getGameStore().getTimeRemaining()).toBe(5);

            // Act: Reset game state
            await gameManager.resetGameState();

            // Assert: timeRemaining should be reset to timeLimit
            expect(getGameStore().getTimeRemaining()).toBe(15);
            expect(getGameStore().game.timeLimit).toBe(15);
        });
    });
});

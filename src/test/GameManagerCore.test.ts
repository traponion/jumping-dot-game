import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManagerCore } from '../core/GameManagerCore.js';
import type { GameSystems } from '../core/GameManagerInitialization.js';
import type { StageData, StageLoader } from '../core/StageLoader.js';
import { GameState } from '../stores/GameState.js';

// Mock StageLoader
vi.mock('../core/StageLoader');

describe('GameManagerCore', () => {
    let gameManagerCore: GameManagerCore;
    let gameState: GameState;
    let mockSystems: GameSystems;
    let mockStageLoader: StageLoader;

    beforeEach(() => {
        gameState = new GameState();

        // Create mock systems
        mockSystems = {
            physicsSystem: {
                update: vi.fn(),
                getPhysicsConstants: vi.fn().mockReturnValue({
                    gravity: 0.5,
                    jumpForce: -10,
                    autoJumpInterval: 10,
                    moveSpeed: 5,
                    gameSpeed: 1
                })
            },
            cameraSystem: {
                update: vi.fn()
            },
            collisionSystem: {
                update: vi.fn()
            },
            gameRuleSystem: {
                update: vi.fn()
            },
            animationSystem: {
                updateClearAnimation: vi.fn(),
                updateDeathAnimation: vi.fn(),
                updateSoulAnimation: vi.fn()
            },
            movingPlatformSystem: {
                update: vi.fn()
            },
            renderSystem: {
                cleanup: vi.fn()
            },
            inputManager: {
                update: vi.fn(),
                cleanup: vi.fn()
            },
            playerSystem: {
                update: vi.fn(),
                clearTrail: vi.fn(),
                resetJumpTimer: vi.fn()
            }
        } as any;

        // Create mock stage loader
        mockStageLoader = {
            loadStageWithFallback: vi.fn().mockResolvedValue({
                id: 1,
                name: 'Test Stage',
                timeLimit: 15,
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            })
        } as any;

        gameManagerCore = new GameManagerCore(gameState, mockSystems, mockStageLoader);
    });

    describe('update', () => {
        it('should not call updateSystems when game is not running', () => {
            // Arrange
            gameState.gameRunning = false;
            const updateSystemsSpy = vi.spyOn(gameManagerCore as any, 'updateSystems');

            // Act
            gameManagerCore.update(16.67);

            // Assert
            expect(updateSystemsSpy).not.toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateClearAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateDeathAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateSoulAnimation).toHaveBeenCalled();
        });

        it('should not call updateSystems when game is over', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = true;
            const updateSystemsSpy = vi.spyOn(gameManagerCore as any, 'updateSystems');

            // Act
            gameManagerCore.update(16.67);

            // Assert
            expect(updateSystemsSpy).not.toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateClearAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateDeathAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateSoulAnimation).toHaveBeenCalled();
        });

        it('should call updateSystems when game is running and not over', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = false;
            const updateSystemsSpy = vi.spyOn(gameManagerCore as any, 'updateSystems');

            // Act
            gameManagerCore.update(16.67);

            // Assert
            expect(updateSystemsSpy).toHaveBeenCalledWith(16.67);
            expect(mockSystems.collisionSystem.update).toHaveBeenCalled();
            expect(mockSystems.gameRuleSystem.update).toHaveBeenCalled();
            expect(mockSystems.cameraSystem.update).toHaveBeenCalled();
        });

        it('should update all systems in correct order', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = false;

            // Act
            gameManagerCore.update(16.67);

            // Assert
            expect(mockSystems.inputManager.update).toHaveBeenCalled();
            expect(mockSystems.playerSystem.update).toHaveBeenCalledWith(
                16.67,
                mockSystems.physicsSystem.getPhysicsConstants()
            );
            expect(mockSystems.physicsSystem.update).toHaveBeenCalledWith(16.67);
            expect(mockSystems.movingPlatformSystem.update).toHaveBeenCalledWith(16.67);
            expect(mockSystems.animationSystem.updateClearAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateDeathAnimation).toHaveBeenCalled();
            expect(mockSystems.animationSystem.updateSoulAnimation).toHaveBeenCalled();
        });
    });

    describe('loadStage', () => {
        it('should load stage and set time limit', async () => {
            // Arrange
            const mockStage: StageData = {
                id: 1,
                name: 'Test Stage',
                timeLimit: 15,
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            };
            (mockStageLoader.loadStageWithFallback as any).mockResolvedValue(mockStage);

            // Act
            const result = await gameManagerCore.loadStage(1);

            // Assert
            expect(mockStageLoader.loadStageWithFallback).toHaveBeenCalledWith(1);
            expect(gameState.timeLimit).toBe(15);
            expect(gameState.timeRemaining).toBe(15);
            expect(result).toBe(mockStage);
        });

        it('should use default time limit when stage has no timeLimit', async () => {
            // Arrange
            const mockStage: StageData = {
                id: 1,
                name: 'Test Stage',
                // No timeLimit property
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            };
            (mockStageLoader.loadStageWithFallback as any).mockResolvedValue(mockStage);
            const defaultTimeLimit = gameState.timeLimit;

            // Act
            await gameManagerCore.loadStage(1);

            // Assert
            expect(gameState.timeLimit).toBe(defaultTimeLimit);
        });
    });

    describe('resetGameState', () => {
        it('should reset game state and reload stage', async () => {
            // Arrange
            gameState.currentStage = 2;
            gameState.gameRunning = true;
            gameState.gameOver = true;
            gameState.finalScore = 100;
            gameState.deathCount = 5;

            // Act
            const result = await gameManagerCore.resetGameState();

            // Assert
            expect(gameState.gameRunning).toBe(false);
            expect(gameState.gameOver).toBe(false);
            expect(gameState.finalScore).toBe(0);
            expect(gameState.deathCount).toBe(0);
            expect(mockSystems.playerSystem.clearTrail).toHaveBeenCalled();
            expect(mockSystems.playerSystem.resetJumpTimer).toHaveBeenCalled();
            expect(mockStageLoader.loadStageWithFallback).toHaveBeenCalledWith(2);
            expect(result).toBeDefined();
        });
    });

    describe('cleanup', () => {
        it('should cleanup all systems and set game over', async () => {
            // Act
            await gameManagerCore.cleanup();

            // Assert
            expect(mockSystems.inputManager.cleanup).toHaveBeenCalled();
            expect(mockSystems.renderSystem.cleanup).toHaveBeenCalled();
            expect(gameState.gameOver).toBe(true);
        });
    });
});

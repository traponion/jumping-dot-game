import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManagerRenderer } from '../core/GameManagerRenderer.js';
import type { GameUI } from '../core/GameUI.js';
import type { StageData } from '../core/StageLoader.js';
import { GameState } from '../stores/GameState.js';
import type { AnimationSystem } from '../systems/AnimationSystem.js';
import type { IRenderSystem } from '../systems/IRenderSystem.js';
import type { PlayerSystem } from '../systems/PlayerSystem.js';

// Mock GameUI
vi.mock('../core/GameUI.js');

describe('GameManagerRenderer', () => {
    let gameManagerRenderer: GameManagerRenderer;
    let gameState: GameState;
    let mockRenderSystem: IRenderSystem;
    let mockAnimationSystem: AnimationSystem;
    let mockPlayerSystem: PlayerSystem;
    let mockGameUI: GameUI;

    beforeEach(() => {
        gameState = new GameState();

        // Create mock render system
        mockRenderSystem = {
            clearCanvas: vi.fn(),
            setDrawingStyle: vi.fn(),
            applyCameraTransform: vi.fn(),
            renderStage: vi.fn(),
            renderDeathMarks: vi.fn(),
            renderTrail: vi.fn(),
            renderLandingPredictions: vi.fn(),
            renderPlayer: vi.fn(),
            renderDeathAnimation: vi.fn(),
            renderSoulAnimation: vi.fn(),
            renderClearAnimation: vi.fn(),
            restoreCameraTransform: vi.fn(),
            renderCredits: vi.fn(),
            renderGameOverMenu: vi.fn(),
            renderAll: vi.fn(),
            cleanup: vi.fn()
        } as any;

        // Create mock animation system
        mockAnimationSystem = {
            getDeathAnimation: vi.fn().mockReturnValue({ active: false }),
            getSoulAnimation: vi.fn().mockReturnValue({ active: false }),
            getClearAnimation: vi.fn().mockReturnValue({ active: false })
        } as any;

        // Create mock player system
        mockPlayerSystem = {
            getTrail: vi.fn().mockReturnValue([])
        } as any;

        // Create mock GameUI
        mockGameUI = {
            getGameOverMenuData: vi.fn().mockReturnValue({
                options: ['RESTART STAGE', 'STAGE SELECT'],
                selectedIndex: 0
            }),
            showStartScreen: vi.fn(),
            showGameOverScreen: vi.fn()
        } as any;

        gameManagerRenderer = new GameManagerRenderer(
            gameState,
            mockRenderSystem,
            mockAnimationSystem,
            mockPlayerSystem
        );
    });

    describe('render', () => {
        it('should call basic rendering methods in correct order', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = false;

            // Act
            gameManagerRenderer.render();

            // Assert
            expect(mockRenderSystem.clearCanvas).toHaveBeenCalled();
            expect(mockRenderSystem.setDrawingStyle).toHaveBeenCalled();
            expect(mockRenderSystem.applyCameraTransform).toHaveBeenCalled();
            expect(mockRenderSystem.restoreCameraTransform).toHaveBeenCalled();
            expect(mockRenderSystem.renderCredits).toHaveBeenCalled();
            expect(mockRenderSystem.renderAll).toHaveBeenCalled();
        });

        it('should render stage when stage is present', () => {
            // Arrange
            const mockStage: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 720, y: 430, text: 'GOAL' }
            };

            // Act
            gameManagerRenderer.render(mockGameUI, mockStage);

            // Assert
            expect(mockRenderSystem.renderStage).toHaveBeenCalledWith(mockStage);
        });

        it('should render player and trail when game is running', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = false;
            const mockTrail = [{ x: 100, y: 400 }];
            (mockPlayerSystem.getTrail as any).mockReturnValue(mockTrail);

            // Act
            gameManagerRenderer.render();

            // Assert
            expect(mockRenderSystem.renderPlayer).toHaveBeenCalledWith(gameState.runtime.player);
            expect(mockRenderSystem.renderTrail).toHaveBeenCalledWith(
                mockTrail,
                gameState.runtime.player.radius
            );
            expect(mockRenderSystem.renderLandingPredictions).toHaveBeenCalled();
        });

        it('should not render player when game is over', () => {
            // Arrange
            gameState.gameRunning = true;
            gameState.gameOver = true;

            // Act
            gameManagerRenderer.render();

            // Assert
            expect(mockRenderSystem.renderPlayer).not.toHaveBeenCalled();
            expect(mockRenderSystem.renderTrail).not.toHaveBeenCalled();
        });

        it('should render death animation when active', () => {
            // Arrange
            const mockDeathAnimation = {
                active: true,
                particles: [{ x: 100, y: 400 }]
            };
            (mockAnimationSystem.getDeathAnimation as any).mockReturnValue(mockDeathAnimation);

            // Act
            gameManagerRenderer.render();

            // Assert
            expect(mockRenderSystem.renderDeathAnimation).toHaveBeenCalledWith(
                mockDeathAnimation.particles
            );
        });

        it('should render game over menu when game is over', () => {
            // Arrange
            gameState.gameOver = true;
            gameState.finalScore = 150;
            gameState.deathCount = 3;

            // Act
            gameManagerRenderer.render(mockGameUI);

            // Assert
            expect(mockGameUI.getGameOverMenuData).toHaveBeenCalled();
            expect(mockRenderSystem.renderGameOverMenu).toHaveBeenCalledWith(
                ['RESTART STAGE', 'STAGE SELECT'],
                0,
                150,
                3
            );
        });

        it('should show start screen when game is not running and not over', () => {
            // Arrange
            gameState.gameRunning = false;
            gameState.gameOver = false;

            // Act
            gameManagerRenderer.render(mockGameUI);

            // Assert
            expect(mockGameUI.showStartScreen).toHaveBeenCalled();
        });
    });

    describe('renderGameOverMenu', () => {
        it('should render game over menu with correct parameters', () => {
            // Arrange
            gameState.finalScore = 200;
            gameState.deathCount = 5;

            // Act
            gameManagerRenderer.renderGameOverMenu(mockGameUI);

            // Assert
            expect(mockGameUI.getGameOverMenuData).toHaveBeenCalled();
            expect(mockRenderSystem.renderGameOverMenu).toHaveBeenCalledWith(
                ['RESTART STAGE', 'STAGE SELECT'],
                0,
                200,
                5
            );
        });
    });
});

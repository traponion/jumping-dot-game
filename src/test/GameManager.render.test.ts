import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../core/GameManager.js';
import type { GameUI } from '../core/GameUI.js';
import { getGameStore } from '../stores/GameZustandStore.js';
import type { FabricRenderSystem } from '../systems/FabricRenderSystem.js';
import type { GameController } from '../systems/InputManager.js';

// Mock dependencies
vi.mock('../ui/GameUI.js');
vi.mock('../systems/FabricRenderSystem.js');

describe('GameManager render with GameUI integration', () => {
    let gameManager: GameManager;
    let mockGameUI: GameUI;
    let mockRenderSystem: Partial<FabricRenderSystem>;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset store to clean state
        getGameStore().reset();

        // Create canvas with event listener mocks for game-inputs compatibility
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        canvas.addEventListener = vi.fn();
        canvas.removeEventListener = vi.fn();

        // Create mock GameUI
        mockGameUI = {
            getGameOverMenuData: vi.fn().mockReturnValue({
                options: ['RESTART STAGE', 'STAGE SELECT'],
                selectedIndex: 0
            })
        } as any;

        // Create mock render system with all required methods
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
            renderClearAnimation: vi.fn(),
            restoreCameraTransform: vi.fn(),
            renderStartInstruction: vi.fn(),
            renderCredits: vi.fn(),
            renderGameOverMenu: vi.fn(),
            renderAll: vi.fn()
        };

        // Create GameManager and inject mock render system
        const mockGameController = {} as GameController;
        gameManager = new GameManager(canvas, mockGameController);
        (gameManager as unknown as { renderSystem: Partial<FabricRenderSystem> }).renderSystem =
            mockRenderSystem;
    });

    describe('when game is over', () => {
        it('should call renderGameOverMenu before renderAll', () => {
            // Setup: Set game to over state
            getGameStore().gameOver();
            getGameStore().setFinalScore(150);

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: renderGameOverMenu should be called
            expect(mockGameUI.getGameOverMenuData).toHaveBeenCalled();
            expect(mockRenderSystem.renderGameOverMenu).toHaveBeenCalledWith(
                ['RESTART STAGE', 'STAGE SELECT'],
                0,
                150
            );

            // Assert: renderAll should be called after renderGameOverMenu
            expect(mockRenderSystem.renderAll).toHaveBeenCalled();

            // Verify call order: renderGameOverMenu before renderAll
            const renderMenuCall = (mockRenderSystem.renderGameOverMenu as any).mock
                .invocationCallOrder[0];
            const renderAllCall = (mockRenderSystem.renderAll as any).mock.invocationCallOrder[0];
            expect(renderMenuCall).toBeLessThan(renderAllCall);
        });

        it('should not render start instruction when game is over', () => {
            // Setup: Set game to over state
            getGameStore().gameOver();

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: renderStartInstruction should not be called
            expect(mockRenderSystem.renderStartInstruction).not.toHaveBeenCalled();
        });
    });

    describe('when game is not running and not over (start screen)', () => {
        it('should call renderStartInstruction and not renderGameOverMenu', () => {
            // Setup: Game not running, not over (initial state)
            getGameStore().stopGame();

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: Should render start instruction, not game over menu
            expect(mockRenderSystem.renderStartInstruction).toHaveBeenCalled();
            expect(mockRenderSystem.renderGameOverMenu).not.toHaveBeenCalled();
            expect(mockGameUI.getGameOverMenuData).not.toHaveBeenCalled();
        });
    });

    describe('when game is running', () => {
        it('should not call renderGameOverMenu or renderStartInstruction', () => {
            // Setup: Game running
            getGameStore().startGame();

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: Should not render menus
            expect(mockRenderSystem.renderGameOverMenu).not.toHaveBeenCalled();
            expect(mockRenderSystem.renderStartInstruction).not.toHaveBeenCalled();
            expect(mockGameUI.getGameOverMenuData).not.toHaveBeenCalled();
        });
    });

    describe('render method signature', () => {
        it('should accept GameUI parameter', () => {
            // This test ensures the signature change doesn't break
            expect(() => {
                (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);
            }).not.toThrow();
        });

        it('should handle missing GameUI gracefully', () => {
            // Setup: Game over state
            getGameStore().gameOver();

            // Act: Call render without GameUI (should not crash)
            expect(() => {
                (gameManager as unknown as { render: () => void }).render();
            }).not.toThrow();
        });
    });
});

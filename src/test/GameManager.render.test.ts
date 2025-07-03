import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManager } from '../core/GameManager.js';
import type { GameUI } from '../core/GameUI.js';
import { GameState } from '../stores/GameState.js';
// getGameStore import removed - using direct GameState instances
import type { FabricRenderSystem } from '../systems/FabricRenderSystem.js';
import type { GameController } from '../systems/InputManager.js';

// Mock dependencies
vi.mock('../ui/GameUI.js');
vi.mock('../systems/FabricRenderSystem.js');

// Mock DOM elements
const mockCanvas = {
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    getContext: vi.fn((contextType) => {
        if (contextType === '2d') {
            return {
                clearRect: vi.fn(),
                fillRect: vi.fn(),
                strokeRect: vi.fn(),
                beginPath: vi.fn(),
                moveTo: vi.fn(),
                lineTo: vi.fn(),
                stroke: vi.fn(),
                fill: vi.fn(),
                closePath: vi.fn(),
                arc: vi.fn(),
                canvas: mockCanvas
            };
        }
        return null;
    })
};

// Mock document.createElement
Object.defineProperty(global, 'document', {
    value: {
        createElement: vi.fn(() => mockCanvas),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    }
});

// Mock window.document
Object.defineProperty(global, 'window', {
    value: {
        document: {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        }
    }
});

describe('GameManager render with GameUI integration', () => {
    let gameManager: GameManager;
    let gameState: GameState;
    let mockGameUI: GameUI;
    let mockRenderSystem: Partial<FabricRenderSystem>;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset store to clean state
        // Note: gameState is already created fresh in GameManager constructor

        // Create canvas
        canvas = document.createElement('canvas') as HTMLCanvasElement;
        canvas.width = 800;
        canvas.height = 600;

        // Create mock GameUI
        mockGameUI = {
            getGameOverMenuData: vi.fn().mockReturnValue({
                options: ['RESTART STAGE', 'STAGE SELECT'],
                selectedIndex: 0
            }),
            showStartScreen: vi.fn(),
            showGameOverScreen: vi.fn()
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
        gameState = new GameState();
        gameManager = new GameManager(canvas, mockGameController, gameState);
        (gameManager as unknown as { renderSystem: Partial<FabricRenderSystem> }).renderSystem =
            mockRenderSystem;
    });

    describe('when game is over', () => {
        it('should call renderGameOverMenu before renderAll', () => {
            // Setup: Set game to over state
            gameState.gameOver = true;
            gameState.finalScore = 150;

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

        it('should not call showStartScreen when game is over', () => {
            // Setup: Set game to over state
            gameState.gameOver = true;

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: showStartScreen should not be called when game is over
            expect(mockGameUI.showStartScreen).not.toHaveBeenCalled();
        });
    });

    describe('when game is not running and not over (start screen)', () => {
        it('should call showStartScreen and not renderGameOverMenu', () => {
            // Setup: Game not running, not over (initial state)
            gameState.gameRunning = false;

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: Should call showStartScreen, not game over menu
            expect(mockGameUI.showStartScreen).toHaveBeenCalled();
            expect(mockRenderSystem.renderGameOverMenu).not.toHaveBeenCalled();
            expect(mockGameUI.getGameOverMenuData).not.toHaveBeenCalled();
        });
    });

    describe('when game is running', () => {
        it('should not call renderGameOverMenu or showStartScreen', () => {
            // Setup: Game running
            gameState.gameRunning = true;

            // Act: Call render with GameUI
            (gameManager as unknown as { render: (ui: GameUI) => void }).render(mockGameUI);

            // Assert: Should not render menus
            expect(mockRenderSystem.renderGameOverMenu).not.toHaveBeenCalled();
            expect(mockGameUI.showStartScreen).not.toHaveBeenCalled();
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
            gameState.gameOver = true;

            // Act: Call render without GameUI (should not crash)
            expect(() => {
                (gameManager as unknown as { render: () => void }).render();
            }).not.toThrow();
        });
    });
});

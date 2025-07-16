/**
 * Game.ts Unit Tests
 *
 * Test suite for JumpingDotGame class - core game lifecycle management
 * Target: Improve coverage from 0% to 50%+ for highest impact
 *
 * Testing Strategy:
 * 1. Constructor initialization
 * 2. Game initialization (init/initWithStage)
 * 3. Game lifecycle (startGame/update/render/cleanup)
 * 4. Error handling scenarios
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JumpingDotGame } from '../../../core/Game';
import type { GameManager } from '../../../core/GameManager';
import type { GameUI } from '../../../core/GameUI';
import type { InputManager } from '../../../systems/InputManager';

// Mock only what's still needed with DI approach
vi.mock('../../../stores/GameState', () => ({
    GameState: vi.fn().mockImplementation(() => ({
        runtime: {
            player: { x: 100, y: 200, radius: 10, vx: 0, vy: 0, grounded: false },
            camera: { x: 0, y: 0 },
            particles: [],
            deathMarks: [],
            trail: [],
            collisionResults: {
                holeCollision: false,
                boundaryCollision: false,
                goalCollision: false
            },
            shouldStartDeathAnimation: false,
            shouldStartClearAnimation: false,
            isInitialized: false,
            lastUpdateTime: 0
        },
        gameRunning: true,
        gameOver: false,
        gameCleared: false,
        currentStage: 1,
        timeLimit: 10,
        timeRemaining: 10,
        gameStartTime: null,
        finalScore: 0,
        deathCount: 0,
        stage: null,
        hasMovedOnce: false,
        performance: { fps: 60, deltaTime: 16.67 },
        reset: vi.fn()
    }))
}));

vi.mock('../../../core/GameUI', () => ({
    GameUI: vi.fn().mockImplementation(() => ({
        init: vi.fn(),
        showLoading: vi.fn(),
        showReadyToStart: vi.fn(),
        showPlaying: vi.fn(),
        showPlayerDeath: vi.fn(),
        showGoalReached: vi.fn(),
        showGameOverScreen: vi.fn(),
        showClearScreen: vi.fn(),
        showStartScreen: vi.fn(),
        updateTimer: vi.fn(),
        updateDeathCount: vi.fn(),
        updateInitialUI: vi.fn(),
        updateUIVisibility: vi.fn(),
        handleGameOverNavigation: vi.fn(),
        getGameOverSelection: vi.fn(),
        selectStageSelectOption: vi.fn(),
        getGameOverMenuData: vi.fn(),
        requestStageSelect: vi.fn(),
        getRequiredElement: vi.fn(),
        showStageSelect: vi.fn(),
        showGameUI: vi.fn(),
        hideGameUI: vi.fn(),
        cleanup: vi.fn()
    }))
}));

vi.mock('../../../systems/GameLoop', () => ({
    GameLoop: vi.fn().mockImplementation(() => ({
        setUpdateCallback: vi.fn(),
        setRenderCallback: vi.fn(),
        start: vi.fn(),
        stop: vi.fn()
    }))
}));

describe('JumpingDotGame', () => {
    let mockGameCanvas: HTMLCanvasElement;
    let mockGameManager: Partial<GameManager>;
    let mockGameUI: Partial<GameUI>;
    let game: JumpingDotGame;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create required DOM elements for JumpingDotGame
        mockGameCanvas = document.createElement('canvas');
        mockGameCanvas.id = 'gameCanvas';
        document.body.appendChild(mockGameCanvas);

        // Create mock GameManager instance for DI
        mockGameManager = {
            init: vi.fn(),
            initWithStage: vi.fn(),
            start: vi.fn(),
            update: vi.fn(),
            render: vi.fn(),
            cleanup: vi.fn(),
            onGameOver: vi.fn(),
            onStageSelect: vi.fn(),
            loadStage: vi.fn(),
            resetGameState: vi.fn(),
            getInputManager: vi.fn(() => ({ clearInputs: vi.fn() }) as unknown as InputManager)
        } as Partial<GameManager>;

        // Create mock GameUI instance for DI (only methods needed for testing)
        mockGameUI = {
            showLoading: vi.fn(),
            showReadyToStart: vi.fn(),
            updateInitialUI: vi.fn(),
            cleanup: vi.fn()
        } as Partial<GameUI>;
    });

    // Test 1: Critical DOM dependency error - game won't work without this
    it('should throw error when gameCanvas element is missing', () => {
        // Remove gameCanvas to test error handling
        document.body.removeChild(mockGameCanvas);

        // Verify critical dependency validation (fails early, no GameManager needed)
        expect(() => {
            game = new JumpingDotGame();
        }).toThrow('Required DOM element with id "gameCanvas" not found');
    });

    // Test 2: Invalid input handling - prevents game from breaking with bad data
    it('should handle invalid stage ID gracefully', async () => {
        // Setup mock to reject invalid stage
        mockGameManager.loadStage = vi.fn().mockRejectedValue(new Error('Invalid stage ID'));

        game = new JumpingDotGame(mockGameManager as GameManager, mockGameUI as GameUI);
        const invalidStageId = -1;

        // Verify robust error handling for invalid input
        await expect(game.initWithStage(invalidStageId)).rejects.toThrow('Invalid stage ID');
    });

    // Test 3: Uninitialized state robustness - prevents resource leaks/crashes
    it('should handle cleanup without initialization', async () => {
        game = new JumpingDotGame(mockGameManager as GameManager, mockGameUI as GameUI);

        // Verify graceful cleanup even when not properly initialized
        await expect(game.cleanup()).resolves.not.toThrow();
        expect(mockGameManager.cleanup).toHaveBeenCalled();
    });

    // Test 4: Multiple initialization robustness - prevents double-init issues
    it('should handle multiple initialization calls', async () => {
        game = new JumpingDotGame(mockGameManager as GameManager, mockGameUI as GameUI);
        await game.init();

        // Verify no issues with redundant initialization
        await expect(game.init()).resolves.not.toThrow();
        // Verify GameUI.showLoading was called twice (once per init)
        expect(mockGameUI.showLoading).toHaveBeenCalledTimes(2);
    });
});

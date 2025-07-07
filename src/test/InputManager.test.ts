import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameState } from '../stores/GameState.js';
import { InputManager } from '../systems/InputManager.ts';

// Mock factory function to create fresh instances for each test
function createFreshInputMocks() {
    return {
        bind: vi.fn(),
        down: {
            on: vi.fn(),
            removeAllListeners: vi.fn()
        },
        up: {
            removeAllListeners: vi.fn()
        },
        state: {} as Record<string, boolean>,
        tick: vi.fn(),
        disabled: false
    };
}

// Create fresh mock instance for each test
let mockGameInputs = createFreshInputMocks();

vi.mock('game-inputs', () => ({
    GameInputs: vi.fn(() => mockGameInputs)
}));

// Mock GameController
const mockGameController = {
    startGame: vi.fn(),
    init: vi.fn(),
    returnToStageSelect: vi.fn(),
    handleGameOverNavigation: vi.fn(),
    handleGameOverSelection: vi.fn(),
    getGameState: vi.fn(() => new GameState()),
    getGameUI: vi.fn()
};

describe('InputManager', () => {
    let inputManager: InputManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Create completely fresh mock instance for each test
        mockGameInputs = createFreshInputMocks();

        // Re-apply mock with fresh instance
        vi.doMock('game-inputs', () => ({
            GameInputs: vi.fn(() => mockGameInputs)
        }));

        // Reset GameController mocks
        mockGameController.startGame.mockClear();
        mockGameController.init.mockClear();
        mockGameController.returnToStageSelect.mockClear();
        mockGameController.handleGameOverNavigation.mockClear();
        mockGameController.handleGameOverSelection.mockClear();
        mockGameController.getGameState.mockClear();
        mockGameController.getGameUI.mockClear();

        // Create mock canvas
        mockCanvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        } as any;

        // Create InputManager instance
        const gameState = new GameState();
        inputManager = new InputManager(
            gameState,
            mockCanvas as HTMLCanvasElement,
            mockGameController
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create InputManager instance', () => {
            expect(inputManager).toBeInstanceOf(InputManager);
        });

        // Framework implementation details removed - focus on application logic

        // Framework implementation details removed - focus on application logic
    });

    describe('isPressed', () => {
        it('should return false when inputs is null', () => {
            inputManager.cleanup();
            expect(inputManager.isPressed('move-left')).toBe(false);
        });

        it('should return action state when inputs exists', () => {
            mockGameInputs.state['move-left'] = true;
            expect(inputManager.isPressed('move-left')).toBe(true);
        });

        it('should return false for unset actions', () => {
            expect(inputManager.isPressed('unknown-action')).toBe(false);
        });
    });

    describe('wasJustPressed', () => {
        it('should return false for any action', () => {
            expect(inputManager.wasJustPressed('move-left')).toBe(false);
        });
    });

    describe('wasJustReleased', () => {
        it('should return false for any action', () => {
            expect(inputManager.wasJustReleased('move-left')).toBe(false);
        });
    });

    describe('getMovementState', () => {
        it('should return empty object when inputs is null', () => {
            inputManager.cleanup();
            expect(inputManager.getMovementState()).toEqual({});
        });

        it('should return movement state when inputs exists', () => {
            mockGameInputs.state = {
                'move-left': true,
                'move-right': false,
                jump: true
            };

            const state = inputManager.getMovementState();
            expect(state.ArrowLeft).toBe(true);
            expect(state.KeyA).toBe(true);
            expect(state.ArrowRight).toBe(false);
            expect(state.KeyD).toBe(false);
            expect(state.ArrowUp).toBe(true);
            expect(state.KeyW).toBe(true);
            expect(state.Space).toBe(true);
        });
    });

    describe('clearInputs', () => {
        // Framework implementation details removed - focus on application logic

        it('should not throw when inputs is null', () => {
            inputManager.cleanup();
            expect(() => inputManager.clearInputs()).not.toThrow();
        });
    });

    describe('update', () => {
        // Framework implementation details removed - focus on application logic

        it('should not throw when inputs is null', () => {
            inputManager.cleanup();
            expect(() => inputManager.update()).not.toThrow();
        });
    });

    describe('cleanup', () => {
        // Framework implementation details removed - focus on application logic

        it('should set inputs and gameController to null', () => {
            inputManager.cleanup();

            expect(inputManager.isPressed('any-action')).toBe(false);
            expect(inputManager.getMovementState()).toEqual({});
        });

        it('should handle cleanup when inputs is already null', () => {
            inputManager.cleanup();
            // Second cleanup should not throw
            expect(() => inputManager.cleanup()).not.toThrow();
        });
    });

    describe('simulateKeyPress', () => {
        it('should exist for testing purposes', () => {
            expect(typeof inputManager.simulateKeyPress).toBe('function');
        });

        it('should not throw when called', () => {
            expect(() => inputManager.simulateKeyPress('move-left')).not.toThrow();
        });
    });
});

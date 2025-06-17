import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../systems/InputManager.ts';

// Mock game-inputs
const mockGameInputs = {
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
    getGameState: vi.fn(() => ({
        gameRunning: false,
        gameOver: false,
        finalScore: 0
    }))
};

describe('InputManager', () => {
    let inputManager: InputManager;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Create mock canvas
        mockCanvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        } as any;

        // Reset GameInputs mock
        mockGameInputs.disabled = false;
        mockGameInputs.state = {};

        // Create InputManager instance
        inputManager = new InputManager(mockCanvas, mockGameController as any);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create InputManager instance', () => {
            expect(inputManager).toBeInstanceOf(InputManager);
        });

        it('should setup key bindings', () => {
            expect(mockGameInputs.bind).toHaveBeenCalledWith('move-left', 'ArrowLeft');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('move-left', 'KeyA');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('move-right', 'ArrowRight');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('move-right', 'KeyD');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('jump', 'ArrowUp');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('jump', 'KeyW');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('restart', 'KeyR');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('menu-up', 'ArrowUp');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('menu-down', 'ArrowDown');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('menu-select', 'Enter');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('menu-select', 'KeyR');
            expect(mockGameInputs.bind).toHaveBeenCalledWith('menu-select', 'Space');
        });

        it('should setup event handlers', () => {
            expect(mockGameInputs.down.on).toHaveBeenCalledWith('restart', expect.any(Function));
            expect(mockGameInputs.down.on).toHaveBeenCalledWith('menu-up', expect.any(Function));
            expect(mockGameInputs.down.on).toHaveBeenCalledWith('menu-down', expect.any(Function));
            expect(mockGameInputs.down.on).toHaveBeenCalledWith(
                'menu-select',
                expect.any(Function)
            );
        });
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
        it('should call tick when inputs exists', () => {
            inputManager.clearInputs();
            expect(mockGameInputs.tick).toHaveBeenCalled();
        });

        it('should not throw when inputs is null', () => {
            inputManager.cleanup();
            expect(() => inputManager.clearInputs()).not.toThrow();
        });
    });

    describe('update', () => {
        it('should call tick when inputs exists', () => {
            inputManager.update();
            expect(mockGameInputs.tick).toHaveBeenCalled();
        });

        it('should not throw when inputs is null', () => {
            inputManager.cleanup();
            expect(() => inputManager.update()).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should disable inputs and remove all listeners', () => {
            inputManager.cleanup();

            expect(mockGameInputs.down.removeAllListeners).toHaveBeenCalled();
            expect(mockGameInputs.up.removeAllListeners).toHaveBeenCalled();
            expect(mockGameInputs.disabled).toBe(true);
        });

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

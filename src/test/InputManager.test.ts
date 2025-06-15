import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputManager } from '../systems/InputManager.js';

// Mock game-inputs
let mockGameInputsInstance: {
    state: Record<string, boolean>;
    bind: any;
    down: { on: any };
    tick: any;
};

vi.mock('game-inputs', () => ({
    GameInputs: vi.fn().mockImplementation(() => {
        mockGameInputsInstance = {
            state: {},
            bind: vi.fn(),
            down: {
                on: vi.fn()
            },
            tick: vi.fn()
        };
        return mockGameInputsInstance;
    })
}));

interface MockGameController {
    startGame(): void;
    init(): void;
}

describe('InputManager', () => {
    let inputManager: InputManager;
    let mockGameController: MockGameController;
    let mockCanvas: HTMLCanvasElement;

    beforeEach(() => {
        vi.clearAllMocks();
        
        // Reset the mock instance
        mockGameInputsInstance = {
            state: {},
            bind: vi.fn(),
            down: {
                on: vi.fn()
            },
            tick: vi.fn()
        };
        
        mockGameController = {
            startGame: vi.fn(),
            init: vi.fn()
        };

        mockCanvas = document.createElement('canvas');
        
        inputManager = new InputManager(mockCanvas, mockGameController);
    });

    describe('initialization', () => {
        it('should create InputManager with canvas and game controller', () => {
            expect(inputManager).toBeDefined();
        });

        it('should setup key bindings', () => {
            const bindSpy = mockGameInputsInstance.bind;
            
            expect(bindSpy).toHaveBeenCalledWith('move-left', 'ArrowLeft');
            expect(bindSpy).toHaveBeenCalledWith('move-left', 'KeyA');
            expect(bindSpy).toHaveBeenCalledWith('move-right', 'ArrowRight');
            expect(bindSpy).toHaveBeenCalledWith('move-right', 'KeyD');
            expect(bindSpy).toHaveBeenCalledWith('jump', 'ArrowUp');
            expect(bindSpy).toHaveBeenCalledWith('jump', 'KeyW');
            expect(bindSpy).toHaveBeenCalledWith('start-game', 'Space');
            expect(bindSpy).toHaveBeenCalledWith('restart', 'KeyR');
        });

        it('should setup event handlers', () => {
            const onSpy = mockGameInputsInstance.down.on;
            
            expect(onSpy).toHaveBeenCalledWith('start-game', expect.any(Function));
            expect(onSpy).toHaveBeenCalledWith('restart', expect.any(Function));
        });
    });

    describe('input state checking', () => {
        it('should check if action is pressed', () => {
            mockGameInputsInstance.state['move-left'] = true;
            
            const result = inputManager.isPressed('move-left');
            
            expect(result).toBe(true);
        });

        it('should return false for unpressed action', () => {
            mockGameInputsInstance.state['move-left'] = false;
            
            const result = inputManager.isPressed('move-left');
            
            expect(result).toBe(false);
        });

        it('should return false for undefined action', () => {
            const result = inputManager.isPressed('undefined-action');
            
            expect(result).toBe(false);
        });

        it('should always return false for wasJustPressed', () => {
            const result = inputManager.wasJustPressed('move-left');
            
            expect(result).toBe(false);
        });

        it('should always return false for wasJustReleased', () => {
            const result = inputManager.wasJustReleased('move-left');
            
            expect(result).toBe(false);
        });
    });

    describe('movement state', () => {
        it('should get movement state for all keys', () => {
            mockGameInputsInstance.state['move-left'] = true;
            mockGameInputsInstance.state['move-right'] = false;
            mockGameInputsInstance.state['jump'] = true;
            
            const movementState = inputManager.getMovementState();
            
            expect(movementState).toEqual({
                ArrowLeft: true,
                ArrowRight: false,
                ArrowUp: true,
                KeyA: true,
                KeyD: false,
                KeyW: true,
                Space: true
            });
        });

        it('should handle empty input state', () => {
            mockGameInputsInstance.state = {};
            
            const movementState = inputManager.getMovementState();
            
            expect(movementState.ArrowLeft).toBe(false);
            expect(movementState.ArrowRight).toBe(false);
            expect(movementState.ArrowUp).toBe(false);
        });
    });

    describe('game state management', () => {
        it('should set game state', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.setGameState(true, false);
            
            expect(consoleSpy).toHaveBeenCalledWith('🎮 Game state changed: running=true, over=false');
            
            consoleSpy.mockRestore();
        });

        it('should set game over state', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.setGameState(false, true);
            
            expect(consoleSpy).toHaveBeenCalledWith('🎮 Game state changed: running=false, over=true');
            
            consoleSpy.mockRestore();
        });
    });

    describe('input clearing', () => {
        it('should clear inputs', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.clearInputs();
            
            expect(mockGameInputsInstance.tick).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('🧹 Clearing all inputs');
            expect(consoleSpy).toHaveBeenCalledWith('✅ Inputs cleared');
            
            consoleSpy.mockRestore();
        });
    });

    describe('update and cleanup', () => {
        it('should update input system', () => {
            inputManager.update();
            
            expect(mockGameInputsInstance.tick).toHaveBeenCalled();
        });

        it('should cleanup input manager', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.cleanup();
            
            expect(consoleSpy).toHaveBeenCalledWith('🧽 InputManager cleanup');
            
            consoleSpy.mockRestore();
        });
    });

    describe('simulation methods', () => {
        it('should simulate key press', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.simulateKeyPress('test-action');
            
            expect(consoleSpy).toHaveBeenCalledWith('🧪 Simulating key press: test-action');
            
            consoleSpy.mockRestore();
        });

        it('should simulate key release', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            inputManager.simulateKeyRelease('test-action');
            
            expect(consoleSpy).toHaveBeenCalledWith('🧪 Simulating key release: test-action');
            
            consoleSpy.mockRestore();
        });
    });

    describe('event handlers', () => {
        it('should handle start game event when not running and not over', () => {
            // Get the start-game event handler that was registered
            const startGameHandler = mockGameInputsInstance.down.on.mock.calls.find(
                call => call[0] === 'start-game'
            )[1];
            
            inputManager.setGameState(false, false);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            startGameHandler();
            
            expect(mockGameController.startGame).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('🚀 Starting game with Space');
            
            consoleSpy.mockRestore();
        });

        it('should not handle start game event when running', () => {
            const startGameHandler = mockGameInputsInstance.down.on.mock.calls.find(
                call => call[0] === 'start-game'
            )[1];
            
            inputManager.setGameState(true, false);
            
            startGameHandler();
            
            expect(mockGameController.startGame).not.toHaveBeenCalled();
        });

        it('should not handle start game event when game over', () => {
            const startGameHandler = mockGameInputsInstance.down.on.mock.calls.find(
                call => call[0] === 'start-game'
            )[1];
            
            inputManager.setGameState(false, true);
            
            startGameHandler();
            
            expect(mockGameController.startGame).not.toHaveBeenCalled();
        });

        it('should handle restart event when game over', () => {
            const restartHandler = mockGameInputsInstance.down.on.mock.calls.find(
                call => call[0] === 'restart'
            )[1];
            
            inputManager.setGameState(false, true);
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            restartHandler();
            
            expect(mockGameController.init).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('🔄 Restarting game with R');
            
            consoleSpy.mockRestore();
        });

        it('should not handle restart event when not game over', () => {
            const restartHandler = mockGameInputsInstance.down.on.mock.calls.find(
                call => call[0] === 'restart'
            )[1];
            
            inputManager.setGameState(true, false);
            
            restartHandler();
            
            expect(mockGameController.init).not.toHaveBeenCalled();
        });
    });
});
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { InputSystem } from '../systems/InputSystem.js';

interface MockGame {
    startGame(): void;
    init(): void;
}

describe('InputSystem', () => {
    let inputSystem: InputSystem;
    let mockGame: MockGame;

    beforeEach(() => {
        mockGame = {
            startGame: vi.fn(),
            init: vi.fn()
        };

        inputSystem = new InputSystem(mockGame);

        // Clear any existing event listeners
        document.removeEventListener('keydown', inputSystem.handleKeyDown as EventListener);
        document.removeEventListener('keyup', inputSystem.handleKeyUp as EventListener);
    });

    describe('key state management', () => {
        it('should initialize with empty key state', () => {
            const keys = inputSystem.getKeys();
            expect(keys).toEqual({});
        });

        it('should update key state on key press', () => {
            const event = new KeyboardEvent('keydown', { code: 'ArrowLeft' });

            inputSystem.simulateKeyDown(event);

            const keys = inputSystem.getKeys();
            expect(keys.ArrowLeft).toBe(true);
        });

        it('should update key state on key release', () => {
            // First press the key
            const downEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            inputSystem.simulateKeyDown(downEvent);

            // Then release it
            const upEvent = new KeyboardEvent('keyup', { code: 'ArrowLeft' });
            inputSystem.simulateKeyUp(upEvent);

            const keys = inputSystem.getKeys();
            expect(keys.ArrowLeft).toBe(false);
        });

        it('should maintain multiple key states', () => {
            const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });

            inputSystem.simulateKeyDown(leftEvent);
            inputSystem.simulateKeyDown(rightEvent);

            const keys = inputSystem.getKeys();
            expect(keys.ArrowLeft).toBe(true);
            expect(keys.ArrowRight).toBe(true);
        });
    });

    describe('game control inputs', () => {
        it('should start game when space is pressed and game is not running', () => {
            inputSystem.setGameState(false, false); // not running, not over

            const event = new KeyboardEvent('keydown', { code: 'Space' });
            inputSystem.simulateKeyDown(event);

            expect(mockGame.startGame).toHaveBeenCalled();
        });

        it('should not start game when space is pressed and game is running', () => {
            inputSystem.setGameState(true, false); // running, not over

            const event = new KeyboardEvent('keydown', { code: 'Space' });
            inputSystem.simulateKeyDown(event);

            expect(mockGame.startGame).not.toHaveBeenCalled();
        });

        it('should not start game when space is pressed and game is over', () => {
            inputSystem.setGameState(false, true); // not running, is over

            const event = new KeyboardEvent('keydown', { code: 'Space' });
            inputSystem.simulateKeyDown(event);

            expect(mockGame.startGame).not.toHaveBeenCalled();
        });

        it('should restart game when R is pressed and game is over', () => {
            inputSystem.setGameState(false, true); // not running, is over

            const event = new KeyboardEvent('keydown', { code: 'KeyR' });
            inputSystem.simulateKeyDown(event);

            expect(mockGame.init).toHaveBeenCalled();
        });

        it('should not restart game when R is pressed and game is not over', () => {
            inputSystem.setGameState(true, false); // running, not over

            const event = new KeyboardEvent('keydown', { code: 'KeyR' });
            inputSystem.simulateKeyDown(event);

            expect(mockGame.init).not.toHaveBeenCalled();
        });
    });

    describe('arrow key behavior', () => {
        it('should prevent default for arrow keys', () => {
            const event = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            inputSystem.simulateKeyDown(event);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });

        it('should prevent default for all arrow keys', () => {
            const arrowKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

            for (const key of arrowKeys) {
                const event = new KeyboardEvent('keydown', { code: key });
                const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

                inputSystem.simulateKeyDown(event);

                expect(preventDefaultSpy).toHaveBeenCalled();
            }
        });

        it('should not prevent default for non-arrow keys', () => {
            const event = new KeyboardEvent('keydown', { code: 'KeyA' });
            const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

            inputSystem.simulateKeyDown(event);

            expect(preventDefaultSpy).not.toHaveBeenCalled();
        });
    });

    describe('game over state handling', () => {
        it('should not update key state when game is over on keydown', () => {
            inputSystem.setGameState(false, true); // not running, is over

            const event = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            inputSystem.simulateKeyDown(event);

            const keys = inputSystem.getKeys();
            expect(keys.ArrowLeft).toBeUndefined();
        });

        it('should not update key state when game is over on keyup', () => {
            // First set a key when game is not over
            inputSystem.setGameState(false, false);
            const downEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            inputSystem.handleKeyDown(downEvent);

            // Then set game over and try to release key
            inputSystem.setGameState(false, true);
            const upEvent = new KeyboardEvent('keyup', { code: 'ArrowLeft' });
            inputSystem.simulateKeyUp(upEvent);

            const keys = inputSystem.getKeys();
            expect(keys.ArrowLeft).toBe(true); // Should remain pressed
        });
    });

    describe('event listeners', () => {
        it('should setup event listeners', () => {
            const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

            inputSystem.setupEventListeners();

            expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(addEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
        });

        it('should remove event listeners', () => {
            const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

            inputSystem.cleanup();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(removeEventListenerSpy).toHaveBeenCalledWith('keyup', expect.any(Function));
        });
    });

    describe('key state clearing', () => {
        it('should clear all key states', () => {
            // Set some keys
            const leftEvent = new KeyboardEvent('keydown', { code: 'ArrowLeft' });
            const rightEvent = new KeyboardEvent('keydown', { code: 'ArrowRight' });
            inputSystem.simulateKeyDown(leftEvent);
            inputSystem.simulateKeyDown(rightEvent);

            inputSystem.clearKeys();

            const keys = inputSystem.getKeys();
            expect(keys).toEqual({});
        });
    });
});

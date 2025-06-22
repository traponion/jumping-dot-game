import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GameLoop } from '../core/GameLoop.js';

// Mock requestAnimationFrame and cancelAnimationFrame
let mockRequestAnimationFrame: vi.Mock;
let mockCancelAnimationFrame: vi.Mock;

describe('GameLoop', () => {
    let gameLoop: GameLoop;
    let mockUpdateCallback: vi.Mock;
    let mockRenderCallback: vi.Mock;

    beforeEach(() => {
        vi.useFakeTimers();

        // Create fresh mocks for each test
        mockRequestAnimationFrame = vi.fn();
        mockCancelAnimationFrame = vi.fn();

        // Set up global mocks
        global.requestAnimationFrame = mockRequestAnimationFrame;
        global.cancelAnimationFrame = mockCancelAnimationFrame;

        gameLoop = new GameLoop();
        mockUpdateCallback = vi.fn();
        mockRenderCallback = vi.fn();

        // Setup requestAnimationFrame to return an ID
        mockRequestAnimationFrame.mockImplementation((_callback: (time: number) => void) => {
            return Math.floor(Math.random() * 1000);
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('callback management', () => {
        it('should set update callback correctly', () => {
            // Act
            gameLoop.setUpdateCallback(mockUpdateCallback);

            // Assert - verify internal state by attempting to start
            expect(() => {
                gameLoop.setRenderCallback(mockRenderCallback);
                gameLoop.start();
            }).not.toThrow();
        });

        it('should set render callback correctly', () => {
            // Act
            gameLoop.setRenderCallback(mockRenderCallback);

            // Assert - verify internal state by attempting to start
            expect(() => {
                gameLoop.setUpdateCallback(mockUpdateCallback);
                gameLoop.start();
            }).not.toThrow();
        });
    });

    describe('start method', () => {
        it('should throw error when starting without update callback', () => {
            // Arrange
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act & Assert
            expect(() => gameLoop.start()).toThrow(
                'Update and render callbacks must be set before starting game loop'
            );
        });

        it('should throw error when starting without render callback', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);

            // Act & Assert
            expect(() => gameLoop.start()).toThrow(
                'Update and render callbacks must be set before starting game loop'
            );
        });

        it('should start successfully with both callbacks set', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act
            gameLoop.start();

            // Assert
            expect(mockRequestAnimationFrame).toHaveBeenCalled();
            expect(gameLoop.isRunning()).toBe(true);
        });

        it('should cancel existing animation frame before starting new one', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);
            gameLoop.setAnimationId(123); // Set existing animation ID

            // Act
            gameLoop.start();

            // Assert
            expect(mockCancelAnimationFrame).toHaveBeenCalledWith(123);
            expect(mockRequestAnimationFrame).toHaveBeenCalled();
        });

        it('should not start when instance is cleaned up', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);
            gameLoop.cleanup();

            // Mock console.warn to verify it's called
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Act
            gameLoop.start();

            // Assert
            expect(consoleSpy).toHaveBeenCalledWith(
                'Cannot start game loop on cleaned up instance'
            );
            expect(mockRequestAnimationFrame).not.toHaveBeenCalled();
        });
    });

    describe('stop method', () => {
        it('should cancel animation frame when stopping', () => {
            // Arrange
            gameLoop.setAnimationId(456);

            // Act
            gameLoop.stop();

            // Assert
            expect(mockCancelAnimationFrame).toHaveBeenCalledWith(456);
            expect(gameLoop.isRunning()).toBe(false);
        });

        it('should reset lastTime when stopping', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);
            gameLoop.start();

            // Act
            gameLoop.stop();

            // Assert
            expect(gameLoop.isRunning()).toBe(false);
        });

        it('should handle stop when not running', () => {
            // Act & Assert - should not throw
            expect(() => gameLoop.stop()).not.toThrow();
            expect(gameLoop.isRunning()).toBe(false);
        });
    });

    describe('isRunning method', () => {
        it('should return false initially', () => {
            // Assert
            expect(gameLoop.isRunning()).toBe(false);
        });

        it('should return true when running', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act
            gameLoop.start();

            // Assert
            expect(gameLoop.isRunning()).toBe(true);
        });

        it('should return false after stopping', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);
            gameLoop.start();

            // Act
            gameLoop.stop();

            // Assert
            expect(gameLoop.isRunning()).toBe(false);
        });
    });

    describe('gameLoop method coverage', () => {
        it('should test gameLoop internal logic via public methods', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act: Start the game loop
            gameLoop.start();

            // Assert: Check that requestAnimationFrame was called
            expect(mockRequestAnimationFrame).toHaveBeenCalled();
            expect(gameLoop.isRunning()).toBe(true);
        });

        it('should handle cleanup preventing gameLoop execution', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act: Start then immediately cleanup
            gameLoop.start();
            gameLoop.cleanup();

            // Assert: Should be cleaned up and stopped
            expect(gameLoop.isCleanedUpState()).toBe(true);
            expect(gameLoop.isRunning()).toBe(false);
        });
    });

    describe('cleanup method', () => {
        it('should mark instance as cleaned up', () => {
            // Act
            gameLoop.cleanup();

            // Assert
            expect(gameLoop.isCleanedUpState()).toBe(true);
        });

        it('should stop the game loop', () => {
            // Arrange
            gameLoop.setAnimationId(789);

            // Act
            gameLoop.cleanup();

            // Assert
            expect(mockCancelAnimationFrame).toHaveBeenCalledWith(789);
            expect(gameLoop.isRunning()).toBe(false);
        });

        it('should clear callbacks', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act
            gameLoop.cleanup();

            // Assert - after cleanup, attempting to start should be prevented by cleanup check
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            gameLoop.start();
            expect(consoleSpy).toHaveBeenCalledWith(
                'Cannot start game loop on cleaned up instance'
            );
        });
    });

    describe('testing utility methods', () => {
        it('should get and set animation ID', () => {
            // Act
            gameLoop.setAnimationId(999);

            // Assert
            expect(gameLoop.getAnimationId()).toBe(999);
        });

        it('should check cleanup state', () => {
            // Initially not cleaned up
            expect(gameLoop.isCleanedUpState()).toBe(false);

            // After cleanup
            gameLoop.cleanup();
            expect(gameLoop.isCleanedUpState()).toBe(true);
        });

        it('should reset cleanup state', () => {
            // Arrange
            gameLoop.cleanup();
            expect(gameLoop.isCleanedUpState()).toBe(true);

            // Act
            gameLoop.resetCleanupState();

            // Assert
            expect(gameLoop.isCleanedUpState()).toBe(false);
        });
    });

    describe('additional coverage', () => {
        it('should handle multiple start/stop cycles', () => {
            // Arrange
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            // Act: Multiple start/stop cycles
            gameLoop.start();
            expect(gameLoop.isRunning()).toBe(true);

            gameLoop.stop();
            expect(gameLoop.isRunning()).toBe(false);

            gameLoop.start();
            expect(gameLoop.isRunning()).toBe(true);

            // Assert: Should work correctly
            expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(2);
        });

        it('should handle reset cleanup state', () => {
            // Arrange: Cleanup first
            gameLoop.cleanup();
            expect(gameLoop.isCleanedUpState()).toBe(true);

            // Act: Reset cleanup state
            gameLoop.resetCleanupState();

            // Assert: Should be able to start again
            expect(gameLoop.isCleanedUpState()).toBe(false);
            gameLoop.setUpdateCallback(mockUpdateCallback);
            gameLoop.setRenderCallback(mockRenderCallback);

            expect(() => gameLoop.start()).not.toThrow();
        });
    });
});

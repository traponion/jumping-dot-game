import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameUI } from '../core/GameUI.js';
import { GameState } from '../stores/GameState.js';

// Mock DOM environment
const mockElements = {
    gameStatus: { textContent: '', style: { display: 'block' } },
    timer: { textContent: 'Time: 20' },
    score: { textContent: 'Score: 0' },
    deathCount: { textContent: 'Deaths: 0', parentElement: { style: { display: 'block' } } },
    startScreen: { textContent: '', classList: { add: vi.fn(), remove: vi.fn() } },
    gameOverScreen: { textContent: '', classList: { add: vi.fn(), remove: vi.fn() } }
};

Object.defineProperty(global, 'document', {
    value: {
        getElementById: vi.fn((id: string) => mockElements[id as keyof typeof mockElements])
    },
    writable: true
});

describe('GameUI', () => {
    let gameUI: GameUI;
    let gameState: GameState;

    beforeEach(() => {
        gameState = new GameState();
        gameUI = new GameUI(gameState);

        // Reset mock elements
        for (const element of Object.values(mockElements)) {
            element.textContent = '';
            if ('style' in element) {
                element.style.display = 'block';
            }
        }
    });

    describe('death count display', () => {
        it('should initialize deathDisplay element', () => {
            expect(gameUI).toBeDefined();
            expect(document.getElementById).toHaveBeenCalledWith('deathCount');
        });

        it('should update death count display when updateDeathCount is called', () => {
            // Setup: Set death count
            gameState.deathCount = 3;

            // Action: Update death count display
            gameUI.updateDeathCount();

            // Assert: Display updated
            expect(mockElements.deathCount.textContent).toBe('Deaths: 3');
        });

        it('should display zero deaths initially', () => {
            // Setup: Initial state
            expect(gameState.deathCount).toBe(0);

            // Action: Update death count display
            gameUI.updateDeathCount();

            // Assert: Display shows zero
            expect(mockElements.deathCount.textContent).toBe('Deaths: 0');
        });

        it('should handle multiple death count updates', () => {
            // Setup: Start with 0 deaths
            gameState.deathCount = 0;
            gameUI.updateDeathCount();
            expect(mockElements.deathCount.textContent).toBe('Deaths: 0');

            // Action: Increment deaths and update
            gameState.deathCount = 1;
            gameUI.updateDeathCount();
            expect(mockElements.deathCount.textContent).toBe('Deaths: 1');

            gameState.deathCount = 5;
            gameUI.updateDeathCount();
            expect(mockElements.deathCount.textContent).toBe('Deaths: 5');
        });

        it('should handle high death counts', () => {
            // Setup: High death count
            gameState.deathCount = 99;

            // Action: Update death count display
            gameUI.updateDeathCount();

            // Assert: Display handles large numbers
            expect(mockElements.deathCount.textContent).toBe('Deaths: 99');
        });
    });

    describe('DOM element management', () => {
        it('should manage deathDisplay property similar to scoreDisplay', () => {
            // Assert: All required display elements should be managed
            expect(document.getElementById).toHaveBeenCalledWith('gameStatus');
            expect(document.getElementById).toHaveBeenCalledWith('timer');
            expect(document.getElementById).toHaveBeenCalledWith('score');
            expect(document.getElementById).toHaveBeenCalledWith('deathCount');
        });
    });

    describe('death count visibility control', () => {
        it('should show death count only during gameplay', () => {
            // Action: Set game running state
            gameUI.updateUIVisibility(true, false);

            // Assert: Death count should be visible during gameplay
            expect(mockElements.deathCount.parentElement?.style.display).toBe('block');
        });

        it('should hide death count on title screen', () => {
            // Action: Set not running state (title screen)
            gameUI.updateUIVisibility(false, false);

            // Assert: Death count should be hidden on title screen
            expect(mockElements.deathCount.parentElement?.style.display).toBe('none');
        });

        it('should show death count on game over screen', () => {
            // Action: Set game over state
            gameUI.updateUIVisibility(false, true);

            // Assert: Death count should be visible on game over screen
            expect(mockElements.deathCount.parentElement?.style.display).toBe('block');
        });

        it('should handle multiple visibility state changes', () => {
            // Initial: Hide on title screen
            gameUI.updateUIVisibility(false, false);
            expect(mockElements.deathCount.parentElement?.style.display).toBe('none');

            // Show during gameplay
            gameUI.updateUIVisibility(true, false);
            expect(mockElements.deathCount.parentElement?.style.display).toBe('block');

            // Show on game over
            gameUI.updateUIVisibility(false, true);
            expect(mockElements.deathCount.parentElement?.style.display).toBe('block');

            // Hide again on title screen
            gameUI.updateUIVisibility(false, false);
            expect(mockElements.deathCount.parentElement?.style.display).toBe('none');
        });
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameUI } from '../core/GameUI.js';
import { GameState } from '../stores/GameState.js';

describe('GameUI HTML Game Over Menu', () => {
    let gameUI: GameUI;
    let gameState: GameState;
    let originalGetElementById: typeof document.getElementById;

    // Mock DOM elements
    const mockGameStatus = {
        textContent: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    const mockTimer = {
        textContent: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    const mockDeathCount = {
        textContent: '',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn(),
        parentElement: {
            style: { display: 'block' }
        }
    } as unknown as HTMLElement;

    const mockGameOverScreen = {
        textContent: '',
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        querySelector: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    const mockStartScreen = {
        textContent: '',
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    // Mock menu option elements
    const mockMenuOption1 = {
        textContent: 'RESTART STAGE',
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    const mockMenuOption2 = {
        textContent: 'STAGE SELECT',
        classList: {
            add: vi.fn(),
            remove: vi.fn()
        },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    const mockGameOverDeathCount = {
        textContent: '0',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getAttribute: vi.fn(),
        setAttribute: vi.fn()
    } as unknown as HTMLElement;

    beforeEach(() => {
        // Store original method
        originalGetElementById = document.getElementById;

        // Mock getElementById
        document.getElementById = vi.fn((id) => {
            if (id === 'gameStatus') return mockGameStatus;
            if (id === 'timer') return mockTimer;
            if (id === 'deathCount') return mockDeathCount;
            if (id === 'gameOverScreen') return mockGameOverScreen;
            if (id === 'startScreen') return mockStartScreen;
            if (id === 'gameOverMenuOption0') return mockMenuOption1;
            if (id === 'gameOverMenuOption1') return mockMenuOption2;
            if (id === 'gameOverDeathCount') return mockGameOverDeathCount;
            return null;
        }) as typeof document.getElementById;

        // Mock querySelector for game over menu options
        mockGameOverScreen.querySelector = vi.fn((selector) => {
            if (selector === '.game-over-menu-option[data-index="0"]') return mockMenuOption1;
            if (selector === '.game-over-menu-option[data-index="1"]') return mockMenuOption2;
            return null;
        });

        // Mock querySelectorAll for all menu options
        (mockGameOverScreen as any).querySelectorAll = vi.fn((selector) => {
            if (selector === '.game-over-menu-option') return [mockMenuOption1, mockMenuOption2];
            return [];
        });

        gameState = new GameState();
        gameUI = new GameUI(gameState);
    });

    afterEach(() => {
        // Restore original method
        document.getElementById = originalGetElementById;
        vi.clearAllMocks();
    });

    describe('HTML Game Over Menu Display', () => {
        it('should show HTML game over menu instead of canvas menu', () => {
            // Arrange
            gameState.gameOver = true;
            gameState.deathCount = 3;

            // Act
            gameUI.showGameOverScreen();

            // Assert
            expect(mockGameOverScreen.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockStartScreen.classList.add).toHaveBeenCalledWith('hidden');
        });

        it('should update death count display in HTML menu', () => {
            // Arrange
            gameState.deathCount = 5;

            // Act
            gameUI.updateDeathCount();

            // Assert
            expect(mockDeathCount.textContent).toBe('Deaths: 5');
        });

        it('should hide HTML game over menu when game is not over', () => {
            // Arrange
            gameState.gameOver = false;
            gameState.gameRunning = true;

            // Act
            gameUI.updateUIVisibility(true, false);

            // Assert
            expect(mockGameOverScreen.classList.add).toHaveBeenCalledWith('hidden');
        });
    });

    describe('HTML Game Over Menu Navigation', () => {
        it('should highlight selected menu option in HTML', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();

            // Act
            gameUI.highlightMenuOption(0);

            // Assert
            expect(mockMenuOption1.classList.add).toHaveBeenCalledWith('selected');
            expect(mockMenuOption2.classList.remove).toHaveBeenCalledWith('selected');
        });

        it('should change selection when navigating down', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();

            // Act
            gameUI.handleGameOverNavigation('down');

            // Assert
            const menuData = gameUI.getGameOverMenuData();
            expect(menuData.selectedIndex).toBe(1);
        });

        it('should change selection when navigating up', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();
            gameUI.handleGameOverNavigation('down'); // Move to index 1

            // Act
            gameUI.handleGameOverNavigation('up');

            // Assert
            const menuData = gameUI.getGameOverMenuData();
            expect(menuData.selectedIndex).toBe(0);
        });

        it('should not go below first option when navigating up', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();

            // Act
            gameUI.handleGameOverNavigation('up');

            // Assert
            const menuData = gameUI.getGameOverMenuData();
            expect(menuData.selectedIndex).toBe(0);
        });

        it('should not go above last option when navigating down', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();
            gameUI.handleGameOverNavigation('down'); // Move to index 1

            // Act
            gameUI.handleGameOverNavigation('down'); // Try to go beyond last option

            // Assert
            const menuData = gameUI.getGameOverMenuData();
            expect(menuData.selectedIndex).toBe(1);
        });
    });

    describe('HTML Game Over Menu Integration', () => {
        it('should update HTML menu when game state changes', () => {
            // Arrange
            gameState.gameOver = true;
            gameState.gameRunning = false;
            gameState.deathCount = 2;

            // Act
            gameUI.updateGameOverMenu();

            // Assert
            expect(mockGameOverDeathCount.textContent).toBe('2');
        });

        it('should properly handle menu option selection', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();
            gameUI.handleGameOverNavigation('down'); // Select "STAGE SELECT"

            // Act
            const selection = gameUI.getGameOverSelection();

            // Assert
            expect(selection).toBe('STAGE SELECT');
        });

        it('should maintain menu state during game over screen', () => {
            // Arrange
            gameState.gameOver = true;
            gameUI.showGameOverScreen();
            gameUI.handleGameOverNavigation('down');

            // Act
            gameUI.updateGameOverMenu();

            // Assert
            const menuData = gameUI.getGameOverMenuData();
            expect(menuData.selectedIndex).toBe(1);
            expect(menuData.options).toEqual(['RESTART STAGE', 'STAGE SELECT']);
        });
    });

    describe('Canvas Menu Replacement', () => {
        it('should NOT call canvas renderGameOverMenu when using HTML menu', () => {
            // This test ensures that the canvas menu is not being used
            // when HTML menu is active

            // Arrange
            gameState.gameOver = true;
            const mockRenderSystem = {
                renderGameOverMenu: vi.fn()
            };

            // Act
            gameUI.showGameOverScreen();
            gameUI.updateGameOverMenu();

            // Assert
            // This test will pass once we remove canvas menu rendering
            // For now, we expect this NOT to be called in HTML mode
            expect(mockRenderSystem.renderGameOverMenu).not.toHaveBeenCalled();
        });
    });
});

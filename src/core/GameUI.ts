import type { GameState } from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';

/**
 * GameUI - Manages DOM elements and UI updates for the jumping dot game
 *
 * Responsibilities:
 * - DOM element management and updates
 * - Game status display
 * - Timer display
 * - Game over menu rendering coordination
 *
 * This class follows Single Responsibility Principle by handling only UI concerns.
 */
export class GameUI {
    private gameStatus: HTMLElement;
    private timerDisplay: HTMLElement;

    private deathDisplay: HTMLElement;

    // Game over menu state
    private gameOverMenuIndex = 0;
    private gameOverOptions = ['RESTART STAGE', 'STAGE SELECT'];

    constructor(private gameState: GameState) {
        this.gameStatus = this.getRequiredElement('gameStatus');
        this.timerDisplay = this.getRequiredElement('timer');

        this.deathDisplay = this.getRequiredElement('deathCount');

        // Listen for soul animation completion to update death count display
        if (typeof window !== 'undefined') {
            window.addEventListener('soulReachedCounter', () => {
                this.updateDeathCount();
            });
        }
    }

    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required DOM element with id "${id}" not found`);
        }
        return element;
    }

    /**
     * Update timer display based on current game time
     */
    updateTimer(): void {
        const gameStartTime = this.gameState.gameStartTime;
        if (gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;
            const timeRemaining = Math.max(0, this.gameState.timeLimit - elapsedSeconds);
            this.timerDisplay.textContent = `Time: ${Math.ceil(timeRemaining)}`;
        }
    }

    updateDeathCount(): void {
        this.deathDisplay.textContent = `Deaths: ${this.gameState.deathCount}`;
    }

    /**
     * Update initial UI state
     */
    updateInitialUI(): void {
        this.timerDisplay.textContent = `Time: ${this.gameState.timeLimit}`;

        this.updateDeathCount();
    }

    /**
     * Show loading state
     */
    showLoading(): void {
        this.gameStatus.textContent = 'Loading stage...';
    }

    /**
     * Show ready to start state
     */
    showReadyToStart(): void {
        this.gameStatus.textContent = 'Press SPACE to start';
    }

    /**
     * Show playing state
     */
    showPlaying(): void {
        this.gameStatus.textContent = 'Playing';
    }

    /**
     * Show player death message
     */
    showPlayerDeath(message: string): void {
        this.gameStatus.textContent = message;
        this.gameOverMenuIndex = 0; // Reset menu selection
    }

    /**
     * Show goal reached state
     */
    showGoalReached(): void {
        this.gameStatus.textContent = 'Goal reached!';
    }

    /**
     * Handle game over menu navigation
     */
    handleGameOverNavigation(direction: 'up' | 'down'): void {
        if (!this.gameState.gameOver) return;

        if (direction === 'up') {
            this.gameOverMenuIndex = Math.max(0, this.gameOverMenuIndex - 1);
        } else {
            this.gameOverMenuIndex = Math.min(
                this.gameOverOptions.length - 1,
                this.gameOverMenuIndex + 1
            );
        }

        console.log(`🎮 Game over menu selection: ${this.gameOverOptions[this.gameOverMenuIndex]}`);

        // Update HTML menu highlighting
        this.highlightMenuOption(this.gameOverMenuIndex);
    }

    /**
     * Get current game over menu selection
     */
    getGameOverSelection(): string {
        return this.gameOverOptions[this.gameOverMenuIndex];
    }

    /**
     * Get game over menu options for rendering
     */
    getGameOverMenuData(): { options: string[]; selectedIndex: number } {
        return {
            options: this.gameOverOptions,
            selectedIndex: this.gameOverMenuIndex
        };
    }

    /**
     * Hide/show game UI elements during different game states
     */
    updateUIVisibility(gameRunning: boolean, gameOver: boolean): void {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const deathInfo = this.deathDisplay.parentElement;

        if (gameRunning && !gameOver) {
            // Hide UI elements during gameplay
            if (startScreen) startScreen.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
            // Show death count during gameplay
            if (deathInfo) deathInfo.style.display = 'block';
        } else if (gameOver) {
            // Show death count on game over screen
            if (deathInfo) deathInfo.style.display = 'block';
        } else {
            // Hide death count on title screen
            if (deathInfo) deathInfo.style.display = 'none';
        }
        // Other states are handled by the render system
    }

    /**
     * Show start screen (moved from UIRenderer)
     */
    showStartScreen(): void {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.remove('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
    }

    /**
     * Show game over screen (moved from UIRenderer)
     */
    showGameOverScreen(): void {
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    }

    /**
     * Dispatch custom event for returning to stage select
     */
    requestStageSelect(): void {
        const event = new CustomEvent('requestStageSelect');
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(event);
        }
    }

    /**
     * Update HTML game over menu with current game state
     */
    updateGameOverMenu(): void {
        if (!this.gameState.gameOver) return;

        // Update death count in game over screen
        const gameOverDeathCount = document.getElementById('gameOverDeathCount');
        if (gameOverDeathCount) {
            gameOverDeathCount.textContent = this.gameState.deathCount.toString();
        }

        // Update menu selection highlighting
        this.highlightMenuOption(this.gameOverMenuIndex);
    }

    /**
     * Highlight the selected menu option in HTML
     */
    highlightMenuOption(selectedIndex: number): void {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (!gameOverScreen) return;

        const allOptions = gameOverScreen.querySelectorAll('.game-over-menu-option');
        allOptions.forEach((option, index) => {
            if (index === selectedIndex) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
}

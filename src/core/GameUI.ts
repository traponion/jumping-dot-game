import { getGameStore } from '../stores/GameZustandStore.js';
import { getCurrentTime } from '../utils/GameUtils.js';

/**
 * GameUI - Manages DOM elements and UI updates for the jumping dot game
 *
 * Responsibilities:
 * - DOM element management and updates
 * - Game status display
 * - Timer and score display
 * - Game over menu rendering coordination
 *
 * This class follows Single Responsibility Principle by handling only UI concerns.
 */
export class GameUI {
    private gameStatus: HTMLElement;
    private timerDisplay: HTMLElement;
    private scoreDisplay: HTMLElement;

    // Game over menu state
    private gameOverMenuIndex = 0;
    private gameOverOptions = ['RESTART STAGE', 'STAGE SELECT'];

    constructor() {
        this.gameStatus = this.getRequiredElement('gameStatus');
        this.timerDisplay = this.getRequiredElement('timer');
        this.scoreDisplay = this.getRequiredElement('score');
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
        const gameStartTime = getGameStore().game.gameStartTime;
        if (gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;
            const timeRemaining = Math.max(0, getGameStore().game.timeLimit - elapsedSeconds);
            this.timerDisplay.textContent = `Time: ${Math.ceil(timeRemaining)}`;
        }
    }

    /**
     * Update initial UI state
     */
    updateInitialUI(): void {
        this.timerDisplay.textContent = `Time: ${getGameStore().game.timeLimit}`;
        this.scoreDisplay.textContent = 'Score: 0';
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
     * Show goal reached state with score
     */
    showGoalReached(): void {
        const finalScore = Math.ceil(getGameStore().getTimeRemaining());
        this.gameStatus.textContent = `Goal reached! Score: ${finalScore}`;
        this.scoreDisplay.textContent = `Score: ${finalScore}`;
    }

    /**
     * Handle game over menu navigation
     */
    handleGameOverNavigation(direction: 'up' | 'down'): void {
        if (!getGameStore().isGameOver()) return;

        if (direction === 'up') {
            this.gameOverMenuIndex = Math.max(0, this.gameOverMenuIndex - 1);
        } else {
            this.gameOverMenuIndex = Math.min(
                this.gameOverOptions.length - 1,
                this.gameOverMenuIndex + 1
            );
        }

        console.log(`🎮 Game over menu selection: ${this.gameOverOptions[this.gameOverMenuIndex]}`);
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

        if (gameRunning && !gameOver) {
            // Hide UI elements during gameplay
            if (startScreen) startScreen.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
        }
        // Other states are handled by the render system
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
}

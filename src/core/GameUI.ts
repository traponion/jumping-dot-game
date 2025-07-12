import { getCurrentTime } from '../systems/PlayerSystem.js';
import type { GameState } from '../types/GameTypes.js';

/**
 * Stage Select Item interface
 */
export interface StageSelectItem {
    id: number;
    name: string;
    description: string;
}

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
}

/**
 * HTML/CSS-based Stage Select Component
 * Replaces the canvas-based StageSelect with semantic HTML implementation
 */
export class HtmlStageSelect {
    private stages: StageSelectItem[] = [
        { id: 1, name: 'STAGE 1', description: 'Basic tutorial stage' },
        { id: 2, name: 'STAGE 2', description: 'Moving platforms' }
    ];

    private selectedStageIndex = 0;
    private stageElements: HTMLElement[] = [];
    private boundHandleKeyboard: (e: KeyboardEvent) => void;
    private isActive = false;

    constructor() {
        this.boundHandleKeyboard = this.handleKeyboard.bind(this);
    }

    /**
     * Initialize and show the stage select interface
     */
    public init(): void {
        this.showStageSelect();
    }

    /**
     * Show stage selection interface
     */
    private showStageSelect(): void {
        this.isActive = true;
        this.selectedStageIndex = 0;

        // Get stage item elements - safe for test environment
        if (document?.querySelectorAll) {
            this.stageElements = Array.from(
                document.querySelectorAll('.stage-item')
            ) as HTMLElement[];
        } else {
            this.stageElements = [];
        }

        // Set up keyboard event listener - safe for test environment
        if (document?.addEventListener) {
            document.addEventListener('keydown', this.boundHandleKeyboard);
        }

        // Focus first stage by default
        if (this.stageElements.length > 0) {
            this.focusStage(0);
        }

        // Show stage select element
        this.showStageSelectElement();

        // Hide game UI elements
        this.hideGameElements();
    }

    /**
     * Hide stage selection interface
     */
    private hideStageSelect(): void {
        this.isActive = false;

        // Safe cleanup for test environment
        if (document?.removeEventListener) {
            document.removeEventListener('keydown', this.boundHandleKeyboard);
        }

        // Hide stage select element - safe for test environment
        const stageSelectElement = document?.getElementById
            ? document.getElementById('stageSelect')
            : null;
        if (stageSelectElement) {
            stageSelectElement.style.display = 'none';
        }
    }

    /**
     * Handle keyboard input for stage navigation
     */
    private handleKeyboard(e: KeyboardEvent): void {
        if (!this.isActive) return;

        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                this.navigateUp();
                break;

            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                this.navigateDown();
                break;

            case ' ':
            case 'Enter':
                e.preventDefault();
                this.selectCurrentStage();
                break;
        }
    }

    /**
     * Navigate to previous stage
     */
    private navigateUp(): void {
        const newIndex = Math.max(0, this.selectedStageIndex - 1);
        if (newIndex !== this.selectedStageIndex) {
            this.focusStage(newIndex);
        }
    }

    /**
     * Navigate to next stage
     */
    private navigateDown(): void {
        const newIndex = Math.min(this.stages.length - 1, this.selectedStageIndex + 1);
        if (newIndex !== this.selectedStageIndex) {
            this.focusStage(newIndex);
        }
    }

    /**
     * Focus specific stage by index
     */
    private focusStage(index: number): void {
        if (index >= 0 && index < this.stageElements.length) {
            this.selectedStageIndex = index;
            this.stageElements[index].focus();
        }
    }

    /**
     * Select currently focused stage
     */
    private selectCurrentStage(): void {
        const selectedStage = this.stages[this.selectedStageIndex];
        if (selectedStage) {
            this.startStage(selectedStage.id);
        }
    }

    /**
     * Start selected stage and initialize game
     */
    private async startStage(_stageId: number): Promise<void> {
        // Updated for Phase 3: Use standard DOM click event instead of custom event
        // Simulate click on the current stage element to trigger main.ts event handler
        const currentStageElement = this.stageElements[this.selectedStageIndex];
        if (currentStageElement) {
            // Use the simple click() method to trigger the event
            // This works reliably in both browser and test environments
            currentStageElement.click();
        }

        this.hideStageSelect();
        this.showGameElements();
    }

    /**
     * Return to stage selection from game
     */
    public async returnToStageSelect(): Promise<void> {
        this.showStageSelect();
    }

    /**
     * Show stage select element
     */
    private showStageSelectElement(): void {
        const stageSelectElement = document?.getElementById
            ? document.getElementById('stageSelect')
            : null;
        if (stageSelectElement) {
            stageSelectElement.style.display = 'block';
        }
    }

    /**
     * Hide game UI elements during stage selection
     */
    private hideGameElements(): void {
        const gameUI = document?.getElementById
            ? (document.getElementById('gameUI') as HTMLElement)
            : null;
        const info = document?.querySelector
            ? (document.querySelector('.info') as HTMLElement)
            : null;
        const controls = document?.querySelector
            ? (document.querySelector('.controls') as HTMLElement)
            : null;

        if (gameUI) gameUI.style.display = 'none';
        if (info) info.style.display = 'none';
        if (controls) controls.style.display = 'none';
    }

    /**
     * Show game UI elements when starting game
     */
    private showGameElements(): void {
        const gameUI = document?.getElementById
            ? (document.getElementById('gameUI') as HTMLElement)
            : null;
        const info = document?.querySelector
            ? (document.querySelector('.info') as HTMLElement)
            : null;
        const controls = document?.querySelector
            ? (document.querySelector('.controls') as HTMLElement)
            : null;

        if (gameUI) gameUI.style.display = 'block';
        if (info) info.style.display = 'block';
        if (controls) controls.style.display = 'block';
    }
}

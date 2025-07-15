import { getCurrentTime } from '../systems/PlayerSystem.js';
import type { GameState } from '../types/GameTypes.js';
import { StageLoader } from './StageLoader.js';

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
     * Select stage select option and return it
     */
    selectStageSelectOption(): string {
        this.gameOverMenuIndex = 1; // Set to STAGE SELECT
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
     * Shows the congratulations screen when player clears the stage
     * @param deathCount - Number of deaths during the stage
     */
    showClearScreen(deathCount: number): void {
        // Hide other screens and Stage display
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        const stageDisplay = document.querySelector('.stage-info');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
        if (stageDisplay) (stageDisplay as HTMLElement).style.display = 'none';

        // Create or update clear screen
        let clearScreen = document.getElementById('clearScreen');
        if (!clearScreen) {
            clearScreen = document.createElement('div');
            clearScreen.id = 'clearScreen';
            clearScreen.className = 'game-ui';
            clearScreen.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-family: monospace;
                text-align: center;
                z-index: 20;
                pointer-events: none;
                font-size: 24px;
            `;

            const gameContainer = document.querySelector('.game-container');
            if (gameContainer) {
                gameContainer.appendChild(clearScreen);
            }
        }

        // Update clear screen content
        clearScreen.innerHTML = `
            <div style="margin-bottom: 30px; font-size: 32px; color: #4CAF50;">🎉 CONGRATULATIONS! 🎉</div>
            <div style="margin-bottom: 20px; font-size: 20px;">STAGE CLEARED!</div>
            <div style="margin-bottom: 30px; font-size: 16px;">Deaths: ${deathCount}</div>
            <div style="margin-bottom: 10px; font-size: 16px;">[R] RETRY STAGE</div>
            <div style="font-size: 16px;">[SPACE] STAGE SELECT</div>
        `;

        // Show clear screen
        clearScreen.classList.remove('hidden');
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
    private stages: StageSelectItem[] = [];

    private selectedStageIndex = 0;
    private stageElements: HTMLElement[] = [];
    private boundHandleKeyboard: (e: KeyboardEvent) => void;
    private isActive = false;
    private stageLoader: StageLoader;

    constructor() {
        this.boundHandleKeyboard = this.handleKeyboard.bind(this);
        this.stageLoader = new StageLoader();
    }

    /**
     * Initialize and show the stage select interface
     */
    public async init(): Promise<void> {
        await this.discoverStages();
        this.showStageSelect();
    }

    /**
     * Dynamically discover available stages by trying to load them
     */
    private async discoverStages(): Promise<void> {
        this.stages = [];

        console.log('🔍 Starting stage discovery...');

        // Try to load stages starting from 1 (limited to 1-3 for now)
        for (let stageId = 1; stageId <= 3; stageId++) {
            try {
                console.log(`📋 Trying to load stage ${stageId}...`);
                const stageData = await this.stageLoader.loadStage(stageId);
                console.log(`✅ Successfully loaded stage ${stageId}:`, stageData.name);
                this.stages.push({
                    id: stageId,
                    name: stageData.name || `STAGE ${stageId}`,
                    description: stageData.description || `Stage ${stageId}`
                });
            } catch (error) {
                console.log(`❌ Failed to load stage ${stageId}:`, error);
                // Stage not found, stop searching
                break;
            }
        }

        console.log(`🎯 Discovery complete. Found ${this.stages.length} stages:`, this.stages);

        // Fallback to ensure at least stage 1 exists
        if (this.stages.length === 0) {
            this.stages.push({
                id: 1,
                name: 'STAGE 1',
                description: 'Basic tutorial stage'
            });
        }
    }

    /**
     * Generate stage HTML elements dynamically based on discovered stages
     */
    private generateStageElements(): void {
        // Find the stage list container
        const stageListContainer = document.querySelector('.stage-list');
        if (!stageListContainer) {
            console.error('Stage list container not found');
            return;
        }

        // Clear existing stage items
        stageListContainer.innerHTML = '';

        // Generate stage items for each discovered stage
        this.stageElements = [];
        for (const stage of this.stages) {
            const stageItem = document.createElement('div');
            stageItem.className = 'stage-item';
            stageItem.setAttribute('data-stage-id', stage.id.toString());
            stageItem.setAttribute('role', 'menuitem');
            stageItem.setAttribute('tabindex', '0');

            const stageName = document.createElement('div');
            stageName.className = 'stage-name';
            stageName.textContent = stage.name;

            const stageDescription = document.createElement('div');
            stageDescription.className = 'stage-description';
            stageDescription.textContent = stage.description;

            stageItem.appendChild(stageName);
            stageItem.appendChild(stageDescription);
            stageListContainer.appendChild(stageItem);

            this.stageElements.push(stageItem);
        }

        console.log(`🎮 Generated ${this.stageElements.length} stage elements`);
    }

    /**
     * Show stage selection interface
     */
    private showStageSelect(): void {
        this.isActive = true;
        this.selectedStageIndex = 0;

        // Generate stage HTML elements dynamically
        this.generateStageElements();

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
    /**
     * Start selected stage and initialize game
     * Canvas Readiness Synchronization: Wait for Canvas initialization before switching UI elements
     */
    private async startStage(stageId: number): Promise<void> {
        try {
            // Step 1: Start game initialization (but keep current UI visible)
            // Import and call startGame directly for Promise-based coordination
            const { startGame } = await import('../main.js');

            // Step 2: Wait for Canvas to be ready before switching UI
            await startGame(stageId);

            // Step 3: Now safely switch UI (Canvas is guaranteed ready)
            this.hideStageSelect();
            this.showGameElements();
        } catch (error) {
            console.error('Canvas initialization failed during stage start:', error);

            // Error handling: Keep stage select visible for user to retry
            // Do not switch UI if Canvas initialization failed
            // User can try selecting stage again

            // Optional: Could show error message to user here
            // For now, just log the error and maintain current UI state
        }
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

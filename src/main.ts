/**
 * @fileoverview Main entry point for the jumping dot game application
 * @module main
 * @description Application Layer - Provides stage selection UI and game initialization.
 * Implements a stage selection screen with keyboard navigation and game instance management.
 */

import { JumpingDotGame } from './core/Game.js';

/**
 * Window interface extension for global StageSelect access
 * @interface Window
 * @property {StageSelect} stageSelect - Global stage select instance
 */
declare global {
    interface Window {
        stageSelect: StageSelect;
    }
}

/**
 * Stage Selection interface for navigation and display
 * @interface StageSelectItem
 * @property {number} id - Unique stage identifier
 * @property {string} name - Display name for the stage
 * @property {string} description - Brief description of stage content
 */
interface StageSelectItem {
    id: number;
    name: string;
    description: string;
}

/**
 * Stage Select functionality with Canvas rendering
 * @class StageSelect
 * @description Manages stage selection interface with keyboard navigation and game launching
 */
class StageSelect {
    /** @private {JumpingDotGame | null} Current game instance */
    private gameInstance: JumpingDotGame | null = null;
    /** @private {HTMLElement} Stage select screen element */
    private stageSelectElement: HTMLElement;
    /** @private {HTMLElement} Stage list container element */
    private stageListElement: HTMLElement;
    /** @private {number} Currently selected stage index */
    private selectedStageIndex = 0;
    /** @private {StageSelectItem[]} Available stages for selection */
    private stages: StageSelectItem[] = [
        { id: 1, name: 'STAGE 1', description: 'Basic tutorial stage' },
        { id: 2, name: 'STAGE 2', description: 'Moving platforms' }
    ];

    /** @private {Function} Bound keyboard event handler */
    private boundHandleKeyboard: (e: KeyboardEvent) => void;

    /**
     * Creates a new StageSelect instance
     * @constructor
     * @description Initializes DOM elements and event listeners
     */
    constructor() {
        const stageSelectElement = document.getElementById('stageSelectScreen');
        if (!stageSelectElement) {
            throw new Error('Stage select screen element not found');
        }
        this.stageSelectElement = stageSelectElement;

        const stageListElement = this.stageSelectElement.querySelector('.stage-list');
        if (!stageListElement) {
            throw new Error('Stage list element not found');
        }
        this.stageListElement = stageListElement as HTMLElement;

        this.boundHandleKeyboard = this.handleKeyboard.bind(this);

        // Listen for custom event from Game
        window.addEventListener('requestStageSelect', () => {
            this.returnToStageSelect();
        });
    }

    /**
     * Initialize stage selection interface
     * @async
     * @returns {Promise<void>} Promise that resolves when initialization is complete
     */
    async init(): Promise<void> {
        this.showStageSelect();
    }

    /**
     * Show stage selection interface
     * @private
     * @returns {void}
     * @description Activates stage select UI, hides game elements
     */
    private showStageSelect(): void {
        this.selectedStageIndex = 0;
        document.addEventListener('keydown', this.boundHandleKeyboard);
        this.updateSelection();

        // Show stage select screen
        this.stageSelectElement.style.display = 'flex';

        // Hide game UI elements
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;
        const startScreen = document.getElementById('startScreen') as HTMLElement;
        const gameOverScreen = document.getElementById('gameOverScreen') as HTMLElement;

        if (gameUI) gameUI.style.display = 'block';
        if (info) info.style.display = 'none';
        if (controls) controls.style.display = 'none';
        if (startScreen) startScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
    }

    /**
     * Hide stage selection interface
     * @private
     * @returns {void}
     * @description Deactivates stage select UI
     */
    private hideStageSelect(): void {
        document.removeEventListener('keydown', this.boundHandleKeyboard);
        this.stageSelectElement.style.display = 'none';
    }

    /**
     * Update selection indicator in DOM
     * @private
     * @returns {void}
     * @description Updates selected class on stage items
     */
    private updateSelection(): void {
        const stageItems = this.stageListElement.querySelectorAll('.stage-item');
        stageItems.forEach((item, index) => {
            if (index === this.selectedStageIndex) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Handle keyboard input for stage navigation
     * @private
     * @param {KeyboardEvent} e - Keyboard event to process
     * @returns {void}
     * @description Processes arrow keys for navigation, space/enter for selection
     */
    private handleKeyboard(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                this.selectedStageIndex = Math.max(0, this.selectedStageIndex - 1);
                this.updateSelection();
                break;

            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                this.selectedStageIndex = Math.min(
                    this.stages.length - 1,
                    this.selectedStageIndex + 1
                );
                this.updateSelection();
                break;

            case ' ':
            case 'Enter': {
                e.preventDefault();
                const selectedStage = this.stages[this.selectedStageIndex];
                if (selectedStage) {
                    this.startStage(selectedStage.id);
                }
                break;
            }

            // Editor functionality removed
        }
    }

    /**
     * Start selected stage and initialize game
     * @private
     * @async
     * @param {number} stageId - ID of stage to start
     * @returns {Promise<void>} Promise that resolves when stage starts
     * @description Hides stage select, shows game UI, creates and initializes game instance
     */
    private async startStage(stageId: number): Promise<void> {
        this.hideStageSelect();

        // Properly cleanup existing game instance before creating new one
        if (this.gameInstance) {
            await this.gameInstance.cleanup();
            this.gameInstance = null;
        }

        // Show game UI elements
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;

        if (gameUI) gameUI.style.display = 'block';
        if (info) info.style.display = 'block';
        if (controls) controls.style.display = 'block';

        try {
            // Create new game instance
            this.gameInstance = new JumpingDotGame();
            await this.gameInstance.initWithStage(stageId);
        } catch (error) {
            console.error(`❌ Failed to start stage ${stageId}:`, error);
        }
    }

    /**
     * Return to stage selection from game
     * @public
     * @async
     * @returns {Promise<void>} Promise that resolves when stage select is shown
     * @description Cleans up current game instance and shows stage selection interface
     */
    public async returnToStageSelect(): Promise<void> {
        // Cleanup game
        if (this.gameInstance) {
            await this.gameInstance.cleanup();
            this.gameInstance = null;
        }

        this.showStageSelect();
    }
}

/**
 * Global stage select instance
 * @type {StageSelect | null}
 * @description Single instance of stage selection manager
 */
let stageSelect: StageSelect | null = null;

/**
 * Initialize stage select when page loads
 * @description Creates and initializes stage selection interface on window load
 */
window.addEventListener('load', async () => {
    stageSelect = new StageSelect();
    await stageSelect.init();

    // Export for global access
    window.stageSelect = stageSelect;
});

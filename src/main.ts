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
    /** @private {HTMLCanvasElement} Main canvas element for rendering */
    private canvas: HTMLCanvasElement;
    /** @private {CanvasRenderingContext2D} 2D rendering context */
    private ctx: CanvasRenderingContext2D;
    /** @private {number} Currently selected stage index */
    private selectedStageIndex = 0;
    /** @private {StageSelectItem[]} Available stages for selection */
    private stages: StageSelectItem[] = [
        { id: 1, name: 'STAGE 1', description: 'Basic tutorial stage' },
        { id: 2, name: 'STAGE 2', description: 'Moving platforms' }
    ];
    /** @private {number | null} Current animation frame ID */
    private animationId: number | null = null;
    /** @private {boolean} Whether stage select is currently active */
    private isActive = false;
    /** @private {Function} Bound keyboard event handler */
    private boundHandleKeyboard: (e: KeyboardEvent) => void;

    /**
     * Creates a new StageSelect instance
     * @constructor
     * @description Initializes canvas, context, and event listeners
     */
    constructor() {
        this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
        const context = this.canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context from canvas');
        }
        this.ctx = context;
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
     * @description Activates stage select UI, hides game elements, starts render loop
     */
    private showStageSelect(): void {
        this.isActive = true;
        this.selectedStageIndex = 0;
        document.addEventListener('keydown', this.boundHandleKeyboard);
        this.startRenderLoop();

        // Hide game UI elements
        const gameUI = document.getElementById('gameUI') as HTMLElement;
        const info = document.querySelector('.info') as HTMLElement;
        const controls = document.querySelector('.controls') as HTMLElement;

        if (gameUI) gameUI.style.display = 'none';
        if (info) info.style.display = 'none';
        if (controls) controls.style.display = 'none';
    }

    /**
     * Hide stage selection interface
     * @private
     * @returns {void}
     * @description Deactivates stage select UI and stops render loop
     */
    private hideStageSelect(): void {
        this.isActive = false;
        document.removeEventListener('keydown', this.boundHandleKeyboard);
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Handle keyboard input for stage navigation
     * @private
     * @param {KeyboardEvent} e - Keyboard event to process
     * @returns {void}
     * @description Processes arrow keys for navigation, space/enter for selection, E for editor
     */
    private handleKeyboard(e: KeyboardEvent): void {
        switch (e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                e.preventDefault();
                this.selectedStageIndex = Math.max(0, this.selectedStageIndex - 1);
                break;

            case 'ArrowDown':
            case 'ArrowRight':
                e.preventDefault();
                this.selectedStageIndex = Math.min(
                    this.stages.length - 1,
                    this.selectedStageIndex + 1
                );
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

            case 'e':
            case 'E':
                e.preventDefault();
                window.open('/editor.html', '_blank');
                break;
        }
    }

    /**
     * Start the rendering animation loop
     * @private
     * @returns {void}
     * @description Initiates requestAnimationFrame loop for stage select rendering
     */
    private startRenderLoop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        const render = () => {
            if (this.isActive) {
                this.render();
                this.animationId = requestAnimationFrame(render);
            }
        };

        this.animationId = requestAnimationFrame(render);
    }

    /**
     * Render stage selection interface to canvas
     * @private
     * @returns {void}
     * @description Draws title, stage list with selection indicator, and instructions
     */
    private render(): void {
        // Clear canvas
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set drawing style
        this.ctx.font = '32px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = 'white';

        // Title
        this.ctx.fillText('JUMPING DOT GAME', this.canvas.width / 2, 100);

        // Subtitle
        this.ctx.font = '16px monospace';
        this.ctx.fillText('SELECT STAGE', this.canvas.width / 2, 140);

        // Render stage list
        const startY = 200;
        const itemHeight = 60;

        this.stages.forEach((stage, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === this.selectedStageIndex;

            // Selection indicator
            if (isSelected) {
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(150, y - 20, this.canvas.width - 300, 40);
                this.ctx.fillStyle = 'black';
            } else {
                this.ctx.fillStyle = 'white';
            }

            // Stage name
            this.ctx.font = '24px monospace';
            this.ctx.fillText(stage.name, this.canvas.width / 2, y);

            // Stage description
            this.ctx.font = '14px monospace';
            this.ctx.fillText(stage.description, this.canvas.width / 2, y + 20);
        });

        // Instructions
        this.ctx.fillStyle = '#aaa';
        this.ctx.font = '14px monospace';
        this.ctx.fillText(
            '↑↓ Navigate  SPACE Select  E Editor',
            this.canvas.width / 2,
            this.canvas.height - 50
        );
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

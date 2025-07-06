/**
 * @fileoverview Main entry point for the jumping dot game application
 * @module main
 * @description Application Layer - Provides stage selection UI and game initialization.
 * Implements a stage selection screen with keyboard navigation and game instance management.
 */

import { JumpingDotGame } from './core/Game.js';
import { HtmlStageSelect } from './core/HtmlStageSelect.js';

/**
 * Window interface extension for global StageSelect access
 * @interface Window
 * @property {HtmlStageSelect} stageSelect - Global stage select instance
 */
declare global {
    interface Window {
        stageSelect: HtmlStageSelect;
    }
}

/**
 * Global stage select instance
 * @type {HtmlStageSelect | null}
 * @description Single instance of stage selection manager
 */
let stageSelect: HtmlStageSelect | null = null;

/**
 * Initialize stage select when page loads
 * @description Creates and initializes stage selection interface on window load
 */
window.addEventListener('load', async () => {
    stageSelect = new HtmlStageSelect();
    await stageSelect.init();

    // Set up stage selection event listener
    document.addEventListener('stageSelected', async (event: Event) => {
        const customEvent = event as CustomEvent;
        const { stageId } = customEvent.detail;
        await startGame(stageId);
    });

    // Export for global access
    window.stageSelect = stageSelect;
});

/**
 * Start game with selected stage
 * @param {number} stageId - ID of stage to start
 */
async function startGame(stageId: number): Promise<void> {
    try {
        // Create new game instance
        const gameInstance = new JumpingDotGame();
        await gameInstance.initWithStage(stageId);

        // Set up game over navigation back to stage select
        gameInstance.setGameOver = () => {
            if (stageSelect) {
                stageSelect.returnToStageSelect();
            }
        };
    } catch (error) {
        console.error(`❌ Failed to start stage ${stageId}:`, error);
    }
}

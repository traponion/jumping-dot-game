/**
 * @fileoverview Simplified main entry point for the jumping dot game application
 * @module main
 * @description Simple application bootstrapping with standard DOM events
 */

import { JumpingDotGame } from './core/Game.js';
import { HtmlStageSelect } from './core/HtmlStageSelect.js';

/**
 * Current stage select instance
 * @type {HtmlStageSelect | null}
 */
let stageSelect: HtmlStageSelect | null = null;

/**
 * Initialize application when page loads
 */
window.addEventListener('load', async () => {
    // Initialize stage select
    stageSelect = new HtmlStageSelect();
    await stageSelect.init();

    // Set up requestStageSelect event listener for Game Over → Stage Select navigation
    window.addEventListener('requestStageSelect', () => {
        if (stageSelect) {
            stageSelect.returnToStageSelect();
        }
    });

    // Set up stage selection through event delegation
    document.addEventListener('click', async (event: Event) => {
        const target = event.target as HTMLElement;
        const stageId = target.getAttribute('data-stage-id');

        if (stageId && target.classList.contains('stage-item')) {
            await startGame(Number.parseInt(stageId));
        }
    });
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

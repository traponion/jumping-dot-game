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
 * Current game instance
 * @type {JumpingDotGame | null}
 */
let currentGame: JumpingDotGame | null = null;

/**
 * Initialize application when page loads
 */
window.addEventListener('load', async () => {
    // Initialize stage select
    stageSelect = new HtmlStageSelect();
    await stageSelect.init();

    // Set up requestStageSelect event listener for Game Over → Stage Select navigation
    window.addEventListener('requestStageSelect', async () => {
        // Clean up current game instance first to prevent canvas reinitialization errors
        if (currentGame) {
            try {
                await currentGame.cleanup();
            } catch (error) {
                console.error('Error during game cleanup:', error);
            } finally {
                currentGame = null;
            }
        }

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
        // Clean up previous game instance if exists
        if (currentGame) {
            try {
                await currentGame.cleanup();
            } catch (error) {
                console.error('Error during previous game cleanup:', error);
            }
        }

        // Create new game instance
        currentGame = new JumpingDotGame();
        await currentGame.initWithStage(stageId);

        // Set up game over navigation back to stage select
        currentGame.setGameOver = () => {
            if (stageSelect) {
                stageSelect.returnToStageSelect();
            }
        };
    } catch (error) {
        console.error(`❌ Failed to start stage ${stageId}:`, error);
        currentGame = null;
    }
}

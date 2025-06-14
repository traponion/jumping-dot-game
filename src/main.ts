import { JumpingDotGame } from './core/Game.js';

// Start the game when page loads
window.addEventListener('load', async () => {
    const game = new JumpingDotGame();
    await game.init();
});

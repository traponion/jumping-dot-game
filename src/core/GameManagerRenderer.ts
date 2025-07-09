import type { GameState } from '../stores/GameState.js';
import type { AnimationSystem } from '../systems/AnimationSystem.js';
import type { IRenderSystem } from '../systems/IRenderSystem.js';
import type { PlayerSystem } from '../systems/PlayerSystem.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import type { GameUI } from './GameUI.js';
import type { StageData } from './StageLoader.js';

export class GameManagerRenderer {
    private gameState: GameState;
    private renderSystem: IRenderSystem;
    private animationSystem: AnimationSystem;
    private playerSystem: PlayerSystem;

    constructor(
        gameState: GameState,
        renderSystem: IRenderSystem,
        animationSystem: AnimationSystem,
        playerSystem: PlayerSystem
    ) {
        this.gameState = gameState;
        this.renderSystem = renderSystem;
        this.animationSystem = animationSystem;
        this.playerSystem = playerSystem;
    }

    render(ui?: GameUI, stage?: StageData): void {
        const renderer = this.renderSystem;

        renderer.clearCanvas();
        renderer.setDrawingStyle();
        renderer.applyCameraTransform(this.gameState.runtime.camera);

        if (stage) {
            renderer.renderStage(stage);
        }

        renderer.renderDeathMarks(this.gameState.runtime.deathMarks);

        if (this.gameState.gameRunning && !this.gameState.gameOver) {
            const player = this.gameState.runtime.player;
            renderer.renderTrail(this.playerSystem.getTrail(), player.radius);
            renderer.renderLandingPredictions();
            renderer.renderPlayer(player);
        }

        const deathAnim = this.animationSystem.getDeathAnimation();
        if (deathAnim.active) {
            renderer.renderDeathAnimation(deathAnim.particles);
        }

        const soulAnim = this.animationSystem.getSoulAnimation();
        if (soulAnim.active) {
            renderer.renderSoulAnimation(soulAnim.particles);
        }

        const clearAnim = this.animationSystem.getClearAnimation();
        if (clearAnim.active && clearAnim.startTime) {
            const elapsed = getCurrentTime() - clearAnim.startTime;
            const progress = elapsed / clearAnim.duration;
            const player = this.gameState.runtime.player;
            renderer.renderClearAnimation(clearAnim.particles, progress, player.x, player.y);
        }

        renderer.restoreCameraTransform();

        // UI state-based rendering - consolidated in GameManager
        if (this.gameState.gameOver) {
            if (ui) {
                const menuData = ui.getGameOverMenuData();
                renderer.renderGameOverMenu(
                    menuData.options,
                    menuData.selectedIndex,
                    this.gameState.finalScore,
                    this.gameState.deathCount
                );
            }
        } else if (!this.gameState.gameRunning) {
            ui?.showStartScreen();
        }

        renderer.renderCredits();

        // All rendering commands completed, now render everything
        renderer.renderAll();
    }

    renderGameOverMenu(ui: GameUI): void {
        const menuData = ui.getGameOverMenuData();
        this.renderSystem.renderGameOverMenu(
            menuData.options,
            menuData.selectedIndex,
            this.gameState.finalScore,
            this.gameState.deathCount
        );
    }
}

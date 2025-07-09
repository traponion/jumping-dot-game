import type { GameState } from '../stores/GameState.js';
import type { GameSystems } from './GameManagerInitialization.js';
import type { StageData, StageLoader } from './StageLoader.js';

export class GameManagerCore {
    private gameState: GameState;
    private systems: GameSystems;
    private stageLoader: StageLoader;

    constructor(gameState: GameState, systems: GameSystems, stageLoader: StageLoader) {
        this.gameState = gameState;
        this.systems = systems;
        this.stageLoader = stageLoader;
    }

    update(deltaTime: number): void {
        if (!this.gameState.gameRunning || this.gameState.gameOver) {
            this.systems.animationSystem.updateClearAnimation();
            this.systems.animationSystem.updateDeathAnimation();
            this.systems.animationSystem.updateSoulAnimation();
            return;
        }

        this.updateSystems(deltaTime);
        this.systems.collisionSystem.update();
        this.systems.gameRuleSystem.update();
        this.systems.cameraSystem.update();
    }

    private updateSystems(deltaTime: number): void {
        // Update input manager
        this.systems.inputManager.update();

        const physicsConstants = this.systems.physicsSystem.getPhysicsConstants();
        this.systems.playerSystem.update(deltaTime, physicsConstants);

        this.systems.physicsSystem.update(deltaTime);

        // Update moving platforms if stage has them
        this.systems.movingPlatformSystem.update(deltaTime);

        this.systems.animationSystem.updateClearAnimation();
        this.systems.animationSystem.updateDeathAnimation();
        this.systems.animationSystem.updateSoulAnimation();
    }

    async loadStage(stageId: number): Promise<StageData> {
        const stage = await this.stageLoader.loadStageWithFallback(stageId);

        // Sync stage to GameState for CollisionSystem access
        this.gameState.stage = stage;

        // Set time limit from stage data
        if (stage.timeLimit) {
            this.gameState.timeLimit = stage.timeLimit;
        }
        this.gameState.timeRemaining = this.gameState.timeLimit;

        return stage;
    }

    async resetGameState(): Promise<StageData> {
        // Reset game state
        this.gameState.gameRunning = false;
        this.gameState.gameOver = false;
        this.gameState.finalScore = 0;
        this.gameState.deathCount = 0;
        this.gameState.runtime.deathMarks = [];

        // Reset player trail and jump timer
        this.systems.playerSystem.clearTrail();
        this.systems.playerSystem.resetJumpTimer();

        // Reset player position to initial coordinates
        this.systems.playerSystem.reset(100, 300);

        // Reload current stage to reset stage state
        const stage = await this.loadStage(this.gameState.currentStage);

        return stage;
    }

    async cleanup(): Promise<void> {
        this.systems.inputManager.cleanup();

        // Cleanup render system to prevent canvas reinitialization issues
        await this.systems.renderSystem.cleanup();

        this.gameState.gameOver = true;
    }
}

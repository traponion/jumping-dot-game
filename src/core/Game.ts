import { DEFAULT_PHYSICS_CONSTANTS, GAME_CONFIG } from '../constants/GameConstants.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { InputManager } from '../systems/InputManager.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import { FabricRenderSystem } from '../systems/FabricRenderSystem.js';
import { createRenderSystem } from '../systems/RenderSystemFactory.js';
import type { GameState, PhysicsConstants } from '../types/GameTypes.js';
import { gameStore, getGameStore } from '../stores/GameZustandStore.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import { type StageData, StageLoader } from './StageLoader.js';

export class JumpingDotGame {
    private canvas: HTMLCanvasElement;
    private gameStatus: HTMLElement;
    private timerDisplay: HTMLElement;
    private scoreDisplay: HTMLElement;

    // Game over menu state
    private gameOverMenuIndex = 0;
    private gameOverOptions = ['RESTART STAGE', 'STAGE SELECT'];

    // Systems
    private playerSystem!: PlayerSystem;
    private physicsSystem!: PhysicsSystem;
    private collisionSystem!: CollisionSystem;
    private animationSystem!: AnimationSystem;
    private renderSystem!: FabricRenderSystem | import('../systems/MockRenderSystem.js').MockRenderSystem;
    private inputManager!: InputManager;

    // Stage
    private stageLoader!: StageLoader;
    private stage: StageData | null = null;

    // Game loop
    private lastTime: number | null = null;
    private animationId: number | null = null;
    private isCleanedUp = false;

    private prevPlayerY: number = 0;

    constructor() {
        this.canvas = this.getRequiredElement('gameCanvas') as HTMLCanvasElement;
        this.gameStatus = this.getRequiredElement('gameStatus');
        this.timerDisplay = this.getRequiredElement('timer');
        this.scoreDisplay = this.getRequiredElement('score');

        this.initializeEntities();
        this.initializeSystems();
    }


    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required DOM element with id "${id}" not found`);
        }
        return element;
    }

    private initializeEntities(): void {
        // Initialize Zustand store with default values
        gameStore.getState().reset();
        gameStore.getState().setCurrentStage(1);
        gameStore.getState().updateTimeRemaining(10);
        gameStore.getState().updatePlayer({
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: GAME_CONFIG.player.defaultRadius,
            grounded: false
        });
        gameStore.getState().updateCamera({ x: 0, y: 0 });

        this.stageLoader = new StageLoader();
    }

    private initializeSystems(): void {
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        this.physicsSystem = new PhysicsSystem(physicsConstants);
        this.collisionSystem = new CollisionSystem();
        this.animationSystem = new AnimationSystem();
        // Environment-aware rendering system
        this.renderSystem = createRenderSystem(this.canvas);
        
        // Initialize InputManager with canvas and game controller
        this.inputManager = new InputManager(this.canvas, this);
        
        // Initialize PlayerSystem with InputManager
        this.playerSystem = new PlayerSystem(getGameStore().getPlayer());
        this.playerSystem.setInputManager(this.inputManager);
    }

    async init(): Promise<void> {
        this.isCleanedUp = false; // Reset cleanup flag
        this.gameStatus.textContent = 'Loading stage...';

        await this.loadStage(getGameStore().getCurrentStage());

        this.gameStatus.textContent = 'Press SPACE to start';
        this.resetGameState();
        this.updateUI();

        // 最後にもう一度確実にキーをクリア
        setTimeout(() => {
            this.inputManager.clearInputs();
        }, 0);

        this.startGameLoop();
    }

    async initWithStage(stageId: number): Promise<void> {
        gameStore.getState().setCurrentStage(stageId);
        this.gameStatus.textContent = 'Loading stage...';

        await this.loadStage(stageId);

        this.gameStatus.textContent = 'Press SPACE to start';
        this.resetGameState();
        this.updateUI();

        // 最後にもう一度確実にキーをクリア
        setTimeout(() => {
            this.inputManager.clearInputs();
        }, 0);

        this.startGameLoop();
    }

    private async loadStage(stageNumber: number): Promise<void> {
        try {
            this.stage = await this.stageLoader.loadStageWithFallback(stageNumber);
        } catch (error) {
            console.error('Failed to load stage:', error);
            this.stage = this.stageLoader.getHardcodedStage(1);
        }
    }

    private resetGameState(): void {
        gameStore.getState().stopGame();
        gameStore.getState().updateTimeRemaining(getGameStore().game.timeLimit);
        gameStore.getState().restartGame();

        this.playerSystem.reset(100, 400);
        this.animationSystem.reset();

        gameStore.getState().updateCamera({ x: 0, y: 0 });

        // まずキーをクリアしてからゲーム状態を変更
        this.inputManager.clearInputs();

        this.lastTime = null;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    private updateUI(): void {
        this.timerDisplay.textContent = `Time: ${getGameStore().game.timeLimit}`;
        this.scoreDisplay.textContent = 'Score: 0';
    }

    public startGame(): void {
        gameStore.getState().startGame();
        this.gameStatus.textContent = 'Playing';
        // ゲーム開始時に強力にキーをクリア
        this.inputManager.clearInputs();
    }

    private startGameLoop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    private gameLoop(currentTime: number): void {
        if (this.lastTime === null) {
            this.lastTime = currentTime;
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }

        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        const clampedDelta = Math.min(deltaTime, 16.67 * 2);

        this.update(clampedDelta);
        this.render();

        this.prevPlayerY = getGameStore().getPlayer().y;

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    private update(deltaTime: number): void {
        if (!getGameStore().isGameRunning() || getGameStore().isGameOver()) {
            this.animationSystem.updateClearAnimation();
            this.animationSystem.updateDeathAnimation();
            return;
        }

        this.updateTimer();
        this.updateSystems(deltaTime);
        this.handleCollisions();
        this.updateCamera();
        this.checkBoundaries();
        this.updateLandingPredictions();
    }

    private updateLandingPredictions(): void {
        if (!this.stage) return;
        
        // Simple input-based prediction that grows from landing spot
        const inputKeys = this.inputManager.getMovementState();
        const futureDistance = this.calculateFutureMovement(inputKeys);
        const predictedX = getGameStore().getPlayer().x + futureDistance;
        
        // Find the platform closest to predicted position
        const targetPlatform = this.findNearestPlatform(predictedX);
        
        if (targetPlatform) {
            const simplePrediction = [{
                x: predictedX,
                y: targetPlatform.y1,
                confidence: 0.8,
                jumpNumber: 1
            }];
            this.renderSystem.setLandingPredictions(simplePrediction);
        } else {
            this.renderSystem.setLandingPredictions([]);
        }
    }

    private calculateFutureMovement(keys: any): number {
        // Estimate future movement for one jump (more realistic timing)
        const jumpDuration = 400; // Shorter, more realistic jump duration
        const baseMovement = getGameStore().getPlayer().vx * (jumpDuration / 16.67); // Movement during jump
        
        // Add smaller input-based movement
        let inputMovement = 0;
        if (keys.ArrowLeft) {
            inputMovement = -30; // Smaller left movement
        } else if (keys.ArrowRight) {
            inputMovement = 30; // Smaller right movement
        }
        
        return baseMovement + inputMovement;
    }

    private findNearestPlatform(targetX: number): any {
        if (!this.stage) return null;
        
        // Find platform that the player would likely land on
        let bestPlatform = null;
        let bestDistance = Infinity;
        
        for (const platform of this.stage.platforms) {
            // Check if target X is within platform bounds or nearby
            const platformCenterX = (platform.x1 + platform.x2) / 2;
            const distance = Math.abs(targetX - platformCenterX);
            
            if (distance < bestDistance && 
                targetX >= platform.x1 - 30 && 
                targetX <= platform.x2 + 30) {
                bestDistance = distance;
                bestPlatform = platform;
            }
        }
        
        return bestPlatform;
    }

    private updateTimer(): void {
        const gameStartTime = getGameStore().game.gameStartTime;
        if (gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;
            const timeRemaining = Math.max(0, getGameStore().game.timeLimit - elapsedSeconds);
            gameStore.getState().updateTimeRemaining(timeRemaining);

            if (timeRemaining <= 0) {
                this.handlePlayerDeath('Time Up! Press R to restart');
                return;
            }

            this.timerDisplay.textContent = `Time: ${Math.ceil(timeRemaining)}`;
        }
    }

    private updateSystems(deltaTime: number): void {
        // Update input manager
        this.inputManager.update();

        const physicsConstants = this.physicsSystem.getPhysicsConstants();
        this.playerSystem.update(deltaTime, physicsConstants);
        this.playerSystem.clampSpeed(physicsConstants.moveSpeed);

        this.physicsSystem.update(getGameStore().getPlayer(), deltaTime);

        this.animationSystem.updateClearAnimation();
        this.animationSystem.updateDeathAnimation();
    }

    private handleCollisions(): void {
        if (!this.stage) return;

        const player = getGameStore().getPlayer();
        const prevPlayerFootY = this.prevPlayerY + player.radius;

        const platformCollision = this.collisionSystem.handlePlatformCollisions(
            player,
            this.stage.platforms,
            prevPlayerFootY
        );

        if (platformCollision) {
            this.playerSystem.resetJumpTimer();
            // Add landing history marker
            this.renderSystem.addLandingHistory(player.x, player.y + player.radius);
        }

        if (this.collisionSystem.checkSpikeCollisions(player, this.stage.spikes)) {
            this.handlePlayerDeath('Hit by spike! Press R to restart');
            return;
        }

        if (this.collisionSystem.checkGoalCollision(player, this.stage.goal)) {
            this.handleGoalReached();
            return;
        }
    }

    private updateCamera(): void {
        const player = getGameStore().getPlayer();
        gameStore.getState().updateCamera({ x: player.x - this.canvas.width / 2, y: getGameStore().getCamera().y });
    }

    private checkBoundaries(): void {
        const player = getGameStore().getPlayer();
        if (this.collisionSystem.checkHoleCollision(player, 600)) {
            this.handlePlayerDeath('Fell into hole! Press R to restart', 'fall');
        } else if (this.collisionSystem.checkBoundaryCollision(player, this.canvas.height)) {
            this.handlePlayerDeath('Game Over - Press R to restart', 'fall');
        }
    }

    private handlePlayerDeath(message: string, deathType = 'normal'): void {
        gameStore.getState().gameOver();
        this.gameOverMenuIndex = 0; // Reset menu selection
        this.gameStatus.textContent = message;

        const player = getGameStore().getPlayer();
        const camera = getGameStore().getCamera();
        let deathMarkY = player.y;
        if (deathType === 'fall') {
            deathMarkY = camera.y + this.canvas.height - 20;
        }

        this.animationSystem.addDeathMark(player.x, deathMarkY);
        this.animationSystem.startDeathAnimation(player);
        this.playerSystem.clearTrail();
    }

    private handleGoalReached(): void {
        gameStore.getState().gameOver();
        const finalScore = Math.ceil(getGameStore().getTimeRemaining());
        gameStore.getState().setFinalScore(finalScore);
        this.gameStatus.textContent = `Goal reached! Score: ${finalScore}`;
        this.scoreDisplay.textContent = `Score: ${finalScore}`;

        this.animationSystem.startClearAnimation(getGameStore().getPlayer());
        
        // Auto-return to stage select after clear animation
        setTimeout(() => {
            this.returnToStageSelect();
        }, 3000);
    }

    public returnToStageSelect(): void {
        // Dispatch custom event instead of direct window access
        const event = new CustomEvent('requestStageSelect');
        if (typeof window.dispatchEvent === 'function') {
            window.dispatchEvent(event);
        }
    }

    public getGameState(): GameState {
        return getGameStore().getGameState();
    }


    public handleGameOverNavigation(direction: 'up' | 'down'): void {
        if (!getGameStore().isGameOver()) return;
        
        if (direction === 'up') {
            this.gameOverMenuIndex = Math.max(0, this.gameOverMenuIndex - 1);
        } else {
            this.gameOverMenuIndex = Math.min(this.gameOverOptions.length - 1, this.gameOverMenuIndex + 1);
        }
        
        console.log(`🎮 Game over menu selection: ${this.gameOverOptions[this.gameOverMenuIndex]}`);
    }

    public handleGameOverSelection(): void {
        if (!getGameStore().isGameOver()) return;
        
        const selectedOption = this.gameOverOptions[this.gameOverMenuIndex];
        
        switch (selectedOption) {
            case 'RESTART STAGE':
                this.init();
                break;
            case 'STAGE SELECT':
                this.returnToStageSelect();
                break;
        }
    }

    private renderGameOverMenu(): void {
        // Use FabricRenderSystem to render the game over menu
        if (this.renderSystem && 'renderGameOverMenu' in this.renderSystem) {
            (this.renderSystem as any).renderGameOverMenu(
                this.gameOverOptions,
                this.gameOverMenuIndex,
                getGameStore().getFinalScore()
            );
        }
    }

    private render(): void {
        // Prevent rendering if game has been cleaned up
        if (this.isCleanedUp) {
            return;
        }
        
        const renderer = this.renderSystem;

        renderer.clearCanvas();
        renderer.setDrawingStyle();
        renderer.applyCameraTransform(getGameStore().getCamera());

        if (this.stage) {
            renderer.renderStage(this.stage);
        }

        renderer.renderDeathMarks(this.animationSystem.getDeathMarks());

        if (getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            const player = getGameStore().getPlayer();
            renderer.renderTrail(this.playerSystem.getTrail(), player.radius);
            renderer.renderLandingPredictions();
            renderer.renderPlayer(player);
        }

        const deathAnim = this.animationSystem.getDeathAnimation();
        if (deathAnim.active) {
            renderer.renderDeathAnimation(deathAnim.particles);
        }

        const clearAnim = this.animationSystem.getClearAnimation();
        if (clearAnim.active && clearAnim.startTime) {
            const elapsed = getCurrentTime() - clearAnim.startTime;
            const progress = elapsed / clearAnim.duration;
            const player = getGameStore().getPlayer();
            renderer.renderClearAnimation(
                clearAnim.particles,
                progress,
                player.x,
                player.y
            );
        }

        renderer.restoreCameraTransform();

        if (!getGameStore().isGameRunning() && !getGameStore().isGameOver()) {
            renderer.renderStartInstruction();
        } else if (getGameStore().isGameOver()) {
            this.renderGameOverMenu();
        } else {
            // ゲーム実行中はUI要素を隠す
            const startScreen = document.getElementById('startScreen');
            const gameOverScreen = document.getElementById('gameOverScreen');
            if (startScreen) startScreen.classList.add('hidden');
            if (gameOverScreen) gameOverScreen.classList.add('hidden');
        }

        renderer.renderCredits();

        // Fabric.js専用の更新
        renderer.renderAll();
    }

    async cleanup(): Promise<void> {
        this.isCleanedUp = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.inputManager.cleanup();
        
        // Cleanup render system to prevent canvas reinitialization issues
        if (this.renderSystem && 'cleanup' in this.renderSystem) {
            await (this.renderSystem as any).cleanup();
        }
        
        gameStore.getState().gameOver();
    }

    // Public methods for testing
    setGameOver(): void {
        gameStore.getState().gameOver();
    }

    setAnimationId(id: number): void {
        this.animationId = id;
    }

    testUpdate(deltaTime: number = 16.67): void {
        this.update(deltaTime);
    }

    testRender(): void {
        this.render();
    }

    async testLoadStage(stageNumber: number): Promise<void> {
        await this.loadStage(stageNumber);
    }



}

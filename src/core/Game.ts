import { DEFAULT_PHYSICS_CONSTANTS, GAME_CONFIG } from '../constants/GameConstants.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { InputSystem } from '../systems/InputSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import { RenderSystem } from '../systems/RenderSystem.js';
import type { Camera, GameState, PhysicsConstants, Player } from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import { type StageData, StageLoader } from './StageLoader.js';

export class JumpingDotGame {
    private canvas: HTMLCanvasElement;
    private gameStatus: HTMLElement;
    private timerDisplay: HTMLElement;
    private scoreDisplay: HTMLElement;

    // Game state
    private gameState!: GameState;

    // Game entities
    private player!: Player;
    private camera!: Camera;

    // Systems
    private playerSystem!: PlayerSystem;
    private physicsSystem!: PhysicsSystem;
    private collisionSystem!: CollisionSystem;
    private animationSystem!: AnimationSystem;
    private renderSystem!: RenderSystem;
    private inputSystem!: InputSystem;

    // Stage
    private stageLoader!: StageLoader;
    private stage: StageData | null = null;

    // Game loop
    private lastTime: number | null = null;
    private animationId: number | null = null;

    private prevPlayerY: number = 0;

    constructor() {
        this.canvas = this.getRequiredElement('gameCanvas') as HTMLCanvasElement;
        this.gameStatus = this.getRequiredElement('gameStatus');
        this.timerDisplay = this.getRequiredElement('timer');
        this.scoreDisplay = this.getRequiredElement('score');

        this.initializeEntities();
        this.initializeSystems();
        this.init();
    }

    private getRequiredElement(id: string): HTMLElement {
        const element = document.getElementById(id);
        if (!element) {
            throw new Error(`Required DOM element with id "${id}" not found`);
        }
        return element;
    }

    private initializeEntities(): void {
        this.player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: GAME_CONFIG.player.defaultRadius,
            grounded: false
        };

        this.camera = { x: 0, y: 0 };

        this.gameState = {
            gameRunning: false,
            gameOver: false,
            currentStage: 1,
            timeLimit: 10,
            timeRemaining: 10,
            gameStartTime: null,
            finalScore: 0,
            hasMovedOnce: false
        };

        this.stageLoader = new StageLoader();
    }

    private initializeSystems(): void {
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        // Create placeholder for input system keys
        const keys = {};

        this.playerSystem = new PlayerSystem(this.player, keys);
        this.physicsSystem = new PhysicsSystem(physicsConstants);
        this.collisionSystem = new CollisionSystem();
        this.animationSystem = new AnimationSystem();
        this.renderSystem = new RenderSystem(this.canvas);
        this.inputSystem = new InputSystem(this);
    }

    async init(): Promise<void> {
        this.gameStatus.textContent = 'Loading stage...';

        await this.loadStage(this.gameState.currentStage);

        this.gameStatus.textContent = 'Press SPACE to start';
        this.resetGameState();
        this.updateUI();

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
        this.gameState.gameRunning = false;
        this.gameState.gameOver = false;
        this.gameState.timeRemaining = this.gameState.timeLimit;
        this.gameState.gameStartTime = null;
        this.gameState.finalScore = 0;
        this.gameState.hasMovedOnce = false;

        this.playerSystem.reset(100, 400);
        this.animationSystem.reset();

        this.camera.x = 0;
        this.camera.y = 0;

        this.inputSystem.setGameState(false, false);
        this.inputSystem.clearKeys();

        this.lastTime = null;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    private updateUI(): void {
        this.timerDisplay.textContent = `Time: ${this.gameState.timeLimit}`;
        this.scoreDisplay.textContent = 'Score: 0';
    }

    public startGame(): void {
        this.gameState.gameRunning = true;
        this.gameState.gameStartTime = getCurrentTime();
        this.gameStatus.textContent = 'Playing';
        this.inputSystem.setGameState(true, false);
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

        this.prevPlayerY = this.player.y;

        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    private update(deltaTime: number): void {
        if (!this.gameState.gameRunning || this.gameState.gameOver) {
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
        const inputKeys = this.inputSystem.getKeys();
        const futureDistance = this.calculateFutureMovement(inputKeys);
        const predictedX = this.player.x + futureDistance;
        
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
        const baseMovement = this.player.vx * (jumpDuration / 16.67); // Movement during jump
        
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
        if (this.gameState.gameStartTime) {
            const currentTime = getCurrentTime();
            const elapsedSeconds = (currentTime - this.gameState.gameStartTime) / 1000;
            this.gameState.timeRemaining = Math.max(0, this.gameState.timeLimit - elapsedSeconds);

            if (this.gameState.timeRemaining <= 0) {
                this.handlePlayerDeath('Time Up! Press R to restart');
                return;
            }

            this.timerDisplay.textContent = `Time: ${Math.ceil(this.gameState.timeRemaining)}`;
        }
    }

    private updateSystems(deltaTime: number): void {
        const keys = this.inputSystem.getKeys();
        this.playerSystem.setKeys(keys);

        const physicsConstants = this.physicsSystem.getPhysicsConstants();
        this.playerSystem.update(deltaTime, physicsConstants);
        this.playerSystem.clampSpeed(physicsConstants.moveSpeed);

        this.physicsSystem.update(this.player, deltaTime);

        this.animationSystem.updateClearAnimation();
        this.animationSystem.updateDeathAnimation();
    }

    private handleCollisions(): void {
        if (!this.stage) return;

        const prevPlayerFootY = this.prevPlayerY + this.player.radius;

        const platformCollision = this.collisionSystem.handlePlatformCollisions(
            this.player,
            this.stage.platforms,
            prevPlayerFootY
        );

        if (platformCollision) {
            this.playerSystem.resetJumpTimer();
            // Add landing history marker
            this.renderSystem.addLandingHistory(this.player.x, this.player.y + this.player.radius);
        }

        if (this.collisionSystem.checkSpikeCollisions(this.player, this.stage.spikes)) {
            this.handlePlayerDeath('Hit by spike! Press R to restart');
            return;
        }

        if (this.collisionSystem.checkGoalCollision(this.player, this.stage.goal)) {
            this.handleGoalReached();
            return;
        }
    }

    private updateCamera(): void {
        this.camera.x = this.player.x - this.canvas.width / 2;
    }

    private checkBoundaries(): void {
        if (this.collisionSystem.checkHoleCollision(this.player, 600)) {
            this.handlePlayerDeath('Fell into hole! Press R to restart', 'fall');
        } else if (this.collisionSystem.checkBoundaryCollision(this.player, this.canvas.height)) {
            this.handlePlayerDeath('Game Over - Press R to restart', 'fall');
        }
    }

    private handlePlayerDeath(message: string, deathType = 'normal'): void {
        this.gameState.gameOver = true;
        this.gameStatus.textContent = message;
        this.inputSystem.setGameState(false, true);

        let deathMarkY = this.player.y;
        if (deathType === 'fall') {
            deathMarkY = this.camera.y + this.canvas.height - 20;
        }

        this.animationSystem.addDeathMark(this.player.x, deathMarkY);
        this.animationSystem.startDeathAnimation(this.player);
        this.playerSystem.clearTrail();
    }

    private handleGoalReached(): void {
        this.gameState.gameOver = true;
        this.gameState.finalScore = Math.ceil(this.gameState.timeRemaining);
        this.gameStatus.textContent = `Goal reached! Score: ${this.gameState.finalScore} - Press R to restart`;
        this.scoreDisplay.textContent = `Score: ${this.gameState.finalScore}`;
        this.inputSystem.setGameState(false, true);

        this.animationSystem.startClearAnimation(this.player);
    }

    private render(): void {
        this.renderSystem.clearCanvas();
        this.renderSystem.setDrawingStyle();

        this.renderSystem.applyCameraTransform(this.camera);

        if (this.stage) {
            this.renderSystem.renderStage(this.stage);
        }

        this.renderSystem.renderDeathMarks(this.animationSystem.getDeathMarks());

        if (this.gameState.gameRunning && !this.gameState.gameOver) {
            this.renderSystem.renderTrail(this.playerSystem.getTrail(), this.player.radius);
            this.renderSystem.renderLandingPredictions();
            this.renderSystem.renderPlayer(this.player);
        }

        const deathAnim = this.animationSystem.getDeathAnimation();
        if (deathAnim.active) {
            this.renderSystem.renderDeathAnimation(deathAnim.particles);
        }

        const clearAnim = this.animationSystem.getClearAnimation();
        if (clearAnim.active && clearAnim.startTime) {
            const elapsed = getCurrentTime() - clearAnim.startTime;
            const progress = elapsed / clearAnim.duration;
            this.renderSystem.renderClearAnimation(
                clearAnim.particles,
                progress,
                this.player.x,
                this.player.y
            );
        }

        this.renderSystem.restoreCameraTransform();

        if (!this.gameState.gameRunning && !this.gameState.gameOver) {
            this.renderSystem.renderStartInstruction();
        }

        if (this.gameState.gameOver) {
            this.renderSystem.renderGameOver();
        }

        this.renderSystem.renderCredits();
    }

    cleanup(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.inputSystem.cleanup();
        this.gameState.gameRunning = false;
        this.gameState.gameOver = true;
    }

    // Public methods for testing
    setGameOver(): void {
        this.gameState.gameRunning = false;
        this.gameState.gameOver = true;
    }

    setAnimationId(id: number): void {
        this.animationId = id;
    }
}

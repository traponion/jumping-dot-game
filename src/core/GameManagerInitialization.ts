import { GAME_CONFIG } from '../constants/GameConstants.js';
import { DEFAULT_PHYSICS_CONSTANTS } from '../constants/GameConstants.js';
import type { GameState } from '../stores/GameState.js';
import { AnimationSystem } from '../systems/AnimationSystem.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { GameRuleSystem } from '../systems/GameRuleSystem.js';
import type { IRenderSystem } from '../systems/IRenderSystem.js';
import type { GameController } from '../systems/InputManager.js';
import { InputManager } from '../systems/InputManager.js';
import { MovingPlatformSystem } from '../systems/MovingPlatformSystem.js';
import { PhysicsSystem } from '../systems/PhysicsSystem.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import { createGameRenderSystem } from '../systems/RenderSystemFactory.js';
import type { PhysicsConstants } from '../types/GameTypes.js';
import { StageLoader } from './StageLoader.js';

export interface GameSystems {
    physicsSystem: PhysicsSystem;
    cameraSystem: CameraSystem;
    collisionSystem: CollisionSystem;
    gameRuleSystem: GameRuleSystem;
    animationSystem: AnimationSystem;
    movingPlatformSystem: MovingPlatformSystem;
    renderSystem: IRenderSystem;
    inputManager: InputManager;
    playerSystem: PlayerSystem;
}

export class GameManagerInitialization {
    private canvas: HTMLCanvasElement;
    private gameController: GameController;
    private gameState: GameState;
    private stageLoader: StageLoader | null = null;

    constructor(canvas: HTMLCanvasElement, gameController: GameController, gameState: GameState) {
        this.canvas = canvas;
        this.gameController = gameController;
        this.gameState = gameState;
    }

    initializeEntities(): void {
        // Initialize GameState with default values
        this.gameState.currentStage = 1;
        this.gameState.timeRemaining = 10;
        Object.assign(this.gameState.runtime.player, {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: GAME_CONFIG.player.defaultRadius,
            grounded: false
        });
        this.gameState.runtime.camera.x = 0;
        this.gameState.runtime.camera.y = 0;

        this.stageLoader = new StageLoader();
    }

    initializeSystems(): GameSystems {
        const physicsConstants: PhysicsConstants = { ...DEFAULT_PHYSICS_CONSTANTS };

        const physicsSystem = new PhysicsSystem(this.gameState, physicsConstants);
        const cameraSystem = new CameraSystem(this.gameState, this.canvas);
        const collisionSystem = new CollisionSystem(this.gameState, this.canvas);
        const gameRuleSystem = new GameRuleSystem(this.gameState);
        const animationSystem = new AnimationSystem(this.gameState);
        const movingPlatformSystem = new MovingPlatformSystem(this.gameState);

        // Environment-aware rendering system
        const renderSystem = createGameRenderSystem(this.canvas);

        // Initialize InputManager with canvas and game controller
        const inputManager = new InputManager(this.gameState, this.canvas, this.gameController);

        // Initialize PlayerSystem with InputManager and inject render system
        const playerSystem = new PlayerSystem(this.gameState, inputManager);
        playerSystem.setRenderSystem(renderSystem);

        return {
            physicsSystem,
            cameraSystem,
            collisionSystem,
            gameRuleSystem,
            animationSystem,
            movingPlatformSystem,
            renderSystem,
            inputManager,
            playerSystem
        };
    }

    getStageLoader(): StageLoader | null {
        return this.stageLoader;
    }
}

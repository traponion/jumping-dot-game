import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameManagerInitialization } from '../core/GameManagerInitialization.js';
import { GameState } from '../stores/GameState.js';
import type { GameController } from '../systems/InputManager.js';

// Mock all system dependencies
vi.mock('../systems/CollisionSystem');
vi.mock('../systems/AnimationSystem');
vi.mock('../systems/PlayerSystem');
vi.mock('../systems/PhysicsSystem');
vi.mock('../systems/InputManager');
vi.mock('../systems/MovingPlatformSystem');
vi.mock('../systems/GameRuleSystem');
vi.mock('../systems/CameraSystem');
vi.mock('../core/StageLoader');
vi.mock('../systems/RenderSystemFactory', () => ({
    createGameRenderSystem: vi.fn(() => ({
        addLandingHistory: vi.fn(),
        setLandingPredictions: vi.fn(),
        render: vi.fn(),
        cleanup: vi.fn()
    }))
}));

// Mock DOM elements
const mockCanvas = {
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, width: 800, height: 600 })),
    getContext: vi.fn(() => ({
        fillRect: vi.fn(),
        clearRect: vi.fn()
    }))
} as unknown as HTMLCanvasElement;

describe('GameManagerInitialization', () => {
    let gameManagerInit: GameManagerInitialization;
    let gameState: GameState;
    let mockGameController: GameController;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        canvas = mockCanvas;
        gameState = new GameState();
        mockGameController = {
            startGame: vi.fn(),
            init: vi.fn(),
            returnToStageSelect: vi.fn(),
            handleGameOverNavigation: vi.fn(),
            handleGameOverSelection: vi.fn(),
            getGameState: vi.fn().mockReturnValue(gameState),
            getGameUI: vi.fn()
        } as unknown as GameController;

        gameManagerInit = new GameManagerInitialization(canvas, mockGameController, gameState);
    });

    describe('initializeEntities', () => {
        it('should initialize game state with default values', () => {
            // Act
            gameManagerInit.initializeEntities();

            // Assert
            expect(gameState.currentStage).toBe(1);
            expect(gameState.timeRemaining).toBe(10);
            expect(gameState.runtime.player.x).toBe(100);
            expect(gameState.runtime.player.y).toBe(400);
            expect(gameState.runtime.player.vx).toBe(0);
            expect(gameState.runtime.player.vy).toBe(0);
            expect(gameState.runtime.player.grounded).toBe(false);
            expect(gameState.runtime.camera.x).toBe(0);
            expect(gameState.runtime.camera.y).toBe(0);
        });

        it('should create StageLoader instance', () => {
            // Act
            gameManagerInit.initializeEntities();

            // Assert
            expect(gameManagerInit.getStageLoader()).toBeDefined();
        });
    });

    describe('initializeSystems', () => {
        it('should initialize all systems with correct dependencies', () => {
            // Act
            const systems = gameManagerInit.initializeSystems();

            // Assert
            expect(systems.physicsSystem).toBeDefined();
            expect(systems.cameraSystem).toBeDefined();
            expect(systems.collisionSystem).toBeDefined();
            expect(systems.gameRuleSystem).toBeDefined();
            expect(systems.animationSystem).toBeDefined();
            expect(systems.movingPlatformSystem).toBeDefined();
            expect(systems.renderSystem).toBeDefined();
            expect(systems.inputManager).toBeDefined();
            expect(systems.playerSystem).toBeDefined();
        });

        it('should configure PlayerSystem with InputManager and RenderSystem', () => {
            // Act
            const systems = gameManagerInit.initializeSystems();

            // Assert
            expect(systems.playerSystem).toBeDefined();
            expect(systems.inputManager).toBeDefined();
            expect(systems.renderSystem).toBeDefined();
        });
    });
});

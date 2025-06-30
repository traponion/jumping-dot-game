// Plain TypeScript GameState class - Library-independent state management
import type {
    Camera,
    DeathMark,
    GameState as GameStateInfo,
    Particle,
    Player,
    TrailPoint
} from '../types/GameTypes.js';

/**
 * Game Runtime State - Manages dynamic game entities and runtime data
 */
interface GameRuntimeState {
    player: Player;
    camera: Camera;
    particles: Particle[];
    deathMarks: DeathMark[];
    trail: TrailPoint[];
    isInitialized: boolean;
    lastUpdateTime: number;
}

/**
 * Game Performance State - Tracks performance metrics and profiling data
 */
interface GamePerformanceState {
    frameRate: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

/**
 * Plain TypeScript GameState Class
 *
 * Library-independent state management for the jumping dot game.
 * Replaces Zustand store with direct property access and mutation.
 *
 * This class holds all game state and provides methods for state management
 * without external dependencies (except for type definitions).
 */
export class GameState {
    public game!: GameStateInfo;
    public runtime!: GameRuntimeState;
    public performance!: GamePerformanceState;

    constructor() {
        this.reset();
    }

    /**
     * Reset entire state to initial values
     * Equivalent to createInitialState from GameZustandStore
     */
    public reset(): void {
        this.game = {
            gameRunning: false,
            gameOver: false,
            currentStage: 1,
            timeLimit: 20,
            timeRemaining: 20,
            gameStartTime: null,
            finalScore: 0,
            hasMovedOnce: false
        };

        this.runtime = {
            player: {
                x: 100,
                y: 300,
                vx: 0,
                vy: 0,
                radius: 10,
                grounded: false
            },
            camera: {
                x: 0,
                y: 0
            },
            particles: [],
            deathMarks: [],
            trail: [],
            isInitialized: false,
            lastUpdateTime: 0
        };

        this.performance = {
            frameRate: 0,
            renderTime: 0,
            lastOperation: '',
            operationTime: 0
        };
    }
}

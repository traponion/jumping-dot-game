import type { StageData } from '../core/StageLoader.js';
// Plain TypeScript GameState class - Library-independent state management
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';

/**
 * Game Runtime State - Manages dynamic game entities and runtime data
 */
interface GameRuntimeState {
    player: Player;
    camera: Camera;
    particles: Particle[];
    deathMarks: DeathMark[];
    trail: TrailPoint[];
    collisionResults: {
        holeCollision: boolean;
        boundaryCollision: boolean;
        goalCollision: boolean;
    };
    // Animation trigger flags for autonomous system behavior
    shouldStartDeathAnimation: boolean;
    shouldStartClearAnimation: boolean;
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
    // Game state properties (flattened)
    public gameRunning = false;
    public gameOver = false;
    public currentStage = 1;
    public timeLimit = 20;
    public timeRemaining = 20;
    public gameStartTime: number | null = null;
    public finalScore = 0;
    public hasMovedOnce = false;
    public stage: StageData | null = null;

    // Runtime state
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
        // Reset game state
        this.gameRunning = false;
        this.gameOver = false;
        this.currentStage = 1;
        this.timeLimit = 20;
        this.timeRemaining = 20;
        this.gameStartTime = null;
        this.finalScore = 0;
        this.hasMovedOnce = false;
        this.stage = null;

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
            collisionResults: {
                holeCollision: false,
                boundaryCollision: false,
                goalCollision: false
            },
            shouldStartDeathAnimation: false,
            shouldStartClearAnimation: false,
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

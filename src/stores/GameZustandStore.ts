/**
 * @fileoverview Zustand-based game state management store
 * @module GameZustandStore
 * @description Centralized state management for the game using Zustand library.
 * This module belongs to the Application layer and provides reactive state management
 * with actions for game logic, runtime state, and performance monitoring.
 * Implements immutable state updates using Immer middleware and Redux DevTools integration.
 */

import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// Zustand-based Game Store - Modern state management for the game
import { createStore } from 'zustand/vanilla';
import { GAME_CONFIG } from '../constants/GameConstants.js';
import type {
    Camera,
    DeathMark,
    GameState,
    Particle,
    Player,
    TrailPoint
} from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';

/**
 * Game Runtime State interface - Manages dynamic game entities and runtime data
 * @interface GameRuntimeState
 * @property {Player} player - Current player state including position and velocity
 * @property {Camera} camera - Camera position and viewport information
 * @property {Particle[]} particles - Array of active particle effects
 * @property {DeathMark[]} deathMarks - Array of death markers for visual feedback
 * @property {TrailPoint[]} trail - Player movement trail points
 * @property {boolean} isInitialized - Whether the runtime state has been initialized
 * @property {number} lastUpdateTime - Timestamp of last state update for delta calculations
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
 * Game Performance State interface - Tracks performance metrics and profiling data
 * @interface GamePerformanceState
 * @property {number} frameRate - Current frames per second
 * @property {number} renderTime - Time taken for last render operation in milliseconds
 * @property {string} lastOperation - Name of the last significant operation performed
 * @property {number} operationTime - Time taken for last operation in milliseconds
 */
interface GamePerformanceState {
    frameRate: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

/**
 * Complete Game Store interface - Main store contract defining all state and actions
 * @interface GameStore
 * @description Comprehensive interface for game state management including:
 * - Core game state (running, paused, game over states)
 * - Runtime entities (player, camera, particles, effects)
 * - Performance monitoring and profiling
 * - Stage management and scoring
 * - Computed getters for derived state
 */
export interface GameStore {
    /** @property {GameState} game - Core game state including running status and scoring */
    game: GameState;
    /** @property {GameRuntimeState} runtime - Dynamic runtime state for entities and effects */
    runtime: GameRuntimeState;
    /** @property {GamePerformanceState} performance - Performance metrics and profiling data */
    performance: GamePerformanceState;

    // Core Game Actions
    /**
     * Start a new game session
     * @method startGame
     * @returns {void}
     * @description Initializes game state, sets start time, and begins gameplay
     */
    startGame: () => void;

    /**
     * Pause the current game
     * @method pauseGame
     * @returns {void}
     * @description Stops game loop without ending the game session
     */
    pauseGame: () => void;

    /**
     * Resume a paused game
     * @method resumeGame
     * @returns {void}
     * @description Continues game loop if not in game over state
     */
    resumeGame: () => void;

    /**
     * Stop the game without game over
     * @method stopGame
     * @returns {void}
     * @description Cleanly stops the game without triggering game over state
     */
    stopGame: () => void;

    /**
     * Trigger game over state
     * @method gameOver
     * @returns {void}
     * @description Sets game over flag and stops the game loop
     */
    gameOver: () => void;

    /**
     * Restart the current game
     * @method restartGame
     * @returns {void}
     * @description Resets game state and clears runtime entities for fresh start
     */
    restartGame: () => void;

    // Stage Management
    /**
     * Set the current active stage
     * @method setCurrentStage
     * @param {number} stageId - Stage identifier to activate
     * @returns {void}
     */
    setCurrentStage: (stageId: number) => void;

    /**
     * Set time limit for current stage
     * @method setTimeLimit
     * @param {number} limit - Time limit in seconds
     * @returns {void}
     * @description Also resets remaining time to the new limit
     */
    setTimeLimit: (limit: number) => void;

    /**
     * Update remaining time in current stage
     * @method updateTimeRemaining
     * @param {number} time - Remaining time in seconds
     * @returns {void}
     */
    updateTimeRemaining: (time: number) => void;

    /**
     * Set final score for completed game
     * @method setFinalScore
     * @param {number} score - Final score value
     * @returns {void}
     */
    setFinalScore: (score: number) => void;

    /**
     * Mark that player has moved at least once
     * @method markPlayerMoved
     * @returns {void}
     * @description Used for tracking player engagement and tutorial completion
     */
    markPlayerMoved: () => void;

    /**
     * Update player velocity based on input direction
     * @method updatePlayerVelocity
     * @param {'left' | 'right'} direction - Movement direction
     * @param {number} dtFactor - Delta time factor for frame-rate independence
     * @returns {void}
     */
    updatePlayerVelocity: (direction: 'left' | 'right', dtFactor: number) => void;

    /**
     * Clamp player speed to maximum limit
     * @method clampPlayerSpeed
     * @param {number} maxSpeed - Maximum allowed speed
     * @returns {void}
     * @description Prevents player from exceeding speed limits
     */
    clampPlayerSpeed: (maxSpeed: number) => void;

    // Runtime State Actions
    /**
     * Update player entity with partial state
     * @method updatePlayer
     * @param {Partial<Player>} player - Partial player state updates
     * @returns {void}
     */
    updatePlayer: (player: Partial<Player>) => void;

    /**
     * Update camera with partial state
     * @method updateCamera
     * @param {Partial<Camera>} camera - Partial camera state updates
     * @returns {void}
     */
    updateCamera: (camera: Partial<Camera>) => void;

    /**
     * Add new particle to particle system
     * @method addParticle
     * @param {Particle} particle - Particle to add
     * @returns {void}
     */
    addParticle: (particle: Particle) => void;

    /**
     * Replace entire particle array
     * @method updateParticles
     * @param {Particle[]} particles - New particle array
     * @returns {void}
     * @description Typically used after particle system updates
     */
    updateParticles: (particles: Particle[]) => void;

    /**
     * Add death mark at specified location
     * @method addDeathMark
     * @param {DeathMark} deathMark - Death mark to add
     * @returns {void}
     */
    addDeathMark: (deathMark: DeathMark) => void;

    /**
     * Replace entire trail array
     * @method updateTrail
     * @param {TrailPoint[]} trail - New trail point array
     * @returns {void}
     */
    updateTrail: (trail: TrailPoint[]) => void;

    /**
     * Add single point to player trail
     * @method addTrailPoint
     * @param {TrailPoint} point - Trail point to add
     * @returns {void}
     * @description Automatically manages trail length using maxTrailLength config
     */
    addTrailPoint: (point: TrailPoint) => void;

    /**
     * Set runtime initialization status
     * @method setInitialized
     * @param {boolean} initialized - Whether runtime is initialized
     * @returns {void}
     */
    setInitialized: (initialized: boolean) => void;

    // Performance Actions
    /**
     * Update performance metrics
     * @method updatePerformance
     * @param {Partial<GamePerformanceState>} updates - Performance metric updates
     * @returns {void}
     */
    updatePerformance: (updates: Partial<GamePerformanceState>) => void;

    // Computed Getters (for compatibility)
    /**
     * Get immutable copy of game state
     * @method getGameState
     * @returns {GameState} Copy of current game state
     */
    getGameState: () => GameState;

    /**
     * Get immutable copy of player state
     * @method getPlayer
     * @returns {Player} Copy of current player state
     */
    getPlayer: () => Player;

    /**
     * Get immutable copy of camera state
     * @method getCamera
     * @returns {Camera} Copy of current camera state
     */
    getCamera: () => Camera;

    /**
     * Check if game is currently running
     * @method isGameRunning
     * @returns {boolean} True if game loop is active
     */
    isGameRunning: () => boolean;

    /**
     * Check if game is in game over state
     * @method isGameOver
     * @returns {boolean} True if game has ended
     */
    isGameOver: () => boolean;

    /**
     * Get current active stage ID
     * @method getCurrentStage
     * @returns {number} Current stage identifier
     */
    getCurrentStage: () => number;

    /**
     * Get remaining time in current stage
     * @method getTimeRemaining
     * @returns {number} Remaining time in seconds
     */
    getTimeRemaining: () => number;

    /**
     * Get final score of completed game
     * @method getFinalScore
     * @returns {number} Final score value
     */
    getFinalScore: () => number;

    /**
     * Check if player has moved at least once
     * @method hasPlayerMoved
     * @returns {boolean} True if player has moved
     */
    hasPlayerMoved: () => boolean;

    // Utility Actions
    /**
     * Reset entire store to initial state
     * @method reset
     * @returns {void}
     * @description Completely resets all game, runtime, and performance state
     */
    reset: () => void;
}

/**
 * Factory function to create initial state for the game store
 * @function createInitialState
 * @returns {Object} Initial state object containing game, runtime, and performance state
 * @private
 * @description Creates fresh initial state with default values for all store sections.
 * Used during store creation and reset operations.
 */
const createInitialState = () => ({
    game: {
        gameRunning: false,
        gameOver: false,
        currentStage: 1,
        timeLimit: 20,
        timeRemaining: 20,
        gameStartTime: null,
        finalScore: 0,
        hasMovedOnce: false
    } as GameState,
    runtime: {
        player: {
            x: 100,
            y: 300,
            vx: 0,
            vy: 0,
            radius: 10,
            grounded: false
        } as Player,
        camera: {
            x: 0,
            y: 0
        } as Camera,
        particles: [] as Particle[],
        deathMarks: [] as DeathMark[],
        trail: [] as TrailPoint[],
        isInitialized: false,
        lastUpdateTime: 0
    } as GameRuntimeState,
    performance: {
        frameRate: 0,
        renderTime: 0,
        lastOperation: '',
        operationTime: 0
    } as GamePerformanceState
});

// Create the Zustand store with middleware (vanilla version for non-React usage)
export const gameStore = createStore<GameStore>()(
    devtools(
        immer((set, get) => ({
            // Initial State
            ...createInitialState(),

            // Core Game Actions
            startGame: () =>
                set((state) => {
                    state.game.gameRunning = true;
                    state.game.gameOver = false;
                    state.game.gameStartTime = getCurrentTime();
                    state.game.timeRemaining = state.game.timeLimit;
                    state.game.finalScore = 0;
                    state.game.hasMovedOnce = false;
                }),

            pauseGame: () =>
                set((state) => {
                    state.game.gameRunning = false;
                }),

            resumeGame: () =>
                set((state) => {
                    if (!state.game.gameOver) {
                        state.game.gameRunning = true;
                    }
                }),

            stopGame: () =>
                set((state) => {
                    state.game.gameRunning = false;
                    state.game.gameOver = false;
                }),

            gameOver: () =>
                set((state) => {
                    state.game.gameRunning = false;
                    state.game.gameOver = true;
                }),

            restartGame: () =>
                set((state) => {
                    state.game.gameRunning = false;
                    state.game.gameOver = false;
                    state.game.timeRemaining = state.game.timeLimit;
                    state.game.gameStartTime = null;
                    state.game.finalScore = 0;
                    state.game.hasMovedOnce = false;
                    // Reset runtime state
                    state.runtime.particles = [];
                    state.runtime.deathMarks = [];
                    state.runtime.trail = [];
                }),

            // Stage Management
            setCurrentStage: (stageId: number) =>
                set((state) => {
                    state.game.currentStage = stageId;
                }),

            setTimeLimit: (limit: number) =>
                set((state) => {
                    state.game.timeLimit = limit;
                    state.game.timeRemaining = limit; // Reset remaining time when limit changes
                }),

            updateTimeRemaining: (time: number) =>
                set((state) => {
                    state.game.timeRemaining = time;
                }),

            // Player Movement Actions
            updatePlayerVelocity: (direction: 'left' | 'right', dtFactor: number) =>
                set((state) => {
                    const acceleration = GAME_CONFIG.player.acceleration;
                    if (direction === 'left') {
                        state.runtime.player.vx -= acceleration * dtFactor;
                    } else {
                        state.runtime.player.vx += acceleration * dtFactor;
                    }
                }),

            markPlayerMoved: () =>
                set((state) => {
                    state.game.hasMovedOnce = true;
                }),

            // Physics System Actions
            clampPlayerSpeed: (maxSpeed: number) =>
                set((state) => {
                    if (Math.abs(state.runtime.player.vx) > maxSpeed) {
                        state.runtime.player.vx =
                            state.runtime.player.vx >= 0 ? maxSpeed : -maxSpeed;
                    }
                }),

            setFinalScore: (score: number) =>
                set((state) => {
                    state.game.finalScore = score;
                }),

            // Runtime State Actions
            updatePlayer: (playerUpdates: Partial<Player>) =>
                set((state) => {
                    Object.assign(state.runtime.player, playerUpdates);
                }),

            updateCamera: (cameraUpdates: Partial<Camera>) =>
                set((state) => {
                    Object.assign(state.runtime.camera, cameraUpdates);
                }),

            addParticle: (particle: Particle) =>
                set((state) => {
                    state.runtime.particles.push(particle);
                }),

            updateParticles: (particles: Particle[]) =>
                set((state) => {
                    state.runtime.particles = particles;
                }),

            addDeathMark: (deathMark: DeathMark) =>
                set((state) => {
                    state.runtime.deathMarks.push(deathMark);
                }),

            updateTrail: (trail: TrailPoint[]) =>
                set((state) => {
                    state.runtime.trail = trail;
                }),

            addTrailPoint: (point: TrailPoint) =>
                set((state) => {
                    state.runtime.trail.push(point);
                    const maxTrailLength = GAME_CONFIG.player.maxTrailLength;
                    if (state.runtime.trail.length > maxTrailLength) {
                        state.runtime.trail.shift();
                    }
                }),

            setInitialized: (initialized: boolean) =>
                set((state) => {
                    state.runtime.isInitialized = initialized;
                }),

            // Performance Actions
            updatePerformance: (updates: Partial<GamePerformanceState>) =>
                set((state) => {
                    Object.assign(state.performance, updates);
                }),

            // Computed Getters (for compatibility)
            getGameState: () => ({ ...get().game }),
            getPlayer: () => ({ ...get().runtime.player }),
            getCamera: () => ({ ...get().runtime.camera }),
            isGameRunning: () => get().game.gameRunning,
            isGameOver: () => get().game.gameOver,
            getCurrentStage: () => get().game.currentStage,
            getTimeRemaining: () => get().game.timeRemaining,
            getFinalScore: () => get().game.finalScore,
            hasPlayerMoved: () => get().game.hasMovedOnce,

            // Utility Actions
            reset: () => set(() => createInitialState())
        })),
        {
            name: 'game-store' // For Redux DevTools
        }
    )
);

/**
 * React-style hook placeholder for future React integration
 * @function useGameStore
 * @throws {Error} Always throws error as this is not implemented for React usage
 * @returns {never} Never returns as it always throws
 * @description Placeholder for potential future React integration.
 * Currently throws error directing users to use getGameStore() instead.
 */
export const useGameStore = () => {
    throw new Error(
        'useGameStore is only available in React components. Use getGameStore() instead.'
    );
};

/**
 * Get current state snapshot from the game store
 * @function getGameStore
 * @returns {GameStoreState} Current state snapshot with all store data and methods
 * @description Provides access to store state and actions for non-React usage.
 * Commonly used in game controllers and systems that need store access.
 * @example
 * const store = getGameStore();
 * const player = store.getPlayer();
 * store.startGame();
 */
export const getGameStore = () => gameStore.getState();

/**
 * Subscribe to store state changes
 * @function subscribeGameStore
 * @description Allows components and systems to react to store state changes.
 * Returns unsubscribe function to clean up listeners.
 * @example
 * const unsubscribe = subscribeGameStore((state) => {
 *   console.log('Game state changed:', state.game.gameRunning);
 * });
 * // Later: unsubscribe();
 */
export const subscribeGameStore = gameStore.subscribe;

/**
 * Type helper for store state structure
 * @typedef {ReturnType<typeof gameStore.getState>} GameStoreState
 * @description TypeScript type representing the complete store state structure.
 * Includes all state properties and action methods available from the store.
 */
export type GameStoreState = ReturnType<typeof gameStore.getState>;

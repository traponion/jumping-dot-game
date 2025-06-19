/**
 * @fileoverview Refactored Zustand-based game state management store
 * @module GameZustandStore
 * @description Centralized state management for the game using Zustand library.
 * Refactored to separate business logic from state management.
 * Pure state management with domain services for complex logic.
 */

import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';
import type {
    Camera,
    DeathMark,
    GameState,
    Particle,
    Player,
    TrailPoint
} from '../types/GameTypes.js';
import { getCurrentTime } from '../utils/GameUtils.js';
import { GAME_CONFIG } from '../constants/GameConstants.js';

/**
 * Game Runtime State interface - Manages dynamic game entities and runtime data
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
 */
interface GamePerformanceState {
    frameRate: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

/**
 * Refactored Game Store interface - Pure state management only
 * Business logic moved to domain services
 */
export interface GameStore {
    /** Core state */
    game: GameState;
    runtime: GameRuntimeState;
    performance: GamePerformanceState;

    // Pure State Management Actions
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    stopGame: () => void;
    gameOver: () => void;
    restartGame: () => void;

    // Stage Management (Simple State Updates)
    setCurrentStage: (stageId: number) => void;
    setTimeLimit: (limit: number) => void;
    updateTimeRemaining: (time: number) => void;
    setFinalScore: (score: number) => void;
    markPlayerMoved: () => void;

    // Runtime State Actions (Simple State Updates)
    updatePlayer: (player: Partial<Player>) => void;
    updateCamera: (camera: Partial<Camera>) => void;
    addParticle: (particle: Particle) => void;
    updateParticles: (particles: Particle[]) => void;
    addDeathMark: (deathMark: DeathMark) => void;
    updateTrail: (trail: TrailPoint[]) => void;
    addTrailPoint: (point: TrailPoint) => void;
    setInitialized: (initialized: boolean) => void;

    // Performance Actions
    updatePerformance: (updates: Partial<GamePerformanceState>) => void;

    // Computed Getters (for compatibility)
    getGameState: () => GameState;
    getPlayer: () => Player;
    getCamera: () => Camera;
    isGameRunning: () => boolean;
    isGameOver: () => boolean;
    getCurrentStage: () => number;
    getTimeRemaining: () => number;
    getFinalScore: () => number;
    hasPlayerMoved: () => boolean;

    // Utility Actions
    reset: () => void;
}

/**
 * Create initial state for the game store
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
            y: 200,
            vx: 0,
            vy: 0,
            grounded: false
        } as Player,
        camera: {
            x: 0,
            y: 0,
            zoom: 1
        } as Camera,
        particles: [] as Particle[],
        deathMarks: [] as DeathMark[],
        trail: [] as TrailPoint[],
        isInitialized: false,
        lastUpdateTime: 0
    } as GameRuntimeState,
    performance: {
        frameRate: 60,
        renderTime: 0,
        lastOperation: '',
        operationTime: 0
    } as GamePerformanceState
});

/**
 * Refactored game store with pure state management
 * Business logic moved to PlayerUpdateService and GameLogicService
 */
const gameStore = createStore<GameStore>()(
    devtools(
        immer((set, get) => ({
            // Initial State
            ...createInitialState(),

            // Core Game Actions - Pure State Management
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

            // Stage Management - Simple State Updates
            setCurrentStage: (stageId: number) =>
                set((state) => {
                    state.game.currentStage = stageId;
                }),

            setTimeLimit: (limit: number) =>
                set((state) => {
                    state.game.timeLimit = limit;
                    state.game.timeRemaining = limit;
                }),

            updateTimeRemaining: (time: number) =>
                set((state) => {
                    state.game.timeRemaining = time;
                }),

            setFinalScore: (score: number) =>
                set((state) => {
                    state.game.finalScore = score;
                }),

            markPlayerMoved: () =>
                set((state) => {
                    state.game.hasMovedOnce = true;
                }),

            // Runtime State Actions - Simple State Updates
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
 * Get the singleton game store instance
 */
export const getGameStore = () => gameStore.getState();

/**
 * Subscribe to game store changes
 */
export const subscribeGameStore = (listener: (state: GameStore) => void) => 
    gameStore.subscribe(listener);

/**
 * Game store state type for external usage
 */
export type GameStoreState = typeof gameStore extends { getState(): infer T } ? T : never;

/**
 * React hook for using game store (if needed in React components)
 */
export const useGameStore = () => gameStore.getState();

// Export the store instance
export { gameStore };
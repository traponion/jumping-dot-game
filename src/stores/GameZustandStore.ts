/**
 * @fileoverview Refactored Zustand game state store - pure state management only
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

interface GameRuntimeState {
    player: Player;
    camera: Camera;
    particles: Particle[];
    deathMarks: DeathMark[];
    trail: TrailPoint[];
    isInitialized: boolean;
    lastUpdateTime: number;
}

interface GamePerformanceState {
    frameRate: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

export interface GameStore {
    game: GameState;
    runtime: GameRuntimeState;
    performance: GamePerformanceState;

    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    stopGame: () => void;
    gameOver: () => void;
    restartGame: () => void;

    setCurrentStage: (stageId: number) => void;
    setTimeLimit: (limit: number) => void;
    updateTimeRemaining: (time: number) => void;
    setFinalScore: (score: number) => void;
    markPlayerMoved: () => void;

    updatePlayer: (player: Partial<Player>) => void;
    updateCamera: (camera: Partial<Camera>) => void;
    addParticle: (particle: Particle) => void;
    updateParticles: (particles: Particle[]) => void;
    addDeathMark: (deathMark: DeathMark) => void;
    updateTrail: (trail: TrailPoint[]) => void;
    addTrailPoint: (point: TrailPoint) => void;
    setInitialized: (initialized: boolean) => void;

    updatePerformance: (updates: Partial<GamePerformanceState>) => void;

    getGameState: () => GameState;
    getPlayer: () => Player;
    getCamera: () => Camera;
    isGameRunning: () => boolean;
    isGameOver: () => boolean;
    getCurrentStage: () => number;
    getTimeRemaining: () => number;
    getFinalScore: () => number;
    hasPlayerMoved: () => boolean;

    reset: () => void;
}

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

const gameStore = createStore<GameStore>()(
    devtools(
        immer((set, get) => ({
            ...createInitialState(),

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
                    state.runtime.particles = [];
                    state.runtime.deathMarks = [];
                    state.runtime.trail = [];
                }),

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

            updatePerformance: (updates: Partial<GamePerformanceState>) =>
                set((state) => {
                    Object.assign(state.performance, updates);
                }),

            getGameState: () => ({ ...get().game }),
            getPlayer: () => ({ ...get().runtime.player }),
            getCamera: () => ({ ...get().runtime.camera }),
            isGameRunning: () => get().game.gameRunning,
            isGameOver: () => get().game.gameOver,
            getCurrentStage: () => get().game.currentStage,
            getTimeRemaining: () => get().game.timeRemaining,
            getFinalScore: () => get().game.finalScore,
            hasPlayerMoved: () => get().game.hasMovedOnce,

            reset: () => set(() => createInitialState())
        })),
        {
            name: 'game-store'
        }
    )
);

export const getGameStore = () => gameStore.getState();
export const subscribeGameStore = (listener: (state: GameStore) => void) => 
    gameStore.subscribe(listener);
export type GameStoreState = typeof gameStore extends { getState(): infer T } ? T : never;
export const useGameStore = () => gameStore.getState();
export { gameStore };
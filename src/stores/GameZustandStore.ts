// Zustand-based Game Store - Modern state management for the game
import { createStore } from 'zustand/vanilla';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import type { GameState, Player, Camera, Particle, DeathMark, TrailPoint } from '../types/GameTypes.js';

// Game Runtime State interface
interface GameRuntimeState {
    player: Player;
    camera: Camera;
    particles: Particle[];
    deathMarks: DeathMark[];
    trail: TrailPoint[];
    isInitialized: boolean;
    lastUpdateTime: number;
}

// Game Performance State interface
interface GamePerformanceState {
    frameRate: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

// Complete Game Store interface
export interface GameStore {
    // State
    game: GameState;
    runtime: GameRuntimeState;
    performance: GamePerformanceState;
    
    // Core Game Actions
    startGame: () => void;
    pauseGame: () => void;
    resumeGame: () => void;
    stopGame: () => void;
    gameOver: () => void;
    restartGame: () => void;
    
    // Stage Management
    setCurrentStage: (stageId: number) => void;
    updateTimeRemaining: (time: number) => void;
    setFinalScore: (score: number) => void;
    markPlayerMoved: () => void;
    
    // Runtime State Actions
    updatePlayer: (player: Partial<Player>) => void;
    updateCamera: (camera: Partial<Camera>) => void;
    addParticle: (particle: Particle) => void;
    updateParticles: (particles: Particle[]) => void;
    addDeathMark: (deathMark: DeathMark) => void;
    updateTrail: (trail: TrailPoint[]) => void;
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

// Initial state factory
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
            startGame: () => set((state) => {
                state.game.gameRunning = true;
                state.game.gameOver = false;
                state.game.gameStartTime = Date.now();
                state.game.timeRemaining = state.game.timeLimit;
                state.game.finalScore = 0;
                state.game.hasMovedOnce = false;
            }),
            
            pauseGame: () => set((state) => {
                state.game.gameRunning = false;
            }),
            
            resumeGame: () => set((state) => {
                if (!state.game.gameOver) {
                    state.game.gameRunning = true;
                }
            }),
            
            stopGame: () => set((state) => {
                state.game.gameRunning = false;
                state.game.gameOver = false;
            }),
            
            gameOver: () => set((state) => {
                state.game.gameRunning = false;
                state.game.gameOver = true;
            }),
            
            restartGame: () => set((state) => {
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
            setCurrentStage: (stageId: number) => set((state) => {
                state.game.currentStage = stageId;
            }),
            
            updateTimeRemaining: (time: number) => set((state) => {
                state.game.timeRemaining = time;
            }),
            
            setFinalScore: (score: number) => set((state) => {
                state.game.finalScore = score;
            }),
            
            markPlayerMoved: () => set((state) => {
                state.game.hasMovedOnce = true;
            }),
            
            // Runtime State Actions
            updatePlayer: (playerUpdates: Partial<Player>) => set((state) => {
                Object.assign(state.runtime.player, playerUpdates);
            }),
            
            updateCamera: (cameraUpdates: Partial<Camera>) => set((state) => {
                Object.assign(state.runtime.camera, cameraUpdates);
            }),
            
            addParticle: (particle: Particle) => set((state) => {
                state.runtime.particles.push(particle);
            }),
            
            updateParticles: (particles: Particle[]) => set((state) => {
                state.runtime.particles = particles;
            }),
            
            addDeathMark: (deathMark: DeathMark) => set((state) => {
                state.runtime.deathMarks.push(deathMark);
            }),
            
            updateTrail: (trail: TrailPoint[]) => set((state) => {
                state.runtime.trail = trail;
            }),
            
            setInitialized: (initialized: boolean) => set((state) => {
                state.runtime.isInitialized = initialized;
            }),
            
            // Performance Actions
            updatePerformance: (updates: Partial<GamePerformanceState>) => set((state) => {
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
            name: 'game-store', // For Redux DevTools
        }
    )
);

// Create React-style hook for potential future React integration
export const useGameStore = () => {
    throw new Error('useGameStore is only available in React components. Use getGameStore() instead.');
};

// Export store instance getter for non-React usage (e.g., Controllers)
export const getGameStore = () => gameStore.getState();

// Export subscribe function for non-React usage
export const subscribeGameStore = gameStore.subscribe;

// Type helper for store state
export type GameStoreState = ReturnType<typeof gameStore.getState>;
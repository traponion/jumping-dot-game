/**
 * Game Render Adapter Interface for GameManager
 * Provides abstraction layer for game-specific rendering operations
 * Following Adapter Pattern like EditorRenderSystem
 */

import type { StageData } from '../core/StageLoader.js';
import type { Particle, Player, DeathMark } from '../types/GameTypes.js';

export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number;
    jumpNumber: number;
}

/**
 * Game-specific render adapter interface for GameManager
 * Focuses on game rendering operations rather than editor operations
 */
export interface IGameRenderAdapter {
    // Core rendering operations
    clearCanvas(): void;
    setDrawingStyle(): void;
    renderAll(): void;
    
    // Camera operations
    applyCameraTransform(camera: { x: number; y: number }): void;
    restoreCameraTransform(): void;
    
    // Stage rendering
    renderStage(stage: StageData): void;
    
    // Player rendering
    renderPlayer(player: Player): void;
    renderTrail(trail: Array<{ x: number; y: number }>, playerRadius: number): void;
    
    // Game effects
    renderDeathMarks(deathMarks: DeathMark[]): void;
    renderDeathAnimation(particles: Particle[]): void;
    renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void;
    
    // UI rendering
    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void;
    renderStartInstruction(): void;
    renderCredits(): void;
    
    // Landing predictions
    setLandingPredictions(predictions: LandingPrediction[]): void;
    renderLandingPredictions(): void;
    addLandingHistory(x: number, y: number): void;
    
    // Cleanup
    cleanup(): Promise<void>;
    dispose(): void;
}

/**
 * Factory for creating game render adapter
 */
export interface IGameRenderAdapterFactory {
    createGameRenderAdapter(canvasElement: HTMLCanvasElement): IGameRenderAdapter;
}
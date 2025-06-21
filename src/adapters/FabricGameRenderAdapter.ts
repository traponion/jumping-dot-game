/**
 * Fabric.js Game Render Adapter Implementation
 * Wraps FabricRenderSystem to implement IGameRenderAdapter interface
 * Provides adapter pattern for game rendering operations
 */

import type { IGameRenderAdapter, LandingPrediction } from './IGameRenderAdapter.js';
import type { StageData } from '../core/StageLoader.js';
import type { Player, DeathMark, Particle } from '../types/GameTypes.js';
import { FabricRenderSystem } from '../systems/FabricRenderSystem.js';

export class FabricGameRenderAdapter implements IGameRenderAdapter {
    private fabricRenderSystem: FabricRenderSystem;

    constructor(canvasElement: HTMLCanvasElement) {
        this.fabricRenderSystem = new FabricRenderSystem(canvasElement);
    }

    // Core rendering operations
    clearCanvas(): void {
        this.fabricRenderSystem.clearCanvas();
    }

    setDrawingStyle(): void {
        this.fabricRenderSystem.setDrawingStyle();
    }

    renderAll(): void {
        this.fabricRenderSystem.renderAll();
    }

    // Camera operations
    applyCameraTransform(camera: { x: number; y: number }): void {
        this.fabricRenderSystem.applyCameraTransform(camera);
    }

    restoreCameraTransform(): void {
        this.fabricRenderSystem.restoreCameraTransform();
    }

    // Stage rendering
    renderStage(stage: StageData): void {
        this.fabricRenderSystem.renderStage(stage);
    }

    // Player rendering
    renderPlayer(player: Player): void {
        this.fabricRenderSystem.renderPlayer(player);
    }


    renderTrail(trail: Array<{ x: number; y: number }>, playerRadius: number): void {
        this.fabricRenderSystem.renderTrail(trail, playerRadius);
    }

    // Game effects
    renderDeathMarks(deathMarks: DeathMark[]): void {
        this.fabricRenderSystem.renderDeathMarks(deathMarks);
    }


    renderDeathAnimation(particles: Particle[]): void {
        this.fabricRenderSystem.renderDeathAnimation(particles);
    }


    renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void {
        this.fabricRenderSystem.renderClearAnimation(particles, progress, playerX, playerY);
    }



    // UI rendering
    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        this.fabricRenderSystem.renderGameOverMenu(options, selectedIndex, finalScore);
    }

    renderStartInstruction(): void {
        this.fabricRenderSystem.renderStartInstruction();
    }

    renderCredits(): void {
        this.fabricRenderSystem.renderCredits();
    }

    // Landing predictions
    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.fabricRenderSystem.setLandingPredictions(predictions);
    }

    renderLandingPredictions(): void {
        this.fabricRenderSystem.renderLandingPredictions([]);
    }


    addLandingHistory(x: number, y: number): void {
        this.fabricRenderSystem.addLandingHistory(x, y);
    }

    // Cleanup
    async cleanup(): Promise<void> {
        // FabricRenderSystem.cleanup is async and returns Promise<void>
        await this.fabricRenderSystem.cleanup();
    }

    dispose(): void {
        this.fabricRenderSystem.dispose();
    }

    // Get wrapped render system for advanced operations if needed
    getWrappedRenderSystem(): FabricRenderSystem {
        return this.fabricRenderSystem;
    }
}

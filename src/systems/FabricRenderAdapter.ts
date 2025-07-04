/**
 * @fileoverview Fabric.js adapter implementing IRenderSystem interface
 * @module systems/FabricRenderAdapter
 * @description Simple proxy layer for FabricRenderSystem - beautiful delegation pattern
 */

import type { StageData } from '../core/StageLoader.js';
import type { Camera, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import { FabricRenderSystem } from './FabricRenderSystem.js';
import type { IRenderSystem, LandingPrediction, Position } from './IRenderSystem.js';

/**
 * FabricRenderAdapter - Simple delegation pattern implementation
 *
 * This class provides a clean proxy layer between IRenderSystem interface
 * and FabricRenderSystem implementation. All methods are simple forwarding
 * calls with no type conversion needed (since types are unified).
 *
 * Design Benefits:
 * - Zero type conversion logic needed
 * - No error handling complexity
 * - No privateMethod access issues
 * - Perfect adherence to dependency inversion principle
 */
export class FabricRenderAdapter implements IRenderSystem {
    private fabricRenderSystem: FabricRenderSystem;

    constructor(canvas: HTMLCanvasElement) {
        this.fabricRenderSystem = new FabricRenderSystem(canvas);
    }

    // ===== Canvas Management =====

    clearCanvas(): void {
        this.fabricRenderSystem.clearCanvas();
    }

    setDrawingStyle(): void {
        this.fabricRenderSystem.setDrawingStyle();
    }

    applyCameraTransform(camera: Camera): void {
        this.fabricRenderSystem.applyCameraTransform(camera);
    }

    restoreCameraTransform(): void {
        this.fabricRenderSystem.restoreCameraTransform();
    }

    renderAll(): void {
        this.fabricRenderSystem.renderAll();
    }

    // ===== Game Objects =====

    renderPlayer(player: Player): void {
        this.fabricRenderSystem.renderPlayer(player);
    }

    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        this.fabricRenderSystem.renderTrail(trail, playerRadius);
    }

    renderStage(stage: StageData): void {
        this.fabricRenderSystem.renderStage(stage);
    }

    renderDeathMarks(deathMarks: Array<{ x: number; y: number }>): void {
        this.fabricRenderSystem.renderDeathMarks(deathMarks);
    }

    // ===== UI Elements =====

    renderStartInstruction(): void {
        this.fabricRenderSystem.renderStartInstruction();
    }

    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void {
        this.fabricRenderSystem.renderGameOverMenu(options, selectedIndex, finalScore, deathCount);
    }

    renderCredits(): void {
        this.fabricRenderSystem.renderCredits();
    }

    // ===== Animations =====

    renderDeathAnimation(particles: Particle[]): void {
        this.fabricRenderSystem.renderDeathAnimation(particles);
    }

    renderSoulAnimation(particles: Particle[]): void {
        this.fabricRenderSystem.renderSoulAnimation(particles);
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        centerX: number,
        centerY: number
    ): void {
        this.fabricRenderSystem.renderClearAnimation(particles, progress, centerX, centerY);
    }

    // ===== Analytics & Predictions =====

    renderLandingPredictions(): void {
        this.fabricRenderSystem.renderLandingPredictions();
    }

    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.fabricRenderSystem.setLandingPredictions(predictions);
    }

    addLandingHistory(position: Position): void {
        this.fabricRenderSystem.addLandingHistory(position);
    }

    updateLandingPredictionAnimations(): void {
        this.fabricRenderSystem.updateLandingPredictionAnimations();
    }

    // ===== System Management =====

    async cleanup(): Promise<void> {
        await this.fabricRenderSystem.cleanup();
    }

    dispose(): void {
        this.fabricRenderSystem.dispose();
    }
}

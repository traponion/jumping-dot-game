// Mock render system for testing environment
// Based on Fabric.js official testing patterns

import type { StageData } from '../../core/StageLoader.js';
import type { IRenderSystem, Position } from '../../systems/IRenderSystem.js';
import type { LandingPrediction } from '../../types/AnalyticsTypes.js';
import type { Camera, Particle, Player, TrailPoint } from '../../types/GameTypes.js';

export interface MockFabricCanvas {
    width: number;
    height: number;
    clear(): void;
    dispose(): void;
    renderAll(): void;
    getObjects(): unknown[];
    add(obj: unknown): void;
    remove(obj: unknown): void;
    setViewportTransform(transform: number[]): void;
}

export class MockRenderSystem implements IRenderSystem {
    private canvasElement: HTMLCanvasElement;
    private mockCanvas: MockFabricCanvas;
    private landingPredictions: LandingPrediction[] = [];
    private landingHistory: Array<{ x: number; y: number; time: number }> = [];

    constructor(containerElement: HTMLElement) {
        this.canvasElement = containerElement as HTMLCanvasElement;

        // Mock implementation - no real canvas operations needed in tests
        this.mockCanvas = this.createMockCanvas();
    }

    private createMockCanvas(): MockFabricCanvas {
        return {
            width: this.canvasElement.width,
            height: this.canvasElement.height,
            clear: () => {},
            dispose: () => {},
            renderAll: () => {},
            getObjects: () => [],
            add: () => {},
            remove: () => {},
            setViewportTransform: () => {}
        };
    }

    // ===== Canvas Management =====

    clearCanvas(): void {
        this.mockCanvas.clear();
    }

    setDrawingStyle(): void {
        // Mock implementation
    }

    applyCameraTransform(camera: Camera): void {
        // Mock camera transform
        const transform = [1, 0, 0, 1, -camera.x, -camera.y];
        this.mockCanvas.setViewportTransform(transform);
    }

    restoreCameraTransform(): void {
        // Mock restore
        const transform = [1, 0, 0, 1, 0, 0];
        this.mockCanvas.setViewportTransform(transform);
    }

    renderAll(): void {
        this.mockCanvas.renderAll();
    }

    // ===== Game Objects =====

    renderPlayer(_player: Player): void {
        // Mock player rendering
    }

    renderTrail(_trail: TrailPoint[], _playerRadius: number): void {
        // Mock trail rendering
    }

    renderStage(_stage: StageData): void {
        // Mock stage rendering
    }

    renderDeathMarks(_deathMarks: Array<{ x: number; y: number }>): void {
        // Mock death marks rendering
    }

    // ===== UI Elements =====

    renderStartInstruction(): void {
        // Mock start instruction rendering
    }

    renderGameOverMenu(
        _options: string[],
        _selectedIndex: number,
        _finalScore: number,
        _deathCount?: number
    ): void {
        // Mock game over menu rendering
    }

    renderCredits(): void {
        // Mock credits rendering
    }

    // ===== Animations =====

    renderDeathAnimation(_particles: Particle[]): void {
        // Mock death animation rendering
    }

    renderSoulAnimation(_particles: Particle[]): void {
        // Mock soul animation rendering
    }

    renderClearAnimation(
        _particles: Particle[],
        _progress: number,
        _centerX: number,
        _centerY: number
    ): void {
        // Mock clear animation rendering
    }

    // ===== Analytics & Predictions =====

    renderLandingPredictions(): void {
        // Mock landing predictions rendering
    }

    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = [...predictions];
    }

    renderLandingHistory(): void {
        // Mock landing history rendering
    }

    addLandingHistory(position: Position): void {
        this.landingHistory.push({ x: position.x, y: position.y, time: Date.now() });
    }

    cleanupLandingHistory(): void {
        // Mock cleanup - remove old entries
        const cutoffTime = Date.now() - 30000; // Keep last 30 seconds
        this.landingHistory = this.landingHistory.filter((entry) => entry.time > cutoffTime);
    }

    updateLandingPredictionAnimations(): void {
        // Mock animation update
    }

    drawCrosshair(_position: Position): void {
        // Mock crosshair drawing
    }

    // ===== System Management =====

    async cleanup(): Promise<void> {
        // Mock async cleanup
        this.landingPredictions = [];
        this.landingHistory = [];
    }

    dispose(): void {
        this.mockCanvas.dispose();
        this.landingPredictions = [];
        this.landingHistory = [];
    }

    // ===== Test Utilities =====

    getMockCanvas(): MockFabricCanvas {
        return this.mockCanvas;
    }

    getLandingPredictions(): LandingPrediction[] {
        return [...this.landingPredictions];
    }

    getLandingHistory(): Array<{ x: number; y: number; time: number }> {
        return [...this.landingHistory];
    }
}

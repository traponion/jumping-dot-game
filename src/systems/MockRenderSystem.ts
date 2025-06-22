// Mock render system for testing environment
// Based on Fabric.js official testing patterns

import type { StageData } from '../core/StageLoader.js';
import type { Camera, Player } from '../types/GameTypes.js';

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

export class MockRenderSystem {
    private canvasElement: HTMLCanvasElement;
    private mockCanvas: MockFabricCanvas;
    private landingPredictions: unknown[] = [];
    private landingHistory: Array<{ x: number; y: number; time: number }> = [];

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;

        // Check if canvas context is available (same as FabricRenderSystem would do)
        const context = canvasElement.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context');
        }

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

    // Public API matching FabricRenderSystem
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

    renderStage(_stage: StageData): void {
        // Mock stage rendering
    }

    renderPlayer(_player: Player): void {
        // Mock player rendering
    }

    renderTrail(_trail: unknown[], _playerRadius: number): void {
        // Mock trail rendering
    }

    renderDeathMarks(_deathMarks: unknown[]): void {
        // Mock death marks rendering
    }

    renderDeathAnimation(_particles: unknown[]): void {
        // Mock death animation rendering
    }

    renderClearAnimation(
        _particles: unknown[],
        _progress: number,
        _playerX: number,
        _playerY: number
    ): void {
        // Mock clear animation rendering
    }

    renderStartInstruction(): void {
        // Mock start instruction rendering
    }

    renderGameOver(): void {
        // Mock game over rendering
    }

    renderGameOverMenu(_options: string[], _selectedIndex: number, _finalScore: number): void {
        // Mock game over menu rendering
    }

    renderCredits(): void {
        // Mock credits rendering
    }

    renderLandingPredictions(): void {
        // Mock landing predictions rendering
    }

    renderAll(): void {
        this.mockCanvas.renderAll();
    }

    setLandingPredictions(predictions: unknown[]): void {
        this.landingPredictions = [...predictions];
    }

    addLandingHistory(x: number, y: number): void {
        this.landingHistory.push({ x, y, time: Date.now() });
    }

    dispose(): void {
        this.mockCanvas.dispose();
        this.landingPredictions = [];
        this.landingHistory = [];
    }

    // Test utilities
    getMockCanvas(): MockFabricCanvas {
        return this.mockCanvas;
    }

    getLandingPredictions(): unknown[] {
        return [...this.landingPredictions];
    }

    getLandingHistory(): Array<{ x: number; y: number; time: number }> {
        return [...this.landingHistory];
    }
}

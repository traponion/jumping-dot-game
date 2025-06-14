// Mock render system for testing environment
// Based on Fabric.js official testing patterns

import type { Camera, Player } from '../types/GameTypes.js';
import type { StageData } from '../core/StageLoader.js';

export interface MockFabricCanvas {
    width: number;
    height: number;
    clear(): void;
    dispose(): void;
    renderAll(): void;
    getObjects(): any[];
    add(obj: any): void;
    remove(obj: any): void;
    setViewportTransform(transform: number[]): void;
}

export class MockRenderSystem {
    private canvasElement: HTMLCanvasElement;
    private mockCanvas: MockFabricCanvas;
    private landingPredictions: any[] = [];
    private landingHistory: any[] = [];

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvasElement = canvasElement;
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
            setViewportTransform: () => {},
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

    renderTrail(_trail: any[], _playerRadius: number): void {
        // Mock trail rendering
    }

    renderDeathMarks(_deathMarks: any[]): void {
        // Mock death marks rendering
    }

    renderDeathAnimation(_particles: any[]): void {
        // Mock death animation rendering
    }

    renderClearAnimation(_particles: any[], _progress: number, _playerX: number, _playerY: number): void {
        // Mock clear animation rendering
    }

    renderStartInstruction(): void {
        // Mock start instruction rendering
    }

    renderGameOver(): void {
        // Mock game over rendering
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

    setLandingPredictions(predictions: any[]): void {
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

    getLandingPredictions(): any[] {
        return [...this.landingPredictions];
    }

    getLandingHistory(): any[] {
        return [...this.landingHistory];
    }
}
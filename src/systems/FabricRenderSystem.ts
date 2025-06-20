/**
 * @fileoverview Refactored Fabric.js-based rendering system using Facade pattern
 * @module systems/FabricRenderSystem
 * @description Main rendering system that delegates to specialized renderers.
 */

import * as fabric from 'fabric';
import type { Goal, Spike, StageData } from '../core/StageLoader.js';
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import { StageRenderer } from './renderers/StageRenderer.js';
import { PlayerRenderer } from './renderers/PlayerRenderer.js';
import { EffectRenderer } from './renderers/EffectRenderer.js';
import { UIRenderer } from './renderers/UIRenderer.js';

export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number;
    jumpNumber: number;
}

/**
 * Main rendering system using Facade pattern
 * Delegates rendering tasks to specialized renderer classes
 */
export class FabricRenderSystem {
    private canvas: fabric.Canvas;
    
    // Specialized renderers
    private stageRenderer: StageRenderer;
    private playerRenderer: PlayerRenderer;
    private effectRenderer: EffectRenderer;
    private uiRenderer: UIRenderer;
    
    // Landing predictions and history
    private landingPredictions: LandingPrediction[] = [];
    private landingHistory: Array<{x: number; y: number; timestamp: number}> = [];
    
    private static readonly HISTORY_FADE_TIME = 3000;
    private static readonly LERP_SPEED = 0.15;

    constructor(canvasElement: HTMLCanvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            backgroundColor: '#87CEEB',
            selection: false,
            preserveObjectStacking: true
        });

        // Initialize specialized renderers
        this.stageRenderer = new StageRenderer(this.canvas);
        this.playerRenderer = new PlayerRenderer(this.canvas);
        this.effectRenderer = new EffectRenderer(this.canvas);
        this.uiRenderer = new UIRenderer(this.canvas);
    }

    // === Core Canvas Operations ===

    public clearCanvas(): void {
        this.canvas.clear();
        this.canvas.backgroundColor = '#87CEEB';
    }

    public setDrawingStyle(): void {
        // Basic drawing style setup if needed
    }

    public renderAll(): void {
        this.canvas.renderAll();
    }

    // === Camera Operations ===

    public applyCameraTransform(camera: Camera): void {
        this.canvas.viewportTransform = [1, 0, 0, 1, -camera.x, -camera.y];
    }

    public restoreCameraTransform(): void {
        this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    }

    // === Stage Rendering (Delegate to StageRenderer) ===

    public renderStage(stage: StageData): void {
        this.stageRenderer.renderStage(stage);
    }

    // === Player Rendering (Delegate to PlayerRenderer) ===

    public renderPlayer(player: Player): void {
        this.playerRenderer.renderPlayer(player);
    }

    public renderTrail(trail: TrailPoint[], playerRadius: number): void {
        this.playerRenderer.renderTrail(trail, playerRadius);
    }

    // === Effect Rendering (Delegate to EffectRenderer) ===

    public renderDeathMarks(deathMarks: DeathMark[]): void {
        this.effectRenderer.renderDeathMarks(deathMarks);
    }

    public renderDeathAnimation(particles: Particle[]): void {
        this.effectRenderer.renderDeathAnimation(particles);
    }

    public renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void {
        this.effectRenderer.renderClearAnimation(particles, progress, playerX, playerY);
    }

    public renderLandingPredictions(): void {
        this.updateLandingPredictionAnimations();
        this.effectRenderer.renderLandingPredictions(this.landingPredictions);
        this.renderLandingHistory();
    }

    // === UI Rendering (Delegate to UIRenderer) ===

    public renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        this.uiRenderer.renderGameOverMenu(options, selectedIndex, finalScore);
    }

    public renderStartInstruction(): void {
        this.uiRenderer.renderStartInstruction();
    }

    public renderCredits(): void {
        this.uiRenderer.renderCredits();
    }

    // === Landing Prediction System ===

    public setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
    }

    public addLandingHistory(x: number, y: number): void {
        this.landingHistory.push({ x, y, timestamp: Date.now() });
        this.cleanupLandingHistory();
    }

    private cleanupLandingHistory(): void {
        const now = Date.now();
        this.landingHistory = this.landingHistory.filter(
            item => now - item.timestamp < FabricRenderSystem.HISTORY_FADE_TIME
        );
    }

    private updateLandingPredictionAnimations(): void {
        // Simple animation updates for landing predictions
        // Implementation depends on specific animation requirements
    }

    private renderLandingHistory(): void {
        const now = Date.now();
        this.landingHistory.forEach(item => {
            const age = now - item.timestamp;
            const opacity = Math.max(0, 1 - age / FabricRenderSystem.HISTORY_FADE_TIME);
            
            if (opacity > 0) {
                const circle = new fabric.Circle({
                    left: item.x - 3,
                    top: item.y - 3,
                    radius: 3,
                    fill: `rgba(255, 255, 0, ${opacity * 0.7})`,
                    stroke: `rgba(255, 255, 255, ${opacity})`,
                    strokeWidth: 1,
                    selectable: false,
                    evented: false
                });
                this.canvas.add(circle);
            }
        });
    }

    // === Editor Mode Support ===

    public enableEditorMode(): void {
        this.canvas.selection = true;
        this.canvas.forEachObject(obj => {
            obj.selectable = true;
            obj.evented = true;
        });
    }

    public disableEditorMode(): void {
        this.canvas.selection = false;
        this.canvas.forEachObject(obj => {
            obj.selectable = false;
            obj.evented = false;
        });
    }

    // === Cleanup ===

    public async cleanup(): Promise<void> {
        // Clear all objects and dispose of canvas
        this.canvas.clear();
        this.landingHistory = [];
        this.landingPredictions = [];
        
        // Cleanup specialized renderers
        await this.stageRenderer.cleanup?.();
        await this.playerRenderer.cleanup?.();
        await this.effectRenderer.cleanup?.();
        await this.uiRenderer.cleanup?.();
    }

    public dispose(): void {
        this.canvas.dispose();
    }

    // === Legacy Compatibility ===

    public renderGameOver(): void {
        // Legacy method - delegate to UI renderer if needed
        this.uiRenderer.renderGameOver?.();
    }
}
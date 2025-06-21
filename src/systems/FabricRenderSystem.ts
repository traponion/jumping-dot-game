/**
 * @fileoverview Refactored Fabric.js-based rendering system using Facade pattern
 * @module systems/FabricRenderSystem
 * @description Main rendering system that delegates to specialized renderers.
 */

import * as fabric from 'fabric';
import type { StageData } from '../core/StageLoader.js';
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
    private landingHistory: Array<{x: number; y: number; timestamp: number}> = [];
    
    private static readonly HISTORY_FADE_TIME = 3000;


    constructor(canvasElement: HTMLCanvasElement) {
            try {
                this.canvas = new fabric.Canvas(canvasElement, {
                    backgroundColor: '#87CEEB',
                    selection: false,
                    preserveObjectStacking: true,
                    renderOnAddRemove: false, // Optimize performance
                    stateful: false // Optimize performance
                });
    
                // Initialize specialized renderers
                this.stageRenderer = new StageRenderer(this.canvas);
                this.playerRenderer = new PlayerRenderer(this.canvas);
                this.effectRenderer = new EffectRenderer(this.canvas);
                this.uiRenderer = new UIRenderer(this.canvas);
            } catch (error) {
                console.error('Failed to initialize FabricRenderSystem:', error);
                throw new Error(`FabricRenderSystem initialization failed: ${error instanceof Error ? error.message : String(error)}`);
            }
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
            // Delegate to EffectRenderer for trail rendering
            this.effectRenderer.renderTrail(trail, playerRadius);
        }





    // === Effect Rendering (Delegate to EffectRenderer) ===

    public renderDeathMarks(deathMarks: DeathMark[]): void {
            // Death marks are now handled by EffectRenderer.createDeathEffect
            // This method is kept for backward compatibility but delegates to effect creation
            deathMarks.forEach(mark => {
                this.effectRenderer.createDeathEffect(mark.x, mark.y);
            });
        }


    public renderDeathAnimation(particles: Particle[]): void {
            // Death animation is now handled by EffectRenderer.createExplosion
            // Create explosion effect for each particle position
            particles.forEach(particle => {
                this.effectRenderer.createExplosion(particle.x, particle.y, { color: '#ff6b6b' });
            });
        }



    public renderClearAnimation(_particles: Particle[], _progress: number, _playerX: number, _playerY: number): void {
            // Clear animation is now handled by EffectRenderer.clearEffects
            // Parameters for future animation enhancements
            this.effectRenderer.clearEffects();
        }




    public renderLandingPredictions(predictions: LandingPrediction[]): void {
            // Landing predictions are now handled internally by FabricRenderSystem
            this.setLandingPredictions(predictions);
        }


    // === UI Rendering (Delegate to UIRenderer) ===

    public renderGameOverMenu(_options: string[], _selectedIndex: number, finalScore: number): void {
                // Delegate to UIRenderer's game over overlay functionality
                this.uiRenderer.showGameOverOverlay(finalScore, false);
            }




    public renderStartInstruction(): void {
            // Delegate to UIRenderer's message functionality for start instructions
            this.uiRenderer.showMessage({ 
                text: 'Press SPACE to start!', 
                position: { x: this.canvas.getWidth() / 2, y: this.canvas.getHeight() / 2 },
                fontSize: 24,
                color: '#ffffff',
                duration: 3000
            });
        }



    public renderCredits(): void {
            // Delegate to UIRenderer's message functionality for credits
            this.uiRenderer.showMessage({ 
                text: 'Game by Team', 
                position: { x: this.canvas.getWidth() / 2, y: this.canvas.getHeight() / 2 },
                fontSize: 20,
                color: '#ffffff',
                duration: 5000
            });
        }



    // === Landing Prediction System ===

    public setLandingPredictions(_predictions: LandingPrediction[]): void {
        // Landing predictions are handled internally now
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
            
            // Cleanup specialized renderers using their dispose methods
            this.effectRenderer.dispose();
            this.uiRenderer.dispose();
            this.playerRenderer.dispose();
            // Note: StageRenderer doesn't have dispose method, so we skip it
        }


    public dispose(): void {
        this.canvas.dispose();
    }

    // === Legacy Compatibility ===

    public renderGameOver(): void {
            // Legacy method - delegate to UI renderer's game over overlay
            this.uiRenderer.showGameOverOverlay(0, false);
        }


}
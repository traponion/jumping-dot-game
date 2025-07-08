import * as fabric from 'fabric';
import { RENDERING_CONSTANTS } from '../../constants/GameConstants';
import type { LandingPrediction } from '../../types/AnalyticsTypes.js';
import type { Particle } from '../../types/GameTypes.js';
import {
    FABRIC_DEFAULTS,
    createGlowShadow,
    createNonInteractiveShape
} from '../../utils/FabricObjectFactory';
import type { Position } from '../IRenderSystem.js';

// Landing prediction interface for animation renderer
// LandingPrediction moved to domain layer: src/types/AnalyticsTypes.ts

export class AnimationRenderer {
    private landingPredictions: LandingPrediction[] = [];
    private animatedPredictions: {
        x: number;
        y: number;
        targetX: number;
        targetY: number;
        confidence: number;
        jumpNumber: number;
    }[] = [];
    private landingHistory: { x: number; y: number; timestamp: number }[] = [];
    private readonly LERP_SPEED = 0.1;
    private readonly HISTORY_FADE_TIME = 3000;

    constructor(private canvas: fabric.Canvas) {}

    renderDeathAnimation(particles: Particle[]): void {
        for (const particle of particles) {
            // レガシーレンダラーに合わせてサイズ計算を修正
            const radius = particle.size || RENDERING_CONSTANTS.ANIMATION.PARTICLE_RADIUS;
            const particleShape = new fabric.Circle(
                createNonInteractiveShape({
                    left: particle.x - radius,
                    top: particle.y - radius,
                    radius: radius,
                    fill: `rgba(255, 0, 0, ${particle.life})`
                })
            );
            this.canvas.add(particleShape);
        }
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        playerX: number,
        playerY: number
    ): void {
        // パーティクルを描画（レガシーレンダラーに合わせて固定サイズ2）
        for (const particle of particles) {
            const particleShape = new fabric.Circle(
                createNonInteractiveShape({
                    left: particle.x - RENDERING_CONSTANTS.ANIMATION.PARTICLE_RADIUS,
                    top: particle.y - RENDERING_CONSTANTS.ANIMATION.PARTICLE_RADIUS,
                    radius: RENDERING_CONSTANTS.ANIMATION.PARTICLE_RADIUS,
                    fill: `rgba(255, 255, 255, ${particle.life})`
                })
            );
            this.canvas.add(particleShape);
        }

        // "CLEAR!"テキストを描画
        if (progress < 0.8) {
            const clearText = new fabric.Text(
                'CLEAR!',
                createNonInteractiveShape({
                    left: playerX - 50,
                    top: playerY - 100,
                    fontSize: 40,
                    ...FABRIC_DEFAULTS.ARIAL_FONT,
                    fill: 'yellow'
                })
            );
            this.canvas.add(clearText);
        }
    }

    renderSoulAnimation(particles: Particle[]): void {
        for (const particle of particles) {
            // Soul particle with glowing effect
            const soulShape = new fabric.Circle(
                createNonInteractiveShape({
                    left: particle.x - 3,
                    top: particle.y - 3,
                    radius: 3,
                    fill: `rgba(255, 255, 255, ${particle.life})`,
                    stroke: `rgba(255, 255, 255, ${particle.life * 0.5})`,
                    strokeWidth: 2,
                    shadow: createGlowShadow()
                })
            );
            this.canvas.add(soulShape);
        }
    }

    renderLandingPredictions(): void {
        // Clean up old history first
        this.cleanupLandingHistory();

        // Render landing history (where player actually landed)
        this.renderLandingHistory();

        // Update animation positions for real-time crosshair
        for (const animPred of this.animatedPredictions) {
            // Smooth interpolation towards target position
            animPred.x += (animPred.targetX - animPred.x) * this.LERP_SPEED;
            animPred.y += (animPred.targetY - animPred.y) * this.LERP_SPEED;
        }

        // Render real-time animated predictions (main crosshair)
        for (const animPred of this.animatedPredictions) {
            this.drawCrosshair({ x: animPred.x, y: animPred.y });
        }
    }

    updateLandingPredictionAnimations(): void {
        // Update or create animated predictions
        for (let i = 0; i < this.landingPredictions.length; i++) {
            const prediction = this.landingPredictions[i];
            // Show trajectory marker closer to ground level
            const trajectoryOffsetX = RENDERING_CONSTANTS.ANIMATION.TRAJECTORY_OFFSET_X; // Further ahead for trajectory visualization
            const trajectoryOffsetY = RENDERING_CONSTANTS.ANIMATION.TRAJECTORY_OFFSET_Y; // Show closer to ground level
            const targetX = prediction.x + trajectoryOffsetX;
            const targetY = prediction.y + trajectoryOffsetY;

            if (i < this.animatedPredictions.length) {
                // Update existing animated prediction
                this.animatedPredictions[i].targetX = targetX;
                this.animatedPredictions[i].targetY = targetY;
                this.animatedPredictions[i].confidence = prediction.confidence;
                this.animatedPredictions[i].jumpNumber = prediction.jumpNumber;
            } else {
                // Create new animated prediction (start at target for immediate appearance)
                this.animatedPredictions.push({
                    x: targetX,
                    y: targetY,
                    targetX: targetX,
                    targetY: targetY,
                    confidence: prediction.confidence,
                    jumpNumber: prediction.jumpNumber
                });
            }
        }

        // Remove extra animated predictions if predictions array shrunk
        if (this.animatedPredictions.length > this.landingPredictions.length) {
            this.animatedPredictions = this.animatedPredictions.slice(
                0,
                this.landingPredictions.length
            );
        }
    }

    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
        this.updateLandingPredictionAnimations();
    }

    addLandingHistory(position: Position): void {
        this.landingHistory.push({
            x: position.x,
            y: position.y,
            timestamp: Date.now()
        });
    }

    private cleanupLandingHistory(): void {
        const now = Date.now();
        this.landingHistory = this.landingHistory.filter(
            (landing) => now - landing.timestamp < this.HISTORY_FADE_TIME
        );
    }

    private renderLandingHistory(): void {
        const now = Date.now();
        for (const landing of this.landingHistory) {
            const age = now - landing.timestamp;
            const opacity = Math.max(0, 1 - age / this.HISTORY_FADE_TIME);

            const historyLine = new fabric.Line(
                [
                    landing.x - RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE,
                    landing.y,
                    landing.x + RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE,
                    landing.y
                ],
                createNonInteractiveShape({
                    stroke: `rgba(0, 255, 0, ${opacity})`,
                    strokeWidth: 1
                })
            );
            this.canvas.add(historyLine);
        }
    }

    private drawCrosshair(position: Position): void {
        const x = position.x;
        const y = position.y;

        // 十字線を描画
        const horizontalLine = new fabric.Line(
            [
                x - RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE,
                y,
                x + RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE,
                y
            ],
            createNonInteractiveShape({
                stroke: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 2
            })
        );

        const verticalLine = new fabric.Line(
            [
                x,
                y - RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE,
                x,
                y + RENDERING_CONSTANTS.ANIMATION.CROSSHAIR_SIZE
            ],
            createNonInteractiveShape({
                stroke: 'rgba(255, 255, 255, 0.8)',
                strokeWidth: 2
            })
        );

        this.canvas.add(horizontalLine);
        this.canvas.add(verticalLine);
    }

    cleanup(): void {
        this.landingPredictions = [];
        this.animatedPredictions = [];
        this.landingHistory = [];
    }
}

import type { Spike, StageData } from '../core/StageLoader.js';
import type { Camera, DeathMark, Particle, Player, TrailPoint } from '../types/GameTypes.js';
import type { LandingPrediction } from './LandingPredictionSystem.js';

export class RenderSystem {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private landingPredictions: LandingPrediction[] = [];
    private animatedPredictions: { x: number; y: number; targetX: number; targetY: number; confidence: number; jumpNumber: number }[] = [];
    private lockedPredictions: LandingPrediction[] = []; // Precise physics-based predictions
    private lockTimestamps: number[] = []; // When each lock was created
    private readonly LERP_SPEED = 0.1; // Animation speed (0.1 = 10% per frame)
    private readonly LOCK_FADE_TIME = 2000; // Lock markers fade over 2 seconds

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D rendering context from canvas');
        }
        this.ctx = context;
    }

    clearCanvas(): void {
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    setDrawingStyle(): void {
        this.ctx.strokeStyle = 'white';
        this.ctx.fillStyle = 'white';
        this.ctx.lineWidth = 2;
    }

    applyCameraTransform(camera: Camera): void {
        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);
    }

    restoreCameraTransform(): void {
        this.ctx.restore();
    }

    renderPlayer(player: Player): void {
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    renderTrail(trail: TrailPoint[], playerRadius: number): void {
        for (let i = 0; i < trail.length; i++) {
            const point = trail[i];
            const alpha = (i + 1) / trail.length;
            const radius = playerRadius * alpha * 0.8;

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.6})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderStage(stage: StageData): void {
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;

        // Draw platforms
        for (const platform of stage.platforms) {
            this.ctx.beginPath();
            this.ctx.moveTo(platform.x1, platform.y1);
            this.ctx.lineTo(platform.x2, platform.y2);
            this.ctx.stroke();
        }

        // Draw spikes
        this.ctx.fillStyle = 'white';
        for (const spike of stage.spikes) {
            this.drawSpike(spike);
        }

        // Draw goal
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(stage.goal.x, stage.goal.y, stage.goal.width, stage.goal.height);

        // Draw flag pattern
        this.ctx.beginPath();
        this.ctx.moveTo(stage.goal.x, stage.goal.y);
        this.ctx.lineTo(stage.goal.x + stage.goal.width, stage.goal.y + stage.goal.height);
        this.ctx.moveTo(stage.goal.x + stage.goal.width, stage.goal.y);
        this.ctx.lineTo(stage.goal.x, stage.goal.y + stage.goal.height);
        this.ctx.stroke();

        // Draw texts
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(stage.startText.text, stage.startText.x, stage.startText.y);
        this.ctx.fillText(stage.goalText.text, stage.goalText.x, stage.goalText.y);

        // Draw edge messages
        if (stage.leftEdgeMessage) {
            this.ctx.font = '14px monospace';
            this.ctx.fillText(
                stage.leftEdgeMessage.text,
                stage.leftEdgeMessage.x,
                stage.leftEdgeMessage.y
            );
        }

        if (stage.leftEdgeSubMessage) {
            this.ctx.font = '12px monospace';
            this.ctx.fillText(
                stage.leftEdgeSubMessage.text,
                stage.leftEdgeSubMessage.x,
                stage.leftEdgeSubMessage.y
            );
        }
    }

    private drawSpike(spike: Spike): void {
        this.ctx.beginPath();
        this.ctx.moveTo(spike.x, spike.y + spike.height);
        this.ctx.lineTo(spike.x + spike.width / 2, spike.y);
        this.ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        this.ctx.closePath();
        this.ctx.fill();

        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }

    renderDeathMarks(deathMarks: DeathMark[]): void {
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        this.ctx.lineWidth = 3;

        for (const mark of deathMarks) {
            const size = 8;

            this.ctx.beginPath();
            this.ctx.moveTo(mark.x - size, mark.y - size);
            this.ctx.lineTo(mark.x + size, mark.y + size);
            this.ctx.moveTo(mark.x + size, mark.y - size);
            this.ctx.lineTo(mark.x - size, mark.y + size);
            this.ctx.stroke();
        }

        this.ctx.lineWidth = 2;
    }

    renderClearAnimation(
        particles: Particle[],
        progress: number,
        playerX: number,
        playerY: number
    ): void {
        // Draw celebration particles
        for (const particle of particles) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw pulsing "CLEAR!" text
        if (progress < 0.8) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 1;
            const alpha = Math.max(0, 1 - progress / 0.8);

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = `${Math.floor(32 * pulse)}px monospace`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText('CLEAR!', playerX, playerY - 50);
        }
    }

    renderDeathAnimation(particles: Particle[]): void {
        for (const particle of particles) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${particle.life})`;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size || 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    renderStartInstruction(): void {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE to Start', this.canvas.width / 2, this.canvas.height / 2);
    }

    renderGameOver(): void {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            'Game Over - Press R to restart',
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }

    renderCredits(): void {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Made by traponion', this.canvas.width / 2, this.canvas.height - 30);
        this.ctx.fillText(
            'github.com/traponion/jumping-dot-game',
            this.canvas.width / 2,
            this.canvas.height - 15
        );
    }

    setLandingPredictions(predictions: LandingPrediction[]): void {
        this.landingPredictions = predictions;
        this.updateAnimatedPredictions();
    }

    addLockedPrediction(prediction: LandingPrediction): void {
        this.lockedPredictions.push(prediction);
        this.lockTimestamps.push(Date.now());
    }

    clearOldLocks(): void {
        const now = Date.now();
        const validLocks = [];
        const validTimestamps = [];
        
        for (let i = 0; i < this.lockedPredictions.length; i++) {
            if (now - this.lockTimestamps[i] < this.LOCK_FADE_TIME) {
                validLocks.push(this.lockedPredictions[i]);
                validTimestamps.push(this.lockTimestamps[i]);
            }
        }
        
        this.lockedPredictions = validLocks;
        this.lockTimestamps = validTimestamps;
    }

    private updateAnimatedPredictions(): void {
        // Update or create animated predictions
        for (let i = 0; i < this.landingPredictions.length; i++) {
            const prediction = this.landingPredictions[i];
            // Show trajectory marker closer to ground level
            const trajectoryOffsetX = -30; // Further ahead for trajectory visualization
            const trajectoryOffsetY = -20; // Show closer to ground level
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

        // Remove excess animated predictions
        if (this.animatedPredictions.length > this.landingPredictions.length) {
            this.animatedPredictions.splice(this.landingPredictions.length);
        }
    }

    renderLandingPredictions(): void {
        // Clean up old locks first
        this.clearOldLocks();
        
        // Render locked predictions (afterimages)
        this.renderLockedPredictions();
        
        // Update animation positions for real-time crosshair
        for (const animPred of this.animatedPredictions) {
            // Smooth interpolation towards target position
            animPred.x += (animPred.targetX - animPred.x) * this.LERP_SPEED;
            animPred.y += (animPred.targetY - animPred.y) * this.LERP_SPEED;
        }

        // Render real-time animated predictions (main crosshair)
        for (let i = 0; i < this.animatedPredictions.length; i++) {
            const animPred = this.animatedPredictions[i];
            
            // More visible white that fades with distance and confidence
            const baseAlpha = animPred.confidence * 0.8;
            const alpha = Math.max(0.4, baseAlpha - (i * 0.2)); // Fade with distance
            
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 2;
            
            this.drawCrosshair(animPred.x, animPred.y, 8);
        }
    }

    private renderLockedPredictions(): void {
        const now = Date.now();
        
        for (let i = 0; i < this.lockedPredictions.length; i++) {
            const lock = this.lockedPredictions[i];
            const age = now - this.lockTimestamps[i];
            const fadeProgress = age / this.LOCK_FADE_TIME;
            const alpha = Math.max(0.1, 0.6 * (1 - fadeProgress)); // Fade from 0.6 to 0.1
            
            // Render locked prediction at actual landing spot
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.lineWidth = 1;
            
            this.drawCrosshair(lock.x, lock.y, 6); // Slightly smaller for locks
        }
    }

    private drawCrosshair(x: number, y: number, size: number): void {
        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size);
        this.ctx.lineTo(x, y + size);
        this.ctx.stroke();
        
        // Horizontal line  
        this.ctx.beginPath();
        this.ctx.moveTo(x - size, y);
        this.ctx.lineTo(x + size, y);
        this.ctx.stroke();
    }
}

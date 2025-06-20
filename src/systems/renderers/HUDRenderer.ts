/**
 * @fileoverview HUD (Heads-Up Display) renderer for game interface elements
 * @module systems/renderers/HUDRenderer
 * @description Renders score, time, lives, and level displays during gameplay.
 */

import * as fabric from 'fabric';

/**
 * HUD data interface for game status information
 */
export interface HUDData {
    score: number;
    time: number;
    lives?: number;
    level?: number;
}

/**
 * HUD renderer for game interface elements
 * @description Manages score, timer, lives, and level displays
 */
export class HUDRenderer {
    private canvas: fabric.Canvas;
    private hudElements: Map<string, fabric.Object> = new Map();

    /**
     * Create HUD renderer instance
     * @param canvas - Fabric canvas for rendering
     */
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Render complete HUD display
     * @param hudData - HUD information to display
     */
    public renderHUD(hudData: HUDData): void {
        this.updateScoreDisplay(hudData.score);
        this.updateTimeDisplay(hudData.time);
        
        if (hudData.lives !== undefined) {
            this.updateLivesDisplay(hudData.lives);
        }
        
        if (hudData.level !== undefined) {
            this.updateLevelDisplay(hudData.level);
        }
    }

    /**
     * Update score display
     * @param score - Current game score
     */
    private updateScoreDisplay(score: number): void {
        const key = 'score';
        const existing = this.hudElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text: `Score: ${score}` });
        } else {
            const scoreText = new fabric.Text(`Score: ${score}`, {
                left: 20,
                top: 20,
                fontSize: 18,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, scoreText);
            this.canvas.add(scoreText);
        }
    }

    /**
     * Update time display
     * @param timeInSeconds - Remaining time in seconds
     */
    private updateTimeDisplay(timeInSeconds: number): void {
        const key = 'time';
        const existing = this.hudElements.get(key);
        
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        const timeText = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        if (existing) {
            (existing as fabric.Text).set({ text: timeText });
        } else {
            const timeDisplay = new fabric.Text(timeText, {
                left: 20,
                top: 50,
                fontSize: 18,
                fill: timeInSeconds <= 30 ? '#ff4444' : '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, timeDisplay);
            this.canvas.add(timeDisplay);
        }
        
        // Update color for time warning
        if (existing && timeInSeconds <= 30) {
            (existing as fabric.Text).set({ fill: '#ff4444' });
        } else if (existing) {
            (existing as fabric.Text).set({ fill: '#ffffff' });
        }
    }

    /**
     * Update lives display
     * @param lives - Current player lives
     */
    private updateLivesDisplay(lives: number): void {
        const key = 'lives';
        const existing = this.hudElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text: `Lives: ${lives}` });
        } else {
            const livesText = new fabric.Text(`Lives: ${lives}`, {
                left: 20,
                top: 80,
                fontSize: 18,
                fill: lives <= 1 ? '#ff4444' : '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, livesText);
            this.canvas.add(livesText);
        }
        
        // Update color for low lives warning
        if (existing && lives <= 1) {
            (existing as fabric.Text).set({ fill: '#ff4444' });
        } else if (existing) {
            (existing as fabric.Text).set({ fill: '#ffffff' });
        }
    }

    /**
     * Update level display
     * @param level - Current game level
     */
    private updateLevelDisplay(level: number): void {
        const key = 'level';
        const existing = this.hudElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text: `Level: ${level}` });
        } else {
            const levelText = new fabric.Text(`Level: ${level}`, {
                left: 20,
                top: 110,
                fontSize: 18,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, levelText);
            this.canvas.add(levelText);
        }
    }

    /**
     * Clear all HUD elements
     */
    public clearHUD(): void {
        this.hudElements.forEach((element) => {
            this.canvas.remove(element);
        });
        this.hudElements.clear();
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearHUD();
    }
}
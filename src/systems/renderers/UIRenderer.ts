/**
 * @fileoverview UI elements rendering (HUD, debug info, overlays, messages)
 * @module systems/renderers/UIRenderer
 * @description Specialized renderer for user interface elements.
 * Separated from FabricRenderSystem to maintain single responsibility principle.
 */

import * as fabric from 'fabric';

/**
 * HUD display data
 */
interface HUDData {
    score: number;
    time: number;
    lives?: number;
    level?: number;
}

/**
 * Debug information display
 */
interface DebugInfo {
    fps: number;
    objectCount: number;
    playerPosition: { x: number; y: number };
    playerVelocity: { x: number; y: number };
}

/**
 * Message display configuration
 */
interface MessageConfig {
    text: string;
    color: string;
    fontSize: number;
    duration: number;
    position: { x: number; y: number };
}

/**
 * Renderer for UI elements (HUD, debug, overlays, messages)
 * @description Handles rendering of all user interface elements.
 */
export class UIRenderer {
    private canvas: fabric.Canvas;
    private hudElements: Map<string, fabric.Object> = new Map();
    private debugElements: Map<string, fabric.Object> = new Map();
    private messageElements: fabric.Object[] = [];
    private showDebug: boolean = false;

    /**
     * Creates new UIRenderer instance
     * @param canvas - Fabric.js canvas instance
     */
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Render HUD elements
     * @param hudData - HUD display data
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
     * @param score - Current score
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
     * @param time - Remaining time in seconds
     */
    private updateTimeDisplay(time: number): void {
        const key = 'time';
        const existing = this.hudElements.get(key);
        const timeText = `Time: ${Math.ceil(time)}s`;
        
        if (existing) {
            (existing as fabric.Text).set({ text: timeText });
        } else {
            const timeDisplay = new fabric.Text(timeText, {
                left: this.canvas.getWidth() - 120,
                top: 20,
                fontSize: 18,
                fill: time < 10 ? '#e53e3e' : '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, timeDisplay);
            this.canvas.add(timeDisplay);
        }
        
        // Update color based on time remaining
        if (existing) {
            (existing as fabric.Text).set({ 
                fill: time < 10 ? '#e53e3e' : '#ffffff' 
            });
        }
    }

    /**
     * Update lives display
     * @param lives - Remaining lives
     */
    private updateLivesDisplay(lives: number): void {
        const key = 'lives';
        const existing = this.hudElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text: `Lives: ${lives}` });
        } else {
            const livesText = new fabric.Text(`Lives: ${lives}`, {
                left: 20,
                top: 50,
                fontSize: 16,
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                selectable: false,
                evented: false
            });
            
            this.hudElements.set(key, livesText);
            this.canvas.add(livesText);
        }
    }

    /**
     * Update level display
     * @param level - Current level
     */
    private updateLevelDisplay(level: number): void {
        const key = 'level';
        const existing = this.hudElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text: `Level: ${level}` });
        } else {
            const levelText = new fabric.Text(`Level: ${level}`, {
                left: this.canvas.getWidth() / 2 - 40,
                top: 20,
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
     * Toggle debug information display
     */
    public toggleDebugDisplay(): void {
        this.showDebug = !this.showDebug;
        
        if (!this.showDebug) {
            this.clearDebugDisplay();
        }
    }

    /**
     * Update debug information display
     * @param debugInfo - Debug information to display
     */
    public updateDebugDisplay(debugInfo: DebugInfo): void {
        if (!this.showDebug) return;

        this.updateDebugText('fps', `FPS: ${debugInfo.fps}`, { x: 20, y: 100 });
        this.updateDebugText('objects', `Objects: ${debugInfo.objectCount}`, { x: 20, y: 120 });
        this.updateDebugText('position', 
            `Pos: (${debugInfo.playerPosition.x.toFixed(1)}, ${debugInfo.playerPosition.y.toFixed(1)})`, 
            { x: 20, y: 140 }
        );
        this.updateDebugText('velocity', 
            `Vel: (${debugInfo.playerVelocity.x.toFixed(1)}, ${debugInfo.playerVelocity.y.toFixed(1)})`, 
            { x: 20, y: 160 }
        );
    }

    /**
     * Update debug text element
     * @param key - Debug element key
     * @param text - Text to display
     * @param position - Position coordinates
     */
    private updateDebugText(key: string, text: string, position: { x: number; y: number }): void {
        const existing = this.debugElements.get(key);
        
        if (existing) {
            (existing as fabric.Text).set({ text });
        } else {
            const debugText = new fabric.Text(text, {
                left: position.x,
                top: position.y,
                fontSize: 12,
                fill: '#90cdf4',
                fontFamily: 'monospace',
                selectable: false,
                evented: false
            });
            
            this.debugElements.set(key, debugText);
            this.canvas.add(debugText);
        }
    }

    /**
     * Clear debug display
     */
    private clearDebugDisplay(): void {
        this.debugElements.forEach(element => {
            this.canvas.remove(element);
        });
        this.debugElements.clear();
    }

    /**
     * Show temporary message
     * @param config - Message configuration
     */
    public showMessage(config: MessageConfig): void {
        const message = new fabric.Text(config.text, {
            left: config.position.x,
            top: config.position.y,
            fontSize: config.fontSize,
            fill: config.color,
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        this.canvas.add(message);
        this.messageElements.push(message);

        // Auto-remove after duration
        setTimeout(() => {
            this.canvas.remove(message);
            const index = this.messageElements.indexOf(message);
            if (index > -1) {
                this.messageElements.splice(index, 1);
            }
        }, config.duration);
    }

    /**
     * Show game over overlay
     * @param score - Final score
     * @param isWin - Whether player won
     */
    public showGameOverOverlay(score: number, isWin: boolean): void {
        // Semi-transparent overlay
        const overlay = new fabric.Rect({
            left: 0,
            top: 0,
            width: this.canvas.getWidth(),
            height: this.canvas.getHeight(),
            fill: 'rgba(0, 0, 0, 0.7)',
            selectable: false,
            evented: false
        });

        // Game over text
        const gameOverText = new fabric.Text(isWin ? 'YOU WIN!' : 'GAME OVER', {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 - 50,
            fontSize: 48,
            fill: isWin ? '#68d391' : '#e53e3e',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        // Final score text
        const scoreText = new fabric.Text(`Final Score: ${score}`, {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 + 20,
            fontSize: 24,
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        this.canvas.add(overlay);
        this.canvas.add(gameOverText);
        this.canvas.add(scoreText);

        // Store for cleanup
        this.messageElements.push(overlay, gameOverText, scoreText);
    }

    /**
     * Clear all UI elements
     */
    public clearUI(): void {
        // Clear HUD elements
        this.hudElements.forEach(element => {
            this.canvas.remove(element);
        });
        this.hudElements.clear();

        // Clear debug elements
        this.clearDebugDisplay();

        // Clear message elements
        this.messageElements.forEach(element => {
            this.canvas.remove(element);
        });
        this.messageElements = [];
    }

    /**
     * Check if debug display is enabled
     */
    public isDebugEnabled(): boolean {
        return this.showDebug;
    }

    /**
     * Cleanup renderer resources
     */
    public dispose(): void {
        this.clearUI();
    }
}
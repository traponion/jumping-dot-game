/**
 * @fileoverview Overlay renderer for game screens and messages
 * @module systems/renderers/OverlayRenderer
 * @description Renders game over screens, temporary messages, and overlay displays.
 */

import * as fabric from 'fabric';

/**
 * Message configuration for temporary displays
 */
export interface MessageConfig {
    text: string;
    position: { x: number; y: number };
    fontSize: number;
    color: string;
    duration: number;
}

/**
 * Overlay renderer for game screens and messages
 * @description Manages game over overlays, temporary messages, and screen overlays
 */
export class OverlayRenderer {
    private canvas: fabric.Canvas;
    private messageElements: fabric.Object[] = [];

    /**
     * Create overlay renderer instance
     * @param canvas - Fabric canvas for rendering
     */
    constructor(canvas: fabric.Canvas) {
        this.canvas = canvas;
    }

    /**
     * Show game over overlay screen
     * @param score - Final game score
     * @param isWin - Whether player won or lost
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

        // Instructions text
        const instructionText = new fabric.Text('Press R to restart', {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 + 60,
            fontSize: 16,
            fill: '#cccccc',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        this.canvas.add(overlay);
        this.canvas.add(gameOverText);
        this.canvas.add(scoreText);
        this.canvas.add(instructionText);

        // Store for cleanup
        this.messageElements.push(overlay, gameOverText, scoreText, instructionText);
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
     * Show level completion overlay
     * @param level - Completed level number
     * @param score - Current score
     * @param timeBonus - Time bonus points
     */
    public showLevelCompleteOverlay(level: number, score: number, timeBonus: number): void {
        // Semi-transparent overlay
        const overlay = new fabric.Rect({
            left: 0,
            top: 0,
            width: this.canvas.getWidth(),
            height: this.canvas.getHeight(),
            fill: 'rgba(0, 0, 0, 0.5)',
            selectable: false,
            evented: false
        });

        // Level complete text
        const levelText = new fabric.Text(`LEVEL ${level} COMPLETE!`, {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 - 60,
            fontSize: 36,
            fill: '#68d391',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        // Score display
        const scoreText = new fabric.Text(`Score: ${score}`, {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 - 10,
            fontSize: 20,
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        // Time bonus display
        const bonusText = new fabric.Text(`Time Bonus: +${timeBonus}`, {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 + 20,
            fontSize: 18,
            fill: '#ffd700',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        this.canvas.add(overlay);
        this.canvas.add(levelText);
        this.canvas.add(scoreText);
        this.canvas.add(bonusText);

        // Store for cleanup and auto-remove after 3 seconds
        const elements = [overlay, levelText, scoreText, bonusText];
        this.messageElements.push(...elements);

        setTimeout(() => {
            elements.forEach(element => {
                this.canvas.remove(element);
                const index = this.messageElements.indexOf(element);
                if (index > -1) {
                    this.messageElements.splice(index, 1);
                }
            });
        }, 3000);
    }

    /**
     * Show pause overlay
     */
    public showPauseOverlay(): void {
        const overlay = new fabric.Rect({
            left: 0,
            top: 0,
            width: this.canvas.getWidth(),
            height: this.canvas.getHeight(),
            fill: 'rgba(0, 0, 0, 0.6)',
            selectable: false,
            evented: false
        });

        const pauseText = new fabric.Text('PAUSED', {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 - 20,
            fontSize: 48,
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        const instructionText = new fabric.Text('Press P to resume', {
            left: this.canvas.getWidth() / 2,
            top: this.canvas.getHeight() / 2 + 30,
            fontSize: 16,
            fill: '#cccccc',
            fontFamily: 'Arial, sans-serif',
            selectable: false,
            evented: false,
            originX: 'center',
            originY: 'center'
        });

        this.canvas.add(overlay);
        this.canvas.add(pauseText);
        this.canvas.add(instructionText);

        // Store with special identifier for pause overlay
        const pauseElements = [overlay, pauseText, instructionText];
        pauseElements.forEach(el => (el as any).isPauseOverlay = true);
        this.messageElements.push(...pauseElements);
    }

    /**
     * Hide pause overlay
     */
    public hidePauseOverlay(): void {
        const pauseElements = this.messageElements.filter(el => (el as any).isPauseOverlay);
        pauseElements.forEach(element => {
            this.canvas.remove(element);
            const index = this.messageElements.indexOf(element);
            if (index > -1) {
                this.messageElements.splice(index, 1);
            }
        });
    }

    /**
     * Clear all overlay elements
     */
    public clearOverlays(): void {
        this.messageElements.forEach((element) => {
            this.canvas.remove(element);
        });
        this.messageElements.length = 0;
    }

    /**
     * Clean up resources
     */
    public dispose(): void {
        this.clearOverlays();
    }
}
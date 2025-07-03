import * as fabric from 'fabric';

export class UIRenderer {
    private uiShapes: fabric.Object[] = [];

    constructor(private canvas: fabric.Canvas) {}

    renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void {
        this.cleanup();

        // Get current camera position from transform
        const transform = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
        const cameraX = -transform[4];
        const cameraY = -transform[5];

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();

        // Calculate screen center in world coordinates
        const screenCenterX = cameraX + canvasWidth / 2;
        const screenCenterY = cameraY + canvasHeight / 2;

        // Game Over title with shadow for visibility
        const gameOverText = new fabric.Text('GAME OVER', {
            left: screenCenterX,
            top: screenCenterY - 80,
            fontSize: 32,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.8)',
                offsetX: 2,
                offsetY: 2,
                blur: 4
            })
        });
        this.canvas.add(gameOverText);
        this.uiShapes.push(gameOverText);

        // Score display
        if (finalScore > 0) {
            const scoreText = new fabric.Text(`Score: ${finalScore}`, {
                left: screenCenterX,
                top: screenCenterY - 40,
                fontSize: 20,
                fill: 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                shadow: new fabric.Shadow({
                    color: 'rgba(0,0,0,0.8)',
                    offsetX: 1,
                    offsetY: 1,
                    blur: 2
                })
            });
            this.canvas.add(scoreText);
            this.uiShapes.push(scoreText);
        }

        // Menu options
        const startY = screenCenterY;
        const itemHeight = 50;

        options.forEach((option, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === selectedIndex;

            // Selection indicator
            if (isSelected) {
                const selectionRect = new fabric.Rect({
                    left: screenCenterX - 150,
                    top: y - 25,
                    width: 300,
                    height: 40,
                    fill: 'white',
                    selectable: false,
                    evented: false
                });
                this.canvas.add(selectionRect);
                this.uiShapes.push(selectionRect);
            }

            // Option text
            const optionText = new fabric.Text(option, {
                left: screenCenterX,
                top: y,
                fontSize: 24,
                fill: isSelected ? 'black' : 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                shadow: isSelected
                    ? null
                    : new fabric.Shadow({
                          color: 'rgba(0,0,0,0.8)',
                          offsetX: 1,
                          offsetY: 1,
                          blur: 2
                      })
            });
            this.canvas.add(optionText);
            this.uiShapes.push(optionText);
        });

        // Instructions
        const instructionText = new fabric.Text('↑↓ Navigate  ENTER/R/SPACE Select', {
            left: screenCenterX,
            top: cameraY + canvasHeight - 50,
            fontSize: 16,
            fill: '#aaa',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.8)',
                offsetX: 1,
                offsetY: 1,
                blur: 2
            })
        });
        this.canvas.add(instructionText);
        this.uiShapes.push(instructionText);
    }

    renderStartInstruction(): void {
        // HTML要素で表示するため、Canvas描画は不要
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.remove('hidden');
        if (gameOverScreen) gameOverScreen.classList.add('hidden');
    }

    renderGameOver(): void {
        // HTML要素で表示するため、Canvas描画は不要
        const startScreen = document.getElementById('startScreen');
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (startScreen) startScreen.classList.add('hidden');
        if (gameOverScreen) gameOverScreen.classList.remove('hidden');
    }

    renderCredits(): void {
        // クレジットはCanvas外に表示するため、ここでは何もしない
    }

    cleanup(): void {
        // Remove all UI shapes from canvas
        for (const shape of this.uiShapes) {
            this.canvas.remove(shape);
        }
        this.uiShapes = [];
    }
}

import * as fabric from 'fabric';
import { RENDERING_CONSTANTS } from '../../constants/GameConstants';
import { createStandardShadow, createTitleShadow } from '../../utils/FabricObjectFactory';

export class UIRenderer {
    private uiShapes: fabric.Object[] = [];

    constructor(private canvas: fabric.Canvas) {}

    renderGameOverMenu(
        options: string[],
        selectedIndex: number,
        finalScore: number,
        deathCount?: number
    ): void {
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

        // Create game over title
        const gameOverText = this.createGameOverTitle(screenCenterX, screenCenterY);
        this.canvas.add(gameOverText);
        this.uiShapes.push(gameOverText);

        // Create score display
        const scoreText = this.createScoreDisplay(screenCenterX, screenCenterY, finalScore);
        if (scoreText) {
            this.canvas.add(scoreText);
            this.uiShapes.push(scoreText);
        }

        // Create death count display
        if (deathCount !== undefined) {
            const deathText = this.createDeathDisplay(screenCenterX, screenCenterY, deathCount);
            this.canvas.add(deathText);
            this.uiShapes.push(deathText);
        }

        // Create menu options
        const menuShapes = this.createMenuOptions(
            options,
            selectedIndex,
            screenCenterX,
            screenCenterY
        );
        for (const shape of menuShapes) {
            this.canvas.add(shape);
            this.uiShapes.push(shape);
        }

        // Create instructions
        const instructionText = this.createInstructions(screenCenterX, cameraY, canvasHeight);
        this.canvas.add(instructionText);
        this.uiShapes.push(instructionText);
    }

    private createGameOverTitle(screenCenterX: number, screenCenterY: number): fabric.Text {
        return new fabric.Text('GAME OVER', {
            left: screenCenterX,
            top: screenCenterY - 80,
            fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.TITLE_SIZE,
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: createTitleShadow()
        });
    }

    private createScoreDisplay(
        screenCenterX: number,
        screenCenterY: number,
        finalScore: number
    ): fabric.Text | null {
        if (finalScore <= 0) {
            return null;
        }

        return new fabric.Text(`Score: ${finalScore}`, {
            left: screenCenterX,
            top: screenCenterY - 40,
            fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.SMALL_SIZE + 6, // 20px for score display
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: createStandardShadow()
        });
    }

    private createDeathDisplay(
        screenCenterX: number,
        screenCenterY: number,
        deathCount: number
    ): fabric.Text {
        return new fabric.Text(`Deaths: ${deathCount}`, {
            left: screenCenterX,
            top: screenCenterY - 15, // Position below score display
            fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.SMALL_SIZE + 6, // 20px for death count display
            fill: 'white',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: createStandardShadow()
        });
    }

    private createMenuOptions(
        options: string[],
        selectedIndex: number,
        screenCenterX: number,
        screenCenterY: number
    ): fabric.Object[] {
        const shapes: fabric.Object[] = [];
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
                shapes.push(selectionRect);
            }

            // Option text
            const optionText = new fabric.Text(option, {
                left: screenCenterX,
                top: y,
                fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.MENU_SIZE,
                fill: isSelected ? 'black' : 'white',
                fontFamily: 'monospace',
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                shadow: isSelected ? null : createStandardShadow()
            });
            shapes.push(optionText);
        });

        return shapes;
    }

    private createInstructions(
        screenCenterX: number,
        cameraY: number,
        canvasHeight: number
    ): fabric.Text {
        return new fabric.Text('↑↓ Navigate  ENTER/R/SPACE Select', {
            left: screenCenterX,
            top: cameraY + canvasHeight - 50,
            fontSize: RENDERING_CONSTANTS.TYPOGRAPHY.INSTRUCTION_SIZE,
            fill: '#aaa',
            fontFamily: 'monospace',
            originX: 'center',
            originY: 'center',
            selectable: false,
            evented: false,
            shadow: createStandardShadow()
        });
    }

    renderStartInstruction(): void {
        // HTML DOM operations moved to GameUI.showStartScreen()
        // Canvas rendering responsibility only - no action needed for start instruction
    }

    renderGameOver(): void {
        // HTML DOM operations moved to GameUI.showGameOverScreen()
        // Canvas rendering responsibility only - no action needed for game over screen
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

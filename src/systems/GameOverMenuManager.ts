import * as PIXI from 'pixi.js';

/**
 * Manages game over menu using PixiJS Container composition
 */
export class GameOverMenuManager {
    private menuContainer: PIXI.Container;
    private app: PIXI.Application;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.menuContainer = new PIXI.Container();
        this.menuContainer.visible = false;
    }

    /**
     * Create game over menu with options and selection
     */
    createMenu(options: string[], selectedIndex: number, finalScore: number): void {
        // Clear previous menu content
        this.menuContainer.removeChildren();

        const screenHeight = this.app.screen.height;

        // Game Over title with shadow effect
        const gameOverText = new PIXI.Text(
            'GAME OVER',
            new PIXI.TextStyle({
                fontSize: 32,
                fill: 'white',
                fontFamily: 'monospace',
                dropShadow: {
                    color: 0x000000,
                    blur: 4,
                    distance: 2,
                    alpha: 0.8
                }
            })
        );
        gameOverText.anchor.set(0.5, 0.5);
        gameOverText.position.set(0, -80);
        this.menuContainer.addChild(gameOverText);

        // Score display
        if (finalScore > 0) {
            const scoreText = new PIXI.Text(
                `Score: ${finalScore}`,
                new PIXI.TextStyle({
                    fontSize: 20,
                    fill: 'white',
                    fontFamily: 'monospace',
                    dropShadow: {
                        color: 0x000000,
                        blur: 2,
                        distance: 1,
                        alpha: 0.8
                    }
                })
            );
            scoreText.anchor.set(0.5, 0.5);
            scoreText.position.set(0, -40);
            this.menuContainer.addChild(scoreText);
        }

        // Menu options
        const startY = 0;
        const itemHeight = 50;

        options.forEach((option, index) => {
            const y = startY + index * itemHeight;
            const isSelected = index === selectedIndex;

            // Selection indicator background
            if (isSelected) {
                const selectionRect = new PIXI.Graphics();
                selectionRect.beginFill(0xffffff);
                selectionRect.drawRect(-150, -20, 300, 40);
                selectionRect.endFill();
                selectionRect.position.set(0, y);
                this.menuContainer.addChild(selectionRect);
            }

            // Option text
            const optionText = new PIXI.Text(
                option,
                new PIXI.TextStyle({
                    fontSize: 24,
                    fill: isSelected ? 'black' : 'white',
                    fontFamily: 'monospace',
                    ...(isSelected
                        ? {}
                        : {
                              dropShadow: {
                                  color: 0x000000,
                                  blur: 2,
                                  distance: 1,
                                  alpha: 0.8
                              }
                          })
                })
            );
            optionText.anchor.set(0.5, 0.5);
            optionText.position.set(0, y);
            this.menuContainer.addChild(optionText);
        });

        // Instructions at bottom
        const instructionText = new PIXI.Text(
            '↑↓ Navigate  ENTER/R/SPACE Select',
            new PIXI.TextStyle({
                fontSize: 16,
                fill: '#aaaaaa',
                fontFamily: 'monospace',
                dropShadow: {
                    color: 0x000000,
                    blur: 2,
                    distance: 1,
                    alpha: 0.8
                }
            })
        );
        instructionText.anchor.set(0.5, 1);
        instructionText.position.set(0, screenHeight / 2 - 50);
        this.menuContainer.addChild(instructionText);
    }

    /**
     * Update menu selection
     */
    updateSelection(options: string[], selectedIndex: number, finalScore: number): void {
        this.createMenu(options, selectedIndex, finalScore);
    }

    /**
     * Position menu at camera center
     */
    positionMenu(cameraX: number, cameraY: number): void {
        const screenCenterX = cameraX + this.app.screen.width / 2;
        const screenCenterY = cameraY + this.app.screen.height / 2;
        this.menuContainer.position.set(screenCenterX, screenCenterY);
    }

    /**
     * Show menu
     */
    showMenu(): void {
        this.menuContainer.visible = true;
    }

    /**
     * Hide menu
     */
    hideMenu(): void {
        this.menuContainer.visible = false;
    }

    /**
     * Get menu container for adding to stage
     */
    getMenuContainer(): PIXI.Container {
        return this.menuContainer;
    }

    /**
     * Destroy menu and cleanup resources
     */
    destroy(): void {
        this.menuContainer.destroy({ children: true });
    }
}

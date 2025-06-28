import * as PIXI from 'pixi.js';

/**
 * Manages stage transition effects using PixiJS
 */
export class StageTransitionManager {
    private app: PIXI.Application;
    private transitionContainer: PIXI.Container;
    private isTransitionActive = false;
    private currentAnimation: number | null = null;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.transitionContainer = new PIXI.Container();
        this.transitionContainer.visible = false;
    }

    /**
     * Fade out transition effect
     */
    fadeOut(duration: number): Promise<void> {
        return new Promise((resolve) => {
            this.isTransitionActive = true;
            this.transitionContainer.removeChildren();

            // Create black overlay
            const overlay = new PIXI.Graphics();
            overlay.rect(0, 0, this.app.screen.width, this.app.screen.height).fill(0x000000);
            overlay.alpha = 0;

            this.transitionContainer.addChild(overlay);
            this.transitionContainer.visible = true;

            // Animate fade out
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                overlay.alpha = progress;

                if (progress < 1) {
                    this.currentAnimation = requestAnimationFrame(animate);
                } else {
                    this.currentAnimation = null;
                    resolve();
                }
            };

            this.currentAnimation = requestAnimationFrame(animate);
        });
    }

    /**
     * Fade in transition effect
     */
    fadeIn(duration: number): Promise<void> {
        return new Promise((resolve) => {
            this.isTransitionActive = true;
            this.transitionContainer.removeChildren();

            // Create black overlay starting at full opacity
            const overlay = new PIXI.Graphics();
            overlay.rect(0, 0, this.app.screen.width, this.app.screen.height).fill(0x000000);
            overlay.alpha = 1;

            this.transitionContainer.addChild(overlay);
            this.transitionContainer.visible = true;

            // Animate fade in
            const startTime = Date.now();
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                overlay.alpha = 1 - progress;

                if (progress < 1) {
                    this.currentAnimation = requestAnimationFrame(animate);
                } else {
                    this.transitionContainer.visible = false;
                    this.isTransitionActive = false;
                    this.currentAnimation = null;
                    resolve();
                }
            };

            this.currentAnimation = requestAnimationFrame(animate);
        });
    }

    /**
     * Show loading screen with message
     */
    showLoadingScreen(message: string): void {
        this.isTransitionActive = true;
        this.transitionContainer.removeChildren();

        // Create dark overlay
        const overlay = new PIXI.Graphics();
        overlay
            .rect(0, 0, this.app.screen.width, this.app.screen.height)
            .fill({ color: 0x000000, alpha: 0.8 });

        // Create loading text
        const loadingText = new PIXI.Text({
            text: message,
            style: new PIXI.TextStyle({
                fontSize: 24,
                fill: 'white',
                fontFamily: 'monospace',
                dropShadow: {
                    color: 0x000000,
                    blur: 4,
                    distance: 2,
                    alpha: 0.8
                }
            })
        });
        loadingText.anchor.set(0.5, 0.5);
        loadingText.position.set(this.app.screen.width / 2, this.app.screen.height / 2);

        this.transitionContainer.addChild(overlay);
        this.transitionContainer.addChild(loadingText);
        this.transitionContainer.visible = true;
    }

    /**
     * Hide loading screen
     */
    hideLoadingScreen(): void {
        this.transitionContainer.visible = false;
        this.isTransitionActive = false;
    }

    /**
     * Flash effect for quick visual feedback
     */
    flashEffect(color: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            this.isTransitionActive = true;
            this.transitionContainer.removeChildren();

            // Create colored overlay
            const flash = new PIXI.Graphics();
            flash
                .rect(0, 0, this.app.screen.width, this.app.screen.height)
                .fill({ color: color, alpha: 0.7 });
            flash.alpha = 0;

            this.transitionContainer.addChild(flash);
            this.transitionContainer.visible = true;

            // Animate flash effect (fade in then out)
            const startTime = Date.now();
            const halfDuration = duration / 2;

            const animate = () => {
                const elapsed = Date.now() - startTime;

                if (elapsed < halfDuration) {
                    // Fade in
                    const progress = elapsed / halfDuration;
                    flash.alpha = progress;
                } else if (elapsed < duration) {
                    // Fade out
                    const progress = (elapsed - halfDuration) / halfDuration;
                    flash.alpha = 1 - progress;
                } else {
                    // Complete
                    this.transitionContainer.visible = false;
                    this.isTransitionActive = false;
                    this.currentAnimation = null;
                    resolve();
                    return;
                }

                this.currentAnimation = requestAnimationFrame(animate);
            };

            this.currentAnimation = requestAnimationFrame(animate);
        });
    }

    /**
     * Stage completion celebration effect
     */
    stageCompleteEffect(score: number): Promise<void> {
        return new Promise((resolve) => {
            this.isTransitionActive = true;
            this.transitionContainer.removeChildren();

            // Create celebration overlay
            const overlay = new PIXI.Graphics();
            overlay
                .rect(0, 0, this.app.screen.width, this.app.screen.height)
                .fill({ color: 0x000000, alpha: 0.7 });

            // Stage complete text
            const completeText = new PIXI.Text({
                text: 'Stage Complete!',
                style: new PIXI.TextStyle({
                    fontSize: 36,
                    fill: '#00ff00',
                    fontFamily: 'monospace',
                    dropShadow: {
                        color: 0x000000,
                        blur: 4,
                        distance: 2,
                        alpha: 0.8
                    }
                })
            });
            completeText.anchor.set(0.5, 0.5);
            completeText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 - 30);

            // Score text
            const scoreText = new PIXI.Text({
                text: `Score: ${score}`,
                style: new PIXI.TextStyle({
                    fontSize: 24,
                    fill: 'white',
                    fontFamily: 'monospace',
                    dropShadow: {
                        color: 0x000000,
                        blur: 4,
                        distance: 2,
                        alpha: 0.8
                    }
                })
            });
            scoreText.anchor.set(0.5, 0.5);
            scoreText.position.set(this.app.screen.width / 2, this.app.screen.height / 2 + 30);

            this.transitionContainer.addChild(overlay);
            this.transitionContainer.addChild(completeText);
            this.transitionContainer.addChild(scoreText);
            this.transitionContainer.visible = true;

            // Auto-hide after 2 seconds
            setTimeout(() => {
                this.transitionContainer.visible = false;
                this.isTransitionActive = false;
                resolve();
            }, 2000);
        });
    }

    /**
     * Check if transition is currently active
     */
    isTransitioning(): boolean {
        return this.isTransitionActive;
    }

    /**
     * Cancel any ongoing transition
     */
    cancelTransition(): void {
        if (this.currentAnimation) {
            cancelAnimationFrame(this.currentAnimation);
            this.currentAnimation = null;
        }
        this.transitionContainer.visible = false;
        this.isTransitionActive = false;
    }

    /**
     * Get transition container for adding to stage
     */
    getTransitionContainer(): PIXI.Container {
        return this.transitionContainer;
    }

    /**
     * Destroy transition manager and cleanup resources
     */
    destroy(): void {
        this.cancelTransition();
        this.transitionContainer.destroy({ children: true });
    }
}

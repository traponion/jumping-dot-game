/**
 * GameLoop - Manages the game's animation frame loop and timing
 *
 * Responsibilities:
 * - requestAnimationFrame management
 * - Frame-by-frame update/render coordination
 * - Delta time calculation and frame rate control
 * - Animation lifecycle management
 *
 * This class follows Single Responsibility Principle by handling only game loop timing concerns.
 */
export class GameLoop {
    private lastTime: number | null = null;
    private animationId: number | null = null;
    private isCleanedUp = false;

    // Callbacks for update and render
    private updateCallback: ((deltaTime: number) => void) | null = null;
    private renderCallback: (() => void) | null = null;

    /**
     * Set the update callback function
     */
    setUpdateCallback(callback: (deltaTime: number) => void): void {
        this.updateCallback = callback;
    }

    /**
     * Set the render callback function
     */
    setRenderCallback(callback: () => void): void {
        this.renderCallback = callback;
    }

    /**
     * Start the game loop
     */
    start(): void {
        if (this.isCleanedUp) {
            console.warn('Cannot start game loop on cleaned up instance');
            return;
        }

        if (!(this.updateCallback && this.renderCallback)) {
            throw new Error('Update and render callbacks must be set before starting game loop');
        }

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        this.lastTime = null;
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Stop the game loop
     */
    stop(): void {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.lastTime = null;
    }

    /**
     * Check if the game loop is currently running
     */
    isRunning(): boolean {
        return this.animationId !== null;
    }

    /**
     * Main game loop function
     */
    private gameLoop(currentTime: number): void {
        // Prevent execution if cleaned up
        if (this.isCleanedUp) {
            return;
        }

        // Initialize timing on first frame
        if (this.lastTime === null) {
            this.lastTime = currentTime;
            this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
            return;
        }

        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        // Clamp delta time to prevent large jumps (max 2 frames at 60fps)
        const clampedDelta = Math.min(deltaTime, 16.67 * 2);

        try {
            // Execute update and render callbacks
            if (this.updateCallback) {
                this.updateCallback(clampedDelta);
            }

            if (this.renderCallback) {
                this.renderCallback();
            }
        } catch (error) {
            console.error('Critical error in game loop, stopping:', error);
            this.stop(); // Stop the game loop on critical error
            return; // Prevent scheduling next frame
        }

        // Schedule next frame
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }

    /**
     * Cleanup the game loop
     */
    cleanup(): void {
        this.isCleanedUp = true;
        this.stop();
        this.updateCallback = null;
        this.renderCallback = null;
    }

    /**
     * Get current animation frame ID (for testing)
     */
    getAnimationId(): number | null {
        return this.animationId;
    }

    /**
     * Set animation frame ID (for testing)
     */
    setAnimationId(id: number | null): void {
        this.animationId = id;
    }

    /**
     * Check if the game loop has been cleaned up
     */
    isCleanedUpState(): boolean {
        return this.isCleanedUp;
    }

    /**
     * Reset cleanup state (for testing)
     */
    resetCleanupState(): void {
        this.isCleanedUp = false;
    }
}

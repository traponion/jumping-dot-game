import type { Camera } from '../../types/GameTypes';

/**
 * Canvas Management Interface
 * Responsible for canvas operations and camera management
 */
export interface ICanvasManager {
    /**
     * Clear the canvas for new rendering
     */
    clearCanvas(): void;

    /**
     * Set drawing style for rendering context
     */
    setDrawingStyle(): void;

    /**
     * Apply camera transform to rendering context
     * @param camera Camera position and properties
     */
    applyCameraTransform(camera: Camera): void;

    /**
     * Restore original camera transform
     */
    restoreCameraTransform(): void;

    /**
     * Render all pending objects to the canvas
     */
    renderAll(): void;
}

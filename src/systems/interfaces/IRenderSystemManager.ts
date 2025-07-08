/**
 * Render System Manager Interface
 * Responsible for system lifecycle management
 */
export interface IRenderSystemManager {
    /**
     * Clean up rendering resources (async for complex cleanup)
     */
    cleanup(): Promise<void>;

    /**
     * Dispose of rendering system and release all resources
     */
    dispose(): void;
}

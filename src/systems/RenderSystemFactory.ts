/**
 * @fileoverview Render system factory
 * @module systems/RenderSystemFactory
 * @description Infrastructure Layer - Factory pattern for creating appropriate render systems.
 * Supports both production (Fabric.js) and test (Mock) environments.
 */

import { FabricRenderAdapter } from './FabricRenderAdapter.js';
import { MockRenderSystem } from './MockRenderSystem.js';

/**
 * Creates appropriate render system based on environment
 */
export function createGameRenderSystem(canvasElement: HTMLCanvasElement) {
    // Environment detection for test vs production
    const isTestEnvironment =
        typeof globalThis.window === 'undefined' || globalThis.process?.env?.NODE_ENV === 'test';

    if (isTestEnvironment) {
        return new MockRenderSystem(canvasElement);
    }
    return new FabricRenderAdapter(canvasElement);
}

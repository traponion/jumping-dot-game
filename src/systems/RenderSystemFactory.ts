/**
 * @fileoverview Render system factory
 * @module systems/RenderSystemFactory
 * @description Infrastructure Layer - Factory pattern for creating appropriate render systems.
 * Supports both production (Pixi.JS) and test (Mock) environments.
 */

import { MockRenderSystem } from '../test/mocks/MockRenderSystem.js';
import { PixiRenderSystem } from './PixiRenderSystem.js';

/**
 * Creates appropriate render system based on environment
 */
export function createGameRenderSystem(containerElement: HTMLElement) {
    // Environment detection for test vs production
    const isTestEnvironment =
        typeof globalThis.window === 'undefined' || globalThis.process?.env?.NODE_ENV === 'test';

    if (isTestEnvironment) {
        return new MockRenderSystem(containerElement);
    }
    return new PixiRenderSystem(containerElement);
}

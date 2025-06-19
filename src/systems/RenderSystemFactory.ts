/**
 * @fileoverview Render system factory for environment-based selection
 * @module systems/RenderSystemFactory
 * @description Infrastructure Layer - Factory pattern for creating appropriate render systems.
 * Based on Fabric.js official testing patterns and uses Adapter Pattern for better testability.
 * Automatically selects mock or production renderers based on environment detection.
 */

import { FabricRenderAdapter } from '../adapters/FabricRenderAdapter.js';
import type { EditorCallbacks, IRenderAdapter } from '../adapters/IRenderAdapter.js';
import { MockRenderAdapter } from '../adapters/MockRenderAdapter.js';
import { EditorRenderSystem } from './EditorRenderSystem.js';
import { FabricRenderSystem } from './FabricRenderSystem.js';
import { MockRenderSystem } from './MockRenderSystem.js';

/**
 * Environment detection utility (matching vitest.setup.ts)
 * @function isJSDOM
 * @returns {boolean} True if running in JSDOM environment
 * @description Detects if code is running in JSDOM virtual DOM environment
 */
export function isJSDOM(): boolean {
    return typeof window !== 'undefined' && 'jsdom' in globalThis;
}

/**
 * Check if running in test environment
 * @function isTestEnvironment
 * @returns {boolean} True if in test environment (Node.js test, Vitest, or JSDOM)
 * @description Detects various test environments for proper render system selection
 */
export function isTestEnvironment(): boolean {
    return (
        typeof process !== 'undefined' &&
        (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || isJSDOM())
    );
}

/**
 * Create appropriate render system based on environment
 * @function createRenderSystem
 * @param {HTMLCanvasElement} canvasElement - Canvas element for rendering
 * @returns {FabricRenderSystem | MockRenderSystem} Environment-appropriate render system
 * @description Factory function that returns mock renderer for tests, Fabric.js for production
 */
export function createRenderSystem(
    canvasElement: HTMLCanvasElement
): FabricRenderSystem | MockRenderSystem {
    if (isTestEnvironment()) {
        // Use mock renderer in test environment
        return new MockRenderSystem(canvasElement);
    }

    // Use Fabric.js renderer in production/development
    return new FabricRenderSystem(canvasElement);
}

/**
 * Create appropriate render adapter based on environment
 * @function createRenderAdapter
 * @param {HTMLCanvasElement} canvasElement - Canvas element for rendering
 * @param {EditorCallbacks} [callbacks={}] - Editor callback functions
 * @returns {IRenderAdapter} Environment-appropriate render adapter
 * @description Adapter-based factory that returns mock or Fabric.js adapter based on environment
 */
export function createRenderAdapter(
    canvasElement: HTMLCanvasElement,
    callbacks: EditorCallbacks = {}
): IRenderAdapter {
    if (isTestEnvironment()) {
        // Use mock adapter in test environment
        return new MockRenderAdapter(callbacks);
    }

    // Use Fabric.js adapter in production/development
    return new FabricRenderAdapter(canvasElement, callbacks);
}

/**
 * Create editor-specific render system with adapter
 * @function createEditorRenderSystem
 * @param {HTMLCanvasElement} canvasElement - Canvas element for rendering
 * @param {EditorCallbacks} [callbacks={}] - Editor callback functions
 * @returns {EditorRenderSystem} Editor render system with appropriate adapter
 * @description High-level factory for editor that automatically selects correct adapter
 */
export function createEditorRenderSystem(
    canvasElement: HTMLCanvasElement,
    callbacks: EditorCallbacks = {}
): EditorRenderSystem {
    const adapter = createRenderAdapter(canvasElement, callbacks);
    return new EditorRenderSystem(adapter);
}

/**
 * Type guard for mock render system
 * @function isMockRenderSystem
 * @param {any} renderSystem - Render system to check
 * @returns {boolean} True if render system is MockRenderSystem
 * @description Type guard function for TypeScript type narrowing
 */
export function isMockRenderSystem(renderSystem: any): renderSystem is MockRenderSystem {
    return renderSystem instanceof MockRenderSystem;
}

/**
 * Type guard for Fabric.js render system
 * @function isFabricRenderSystem
 * @param {any} renderSystem - Render system to check
 * @returns {boolean} True if render system is FabricRenderSystem
 * @description Type guard function for TypeScript type narrowing
 */
export function isFabricRenderSystem(renderSystem: any): renderSystem is FabricRenderSystem {
    return renderSystem instanceof FabricRenderSystem;
}

/**
 * Type guard for mock render adapter
 * @function isMockRenderAdapter
 * @param {any} adapter - Render adapter to check
 * @returns {boolean} True if adapter is MockRenderAdapter
 * @description Type guard function for TypeScript type narrowing
 */
export function isMockRenderAdapter(adapter: any): adapter is MockRenderAdapter {
    return adapter instanceof MockRenderAdapter;
}

/**
 * Type guard for Fabric.js render adapter
 * @function isFabricRenderAdapter
 * @param {any} adapter - Render adapter to check
 * @returns {boolean} True if adapter is FabricRenderAdapter
 * @description Type guard function for TypeScript type narrowing
 */
export function isFabricRenderAdapter(adapter: any): adapter is FabricRenderAdapter {
    return adapter instanceof FabricRenderAdapter;
}

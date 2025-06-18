// Render system factory for environment-based selection
// Based on Fabric.js official testing patterns
// Now uses the Adapter Pattern for better testability

import { FabricRenderAdapter } from '../adapters/FabricRenderAdapter.js';
import type { EditorCallbacks, IRenderAdapter } from '../adapters/IRenderAdapter.js';
import { MockRenderAdapter } from '../adapters/MockRenderAdapter.js';
import { EditorRenderSystem } from './EditorRenderSystem.js';
import { FabricRenderSystem } from './FabricRenderSystem.js';
import { MockRenderSystem } from './MockRenderSystem.js';

// Environment detection utility (matching vitest.setup.ts)
export function isJSDOM(): boolean {
    return typeof window !== 'undefined' && 'jsdom' in globalThis;
}

export function isTestEnvironment(): boolean {
    return (
        typeof process !== 'undefined' &&
        (process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || isJSDOM())
    );
}

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

// New adapter-based factory methods
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

export function createEditorRenderSystem(
    canvasElement: HTMLCanvasElement,
    callbacks: EditorCallbacks = {}
): EditorRenderSystem {
    const adapter = createRenderAdapter(canvasElement, callbacks);
    return new EditorRenderSystem(adapter);
}

// Type guard for render system
export function isMockRenderSystem(renderSystem: any): renderSystem is MockRenderSystem {
    return renderSystem instanceof MockRenderSystem;
}

export function isFabricRenderSystem(renderSystem: any): renderSystem is FabricRenderSystem {
    return renderSystem instanceof FabricRenderSystem;
}

// Type guards for adapters
export function isMockRenderAdapter(adapter: any): adapter is MockRenderAdapter {
    return adapter instanceof MockRenderAdapter;
}

export function isFabricRenderAdapter(adapter: any): adapter is FabricRenderAdapter {
    return adapter instanceof FabricRenderAdapter;
}

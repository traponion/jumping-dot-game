// Render system factory for environment-based selection
// Based on Fabric.js official testing patterns

import { FabricRenderSystem } from './FabricRenderSystem.js';
import { MockRenderSystem } from './MockRenderSystem.js';

// Environment detection utility (matching vitest.setup.ts)
export function isJSDOM(): boolean {
    return typeof window !== 'undefined' && 'jsdom' in globalThis;
}

export function isTestEnvironment(): boolean {
    return typeof process !== 'undefined' && 
           (process.env.NODE_ENV === 'test' || 
            process.env.VITEST === 'true' ||
            isJSDOM());
}

export function createRenderSystem(canvasElement: HTMLCanvasElement): FabricRenderSystem | MockRenderSystem {
    if (isTestEnvironment()) {
        // Use mock renderer in test environment
        return new MockRenderSystem(canvasElement);
    }
    
    // Use Fabric.js renderer in production/development
    return new FabricRenderSystem(canvasElement);
}

// Type guard for render system
export function isMockRenderSystem(renderSystem: any): renderSystem is MockRenderSystem {
    return renderSystem instanceof MockRenderSystem;
}

export function isFabricRenderSystem(renderSystem: any): renderSystem is FabricRenderSystem {
    return renderSystem instanceof FabricRenderSystem;
}
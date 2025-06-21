/**
 * Game Render Adapter Factory
 * Creates game render adapters for dependency injection
 */

import type { IGameRenderAdapter, IGameRenderAdapterFactory } from './IGameRenderAdapter.js';
import { FabricGameRenderAdapter } from './FabricGameRenderAdapter.js';

export class GameRenderAdapterFactory implements IGameRenderAdapterFactory {
    createGameRenderAdapter(canvasElement: HTMLCanvasElement): IGameRenderAdapter {
        return new FabricGameRenderAdapter(canvasElement);
    }
}

// Default factory instance
export const gameRenderAdapterFactory = new GameRenderAdapterFactory();
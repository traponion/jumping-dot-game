import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StageLoader } from '../core/StageLoader.ts';

// Global type declarations for test environment
declare let global: {
    fetch: typeof fetch;
};

describe('StageLoader', () => {
    let stageLoader: StageLoader;

    beforeEach(() => {
        stageLoader = new StageLoader();
    });

    describe('initialization', () => {
        it('should create a StageLoader instance', () => {
            expect(stageLoader).toBeDefined();
        });
    });

    describe('loadStage', () => {
        it('should load stage from JSON file', async () => {
            // Mock fetch response
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                platforms: [{ x1: 0, y1: 500, x2: 300, y2: 500 }],
                spikes: [{ x: 100, y: 480, width: 15, height: 15 }],
                goal: {
                    x: 400,
                    y: 450,
                    width: 40,
                    height: 50
                },
                startText: {
                    x: 50,
                    y: 450,
                    text: 'STAGE 1'
                },
                goalText: {
                    x: 420,
                    y: 430,
                    text: 'GOAL'
                }
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStageData)
            });

            const result = await stageLoader.loadStage(1);

            expect(result).toEqual(mockStageData);
            expect(fetch).toHaveBeenCalledWith('/stages/stage1.json');
        });

        it('should handle fetch errors gracefully', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            await expect(stageLoader.loadStage(1)).rejects.toThrow('Failed to load stage 1');
        });

        it('should handle invalid JSON response', async () => {
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 404
            });

            await expect(stageLoader.loadStage(1)).rejects.toThrow('Failed to load stage 1');
        });
    });

    describe('validateStage', () => {
        it('should validate required stage properties', () => {
            const validStage = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(validStage)).not.toThrow();
        });

        it('should throw error for missing required properties', () => {
            const invalidStage = {
                id: 1,
                platforms: []
                // missing other required properties
            };

            expect(() => stageLoader.validateStage(invalidStage)).toThrow('Invalid stage data');
        });

        it('should validate platform structure', () => {
            const stageWithInvalidPlatform = {
                id: 1,
                name: 'Test',
                platforms: [
                    { x1: 0, y1: 500 } // missing x2, y2
                ],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidPlatform)).toThrow(
                'Invalid platform data'
            );
        });

        it('should validate spike structure', () => {
            const stageWithInvalidSpike = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: [
                    { x: 100 } // missing y, width, height
                ],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidSpike)).toThrow(
                'Invalid spike data'
            );
        });
    });

    describe('fallback to hardcoded stages', () => {
        it('should fallback to hardcoded stage when JSON loading fails', async () => {
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await stageLoader.loadStageWithFallback(1);

            expect(result).toBeDefined();
            expect(result.platforms).toBeDefined();
            expect(result.spikes).toBeDefined();
            expect(result.goal).toBeDefined();
        });
    });
});

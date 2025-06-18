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

        it('should return hardcoded stage 1', () => {
            const stage1 = stageLoader.getHardcodedStage(1);
            expect(stage1.id).toBe(1);
            expect(stage1.name).toBe('Stage 1');
            expect(stage1.platforms.length).toBeGreaterThan(0);
        });

        it('should return hardcoded stage 2', () => {
            const stage2 = stageLoader.getHardcodedStage(2);
            expect(stage2.id).toBe(2);
            expect(stage2.name).toBe('Stage 2');
            expect(stage2.movingPlatforms).toBeDefined();
        });

        it('should return stage 1 as default for unknown stage IDs', () => {
            const stage = stageLoader.getHardcodedStage(999);
            expect(stage.id).toBe(1);
            expect(stage.name).toBe('Stage 1');
        });
    });

    describe('caching', () => {
        it('should cache loaded stages', async () => {
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                platforms: [{ x1: 0, y1: 500, x2: 300, y2: 500 }],
                spikes: [{ x: 100, y: 480, width: 15, height: 15 }],
                goal: { x: 400, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 420, y: 430, text: 'GOAL' }
            };

            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStageData)
            });

            // First load
            await stageLoader.loadStage(1);
            expect(fetch).toHaveBeenCalledTimes(1);

            // Second load should use cache
            await stageLoader.loadStage(1);
            expect(fetch).toHaveBeenCalledTimes(1); // Should not increase
        });
    });

    describe('validation edge cases', () => {
        it('should validate goal properties', () => {
            const stageWithInvalidGoal = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: [],
                goal: { x: 'invalid' }, // Invalid goal
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidGoal)).toThrow(
                'Invalid stage data: goal missing properties'
            );
        });

        it('should validate text element properties', () => {
            const stageWithInvalidText = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50 }, // Missing y and text
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidText)).toThrow(
                'Invalid stage data: startText missing properties'
            );
        });

        it('should validate platforms array', () => {
            const stageWithInvalidPlatforms = {
                id: 1,
                name: 'Test',
                platforms: 'not-an-array',
                spikes: [],
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidPlatforms)).toThrow(
                'Invalid stage data: platforms must be an array'
            );
        });

        it('should validate spikes array', () => {
            const stageWithInvalidSpikes = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: 'not-an-array',
                goal: { x: 100, y: 100, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'TEST' },
                goalText: { x: 120, y: 80, text: 'GOAL' }
            };

            expect(() => stageLoader.validateStage(stageWithInvalidSpikes)).toThrow(
                'Invalid stage data: spikes must be an array'
            );
        });

        it('should validate null input', () => {
            expect(() => stageLoader.validateStage(null)).toThrow(
                'Invalid stage data: must be an object'
            );
        });

        it('should validate non-object input', () => {
            expect(() => stageLoader.validateStage('string')).toThrow(
                'Invalid stage data: must be an object'
            );
        });
    });

    describe('hardcoded stage creation methods', () => {
        it('should create hardcoded stage 1 with all required properties', () => {
            const stage1 = stageLoader.getHardcodedStage(1);

            // Test that all required properties exist and are valid
            expect(stage1.id).toBe(1);
            expect(stage1.name).toBe('Stage 1');
            expect(Array.isArray(stage1.platforms)).toBe(true);
            expect(stage1.platforms.length).toBeGreaterThan(0);
            expect(Array.isArray(stage1.spikes)).toBe(true);
            expect(stage1.goal).toBeDefined();
            expect(stage1.startText).toBeDefined();
            expect(stage1.goalText).toBeDefined();
            expect(stage1.leftEdgeMessage).toBeDefined();
            expect(stage1.leftEdgeSubMessage).toBeDefined();

            // Validate the created stage doesn't throw validation errors
            expect(() => stageLoader.validateStage(stage1)).not.toThrow();
        });

        it('should create hardcoded stage 2 with moving platforms', () => {
            const stage2 = stageLoader.getHardcodedStage(2);

            // Test that all required properties exist and are valid
            expect(stage2.id).toBe(2);
            expect(stage2.name).toBe('Stage 2');
            expect(Array.isArray(stage2.platforms)).toBe(true);
            expect(Array.isArray(stage2.movingPlatforms)).toBe(true);
            expect(stage2.movingPlatforms!.length).toBeGreaterThan(0);
            expect(Array.isArray(stage2.spikes)).toBe(true);
            expect(stage2.goal).toBeDefined();
            expect(stage2.startText).toBeDefined();
            expect(stage2.goalText).toBeDefined();

            // Validate the created stage doesn't throw validation errors
            expect(() => stageLoader.validateStage(stage2)).not.toThrow();
        });
    });
});

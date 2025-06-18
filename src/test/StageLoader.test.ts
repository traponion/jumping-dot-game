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

    // This test group was moved to 'fallback behavior' section below for better organization

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

    // This test group was moved to 'fallback behavior' section below for better organization

    describe('timeLimit support', () => {
        it('should load timeLimit from stage JSON', async () => {
            // Mock stage data with timeLimit
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                timeLimit: 10, // Stage 1 has 10 seconds
                platforms: [
                    { x1: 0, y1: 500, x2: 100, y2: 500 }
                ],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            // Mock fetch to return our test data
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStageData)
            }));

            // Act: Load stage
            const result = await stageLoader.loadStageWithFallback(1);

            // Assert: timeLimit should be loaded
            expect(result.timeLimit).toBe(10);
            expect(result.name).toBe('Stage 1');
            expect(result.id).toBe(1);
        });

        it('should load different timeLimit for different stages', async () => {
            // Mock stage 2 data with different timeLimit
            const mockStage2Data = {
                id: 2,
                name: 'Stage 2',
                timeLimit: 45, // Stage 2 has 45 seconds
                platforms: [
                    { x1: 0, y1: 500, x2: 100, y2: 500 }
                ],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 2' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStage2Data)
            }));

            // Act: Load stage 2
            const result = await stageLoader.loadStageWithFallback(2);

            // Assert: Different timeLimit should be loaded
            expect(result.timeLimit).toBe(45);
            expect(result.name).toBe('Stage 2');
        });

        it('should handle missing timeLimit gracefully', async () => {
            // Mock stage data WITHOUT timeLimit
            const mockStageDataWithoutTimeLimit = {
                id: 3,
                name: 'Stage 3',
                // No timeLimit field
                platforms: [
                    { x1: 0, y1: 500, x2: 100, y2: 500 }
                ],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 3' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStageDataWithoutTimeLimit)
            }));

            // Act: Load stage
            const result = await stageLoader.loadStageWithFallback(3);

            // Assert: timeLimit should be undefined (optional field)
            expect(result.timeLimit).toBeUndefined();
            expect(result.name).toBe('Stage 3');
        });

        it('should include timeLimit in minimal fallback stage data', () => {
            // Act: Get minimal fallback stage
            const fallbackStage = stageLoader.getHardcodedStage(1);

            // Assert: Fallback stage should have generous timeLimit for error recovery
            expect(fallbackStage.timeLimit).toBe(99);
            expect(fallbackStage.id).toBe(0); // ID 0 indicates fallback
            expect(fallbackStage.name).toBe('Offline Mode');
        });
    });

    describe('fallback behavior', () => {
        beforeEach(() => {
            vi.resetAllMocks();
        });

        it('should provide a minimal fallback stage for any ID', () => {
            // Act: Get hardcoded stage (fallback) for any ID
            const fallbackStage1 = stageLoader.getHardcodedStage(1);
            const fallbackStage2 = stageLoader.getHardcodedStage(2);
            const fallbackStage999 = stageLoader.getHardcodedStage(999);

            // Assert: All should return the same minimal fallback stage
            expect(fallbackStage1.id).toBe(0); // ID 0 indicates error/fallback stage
            expect(fallbackStage1.name).toBe('Offline Mode');
            expect(fallbackStage1.timeLimit).toBe(99); // Generous time for error recovery
            
            // All IDs should return identical fallback stage
            expect(fallbackStage1).toEqual(fallbackStage2);
            expect(fallbackStage1).toEqual(fallbackStage999);
        });

        it('should have minimal but complete stage structure', () => {
            // Act: Get fallback stage
            const fallbackStage = stageLoader.getHardcodedStage(1);

            // Assert: Should have minimal but complete structure
            expect(fallbackStage.platforms).toHaveLength(1); // Just one platform
            expect(fallbackStage.platforms[0]).toEqual({
                x1: 0, y1: 500, x2: 800, y2: 500
            });
            
            expect(fallbackStage.spikes).toEqual([]); // No spikes (safe for error recovery)
            expect(fallbackStage.goal).toEqual({
                x: 700, y: 450, width: 40, height: 50
            });
            
            expect(fallbackStage.startText.text).toBe('Network Error');
            expect(fallbackStage.goalText.text).toBe('GOAL');
        });

        it('should return JSON data when fetch succeeds', async () => {
            // Mock successful JSON fetch
            const mockStageData = {
                id: 1,
                name: 'Stage 1',
                timeLimit: 10,
                platforms: [{ x1: 0, y1: 500, x2: 100, y2: 500 }],
                spikes: [],
                goal: { x: 200, y: 450, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'STAGE 1' },
                goalText: { x: 220, y: 430, text: 'GOAL' }
            };

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockStageData)
            }));

            // Act: Load stage
            const result = await stageLoader.loadStageWithFallback(1);

            // Assert: Should return JSON data, not fallback
            expect(result.id).toBe(1);
            expect(result.name).toBe('Stage 1');
            expect(result.timeLimit).toBe(10);
        });

        it('should return minimal fallback when fetch fails', async () => {
            // Mock failed fetch
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

            // Spy on console.warn to verify proper logging
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Act: Load stage (will fail and fallback)
            const result = await stageLoader.loadStageWithFallback(1);

            // Assert: Should return minimal fallback stage
            expect(result.id).toBe(0); // Fallback stage ID
            expect(result.name).toBe('Offline Mode');
            expect(result.timeLimit).toBe(99);
            
            // Should log warning about fallback
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to load stage 1 from JSON'),
                expect.any(String)
            );

            consoleSpy.mockRestore();
        });

        it('should never throw errors even on complete failure', async () => {
            // Mock fetch failure
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

            // Act & Assert: Should not throw, always return a stage
            await expect(stageLoader.loadStageWithFallback(1)).resolves.toBeDefined();
            await expect(stageLoader.loadStageWithFallback(999)).resolves.toBeDefined();
        });

        it('should log warning when using hardcoded fallback', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Act: Get hardcoded stage
            stageLoader.getHardcodedStage(5);

            // Assert: Should log warning about fallback usage
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Falling back to hardcoded stage for stageId: 5')
            );

            consoleSpy.mockRestore();
        });

        it('should log warning when creating minimal fallback', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

            // Act: Get hardcoded stage (triggers createMinimalFallbackStage)
            stageLoader.getHardcodedStage(1);

            // Assert: Should log warning about incomplete data
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Creating a minimal fallback stage')
            );

            consoleSpy.mockRestore();
        });
    });
});

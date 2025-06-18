import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StageLoader } from '../core/StageLoader.js';

describe('StageLoader fallback behavior', () => {
    let stageLoader: StageLoader;

    beforeEach(() => {
        stageLoader = new StageLoader();
        vi.resetAllMocks();
    });

    describe('minimal fallback stage', () => {
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
    });

    describe('loadStageWithFallback behavior', () => {
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
    });

    describe('logging and debugging', () => {
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
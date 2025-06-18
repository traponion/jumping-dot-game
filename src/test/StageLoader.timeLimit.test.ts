import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StageLoader } from '../core/StageLoader.js';

describe('StageLoader timeLimit support', () => {
    let stageLoader: StageLoader;

    beforeEach(() => {
        stageLoader = new StageLoader();
        // Reset fetch mock
        vi.resetAllMocks();
    });

    describe('when stage JSON includes timeLimit', () => {
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
    });

    describe('when stage JSON does not include timeLimit', () => {
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
    });

    describe('hardcoded stage fallback', () => {
        it('should include timeLimit in hardcoded stage data', () => {
            // Act: Get hardcoded stage
            const hardcodedStage = stageLoader.getHardcodedStage(1);

            // Assert: Hardcoded stage should have timeLimit
            expect(hardcodedStage.timeLimit).toBeDefined();
            expect(typeof hardcodedStage.timeLimit).toBe('number');
            expect(hardcodedStage.timeLimit).toBeGreaterThan(0);
        });
    });
});
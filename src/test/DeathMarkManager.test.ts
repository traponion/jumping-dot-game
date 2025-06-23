import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IDeathMarkRenderer } from '../adapters/IDeathMarkRenderer';
import { DeathMarkManager } from '../core/DeathMarkManager';

describe('DeathMarkManager', () => {
    let deathMarkManager: DeathMarkManager;
    let mockRenderer: IDeathMarkRenderer;

    beforeEach(() => {
        // Create mock renderer
        mockRenderer = {
            renderDeathMarks: vi.fn(),
            clearDeathMarks: vi.fn(),
            cleanup: vi.fn().mockResolvedValue(undefined)
        };

        deathMarkManager = new DeathMarkManager(mockRenderer);
    });

    describe('initialization', () => {
        it('should start with empty death marks', () => {
            expect(deathMarkManager.getDeathMarkCount()).toBe(0);
            expect(deathMarkManager.getDeathMarks()).toEqual([]);
        });
    });

    describe('addDeathMark', () => {
        it('should add a death mark and call renderer', () => {
            const x = 100;
            const y = 200;

            deathMarkManager.addDeathMark(x, y);

            expect(deathMarkManager.getDeathMarkCount()).toBe(1);
            expect(mockRenderer.renderDeathMarks).toHaveBeenCalledWith([
                expect.objectContaining({ x, y, timestamp: expect.any(Number) })
            ]);
        });

        it('should add multiple death marks', () => {
            deathMarkManager.addDeathMark(100, 200);
            deathMarkManager.addDeathMark(150, 250);

            expect(deathMarkManager.getDeathMarkCount()).toBe(2);
            expect(mockRenderer.renderDeathMarks).toHaveBeenCalledTimes(2);
        });

        it('should preserve death mark data correctly', () => {
            const x = 100;
            const y = 200;

            deathMarkManager.addDeathMark(x, y);
            const deathMarks = deathMarkManager.getDeathMarks();

            expect(deathMarks).toHaveLength(1);
            expect(deathMarks[0]).toMatchObject({ x, y });
            expect(deathMarks[0].timestamp).toBeGreaterThan(0);
        });
    });

    describe('clearDeathMarks', () => {
        it('should clear all death marks and call renderer', () => {
            deathMarkManager.addDeathMark(100, 200);
            deathMarkManager.addDeathMark(150, 250);

            deathMarkManager.clearDeathMarks();

            expect(deathMarkManager.getDeathMarkCount()).toBe(0);
            expect(mockRenderer.clearDeathMarks).toHaveBeenCalled();
        });

        it('should work when no death marks exist', () => {
            deathMarkManager.clearDeathMarks();

            expect(deathMarkManager.getDeathMarkCount()).toBe(0);
            expect(mockRenderer.clearDeathMarks).toHaveBeenCalled();
        });
    });

    describe('removeOldDeathMarks', () => {
        it('should remove death marks older than specified age', async () => {
            // Add a death mark and wait a bit
            deathMarkManager.addDeathMark(100, 200);

            // Simulate time passage by mocking Date.now
            const originalNow = Date.now;
            const initialTime = originalNow();

            vi.spyOn(Date, 'now').mockReturnValue(initialTime + 2000); // 2 seconds later

            deathMarkManager.removeOldDeathMarks(1000); // Remove marks older than 1 second

            expect(deathMarkManager.getDeathMarkCount()).toBe(0);
            expect(mockRenderer.renderDeathMarks).toHaveBeenCalledWith([]);

            // Restore Date.now
            Date.now = originalNow;
        });

        it('should keep death marks newer than specified age', () => {
            deathMarkManager.addDeathMark(100, 200);

            deathMarkManager.removeOldDeathMarks(10000); // Remove marks older than 10 seconds

            expect(deathMarkManager.getDeathMarkCount()).toBe(1);
        });

        it('should handle mixed old and new death marks', () => {
            const originalNow = Date.now;
            let currentTime = originalNow();

            // Add first mark
            vi.spyOn(Date, 'now').mockReturnValue(currentTime);
            deathMarkManager.addDeathMark(100, 200);

            // Add second mark 2 seconds later
            currentTime += 2000;
            vi.spyOn(Date, 'now').mockReturnValue(currentTime);
            deathMarkManager.addDeathMark(150, 250);

            // Remove marks older than 1.5 seconds (should remove only first mark)
            currentTime += 1000;
            vi.spyOn(Date, 'now').mockReturnValue(currentTime);
            deathMarkManager.removeOldDeathMarks(1500);

            expect(deathMarkManager.getDeathMarkCount()).toBe(1);
            const remainingMarks = deathMarkManager.getDeathMarks();
            expect(remainingMarks[0]).toMatchObject({ x: 150, y: 250 });

            // Restore Date.now
            Date.now = originalNow;
        });
    });

    describe('cleanup', () => {
        it('should clear death marks and call renderer cleanup', async () => {
            deathMarkManager.addDeathMark(100, 200);

            await deathMarkManager.cleanup();

            expect(deathMarkManager.getDeathMarkCount()).toBe(0);
            expect(mockRenderer.cleanup).toHaveBeenCalled();
        });
    });

    describe('performance characteristics', () => {
        it('should handle large number of death marks efficiently', () => {
            const startTime = performance.now();

            // Add 1000 death marks
            for (let i = 0; i < 1000; i++) {
                deathMarkManager.addDeathMark(i, i);
            }

            const endTime = performance.now();
            const duration = endTime - startTime;

            expect(deathMarkManager.getDeathMarkCount()).toBe(1000);
            expect(duration).toBeLessThan(100); // Should complete in less than 100ms
            expect(mockRenderer.renderDeathMarks).toHaveBeenCalledTimes(1000);
        });

        it('should maintain constant-time access to death mark data', () => {
            // Add many death marks
            for (let i = 0; i < 500; i++) {
                deathMarkManager.addDeathMark(i, i);
            }

            const startTime = performance.now();
            const count = deathMarkManager.getDeathMarkCount();
            const marks = deathMarkManager.getDeathMarks();
            const endTime = performance.now();

            expect(count).toBe(500);
            expect(marks).toHaveLength(500);
            expect(endTime - startTime).toBeLessThan(10); // Should be very fast
        });
    });

    describe('data integrity', () => {
        it('should not mutate returned death marks array', () => {
            deathMarkManager.addDeathMark(100, 200);

            const marks1 = deathMarkManager.getDeathMarks();
            const marks2 = deathMarkManager.getDeathMarks();

            expect(marks1).not.toBe(marks2); // Different array instances
            expect(marks1).toEqual(marks2); // Same content
        });

        it('should preserve original coordinates exactly', () => {
            const testCases = [
                { x: 0, y: 0 },
                { x: -100, y: -200 },
                { x: 999.99, y: 888.88 },
                { x: 1.5, y: 2.7 }
            ];

            for (const testCase of testCases) {
                deathMarkManager.addDeathMark(testCase.x, testCase.y);
            }

            const marks = deathMarkManager.getDeathMarks();

            for (let i = 0; i < testCases.length; i++) {
                expect(marks[i].x).toBe(testCases[i].x);
                expect(marks[i].y).toBe(testCases[i].y);
            }
        });
    });
});

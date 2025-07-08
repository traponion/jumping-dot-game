import { describe, expect, it } from 'vitest';
import {
    calculateDeltaFactor,
    getCurrentTime,
    isCircleRectCollision,
    isPointInRect,
    randomRange
} from '../../../utils/GameUtils.js';

describe('GameUtils', () => {
    describe('getCurrentTime', () => {
        it('should return a number', () => {
            const time = getCurrentTime();
            expect(typeof time).toBe('number');
        });

        it('should return current performance timestamp', () => {
            const beforeCall = performance.now();
            const time = getCurrentTime();
            const afterCall = performance.now();

            expect(time).toBeGreaterThanOrEqual(beforeCall);
            expect(time).toBeLessThanOrEqual(afterCall);
        });

        it('should demonstrate that using consistent time baseline fixes the bug', () => {
            // After fix: both gameStartTime and currentTime use getCurrentTime()
            const gameStartTime = getCurrentTime(); // Fixed: now uses getCurrentTime()

            // Small delay to simulate elapsed time
            const currentTime = getCurrentTime();

            // Calculate elapsed time (this should now be reasonable)
            const elapsedSeconds = (currentTime - gameStartTime) / 1000;

            // Should be a small positive number (< 1 second for this test)
            expect(elapsedSeconds).toBeGreaterThanOrEqual(0);
            expect(elapsedSeconds).toBeLessThan(1);
        });

        it('should provide consistent time baseline for game calculations', () => {
            // After fix: both game start time and current time should use same baseline
            const gameStartTime = getCurrentTime();

            // Simulate small delay
            const currentTime = getCurrentTime();
            const elapsedMs = currentTime - gameStartTime;

            // Elapsed time should be reasonable (< 1000ms for this test)
            expect(elapsedMs).toBeLessThan(1000);
            expect(elapsedMs).toBeGreaterThanOrEqual(0);
        });
    });

    describe('calculateDeltaFactor', () => {
        it('should calculate correct delta factor for 60fps', () => {
            const deltaTime = 16.67; // 60fps
            const gameSpeed = 1.0;
            const result = calculateDeltaFactor(deltaTime, gameSpeed);

            expect(result).toBeCloseTo(1.0, 2);
        });

        it('should account for game speed multiplier', () => {
            const deltaTime = 16.67;
            const gameSpeed = 2.0;
            const result = calculateDeltaFactor(deltaTime, gameSpeed);

            expect(result).toBeCloseTo(2.0, 2);
        });

        it('should handle different frame rates', () => {
            const deltaTime = 33.33; // 30fps
            const gameSpeed = 1.0;
            const result = calculateDeltaFactor(deltaTime, gameSpeed);

            expect(result).toBeCloseTo(2.0, 2);
        });
    });

    describe('isPointInRect', () => {
        it('should return true when point is inside rectangle', () => {
            const result = isPointInRect(5, 5, 0, 0, 10, 10);
            expect(result).toBe(true);
        });

        it('should return false when point is outside rectangle', () => {
            const result = isPointInRect(15, 15, 0, 0, 10, 10);
            expect(result).toBe(false);
        });

        it('should return true when point is on rectangle edge', () => {
            const result = isPointInRect(10, 10, 0, 0, 10, 10);
            expect(result).toBe(true);
        });

        it('should return false when point is to the left of rectangle', () => {
            const result = isPointInRect(-1, 5, 0, 0, 10, 10);
            expect(result).toBe(false);
        });

        it('should return false when point is above rectangle', () => {
            const result = isPointInRect(5, -1, 0, 0, 10, 10);
            expect(result).toBe(false);
        });
    });

    describe('isCircleRectCollision', () => {
        it('should detect collision when circle overlaps rectangle', () => {
            const result = isCircleRectCollision(15, 15, 10, 0, 0, 20, 20);
            expect(result).toBe(true);
        });

        it('should detect collision when circle is inside rectangle', () => {
            const result = isCircleRectCollision(10, 10, 3, 0, 0, 20, 20);
            expect(result).toBe(true);
        });

        it('should not detect collision when circle is far from rectangle', () => {
            const result = isCircleRectCollision(50, 50, 5, 0, 0, 20, 20);
            expect(result).toBe(false);
        });

        it('should detect collision when circle just touches rectangle edge', () => {
            const result = isCircleRectCollision(25, 10, 5, 0, 0, 20, 20);
            expect(result).toBe(true);
        });

        it('should handle edge case with zero radius', () => {
            const result = isCircleRectCollision(10, 10, 0, 0, 0, 20, 20);
            expect(result).toBe(true);
        });
    });

    describe('randomRange', () => {
        it('should return value within specified range', () => {
            for (let i = 0; i < 100; i++) {
                const result = randomRange(10, 20);
                expect(result).toBeGreaterThanOrEqual(10);
                expect(result).toBeLessThanOrEqual(20);
            }
        });

        it('should handle negative ranges', () => {
            for (let i = 0; i < 100; i++) {
                const result = randomRange(-10, -5);
                expect(result).toBeGreaterThanOrEqual(-10);
                expect(result).toBeLessThanOrEqual(-5);
            }
        });

        it('should handle range where min equals max', () => {
            const result = randomRange(5, 5);
            expect(result).toBe(5);
        });

        it('should return different values on multiple calls', () => {
            const results = new Set();
            for (let i = 0; i < 50; i++) {
                results.add(randomRange(0, 1000));
            }
            // Should have multiple different values (very unlikely to be all the same)
            expect(results.size).toBeGreaterThan(1);
        });
    });
});

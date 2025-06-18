/**
 * @fileoverview Game utility functions for common operations and calculations
 * @module GameUtils
 * @description Provides utility functions for time management, collision detection, 
 * and mathematical operations used throughout the game. This module belongs to the 
 * Domain layer and contains pure functions with no side effects.
 */

/**
 * Get current high-resolution timestamp using Performance API
 * @function getCurrentTime
 * @returns {number} Current timestamp in milliseconds with sub-millisecond precision
 * @example
 * const startTime = getCurrentTime();
 * // ... some operations ...
 * const elapsed = getCurrentTime() - startTime;
 */
export function getCurrentTime(): number {
    return performance.now();
}

/**
 * Calculate delta time factor for frame-rate independent physics
 * @function calculateDeltaFactor
 * @param {number} deltaTime - Time elapsed since last frame in milliseconds
 * @param {number} gameSpeed - Game speed multiplier (1.0 = normal speed)
 * @returns {number} Normalized delta factor for consistent physics across different frame rates
 * @example
 * const dtFactor = calculateDeltaFactor(16.67, 1.0); // ~1.0 for 60fps
 * const dtFactor = calculateDeltaFactor(33.33, 2.0); // ~4.0 for 30fps at 2x speed
 */
export function calculateDeltaFactor(deltaTime: number, gameSpeed: number): number {
    return (deltaTime / (1000 / 60)) * gameSpeed;
}

/**
 * Check if a point is within a rectangle's bounds
 * @function isPointInRect
 * @param {number} pointX - X coordinate of the point to test
 * @param {number} pointY - Y coordinate of the point to test
 * @param {number} rectX - X coordinate of rectangle's top-left corner
 * @param {number} rectY - Y coordinate of rectangle's top-left corner
 * @param {number} rectWidth - Width of the rectangle
 * @param {number} rectHeight - Height of the rectangle
 * @returns {boolean} True if point is inside or on the rectangle's border
 * @example
 * const isInside = isPointInRect(150, 200, 100, 150, 200, 100); // true
 * const isOutside = isPointInRect(50, 50, 100, 150, 200, 100); // false
 */
export function isPointInRect(
    pointX: number,
    pointY: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    return (
        pointX >= rectX &&
        pointX <= rectX + rectWidth &&
        pointY >= rectY &&
        pointY <= rectY + rectHeight
    );
}

/**
 * Check collision between a circle and rectangle using AABB detection
 * @function isCircleRectCollision
 * @param {number} circleX - X coordinate of circle's center
 * @param {number} circleY - Y coordinate of circle's center
 * @param {number} circleRadius - Radius of the circle
 * @param {number} rectX - X coordinate of rectangle's top-left corner
 * @param {number} rectY - Y coordinate of rectangle's top-left corner
 * @param {number} rectWidth - Width of the rectangle
 * @param {number} rectHeight - Height of the rectangle
 * @returns {boolean} True if circle and rectangle are overlapping
 * @example
 * const isColliding = isCircleRectCollision(100, 100, 10, 90, 90, 20, 20); // true
 * const notColliding = isCircleRectCollision(50, 50, 5, 100, 100, 20, 20); // false
 */
export function isCircleRectCollision(
    circleX: number,
    circleY: number,
    circleRadius: number,
    rectX: number,
    rectY: number,
    rectWidth: number,
    rectHeight: number
): boolean {
    return (
        circleX + circleRadius >= rectX &&
        circleX - circleRadius <= rectX + rectWidth &&
        circleY + circleRadius >= rectY &&
        circleY - circleRadius <= rectY + rectHeight
    );
}

/**
 * Generate random floating-point number between min and max (inclusive)
 * @function randomRange
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {number} Random number between min and max
 * @example
 * const randomSpeed = randomRange(1.0, 5.0); // Random speed between 1.0 and 5.0
 * const randomPosition = randomRange(0, 800); // Random X position on 800px wide canvas
 */
export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

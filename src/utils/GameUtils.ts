/**
 * Get current high-resolution timestamp
 */
export function getCurrentTime(): number {
    return performance.now();
}

/**
 * Calculate delta time factor for frame-rate independent physics
 */
export function calculateDeltaFactor(deltaTime: number, gameSpeed: number): number {
    return (deltaTime / (1000 / 60)) * gameSpeed;
}

/**
 * Check if a point is within a rectangle
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
 * Check collision between a circle and rectangle
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
 * Generate random number between min and max (inclusive)
 */
export function randomRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

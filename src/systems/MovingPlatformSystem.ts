import type { MovingPlatform } from '../core/StageLoader.js';

/**
 * System for updating moving platform positions and handling boundary collisions
 */
export class MovingPlatformSystem {
    /**
     * Updates all moving platforms and returns a new array with updated positions.
     * This method is a pure function and does not mutate the input array.
     * 
     * @param movingPlatforms - Array of moving platforms to update
     * @param deltaTime - Time elapsed since last update in milliseconds
     * @returns A new array of MovingPlatform objects with updated positions and directions.
     */
    update(movingPlatforms: MovingPlatform[], deltaTime: number): MovingPlatform[] {
        const dtFactor = deltaTime / 16.67; // Normalize to ~60fps

        return movingPlatforms.map((platform) => {
            const movement = platform.speed * platform.direction * dtFactor;
            
            let newX1 = platform.x1 + movement;
            let newDirection = platform.direction;
            const platformWidth = platform.x2 - platform.x1;

            // Check boundaries and reverse direction if needed
            if (newDirection > 0 && newX1 >= platform.endX) {
                newDirection = -1;
                // Correct position to not exceed boundary
                const overshoot = newX1 - platform.endX;
                newX1 = platform.endX - overshoot;
            } else if (newDirection < 0 && newX1 <= platform.startX) {
                newDirection = 1;
                // Correct position to not exceed boundary
                const overshoot = platform.startX - newX1;
                newX1 = platform.startX + overshoot;
            }
            
            const newX2 = newX1 + platformWidth;

            // Return a NEW platform object, not a mutated one
            return {
                ...platform,
                x1: newX1,
                x2: newX2,
                direction: newDirection
            };
        });
    }
}
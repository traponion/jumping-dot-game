import type { MovingPlatform } from '../core/StageLoader.js';

/**
 * System for updating moving platform positions and handling boundary collisions
 */
export class MovingPlatformSystem {
    /**
     * Updates all moving platforms based on their speed, direction, and deltaTime
     * Handles direction reversal when platforms reach their boundaries
     * 
     * @param movingPlatforms - Array of moving platforms to update
     * @param deltaTime - Time elapsed since last update in milliseconds
     */
    update(movingPlatforms: MovingPlatform[], deltaTime: number): void {
        const dtFactor = deltaTime / 16.67; // Normalize to ~60fps
        
        for (const platform of movingPlatforms) {
            // Calculate movement amount
            const movement = platform.speed * platform.direction * dtFactor;
            
            // Update platform positions
            platform.x1 += movement;
            platform.x2 += movement;
            
            // Check boundaries and reverse direction if needed
            this.checkBoundariesAndReverse(platform);
        }
    }
    
    /**
     * Checks if platform has reached its boundaries and reverses direction if needed
     * 
     * @param platform - Platform to check
     */
    private checkBoundariesAndReverse(platform: MovingPlatform): void {
        const platformWidth = platform.x2 - platform.x1;
        
        // Check if platform has reached or exceeded endX (moving right)
        if (platform.direction > 0 && platform.x1 >= platform.endX) {
            platform.direction = -1;
            // Ensure platform doesn't go beyond boundary
            const overshoot = platform.x1 - platform.endX;
            platform.x1 = platform.endX - overshoot;
            platform.x2 = platform.x1 + platformWidth;
        }
        // Check if platform has reached or exceeded startX (moving left)
        else if (platform.direction < 0 && platform.x1 <= platform.startX) {
            platform.direction = 1;
            // Ensure platform doesn't go beyond boundary
            const overshoot = platform.startX - platform.x1;
            platform.x1 = platform.startX + overshoot;
            platform.x2 = platform.x1 + platformWidth;
        }
    }
}
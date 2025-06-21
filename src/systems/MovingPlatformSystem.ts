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
                
                // Update platform positions (cast to mutable to overcome readonly constraints)
                const mutablePlatform = platform as any;
                mutablePlatform.x1 += movement;
                mutablePlatform.x2 += movement;
                
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
            const mutablePlatform = platform as any;
            
            // Check if platform has reached or exceeded endX (moving right)
            if (platform.direction > 0 && platform.x1 >= platform.endX) {
                mutablePlatform.direction = -1;
                // Ensure platform doesn't go beyond boundary
                const overshoot = platform.x1 - platform.endX;
                mutablePlatform.x1 = platform.endX - overshoot;
                mutablePlatform.x2 = mutablePlatform.x1 + platformWidth;
            }
            // Check if platform has reached or exceeded startX (moving left)
            else if (platform.direction < 0 && platform.x1 <= platform.startX) {
                mutablePlatform.direction = 1;
                // Ensure platform doesn't go beyond boundary
                const overshoot = platform.startX - platform.x1;
                mutablePlatform.x1 = platform.startX + overshoot;
                mutablePlatform.x2 = mutablePlatform.x1 + platformWidth;
            }
        }

}
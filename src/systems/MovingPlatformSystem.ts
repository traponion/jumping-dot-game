import type { GameState } from '../stores/GameState.js';

/**
 * System for updating moving platform positions and handling boundary collisions
 */
export class MovingPlatformSystem {
    private gameState: GameState;

    constructor(gameState: GameState) {
        this.gameState = gameState;
    }

    /**
     * Updates all moving platforms by directly mutating the GameState.
     * This method follows the autonomous system pattern with side effects.
     *
     * @param deltaTime - Time elapsed since last update in milliseconds
     */
    update(deltaTime: number): void {
        const movingPlatforms = this.gameState.stage?.movingPlatforms;
        if (!movingPlatforms) return;

        const dtFactor = deltaTime / 16.67; // Normalize to ~60fps

        for (const platform of movingPlatforms) {
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

            // Direct mutation of GameState
            platform.x1 = newX1;
            platform.x2 = newX2;
            platform.direction = newDirection;
        }
    }
}

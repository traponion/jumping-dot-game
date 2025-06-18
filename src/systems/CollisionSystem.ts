import type { Goal, Platform, Spike } from '../core/StageLoader.js';
import type { Player } from '../types/GameTypes.js';
import { isCircleRectCollision } from '../utils/GameUtils.js';
import { getGameStore } from '../stores/GameZustandStore.js';

export class CollisionSystem {
    checkPlatformCollision(player: Player, platform: Platform, prevPlayerFootY: number): Partial<Player> | null {
        const currentPlayerFootY = player.y + player.radius;

        // Basic horizontal overlap check
        if (
            player.x + player.radius <= platform.x1 ||
            player.x - player.radius >= platform.x2 ||
            player.vy < 0 // Don't collide when moving upward
        ) {
            return null;
        }

        // Enhanced collision detection for high-speed movement
        // Check if player crossed the platform during this frame
        const wasPreviouslyAbove = prevPlayerFootY <= platform.y1;
        const isCurrentlyBelowOrOn = currentPlayerFootY >= platform.y1;

        if (wasPreviouslyAbove && isCurrentlyBelowOrOn) {
            // Return collision update object instead of directly modifying player
            return {
                y: platform.y1 - player.radius,
                vy: 0,
                grounded: true,
            };
        }

        return null;
    }

    handlePlatformCollisions(platforms: Platform[], prevPlayerFootY: number): boolean {
        const player = getGameStore().getPlayer(); // Get latest player state from store
        let collisionDetected = false;

        // First reset grounded state
        getGameStore().updatePlayer({ grounded: false });

        for (const platform of platforms) {
            const collisionUpdate = this.checkPlatformCollision(player, platform, prevPlayerFootY);
            if (collisionUpdate) {
                // Update store with collision result
                getGameStore().updatePlayer(collisionUpdate);
                collisionDetected = true;
                break; // Exit on first collision
            }
        }
        return collisionDetected;
    }

    checkSpikeCollision(player: Player, spike: Spike): boolean {
        return isCircleRectCollision(
            player.x,
            player.y,
            player.radius,
            spike.x,
            spike.y,
            spike.width,
            spike.height
        );
    }

    checkSpikeCollisions(player: Player, spikes: Spike[]): boolean {
        for (const spike of spikes) {
            if (this.checkSpikeCollision(player, spike)) {
                return true;
            }
        }
        return false;
    }

    checkGoalCollision(player: Player, goal: Goal): boolean {
        return isCircleRectCollision(
            player.x,
            player.y,
            player.radius,
            goal.x,
            goal.y,
            goal.width,
            goal.height
        );
    }

    checkHoleCollision(player: Player, holeThreshold: number): boolean {
        return player.y > holeThreshold;
    }

    checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
        return player.y > canvasHeight + 100;
    }
}

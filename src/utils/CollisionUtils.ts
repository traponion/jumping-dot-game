import type { Goal, MovingPlatform, Platform, Spike } from '../core/StageLoader.js';
import type { Player } from '../types/GameTypes.js';
import { isCircleRectCollision } from './GameUtils.js';

// Pure business logic functions extracted from CollisionSystem
export function checkPlatformCollision(
    player: Player,
    platform: Platform,
    prevPlayerFootY: number
): Partial<Player> | null {
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
        // Return collision update object
        return {
            y: platform.y1 - player.radius,
            vy: 0,
            grounded: true
        };
    }

    return null;
}

export function checkSpikeCollision(player: Player, spike: Spike): boolean {
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

export function checkSpikeCollisions(player: Player, spikes: Spike[]): boolean {
    for (const spike of spikes) {
        if (checkSpikeCollision(player, spike)) {
            return true;
        }
    }
    return false;
}

export function checkGoalCollision(player: Player, goal: Goal): boolean {
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

export function checkHoleCollision(player: Player, holeThreshold: number): boolean {
    return player.y > holeThreshold;
}

export function checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
    return player.y > canvasHeight + 100;
}

export interface MovingPlatformCollisionResult {
    y: number;
    vy: number;
    grounded: boolean;
    platform: MovingPlatform;
}

export function checkMovingPlatformCollision(
    player: Player,
    movingPlatform: MovingPlatform,
    prevPlayerFootY: number
): MovingPlatformCollisionResult | null {
    const currentPlayerFootY = player.y + player.radius;

    // Basic horizontal overlap check (same as static platform)
    if (
        player.x + player.radius <= movingPlatform.x1 ||
        player.x - player.radius >= movingPlatform.x2 ||
        player.vy < 0 // Don't collide when moving upward
    ) {
        return null;
    }

    // Enhanced collision detection for high-speed movement
    // Check if player crossed the platform during this frame
    const wasPreviouslyAbove = prevPlayerFootY <= movingPlatform.y1;
    const isCurrentlyBelowOrOn = currentPlayerFootY >= movingPlatform.y1;

    if (wasPreviouslyAbove && isCurrentlyBelowOrOn) {
        // Return collision update object with platform reference
        return {
            y: movingPlatform.y1 - player.radius,
            vy: 0,
            grounded: true,
            platform: movingPlatform
        };
    }

    return null;
}

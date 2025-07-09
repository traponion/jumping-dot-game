/**
 * Pure business logic functions for physics calculations
 * Framework-independent physics utilities for game mechanics
 */

import type { PhysicsConstants } from '../types/GameTypes.js';

export interface PlayerPhysicsState {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    grounded: boolean;
}

/**
 * Default physics constants for the game
 */
export const DEFAULT_PHYSICS_CONSTANTS: PhysicsConstants = {
    gravity: 0.6,
    jumpForce: -12,
    autoJumpInterval: 150,
    moveSpeed: 4,
    gameSpeed: 2.0
};

/**
 * Apply gravity to player velocity when not grounded
 */
export function applyGravity(
    player: PlayerPhysicsState,
    constants: PhysicsConstants,
    deltaTime: number
): PlayerPhysicsState {
    if (player.grounded) {
        return { ...player };
    }

    const gravityAmount = constants.gravity * (deltaTime / 16.67); // Normalize to 60fps
    return {
        ...player,
        vy: player.vy + gravityAmount
    };
}

/**
 * Update player position based on velocity and game speed
 */
export function updatePlayerPosition(
    player: PlayerPhysicsState,
    constants: PhysicsConstants,
    deltaTime: number
): PlayerPhysicsState {
    const speedMultiplier = constants.gameSpeed * (deltaTime / 16.67);

    return {
        ...player,
        x: player.x + player.vx * speedMultiplier,
        y: player.y + player.vy * speedMultiplier
    };
}

/**
 * Clamp horizontal velocity to maximum speed limits
 */
export function clampVelocity(
    player: PlayerPhysicsState,
    constants: PhysicsConstants
): PlayerPhysicsState {
    const clampedVx = Math.max(-constants.moveSpeed, Math.min(constants.moveSpeed, player.vx));

    return {
        ...player,
        vx: clampedVx
    };
}

/**
 * Apply minimum velocity threshold when player has moved
 */
export function applyMinimumVelocity(
    player: PlayerPhysicsState,
    minVelocity: number,
    hasMovedOnce: boolean
): PlayerPhysicsState {
    if (!hasMovedOnce) {
        return { ...player };
    }

    if (Math.abs(player.vx) < minVelocity) {
        const sign = player.vx >= 0 ? 1 : -1;
        return {
            ...player,
            vx: minVelocity * sign
        };
    }

    return { ...player };
}

/**
 * Create a copy of physics constants
 */
export function copyPhysicsConstants(constants: PhysicsConstants): PhysicsConstants {
    return { ...constants };
}

/**
 * Update physics constants with partial values
 */
export function updatePhysicsConstants(
    current: PhysicsConstants,
    updates: Partial<PhysicsConstants>
): PhysicsConstants {
    return { ...current, ...updates };
}

/**
 * Reset physics constants to default values
 */
export function resetPhysicsConstants(): PhysicsConstants {
    return { ...DEFAULT_PHYSICS_CONSTANTS };
}

/**
 * Complete physics update cycle for a player
 * Combines gravity, position update, and velocity clamping
 */
export function updatePlayerPhysics(
    player: PlayerPhysicsState,
    constants: PhysicsConstants,
    deltaTime: number
): PlayerPhysicsState {
    let updatedPlayer = applyGravity(player, constants, deltaTime);
    updatedPlayer = updatePlayerPosition(updatedPlayer, constants, deltaTime);
    updatedPlayer = clampVelocity(updatedPlayer, constants);

    return updatedPlayer;
}

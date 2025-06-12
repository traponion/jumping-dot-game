export const DEFAULT_PHYSICS_CONSTANTS = {
    gravity: 0.6,
    jumpForce: -12,
    autoJumpInterval: 150,
    moveSpeed: 4,
    gameSpeed: 2.0
} as const;

export const GAME_CONFIG = {
    canvas: {
        defaultWidth: 800,
        defaultHeight: 600
    },
    player: {
        defaultRadius: 3,
        maxTrailLength: 8,
        acceleration: 0.5,
        minVelocity: 0.2
    },
    animation: {
        particleCount: 15,
        clearAnimationDuration: 2000,
        deathAnimationDuration: 1000
    }
} as const;

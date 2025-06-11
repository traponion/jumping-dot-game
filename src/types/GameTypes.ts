export interface Player {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    grounded: boolean;
}

export interface Camera {
    x: number;
    y: number;
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    decay: number;
    size?: number;
}

export interface AnimationSystem {
    active: boolean;
    startTime: number | null;
    duration: number;
    particles: Particle[];
}

export interface DeathMark {
    x: number;
    y: number;
    timestamp: number;
}

export interface TrailPoint {
    x: number;
    y: number;
}

export interface KeyState {
    [key: string]: boolean;
}

export interface GameState {
    gameRunning: boolean;
    gameOver: boolean;
    currentStage: number;
    timeLimit: number;
    timeRemaining: number;
    gameStartTime: number | null;
    finalScore: number;
    hasMovedOnce: boolean;
}

export interface PhysicsConstants {
    gravity: number;
    jumpForce: number;
    autoJumpInterval: number;
    moveSpeed: number;
    gameSpeed: number;
}
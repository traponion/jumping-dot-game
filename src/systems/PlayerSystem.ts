import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { PhysicsConstants, Player, TrailPoint } from '../types/GameTypes.js';
import { calculateDeltaFactor, getCurrentTime } from '../utils/GameUtils.js';
import type { InputManager } from './InputManager.js';

export class PlayerSystem {
    private player: Player;
    private inputManager: InputManager | null = null;
    private hasMovedOnce = false;
    private lastJumpTime: number | null = null;
    private trail: TrailPoint[] = [];
    private maxTrailLength = GAME_CONFIG.player.maxTrailLength;

    constructor(player: Player, inputManager?: InputManager) {
        this.player = player;
        this.inputManager = inputManager || null;
    }

    setInputManager(inputManager: InputManager): void {
        this.inputManager = inputManager;
    }

    update(deltaTime: number, physics: PhysicsConstants): void {
        const dtFactor = calculateDeltaFactor(deltaTime, physics.gameSpeed);

        this.handleInput(dtFactor);
        this.handleAutoJump(physics);
        this.updateTrail();
    }

    private handleInput(dtFactor: number): void {
        if (!this.inputManager) return;

        const leftInput = this.inputManager.isPressed('move-left');
        const rightInput = this.inputManager.isPressed('move-right');

        const acceleration = GAME_CONFIG.player.acceleration;
        if (leftInput) {
            this.player.vx -= acceleration * dtFactor;
            this.hasMovedOnce = true;
        } else if (rightInput) {
            this.player.vx += acceleration * dtFactor;
            this.hasMovedOnce = true;
        }

        if (this.hasMovedOnce && Math.abs(this.player.vx) < GAME_CONFIG.player.minVelocity) {
            this.player.vx =
                this.player.vx >= 0
                    ? GAME_CONFIG.player.minVelocity
                    : -GAME_CONFIG.player.minVelocity;
        }
    }

    private handleAutoJump(physics: PhysicsConstants): void {
        const currentTime = getCurrentTime();
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - physics.autoJumpInterval;
        }

        if (this.player.grounded && currentTime - this.lastJumpTime > physics.autoJumpInterval) {
            this.player.vy = physics.jumpForce;
            this.player.grounded = false;
            this.lastJumpTime = currentTime;
        }
    }

    private updateTrail(): void {
        this.trail.push({ x: this.player.x, y: this.player.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }

    clampSpeed(maxSpeed: number): void {
        if (this.player.vx > maxSpeed) this.player.vx = maxSpeed;
        if (this.player.vx < -maxSpeed) this.player.vx = -maxSpeed;
    }

    resetJumpTimer(): void {
        this.lastJumpTime = getCurrentTime() - 150;
    }

    clearTrail(): void {
        this.trail = [];
    }

    getTrail(): TrailPoint[] {
        return [...this.trail];
    }

    reset(x: number, y: number): void {
        this.player.x = x;
        this.player.y = y;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.grounded = false;
        this.hasMovedOnce = false;
        this.lastJumpTime = null;
        this.trail = [];
    }

    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

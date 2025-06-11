import type { KeyState, PhysicsConstants, Player, TrailPoint } from '../types/GameTypes.js';

export class PlayerSystem {
    private player: Player;
    private keys: KeyState;
    private hasMovedOnce = false;
    private lastJumpTime: number | null = null;
    private trail: TrailPoint[] = [];
    private maxTrailLength = 8;

    constructor(player: Player, keys: KeyState) {
        this.player = player;
        this.keys = keys;
    }

    update(deltaTime: number, physics: PhysicsConstants): void {
        const dtFactor = (deltaTime / (1000 / 60)) * physics.gameSpeed;

        this.handleInput(dtFactor);
        this.handleAutoJump(physics);
        this.updateTrail();
    }

    private handleInput(dtFactor: number): void {
        const leftInput = this.keys.ArrowLeft;
        const rightInput = this.keys.ArrowRight;

        const acceleration = 0.5;
        if (leftInput) {
            this.player.vx -= acceleration * dtFactor;
            this.hasMovedOnce = true;
        } else if (rightInput) {
            this.player.vx += acceleration * dtFactor;
            this.hasMovedOnce = true;
        }

        if (this.hasMovedOnce && Math.abs(this.player.vx) < 0.2) {
            this.player.vx = this.player.vx >= 0 ? 0.2 : -0.2;
        }
    }

    private handleAutoJump(physics: PhysicsConstants): void {
        const currentTime = performance.now();
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
        this.lastJumpTime = performance.now() - 150;
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

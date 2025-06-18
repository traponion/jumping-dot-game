import { GAME_CONFIG } from '../constants/GameConstants.js';
import type { PhysicsConstants, TrailPoint } from '../types/GameTypes.js';
import { calculateDeltaFactor, getCurrentTime } from '../utils/GameUtils.js';
import type { InputManager } from './InputManager.js';
import { getGameStore } from '../stores/GameZustandStore.js';

export class PlayerSystem {
    private inputManager: InputManager | null = null;
    private hasMovedOnce = false;
    private lastJumpTime: number | null = null;
    // Trail is now managed by Zustand store

    constructor(inputManager?: InputManager) {
        // Use Zustand store for all state management
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
        const gameStore = getGameStore();

        if (leftInput || rightInput) {
            // Use Zustand store actions to update player state
            gameStore.updatePlayerVelocity(leftInput ? 'left' : 'right', dtFactor);
            gameStore.markPlayerMoved();
            this.hasMovedOnce = true;
        }

        // Get updated player state from store
        const currentPlayer = gameStore.getPlayer();
        if (this.hasMovedOnce && Math.abs(currentPlayer.vx) < GAME_CONFIG.player.minVelocity) {
            // Apply minimum velocity (still need to implement this in store)
            // TODO: Add updatePlayerVelocityDirect action to store for this case
        }
    }

    private handleAutoJump(physics: PhysicsConstants): void {
        const currentTime = getCurrentTime();
        if (this.lastJumpTime === null) {
            this.lastJumpTime = currentTime - physics.autoJumpInterval;
        }

        const currentPlayer = getGameStore().getPlayer();
        if (currentPlayer.grounded && currentTime - this.lastJumpTime > physics.autoJumpInterval) {
            getGameStore().updatePlayer({
                vy: physics.jumpForce,
                grounded: false
            });
            this.lastJumpTime = currentTime;
        }
    }

    private updateTrail(): void {
        const currentPlayer = getGameStore().getPlayer();
        getGameStore().addTrailPoint({ x: currentPlayer.x, y: currentPlayer.y });
    }

    clampSpeed(maxSpeed: number): void {
        const currentPlayer = getGameStore().getPlayer();
        if (Math.abs(currentPlayer.vx) > maxSpeed) {
            getGameStore().updatePlayer({
                vx: currentPlayer.vx >= 0 ? maxSpeed : -maxSpeed
            });
        }
    }

    resetJumpTimer(): void {
        this.lastJumpTime = getCurrentTime() - 150;
    }

    clearTrail(): void {
        getGameStore().updateTrail([]);
    }

    getTrail(): TrailPoint[] {
        return getGameStore().runtime.trail;
    }

    reset(x: number, y: number): void {
        getGameStore().updatePlayer({
            x: x,
            y: y,
            vx: 0,
            vy: 0,
            grounded: false
        });
        this.hasMovedOnce = false;
        this.lastJumpTime = null;
        getGameStore().updateTrail([]);
    }

    getHasMovedOnce(): boolean {
        return this.hasMovedOnce;
    }
}

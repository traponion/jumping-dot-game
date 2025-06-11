import type { PhysicsConstants, Player } from '../types/GameTypes.js';

export class PhysicsSystem {
    private constants: PhysicsConstants;

    constructor(constants: PhysicsConstants) {
        this.constants = constants;
    }

    update(player: Player, deltaTime: number): void {
        const dtFactor = (deltaTime / (1000 / 60)) * this.constants.gameSpeed;

        this.applyGravity(player, dtFactor);
        this.updatePosition(player, dtFactor);
    }

    private applyGravity(player: Player, dtFactor: number): void {
        if (!player.grounded) {
            player.vy += this.constants.gravity * dtFactor;
        }
    }

    private updatePosition(player: Player, dtFactor: number): void {
        player.x += player.vx * dtFactor;
        player.y += player.vy * dtFactor;
    }

    getPhysicsConstants(): PhysicsConstants {
        return { ...this.constants };
    }

    updateConstants(newConstants: Partial<PhysicsConstants>): void {
        this.constants = { ...this.constants, ...newConstants };
    }

    resetConstants(): void {
        this.constants = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };
    }
}

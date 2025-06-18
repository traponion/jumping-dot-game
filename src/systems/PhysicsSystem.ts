import { DEFAULT_PHYSICS_CONSTANTS } from '../constants/GameConstants.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';
import { getGameStore } from '../stores/GameZustandStore.js';

export class PhysicsSystem {
    private constants: PhysicsConstants;

    constructor(constants: PhysicsConstants) {
        this.constants = constants;
    }

    update(deltaTime: number): void {
        const dtFactor = (deltaTime / (1000 / 60)) * this.constants.gameSpeed;
        
        // Get current player state from store
        const player = getGameStore().getPlayer();

        // Calculate physics updates
        const newVy = this.calculateGravity(player, dtFactor);
        const newPosition = this.calculatePosition(player, newVy, dtFactor);

        // Update store with new state
        getGameStore().updatePlayer({
            ...newPosition,
            vy: newVy,
        });
    }

    private calculateGravity(player: Player, dtFactor: number): number {
        if (!player.grounded) {
            return player.vy + this.constants.gravity * dtFactor;
        }
        return player.vy;
    }

    private calculatePosition(player: Player, newVy: number, dtFactor: number): { x: number, y: number } {
        return {
            x: player.x + player.vx * dtFactor,
            y: player.y + newVy * dtFactor
        };
    }

    getPhysicsConstants(): PhysicsConstants {
        return { ...this.constants };
    }

    updateConstants(newConstants: Partial<PhysicsConstants>): void {
        this.constants = { ...this.constants, ...newConstants };
    }

    resetConstants(): void {
        this.constants = { ...DEFAULT_PHYSICS_CONSTANTS };
    }
}

import { Player } from '../types/GameTypes.js';
import { Platform, Spike, Goal } from '../core/StageLoader.js';

export class CollisionSystem {
    checkPlatformCollision(player: Player, platform: Platform, prevPlayerFootY: number): boolean {
        const currentPlayerFootY = player.y + player.radius;

        if (player.x + player.radius > platform.x1 && 
            player.x - player.radius < platform.x2 &&
            player.vy >= 0 &&
            prevPlayerFootY <= platform.y1 &&
            currentPlayerFootY >= platform.y1) {
            
            player.y = platform.y1 - player.radius;
            player.vy = 0;
            player.grounded = true;
            return true;
        }
        return false;
    }

    handlePlatformCollisions(player: Player, platforms: Platform[], prevPlayerFootY: number): boolean {
        player.grounded = false;
        
        for (const platform of platforms) {
            if (this.checkPlatformCollision(player, platform, prevPlayerFootY)) {
                return true;
            }
        }
        return false;
    }

    checkSpikeCollision(player: Player, spike: Spike): boolean {
        return (player.x + player.radius > spike.x &&
                player.x - player.radius < spike.x + spike.width &&
                player.y + player.radius > spike.y &&
                player.y - player.radius < spike.y + spike.height);
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
        return (player.x + player.radius > goal.x &&
                player.x - player.radius < goal.x + goal.width &&
                player.y + player.radius > goal.y &&
                player.y - player.radius < goal.y + goal.height);
    }

    checkHoleCollision(player: Player, holeThreshold: number): boolean {
        return player.y > holeThreshold;
    }

    checkBoundaryCollision(player: Player, canvasHeight: number): boolean {
        return player.y > canvasHeight + 100;
    }
}
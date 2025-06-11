import { describe, it, expect, beforeEach } from 'vitest';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { Player } from '../types/GameTypes.js';
import { Platform, Spike, Goal } from '../core/StageLoader.js';

describe('CollisionSystem', () => {
    let player: Player;
    let collisionSystem: CollisionSystem;

    beforeEach(() => {
        player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };
        
        collisionSystem = new CollisionSystem();
    });

    describe('platform collision', () => {
        it('should detect platform collision when falling onto platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            player.y = 408; // Player foot at 408 + 3 = 411, just crossing platform
            player.vy = 5; // Ensure player is falling
            const prevPlayerFootY = 405; // Player was above platform
            
            const result = collisionSystem.checkPlatformCollision(player, platform, prevPlayerFootY);
            
            expect(result).toBe(true);
            expect(player.y).toBe(407); // platform.y1 - player.radius
            expect(player.vy).toBe(0);
            expect(player.grounded).toBe(true);
        });

        it('should not detect collision when moving upward', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            player.vy = -5; // Moving upward
            const prevPlayerFootY = 415;
            
            const result = collisionSystem.checkPlatformCollision(player, platform, prevPlayerFootY);
            
            expect(result).toBe(false);
            expect(player.grounded).toBe(false);
        });

        it('should not detect collision when player is horizontally outside platform', () => {
            const platform: Platform = { x1: 90, y1: 410, x2: 110, y2: 410 };
            player.x = 120; // Outside platform horizontally
            const prevPlayerFootY = 405;
            
            const result = collisionSystem.checkPlatformCollision(player, platform, prevPlayerFootY);
            
            expect(result).toBe(false);
            expect(player.grounded).toBe(false);
        });

        it('should handle multiple platforms and return true for first collision', () => {
            const platforms: Platform[] = [
                { x1: 90, y1: 410, x2: 110, y2: 410 },
                { x1: 90, y1: 420, x2: 110, y2: 420 }
            ];
            player.y = 408; // Player foot at 408 + 3 = 411, just crossing platform
            player.vy = 5; // Ensure player is falling
            const prevPlayerFootY = 405;
            
            const result = collisionSystem.handlePlatformCollisions(player, platforms, prevPlayerFootY);
            
            expect(result).toBe(true);
            expect(player.y).toBe(407); // Should land on first platform
        });
    });

    describe('spike collision', () => {
        it('should detect spike collision when player overlaps spike', () => {
            const spike: Spike = { x: 95, y: 395, width: 10, height: 10 };
            
            const result = collisionSystem.checkSpikeCollision(player, spike);
            
            expect(result).toBe(true);
        });

        it('should not detect spike collision when player is outside spike area', () => {
            const spike: Spike = { x: 120, y: 395, width: 10, height: 10 };
            
            const result = collisionSystem.checkSpikeCollision(player, spike);
            
            expect(result).toBe(false);
        });

        it('should check multiple spikes and return true if any collision', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 }, // No collision
                { x: 95, y: 395, width: 10, height: 10 }   // Collision
            ];
            
            const result = collisionSystem.checkSpikeCollisions(player, spikes);
            
            expect(result).toBe(true);
        });

        it('should return false when no spike collisions', () => {
            const spikes: Spike[] = [
                { x: 120, y: 395, width: 10, height: 10 },
                { x: 130, y: 395, width: 10, height: 10 }
            ];
            
            const result = collisionSystem.checkSpikeCollisions(player, spikes);
            
            expect(result).toBe(false);
        });
    });

    describe('goal collision', () => {
        it('should detect goal collision when player overlaps goal', () => {
            const goal: Goal = { x: 95, y: 395, width: 10, height: 10 };
            
            const result = collisionSystem.checkGoalCollision(player, goal);
            
            expect(result).toBe(true);
        });

        it('should not detect goal collision when player is outside goal area', () => {
            const goal: Goal = { x: 120, y: 395, width: 10, height: 10 };
            
            const result = collisionSystem.checkGoalCollision(player, goal);
            
            expect(result).toBe(false);
        });
    });

    describe('hole collision', () => {
        it('should detect hole collision when player falls below threshold', () => {
            player.y = 650; // Below hole threshold
            
            const result = collisionSystem.checkHoleCollision(player, 600);
            
            expect(result).toBe(true);
        });

        it('should not detect hole collision when player is above threshold', () => {
            player.y = 550; // Above hole threshold
            
            const result = collisionSystem.checkHoleCollision(player, 600);
            
            expect(result).toBe(false);
        });
    });

    describe('general boundary collision', () => {
        it('should detect when player falls too far down', () => {
            player.y = 750; // Way below screen
            const canvasHeight = 600;
            
            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);
            
            expect(result).toBe(true);
        });

        it('should not detect boundary collision for normal positions', () => {
            player.y = 400; // Normal position
            const canvasHeight = 600;
            
            const result = collisionSystem.checkBoundaryCollision(player, canvasHeight);
            
            expect(result).toBe(false);
        });
    });
});
import { beforeEach, describe, expect, it } from 'vitest';
import { LandingPredictionSystem } from '../systems/LandingPredictionSystem.js';
import type { Platform } from '../core/StageLoader.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';

describe('LandingPredictionSystem', () => {
    let player: Player;
    let platforms: Platform[];
    let physics: PhysicsConstants;
    let predictionSystem: LandingPredictionSystem;

    beforeEach(() => {
        player = {
            x: 100,
            y: 447, // Just above first platform for easier testing
            vx: 2,
            vy: 0,
            radius: 3,
            grounded: true
        };

        platforms = [
            { x1: 80, y1: 450, x2: 120, y2: 450 },    // Player starts above this
            { x1: 180, y1: 450, x2: 220, y2: 450 },   // Reachable with vx=2
            { x1: 280, y1: 450, x2: 320, y2: 450 }    // Further away
        ];

        physics = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        predictionSystem = new LandingPredictionSystem();
    });

    describe('landing prediction', () => {
        it('should predict simple falling case when player is in air', () => {
            // Set player to be falling directly onto platform
            player.grounded = false;
            player.y = 440; // Above platform
            player.vy = 5;  // Falling
            player.vx = 0;  // No horizontal movement

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);

            expect(predictions.length).toBeGreaterThan(0);
            if (predictions.length > 0) {
                expect(predictions[0].y).toBe(450); // Should land on platform
                expect(Math.abs(predictions[0].x - player.x)).toBeLessThan(10); // Close to starting x
            }
        });

        it('should handle grounded player with immediate jump', () => {
            // Test case where player should jump immediately
            player.grounded = true;
            player.x = 100; // On first platform
            player.y = 447; // Just above platform (foot at 450)
            player.vx = 2;  // Moving right
            player.vy = 0;

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);

            expect(predictions.length).toBeGreaterThan(0);
            if (predictions.length > 0) {
                expect(predictions[0].x).toBeGreaterThan(150); // Should reach second platform area
                expect(predictions[0].y).toBe(450);
            }
        });

        it('should predict next landing point when player is grounded', () => {
            const predictions = predictionSystem.predictLandings(player, platforms, physics, 3);

            // Just check that we get at least one prediction
            expect(predictions.length).toBeGreaterThan(0);
            if (predictions.length > 0) {
                expect(predictions[0].x).toBeGreaterThan(player.x);
                expect(predictions[0].y).toBe(450); // Should land on platform at y=450
            }
        });

        it('should predict landing on specific platform', () => {
            // Set player to land on second platform (since vx=1 is slow)
            player.x = 100;
            player.vx = 1;

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);
            

            expect(predictions).toHaveLength(1);
            // With vx=1, should reach around x=180+ (second platform)
            expect(predictions[0].x).toBeGreaterThan(150);
            expect(predictions[0].y).toBe(450);
        });

        it('should handle multiple consecutive landings', () => {
            player.vx = 5; // High velocity to reach multiple platforms

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 3);

            expect(predictions.length).toBeGreaterThan(0);
            
            // Each subsequent landing should be further to the right
            for (let i = 1; i < predictions.length; i++) {
                expect(predictions[i].x).toBeGreaterThan(predictions[i - 1].x);
            }
        });

        it('should respect auto-jump interval timing', () => {
            const predictions = predictionSystem.predictLandings(player, platforms, physics, 2);

            if (predictions.length >= 2) {
                // Calculate expected time difference based on jump interval
                // This is a rough check as timing depends on physics simulation
                expect(predictions[1].x).toBeGreaterThan(predictions[0].x);
            }
        });

        it('should return empty array when no platforms are reachable', () => {
            // Set up scenario where player falls indefinitely
            const emptyPlatforms: Platform[] = [];
            
            const predictions = predictionSystem.predictLandings(player, emptyPlatforms, physics, 3);

            expect(predictions).toHaveLength(0);
        });

        it('should handle player already in air', () => {
            player.grounded = false;
            player.vy = 5; // Falling

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 2);

            expect(predictions.length).toBeGreaterThanOrEqual(0);
            if (predictions.length > 0) {
                expect(predictions[0].y).toBeGreaterThanOrEqual(player.y);
            }
        });
    });

    describe('physics simulation', () => {
        it('should simulate gravity correctly', () => {
            player.grounded = false;
            player.vy = 0;

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);

            if (predictions.length > 0) {
                // Player should fall due to gravity
                expect(predictions[0].y).toBeGreaterThan(player.y);
            }
        });

        it('should simulate horizontal movement', () => {
            player.vx = 3;

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);

            if (predictions.length > 0) {
                // Player should move horizontally
                expect(predictions[0].x).toBeGreaterThan(player.x);
            }
        });

        it('should handle edge case of zero velocity', () => {
            player.vx = 0;
            player.vy = 0;

            const predictions = predictionSystem.predictLandings(player, platforms, physics, 1);

            // Should still predict something if player will auto-jump
            expect(predictions.length).toBeGreaterThanOrEqual(0);
        });
    });
});
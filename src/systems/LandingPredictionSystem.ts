import type { Platform } from '../core/StageLoader.js';
import type { PhysicsConstants, Player } from '../types/GameTypes.js';

export interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, how certain we are about this prediction
    jumpNumber: number; // Which jump this represents (1, 2, 3...)
}

export class LandingPredictionSystem {
    private readonly MAX_SIMULATION_TIME = 5000; // 5 seconds max simulation
    private readonly TIME_STEP = 16.67; // Simulate at 60fps equivalent

    /**
     * Predict landing points for the next few jumps
     */
    predictLandings(
        player: Player, 
        platforms: Platform[], 
        physics: PhysicsConstants, 
        maxPredictions: number
    ): LandingPrediction[] {
        const predictions: LandingPrediction[] = [];
        
        // Create simulation state
        const sim = this.createSimulationState(player, physics);
        
        let jumpCount = 0;
        let timeElapsed = 0;
        let timeSinceLastJump = sim.grounded ? physics.autoJumpInterval + 1 : 0; // Force immediate jump if grounded
        let wasAirborne = !sim.grounded; // Track if we've been airborne since last landing

        while (jumpCount < maxPredictions && timeElapsed < this.MAX_SIMULATION_TIME) {
            // Store previous position
            const prevFootY = sim.y + sim.radius;
            
            // Update simulation
            timeElapsed += this.TIME_STEP;
            timeSinceLastJump += this.TIME_STEP;
            
            // Check for auto-jump before physics
            if (sim.grounded && timeSinceLastJump >= physics.autoJumpInterval) {
                sim.vy = physics.jumpForce;
                sim.grounded = false;
                timeSinceLastJump = 0;
                wasAirborne = true; // Set airborne flag immediately on jump
            }
            
            // Apply physics
            this.simulatePhysics(sim, physics, this.TIME_STEP);
            
            // Check for platform collision using crossing detection
            const currentPlayerFootY = sim.y + sim.radius;
            const landingPlatform = this.checkPlatformCollisionWithCrossing(sim, platforms, prevFootY, currentPlayerFootY, wasAirborne);
            
            if (landingPlatform) {
                // Found a landing!
                jumpCount++;
                const confidence = this.calculateConfidence(jumpCount, timeElapsed);
                
                predictions.push({
                    x: sim.x,
                    y: landingPlatform.y1,
                    confidence,
                    jumpNumber: jumpCount
                });
                
                // Update simulation state for next prediction
                sim.y = landingPlatform.y1 - sim.radius;
                sim.vy = 0;
                sim.grounded = true;
                timeSinceLastJump = 0;
                wasAirborne = false; // Reset for next jump
            }
        }
        
        return predictions;
    }

    /**
     * Create simulation state from current player
     */
    private createSimulationState(player: Player, physics: PhysicsConstants) {
        return {
            x: player.x,
            y: player.y,
            vx: player.vx,
            vy: player.vy,
            radius: player.radius,
            grounded: player.grounded
        };
    }

    /**
     * Simulate physics for one time step
     */
    private simulatePhysics(sim: any, physics: PhysicsConstants, deltaTime: number): void {
        const dtFactor = (deltaTime / (1000 / 60)) * physics.gameSpeed;
        
        // Apply gravity
        if (!sim.grounded) {
            sim.vy += physics.gravity * dtFactor;
        }
        
        // Update position
        sim.x += sim.vx * dtFactor;
        sim.y += sim.vy * dtFactor;
    }

    /**
     * Check collision with platforms using crossing detection (like CollisionSystem)
     */
    private checkPlatformCollisionWithCrossing(
        sim: any, 
        platforms: Platform[], 
        prevPlayerFootY: number, 
        currentPlayerFootY: number,
        wasAirborne: boolean
    ): Platform | null {
        if (sim.vy < 0 || sim.grounded) return null; // Not falling or already grounded
        
        for (const platform of platforms) {
            const horizontalOverlap = sim.x + sim.radius > platform.x1 && sim.x - sim.radius < platform.x2;
            const verticalCrossing = prevPlayerFootY < platform.y1 && currentPlayerFootY >= platform.y1;
            
            
            if (horizontalOverlap && verticalCrossing && wasAirborne) {
                return platform;
            }
        }
        
        return null;
    }

    /**
     * Calculate confidence level for prediction
     */
    private calculateConfidence(jumpNumber: number, timeElapsed: number): number {
        // Confidence decreases with distance and time
        const jumpPenalty = Math.max(0, 1 - (jumpNumber - 1) * 0.3);
        const timePenalty = Math.max(0, 1 - timeElapsed / this.MAX_SIMULATION_TIME);
        
        return Math.max(0.1, jumpPenalty * timePenalty);
    }
}
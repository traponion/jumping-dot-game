import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GameState } from '../stores/GameState';
import { GameRuleSystem } from '../systems/GameRuleSystem';
import { getCurrentTime } from '../utils/GameUtils';

// Mock GameUtils
vi.mock('../utils/GameUtils', () => ({
    getCurrentTime: vi.fn()
}));

describe('GameRuleSystem', () => {
    let gameRuleSystem: GameRuleSystem;
    let mockGameState: GameState;

    beforeEach(() => {
        // Setup mock GameState with all required properties
        mockGameState = {
            runtime: {
                player: { x: 100, y: 200, radius: 10 },
                camera: { x: 0, y: 0 },
                deathMarks: [],
                collisionResults: {
                    holeCollision: false,
                    boundaryCollision: false,
                    goalCollision: false
                }
            },
            gameRunning: true,
            gameOver: false,
            currentStage: 1,
            timeLimit: 10,
            timeRemaining: 10,
            gameStartTime: null,
            finalScore: 0,
            stage: null,
            hasMovedOnce: false,
            performance: { fps: 60, deltaTime: 16.67 },
            reset: vi.fn()
        } as unknown as GameState;

        gameRuleSystem = new GameRuleSystem(mockGameState);
    });

    describe('boundary checking', () => {
        it('should detect hole collision and set game over', () => {
            // Setup: Hole collision detected via collision results flag
            mockGameState.runtime.collisionResults.holeCollision = true;
            mockGameState.runtime.collisionResults.boundaryCollision = false;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over state set
            expect(mockGameState.gameOver).toBe(true);
        });

        it('should detect boundary collision and set game over', () => {
            // Setup: Boundary collision detected via collision results flag
            mockGameState.runtime.collisionResults.holeCollision = false;
            mockGameState.runtime.collisionResults.boundaryCollision = true;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over state set
            expect(mockGameState.gameOver).toBe(true);
        });

        it('should not set game over when no collisions detected', () => {
            // Setup: No collisions via collision results flags
            mockGameState.runtime.collisionResults.holeCollision = false;
            mockGameState.runtime.collisionResults.boundaryCollision = false;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game continues
            expect(mockGameState.gameOver).toBe(false);
        });
    });

    describe('time checking', () => {
        it('should update time remaining when game is running', () => {
            // Setup: Game started 3 seconds ago
            const startTime = 1000;
            const currentTime = 4000; // 3 seconds later
            mockGameState.gameStartTime = startTime;
            mockGameState.timeLimit = 10;
            vi.mocked(getCurrentTime).mockReturnValue(currentTime);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Time remaining updated
            expect(mockGameState.timeRemaining).toBe(7); // 10 - 3 = 7
            expect(mockGameState.gameOver).toBe(false);
        });

        it('should set game over when time runs out', () => {
            // Setup: Game started 15 seconds ago (exceeds 10 second limit)
            const startTime = 1000;
            const currentTime = 16000; // 15 seconds later
            mockGameState.gameStartTime = startTime;
            mockGameState.timeLimit = 10;
            vi.mocked(getCurrentTime).mockReturnValue(currentTime);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over due to time up
            expect(mockGameState.timeRemaining).toBe(0);
            expect(mockGameState.gameOver).toBe(true);
        });

        it('should handle case when game start time is null', () => {
            // Setup: Game not started
            mockGameState.gameStartTime = null;
            const originalTimeRemaining = mockGameState.timeRemaining;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Time remaining unchanged, game continues
            expect(mockGameState.timeRemaining).toBe(originalTimeRemaining);
            expect(mockGameState.gameOver).toBe(false);
        });

        it('should not go below zero for time remaining', () => {
            // Setup: Game started way past time limit
            const startTime = 1000;
            const currentTime = 50000; // 49 seconds later
            mockGameState.gameStartTime = startTime;
            mockGameState.timeLimit = 10;
            vi.mocked(getCurrentTime).mockReturnValue(currentTime);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Time remaining clamped to 0
            expect(mockGameState.timeRemaining).toBe(0);
            expect(mockGameState.gameOver).toBe(true);
        });
    });

    describe('goal checking', () => {
        it('should detect goal reached and set final score', () => {
            // Setup: Player reaches goal with 7 seconds remaining via collision results flag
            mockGameState.timeRemaining = 7.3;
            mockGameState.stage = { goal: { x: 700, y: 400, width: 40, height: 50 } } as any;
            mockGameState.runtime.collisionResults.goalCollision = true;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Goal completion state set
            expect(mockGameState.gameOver).toBe(true);
            expect(mockGameState.finalScore).toBe(8); // Math.ceil(7.3) = 8
        });

        it('should not affect game state when goal not reached', () => {
            // Setup: Player not at goal via collision results flag
            const originalScore = mockGameState.finalScore;
            mockGameState.runtime.collisionResults.goalCollision = false;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game state unchanged
            expect(mockGameState.gameOver).toBe(false);
            expect(mockGameState.finalScore).toBe(originalScore);
        });
    });

    describe('comprehensive rule checking', () => {
        it('should handle multiple rule violations prioritizing first detection', () => {
            // Setup: Both boundary and time violations
            const startTime = 1000;
            const currentTime = 20000; // Time expired
            mockGameState.gameStartTime = startTime;
            mockGameState.timeLimit = 10;
            const originalTimeRemaining = mockGameState.timeRemaining;
            vi.mocked(getCurrentTime).mockReturnValue(currentTime);
            mockGameState.runtime.collisionResults.holeCollision = true;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over set (boundary check happens first)
            expect(mockGameState.gameOver).toBe(true);
            // Time remaining unchanged because boundary check happened first
            expect(mockGameState.timeRemaining).toBe(originalTimeRemaining);
        });

        it('should skip time check when game already over', () => {
            // Setup: Game already over
            mockGameState.gameOver = true;
            const originalTimeRemaining = mockGameState.timeRemaining;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Time not updated when game over
            expect(mockGameState.timeRemaining).toBe(originalTimeRemaining);
            expect(getCurrentTime).not.toHaveBeenCalled();
        });
    });

    describe('collision results integration', () => {
        it('should properly read collision results from GameState', () => {
            // Setup: Set collision flags
            mockGameState.runtime.collisionResults.holeCollision = false;
            mockGameState.runtime.collisionResults.boundaryCollision = false;
            mockGameState.runtime.collisionResults.goalCollision = false;

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game continues when no collision flags are set
            expect(mockGameState.gameOver).toBe(false);
        });
    });

    describe('death marker position clamping', () => {
        beforeEach(() => {
            vi.mocked(getCurrentTime).mockReturnValue(1500);
        });

        it('should clamp death marker Y position to visible area for fall deaths', () => {
            // Setup: Player falls below screen bounds (y > 600)
            mockGameState.runtime.player.x = 300;
            mockGameState.runtime.player.y = 750; // Below screen bounds
            mockGameState.runtime.collisionResults.holeCollision = true;

            // Action: Trigger death via hole collision
            gameRuleSystem.update();

            // Assert: Death marker Y position is clamped to visible area
            expect(mockGameState.gameOver).toBe(true);
            expect(mockGameState.runtime.deathMarks).toHaveLength(1);
            expect(mockGameState.runtime.deathMarks[0]).toEqual({
                x: 300,
                y: 580, // Should be clamped above bottom edge for optimal visibility
                timestamp: 1500
            });
            expect(mockGameState.runtime.shouldStartDeathAnimation).toBe(true);
        });

        it('should not clamp death marker Y position for deaths within screen bounds', () => {
            // Setup: Player dies within screen bounds (y < 600)
            mockGameState.runtime.player.x = 400;
            mockGameState.runtime.player.y = 350; // Within screen bounds
            mockGameState.runtime.collisionResults.boundaryCollision = true;

            // Action: Trigger death via boundary collision
            gameRuleSystem.update();

            // Assert: Death marker Y position remains unchanged
            expect(mockGameState.gameOver).toBe(true);
            expect(mockGameState.runtime.deathMarks).toHaveLength(1);
            expect(mockGameState.runtime.deathMarks[0]).toEqual({
                x: 400,
                y: 350, // Should remain at original position
                timestamp: 1500
            });
            expect(mockGameState.runtime.shouldStartDeathAnimation).toBe(true);
        });

        it('should clamp death marker Y position for time-up deaths below screen bounds', () => {
            // Setup: Player below screen bounds when time runs out
            mockGameState.runtime.player.x = 200;
            mockGameState.runtime.player.y = 680; // Below screen bounds
            mockGameState.gameStartTime = 1000;
            mockGameState.timeLimit = 0.5; // 0.5 seconds limit
            vi.mocked(getCurrentTime).mockReturnValue(2000); // 1 second later

            // Action: Trigger death via time up
            gameRuleSystem.update();

            // Assert: Death marker Y position is clamped to visible area
            expect(mockGameState.gameOver).toBe(true);
            expect(mockGameState.runtime.deathMarks).toHaveLength(1);
            expect(mockGameState.runtime.deathMarks[0]).toEqual({
                x: 200,
                y: 580, // Should be clamped above bottom edge for optimal visibility
                timestamp: 2000
            });
            expect(mockGameState.runtime.shouldStartDeathAnimation).toBe(true);
        });
    });
});

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
    let mockCollisionSystem: any;

    beforeEach(() => {
        // Mock CollisionSystem
        mockCollisionSystem = {
            checkHoleCollision: vi.fn(),
            checkBoundaryCollision: vi.fn()
        };

        // Setup mock GameState with all required properties
        mockGameState = {
            runtime: {
                player: { x: 100, y: 200, radius: 10 },
                camera: { x: 0, y: 0 },
                deathMarks: []
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

        gameRuleSystem = new GameRuleSystem(mockGameState, mockCollisionSystem);
    });

    describe('boundary checking', () => {
        it('should detect hole collision and set game over', () => {
            // Setup: Player in normal position, hole collision detected
            mockCollisionSystem.checkHoleCollision.mockReturnValue(true);
            mockCollisionSystem.checkBoundaryCollision.mockReturnValue(false);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over state set
            expect(mockGameState.gameOver).toBe(true);
            expect(mockCollisionSystem.checkHoleCollision).toHaveBeenCalledWith(
                mockGameState.runtime.player,
                600
            );
        });

        it('should detect boundary collision and set game over', () => {
            // Setup: Player in normal position, boundary collision detected
            mockCollisionSystem.checkHoleCollision.mockReturnValue(false);
            mockCollisionSystem.checkBoundaryCollision.mockReturnValue(true);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Game over state set
            expect(mockGameState.gameOver).toBe(true);
            expect(mockCollisionSystem.checkBoundaryCollision).toHaveBeenCalledWith(
                mockGameState.runtime.player,
                600 // canvas.height equivalent
            );
        });

        it('should not set game over when no collisions detected', () => {
            // Setup: No collisions
            mockCollisionSystem.checkHoleCollision.mockReturnValue(false);
            mockCollisionSystem.checkBoundaryCollision.mockReturnValue(false);

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
            // Setup: Player reaches goal with 7 seconds remaining
            mockGameState.timeRemaining = 7.3;
            mockGameState.stage = { goal: { x: 700, y: 400, width: 40, height: 50 } } as any;
            mockCollisionSystem.checkGoalCollision = vi.fn().mockReturnValue(true);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Goal completion state set
            expect(mockGameState.gameOver).toBe(true);
            expect(mockGameState.finalScore).toBe(8); // Math.ceil(7.3) = 8
        });

        it('should not affect game state when goal not reached', () => {
            // Setup: Player not at goal
            const originalScore = mockGameState.finalScore;
            mockCollisionSystem.checkGoalCollision = vi.fn().mockReturnValue(false);

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
            mockCollisionSystem.checkHoleCollision.mockReturnValue(true);

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

    describe('integration with collision system', () => {
        it('should provide correct canvas height for boundary checking', () => {
            // Setup: Canvas height simulation
            mockCollisionSystem.checkBoundaryCollision.mockReturnValue(false);

            // Action: Run rule checking
            gameRuleSystem.update();

            // Assert: Correct canvas height passed
            expect(mockCollisionSystem.checkBoundaryCollision).toHaveBeenCalledWith(
                mockGameState.runtime.player,
                600 // Standard canvas height
            );
        });
    });
});

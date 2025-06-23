import { beforeEach, describe, expect, it } from 'vitest';
import { GAME_CONFIG } from '../constants/GameConstants.js';
import { getGameStore } from '../stores/GameZustandStore.js';

describe('GameZustandStore', () => {
    beforeEach(() => {
        // Reset store to clean state before each test
        getGameStore().reset();
    });

    describe('Game State Actions', () => {
        it('should start game and set correct initial state', () => {
            // Act
            getGameStore().startGame();

            // Assert
            const gameState = getGameStore().getGameState();
            expect(gameState.gameRunning).toBe(true);
            expect(gameState.gameOver).toBe(false);
            expect(gameState.gameStartTime).not.toBeNull();
            expect(gameState.hasMovedOnce).toBe(false);
        });

        it('should pause and resume game correctly', () => {
            // Arrange
            getGameStore().startGame();

            // Act: Pause
            getGameStore().pauseGame();

            // Assert: Paused
            expect(getGameStore().getGameState().gameRunning).toBe(false);

            // Act: Resume
            getGameStore().resumeGame();

            // Assert: Resumed
            expect(getGameStore().getGameState().gameRunning).toBe(true);
        });

        it('should handle game over correctly', () => {
            // Arrange
            getGameStore().startGame();

            // Act
            getGameStore().gameOver();

            // Assert
            const gameState = getGameStore().getGameState();
            expect(gameState.gameRunning).toBe(false);
            expect(gameState.gameOver).toBe(true);
        });

        it('should restart game and reset state', () => {
            // Arrange: Set some game state and add death marks
            getGameStore().startGame();
            getGameStore().gameOver();
            getGameStore().setFinalScore(100);

            // Add death marks before restart
            const deathMark1 = { x: 100, y: 200, timestamp: 1000 };
            const deathMark2 = { x: 150, y: 250, timestamp: 2000 };
            getGameStore().addDeathMark(deathMark1);
            getGameStore().addDeathMark(deathMark2);

            // Act
            getGameStore().restartGame();

            // Assert: restartGame resets game state but preserves death marks
            const gameState = getGameStore().getGameState();
            expect(gameState.gameRunning).toBe(false); // Needs explicit startGame() call
            expect(gameState.gameOver).toBe(false);
            expect(gameState.finalScore).toBe(0);
            expect(gameState.hasMovedOnce).toBe(false);

            // Death marks should persist across restarts for learning purposes
            const deathMarks = getGameStore().runtime.deathMarks;
            expect(deathMarks).toHaveLength(2);
            expect(deathMarks[0]).toEqual(deathMark1);
            expect(deathMarks[1]).toEqual(deathMark2);
        });
    });

    describe('addTrailPoint action', () => {
        it('should add a point to the trail', () => {
            // Arrange
            const initialLength = getGameStore().runtime.trail.length;
            const testPoint = { x: 10, y: 20 };

            // Act
            getGameStore().addTrailPoint(testPoint);

            // Assert
            const newTrail = getGameStore().runtime.trail;
            expect(newTrail.length).toBe(initialLength + 1);
            expect(newTrail[newTrail.length - 1]).toEqual(testPoint);
        });

        it('should not exceed max trail length', () => {
            // Arrange
            const maxTrailLength = GAME_CONFIG.player.maxTrailLength;

            // Act: Add more points than max length
            for (let i = 0; i < maxTrailLength + 5; i++) {
                getGameStore().addTrailPoint({ x: i, y: i });
            }

            // Assert
            const trail = getGameStore().runtime.trail;
            expect(trail.length).toBe(maxTrailLength);
            // Oldest points should be removed, newest should be at the end
            expect(trail[trail.length - 1]).toEqual({
                x: maxTrailLength + 4,
                y: maxTrailLength + 4
            });
        });

        it('should maintain trail order when at max capacity', () => {
            // Arrange
            const maxTrailLength = GAME_CONFIG.player.maxTrailLength;

            // Fill trail to max capacity
            for (let i = 0; i < maxTrailLength; i++) {
                getGameStore().addTrailPoint({ x: i, y: i });
            }

            // Act: Add one more point
            getGameStore().addTrailPoint({ x: 999, y: 999 });

            // Assert
            const trail = getGameStore().runtime.trail;
            expect(trail.length).toBe(maxTrailLength);
            expect(trail[0]).toEqual({ x: 1, y: 1 }); // First point should be removed
            expect(trail[trail.length - 1]).toEqual({ x: 999, y: 999 }); // New point at end
        });
    });

    describe('updateTrail action', () => {
        it('should replace entire trail with new array', () => {
            // Arrange
            getGameStore().addTrailPoint({ x: 1, y: 1 });
            getGameStore().addTrailPoint({ x: 2, y: 2 });
            const newTrail = [
                { x: 10, y: 10 },
                { x: 20, y: 20 }
            ];

            // Act
            getGameStore().updateTrail(newTrail);

            // Assert
            expect(getGameStore().runtime.trail).toEqual(newTrail);
        });

        it('should clear trail when empty array is provided', () => {
            // Arrange
            getGameStore().addTrailPoint({ x: 1, y: 1 });
            getGameStore().addTrailPoint({ x: 2, y: 2 });

            // Act
            getGameStore().updateTrail([]);

            // Assert
            expect(getGameStore().runtime.trail).toEqual([]);
            expect(getGameStore().runtime.trail.length).toBe(0);
        });
    });

    describe('Player Actions', () => {
        it('should update player velocity correctly', () => {
            // Arrange
            const player = getGameStore().getPlayer();
            const initialVx = player.vx;
            const dtFactor = 1.0;

            // Act: Move right
            getGameStore().updatePlayerVelocity('right', dtFactor);

            // Assert
            const updatedPlayer = getGameStore().getPlayer();
            expect(updatedPlayer.vx).toBe(initialVx + GAME_CONFIG.player.acceleration * dtFactor);
        });

        it('should mark player as moved', () => {
            // Arrange
            expect(getGameStore().hasPlayerMoved()).toBe(false);

            // Act
            getGameStore().markPlayerMoved();

            // Assert
            expect(getGameStore().hasPlayerMoved()).toBe(true);
        });

        it('should update player properties correctly', () => {
            // Arrange
            const updates = { x: 200, y: 300, vx: 5, vy: -10, grounded: true };

            // Act
            getGameStore().updatePlayer(updates);

            // Assert
            const player = getGameStore().getPlayer();
            expect(player.x).toBe(200);
            expect(player.y).toBe(300);
            expect(player.vx).toBe(5);
            expect(player.vy).toBe(-10);
            expect(player.grounded).toBe(true);
        });
    });

    describe('Time and Stage Management', () => {
        it('should set time limit and update remaining time', () => {
            // Act
            getGameStore().setTimeLimit(15);

            // Assert
            expect(getGameStore().game.timeLimit).toBe(15);
            expect(getGameStore().getTimeRemaining()).toBe(15);
        });

        it('should update time remaining', () => {
            // Arrange
            getGameStore().setTimeLimit(20);

            // Act
            getGameStore().updateTimeRemaining(5);

            // Assert
            expect(getGameStore().getTimeRemaining()).toBe(5);
        });

        it('should set current stage', () => {
            // Act
            getGameStore().setCurrentStage(3);

            // Assert
            expect(getGameStore().getCurrentStage()).toBe(3);
        });

        it('should set final score', () => {
            // Act
            getGameStore().setFinalScore(1500);

            // Assert
            expect(getGameStore().getFinalScore()).toBe(1500);
        });
    });

    describe('Runtime State Actions', () => {
        it('should add particles correctly', () => {
            // Arrange
            const particle = { x: 100, y: 200, vx: 1, vy: -1, life: 1.0, decay: 0.1, size: 3 };

            // Act
            getGameStore().addParticle(particle);

            // Assert
            expect(getGameStore().runtime.particles).toContain(particle);
        });

        it('should update particles array', () => {
            // Arrange
            getGameStore().addParticle({ x: 1, y: 1, vx: 0, vy: 0, life: 1, decay: 0.1, size: 1 });
            const newParticles = [
                { x: 10, y: 10, vx: 1, vy: 1, life: 0.8, decay: 0.05, size: 2 },
                { x: 20, y: 20, vx: -1, vy: 1, life: 0.6, decay: 0.08, size: 3 }
            ];

            // Act
            getGameStore().updateParticles(newParticles);

            // Assert
            expect(getGameStore().runtime.particles).toEqual(newParticles);
        });

        it('should add death marks correctly', () => {
            // Arrange
            const deathMark = { x: 150, y: 250, timestamp: Date.now() };

            // Act
            getGameStore().addDeathMark(deathMark);

            // Assert
            expect(getGameStore().runtime.deathMarks).toContain(deathMark);
        });
    });

    describe('Computed Getters', () => {
        it('should return correct game running state', () => {
            // Initially stopped
            expect(getGameStore().isGameRunning()).toBe(false);

            // Start game
            getGameStore().startGame();
            expect(getGameStore().isGameRunning()).toBe(true);

            // Pause game
            getGameStore().pauseGame();
            expect(getGameStore().isGameRunning()).toBe(false);
        });

        it('should return correct game over state', () => {
            // Initially not over
            expect(getGameStore().isGameOver()).toBe(false);

            // Game over
            getGameStore().gameOver();
            expect(getGameStore().isGameOver()).toBe(true);
        });
    });

    describe('Reset Action', () => {
        it('should reset all state to initial values', () => {
            // Arrange: Modify various state values
            getGameStore().startGame();
            getGameStore().setCurrentStage(5);
            getGameStore().setFinalScore(2000);
            getGameStore().markPlayerMoved();
            getGameStore().addTrailPoint({ x: 100, y: 100 });
            getGameStore().addParticle({
                x: 50,
                y: 50,
                vx: 1,
                vy: 1,
                life: 1,
                decay: 0.1,
                size: 2
            });

            // Act
            getGameStore().reset();

            // Assert: All values should be back to initial state
            const gameState = getGameStore().getGameState();
            expect(gameState.gameRunning).toBe(false);
            expect(gameState.gameOver).toBe(false);
            expect(gameState.currentStage).toBe(1);
            expect(gameState.finalScore).toBe(0);
            expect(gameState.hasMovedOnce).toBe(false);
            expect(getGameStore().runtime.trail).toEqual([]);
            expect(getGameStore().runtime.particles).toEqual([]);
            expect(getGameStore().runtime.deathMarks).toEqual([]);
        });
    });
});

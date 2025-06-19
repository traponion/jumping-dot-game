/**
 * @fileoverview Game logic and rules service
 * @module services/GameLogicService
 * @description Handles game rules, win/lose conditions, and game state transitions.
 * Separated from state management to maintain single responsibility principle.
 */

import type { GameState, Player } from '../types/GameTypes.js';


/**
 * Store interface for game logic operations
 */
export interface GameLogicStore {
    getGameState(): GameState;
    getPlayer(): Player;
    getTimeRemaining(): number;
    gameOver(): void;
    setFinalScore(score: number): void;
    updateTimeRemaining(time: number): void;
}

/**
 * Game logic and rules service
 * @description Handles game rules, win/lose conditions, and state transitions.
 * Separated from Zustand store to maintain pure state management.
 */
export class GameLogicService {
    private store: GameLogicStore;

    /**
     * Creates new GameLogicService instance
     * @param store - Store interface for game state operations
     */
    constructor(store: GameLogicStore) {
        this.store = store;
    }

    /**
     * Check if time has run out
     * @returns True if time limit exceeded
     */
    public checkTimeUp(): boolean {
        const timeRemaining = this.store.getTimeRemaining();
        return timeRemaining <= 0;
    }

    /**
     * Handle player death scenario
     * @param reason - Reason for death (e.g., 'spike', 'fall', 'timeout')
     */
    public handlePlayerDeath(reason: string): void {
        console.log(`Player died: ${reason}`);
        this.store.gameOver();
        
        // Calculate final score based on survival time
        const gameState = this.store.getGameState();
        const survivalTime = gameState.timeLimit - this.store.getTimeRemaining();
        const finalScore = Math.max(0, Math.floor(survivalTime * 100));
        
        this.store.setFinalScore(finalScore);
    }

    /**
     * Handle goal reached scenario
     */
    public handleGoalReached(): void {
        console.log('Goal reached!');
        this.store.gameOver();
        
        // Calculate final score based on remaining time and performance
        const gameState = this.store.getGameState();
        const timeBonus = Math.floor(this.store.getTimeRemaining() * 50);
        const stageBonus = gameState.currentStage * 100;
        const finalScore = timeBonus + stageBonus;
        
        this.store.setFinalScore(finalScore);
    }

    /**
     * Update game timer
     * @param deltaTime - Time elapsed since last update (in seconds)
     */
    public updateGameTimer(deltaTime: number): void {
        const currentTime = this.store.getTimeRemaining();
        const newTime = Math.max(0, currentTime - deltaTime);
        
        this.store.updateTimeRemaining(newTime);
        
        // Check for time up condition
        if (newTime <= 0) {
            this.handlePlayerDeath('timeout');
        }
    }

    /**
     * Check win condition for current stage
     * @param playerX - Player X position
     * @param playerY - Player Y position
     * @param goalX - Goal X position
     * @param goalY - Goal Y position
     * @param goalWidth - Goal width
     * @param goalHeight - Goal height
     * @returns True if player reached goal
     */
    public checkWinCondition(
        playerX: number,
        playerY: number,
        goalX: number,
        goalY: number,
        goalWidth: number,
        goalHeight: number
    ): boolean {
        const playerSize = 20; // Standard player size
        
        return (
            playerX + playerSize > goalX &&
            playerX < goalX + goalWidth &&
            playerY + playerSize > goalY &&
            playerY < goalY + goalHeight
        );
    }

    /**
     * Check if player fell off the stage
     * @param playerY - Player Y position
     * @param stageHeight - Stage height limit
     * @returns True if player fell below stage
     */
    public checkFallDeath(playerY: number, stageHeight: number): boolean {
        return playerY > stageHeight + 100; // 100px buffer below stage
    }

    /**
     * Calculate score based on game performance
     * @param survivalTime - Time survived in seconds
     * @param stageId - Current stage identifier
     * @param timeRemaining - Remaining time when completed
     * @returns Calculated score
     */
    public calculateScore(survivalTime: number, stageId: number, timeRemaining: number): number {
        const survivalBonus = Math.floor(survivalTime * 10);
        const timeBonus = Math.floor(timeRemaining * 50);
        const stageBonus = stageId * 100;
        
        return survivalBonus + timeBonus + stageBonus;
    }

    /**
     * Check if game should auto-advance to next stage
     * @returns True if should advance to next stage
     */
    public shouldAdvanceStage(): boolean {
        const gameState = this.store.getGameState();
        return gameState.gameRunning && !gameState.gameOver;
    }

    /**
     * Validate if game can start
     * @returns True if game can be started
     */
    public canStartGame(): boolean {
        const gameState = this.store.getGameState();
        return !gameState.gameRunning && !gameState.gameOver;
    }

    /**
     * Validate if game can be paused
     * @returns True if game can be paused
     */
    public canPauseGame(): boolean {
        const gameState = this.store.getGameState();
        return gameState.gameRunning && !gameState.gameOver;
    }

    /**
     * Validate if game can be resumed
     * @returns True if game can be resumed
     */
    public canResumeGame(): boolean {
        const gameState = this.store.getGameState();
        return !gameState.gameRunning && !gameState.gameOver;
    }
}
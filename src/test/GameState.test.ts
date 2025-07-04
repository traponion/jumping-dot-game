import { describe, expect, it } from 'vitest';
import { GameState } from '../stores/GameState.js';

describe('GameState', () => {
    describe('deathCount property', () => {
        it('should initialize deathCount to 0', () => {
            const gameState = new GameState();
            expect(gameState.deathCount).toBe(0);
        });

        it('should reset deathCount to 0 when reset() is called', () => {
            const gameState = new GameState();

            // Simulate some deaths
            gameState.deathCount = 5;

            // Reset should clear death count
            gameState.reset();
            expect(gameState.deathCount).toBe(0);
        });

        it('should allow incrementing deathCount', () => {
            const gameState = new GameState();

            gameState.deathCount++;
            expect(gameState.deathCount).toBe(1);

            gameState.deathCount++;
            expect(gameState.deathCount).toBe(2);
        });

        it('should maintain deathCount value during game session', () => {
            const gameState = new GameState();

            // Start with 0 deaths
            expect(gameState.deathCount).toBe(0);

            // Simulate multiple deaths
            gameState.deathCount = 3;
            expect(gameState.deathCount).toBe(3);

            // Value should persist
            expect(gameState.deathCount).toBe(3);
        });
    });
});

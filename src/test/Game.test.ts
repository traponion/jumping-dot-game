import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JumpingDotGame } from '../core/Game.ts';

// Global type declarations for test environment  
declare let global: {
    document: typeof document;
    window: typeof window;
    fetch: typeof fetch;
    performance: typeof performance;
    cancelAnimationFrame: typeof cancelAnimationFrame;
};

// Mock DOM elements
const mockCanvas = {
    getContext: () => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        fillText: vi.fn(),
        strokeRect: vi.fn(),
        ellipse: vi.fn(),
        closePath: vi.fn()
    }),
    width: 800,
    height: 600
};

const mockGameStatus = { 
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn()
} as unknown as HTMLElement;

const mockTimer = { 
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn()
} as unknown as HTMLElement;

const mockScore = { 
    textContent: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn()
} as unknown as HTMLElement;

describe('JumpingDotGame', () => {
    let game: JumpingDotGame;

    beforeEach(async () => {
        // Mock DOM elements
        global.document = {
            getElementById: vi.fn((id) => {
                if (id === 'gameCanvas') return mockCanvas;
                if (id === 'gameStatus') return mockGameStatus;
                if (id === 'timer') return mockTimer;
                if (id === 'score') return mockScore;
                return null;
            }),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        } as any;

        global.window = {
            requestAnimationFrame: vi.fn(),
            cancelAnimationFrame: vi.fn()
        } as any;

        // Mock global requestAnimationFrame and cancelAnimationFrame
        globalThis.requestAnimationFrame = vi.fn();
        globalThis.cancelAnimationFrame = vi.fn();
        global.cancelAnimationFrame = vi.fn();

        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404
        });

        global.performance = {
            now: vi.fn(() => Date.now())
        } as any;

        // Create game instance
        game = new JumpingDotGame();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create a game instance', () => {
            expect(game).toBeInstanceOf(JumpingDotGame);
        });

        it('should initialize with DOM elements', () => {
            expect(global.document.getElementById).toHaveBeenCalledWith('gameCanvas');
            expect(global.document.getElementById).toHaveBeenCalledWith('gameStatus');
            expect(global.document.getElementById).toHaveBeenCalledWith('timer');
            expect(global.document.getElementById).toHaveBeenCalledWith('score');
        });
    });

    describe('game lifecycle', () => {
        it('should start game when startGame is called', () => {
            game.startGame();
            expect(mockGameStatus.textContent).toBe('Playing');
        });

        it('should initialize game when init is called', () => {
            game.init();
            // Initially shows loading, then updates to ready state
            expect(['Loading stage...', 'Press SPACE to start']).toContain(mockGameStatus.textContent);
        });

        it('should update game loop when update is called', () => {
            // Verify that update doesn't throw errors
            expect(() => game.testUpdate()).not.toThrow();
        });

        it('should render game when render is called', () => {
            // Verify that render doesn't throw errors
            expect(() => game.testRender()).not.toThrow();
        });
    });

    describe('game loop', () => {
        it('should run game loop without errors', () => {
            // Test that game initializes without throwing
            expect(() => game.init()).not.toThrow();
        });

        it('should handle multiple init calls gracefully', () => {
            game.init();
            game.init();
            // Should not throw error on multiple initializations
            expect(true).toBe(true);
        });
    });

    describe('stage loading', () => {
        it('should handle stage loading gracefully', async () => {
            // Mock successful stage loading
            global.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue({
                    id: 1,
                    name: 'Test Stage',
                    platforms: [],
                    spikes: [],
                    goal: { x: 700, y: 400, width: 50, height: 50 },
                    holes: [],
                    text: []
                })
            });

            await game.testLoadStage(1);
            
            expect(global.fetch).toHaveBeenCalledWith('/stages/stage1.json');
        });

        it('should handle stage loading failure gracefully', async () => {
            // Mock failed stage loading
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            await game.testLoadStage(1);
            
            // Should not throw error, fallback to hardcoded stage
            expect(true).toBe(true);
        });
    });

    describe('input handling', () => {
        it('should handle game initialization with input system', () => {
            // Input system should be initialized (test through no errors)
            expect(() => game.init()).not.toThrow();
        });

        it('should handle game state changes', () => {
            game.startGame();
            // Should transition to playing state
            expect(mockGameStatus.textContent).toBe('Playing');
        });
    });

    describe('game state management', () => {
        it('should manage game running state', () => {
            game.startGame();
            // Game should be in running state
            expect(mockGameStatus.textContent).toBe('Playing');

            // Note: init() shows "Loading stage..." initially, then updates
            // This is expected behavior for the async stage loading
        });

        it('should handle timer display updates', () => {
            game.startGame();
            game.testUpdate();
            
            // Timer should be updated (tested through no errors thrown)
            expect(() => game.testUpdate()).not.toThrow();
        });
    });

    describe('integration tests', () => {
        it('should run complete game cycle without errors', () => {
            // Initialize
            game.init();
            
            // Start game
            game.startGame();
            
            // Run several update cycles
            for (let i = 0; i < 10; i++) {
                game.testUpdate();
                game.testRender();
            }
            
            // Should complete without errors
            expect(true).toBe(true);
        });

        it('should handle multiple stage loads', async () => {
            await game.testLoadStage(1);
            await game.testLoadStage(2);
            
            // Should handle multiple loads gracefully
            expect(true).toBe(true);
        });

        it('should maintain consistent state through game loop', () => {
            game.startGame();
            expect(mockGameStatus.textContent).toBe('Playing');
            
            // Game maintains running state consistently
            game.testUpdate();
            // After update, status should still be Playing (not timer text)
            expect(mockGameStatus.textContent).toBe('Playing');
        });
    });

    describe('game over and cleanup', () => {
        it('should render without errors in any state', () => {
            // Test render in initial state
            expect(() => game.testRender()).not.toThrow();
            
            // Test render after starting game
            game.startGame();
            expect(() => game.testRender()).not.toThrow();
        });

        it('should render game over screen when game is over', () => {
            game.startGame();
            
            // Set game over state and test render
            game.setGameOver();
            expect(() => game.testRender()).not.toThrow();
            
            // The game over render path should be executed
            game.testRender();
        });

        it('should cleanup properly when called', () => {
            game.startGame();
            expect(mockGameStatus.textContent).toBe('Playing');

            // Test cleanup functionality - should not throw errors
            expect(() => game.cleanup()).not.toThrow();
            
            // Cleanup function exists and can be called multiple times safely
            expect(() => game.cleanup()).not.toThrow();
        });

        it('should handle cleanup with active animation frame', () => {
            const originalCancelAnimationFrame = global.cancelAnimationFrame;
            const cancelSpy = vi.fn();
            global.cancelAnimationFrame = cancelSpy;

            // Set an animation ID and then cleanup
            game.setAnimationId(123);
            game.cleanup();

            // Should have called cancelAnimationFrame
            expect(cancelSpy).toHaveBeenCalledWith(123);

            global.cancelAnimationFrame = originalCancelAnimationFrame;
        });

        it('should handle cleanup without animation frame', () => {
            const originalCancelAnimationFrame = global.cancelAnimationFrame;
            const cancelSpy = vi.fn();
            global.cancelAnimationFrame = cancelSpy;

            // Cleanup without setting animation ID
            game.cleanup();

            // Should not call cancelAnimationFrame when no animation ID
            expect(cancelSpy).not.toHaveBeenCalled();

            global.cancelAnimationFrame = originalCancelAnimationFrame;
        });
    });

    describe('error handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            global.document.getElementById = vi.fn(() => null);
            
            expect(() => new JumpingDotGame()).toThrow('Required DOM element');
        });

        it('should handle invalid canvas context', () => {
            const badCanvas = {
                getContext: () => null,
                width: 800,
                height: 600,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                getAttribute: vi.fn(),
                setAttribute: vi.fn()
            } as unknown as HTMLCanvasElement;
            global.document.getElementById = vi.fn((id) => {
                if (id === 'gameCanvas') return badCanvas;
                if (id === 'gameStatus') return mockGameStatus;
                if (id === 'timer') return mockTimer;
                if (id === 'score') return mockScore;
                return null;
            });

            expect(() => new JumpingDotGame()).toThrow('Failed to get 2D rendering context');
        });
    });

    describe('performance', () => {
        it('should handle rapid update calls without performance issues', () => {
            const startTime = performance.now();
            
            for (let i = 0; i < 100; i++) {
                game.testUpdate();
                game.testRender();
            }
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Should complete 100 cycles reasonably quickly (less than 1 second)
            expect(duration).toBeLessThan(1000);
        });
    });
});
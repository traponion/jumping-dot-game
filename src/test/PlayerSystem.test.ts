import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameState } from '../stores/GameState.js';
import type { InputManager } from '../systems/InputManager.js';
import { PlayerSystem } from '../systems/PlayerSystem.js';
import type { PhysicsConstants } from '../types/GameTypes.js';

describe('PlayerSystem - Framework Integration', () => {
    let playerSystem: PlayerSystem;
    let gameState: GameState;
    let physics: PhysicsConstants;
    let mockInputManager: InputManager;

    beforeEach(() => {
        // Create fresh GameState instance for each test
        gameState = new GameState();

        // Set up test player state
        gameState.runtime.player = {
            x: 100,
            y: 400,
            vx: 2,
            vy: 5,
            radius: 3,
            grounded: false
        };

        physics = {
            gravity: 0.6,
            jumpForce: -12,
            autoJumpInterval: 150,
            moveSpeed: 4,
            gameSpeed: 2.0
        };

        // Create mock InputManager
        mockInputManager = {
            isPressed: vi.fn(),
            getMovementState: vi.fn().mockReturnValue({}),
            clearInputs: vi.fn(),
            handleKeyEvent: vi.fn(),
            lastInputTime: 0,
            inputCooldown: 100,
            inputs: new Map(),
            gameController: null,
            canvas: null
        } as unknown as InputManager;

        playerSystem = new PlayerSystem(gameState, mockInputManager);
    });

    describe('landing predictions', () => {
        it('should calculate future movement with left input when renderSystem available', () => {
            // Set up renderSystem and stage
            const mockRenderSystem = {
                setLandingPredictions: vi.fn()
            };
            playerSystem.setRenderSystem(mockRenderSystem as any);

            gameState.stage = {
                id: 1,
                name: 'Test Stage',
                platforms: [{ x1: 50, y1: 450, x2: 150, y2: 450 }],
                movingPlatforms: [],
                holes: [],
                spikes: [],
                goal: { x: 900, y: 400, width: 50, height: 50 },
                startText: { x: 0, y: 0, text: 'Start' },
                goalText: { x: 900, y: 400, text: 'Goal' },
                timeLimit: 10
            };

            // Mock left key press for landing prediction
            (mockInputManager.getMovementState as any).mockReturnValue({
                ArrowLeft: true,
                ArrowRight: false
            });

            playerSystem.update(16.67, physics);

            // Should have processed input for movement prediction
            expect(mockInputManager.getMovementState).toHaveBeenCalled();
            expect(mockRenderSystem.setLandingPredictions).toHaveBeenCalled();
        });

        it('should calculate future movement with right input when renderSystem available', () => {
            // Set up renderSystem and stage
            const mockRenderSystem = {
                setLandingPredictions: vi.fn()
            };
            playerSystem.setRenderSystem(mockRenderSystem as any);

            gameState.stage = {
                id: 1,
                name: 'Test Stage',
                platforms: [{ x1: 200, y1: 400, x2: 300, y2: 400 }],
                movingPlatforms: [],
                holes: [],
                spikes: [],
                goal: { x: 900, y: 400, width: 50, height: 50 },
                startText: { x: 0, y: 0, text: 'Start' },
                goalText: { x: 900, y: 400, text: 'Goal' },
                timeLimit: 10
            };

            // Mock right key press for landing prediction
            (mockInputManager.getMovementState as any).mockReturnValue({
                ArrowLeft: false,
                ArrowRight: true
            });

            playerSystem.update(16.67, physics);

            // Should have processed input for movement prediction
            expect(mockInputManager.getMovementState).toHaveBeenCalled();
            expect(mockRenderSystem.setLandingPredictions).toHaveBeenCalled();
        });

        it('should not call getMovementState when renderSystem not available', () => {
            // No renderSystem set up
            (mockInputManager.getMovementState as any).mockReturnValue({
                ArrowLeft: false,
                ArrowRight: false
            });

            playerSystem.update(16.67, physics);

            // Should not process landing predictions without renderSystem
            expect(mockInputManager.getMovementState).not.toHaveBeenCalled();
        });

        it('should handle platform finding with valid stage data', () => {
            // Set up stage with platforms
            gameState.stage = {
                id: 1,
                name: 'Test Stage',
                platforms: [
                    { x1: 50, y1: 450, x2: 150, y2: 450 },
                    { x1: 200, y1: 400, x2: 300, y2: 400 }
                ],
                movingPlatforms: [],
                holes: [],
                spikes: [],
                goal: { x: 900, y: 400, width: 50, height: 50 },
                startText: { x: 0, y: 0, text: 'Start' },
                goalText: { x: 900, y: 400, text: 'Goal' },
                timeLimit: 10
            };

            playerSystem.update(16.67, physics);

            // Should process without errors
            expect(gameState.stage.platforms).toHaveLength(2);
        });

        it('should handle missing stage data gracefully', () => {
            // Set stage to null
            gameState.stage = null;

            expect(() => {
                playerSystem.update(16.67, physics);
            }).not.toThrow();
        });
    });
});

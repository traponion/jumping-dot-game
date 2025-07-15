import { beforeEach, describe, expect, test } from 'vitest';
import type { FallingCeiling } from '../../../core/StageLoader';
import { GameState } from '../../../stores/GameState';
import { CollisionSystem } from '../../../systems/CollisionSystem';
import { DynamicElementSystem } from '../../../systems/DynamicElementSystem';

describe('FallingCeiling Implementation', () => {
    let gameState: GameState;
    let collisionSystem: CollisionSystem;
    let dynamicElementSystem: DynamicElementSystem;

    beforeEach(() => {
        // Create fresh game state with falling ceiling
        gameState = new GameState();
        gameState.stage = {
            id: 1,
            name: 'Test Stage',
            platforms: [],
            spikes: [],
            goal: { x: 500, y: 400, width: 50, height: 50 },
            startText: { x: 50, y: 50, text: 'Start', style: { fontSize: 16, color: 'white' } },
            goalText: { x: 500, y: 350, text: 'Goal', style: { fontSize: 16, color: 'white' } },
            fallingCeilings: [
                {
                    id: 'ceiling-1',
                    x: 100,
                    y: 200,
                    width: 200,
                    height: 20,
                    triggerX: 120,
                    triggerWidth: 160,
                    fallSpeed: 3,
                    stopY: 500,
                    activated: false
                }
            ]
        };

        // Initialize runtime state
        gameState.runtime.dynamicElements.fallingCeilings = [
            {
                id: 'ceiling-1',
                activated: false,
                currentY: 200,
                originalY: 200
            }
        ];

        collisionSystem = new CollisionSystem(gameState);
        dynamicElementSystem = new DynamicElementSystem(gameState);
    });

    describe('Trigger System', () => {
        test('should activate ceiling when player enters trigger zone', () => {
            // Arrange: Player in trigger zone
            gameState.runtime.player.x = 150; // Within triggerX (120) + triggerWidth (160)
            gameState.runtime.player.y = 400;

            // Act: Update dynamic elements
            dynamicElementSystem.update(16.67);

            // Assert: Ceiling activated
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            expect(ceilingState.activated).toBe(true);
        });

        test('should not activate ceiling when player outside trigger zone', () => {
            // Arrange: Player outside trigger zone
            gameState.runtime.player.x = 50; // Outside triggerX (120)
            gameState.runtime.player.y = 400;

            // Act: Update dynamic elements
            dynamicElementSystem.update(16.67);

            // Assert: Ceiling not activated
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            expect(ceilingState.activated).toBe(false);
        });

        test('should not reactivate already activated ceiling', () => {
            // Arrange: Already activated ceiling
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            ceilingState.currentY = 300; // Has fallen some distance

            gameState.runtime.player.x = 150; // In trigger zone
            gameState.runtime.player.y = 400;

            // Act: Update dynamic elements
            dynamicElementSystem.update(16.67);

            // Assert: Ceiling continues falling from current position
            expect(ceilingState.activated).toBe(true);
            expect(ceilingState.currentY).toBeGreaterThan(300);
        });
    });

    describe('Falling Physics', () => {
        test('should fall at specified speed when activated', () => {
            // Arrange: Activated ceiling
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            const initialY = ceilingState.currentY;
            const fallSpeed = 3;
            const deltaTime = 16.67;

            // Act: Update dynamic elements
            dynamicElementSystem.update(deltaTime);

            // Assert: Ceiling falls at correct speed
            const expectedY = initialY + (fallSpeed * deltaTime) / 16.67;
            expect(ceilingState.currentY).toBeCloseTo(expectedY, 2);
        });

        test('should stop falling when reaching stopY', () => {
            // Arrange: Ceiling very close to stopY
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            ceilingState.currentY = 498; // Close enough to reach stopY (500) in one frame

            // Act: Update dynamic elements
            dynamicElementSystem.update(16.67);

            // Assert: Ceiling stops at stopY
            expect(ceilingState.currentY).toBe(500);
        });

        test('should not fall when not activated', () => {
            // Arrange: Non-activated ceiling
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = false;
            const initialY = ceilingState.currentY;

            // Act: Update dynamic elements
            dynamicElementSystem.update(16.67);

            // Assert: Ceiling stays at original position
            expect(ceilingState.currentY).toBe(initialY);
        });
    });

    describe('Crush Detection', () => {
        test('should detect player crush when ceiling falls on player', () => {
            // Arrange: Falling ceiling approaching player
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            ceilingState.currentY = 380; // Above player

            gameState.runtime.player.x = 150; // Under ceiling
            gameState.runtime.player.y = 400;
            gameState.runtime.player.radius = 10;

            let deathTriggered = false;
            const deathHandler = () => {
                deathTriggered = true;
            };

            // Act: Update collision system
            collisionSystem.update(undefined, undefined, deathHandler);

            // Assert: Death triggered
            expect(deathTriggered).toBe(true);
        });

        test('should not detect crush when player outside ceiling area', () => {
            // Arrange: Falling ceiling not over player
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            ceilingState.currentY = 380;

            gameState.runtime.player.x = 50; // Outside ceiling area
            gameState.runtime.player.y = 400;

            let deathTriggered = false;
            const deathHandler = () => {
                deathTriggered = true;
            };

            // Act: Update collision system
            collisionSystem.update(undefined, undefined, deathHandler);

            // Assert: No death triggered
            expect(deathTriggered).toBe(false);
        });

        test('should not detect crush when ceiling has stopped falling', () => {
            // Arrange: Stopped ceiling
            const ceilingState = gameState.runtime.dynamicElements.fallingCeilings[0];
            ceilingState.activated = true;
            ceilingState.currentY = 500; // At stopY

            gameState.runtime.player.x = 150; // Under ceiling
            gameState.runtime.player.y = 520; // Below stopped ceiling

            let deathTriggered = false;
            const deathHandler = () => {
                deathTriggered = true;
            };

            // Act: Update collision system
            collisionSystem.update(undefined, undefined, deathHandler);

            // Assert: No death triggered (ceiling is stationary)
            expect(deathTriggered).toBe(false);
        });
    });

    describe('State Management', () => {
        test('should maintain ceiling state consistency', () => {
            // Arrange: Initial state
            const stageCeiling = gameState.stage!.fallingCeilings![0] as FallingCeiling;
            const runtimeCeiling = gameState.runtime.dynamicElements.fallingCeilings[0];

            expect(stageCeiling.id).toBe(runtimeCeiling.id);
            expect(stageCeiling.activated).toBe(runtimeCeiling.activated);
            expect(stageCeiling.y).toBe(runtimeCeiling.originalY);

            // Act: Activate and update
            gameState.runtime.player.x = 150;
            gameState.runtime.player.y = 400;
            dynamicElementSystem.update(16.67);

            // Assert: Runtime state updated
            expect(runtimeCeiling.activated).toBe(true);
            expect(runtimeCeiling.currentY).toBeGreaterThan(runtimeCeiling.originalY);
        });

        test('should handle multiple falling ceilings independently', () => {
            // Arrange: Two falling ceilings
            gameState.stage!.fallingCeilings!.push({
                id: 'ceiling-2',
                x: 400,
                y: 150,
                width: 100,
                height: 20,
                triggerX: 420,
                triggerWidth: 60,
                fallSpeed: 2,
                stopY: 450,
                activated: false
            });

            gameState.runtime.dynamicElements.fallingCeilings.push({
                id: 'ceiling-2',
                activated: false,
                currentY: 150,
                originalY: 150
            });

            // Act: Player triggers first ceiling only
            gameState.runtime.player.x = 150; // In ceiling-1 trigger zone
            gameState.runtime.player.y = 400;
            dynamicElementSystem.update(16.67);

            // Assert: Only first ceiling activated
            expect(gameState.runtime.dynamicElements.fallingCeilings[0].activated).toBe(true);
            expect(gameState.runtime.dynamicElements.fallingCeilings[1].activated).toBe(false);
        });
    });
});

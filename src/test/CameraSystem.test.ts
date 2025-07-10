/**
 * @fileoverview CameraSystem test suite
 * @module test/CameraSystem
 * @description Tests for camera positioning and updates
 */

import { beforeEach, describe, expect, it } from 'vitest';
import type { GameState } from '../stores/GameState.js';
import { CameraSystem } from '../systems/CameraSystem.js';

describe('CameraSystem', () => {
    let cameraSystem: CameraSystem;
    let mockGameState: GameState;
    let mockCanvas: { width: number; height: number };

    beforeEach(() => {
        // Mock canvas dimensions
        mockCanvas = {
            width: 800,
            height: 600
        };

        // Mock GameState with runtime data
        mockGameState = {
            runtime: {
                player: {
                    x: 100,
                    y: 200,
                    vx: 0,
                    vy: 0,
                    grounded: false,
                    radius: 10,
                    color: 'white'
                },
                camera: {
                    x: 0,
                    y: 0
                },
                deathMarks: []
            },
            gameRunning: false,
            gameOver: false,
            currentStage: 1,
            timeLimit: 10,
            timeRemaining: 10,
            gameStartTime: null,

            stage: null,
            hasMovedOnce: false,
            performance: { fps: 60, deltaTime: 16.67 },
            reset: () => {}
        } as unknown as GameState;

        cameraSystem = new CameraSystem(mockGameState, mockCanvas);
    });

    describe('constructor', () => {
        it('should initialize with GameState and canvas dependencies', () => {
            expect(cameraSystem).toBeDefined();
        });

        it('should accept canvas dimensions for camera calculations', () => {
            const canvas = { width: 1024, height: 768 };
            const system = new CameraSystem(mockGameState, canvas);
            expect(system).toBeDefined();
        });
    });

    describe('update', () => {
        it('should center camera on player position', () => {
            // Arrange: Player at specific position
            mockGameState.runtime.player.x = 400;
            mockGameState.runtime.camera.x = 0; // Initial camera position

            // Act: Update camera
            cameraSystem.update();

            // Assert: Camera should be centered on player
            const expectedCameraX = 400 - mockCanvas.width / 2; // 400 - 400 = 0
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });

        it('should update camera when player moves right', () => {
            // Arrange: Player moves to the right
            mockGameState.runtime.player.x = 800;
            mockGameState.runtime.camera.x = 0;

            // Act: Update camera
            cameraSystem.update();

            // Assert: Camera follows player
            const expectedCameraX = 800 - mockCanvas.width / 2; // 800 - 400 = 400
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });

        it('should update camera when player moves left', () => {
            // Arrange: Player moves to the left
            mockGameState.runtime.player.x = -200;
            mockGameState.runtime.camera.x = 0;

            // Act: Update camera
            cameraSystem.update();

            // Assert: Camera follows player
            const expectedCameraX = -200 - mockCanvas.width / 2; // -200 - 400 = -600
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });

        it('should work with different canvas widths', () => {
            // Arrange: Different canvas size
            const wideCanvas = { width: 1200, height: 600 };
            const system = new CameraSystem(mockGameState, wideCanvas);
            mockGameState.runtime.player.x = 600;
            mockGameState.runtime.camera.x = 0;

            // Act: Update camera
            system.update();

            // Assert: Camera calculation uses correct canvas width
            const expectedCameraX = 600 - wideCanvas.width / 2; // 600 - 600 = 0
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });

        it('should directly mutate GameState without returning values', () => {
            // Arrange: Initial state
            const initialCameraX = mockGameState.runtime.camera.x;
            mockGameState.runtime.player.x = 500;

            // Act: Update camera
            const result = cameraSystem.update();

            // Assert: No return value (autonomous pattern)
            expect(result).toBeUndefined();
            // Assert: GameState was directly mutated
            expect(mockGameState.runtime.camera.x).not.toBe(initialCameraX);
        });

        it('should handle zero player position correctly', () => {
            // Arrange: Player at origin
            mockGameState.runtime.player.x = 0;
            mockGameState.runtime.camera.x = 100; // Non-zero initial state

            // Act: Update camera
            cameraSystem.update();

            // Assert: Camera positioned correctly for origin
            const expectedCameraX = 0 - mockCanvas.width / 2; // 0 - 400 = -400
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });

        it('should handle large player positions', () => {
            // Arrange: Player far to the right
            mockGameState.runtime.player.x = 10000;
            mockGameState.runtime.camera.x = 0;

            // Act: Update camera
            cameraSystem.update();

            // Assert: Camera follows without issues
            const expectedCameraX = 10000 - mockCanvas.width / 2; // 10000 - 400 = 9600
            expect(mockGameState.runtime.camera.x).toBe(expectedCameraX);
        });
    });

    describe('integration with GameState', () => {
        it('should work with real GameState structure', () => {
            // Arrange: More realistic GameState
            const gameState = {
                runtime: {
                    player: {
                        x: 300,
                        y: 150,
                        vx: 5,
                        vy: -2,
                        grounded: true,
                        radius: 12,
                        color: 'blue'
                    },
                    camera: {
                        x: 50,
                        y: 0
                    },
                    deathMarks: []
                },
                gameRunning: true,
                gameOver: false,
                currentStage: 1,
                timeLimit: 10,
                timeRemaining: 10,
                gameStartTime: null,

                stage: null,
                hasMovedOnce: false,
                performance: { fps: 60, deltaTime: 16.67 },
                reset: () => {}
            } as unknown as GameState;

            const system = new CameraSystem(gameState, mockCanvas);

            // Act: Update camera
            system.update();

            // Assert: Camera updated correctly
            const expectedCameraX = 300 - mockCanvas.width / 2;
            expect(gameState.runtime.camera.x).toBe(expectedCameraX);
        });
    });

    describe('edge cases', () => {
        it('should work with minimal valid GameState', () => {
            // Arrange: Minimal but valid GameState
            const minimalGameState = {
                runtime: {
                    player: {
                        x: 0,
                        y: 0,
                        vx: 0,
                        vy: 0,
                        grounded: false,
                        radius: 10,
                        color: 'white'
                    },
                    camera: { x: 0, y: 0 },
                    deathMarks: []
                },
                gameRunning: false,
                gameOver: false,
                currentStage: 1,
                timeLimit: 10,
                timeRemaining: 10,
                gameStartTime: null,

                stage: null,
                hasMovedOnce: false,
                performance: { fps: 60, deltaTime: 16.67 },
                reset: () => {}
            } as unknown as GameState;

            const system = new CameraSystem(minimalGameState, mockCanvas);

            // Act: Update should work without issues
            system.update();

            // Assert: Camera positioned correctly
            const expectedCameraX = 0 - mockCanvas.width / 2;
            expect(minimalGameState.runtime.camera.x).toBe(expectedCameraX);
        });
    });
});

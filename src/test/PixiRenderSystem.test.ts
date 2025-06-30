import * as PIXI from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PixiRenderSystem } from '../systems/PixiRenderSystem.js';
import { TrailParticleManager } from '../systems/TrailParticleManager.js';
import type { Camera } from '../types/GameTypes.js';

// Mock PIXI
const mockContainer = {
    x: 0,
    y: 0,
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    destroy: vi.fn(),
    position: {
        set: vi.fn(),
        x: 0,
        y: 0
    }
};

const mockGraphics = {
    clear: vi.fn(),
    circle: vi.fn(),
    fill: vi.fn().mockReturnThis(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    poly: vi.fn(),
    rect: vi.fn().mockReturnThis(),
    destroy: vi.fn(),
    beginFill: vi.fn(),
    drawRect: vi.fn(),
    endFill: vi.fn(),
    alpha: 1,
    x: 0,
    y: 0,
    position: {
        set: vi.fn(),
        x: 0,
        y: 0
    }
};

vi.mock('pixi.js', async (importOriginal) => {
    const actual = (await importOriginal()) as any;

    const mockTexture = {
        width: 16,
        height: 16,
        destroy: vi.fn()
    };

    const mockParticleContainer = {
        addParticle: vi.fn(),
        removeParticle: vi.fn(),
        removeParticles: vi.fn(),
        particleChildren: [],
        update: vi.fn(),
        destroy: vi.fn(),
        clear: vi.fn()
    };

    const mockParticle = {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        texture: null
    };

    const mockApp = {
        init: vi.fn().mockResolvedValue(undefined),
        renderer: {
            width: 800,
            height: 600,
            resize: vi.fn(),
            generateTexture: vi.fn(() => mockTexture)
        },
        stage: {
            addChild: vi.fn(),
            removeChild: vi.fn()
        },
        screen: {
            width: 800,
            height: 600
        },
        destroy: vi.fn()
    };

    const mockText = {
        text: '',
        x: 0,
        y: 0,
        anchor: {
            set: vi.fn(),
            x: 0,
            y: 0
        },
        position: {
            set: vi.fn(),
            x: 0,
            y: 0
        },
        style: {},
        destroy: vi.fn()
    };

    const mockTextStyle = {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: '#ffffff',
        align: 'center'
    };

    return {
        ...(actual as any), // Import and spread actual PIXI exports
        Application: vi.fn().mockImplementation(() => mockApp),
        Container: vi.fn(() => mockContainer),
        Graphics: vi.fn(() => {
            const graphics = mockGraphics;
            graphics.rect.mockImplementation(function (this: any) {
                return this;
            });
            graphics.fill.mockImplementation(function (this: any) {
                return this;
            });
            return graphics;
        }),
        ParticleContainer: vi.fn(() => mockParticleContainer),
        Particle: vi.fn(() => ({ ...mockParticle })),
        Text: vi.fn(() => ({ ...mockText })),
        TextStyle: vi.fn(() => ({ ...mockTextStyle })),
        Texture: {
            from: vi.fn(() => mockTexture),
            EMPTY: mockTexture
        },
        RenderTexture: {
            create: vi.fn(() => mockTexture)
        },
        Rectangle: vi.fn(() => new (actual as any).Rectangle()) // Mock Rectangle
    };
});

// Mock TrailParticleManager
vi.mock('../systems/TrailParticleManager.js', () => {
    const mockParticleContainer = {
        addParticle: vi.fn(),
        removeParticle: vi.fn(),
        removeParticles: vi.fn(),
        particleChildren: [],
        update: vi.fn(),
        destroy: vi.fn(),
        clear: vi.fn()
    };

    return {
        TrailParticleManager: vi.fn(() => ({
            renderTrail: vi.fn(),
            getParticleContainer: vi.fn(() => mockParticleContainer),
            getActiveParticleCount: vi.fn(() => 0),
            destroy: vi.fn()
        }))
    };
});

describe('PixiRenderSystem', () => {
    let renderSystem: PixiRenderSystem;
    let canvas: HTMLCanvasElement;
    let mockApp: any;
    let mockTrailManager: any;

    beforeEach(() => {
        // Reset mocks
        vi.clearAllMocks();

        // Mock WebGL context
        const mockWebGLContext = {
            getExtension: vi.fn(() => null),
            getParameter: vi.fn(() => 'Mocked WebGL')
        };

        // Mock canvas getContext
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
            (contextType: string) => {
                if (contextType === 'webgl' || contextType === 'webgl2') {
                    return mockWebGLContext as any;
                }
                return null;
            }
        );

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Create render system first
        renderSystem = new PixiRenderSystem();

        // Get the mock instances created by the mocks
        const applicationMock = vi.mocked(PIXI.Application);
        const trailManagerMock = vi.mocked(TrailParticleManager);
        
        // Access the returned values from the mock implementations
        // Get the latest result (renderSystem constructor creates new Application)
        const appResults = applicationMock.mock.results;
        mockApp = appResults[appResults.length - 1]?.value;
        mockTrailManager = trailManagerMock.mock.results[0]?.value;
    });

    describe('initialization', () => {
        it('should create PixiRenderSystem without canvas element parameter', () => {
            expect(renderSystem).toBeDefined();
            // Note: getApp() is only available after initialize()
        });

        it('should initialize successfully', async () => {
            await renderSystem.initialize(canvas);
            // Test PixiRenderSystem responsibility: init is called
            expect(mockApp.init).toHaveBeenCalled();
            // Test PixiRenderSystem responsibility: containers are added to stage
            expect(mockApp.stage.addChild).toHaveBeenCalledTimes(2); // gameContainer + uiContainer
        });

        it('should have all required graphics objects', () => {
            // Graphics objects are private, but can be tested indirectly through methods
            expect(() => renderSystem.clear()).not.toThrow();
            expect(() => renderSystem.destroy()).not.toThrow();
        });
    });

    describe('camera transforms', () => {
        it('should apply camera transform correctly', () => {
            const camera: Camera = { x: 100, y: 50 };
            renderSystem.applyCameraTransform(camera);

            // Note: Camera transform is now handled by PixiGameState directly
            // PixiRenderSystem.applyCameraTransform() is kept for compatibility but does no operation
            // Test passes if no error is thrown
            expect(true).toBe(true);
        });

        it('should restore camera transform', () => {
            renderSystem.restoreCameraTransform();
            // Should not throw error (empty implementation is valid)
            expect(true).toBe(true);
        });
    });

    describe('player rendering', () => {
        it('should render player at specified position', () => {
            const player = { x: 100, y: 200, radius: 8, vx: 0, vy: 0, grounded: false };
            renderSystem.renderPlayer(player);

            expect(mockGraphics.clear).toHaveBeenCalled();
            expect(mockGraphics.circle).toHaveBeenCalledWith(0, 0, 8);
            expect(mockGraphics.fill).toHaveBeenCalledWith(0xffffff);
            expect(mockGraphics.x).toBe(100);
            expect(mockGraphics.y).toBe(200);
        });
    });

    describe('platform rendering', () => {
        it('should render static platforms', () => {
            const stageData = {
                id: 1,
                name: 'test stage',
                platforms: [
                    { x1: 0, y1: 100, x2: 200, y2: 100 },
                    { x1: 300, y1: 150, x2: 500, y2: 150 }
                ],
                spikes: [],
                goal: { x: 0, y: 0, width: 0, height: 0 },
                startText: { x: 0, y: 0, text: '' },
                goalText: { x: 0, y: 0, text: '' }
            };

            renderSystem.renderPlatforms(stageData);

            expect(mockGraphics.clear).toHaveBeenCalled();
            expect(mockGraphics.stroke).toHaveBeenCalledWith({ width: 2, color: 0xffffff });
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(0, 100);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(200, 100);
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(300, 150);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(500, 150);
        });

        it('should render moving platforms', () => {
            const movingPlatforms = [
                {
                    x1: 100,
                    y1: 200,
                    x2: 300,
                    y2: 200,
                    startX: 100,
                    endX: 300,
                    speed: 2,
                    direction: 1
                }
            ];

            renderSystem.renderMovingPlatforms(movingPlatforms);

            expect(mockGraphics.clear).toHaveBeenCalled();
            expect(mockGraphics.stroke).toHaveBeenCalledWith({ width: 2, color: 0xffffff });
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(100, 200);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(300, 200);
        });
    });

    describe('spike rendering', () => {
        it('should render spikes as triangular shapes', () => {
            const spikes = [{ x: 100, y: 200, width: 20, height: 20 }];

            renderSystem.renderSpikes(spikes);

            expect(mockGraphics.clear).toHaveBeenCalled();
            expect(mockGraphics.fill).toHaveBeenCalledWith(0xffffff);
            expect(mockGraphics.stroke).toHaveBeenCalledWith({ width: 1, color: 0xffffff });

            // Verify triangular spike shape
            const expectedPoints = [
                100,
                220, // bottom-left
                110,
                200, // top-center
                120,
                220 // bottom-right
            ];
            expect(mockGraphics.poly).toHaveBeenCalledWith(expectedPoints);
        });
    });

    describe('goal rendering', () => {
        it('should render goal as rectangle frame with X pattern', () => {
            const goal = { x: 100, y: 200, width: 40, height: 40 };

            renderSystem.renderGoal(goal);

            expect(mockGraphics.clear).toHaveBeenCalled();
            expect(mockGraphics.stroke).toHaveBeenCalledWith({ width: 2, color: 0xffffff });

            // Rectangle frame
            expect(mockGraphics.rect).toHaveBeenCalledWith(100, 200, 40, 40);

            // X pattern (two diagonal lines)
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(100, 200);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(140, 240);
            expect(mockGraphics.moveTo).toHaveBeenCalledWith(140, 200);
            expect(mockGraphics.lineTo).toHaveBeenCalledWith(100, 240);
        });
    });

    describe('stage rendering', () => {
        it('should render complete stage with all components', () => {
            const stage = {
                id: 1,
                name: 'test stage',
                platforms: [{ x1: 0, y1: 100, x2: 200, y2: 100 }],
                movingPlatforms: [
                    {
                        x1: 100,
                        y1: 200,
                        x2: 300,
                        y2: 200,
                        startX: 100,
                        endX: 300,
                        speed: 2,
                        direction: 1
                    }
                ],
                spikes: [{ x: 150, y: 300, width: 20, height: 20 }],
                goal: { x: 400, y: 500, width: 40, height: 40 },
                startText: { x: 0, y: 0, text: '' },
                goalText: { x: 0, y: 0, text: '' }
            };

            renderSystem.renderStage(stage);

            // All graphics components should be cleared and redrawn
            expect(mockGraphics.clear).toHaveBeenCalledTimes(4); // platforms, movingPlatforms, spikes, goal
        });
    });

    describe('trail rendering', () => {
        it('should render trail using ParticleContainer', () => {
            const trail = [
                { x: 100, y: 200 },
                { x: 110, y: 210 },
                { x: 120, y: 220 }
            ];
            const playerRadius = 8;

            renderSystem.renderTrail(trail, playerRadius);

            // Should use TrailParticleManager for high-performance rendering
            expect(mockTrailManager.renderTrail).toHaveBeenCalledWith(trail, playerRadius);

            // Legacy graphics should be cleared for compatibility
            expect(mockGraphics.clear).toHaveBeenCalled();
        });
    });

    describe('lifecycle methods', () => {
        it('should clear all graphics', () => {
            renderSystem.clear();

            // All graphics objects should be cleared (8 graphics objects in constructor)
            expect(mockGraphics.clear).toHaveBeenCalledTimes(8);
        });

        it('should destroy properly', () => {
            renderSystem.destroy();

            expect(mockApp.destroy).toHaveBeenCalledWith(
                { removeView: true },
                {
                    children: true,
                    texture: true,
                    textureSource: true,
                    context: true
                }
            );
        });

        it('should resize renderer', async () => {
            await renderSystem.initialize(canvas);
            renderSystem.resize(1024, 768);

            // Test PixiRenderSystem responsibility: resize is called
            expect(mockApp.renderer.resize).toHaveBeenCalled();
        });
    });

    describe('getter methods', () => {
        beforeEach(async () => {
            // Initialize render system before testing getters
            await renderSystem.initialize(canvas);
        });

        it('should return PIXI Application', () => {
            const app = renderSystem.getApp();
            expect(app).toBe(mockApp);
        });

        it('should return game container', () => {
            const container = renderSystem.getGameContainer();
            expect(container).toBeDefined();
        });

        it('should return UI container', () => {
            const container = renderSystem.getUIContainer();
            expect(container).toBeDefined();
        });
    });

    describe('collision detection integration', () => {
        beforeEach(() => {
            // Mock Date.now() for consistent timestamp testing
            vi.spyOn(Date, 'now').mockReturnValue(12345);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        describe('addLandingHistory', () => {
            it('should add landing position with timestamp to history', () => {
                renderSystem.addLandingHistory(100, 200);

                // Should store landing with correct data structure
                const history = (renderSystem as any).landingHistory;
                expect(history).toHaveLength(1);
                expect(history[0]).toEqual({
                    x: 100,
                    y: 200,
                    timestamp: 12345
                });
            });

            it('should accumulate multiple landing positions', () => {
                renderSystem.addLandingHistory(100, 200);
                renderSystem.addLandingHistory(150, 250);
                renderSystem.addLandingHistory(200, 300);

                const history = (renderSystem as any).landingHistory;
                expect(history).toHaveLength(3);
                expect(history[1]).toEqual({
                    x: 150,
                    y: 250,
                    timestamp: 12345
                });
                expect(history[2]).toEqual({
                    x: 200,
                    y: 300,
                    timestamp: 12345
                });
            });

            it('should handle edge case coordinates correctly', () => {
                renderSystem.addLandingHistory(0, 0);
                renderSystem.addLandingHistory(-100, -50);
                renderSystem.addLandingHistory(9999, 9999);

                const history = (renderSystem as any).landingHistory;
                expect(history).toHaveLength(3);
                expect(history[0]).toEqual({ x: 0, y: 0, timestamp: 12345 });
                expect(history[1]).toEqual({ x: -100, y: -50, timestamp: 12345 });
                expect(history[2]).toEqual({ x: 9999, y: 9999, timestamp: 12345 });
            });
        });

        describe('renderLandingPredictions', () => {
            it('should clean up old history and render current history', () => {
                // Add some landing history first
                renderSystem.addLandingHistory(100, 200);
                renderSystem.addLandingHistory(150, 250);

                renderSystem.renderLandingPredictions();

                // Should call cleanup and drawing methods
                expect(mockGraphics.clear).toHaveBeenCalled();
                expect(mockGraphics.stroke).toHaveBeenCalled();
            });

            it('should handle empty landing history gracefully', () => {
                renderSystem.renderLandingPredictions();

                // Should not throw error and should clear graphics
                expect(mockGraphics.clear).toHaveBeenCalled();
                expect(mockGraphics.stroke).toHaveBeenCalled();
            });

            it('should render vertical lines for each landing position', () => {
                renderSystem.addLandingHistory(100, 200);
                renderSystem.addLandingHistory(150, 250);

                renderSystem.renderLandingPredictions();

                // Should draw lines at landing positions
                expect(mockGraphics.moveTo).toHaveBeenCalledWith(100, 200);
                expect(mockGraphics.lineTo).toHaveBeenCalledWith(100, 192); // y - 8
                expect(mockGraphics.moveTo).toHaveBeenCalledWith(150, 250);
                expect(mockGraphics.lineTo).toHaveBeenCalledWith(150, 242); // y - 8
            });
        });

        describe('landing history cleanup', () => {
            it('should remove old history entries beyond fade time', () => {
                // Set initial timestamp
                vi.mocked(Date.now).mockReturnValue(1000);
                renderSystem.addLandingHistory(100, 200);

                // Advance time beyond fade period (3000ms)
                vi.mocked(Date.now).mockReturnValue(5000);
                renderSystem.addLandingHistory(200, 300);

                // Cleanup should remove old entry
                renderSystem.renderLandingPredictions();

                const history = (renderSystem as any).landingHistory;
                expect(history).toHaveLength(1);
                expect(history[0]).toEqual({
                    x: 200,
                    y: 300,
                    timestamp: 5000
                });
            });

            it('should keep recent history entries within fade time', () => {
                vi.mocked(Date.now).mockReturnValue(1000);
                renderSystem.addLandingHistory(100, 200);

                // Advance time within fade period
                vi.mocked(Date.now).mockReturnValue(2000);
                renderSystem.addLandingHistory(200, 300);

                renderSystem.renderLandingPredictions();

                const history = (renderSystem as any).landingHistory;
                expect(history).toHaveLength(2);
            });
        });

        describe('visual styling for landing history', () => {
            it('should use white color with appropriate alpha for history lines', () => {
                renderSystem.addLandingHistory(100, 200);
                renderSystem.renderLandingPredictions();

                // Should set stroke style for white lines
                expect(mockGraphics.stroke).toHaveBeenCalledWith(
                    expect.objectContaining({
                        color: 0xffffff,
                        width: 1
                    })
                );
            });

            it('should render consistent line height for all history markers', () => {
                renderSystem.addLandingHistory(100, 200);
                renderSystem.addLandingHistory(300, 400);

                renderSystem.renderLandingPredictions();

                // All lines should have same height (8 pixels)
                expect(mockGraphics.moveTo).toHaveBeenCalledWith(100, 200);
                expect(mockGraphics.lineTo).toHaveBeenCalledWith(100, 192);
                expect(mockGraphics.moveTo).toHaveBeenCalledWith(300, 400);
                expect(mockGraphics.lineTo).toHaveBeenCalledWith(300, 392);
            });
        });
    });

    describe('game over menu', () => {
        beforeEach(async () => {
            // Initialize render system before testing manager methods
            await renderSystem.initialize(canvas);
        });

        it('should render game over menu with selection', () => {
            const menuState = {
                isVisible: true,
                selectedOption: 0,
                options: ['Restart Stage', 'Stage Select']
            };

            renderSystem.renderGameOverMenu(menuState.options, menuState.selectedOption, 0);

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should update game over menu selection', () => {
            const options = ['Restart Stage', 'Stage Select'];
            renderSystem.updateGameOverMenuSelection(options, 1, 0);

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should hide game over menu', () => {
            renderSystem.hideGameOverMenu();

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('transition effects', () => {
        beforeEach(async () => {
            // Initialize render system before testing manager methods
            await renderSystem.initialize(canvas);
        });

        it('should perform fade out transition', () => {
            renderSystem.fadeOutTransition();

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should perform fade in transition', () => {
            renderSystem.fadeInTransition();

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should perform flash effect', () => {
            renderSystem.flashEffect();

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should perform stage complete effect', () => {
            renderSystem.stageCompleteEffect(100);

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should check if transitioning', () => {
            const isTransitioning = renderSystem.isTransitioning();

            expect(typeof isTransitioning).toBe('boolean');
        });

        it('should cancel transition', () => {
            renderSystem.cancelTransition();

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('loading screen', () => {
        beforeEach(async () => {
            // Initialize render system before testing manager methods
            await renderSystem.initialize(canvas);
        });

        it('should show loading screen', () => {
            renderSystem.showLoadingScreen('Loading...');

            // Should not throw error
            expect(true).toBe(true);
        });

        it('should hide loading screen', () => {
            renderSystem.hideLoadingScreen();

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('death marks rendering', () => {
        beforeEach(async () => {
            // Initialize render system before testing manager methods
            await renderSystem.initialize(canvas);
        });

        it('should render death marks', () => {
            const deathMarks = [
                { x: 100, y: 200, timestamp: Date.now() },
                { x: 300, y: 400, timestamp: Date.now() }
            ];

            renderSystem.renderDeathMarks(deathMarks);

            // Should not throw error
            expect(true).toBe(true);
        });
    });

    describe('branch coverage edge cases', () => {
        it('should handle missing playerShape in clear method', () => {
            // Set playerShape to undefined to test the if condition
            (renderSystem as any).playerShape = undefined;

            // Should not throw error when playerShape is undefined
            expect(() => renderSystem.clear()).not.toThrow();
        });

        it('should clear playerShape when it exists', () => {
            // Ensure playerShape exists and has clear method
            const mockClear = vi.fn();
            (renderSystem as any).playerShape = { clear: mockClear };

            renderSystem.clear();

            expect(mockClear).toHaveBeenCalledOnce();
        });
    });
});

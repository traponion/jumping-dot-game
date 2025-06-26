import * as PIXI from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PixiRenderSystem } from '../systems/PixiRenderSystem.js';
import { TrailParticleManager } from '../systems/TrailParticleManager.js';
import type { Camera } from '../types/GameTypes.js';

// Mock PIXI
const mockContainer = {
    x: 0,
    y: 0,
    addChild: vi.fn(),
    removeChild: vi.fn(),
    destroy: vi.fn()
};

const mockGraphics = {
    clear: vi.fn(),
    circle: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    poly: vi.fn(),
    rect: vi.fn(),
    destroy: vi.fn(),
    x: 0,
    y: 0
};

vi.mock('pixi.js', () => {
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
        destroy: vi.fn()
    };

    return {
        Application: vi.fn(() => mockApp),
        Container: vi.fn(() => mockContainer),
        Graphics: vi.fn(() => mockGraphics),
        ParticleContainer: vi.fn(() => mockParticleContainer),
        Particle: vi.fn(() => ({ ...mockParticle })),
        Texture: {
            from: vi.fn(() => mockTexture),
            EMPTY: mockTexture
        },
        RenderTexture: {
            create: vi.fn(() => mockTexture)
        }
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

        // Create canvas
        canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;

        // Create render system (no canvas parameter)
        renderSystem = new PixiRenderSystem();

        // Get mocked instances after creation
        mockApp = vi.mocked(PIXI.Application).mock.results[0].value;
        mockTrailManager = vi.mocked(TrailParticleManager).mock.results[0].value;
    });

    describe('initialization', () => {
        it('should create PixiRenderSystem without canvas element parameter', () => {
            expect(renderSystem).toBeDefined();
            expect(renderSystem.getApp()).toBeDefined();
        });

        it('should initialize successfully', async () => {
            await renderSystem.initialize(canvas);
            expect(mockApp.init).toHaveBeenCalledWith({
                canvas: canvas,
                width: 800,
                height: 600,
                backgroundColor: 0x000000,
                antialias: false,
                resolution: 1,
                autoDensity: false
            });
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

            // Camera transform affects gameContainer position
            const gameContainer = renderSystem.getGameContainer();
            expect(gameContainer.x).toBe(-100 + 400); // -camera.x + centerX
            expect(gameContainer.y).toBe(-50 + 300); // -camera.y + centerY
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

            // All graphics objects should be cleared (7 graphics objects in constructor)
            expect(mockGraphics.clear).toHaveBeenCalledTimes(7);
        });

        it('should destroy properly', () => {
            renderSystem.destroy();

            expect(mockApp.destroy).toHaveBeenCalledWith(true, { children: true, texture: true });
        });

        it('should resize renderer', () => {
            renderSystem.resize(1024, 768);

            expect(mockApp.renderer.resize).toHaveBeenCalledWith(1024, 768);
        });
    });

    describe('getter methods', () => {
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
});

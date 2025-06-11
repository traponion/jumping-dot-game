import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RenderSystem } from '../systems/RenderSystem.js';
import { Player, Camera, TrailPoint, DeathMark } from '../types/GameTypes.js';
import { StageData } from '../core/StageLoader.js';

describe('RenderSystem', () => {
    let renderSystem: RenderSystem;
    let mockCanvas: HTMLCanvasElement;
    let mockCtx: CanvasRenderingContext2D;
    let player: Player;
    let camera: Camera;

    beforeEach(() => {
        // Mock canvas and context
        mockCanvas = {
            width: 800,
            height: 600,
            getContext: vi.fn()
        } as any;

        mockCtx = {
            fillStyle: '',
            strokeStyle: '',
            lineWidth: 0,
            font: '',
            textAlign: '',
            fillRect: vi.fn(),
            strokeRect: vi.fn(),
            beginPath: vi.fn(),
            arc: vi.fn(),
            fill: vi.fn(),
            stroke: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            closePath: vi.fn(),
            fillText: vi.fn(),
            save: vi.fn(),
            restore: vi.fn(),
            translate: vi.fn()
        } as any;

        mockCanvas.getContext = vi.fn().mockReturnValue(mockCtx);
        
        renderSystem = new RenderSystem(mockCanvas);
        
        player = {
            x: 100,
            y: 400,
            vx: 0,
            vy: 0,
            radius: 3,
            grounded: false
        };

        camera = { x: 0, y: 0 };
    });

    describe('canvas setup', () => {
        it('should initialize with canvas and context', () => {
            expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
        });

        it('should clear canvas with black background', () => {
            renderSystem.clearCanvas();
            
            expect(mockCtx.fillStyle).toBe('black');
            expect(mockCtx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
        });
    });

    describe('player rendering', () => {
        it('should render player as white circle', () => {
            renderSystem.renderPlayer(player);
            
            expect(mockCtx.fillStyle).toBe('white');
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.arc).toHaveBeenCalledWith(100, 400, 3, 0, Math.PI * 2);
            expect(mockCtx.fill).toHaveBeenCalled();
        });
    });

    describe('trail rendering', () => {
        it('should render trail with fading effect', () => {
            const trail: TrailPoint[] = [
                { x: 90, y: 400 },
                { x: 95, y: 400 },
                { x: 100, y: 400 }
            ];
            
            renderSystem.renderTrail(trail, player.radius);
            
            expect(mockCtx.beginPath).toHaveBeenCalledTimes(3);
            expect(mockCtx.arc).toHaveBeenCalledTimes(3);
            expect(mockCtx.fill).toHaveBeenCalledTimes(3);
        });

        it('should render trail with increasing alpha', () => {
            const trail: TrailPoint[] = [
                { x: 90, y: 400 },
                { x: 95, y: 400 }
            ];
            
            renderSystem.renderTrail(trail, player.radius);
            
            // Should set different alpha values for each trail point
            expect(mockCtx.fillStyle).toContain('rgba(255, 255, 255,');
        });
    });

    describe('stage rendering', () => {
        it('should render platforms as white lines', () => {
            const stage: StageData = {
                id: 1,
                name: 'Test',
                platforms: [
                    { x1: 0, y1: 500, x2: 100, y2: 500 }
                ],
                spikes: [],
                goal: { x: 200, y: 400, width: 20, height: 30 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 210, y: 390, text: 'GOAL' }
            };
            
            renderSystem.renderStage(stage);
            
            expect(mockCtx.strokeStyle).toBe('white');
            expect(mockCtx.lineWidth).toBe(2);
            expect(mockCtx.moveTo).toHaveBeenCalledWith(0, 500);
            expect(mockCtx.lineTo).toHaveBeenCalledWith(100, 500);
            expect(mockCtx.stroke).toHaveBeenCalled();
        });

        it('should render spikes as triangular shapes', () => {
            const stage: StageData = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: [
                    { x: 100, y: 480, width: 15, height: 15 }
                ],
                goal: { x: 200, y: 400, width: 20, height: 30 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 210, y: 390, text: 'GOAL' }
            };
            
            renderSystem.renderStage(stage);
            
            expect(mockCtx.fillStyle).toBe('white');
            expect(mockCtx.beginPath).toHaveBeenCalled();
            expect(mockCtx.moveTo).toHaveBeenCalledWith(100, 495); // spike base
            expect(mockCtx.lineTo).toHaveBeenCalledWith(107.5, 480); // spike tip
            expect(mockCtx.lineTo).toHaveBeenCalledWith(115, 495); // spike base
            expect(mockCtx.fill).toHaveBeenCalled();
        });

        it('should render goal as rectangular flag with pattern', () => {
            const stage: StageData = {
                id: 1,
                name: 'Test',
                platforms: [],
                spikes: [],
                goal: { x: 200, y: 400, width: 20, height: 30 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 210, y: 390, text: 'GOAL' }
            };
            
            renderSystem.renderStage(stage);
            
            expect(mockCtx.strokeRect).toHaveBeenCalledWith(200, 400, 20, 30);
            // Check diagonal pattern lines
            expect(mockCtx.moveTo).toHaveBeenCalledWith(200, 400);
            expect(mockCtx.lineTo).toHaveBeenCalledWith(220, 430);
        });
    });

    describe('death marks rendering', () => {
        it('should render death marks as red X symbols', () => {
            const deathMarks: DeathMark[] = [
                { x: 100, y: 200, timestamp: 1000 }
            ];
            
            renderSystem.renderDeathMarks(deathMarks);
            
            expect(mockCtx.strokeStyle).toBe('rgba(255, 0, 0, 0.8)');
            // Note: lineWidth is reset to 2 at the end of renderDeathMarks
            
            // Check X pattern
            expect(mockCtx.moveTo).toHaveBeenCalledWith(92, 192); // top-left
            expect(mockCtx.lineTo).toHaveBeenCalledWith(108, 208); // bottom-right
            expect(mockCtx.moveTo).toHaveBeenCalledWith(108, 192); // top-right
            expect(mockCtx.lineTo).toHaveBeenCalledWith(92, 208); // bottom-left
        });
    });

    describe('UI rendering', () => {
        it('should render start instruction', () => {
            renderSystem.renderStartInstruction();
            
            expect(mockCtx.fillStyle).toBe('white');
            expect(mockCtx.font).toBe('24px monospace');
            expect(mockCtx.textAlign).toBe('center');
            expect(mockCtx.fillText).toHaveBeenCalledWith('Press SPACE to Start', 400, 300);
        });

        it('should render game over message', () => {
            renderSystem.renderGameOver();
            
            expect(mockCtx.fillStyle).toBe('white');
            expect(mockCtx.font).toBe('24px monospace');
            expect(mockCtx.textAlign).toBe('center');
            expect(mockCtx.fillText).toHaveBeenCalledWith('Game Over - Press R to restart', 400, 300);
        });

        it('should render credits', () => {
            renderSystem.renderCredits();
            
            expect(mockCtx.fillStyle).toBe('rgba(255, 255, 255, 0.6)');
            expect(mockCtx.font).toBe('12px monospace');
            expect(mockCtx.fillText).toHaveBeenCalledWith('Made by traponion', 400, 570);
            expect(mockCtx.fillText).toHaveBeenCalledWith('github.com/traponion/jumping-dot-game', 400, 585);
        });
    });

    describe('camera transform', () => {
        it('should apply camera transform', () => {
            camera.x = 100;
            camera.y = 50;
            
            renderSystem.applyCameraTransform(camera);
            
            expect(mockCtx.save).toHaveBeenCalled();
            expect(mockCtx.translate).toHaveBeenCalledWith(-100, -50);
        });

        it('should restore camera transform', () => {
            renderSystem.restoreCameraTransform();
            
            expect(mockCtx.restore).toHaveBeenCalled();
        });
    });

    describe('drawing style setup', () => {
        it('should set drawing style to white lines', () => {
            renderSystem.setDrawingStyle();
            
            expect(mockCtx.strokeStyle).toBe('white');
            expect(mockCtx.fillStyle).toBe('white');
            expect(mockCtx.lineWidth).toBe(2);
        });
    });
});
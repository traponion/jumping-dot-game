import { beforeEach, describe, expect, it, vi } from 'vitest';
import type {
    Goal,
    MovingPlatform,
    Platform,
    Spike,
    StageData,
    TextElement
} from '../core/StageLoader';
import { StageRenderer } from '../systems/renderers/StageRenderer';

// Mock fabric.js
vi.mock('fabric', () => ({
    Line: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Polygon: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Rect: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Text: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    }))
}));

describe('StageRenderer', () => {
    let renderer: StageRenderer;
    let mockCanvas: any;
    let mockStageData: StageData;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn()
        };

        const mockPlatforms: Platform[] = [
            { x1: 0, y1: 500, x2: 200, y2: 500 },
            { x1: 300, y1: 400, x2: 500, y2: 400 }
        ];

        const mockMovingPlatforms: MovingPlatform[] = [
            {
                x1: 600,
                y1: 300,
                x2: 800,
                y2: 300,
                startX: 600,
                endX: 900,
                speed: 2,
                direction: 1
            }
        ];

        const mockSpikes: Spike[] = [
            { x: 100, y: 450, width: 30, height: 40 },
            { x: 250, y: 350, width: 25, height: 35 }
        ];

        const mockGoal: Goal = {
            x: 800,
            y: 200,
            width: 50,
            height: 50
        };

        const mockStartText: TextElement = {
            x: 50,
            y: 50,
            text: 'Start here!'
        };

        const mockGoalText: TextElement = {
            x: 750,
            y: 150,
            text: 'Goal!'
        };

        mockStageData = {
            id: 1,
            name: 'Test Stage',
            platforms: mockPlatforms,
            movingPlatforms: mockMovingPlatforms,
            spikes: mockSpikes,
            goal: mockGoal,
            startText: mockStartText,
            goalText: mockGoalText
        };

        renderer = new StageRenderer(mockCanvas);
    });

    describe('renderStage', () => {
        it('should render all stage elements correctly', () => {
            renderer.renderStage(mockStageData);

            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should call cleanup before rendering', () => {
            const cleanupSpy = vi.spyOn(renderer, 'cleanup');
            renderer.renderStage(mockStageData);

            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    describe('renderPlatforms', () => {
        it('should render static platforms as white lines', () => {
            const platforms: Platform[] = [{ x1: 0, y1: 500, x2: 200, y2: 500 }];

            renderer.renderPlatforms(platforms);

            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should clean up existing platforms before rendering', () => {
            const platforms: Platform[] = [{ x1: 0, y1: 500, x2: 200, y2: 500 }];

            renderer.renderPlatforms(platforms);
            renderer.renderPlatforms(platforms);

            expect(mockCanvas.remove).toHaveBeenCalled();
        });
    });

    describe('renderMovingPlatforms', () => {
        it('should render moving platforms as gold lines', () => {
            const movingPlatforms: MovingPlatform[] = [
                {
                    x1: 600,
                    y1: 300,
                    x2: 800,
                    y2: 300,
                    startX: 600,
                    endX: 900,
                    speed: 2,
                    direction: 1
                }
            ];

            renderer.renderMovingPlatforms(movingPlatforms);

            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should clean up existing moving platforms before rendering', () => {
            const movingPlatforms: MovingPlatform[] = [
                {
                    x1: 600,
                    y1: 300,
                    x2: 800,
                    y2: 300,
                    startX: 600,
                    endX: 900,
                    speed: 2,
                    direction: 1
                }
            ];

            renderer.renderMovingPlatforms(movingPlatforms);
            renderer.renderMovingPlatforms(movingPlatforms);

            expect(mockCanvas.remove).toHaveBeenCalled();
        });
    });

    describe('renderSpikes', () => {
        it('should render spikes as white triangular polygons', () => {
            const spikes: Spike[] = [{ x: 100, y: 450, width: 30, height: 40 }];

            renderer.renderSpikes(spikes);

            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should clean up existing spikes before rendering', () => {
            const spikes: Spike[] = [{ x: 100, y: 450, width: 30, height: 40 }];

            renderer.renderSpikes(spikes);
            renderer.renderSpikes(spikes);

            expect(mockCanvas.remove).toHaveBeenCalled();
        });
    });

    describe('renderGoal', () => {
        it('should render goal as white rectangular frame with cross pattern', () => {
            const goal: Goal = {
                x: 800,
                y: 200,
                width: 50,
                height: 50
            };

            renderer.renderGoal(goal);

            expect(mockCanvas.add).toHaveBeenCalledTimes(3); // Rect + 2 lines
        });

        it('should clean up existing goal before rendering', () => {
            const goal: Goal = {
                x: 800,
                y: 200,
                width: 50,
                height: 50
            };

            renderer.renderGoal(goal);
            renderer.renderGoal(goal);

            expect(mockCanvas.remove).toHaveBeenCalled();
        });
    });

    describe('renderStageTexts', () => {
        it('should render stage text elements', () => {
            const mockStage: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 0, y: 0, width: 50, height: 50 },
                startText: { x: 50, y: 50, text: 'Start here!' },
                goalText: { x: 750, y: 150, text: 'Goal!' }
            };

            renderer.renderStageTexts(mockStage);

            expect(mockCanvas.add).toHaveBeenCalled();
        });

        it('should clean up existing text elements before rendering', () => {
            const mockStage: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 0, y: 0, width: 50, height: 50 },
                startText: { x: 50, y: 50, text: 'Start here!' },
                goalText: { x: 750, y: 150, text: 'Goal!' }
            };

            renderer.renderStageTexts(mockStage);
            renderer.renderStageTexts(mockStage);

            expect(mockCanvas.remove).toHaveBeenCalled();
        });
    });

    describe('cleanup', () => {
        it('should remove all stage shapes from canvas', () => {
            const mockPlatformShape = {};
            const mockMovingPlatformShape = {};
            const mockSpikeShape = {};
            const mockGoalShape = {};
            const mockTextShape = {};

            (renderer as any).platformShapes = [mockPlatformShape];
            (renderer as any).movingPlatformShapes = [mockMovingPlatformShape];
            (renderer as any).spikeShapes = [mockSpikeShape];
            (renderer as any).goalShape = mockGoalShape;
            (renderer as any).textShapes = [mockTextShape];

            renderer.cleanup();

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockPlatformShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockMovingPlatformShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockSpikeShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockGoalShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockTextShape);
        });
    });
});

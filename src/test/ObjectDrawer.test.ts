import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ObjectDrawer } from '../adapters/ObjectDrawer.js';
import { EDITOR_CONFIG } from '../types/EditorTypes.js';

// Enhanced fabric.js mock
vi.mock('fabric', () => {
    class MockFabricObject {
        set = vi.fn();
        data = {};
        getBoundingRect = vi.fn(() => ({
            left: 0, top: 0, width: 10, height: 10
        }));
        setCoords = vi.fn();
    }

    const createMockObject = (type: string) => {
        const obj = new MockFabricObject();
        obj.type = type;
        return obj;
    };

    const MockLine = vi.fn().mockImplementation(() => createMockObject('line'));
    const MockPolygon = vi.fn().mockImplementation(() => createMockObject('polygon'));
    const MockRect = vi.fn().mockImplementation(() => createMockObject('rect'));
    const MockText = vi.fn().mockImplementation(() => createMockObject('text'));

    MockLine.prototype = Object.create(MockFabricObject.prototype);
    MockPolygon.prototype = Object.create(MockFabricObject.prototype);
    MockRect.prototype = Object.create(MockFabricObject.prototype);
    MockText.prototype = Object.create(MockFabricObject.prototype);

    return {
        Object: MockFabricObject,
        Line: MockLine,
        Polygon: MockPolygon,
        Rect: MockRect,
        Text: MockText
    };
});

const fabric = (await import('fabric'));

describe('ObjectDrawer', () => {
    let objectDrawer: ObjectDrawer;
    let mockCanvas: any;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
            getObjects: vi.fn(() => []),
            renderAll: vi.fn()
        };
        objectDrawer = new ObjectDrawer(mockCanvas);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Platform Creation', () => {
        it('should create platform with correct properties', () => {
            const start = { x: 0, y: 0 };
            const end = { x: 100, y: 100 };

            const result = objectDrawer.createPlatform(start, end);

            expect(fabric.Line).toHaveBeenCalledWith(
                [0, 0, 100, 100],
                expect.objectContaining({
                    stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                    strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                    selectable: true
                })
            );
            expect(mockCanvas.add).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should apply platform styling correctly', () => {
            const mockObject = { set: vi.fn() };
            
            objectDrawer.applyPlatformStyle(mockObject as any);

            expect(mockObject.set).toHaveBeenCalledWith({
                stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                fill: '',
                selectable: true,
                evented: true
            });
        });
    });

    describe('Spike Creation', () => {
        it('should create spike with correct properties', () => {
            const position = { x: 100, y: 200 };

            const result = objectDrawer.createSpike(position);

            expect(fabric.Polygon).toHaveBeenCalledWith(
                expect.any(Array),
                expect.objectContaining({
                    left: 100,
                    top: 200,
                    fill: EDITOR_CONFIG.COLORS.SPIKE,
                    selectable: true
                })
            );
            expect(mockCanvas.add).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should apply spike styling correctly', () => {
            const mockObject = { set: vi.fn() };
            
            objectDrawer.applySpikeStyle(mockObject as any);

            expect(mockObject.set).toHaveBeenCalledWith({
                fill: EDITOR_CONFIG.COLORS.SPIKE,
                stroke: EDITOR_CONFIG.COLORS.SPIKE_BORDER,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.SPIKE,
                selectable: true,
                evented: true
            });
        });
    });

    describe('Goal Creation', () => {
        it('should create goal with correct properties', () => {
            const position = { x: 150, y: 250 };

            const result = objectDrawer.createGoal(position);

            expect(fabric.Rect).toHaveBeenCalledWith(
                expect.objectContaining({
                    left: 150,
                    top: 250,
                    width: EDITOR_CONFIG.OBJECT_SIZES.GOAL.width,
                    height: EDITOR_CONFIG.OBJECT_SIZES.GOAL.height,
                    fill: EDITOR_CONFIG.COLORS.GOAL
                })
            );
            expect(mockCanvas.add).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should apply goal styling correctly', () => {
            const mockObject = { set: vi.fn() };
            
            objectDrawer.applyGoalStyle(mockObject as any);

            expect(mockObject.set).toHaveBeenCalledWith({
                fill: EDITOR_CONFIG.COLORS.GOAL,
                stroke: EDITOR_CONFIG.COLORS.GOAL_BORDER,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GOAL,
                selectable: true,
                evented: true
            });
        });
    });

    describe('Text Creation', () => {
        it('should create text with correct properties', () => {
            const position = { x: 50, y: 75 };
            const content = 'Test Text';

            const result = objectDrawer.createText(position, content);

            expect(fabric.Text).toHaveBeenCalledWith(
                content,
                expect.objectContaining({
                    left: 50,
                    top: 75,
                    fontSize: EDITOR_CONFIG.TEXT.DEFAULT_SIZE,
                    fill: EDITOR_CONFIG.COLORS.TEXT
                })
            );
            expect(mockCanvas.add).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should apply text styling correctly', () => {
            const mockObject = { set: vi.fn() };
            
            objectDrawer.applyTextStyle(mockObject as any);

            expect(mockObject.set).toHaveBeenCalledWith({
                fill: EDITOR_CONFIG.COLORS.TEXT,
                fontSize: EDITOR_CONFIG.TEXT.DEFAULT_SIZE,
                fontFamily: EDITOR_CONFIG.TEXT.FONT_FAMILY,
                selectable: true,
                evented: true
            });
        });
    });

    describe('Grid Line Creation', () => {
        it('should create grid line with correct properties', () => {
            const start = { x: 0, y: 50 };
            const end = { x: 200, y: 50 };

            const result = objectDrawer.createGridLine(start, end);

            expect(fabric.Line).toHaveBeenCalledWith(
                [0, 50, 200, 50],
                expect.objectContaining({
                    stroke: EDITOR_CONFIG.COLORS.GRID,
                    strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GRID,
                    selectable: false,
                    evented: false
                })
            );
            expect(mockCanvas.add).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should apply grid styling correctly', () => {
            const mockObject = { set: vi.fn() };
            
            objectDrawer.applyGridStyle(mockObject as any);

            expect(mockObject.set).toHaveBeenCalledWith({
                stroke: EDITOR_CONFIG.COLORS.GRID,
                strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GRID,
                selectable: false,
                evented: false,
                data: { type: 'grid' }
            });
        });
    });

    describe('Object Data Management', () => {
        it('should set object data correctly', () => {
            const mockObject = { data: {}, set: vi.fn() };
            const data = { type: 'platform', custom: 'value' };

            objectDrawer.setObjectData(mockObject as any, data);

            expect(mockObject.data).toEqual(data);
            expect(mockObject.set).toHaveBeenCalledWith({ data });
        });

        it('should get object data correctly', () => {
            const mockObject = { data: { type: 'spike', value: 42 } };

            const result = objectDrawer.getObjectData(mockObject as any);

            expect(result).toEqual({ type: 'spike', value: 42 });
        });

        it('should get object bounds correctly', () => {
            const mockObject = {
                getBoundingRect: vi.fn(() => ({
                    left: 10, top: 20, width: 30, height: 40
                }))
            };

            const result = objectDrawer.getObjectBounds(mockObject as any);

            expect(result).toEqual({
                left: 10, top: 20, width: 30, height: 40
            });
            expect(mockObject.getBoundingRect).toHaveBeenCalled();
        });
    });

    describe('Grid Snapping', () => {
        it('should snap coordinates to grid correctly', () => {
            const position = { x: 23, y: 37 };

            const result = objectDrawer.snapToGrid(position);

            expect(result).toEqual({
                x: 20, // Snapped to nearest 20
                y: 40  // Snapped to nearest 20
            });
        });

        it('should handle exact grid coordinates', () => {
            const position = { x: 40, y: 60 };

            const result = objectDrawer.snapToGrid(position);

            expect(result).toEqual({ x: 40, y: 60 });
        });
    });

    describe('Platform Drawing State', () => {
        it('should track platform drawing state correctly', () => {
            expect(objectDrawer.isObjectBeingDrawn()).toBe(false);
        });

        it('should update platform end position correctly', () => {
            const mockLine = {
                set: vi.fn(),
                data: { type: 'platform' }
            };
            const newPosition = { x: 150, y: 200 };

            objectDrawer.updatePlatformEndPosition(mockLine as any, newPosition);

            expect(mockLine.set).toHaveBeenCalledWith({
                x2: 150,
                y2: 200
            });
        });

        it('should finish object drawing correctly', () => {
            const mockObject = { setCoords: vi.fn() };

            objectDrawer.finishObjectDrawing(mockObject as any);

            expect(mockObject.setCoords).toHaveBeenCalled();
        });
    });

    describe('Error Handling', () => {
        it('should handle null object in data operations', () => {
            expect(() => objectDrawer.getObjectData(null as any)).not.toThrow();
            expect(() => objectDrawer.setObjectData(null as any, {})).not.toThrow();
        });

        it('should handle invalid coordinates in snap operation', () => {
            const invalidPos = { x: NaN, y: undefined as any };

            const result = objectDrawer.snapToGrid(invalidPos);

            expect(result.x).toBe(0);
            expect(result.y).toBe(0);
        });
    });
});
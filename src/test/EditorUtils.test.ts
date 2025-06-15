// EditorUtils unit tests
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
    FabricHelper, 
    ObjectFactory, 
    TypeHelper, 
    EventHelper, 
    DebugHelper 
} from '../utils/EditorUtils.js';
import { EDITOR_TOOLS, EDITOR_CONFIG } from '../types/EditorTypes.js';
import * as fabric from 'fabric';

// Mock fabric.js for testing
vi.mock('fabric', () => ({
    Line: vi.fn(),
    Polygon: vi.fn(),
    Rect: vi.fn(), 
    Text: vi.fn()
}));

describe('EditorUtils', () => {
    describe('TypeHelper', () => {
        it('should safely parse integers', () => {
            expect(TypeHelper.safeParseInt('123', 0)).toBe(123);
            expect(TypeHelper.safeParseInt('invalid', 0)).toBe(0);
            expect(TypeHelper.safeParseInt('', 42)).toBe(42);
        });

        it('should safely parse floats', () => {
            expect(TypeHelper.safeParseFloat('123.45', 0)).toBe(123.45);
            expect(TypeHelper.safeParseFloat('invalid', 0)).toBe(0);
            expect(TypeHelper.safeParseFloat('', 3.14)).toBe(3.14);
        });

        it('should safely get object properties', () => {
            const obj = { name: 'test', value: 42 };
            
            expect(TypeHelper.safeGetProperty(obj, 'name', 'default')).toBe('test');
            expect(TypeHelper.safeGetProperty(obj, 'value', 0)).toBe(42);
            expect(TypeHelper.safeGetProperty(obj as any, 'missing', 'default')).toBe('default');
        });
    });

    describe('EventHelper', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        it('should create debounced function', () => {
            const mockFn = vi.fn();
            const debouncedFn = EventHelper.debounce(mockFn, 100);

            debouncedFn();
            debouncedFn();
            debouncedFn();

            expect(mockFn).not.toHaveBeenCalled();

            vi.advanceTimersByTime(100);
            expect(mockFn).toHaveBeenCalledTimes(1);
        });

        it('should create throttled function', () => {
            const mockFn = vi.fn();
            const throttledFn = EventHelper.throttle(mockFn, 100);

            throttledFn();
            throttledFn();
            throttledFn();

            expect(mockFn).toHaveBeenCalledTimes(1);

            vi.advanceTimersByTime(100);
            throttledFn();
            expect(mockFn).toHaveBeenCalledTimes(2);
        });

        it('should normalize keyboard events', () => {
            const ctrlEvent = new KeyboardEvent('keydown', { 
                code: 'KeyS', 
                ctrlKey: true 
            });
            const metaEvent = new KeyboardEvent('keydown', { 
                code: 'KeyS', 
                metaKey: true 
            });
            const regularEvent = new KeyboardEvent('keydown', { 
                code: 'KeyS' 
            });

            expect(EventHelper.normalizeKeyboardEvent(ctrlEvent)).toBe('Ctrl+KeyS');
            expect(EventHelper.normalizeKeyboardEvent(metaEvent)).toBe('Cmd+KeyS');
            expect(EventHelper.normalizeKeyboardEvent(regularEvent)).toBe('KeyS');
        });
    });

    describe('DebugHelper', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            console.log = vi.fn();
            console.time = vi.fn();
            console.timeEnd = vi.fn();
        });

        it('should log messages in development mode', () => {
            // Force debug mode
            (DebugHelper as any).debugMode = true;
            
            DebugHelper.log('test message', { data: 'test' });
            
            expect(console.log).toHaveBeenCalledWith(
                '[Editor Debug] test message', 
                { data: 'test' }
            );
        });

        it('should not log messages in production mode', () => {
            // Force production mode
            (DebugHelper as any).debugMode = false;
            
            DebugHelper.log('test message');
            
            expect(console.log).not.toHaveBeenCalled();
        });

        it('should measure performance in development mode', () => {
            // Force debug mode
            (DebugHelper as any).debugMode = true;
            
            const mockFn = vi.fn(() => 'result');
            const result = DebugHelper.time('test-operation', mockFn);
            
            expect(console.time).toHaveBeenCalledWith('test-operation');
            expect(console.timeEnd).toHaveBeenCalledWith('test-operation');
            expect(mockFn).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should not measure performance in production mode', () => {
            // Force production mode
            (DebugHelper as any).debugMode = false;
            
            const mockFn = vi.fn(() => 'result');
            const result = DebugHelper.time('test-operation', mockFn);
            
            expect(console.time).not.toHaveBeenCalled();
            expect(console.timeEnd).not.toHaveBeenCalled();
            expect(mockFn).toHaveBeenCalled();
            expect(result).toBe('result');
        });
    });

    describe('FabricHelper', () => {
        let mockObject: any;

        beforeEach(() => {
            mockObject = {
                set: vi.fn(),
                data: {},
                getBoundingRect: vi.fn(() => ({
                    left: 10,
                    top: 20,
                    width: 100,
                    height: 50
                }))
            };
        });

        it('should set object data', () => {
            const data = { type: EDITOR_TOOLS.SPIKE };
            FabricHelper.setObjectData(mockObject, data);
            
            expect(mockObject.data).toEqual(data);
        });

        it('should get object type', () => {
            mockObject.data = { type: EDITOR_TOOLS.PLATFORM };
            
            expect(FabricHelper.getObjectType(mockObject)).toBe(EDITOR_TOOLS.PLATFORM);
        });

        it('should get object bounds', () => {
            const bounds = FabricHelper.getObjectBounds(mockObject);
            
            expect(bounds).toEqual({
                left: 10,
                top: 20,
                width: 100,
                height: 50
            });
        });

        it('should snap position to grid', () => {
            const position = { x: 127, y: 143 };
            const snapped = FabricHelper.snapToGrid(position, 20);
            
            expect(snapped).toEqual({ x: 120, y: 140 });
        });
    });

    describe('ObjectFactory', () => {
        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('should create platform object', () => {
            const mockLine = { data: {} };
            vi.mocked(fabric.Line).mockReturnValue(mockLine as any);
            
            ObjectFactory.createPlatform(
                { x: 0, y: 0 },
                { x: 100, y: 100 }
            );
            
            expect(fabric.Line).toHaveBeenCalledWith(
                [0, 0, 100, 100],
                expect.objectContaining({
                    stroke: EDITOR_CONFIG.COLORS.PLATFORM,
                    strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.PLATFORM,
                    selectable: true
                })
            );
        });

        it('should create spike object', () => {
            const mockPolygon = { data: {} };
            vi.mocked(fabric.Polygon).mockReturnValue(mockPolygon as any);
            
            ObjectFactory.createSpike({
                position: { x: 100, y: 200 }
            });
            
            expect(fabric.Polygon).toHaveBeenCalled();
        });

        it('should create goal object', () => {
            const mockRect = { data: {} };
            vi.mocked(fabric.Rect).mockReturnValue(mockRect as any);
            
            ObjectFactory.createGoal({
                position: { x: 100, y: 200 }
            });
            
            expect(fabric.Rect).toHaveBeenCalled();
        });

        it('should create text object', () => {
            const mockText = { data: {} };
            vi.mocked(fabric.Text).mockReturnValue(mockText as any);
            
            ObjectFactory.createText({
                position: { x: 100, y: 200 },
                text: 'Hello World'
            });
            
            expect(fabric.Text).toHaveBeenCalledWith(
                'Hello World',
                expect.objectContaining({
                    left: 100,
                    top: 200
                })
            );
        });

        it('should create grid line', () => {
            const mockLine = { data: {} };
            vi.mocked(fabric.Line).mockReturnValue(mockLine as any);
            
            ObjectFactory.createGridLine(
                { x: 0, y: 0 },
                { x: 100, y: 100 }
            );
            
            expect(fabric.Line).toHaveBeenCalledWith(
                [0, 0, 100, 100],
                expect.objectContaining({
                    stroke: EDITOR_CONFIG.COLORS.GRID,
                    strokeWidth: EDITOR_CONFIG.STROKE_WIDTH.GRID,
                    selectable: false,
                    evented: false
                })
            );
        });
    });
});
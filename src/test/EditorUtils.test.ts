import * as fabric from 'fabric';
// EditorUtils unit tests
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EDITOR_CONFIG, EDITOR_TOOLS } from '../types/EditorTypes.js';
import {
    DOMHelper,
    DebugHelper,
    EventHelper,
    FabricHelper,
    MathHelper,
    ObjectFactory,
    TypeHelper
} from '../utils/EditorUtils.js';

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
            expect(TypeHelper.safeGetProperty(obj as unknown, 'missing', 'default')).toBe(
                'default'
            );
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
            (DebugHelper as unknown as { debugMode: boolean }).debugMode = true;

            DebugHelper.log('test message', { data: 'test' });

            expect(console.log).toHaveBeenCalledWith('[Editor Debug] test message', {
                data: 'test'
            });
        });

        it('should not log messages in production mode', () => {
            // Force production mode
            (DebugHelper as unknown as { debugMode: boolean }).debugMode = false;

            DebugHelper.log('test message');

            expect(console.log).not.toHaveBeenCalled();
        });

        it('should measure performance in development mode', () => {
            // Force debug mode
            (DebugHelper as unknown as { debugMode: boolean }).debugMode = true;

            const mockFn = vi.fn(() => 'result');
            const result = DebugHelper.time('test-operation', mockFn);

            expect(console.time).toHaveBeenCalledWith('test-operation');
            expect(console.timeEnd).toHaveBeenCalledWith('test-operation');
            expect(mockFn).toHaveBeenCalled();
            expect(result).toBe('result');
        });

        it('should not measure performance in production mode', () => {
            // Force production mode
            (DebugHelper as unknown as { debugMode: boolean }).debugMode = false;

            const mockFn = vi.fn(() => 'result');
            const result = DebugHelper.time('test-operation', mockFn);

            expect(console.time).not.toHaveBeenCalled();
            expect(console.timeEnd).not.toHaveBeenCalled();
            expect(mockFn).toHaveBeenCalled();
            expect(result).toBe('result');
        });
    });

    describe('FabricHelper', () => {
        let mockObject: {
            set: ReturnType<typeof vi.fn>;
            data: Record<string, unknown>;
            getBoundingRect: ReturnType<typeof vi.fn>;
        };

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
            vi.mocked(fabric.Line).mockReturnValue(mockLine as unknown);

            ObjectFactory.createPlatform({ x: 0, y: 0 }, { x: 100, y: 100 });

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
            vi.mocked(fabric.Polygon).mockReturnValue(mockPolygon as unknown);

            ObjectFactory.createSpike({
                position: { x: 100, y: 200 }
            });

            expect(fabric.Polygon).toHaveBeenCalled();
        });

        it('should create goal object', () => {
            const mockRect = { data: {} };
            vi.mocked(fabric.Rect).mockReturnValue(mockRect as unknown);

            ObjectFactory.createGoal({
                position: { x: 100, y: 200 }
            });

            expect(fabric.Rect).toHaveBeenCalled();
        });

        it('should create text object', () => {
            const mockText = { data: {} };
            vi.mocked(fabric.Text).mockReturnValue(mockText as unknown);

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
            vi.mocked(fabric.Line).mockReturnValue(mockLine as unknown);

            ObjectFactory.createGridLine({ x: 0, y: 0 }, { x: 100, y: 100 });

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

    describe('DOMHelper', () => {
        beforeEach(() => {
            document.body.innerHTML = '';
        });

        it('should get required element by id', () => {
            const element = document.createElement('div');
            element.id = 'test-element';
            document.body.appendChild(element);

            const result = DOMHelper.getRequiredElement<HTMLDivElement>('test-element');

            expect(result).toBe(element);
            expect(result.tagName).toBe('DIV');
        });

        it('should throw error for missing required element', () => {
            expect(() => {
                DOMHelper.getRequiredElement('non-existent-element');
            }).toThrow();
        });

        it('should get optional element by id', () => {
            const element = document.createElement('span');
            element.id = 'optional-element';
            document.body.appendChild(element);

            const result = DOMHelper.getOptionalElement<HTMLSpanElement>('optional-element');

            expect(result).toBe(element);
        });

        it('should return null for missing optional element', () => {
            const result = DOMHelper.getOptionalElement('missing-element');

            expect(result).toBeNull();
        });

        it('should get multiple elements by id mapping', () => {
            const div = document.createElement('div');
            div.id = 'element1';
            const span = document.createElement('span');
            span.id = 'element2';

            document.body.appendChild(div);
            document.body.appendChild(span);

            const result = DOMHelper.getElements({
                first: 'element1',
                second: 'element2'
            });

            expect(result.first).toBe(div);
            expect(result.second).toBe(span);
        });

        it('should add event listeners to node list', () => {
            const elements = [
                document.createElement('button'),
                document.createElement('button'),
                document.createElement('button')
            ];

            for (const el of elements) {
                el.className = 'test-button';
                document.body.appendChild(el);
            }

            const nodeList = document.querySelectorAll('.test-button');
            const handler = vi.fn();

            DOMHelper.addEventListenersToNodeList(nodeList, 'click', handler);

            // Simulate click on each element
            for (const el of elements) {
                el.click();
            }

            expect(handler).toHaveBeenCalledTimes(3);
        });
    });

    describe('MathHelper', () => {
        it('should calculate distance between two points', () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 3, y: 4 };

            const result = MathHelper.distance(point1, point2);

            expect(result).toBe(5); // 3-4-5 triangle
        });

        it('should calculate distance for same points', () => {
            const point = { x: 10, y: 20 };

            const result = MathHelper.distance(point, point);

            expect(result).toBe(0);
        });

        it('should calculate angle between two points', () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 1, y: 0 }; // 0 degrees (right)

            const result = MathHelper.angle(point1, point2);

            expect(result).toBe(0);
        });

        it('should calculate angle for vertical line', () => {
            const point1 = { x: 0, y: 0 };
            const point2 = { x: 0, y: 1 }; // 90 degrees (up)

            const result = MathHelper.angle(point1, point2);

            expect(result).toBe(90);
        });

        it('should clamp values within range', () => {
            expect(MathHelper.clamp(5, 0, 10)).toBe(5);
            expect(MathHelper.clamp(-5, 0, 10)).toBe(0);
            expect(MathHelper.clamp(15, 0, 10)).toBe(10);
        });

        it('should clamp values at boundaries', () => {
            expect(MathHelper.clamp(0, 0, 10)).toBe(0);
            expect(MathHelper.clamp(10, 0, 10)).toBe(10);
        });

        it('should handle inverted min/max', () => {
            // When min > max, it should return min
            expect(MathHelper.clamp(5, 10, 0)).toBe(0);
        });
    });
});

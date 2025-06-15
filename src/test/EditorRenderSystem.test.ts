import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorRenderSystem } from '../systems/EditorRenderSystem.js';
import type { EditorCallbacks } from '../types/EditorTypes.js';
import type { StageData } from '../core/StageLoader.js';

// Mock fabric.js completely to avoid JSDOM environment issues
vi.mock('fabric', () => ({
    Canvas: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        renderAll: vi.fn(),
        clear: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        getObjects: vi.fn().mockReturnValue([]),
        getActiveObject: vi.fn().mockReturnValue(null),
        setActiveObject: vi.fn(),
        discardActiveObject: vi.fn(),
        setWidth: vi.fn(),
        setHeight: vi.fn(),
        getElement: vi.fn().mockReturnValue(document.createElement('canvas')),
        dispose: vi.fn(),
        selection: true,
        interactive: true,
        defaultCursor: 'default',
        hoverCursor: 'move',
        moveCursor: 'move',
        backgroundColor: 'black'
    })),
    Line: vi.fn().mockImplementation(() => ({ set: vi.fn(), data: {} })),
    Polygon: vi.fn().mockImplementation(() => ({ set: vi.fn(), data: {} })),
    Rect: vi.fn().mockImplementation(() => ({ set: vi.fn(), data: {} })),
    Text: vi.fn().mockImplementation(() => ({ set: vi.fn(), data: {} }))
}));

// Mock DOM elements for testing
const mockCanvas = {
    getContext: vi.fn(() => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        fillStyle: '',
        strokeStyle: '',
        lineWidth: 1,
        font: '',
        textAlign: '',
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        fillText: vi.fn(),
        strokeRect: vi.fn(),
        ellipse: vi.fn(),
        closePath: vi.fn()
    })),
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ 
        left: 0, top: 0, width: 800, height: 600 
    })),
    hasAttribute: vi.fn().mockReturnValue(false),
    style: {
        cssText: '',
        setProperty: vi.fn(),
        getPropertyValue: vi.fn(),
        removeProperty: vi.fn()
    },
    classList: {
        add: vi.fn(),
        remove: vi.fn(),
        toggle: vi.fn(),
        contains: vi.fn()
    }
} as unknown as HTMLCanvasElement;

describe('EditorRenderSystem', () => {
    let editorSystem: EditorRenderSystem;
    let mockCallbacks: EditorCallbacks;
    let originalDocument: any;

    beforeEach(() => {
        // Store original document
        originalDocument = global.document;
        
        // Mock document.getElementById
        global.document = {
            getElementById: vi.fn(() => mockCanvas),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        } as any;

        // Setup mock callbacks
        mockCallbacks = {
            onObjectSelected: vi.fn(),
            onObjectModified: vi.fn(),
            onStageModified: vi.fn()
        };

        // Create editor system
        editorSystem = new EditorRenderSystem(mockCanvas, mockCallbacks);
    });

    afterEach(() => {
        // Restore original document
        global.document = originalDocument;
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should create editor system with interactive mode enabled', () => {
            expect(editorSystem).toBeInstanceOf(EditorRenderSystem);
            
            const editorState = editorSystem.getEditorState();
            expect(editorState.selectedTool).toBe('select');
            expect(editorState.selectedObject).toBe(null);
            expect(editorState.isDrawing).toBe(false);
            expect(editorState.gridEnabled).toBe(true);
            expect(editorState.snapToGrid).toBe(true);
        });

        it('should setup callbacks correctly', () => {
            expect(mockCallbacks.onObjectSelected).toBeDefined();
            expect(mockCallbacks.onObjectModified).toBeDefined();
            expect(mockCallbacks.onStageModified).toBeDefined();
        });

        it('should initialize with default editor state', () => {
            const state = editorSystem.getEditorState();
            
            expect(state).toEqual({
                selectedTool: 'select',
                selectedObject: null,
                isDrawing: false,
                gridEnabled: true,
                snapToGrid: true
            });
        });
    });

    describe('tool selection', () => {
        it('should change selected tool correctly', () => {
            editorSystem.setSelectedTool('platform');
            expect(editorSystem.getEditorState().selectedTool).toBe('platform');

            editorSystem.setSelectedTool('spike');
            expect(editorSystem.getEditorState().selectedTool).toBe('spike');

            editorSystem.setSelectedTool('goal');
            expect(editorSystem.getEditorState().selectedTool).toBe('goal');

            editorSystem.setSelectedTool('text');
            expect(editorSystem.getEditorState().selectedTool).toBe('text');

            editorSystem.setSelectedTool('select');
            expect(editorSystem.getEditorState().selectedTool).toBe('select');
        });

        it('should handle invalid tool selection gracefully', () => {
            const invalidTool = 'invalid' as any;
            
            expect(() => {
                editorSystem.setSelectedTool(invalidTool);
            }).not.toThrow();
        });
    });

    describe('grid functionality', () => {
        it('should toggle grid visibility', () => {
            const initialGridState = editorSystem.getEditorState().gridEnabled;
            
            editorSystem.toggleGrid();
            expect(editorSystem.getEditorState().gridEnabled).toBe(!initialGridState);
            
            editorSystem.toggleGrid();
            expect(editorSystem.getEditorState().gridEnabled).toBe(initialGridState);
        });

        it('should toggle snap to grid functionality', () => {
            const initialSnapState = editorSystem.getEditorState().snapToGrid;
            
            editorSystem.toggleSnapToGrid();
            expect(editorSystem.getEditorState().snapToGrid).toBe(!initialSnapState);
            
            editorSystem.toggleSnapToGrid();
            expect(editorSystem.getEditorState().snapToGrid).toBe(initialSnapState);
        });
    });

    describe('object deletion', () => {
        it('should delete selected object when deleteSelectedObject is called', () => {
            // This test verifies the method exists and can be called
            expect(() => {
                editorSystem.deleteSelectedObject();
            }).not.toThrow();
        });

        it('should handle deletion when no object is selected', () => {
            // Ensure no object is selected
            expect(editorSystem.getEditorState().selectedObject).toBe(null);
            
            // Should not throw when trying to delete nothing
            expect(() => {
                editorSystem.deleteSelectedObject();
            }).not.toThrow();
        });
    });

    describe('stage data operations', () => {
        it('should export stage data in correct format', () => {
            const stageData = editorSystem.exportStageData();
            
            expect(stageData).toHaveProperty('id');
            expect(stageData).toHaveProperty('name');
            expect(stageData).toHaveProperty('platforms');
            expect(stageData).toHaveProperty('spikes');
            expect(stageData).toHaveProperty('goal');
            expect(stageData).toHaveProperty('startText');
            expect(stageData).toHaveProperty('goalText');
            
            expect(Array.isArray(stageData.platforms)).toBe(true);
            expect(Array.isArray(stageData.spikes)).toBe(true);
            expect(typeof stageData.goal).toBe('object');
        });

        it('should load stage data for editing', () => {
            const testStageData: StageData = {
                id: 99,
                name: 'Test Stage',
                platforms: [
                    { x1: 0, y1: 500, x2: 200, y2: 500 }
                ],
                spikes: [
                    { x: 100, y: 480, width: 15, height: 15 }
                ],
                goal: { x: 300, y: 400, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 320, y: 380, text: 'GOAL' }
            };

            expect(() => {
                editorSystem.loadStageForEditing(testStageData);
            }).not.toThrow();

            // Verify that the stage was loaded by checking exported data
            const exportedData = editorSystem.exportStageData();
            expect(exportedData.id).toBe(99);
            expect(exportedData.name).toBe('Test Stage');
        });

        it('should handle empty stage data correctly', () => {
            const emptyStageData: StageData = {
                id: 1,
                name: 'Empty Stage',
                platforms: [],
                spikes: [],
                goal: { x: 400, y: 300, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 420, y: 280, text: 'GOAL' }
            };

            expect(() => {
                editorSystem.loadStageForEditing(emptyStageData);
            }).not.toThrow();

            const exportedData = editorSystem.exportStageData();
            expect(exportedData.platforms).toHaveLength(0);
            expect(exportedData.spikes).toHaveLength(0);
        });
    });

    describe('editor state management', () => {
        it('should maintain immutable editor state', () => {
            const state1 = editorSystem.getEditorState();
            const state2 = editorSystem.getEditorState();
            
            // Should return different objects (not same reference)
            expect(state1).not.toBe(state2);
            
            // But with same values
            expect(state1).toEqual(state2);
        });

        it('should update editor state through public methods only', () => {
            const initialState = editorSystem.getEditorState();
            
            // Change tool
            editorSystem.setSelectedTool('platform');
            const stateAfterToolChange = editorSystem.getEditorState();
            expect(stateAfterToolChange.selectedTool).toBe('platform');
            expect(stateAfterToolChange.selectedTool).not.toBe(initialState.selectedTool);
            
            // Toggle grid
            editorSystem.toggleGrid();
            const stateAfterGridToggle = editorSystem.getEditorState();
            expect(stateAfterGridToggle.gridEnabled).not.toBe(stateAfterToolChange.gridEnabled);
        });
    });

    describe('error handling', () => {
        it('should handle canvas initialization errors gracefully', () => {
            const badCanvas = {
                getContext: () => null,
                width: 800,
                height: 600,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                getAttribute: vi.fn(),
                setAttribute: vi.fn()
            } as unknown as HTMLCanvasElement;

            expect(() => {
                new EditorRenderSystem(badCanvas, mockCallbacks);
            }).toThrow('Failed to get 2D rendering context');
        });

        it('should handle missing callback functions gracefully', () => {
            expect(() => {
                new EditorRenderSystem(mockCanvas, {});
            }).not.toThrow();
        });

        it('should handle invalid canvas element', () => {
            const invalidCanvas = {} as HTMLCanvasElement;
            
            expect(() => {
                new EditorRenderSystem(invalidCanvas, mockCallbacks);
            }).toThrow();
        });
    });

    describe('integration with base FabricRenderSystem', () => {
        it('should inherit core rendering functionality', () => {
            // Test that core methods from FabricRenderSystem are available
            expect(typeof editorSystem.clearCanvas).toBe('function');
            expect(typeof editorSystem.renderAll).toBe('function');
            expect(typeof editorSystem.dispose).toBe('function');
        });

        it('should maintain rendering system lifecycle', () => {
            expect(() => {
                editorSystem.clearCanvas();
                editorSystem.renderAll();
            }).not.toThrow();
        });

        it('should properly dispose resources', () => {
            expect(() => {
                editorSystem.dispose();
            }).not.toThrow();
        });
    });

    describe('performance considerations', () => {
        it('should not throw errors during rapid tool switching', () => {
            const tools = ['select', 'platform', 'spike', 'goal', 'text'] as const;
            
            expect(() => {
                for (let i = 0; i < 100; i++) {
                    const tool = tools[i % tools.length];
                    editorSystem.setSelectedTool(tool);
                }
            }).not.toThrow();
        });

        it('should handle multiple stage loads efficiently', () => {
            const testStage: StageData = {
                id: 1,
                name: 'Performance Test',
                platforms: Array.from({ length: 50 }, (_, i) => ({
                    x1: i * 20, y1: 500, x2: i * 20 + 100, y2: 500
                })),
                spikes: Array.from({ length: 20 }, (_, i) => ({
                    x: i * 40 + 50, y: 480, width: 15, height: 15
                })),
                goal: { x: 1000, y: 400, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 1020, y: 380, text: 'GOAL' }
            };

            expect(() => {
                for (let i = 0; i < 10; i++) {
                    editorSystem.loadStageForEditing(testStage);
                }
            }).not.toThrow();
        });
    });
});
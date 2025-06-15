// EditorController統合テスト (Adapter Pattern版)
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorController } from '../controllers/EditorController.js';
import { EditorView } from '../views/EditorView.js';
import { EditorModel } from '../models/EditorModel.js';
import { MockRenderAdapter } from '../adapters/MockRenderAdapter.js';
import { EditorRenderSystem } from '../systems/EditorRenderSystem.js';
import { editorStore, getEditorStore } from '../stores/EditorZustandStore.js';
import { EDITOR_TOOLS } from '../types/EditorTypes.js';

// Mock RenderSystemFactory to return our test adapter
vi.mock('../systems/RenderSystemFactory.js', () => ({
    createEditorRenderSystem: vi.fn(),
    isTestEnvironment: vi.fn().mockReturnValue(true)
}));

// Mock other modules
vi.mock('../views/EditorView.js');
vi.mock('../models/EditorModel.js');
vi.mock('../core/StageLoader.js');

describe('EditorController (Adapter Pattern)', () => {
    let controller: EditorController;
    let mockCanvas: HTMLCanvasElement;
    let mockView: EditorView;
    let mockModel: EditorModel;
    let mockAdapter: MockRenderAdapter;
    let mockRenderSystem: EditorRenderSystem;

    beforeEach(async () => {
        // Reset Zustand store
        editorStore.setState({
            editor: {
                selectedTool: EDITOR_TOOLS.SELECT,
                selectedObject: null,
                isDrawing: false,
                gridEnabled: true,
                snapToGrid: true
            },
            stage: null,
            ui: {
                showGrid: true,
                showSnapIndicators: true,
                theme: 'dark'
            },
            performance: {
                frameRate: 60,
                objectCount: 0,
                lastRenderTime: 0
            }
        });

        // Create DOM elements
        document.body.innerHTML = '<div id="messageContainer"></div>';
        
        // Create mock canvas
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = 800;
        mockCanvas.height = 600;

        // Create mock adapter and render system
        mockAdapter = new MockRenderAdapter();
        mockRenderSystem = new EditorRenderSystem(mockAdapter);

        // Mock the factory to return our test render system
        const RenderSystemFactory = await import('../systems/RenderSystemFactory.js');
        vi.mocked(RenderSystemFactory.createEditorRenderSystem).mockReturnValue(mockRenderSystem);

        // Mock view
        mockView = new EditorView();
        mockView.initialize = vi.fn();
        mockView.updateToolSelection = vi.fn();
        mockView.showMessage = vi.fn();
        mockView.updateStageList = vi.fn();

        // Mock model
        mockModel = new EditorModel();
        mockModel.setCurrentStage = vi.fn();
        mockModel.getCurrentStage = vi.fn().mockReturnValue({
            id: 1,
            name: 'Test Stage',
            platforms: [],
            spikes: [],
            goal: { x: 400, y: 200, width: 40, height: 50 },
            startText: { x: 50, y: 450, text: 'START' },
            goalText: { x: 420, y: 180, text: 'GOAL' }
        });
        mockModel.exportStageAsJson = vi.fn().mockReturnValue('{}');
        mockModel.validateStageData = vi.fn().mockReturnValue({ isValid: true, errors: [] });

        // Mock window.confirm
        window.confirm = vi.fn().mockReturnValue(true);
    });

    afterEach(() => {
        if (controller) {
            controller.dispose();
        }
        mockAdapter.reset();
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize controller successfully', async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            
            await expect(controller.initialize()).resolves.toBeUndefined();
            
            expect(mockView.initialize).toHaveBeenCalled();
            expect(mockAdapter.clearCanvasCalled).toBeGreaterThan(0);
        });

        it('should create new stage on initialization', async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            
            expect(mockModel.setCurrentStage).toHaveBeenCalled();
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });

        it('should setup Zustand store connection', async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            
            const store = getEditorStore();
            expect(store).toBeDefined();
        });
    });

    describe('Tool Management', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset(); // Reset counters after initialization
        });

        it('should select tool and update store', () => {
            controller.selectTool(EDITOR_TOOLS.SPIKE);
            
            expect(mockAdapter.toolChanges).toContain(EDITOR_TOOLS.SPIKE);
            
            const store = getEditorStore();
            expect(store.getState().editor.selectedTool).toBe(EDITOR_TOOLS.SPIKE);
        });

        it('should handle invalid tool gracefully', () => {
            expect(() => {
                controller.selectTool('invalid-tool' as any);
            }).not.toThrow();
        });

        it('should update view when tool changes', () => {
            controller.selectTool(EDITOR_TOOLS.PLATFORM);
            
            expect(mockView.updateToolSelection).toHaveBeenCalledWith(EDITOR_TOOLS.PLATFORM);
        });
    });

    describe('Object Operations', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
            
            // Simulate having a selected object
            const mockObject = { id: 'test-object', type: 'spike' };
            mockAdapter.selectObject(mockObject);
        });

        it('should delete selected object', () => {
            expect(mockAdapter.hasSelectedObject()).toBe(true);
            
            controller.deleteSelectedObject();
            
            expect(mockAdapter.deleteObjectCalls).toBe(1);
            expect(mockAdapter.hasSelectedObject()).toBe(false);
        });

        it('should duplicate selected object', () => {
            controller.duplicateSelectedObject();
            
            expect(mockAdapter.duplicateObjectCalls).toBe(1);
        });

        it('should handle delete when no object selected', () => {
            mockAdapter.selectObject(null);
            
            controller.deleteSelectedObject();
            
            expect(mockAdapter.deleteObjectCalls).toBe(0);
        });
    });

    describe('Grid and Snap Operations', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
        });

        it('should toggle grid', () => {
            const initialGridState = mockAdapter.isGridEnabled();
            
            controller.toggleGrid();
            
            expect(mockAdapter.gridToggles).toBe(1);
            expect(mockAdapter.isGridEnabled()).toBe(!initialGridState);
        });

        it('should toggle snap', () => {
            const initialSnapState = mockAdapter.isSnapToGridEnabled();
            
            controller.toggleSnap();
            
            expect(mockAdapter.snapToggles).toBe(1);
            expect(mockAdapter.isSnapToGridEnabled()).toBe(!initialSnapState);
        });
    });

    describe('Stage Management', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
        });

        it('should create new stage', () => {
            controller.createNewStage();
            
            expect(mockModel.setCurrentStage).toHaveBeenCalled();
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });

        it('should clear stage', () => {
            controller.clearStage();
            
            expect(mockAdapter.clearCanvasCalled).toBe(1);
        });

        it('should save stage', () => {
            controller.saveStage();
            
            expect(mockAdapter.stageExports).toBe(1);
            expect(mockModel.exportStageAsJson).toHaveBeenCalled();
        });

        it('should load stage', async () => {
            await controller.loadStage(1);
            
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });
    });

    describe('Event Handling', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
        });

        it('should handle object selection callback', () => {
            const mockObject = { id: 'test-object', type: 'goal' };
            
            // Simulate object selection through adapter
            mockAdapter.selectObject(mockObject);
            
            const store = getEditorStore();
            expect(store.getState().editor.selectedObject).toEqual(mockObject);
        });

        it('should handle stage modification callback', () => {
            const modifiedStageData = {
                id: 2,
                name: 'Modified Stage',
                platforms: [],
                spikes: [],
                goal: { x: 500, y: 300, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 520, y: 280, text: 'GOAL' }
            };
            
            mockAdapter.simulateStageModification(modifiedStageData);
            
            expect(mockModel.setCurrentStage).toHaveBeenCalledWith(modifiedStageData);
        });
    });

    describe('Keyboard Shortcuts', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
            
            // Add object for deletion test
            const mockObject = { id: 'test-object', type: 'spike' };
            mockAdapter.selectObject(mockObject);
        });

        it('should handle Delete key', () => {
            const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
            document.dispatchEvent(deleteEvent);
            
            expect(mockAdapter.deleteObjectCalls).toBe(1);
        });

        it('should handle Ctrl+D for duplicate', () => {
            const duplicateEvent = new KeyboardEvent('keydown', { 
                key: 'd', 
                ctrlKey: true 
            });
            document.dispatchEvent(duplicateEvent);
            
            expect(mockAdapter.duplicateObjectCalls).toBe(1);
        });

        it('should handle Ctrl+N for new stage', () => {
            const newStageEvent = new KeyboardEvent('keydown', { 
                key: 'n', 
                ctrlKey: true 
            });
            document.dispatchEvent(newStageEvent);
            
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle initialization errors gracefully', async () => {
            // Mock createEditorRenderSystem to throw
            const RenderSystemFactory = await import('../systems/RenderSystemFactory.js');
            vi.mocked(RenderSystemFactory.createEditorRenderSystem).mockImplementation(() => {
                throw new Error('Test initialization error');
            });
            
            controller = new EditorController(mockCanvas, mockView, mockModel);
            
            await expect(controller.initialize()).rejects.toThrow();
        });

        it('should handle missing DOM elements', async () => {
            document.body.innerHTML = ''; // Remove messageContainer
            
            controller = new EditorController(mockCanvas, mockView, mockModel);
            
            // Should not throw even without messageContainer
            await expect(controller.initialize()).resolves.toBeUndefined();
        });
    });

    describe('Performance and Cleanup', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
        });

        it('should dispose resources properly', () => {
            controller.dispose();
            
            expect(mockAdapter.disposeCalled).toBe(1);
        });

        it('should track adapter method calls efficiently', () => {
            // Perform multiple operations
            controller.toggleGrid();
            controller.selectTool(EDITOR_TOOLS.SPIKE);
            controller.createNewStage();
            
            expect(mockAdapter.gridToggles).toBe(1);
            expect(mockAdapter.toolChanges).toHaveLength(1);
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });
    });

    describe('Legacy API Compatibility', () => {
        beforeEach(async () => {
            controller = new EditorController(mockCanvas, mockView, mockModel);
            await controller.initialize();
            mockAdapter.reset();
        });

        it('should provide getFabricCanvas for compatibility', () => {
            expect(() => {
                controller.getFabricCanvas();
            }).not.toThrow();
        });

        it('should handle createObject method', () => {
            const mockEvent = { clientX: 100, clientY: 200 };
            
            expect(() => {
                controller.createObject(mockEvent);
            }).not.toThrow();
        });

        it('should handle platform drawing methods', () => {
            const mockEvent = { clientX: 100, clientY: 200 };
            
            expect(() => {
                controller.startPlatformDrawing(mockEvent);
                controller.finishPlatformDrawing(mockEvent);
            }).not.toThrow();
        });
    });
});
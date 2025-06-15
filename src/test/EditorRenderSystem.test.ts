import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EditorRenderSystem } from '../systems/EditorRenderSystem.js';
import { MockRenderAdapter } from '../adapters/MockRenderAdapter.js';
import type { EditorCallbacks } from '../adapters/IRenderAdapter.js';
import type { StageData } from '../core/StageLoader.js';

describe('EditorRenderSystem (Adapter Pattern)', () => {
    let editorRenderSystem: EditorRenderSystem;
    let mockAdapter: MockRenderAdapter;
    let callbacks: EditorCallbacks;

    beforeEach(() => {
        // Reset callbacks
        callbacks = {
            onObjectSelected: vi.fn(),
            onObjectModified: vi.fn(),
            onStageModified: vi.fn()
        };

        // Create mock adapter
        mockAdapter = new MockRenderAdapter(callbacks);
        
        // Create editor render system with mock adapter
        editorRenderSystem = new EditorRenderSystem(mockAdapter);
    });

    afterEach(() => {
        editorRenderSystem.dispose();
        mockAdapter.reset();
    });

    describe('Basic Operations', () => {
        it('should initialize with mock adapter', () => {
            expect(editorRenderSystem).toBeDefined();
            expect(editorRenderSystem.getRenderAdapter()).toBe(mockAdapter);
        });

        it('should get editor state from adapter', () => {
            const state = editorRenderSystem.getEditorState();
            expect(state).toEqual({
                selectedTool: 'select',
                selectedObject: null,
                isDrawing: false,
                gridEnabled: true,
                snapToGrid: true
            });
        });

        it('should delegate renderAll to adapter', () => {
            editorRenderSystem.renderAll();
            expect(mockAdapter.renderAllCalled).toBe(1);
        });

        it('should delegate clearCanvas to adapter', () => {
            editorRenderSystem.clearCanvas();
            expect(mockAdapter.clearCanvasCalled).toBe(1);
        });

        it('should delegate dispose to adapter', () => {
            editorRenderSystem.dispose();
            expect(mockAdapter.disposeCalled).toBe(1);
        });
    });

    describe('Tool Management', () => {
        it('should set selected tool via adapter', () => {
            editorRenderSystem.setSelectedTool('spike');
            
            expect(mockAdapter.toolChanges).toContain('spike');
            expect(mockAdapter.getLastToolChange()).toBe('spike');
        });

        it('should handle multiple tool changes', () => {
            editorRenderSystem.setSelectedTool('platform');
            editorRenderSystem.setSelectedTool('goal');
            editorRenderSystem.setSelectedTool('text');
            
            expect(mockAdapter.toolChanges).toEqual(['platform', 'goal', 'text']);
            expect(mockAdapter.getLastToolChange()).toBe('text');
        });
    });

    describe('Grid and Snap Operations', () => {
        it('should toggle grid via adapter', () => {
            const initialGridState = mockAdapter.isGridEnabled();
            
            editorRenderSystem.toggleGrid();
            
            expect(mockAdapter.gridToggles).toBe(1);
            expect(mockAdapter.isGridEnabled()).toBe(!initialGridState);
        });

        it('should toggle snap to grid via adapter', () => {
            const initialSnapState = mockAdapter.isSnapToGridEnabled();
            
            editorRenderSystem.toggleSnapToGrid();
            
            expect(mockAdapter.snapToggles).toBe(1);
            expect(mockAdapter.isSnapToGridEnabled()).toBe(!initialSnapState);
        });

        it('should handle multiple grid toggles', () => {
            editorRenderSystem.toggleGrid();
            editorRenderSystem.toggleGrid();
            editorRenderSystem.toggleGrid();
            
            expect(mockAdapter.gridToggles).toBe(3);
        });
    });

    describe('Object Operations', () => {
        beforeEach(() => {
            // Simulate having a selected object
            const mockObject = { id: 'test-object', type: 'spike' };
            mockAdapter.selectObject(mockObject);
        });

        it('should delete selected object via adapter', () => {
            expect(mockAdapter.hasSelectedObject()).toBe(true);
            
            editorRenderSystem.deleteSelectedObject();
            
            expect(mockAdapter.deleteObjectCalls).toBe(1);
            expect(mockAdapter.hasSelectedObject()).toBe(false);
        });

        it('should duplicate selected object via adapter', () => {
            editorRenderSystem.duplicateSelectedObject();
            
            expect(mockAdapter.duplicateObjectCalls).toBe(1);
        });

        it('should get selected object from adapter state', () => {
            const selectedObject = editorRenderSystem.getSelectedObject();
            expect(selectedObject).toEqual({ id: 'test-object', type: 'spike' });
        });

        it('should not delete when no object selected', () => {
            // Clear selection first
            mockAdapter.selectObject(null);
            expect(mockAdapter.hasSelectedObject()).toBe(false);
            
            editorRenderSystem.deleteSelectedObject();
            
            expect(mockAdapter.deleteObjectCalls).toBe(0);
        });

        it('should not duplicate when no object selected', () => {
            // Clear selection first
            mockAdapter.selectObject(null);
            expect(mockAdapter.hasSelectedObject()).toBe(false);
            
            editorRenderSystem.duplicateSelectedObject();
            
            expect(mockAdapter.duplicateObjectCalls).toBe(0);
        });
    });

    describe('Stage Data Operations', () => {
        const sampleStageData: StageData = {
            id: 1,
            name: 'Test Stage',
            platforms: [
                { x1: 100, y1: 400, x2: 300, y2: 400 }
            ],
            spikes: [
                { x: 200, y: 350, width: 20, height: 30 }
            ],
            goal: { x: 400, y: 200, width: 40, height: 50 },
            startText: { x: 50, y: 450, text: 'START' },
            goalText: { x: 420, y: 180, text: 'GOAL' }
        };

        it('should load stage for editing via adapter', () => {
            editorRenderSystem.loadStageForEditing(sampleStageData);
            
            expect(mockAdapter.stageLoads).toHaveLength(1);
            expect(mockAdapter.getLastStageLoad()).toEqual(sampleStageData);
        });

        it('should export stage data via adapter', () => {
            // Load stage first
            editorRenderSystem.loadStageForEditing(sampleStageData);
            
            const exportedData = editorRenderSystem.exportStageData();
            
            expect(mockAdapter.stageExports).toBe(1);
            expect(exportedData).toEqual(sampleStageData);
        });

        it('should handle updateStageDataFromCanvas call', () => {
            // This method should not throw and should log a message
            expect(() => {
                editorRenderSystem.updateStageDataFromCanvas();
            }).not.toThrow();
        });

        it('should export default stage when none loaded', () => {
            const exportedData = editorRenderSystem.exportStageData();
            
            expect(mockAdapter.stageExports).toBe(1);
            expect(exportedData).toEqual({
                id: 1,
                name: 'Mock Stage',
                platforms: [],
                spikes: [],
                goal: { x: 400, y: 200, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 420, y: 180, text: 'GOAL' }
            });
        });
    });

    describe('Callback Integration', () => {
        it('should trigger onObjectSelected callback through adapter', () => {
            const mockObject = { id: 'test-object', type: 'goal' };
            
            mockAdapter.selectObject(mockObject);
            
            expect(callbacks.onObjectSelected).toHaveBeenCalledWith(mockObject);
        });

        it('should trigger onObjectModified callback through adapter', () => {
            const mockObject = { id: 'test-object', type: 'platform' };
            mockAdapter.selectObject(mockObject);
            
            mockAdapter.simulateObjectModification();
            
            expect(callbacks.onObjectModified).toHaveBeenCalledWith(mockObject);
        });

        it('should trigger onStageModified callback through adapter', () => {
            const modifiedStageData: StageData = {
                id: 2,
                name: 'Modified Stage',
                platforms: [],
                spikes: [],
                goal: { x: 500, y: 300, width: 40, height: 50 },
                startText: { x: 50, y: 450, text: 'START' },
                goalText: { x: 520, y: 280, text: 'GOAL' }
            };
            
            mockAdapter.simulateStageModification(modifiedStageData);
            
            expect(callbacks.onStageModified).toHaveBeenCalledWith(modifiedStageData);
        });
    });

    describe('Adapter Access', () => {
        it('should provide access to underlying render adapter', () => {
            const adapter = editorRenderSystem.getRenderAdapter();
            
            expect(adapter).toBe(mockAdapter);
            expect(adapter).toBeInstanceOf(MockRenderAdapter);
        });

        it('should allow direct adapter operations', () => {
            const adapter = editorRenderSystem.getRenderAdapter();
            
            adapter.setSelectedTool('text');
            adapter.toggleGrid();
            
            expect(mockAdapter.getLastToolChange()).toBe('text');
            expect(mockAdapter.gridToggles).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle adapter operations gracefully', () => {
            expect(() => {
                editorRenderSystem.renderAll();
                editorRenderSystem.clearCanvas();
                editorRenderSystem.setSelectedTool('unknown-tool');
                editorRenderSystem.deleteSelectedObject();
                editorRenderSystem.duplicateSelectedObject();
            }).not.toThrow();
        });

        it('should handle empty or invalid stage data', () => {
            const invalidStageData = {} as StageData;
            
            expect(() => {
                editorRenderSystem.loadStageForEditing(invalidStageData);
            }).not.toThrow();
            
            expect(mockAdapter.stageLoads).toHaveLength(1);
        });
    });

    describe('Performance and State Management', () => {
        it('should track method call counts correctly', () => {
            editorRenderSystem.renderAll();
            editorRenderSystem.renderAll();
            editorRenderSystem.clearCanvas();
            editorRenderSystem.toggleGrid();
            editorRenderSystem.toggleSnapToGrid();
            
            expect(mockAdapter.renderAllCalled).toBe(2);
            expect(mockAdapter.clearCanvasCalled).toBe(1);
            expect(mockAdapter.gridToggles).toBe(1);
            expect(mockAdapter.snapToggles).toBe(1);
        });

        it('should reset adapter state properly', () => {
            // Perform several operations
            editorRenderSystem.renderAll();
            editorRenderSystem.setSelectedTool('spike');
            editorRenderSystem.toggleGrid();
            
            // Reset adapter
            mockAdapter.reset();
            
            // Verify all counters are reset
            expect(mockAdapter.renderAllCalled).toBe(0);
            expect(mockAdapter.toolChanges).toEqual([]);
            expect(mockAdapter.gridToggles).toBe(0);
            
            // Verify state is reset to defaults
            const state = mockAdapter.getEditorState();
            expect(state.selectedTool).toBe('select');
            expect(state.gridEnabled).toBe(true);
            expect(state.snapToGrid).toBe(true);
        });
    });
});
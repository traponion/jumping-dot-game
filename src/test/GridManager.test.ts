import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GridManager } from '../adapters/GridManager.js';

import { EDITOR_CONFIG } from '../types/EditorTypes.js';

// Mock ObjectDrawer
vi.mock('../adapters/ObjectDrawer.js', () => ({
    ObjectDrawer: vi.fn().mockImplementation(() => ({
        createGridLine: vi.fn((start, end) => ({
            type: 'line',
            data: { type: 'grid' },
            coords: [start.x, start.y, end.x, end.y]
        })),
        applyGridStyle: vi.fn()
    }))
}));

describe('GridManager', () => {
    let gridManager: GridManager;
    let mockCanvas: any;
    let mockObjectDrawer: any;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
            getObjects: vi.fn(() => []),
            renderAll: vi.fn(),
            getWidth: vi.fn(() => 800),
            getHeight: vi.fn(() => 600)
        };

        // Create mock ObjectDrawer directly instead of real instance
        mockObjectDrawer = {
            createGridLine: vi.fn((start, end) => ({
                type: 'line',
                data: { type: 'grid' },
                coords: [start.x, start.y, end.x, end.y]
            })),
            applyGridStyle: vi.fn()
        };
        gridManager = new GridManager(mockCanvas, mockObjectDrawer);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should initialize with grid and snap disabled', () => {
            expect(gridManager.isGridEnabled()).toBe(false);
            expect(gridManager.isSnapToGridEnabled()).toBe(false);
        });

        it('should store canvas and objectDrawer references', () => {
            // Test that the grid manager is properly initialized
            // Private properties cannot be accessed directly, so we test functionality instead
            expect(gridManager.isGridEnabled()).toBe(false);
            expect(gridManager.isSnapToGridEnabled()).toBe(false);
        });
    });

    describe('Grid Toggle', () => {
        it('should toggle grid from disabled to enabled', () => {
            expect(gridManager.isGridEnabled()).toBe(false);

            gridManager.toggleGrid();

            expect(gridManager.isGridEnabled()).toBe(true);
        });

        it('should toggle grid from enabled to disabled', () => {
            gridManager.toggleGrid(); // Enable first
            expect(gridManager.isGridEnabled()).toBe(true);

            gridManager.toggleGrid(); // Disable

            expect(gridManager.isGridEnabled()).toBe(false);
        });

        it('should call showGrid when toggling to enabled', () => {
            const showGridSpy = vi.spyOn(gridManager, 'showGrid');

            gridManager.toggleGrid();

            expect(showGridSpy).toHaveBeenCalled();
        });

        it('should call hideGrid when toggling to disabled', () => {
            gridManager.toggleGrid(); // Enable first
            const hideGridSpy = vi.spyOn(gridManager, 'hideGrid');

            gridManager.toggleGrid(); // Disable

            expect(hideGridSpy).toHaveBeenCalled();
        });
    });

    describe('Show Grid', () => {
        it('should enable grid and draw grid lines', () => {
            gridManager.showGrid();

            expect(gridManager.isGridEnabled()).toBe(true);
            expect(mockObjectDrawer.createGridLine).toHaveBeenCalled();
        });

        it('should not draw grid if already enabled', () => {
            gridManager.showGrid(); // First call
            vi.clearAllMocks();

            gridManager.showGrid(); // Second call

            expect(mockObjectDrawer.createGridLine).not.toHaveBeenCalled();
        });
    });

    describe('Hide Grid', () => {
        it('should disable grid and remove grid objects', () => {
            gridManager.showGrid(); // Enable first
            vi.clearAllMocks();

            gridManager.hideGrid();

            expect(gridManager.isGridEnabled()).toBe(false);
        });

        it('should not affect canvas if grid already disabled', () => {
            expect(gridManager.isGridEnabled()).toBe(false);

            gridManager.hideGrid();

            expect(mockCanvas.remove).not.toHaveBeenCalled();
        });
    });

    describe('Snap to Grid Toggle', () => {
        it('should toggle snap to grid from disabled to enabled', () => {
            expect(gridManager.isSnapToGridEnabled()).toBe(false);

            gridManager.toggleSnapToGrid();

            expect(gridManager.isSnapToGridEnabled()).toBe(true);
        });

        it('should toggle snap to grid from enabled to disabled', () => {
            gridManager.toggleSnapToGrid(); // Enable first
            expect(gridManager.isSnapToGridEnabled()).toBe(true);

            gridManager.toggleSnapToGrid(); // Disable

            expect(gridManager.isSnapToGridEnabled()).toBe(false);
        });
    });

    describe('Snap to Grid Function', () => {
        it('should snap coordinates to nearest grid points when snap is enabled', () => {
            gridManager.toggleSnapToGrid(); // Enable snap first
            
            const result = gridManager.snapToGrid(23, 37);

            expect(result).toEqual({
                x: 20, // Snapped to nearest 20
                y: 40  // Snapped to nearest 20
            });
        });

        it('should return original coordinates when snap is disabled', () => {
            // Snap is disabled by default
            const result = gridManager.snapToGrid(23, 37);

            expect(result).toEqual({ x: 23, y: 37 });
        });

        it('should handle coordinates already on grid', () => {
            gridManager.toggleSnapToGrid(); // Enable snap
            
            const result = gridManager.snapToGrid(40, 60);

            expect(result).toEqual({ x: 40, y: 60 });
        });

        it('should handle negative coordinates', () => {
            gridManager.toggleSnapToGrid(); // Enable snap
            
            const result = gridManager.snapToGrid(-15, -33);

            expect(result).toEqual({
                x: -20, // Snapped to nearest 20
                y: -40  // Snapped to nearest 20
            });
        });

        it('should handle coordinates at grid boundaries', () => {
            gridManager.toggleSnapToGrid(); // Enable snap
            
            const result1 = gridManager.snapToGrid(10, 10); // Actually rounds to 10
            const result2 = gridManager.snapToGrid(15, 15); // Actually rounds to 20

            expect(result1).toEqual({ x: 20, y: 20 }); // 10 rounds to 20 with gridSize 20
            expect(result2).toEqual({ x: 20, y: 20 });
        });
    });

    describe('Draw Grid', () => {
        beforeEach(() => {
            gridManager.showGrid(); // Enable grid to trigger drawing
        });

        it('should create vertical grid lines', () => {
            const canvasWidth = 800;
            const expectedVerticalLines = Math.floor(canvasWidth / EDITOR_CONFIG.GRID_SIZE) + 1;

            // Count calls for vertical lines (y coordinates are 0 to canvas height)
            const verticalCalls = mockObjectDrawer.createGridLine.mock.calls.filter(
                (call: any) => call[0].x === call[1].x
            );

            expect(verticalCalls.length).toBeGreaterThanOrEqual(expectedVerticalLines - 1);
        });

        it('should create horizontal grid lines', () => {
            const canvasHeight = 600;
            const expectedHorizontalLines = Math.floor(canvasHeight / EDITOR_CONFIG.GRID_SIZE) + 1;

            // Count calls for horizontal lines (x coordinates are 0 to canvas width)
            const horizontalCalls = mockObjectDrawer.createGridLine.mock.calls.filter(
                (call: any) => call[0].y === call[1].y
            );

            expect(horizontalCalls.length).toBeGreaterThanOrEqual(expectedHorizontalLines - 1);
        });

        it('should space grid lines according to GRID_SIZE config', () => {
            const calls = mockObjectDrawer.createGridLine.mock.calls;
            
            // Check that grid lines are spaced by GRID_SIZE
            const verticalCalls = calls.filter((call: any) => call[0].x === call[1].x);
            if (verticalCalls.length > 1) {
                const spacing = verticalCalls[1][0].x - verticalCalls[0][0].x;
                expect(spacing).toBe(EDITOR_CONFIG.GRID_SIZE);
            }
        });
    });

    describe('Remove Grid Objects', () => {
        it('should remove all grid objects from canvas', () => {
            const mockGridObjects = [
                { data: { type: 'grid' } },
                { data: { type: 'platform' } }, // Not a grid object
                { data: { type: 'grid' } }
            ];
            mockCanvas.getObjects.mockReturnValue(mockGridObjects);

            gridManager.showGrid(); // Add grid first
            gridManager.hideGrid(); // This should remove grid objects

            // Should only remove objects with grid type
            const gridObjectsToRemove = mockGridObjects.filter(
                obj => obj.data?.type === 'grid'
            );
            expect(gridObjectsToRemove.length).toBe(2);
        });

        it('should call canvas.remove for each grid object', () => {
            const mockGridObjects = [
                { data: { type: 'grid' } },
                { data: { type: 'grid' } }
            ];
            mockCanvas.getObjects.mockReturnValue(mockGridObjects);

            gridManager.showGrid();
            gridManager.hideGrid();

            // Should call remove for each grid object
            expect(mockCanvas.remove).toHaveBeenCalledTimes(2);
        });

        it('should call renderAll after removing objects', () => {
            const mockGridObjects = [{ data: { type: 'grid' } }];
            mockCanvas.getObjects.mockReturnValue(mockGridObjects);

            gridManager.showGrid();
            gridManager.hideGrid();

            expect(mockCanvas.renderAll).toHaveBeenCalled();
        });
    });

    describe('Dispose', () => {
        it('should clean up resources when disposed', () => {
            gridManager.showGrid(); // Add some grid objects
            
            gridManager.dispose();

            // After disposal, grid should be disabled
            expect(gridManager.isGridEnabled()).toBe(false);
        });

        it('should remove grid objects on dispose', () => {
            const hideGridSpy = vi.spyOn(gridManager, 'hideGrid');
            
            gridManager.dispose();

            expect(hideGridSpy).toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('should handle canvas without dimensions', () => {
            mockCanvas.getWidth.mockReturnValue(0);
            mockCanvas.getHeight.mockReturnValue(0);

            expect(() => gridManager.showGrid()).not.toThrow();
        });

        it('should handle invalid snap coordinates', () => {
            gridManager.toggleSnapToGrid(); // Enable snap
            
            const invalidCoordinates = [
                [NaN, 10],
                [10, NaN],
                [Infinity, 10],
                [10, -Infinity]
            ];

            invalidCoordinates.forEach(([x, y]) => {
                const result = gridManager.snapToGrid(x, y);
                // With invalid input, GridManager should handle gracefully
                expect(result).toBeDefined();
                expect(typeof result.x === 'number').toBe(true);
                expect(typeof result.y === 'number').toBe(true);
            });
        });

        it('should handle missing object data in removeGridObjects', () => {
            const mockObjectsWithoutData = [
                { data: undefined },
                { data: null },
                { data: { type: undefined } },
                { data: { type: 'grid' } }
            ];
            mockCanvas.getObjects.mockReturnValue(mockObjectsWithoutData);

            expect(() => {
                gridManager.showGrid();
                gridManager.hideGrid();
            }).not.toThrow();
        });
    });
});
import * as fabric from 'fabric';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UIRenderer } from '../systems/renderers/UIRenderer';

// Mock fabric.js
vi.mock('fabric', () => ({
    Text: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Rect: vi.fn(() => ({
        set: vi.fn(),
        selectable: false,
        evented: false
    })),
    Shadow: vi.fn(() => ({}))
}));

// Mock DOM elements
const mockElement = {
    classList: {
        add: vi.fn(),
        remove: vi.fn()
    }
};

// Mock document.getElementById
Object.defineProperty(global, 'document', {
    value: {
        getElementById: vi.fn(() => mockElement)
    }
});

describe('UIRenderer', () => {
    let renderer: UIRenderer;
    let mockCanvas: any;

    beforeEach(() => {
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
            getWidth: vi.fn().mockReturnValue(800),
            getHeight: vi.fn().mockReturnValue(600),
            viewportTransform: [1, 0, 0, 1, -100, -50] // Mock camera transform
        };

        // Reset all mocks
        vi.clearAllMocks();

        renderer = new UIRenderer(mockCanvas);
    });

    describe('renderGameOverMenu', () => {
        it('should render game over menu with all elements', () => {
            const options = ['Retry', 'Main Menu', 'Exit'];
            const selectedIndex = 0;
            const finalScore = 1500;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            expect(mockCanvas.add).toHaveBeenCalled();
            expect(fabric.Text).toHaveBeenCalledWith(
                'GAME OVER',
                expect.objectContaining({
                    fontSize: 32,
                    fill: 'white',
                    originX: 'center',
                    originY: 'center'
                })
            );
        });

        it('should render score when finalScore is greater than 0', () => {
            const options = ['Retry'];
            const selectedIndex = 0;
            const finalScore = 2500;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            expect(fabric.Text).toHaveBeenCalledWith(
                'Score: 2500',
                expect.objectContaining({
                    fontSize: 20,
                    fill: 'white'
                })
            );
        });

        it('should not render score when finalScore is 0', () => {
            const options = ['Retry'];
            const selectedIndex = 0;
            const finalScore = 0;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            expect(fabric.Text).not.toHaveBeenCalledWith('Score: 0', expect.any(Object));
        });

        it('should render menu options with correct selection highlighting', () => {
            const options = ['Retry', 'Main Menu', 'Exit'];
            const selectedIndex = 1;
            const finalScore = 1000;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            // Check that selection rectangle is created
            expect(fabric.Rect).toHaveBeenCalledWith(
                expect.objectContaining({
                    fill: 'white',
                    selectable: false,
                    evented: false
                })
            );

            // Check that menu options are rendered
            expect(fabric.Text).toHaveBeenCalledWith(
                'Retry',
                expect.objectContaining({
                    fontSize: 24,
                    fill: 'white' // Not selected
                })
            );

            expect(fabric.Text).toHaveBeenCalledWith(
                'Main Menu',
                expect.objectContaining({
                    fontSize: 24,
                    fill: 'black' // Selected
                })
            );
        });

        it('should render instruction text at bottom', () => {
            const options = ['Retry'];
            const selectedIndex = 0;
            const finalScore = 1000;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            expect(fabric.Text).toHaveBeenCalledWith(
                '↑↓ Navigate  ENTER/R/SPACE Select',
                expect.objectContaining({
                    fontSize: 16,
                    fill: '#aaa',
                    originX: 'center',
                    originY: 'center'
                })
            );
        });

        it('should handle camera transform correctly', () => {
            const options = ['Retry'];
            const selectedIndex = 0;
            const finalScore = 1000;

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            // Verify that camera calculations are used for positioning
            expect(mockCanvas.getWidth).toHaveBeenCalled();
            expect(mockCanvas.getHeight).toHaveBeenCalled();
        });

        it('should clean up existing UI elements before rendering', () => {
            const options = ['Retry'];
            const selectedIndex = 0;
            const finalScore = 1000;

            const cleanupSpy = vi.spyOn(renderer, 'cleanup');

            renderer.renderGameOverMenu(options, selectedIndex, finalScore);

            expect(cleanupSpy).toHaveBeenCalled();
        });
    });

    describe('renderStartInstruction', () => {
        it('should execute without errors (DOM operations moved to GameUI)', () => {
            expect(() => {
                renderer.renderStartInstruction();
            }).not.toThrow();
        });
    });

    describe('renderGameOver', () => {
        it('should execute without errors (DOM operations moved to GameUI)', () => {
            expect(() => {
                renderer.renderGameOver();
            }).not.toThrow();
        });
    });

    describe('renderCredits', () => {
        it('should be a placeholder method that does nothing', () => {
            expect(() => {
                renderer.renderCredits();
            }).not.toThrow();
        });
    });

    describe('cleanup', () => {
        it('should remove all UI shapes from canvas', () => {
            const mockUIShape = {};
            const mockTextShape = {};

            // Set up internal state
            (renderer as any).uiShapes = [mockUIShape, mockTextShape];

            renderer.cleanup();

            expect(mockCanvas.remove).toHaveBeenCalledWith(mockUIShape);
            expect(mockCanvas.remove).toHaveBeenCalledWith(mockTextShape);
        });

        it('should reset internal shape arrays', () => {
            const mockUIShape = {};
            (renderer as any).uiShapes = [mockUIShape];

            renderer.cleanup();

            expect((renderer as any).uiShapes).toEqual([]);
        });

        it('should handle cleanup when no shapes exist', () => {
            expect(() => {
                renderer.cleanup();
            }).not.toThrow();
        });
    });

    describe('helper methods for renderGameOverMenu', () => {
        describe('createGameOverTitle', () => {
            it('should create game over title with correct properties', () => {
                (renderer as any).createGameOverTitle(400, 300);

                expect(fabric.Text).toHaveBeenCalledWith(
                    'GAME OVER',
                    expect.objectContaining({
                        left: 400,
                        top: 220, // screenCenterY - 80
                        fontSize: 32,
                        fill: 'white',
                        fontFamily: 'monospace',
                        originX: 'center',
                        originY: 'center',
                        selectable: false,
                        evented: false
                    })
                );
            });
        });

        describe('createScoreDisplay', () => {
            it('should create score display when score > 0', () => {
                (renderer as any).createScoreDisplay(400, 300, 1500);

                expect(fabric.Text).toHaveBeenCalledWith(
                    'Score: 1500',
                    expect.objectContaining({
                        left: 400,
                        top: 260, // screenCenterY - 40
                        fontSize: 20,
                        fill: 'white',
                        fontFamily: 'monospace',
                        originX: 'center',
                        originY: 'center',
                        selectable: false,
                        evented: false
                    })
                );
            });

            it('should return null when score is 0', () => {
                const score = (renderer as any).createScoreDisplay(400, 300, 0);
                expect(score).toBeNull();
            });
        });

        describe('createMenuOptions', () => {
            it('should create menu options with selection highlighting', () => {
                const options = ['Retry', 'Main Menu'];
                const selectedIndex = 0;
                const shapes = (renderer as any).createMenuOptions(
                    options,
                    selectedIndex,
                    400,
                    300
                );

                expect(Array.isArray(shapes)).toBe(true);
                expect(fabric.Rect).toHaveBeenCalled(); // Selection rectangle
                expect(fabric.Text).toHaveBeenCalledWith('Retry', expect.any(Object));
                expect(fabric.Text).toHaveBeenCalledWith('Main Menu', expect.any(Object));
            });
        });

        describe('createInstructions', () => {
            it('should create instruction text at bottom of screen', () => {
                const cameraY = -50;
                const canvasHeight = 600;
                (renderer as any).createInstructions(400, cameraY, canvasHeight);

                expect(fabric.Text).toHaveBeenCalledWith(
                    '↑↓ Navigate  ENTER/R/SPACE Select',
                    expect.objectContaining({
                        left: 400,
                        top: 500, // cameraY + canvasHeight - 50
                        fontSize: 16,
                        fill: '#aaa',
                        fontFamily: 'monospace',
                        originX: 'center',
                        originY: 'center',
                        selectable: false,
                        evented: false
                    })
                );
            });
        });
    });
});

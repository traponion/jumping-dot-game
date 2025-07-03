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
        it('should show start screen and hide game over screen', () => {
            renderer.renderStartInstruction();

            expect(document.getElementById).toHaveBeenCalledWith('startScreen');
            expect(document.getElementById).toHaveBeenCalledWith('gameOverScreen');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
        });

        it('should handle missing DOM elements gracefully', () => {
            vi.mocked(document.getElementById).mockReturnValue(null);

            expect(() => {
                renderer.renderStartInstruction();
            }).not.toThrow();
        });
    });

    describe('renderGameOver', () => {
        it('should hide start screen and show game over screen', () => {
            renderer.renderGameOver();

            expect(document.getElementById).toHaveBeenCalledWith('startScreen');
            expect(document.getElementById).toHaveBeenCalledWith('gameOverScreen');
            expect(mockElement.classList.add).toHaveBeenCalledWith('hidden');
            expect(mockElement.classList.remove).toHaveBeenCalledWith('hidden');
        });

        it('should handle missing DOM elements gracefully', () => {
            vi.mocked(document.getElementById).mockReturnValue(null);

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
});

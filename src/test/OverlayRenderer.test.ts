import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { OverlayRenderer } from '../systems/renderers/OverlayRenderer';
import type { MessageConfig } from '../systems/renderers/OverlayRenderer';

// Enhanced fabric.js mock similar to EditorUtils.test.ts
vi.mock('fabric', () => {
    // Create a proper base class for fabric.Object
    class MockFabricObject {
        set = vi.fn();
        data = {};
        text = '';
        fill = '';
        left = 0;
        top = 0;
        width = 0;
        height = 0;
        fontSize = 18;
        fontFamily = 'Arial, sans-serif';
        selectable = false;
        evented = false;
        originX = 'left';
        originY = 'top';
        isPauseOverlay = false;
    }

    // Helper to create specific fabric objects 
    const createMockObject = (type: string) => {
        const obj = new MockFabricObject();
        obj.type = type;
        return obj;
    };

    // Mock constructors that return proper instances
    const MockText = vi.fn().mockImplementation((text, options = {}) => {
        const obj = createMockObject('text');
        obj.text = text;
        Object.assign(obj, options);
        return obj;
    });

    const MockRect = vi.fn().mockImplementation((options = {}) => {
        const obj = createMockObject('rect');
        Object.assign(obj, options);
        return obj;
    });

    // Ensure proper inheritance chain
    MockText.prototype = Object.create(MockFabricObject.prototype);
    MockRect.prototype = Object.create(MockFabricObject.prototype);

    return {
        Object: MockFabricObject,
        Text: MockText,
        Rect: MockRect
    };
});

// Mock setTimeout for testing auto-remove functionality
const mockSetTimeout = vi.fn();
vi.mock('timers', () => ({
    setTimeout: mockSetTimeout,
}));

// Override global setTimeout
(global as any).setTimeout = mockSetTimeout;

describe('OverlayRenderer', () => {
    let overlayRenderer: OverlayRenderer;
    let mockCanvas: any;

    beforeEach(() => {
        vi.clearAllMocks();
        
        mockCanvas = {
            add: vi.fn(),
            remove: vi.fn(),
            getWidth: vi.fn().mockReturnValue(800),
            getHeight: vi.fn().mockReturnValue(600),
        };
        
        // Setup setTimeout mock behavior
        mockSetTimeout.mockImplementation((fn, delay) => {
            // Store the timeout function and delay for manual triggering in tests
            (mockSetTimeout as any).lastCallback = fn;
            (mockSetTimeout as any).lastDelay = delay;
            return 1; // Mock timer ID
        });
        
        overlayRenderer = new OverlayRenderer(mockCanvas);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('constructor', () => {
        it('should initialize with canvas', () => {
            expect(overlayRenderer).toBeDefined();
            expect(overlayRenderer['canvas']).toBe(mockCanvas);
            expect(overlayRenderer['messageElements']).toEqual([]);
        });
    });

    describe('showGameOverOverlay', () => {
        it('should show game over overlay for losing', () => {
            overlayRenderer.showGameOverOverlay(1500, false);

            // Should add 4 elements (overlay rect + 3 text elements)
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(4);
        });

        it('should show win overlay for winning', () => {
            overlayRenderer.showGameOverOverlay(2500, true);

            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(4);
        });

        it('should position elements correctly based on canvas dimensions', () => {
            overlayRenderer.showGameOverOverlay(1000, false);

            // Verify canvas dimensions were called
            expect(mockCanvas.getWidth).toHaveBeenCalled();
            expect(mockCanvas.getHeight).toHaveBeenCalled();
            
            // Check that elements were added
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
        });

        it('should handle different canvas sizes', () => {
            // Change canvas dimensions
            mockCanvas.getWidth.mockReturnValue(1200);
            mockCanvas.getHeight.mockReturnValue(800);

            overlayRenderer.showGameOverOverlay(1000, false);

            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
        });
    });

    describe('showMessage', () => {
        it('should create and display message', () => {
            const config: MessageConfig = {
                text: 'Test Message',
                position: { x: 100, y: 200 },
                fontSize: 20,
                color: '#ff0000',
                duration: 2000
            };

            overlayRenderer.showMessage(config);

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
            expect(overlayRenderer['messageElements']).toHaveLength(1);
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
        });

        it('should auto-remove message after duration', () => {
            const config: MessageConfig = {
                text: 'Auto Remove',
                position: { x: 50, y: 50 },
                fontSize: 16,
                color: '#00ff00',
                duration: 1000
            };

            overlayRenderer.showMessage(config);

            // Verify setTimeout was called with correct duration
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);

            // Manually trigger the timeout callback
            const timeoutCallback = (mockSetTimeout as any).lastCallback;
            timeoutCallback();

            expect(mockCanvas.remove).toHaveBeenCalledTimes(1);
            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });
    });

    describe('showLevelCompleteOverlay', () => {
        it('should show level complete overlay with all elements', () => {
            overlayRenderer.showLevelCompleteOverlay(3, 5000, 500);

            // Should add 4 elements (overlay rect + 3 text elements)
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(4);
        });

        it('should auto-remove after 3 seconds', () => {
            overlayRenderer.showLevelCompleteOverlay(1, 1000, 100);

            // Verify setTimeout was called with 3000ms
            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);

            // Manually trigger the timeout callback
            const timeoutCallback = (mockSetTimeout as any).lastCallback;
            timeoutCallback();

            // Should remove all 4 elements (rect + 3 texts)
            expect(mockCanvas.remove).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });

        it('should handle zero values correctly', () => {
            overlayRenderer.showLevelCompleteOverlay(0, 0, 0);

            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(4);
        });

        it('should handle negative values correctly', () => {
            overlayRenderer.showLevelCompleteOverlay(-1, -500, -50);

            expect(mockCanvas.add).toHaveBeenCalledTimes(4);
            expect(overlayRenderer['messageElements']).toHaveLength(4);
        });
    });

    describe('showPauseOverlay', () => {
        it('should create pause overlay with text and instructions', () => {
            overlayRenderer.showPauseOverlay();

            // Should add 3 elements (overlay rect + 2 text elements)
            expect(mockCanvas.add).toHaveBeenCalledTimes(3);
            expect(overlayRenderer['messageElements']).toHaveLength(3);

            // Verify elements are marked as pause overlay
            const pauseElements = overlayRenderer['messageElements'];
            pauseElements.forEach(element => {
                expect((element as any).isPauseOverlay).toBe(true);
            });
        });

        it('should position pause elements based on canvas center', () => {
            overlayRenderer.showPauseOverlay();

            expect(mockCanvas.getWidth).toHaveBeenCalled();
            expect(mockCanvas.getHeight).toHaveBeenCalled();
            expect(mockCanvas.add).toHaveBeenCalledTimes(3);
        });
    });

    describe('hidePauseOverlay', () => {
        it('should remove only pause overlay elements', () => {
            // Add pause overlay
            overlayRenderer.showPauseOverlay();
            expect(overlayRenderer['messageElements']).toHaveLength(3);

            // Add a regular message
            overlayRenderer.showMessage({
                text: 'Regular message',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 5000
            });
            expect(overlayRenderer['messageElements']).toHaveLength(4);

            // Hide pause overlay
            overlayRenderer.hidePauseOverlay();

            // Should remove 3 pause elements, keep 1 regular message
            expect(mockCanvas.remove).toHaveBeenCalledTimes(3);
            expect(overlayRenderer['messageElements']).toHaveLength(1);
        });

        it('should handle case when no pause overlay exists', () => {
            // Add a regular message
            overlayRenderer.showMessage({
                text: 'Regular message',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 5000
            });

            // Try to hide pause overlay when none exists
            overlayRenderer.hidePauseOverlay();

            // Should not remove anything
            expect(mockCanvas.remove).not.toHaveBeenCalled();
            expect(overlayRenderer['messageElements']).toHaveLength(1);
        });
    });

    describe('clearOverlays', () => {
        it('should remove all overlay elements', () => {
            // Add multiple overlays
            overlayRenderer.showGameOverOverlay(1000, false);
            overlayRenderer.showPauseOverlay();
            overlayRenderer.showMessage({
                text: 'Test message',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 5000
            });

            expect(overlayRenderer['messageElements']).toHaveLength(8); // 4 + 3 + 1

            overlayRenderer.clearOverlays();

            expect(mockCanvas.remove).toHaveBeenCalledTimes(8);
            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });

        it('should handle empty overlay list', () => {
            overlayRenderer.clearOverlays();

            expect(mockCanvas.remove).not.toHaveBeenCalled();
            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });
    });

    describe('dispose', () => {
        it('should clear all overlays', () => {
            const clearOverlaysSpy = vi.spyOn(overlayRenderer, 'clearOverlays');
            
            overlayRenderer.dispose();
            
            expect(clearOverlaysSpy).toHaveBeenCalled();
        });
    });

    describe('canvas dimension handling', () => {
        it('should adapt to different canvas sizes', () => {
            // Test with small canvas
            mockCanvas.getWidth.mockReturnValue(400);
            mockCanvas.getHeight.mockReturnValue(300);

            overlayRenderer.showGameOverOverlay(1000, false);
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);

            // Test with large canvas
            mockCanvas.getWidth.mockReturnValue(1920);
            mockCanvas.getHeight.mockReturnValue(1080);

            overlayRenderer.showPauseOverlay();
            expect(mockCanvas.add).toHaveBeenCalledTimes(7); // 4 + 3
        });
    });

    describe('error handling and edge cases', () => {
        it('should handle very large values correctly', () => {
            overlayRenderer.showGameOverOverlay(999999, true);
            expect(mockCanvas.add).toHaveBeenCalledTimes(4);

            overlayRenderer.showLevelCompleteOverlay(999, 999999, 99999);
            expect(mockCanvas.add).toHaveBeenCalledTimes(8); // 4 + 4
        });

        it('should handle empty message text', () => {
            overlayRenderer.showMessage({
                text: '',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 1000
            });

            expect(mockCanvas.add).toHaveBeenCalledTimes(1);
        });

        it('should handle zero duration for messages', () => {
            overlayRenderer.showMessage({
                text: 'Zero duration',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 0
            });

            expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 0);
        });

        it('should handle multiple pause overlays', () => {
            overlayRenderer.showPauseOverlay();
            overlayRenderer.showPauseOverlay();

            expect(overlayRenderer['messageElements']).toHaveLength(6); // 3 + 3

            overlayRenderer.hidePauseOverlay();

            expect(mockCanvas.remove).toHaveBeenCalledTimes(6);
            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });
    });

    describe('timeout behavior', () => {
        it('should handle timeout callbacks correctly', () => {
            // Add message with timeout
            overlayRenderer.showMessage({
                text: 'Timeout test',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 1000
            });

            expect(overlayRenderer['messageElements']).toHaveLength(1);

            // Trigger timeout
            const timeoutCallback = (mockSetTimeout as any).lastCallback;
            timeoutCallback();

            expect(overlayRenderer['messageElements']).toHaveLength(0);
        });

        it('should handle multiple timeouts', () => {
            // Add multiple messages with different durations
            overlayRenderer.showMessage({
                text: 'Message 1',
                position: { x: 100, y: 100 },
                fontSize: 16,
                color: '#ffffff',
                duration: 1000
            });

            overlayRenderer.showMessage({
                text: 'Message 2',
                position: { x: 200, y: 200 },
                fontSize: 16,
                color: '#ffffff',
                duration: 2000
            });

            expect(overlayRenderer['messageElements']).toHaveLength(2);
            expect(mockSetTimeout).toHaveBeenCalledTimes(2);
        });
    });
});
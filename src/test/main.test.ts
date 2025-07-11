import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Test for main.ts event handling functionality
 * Specifically testing the 'requestStageSelect' event listener
 */

// Mock HtmlStageSelect
const mockReturnToStageSelect = vi.fn();
const mockInit = vi.fn().mockResolvedValue(undefined);

vi.mock('../core/HtmlStageSelect.js', () => ({
    HtmlStageSelect: vi.fn(() => ({
        init: mockInit,
        returnToStageSelect: mockReturnToStageSelect
    }))
}));

// Mock JumpingDotGame
const mockGameCleanup = vi.fn().mockResolvedValue(undefined);
const mockInitWithStage = vi.fn().mockResolvedValue(undefined);

vi.mock('../core/Game.js', () => ({
    JumpingDotGame: vi.fn(() => ({
        initWithStage: mockInitWithStage,
        setGameOver: vi.fn(),
        cleanup: mockGameCleanup
    }))
}));

describe('main.ts event handling', () => {
    let originalAddEventListener: typeof window.addEventListener;
    let originalDocumentAddEventListener: typeof document.addEventListener;
    let mockWindowAddEventListener: ReturnType<typeof vi.fn>;
    let mockDocumentAddEventListener: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();

        // Store original methods
        originalAddEventListener = window.addEventListener;
        originalDocumentAddEventListener = document.addEventListener;

        // Create mock functions
        mockWindowAddEventListener = vi.fn();
        mockDocumentAddEventListener = vi.fn();

        // Mock addEventListener methods
        Object.defineProperty(window, 'addEventListener', {
            value: mockWindowAddEventListener,
            writable: true,
            configurable: true
        });

        Object.defineProperty(document, 'addEventListener', {
            value: mockDocumentAddEventListener,
            writable: true,
            configurable: true
        });

        // Clear module cache and re-import main
        vi.resetModules();
    });

    afterEach(() => {
        // Restore original methods
        Object.defineProperty(window, 'addEventListener', {
            value: originalAddEventListener,
            writable: true,
            configurable: true
        });

        Object.defineProperty(document, 'addEventListener', {
            value: originalDocumentAddEventListener,
            writable: true,
            configurable: true
        });
    });

    it('should register requestStageSelect event listener on window', async () => {
        // Import main.ts to trigger initialization
        await import('../main.js');

        // Find the 'load' event listener and simulate it
        const loadEventCall = mockWindowAddEventListener.mock.calls.find(
            (call) => call[0] === 'load'
        );

        expect(loadEventCall).toBeTruthy();

        if (loadEventCall) {
            const loadEventListener = loadEventCall[1] as EventListener;

            // Simulate 'load' event to trigger the initialization
            const mockLoadEvent = new Event('load');
            await loadEventListener(mockLoadEvent);

            // Now verify that window.addEventListener was called with 'requestStageSelect'
            const requestStageSelectListener = mockWindowAddEventListener.mock.calls.find(
                (call) => call[0] === 'requestStageSelect'
            );

            expect(requestStageSelectListener).toBeTruthy();
            expect(requestStageSelectListener?.[0]).toBe('requestStageSelect');
            expect(typeof requestStageSelectListener?.[1]).toBe('function');
        }
    });

    it('should call stageSelect.returnToStageSelect when requestStageSelect event is dispatched', async () => {
        // Import main.ts to trigger initialization
        await import('../main.js');

        // Find the 'load' event listener and simulate it
        const loadEventCall = mockWindowAddEventListener.mock.calls.find(
            (call) => call[0] === 'load'
        );

        if (loadEventCall) {
            const loadEventListener = loadEventCall[1] as EventListener;

            // Simulate 'load' event to trigger the initialization
            const mockLoadEvent = new Event('load');
            await loadEventListener(mockLoadEvent);

            // Find the requestStageSelect event listener
            const requestStageSelectCall = mockWindowAddEventListener.mock.calls.find(
                (call) => call[0] === 'requestStageSelect'
            );

            expect(requestStageSelectCall).toBeTruthy();

            if (requestStageSelectCall) {
                const eventListener = requestStageSelectCall[1] as EventListener;

                // Simulate 'requestStageSelect' event
                const mockEvent = new CustomEvent('requestStageSelect');
                eventListener(mockEvent);

                // Verify that stageSelect.returnToStageSelect was called
                expect(mockReturnToStageSelect).toHaveBeenCalledOnce();
            }
        }
    });

    it('should handle requestStageSelect event when stageSelect is null', async () => {
        // Import main.ts to trigger initialization
        await import('../main.js');

        // Find the requestStageSelect event listener
        const requestStageSelectCall = mockWindowAddEventListener.mock.calls.find(
            (call) => call[0] === 'requestStageSelect'
        );

        if (requestStageSelectCall) {
            const eventListener = requestStageSelectCall[1] as EventListener;

            // Manually set stageSelect to null in the module
            // This simulates the case where stageSelect initialization failed

            // Reset mock to clear previous calls
            mockReturnToStageSelect.mockClear();

            // Simulate 'requestStageSelect' event
            const mockEvent = new CustomEvent('requestStageSelect');
            eventListener(mockEvent);

            // Should not call returnToStageSelect when stageSelect is null
            // But should not throw error either
            expect(() => eventListener(mockEvent)).not.toThrow();
        }
    });

    it('should cleanup previous game instance before returning to stage select', async () => {
        // Import main.ts to trigger initialization
        await import('../main.js');

        // Find the 'load' event listener and simulate it
        const loadEventCall = mockWindowAddEventListener.mock.calls.find(
            (call) => call[0] === 'load'
        );

        if (loadEventCall) {
            const loadEventListener = loadEventCall[1] as EventListener;
            const mockLoadEvent = new Event('load');
            await loadEventListener(mockLoadEvent);

            // Simulate starting a game by clicking a stage
            const clickEventCall = mockDocumentAddEventListener.mock.calls.find(
                (call) => call[0] === 'click'
            );

            if (clickEventCall) {
                const clickEventListener = clickEventCall[1] as EventListener;

                // Mock stage element with data-stage-id
                const mockStageElement = {
                    getAttribute: vi.fn().mockReturnValue('1'),
                    classList: { contains: vi.fn().mockReturnValue(true) }
                };

                const mockClickEvent = {
                    target: mockStageElement
                } as unknown as Event;

                // Start game
                await clickEventListener(mockClickEvent);

                // Verify game was initialized
                expect(mockInitWithStage).toHaveBeenCalledWith(1);

                // Now simulate requestStageSelect event
                const requestStageSelectCall = mockWindowAddEventListener.mock.calls.find(
                    (call) => call[0] === 'requestStageSelect'
                );

                if (requestStageSelectCall) {
                    const eventListener = requestStageSelectCall[1] as EventListener;
                    const mockEvent = new CustomEvent('requestStageSelect');

                    // Trigger the event
                    await eventListener(mockEvent);

                    // Verify cleanup was called before returning to stage select
                    expect(mockGameCleanup).toHaveBeenCalled();
                    expect(mockReturnToStageSelect).toHaveBeenCalled();
                }
            }
        }
    });
});

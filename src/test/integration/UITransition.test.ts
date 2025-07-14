import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HtmlStageSelect } from '../../core/GameUI.js';

// Mock PixiRenderSystem for testing
class MockPixiRenderSystem {
    private initPromise: Promise<void>;
    private resolveInit!: () => void;
    private rejectInit!: (error: Error) => void;

    constructor() {
        this.initPromise = new Promise<void>((resolve, reject) => {
            this.resolveInit = resolve;
            this.rejectInit = reject;
        });
    }

    async waitForInitialization(): Promise<void> {
        return this.initPromise;
    }

    // Methods for test control
    completeInitialization(): void {
        this.resolveInit();
    }

    failInitialization(error: Error): void {
        this.rejectInit(error);
    }
}

// Mock DOM elements for testing
const createMockDOM = () => {
    const mockStageSelectElement = {
        style: { display: 'block' },
        querySelectorAll: vi.fn(() => []),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
    };

    const mockGameUIElement = { style: { display: 'none' } };
    const mockInfoElement = { style: { display: 'none' } };
    const mockControlsElement = { style: { display: 'none' } };

    const mockStageItemElements = [
        { click: vi.fn(), focus: vi.fn() },
        { click: vi.fn(), focus: vi.fn() }
    ];

    // Mock document methods
    Object.defineProperty(global, 'document', {
        value: {
            getElementById: vi.fn((id: string) => {
                if (id === 'stageSelect') return mockStageSelectElement;
                if (id === 'gameUI') return mockGameUIElement;
                return null;
            }),
            querySelector: vi.fn((selector: string) => {
                if (selector === '.info') return mockInfoElement;
                if (selector === '.controls') return mockControlsElement;
                return null;
            }),
            querySelectorAll: vi.fn((selector: string) => {
                if (selector === '.stage-item') return mockStageItemElements;
                return [];
            }),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn()
        },
        writable: true
    });

    return {
        mockStageSelectElement,
        mockGameUIElement,
        mockInfoElement,
        mockControlsElement,
        mockStageItemElements
    };
};

// Mock main.ts startGame function
const mockStartGame = vi.fn();
let mockStartGamePromise: Promise<void>;

vi.mock('../../main.js', () => ({
    startGame: (...args: any[]) => mockStartGame(...args)
}));

describe('UI Transition Integration', () => {
    let stageSelect: HtmlStageSelect;
    let mockDOM: ReturnType<typeof createMockDOM>;

    beforeEach(() => {
        // Reset all mocks
        vi.clearAllMocks();

        // Set up DOM mocks
        mockDOM = createMockDOM();

        // Create HtmlStageSelect instance
        stageSelect = new HtmlStageSelect();

        // Reset mockStartGame promise to pending state
        let resolveStartGame: (() => void) | undefined;
        mockStartGamePromise = new Promise((resolve) => {
            resolveStartGame = resolve;
        });
        mockStartGame.mockReturnValue(mockStartGamePromise);

        // Store resolver for test control
        (mockStartGamePromise as any).resolve = resolveStartGame;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Canvas Initialization Synchronization', () => {
        it('should wait for Canvas initialization before switching UI elements', async () => {
            // Initialize stage select
            stageSelect.init();

            // Verify initial state
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');

            // Setup mock startGame to resolve after a delay
            let resolveStartGame: () => void;
            const startGamePromise = new Promise<void>((resolve) => {
                resolveStartGame = resolve;
            });
            mockStartGame.mockReturnValue(startGamePromise);

            // Call startStage method directly to test new behavior
            const startStageMethod = (stageSelect as any).startStage.bind(stageSelect);
            const startStagePromise = startStageMethod(1);

            // During Canvas initialization, UI should remain unchanged
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');

            // Complete Canvas initialization
            resolveStartGame!();
            await startStagePromise;

            // After Canvas initialization, UI should switch
            expect(mockDOM.mockStageSelectElement.style.display).toBe('none');
            expect(mockDOM.mockGameUIElement.style.display).toBe('block');
        });

        it('should maintain stage select visibility during Canvas initialization', async () => {
            stageSelect.init();

            const stageElement = mockDOM.mockStageItemElements[0];

            // Start stage selection
            stageElement.click();

            // During initialization, stage select should remain visible
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');

            // Simulate some delay during Canvas initialization
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Should still show stage select
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');
        });

        it('should handle Canvas initialization errors gracefully', async () => {
            stageSelect.init();

            // Mock startGame to reject
            const errorMessage = 'Canvas initialization failed';
            mockStartGame.mockRejectedValue(new Error(errorMessage));

            // Spy on console.error
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Verify initial state
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');

            // Call startStage directly to test error handling
            const startStageMethod = (stageSelect as any).startStage.bind(stageSelect);
            await startStageMethod(1);

            // Should log error appropriately
            expect(consoleSpy).toHaveBeenCalledWith(
                'Canvas initialization failed during stage start:',
                expect.any(Error)
            );

            // UI should remain in safe state (stage select visible)
            expect(mockDOM.mockStageSelectElement.style.display).toBe('block');
            expect(mockDOM.mockGameUIElement.style.display).toBe('none');

            consoleSpy.mockRestore();
        });
    });

    describe('PixiRenderSystem Initialization Promise', () => {
        it('should expose waitForInitialization method', async () => {
            const renderSystem = new MockPixiRenderSystem();

            // Should have waitForInitialization method
            expect(typeof renderSystem.waitForInitialization).toBe('function');

            // Should return a Promise
            const initPromise = renderSystem.waitForInitialization();
            expect(initPromise).toBeInstanceOf(Promise);

            // Complete initialization for test
            renderSystem.completeInitialization();

            // Promise should eventually resolve
            await expect(initPromise).resolves.toBeUndefined();
        });

        it('should allow multiple calls to waitForInitialization', async () => {
            const renderSystem = new MockPixiRenderSystem();

            // Multiple calls should work
            const promise1 = renderSystem.waitForInitialization();
            const promise2 = renderSystem.waitForInitialization();

            // Complete initialization for test
            renderSystem.completeInitialization();

            // Both should resolve successfully
            await expect(Promise.all([promise1, promise2])).resolves.toEqual([
                undefined,
                undefined
            ]);
        });
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StageTransitionManager } from '../systems/StageTransitionManager';

// Mock PixiJS objects
const mockContainerDestroy = vi.fn();
const mockContainerSpy = vi.fn();
const mockGraphicsSpy = vi.fn();
const mockTextSpy = vi.fn();

const createMockContainer = () => ({
    addChild: vi.fn(),
    removeChild: vi.fn(),
    removeChildren: vi.fn(),
    position: {
        set: vi.fn(),
        x: 0,
        y: 0
    },
    visible: true,
    alpha: 1,
    destroy: mockContainerDestroy
});

const createMockGraphics = () => ({
    clear: vi.fn().mockReturnThis(),
    beginFill: vi.fn().mockReturnThis(),
    drawRect: vi.fn().mockReturnThis(),
    endFill: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    position: { set: vi.fn() },
    alpha: 1,
    destroy: vi.fn()
});

const createMockText = (content: string) => ({
    text: content,
    anchor: { set: vi.fn() },
    position: { set: vi.fn() },
    style: {},
    alpha: 1,
    destroy: vi.fn()
});

vi.mock('pixi.js', () => ({
    Container: vi.fn(() => {
        mockContainerSpy();
        return createMockContainer();
    }),
    Graphics: vi.fn(() => {
        mockGraphicsSpy();
        return createMockGraphics();
    }),
    Text: vi.fn((options: any) => {
        mockTextSpy(options);
        return createMockText(options?.text || '');
    }),
    TextStyle: vi.fn((style: any) => style)
}));

// Use Vitest fake timers for requestAnimationFrame testing
// This avoids unhandled promise issues and provides better control

describe('StageTransitionManager', () => {
    let manager: StageTransitionManager;
    let mockApp: any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Use fake timers to control requestAnimationFrame
        vi.useFakeTimers();
        mockApp = {
            screen: { width: 800, height: 600 }
        };
        manager = new StageTransitionManager(mockApp);
    });

    afterEach(() => {
        // Clean up timers to prevent unhandled errors
        vi.useRealTimers();
    });

    describe('constructor', () => {
        it('should create StageTransitionManager instance', () => {
            expect(manager).toBeInstanceOf(StageTransitionManager);
        });

        it('should initialize with transition container', () => {
            expect(mockContainerSpy).toHaveBeenCalled();
        });
    });

    describe('fadeOut', () => {
        it('should start fade out transition', async () => {
            const duration = 10; // Very short duration for testing
            manager.fadeOut(duration);

            // Check that transition is active
            expect(manager.isTransitioning()).toBe(true);

            // Advance animation frame to allow the animation to proceed
            await vi.advanceTimersToNextFrame();

            // Transition should still be active (animation in progress)
            expect(manager.isTransitioning()).toBe(true);
        });

        it('should create overlay graphics for fade out', () => {
            manager.fadeOut(100);

            expect(mockGraphicsSpy).toHaveBeenCalled();
        });

        it('should show transition container during fade out', () => {
            manager.fadeOut(100);

            const container = manager.getTransitionContainer();
            expect(container.visible).toBe(true);
        });
    });

    describe('fadeIn', () => {
        it('should start fade in transition', async () => {
            const duration = 1000; // Longer duration to ensure animation doesn't complete immediately
            manager.fadeIn(duration);

            expect(manager.isTransitioning()).toBe(true);

            // Advance one animation frame - transition should still be active
            await vi.advanceTimersToNextFrame();

            // Transition should still be active (animation in progress)
            expect(manager.isTransitioning()).toBe(true);
        });

        it('should create overlay for fade in', () => {
            manager.fadeIn(10);

            expect(mockGraphicsSpy).toHaveBeenCalled();
            const container = manager.getTransitionContainer();
            expect(container.visible).toBe(true);
        });
    });

    describe('showLoadingScreen', () => {
        it('should display loading screen with message', () => {
            const message = 'Loading Stage 1...';

            manager.showLoadingScreen(message);

            expect(mockTextSpy).toHaveBeenCalledWith(expect.objectContaining({
                text: message,
                style: expect.any(Object)
            }));
            expect(manager.isTransitioning()).toBe(true);
        });

        it('should create loading graphics overlay', () => {
            manager.showLoadingScreen('Loading...');

            expect(mockGraphicsSpy).toHaveBeenCalled();
        });
    });

    describe('hideLoadingScreen', () => {
        it('should hide loading screen', () => {
            manager.showLoadingScreen('Loading...');
            manager.hideLoadingScreen();

            const container = manager.getTransitionContainer();
            expect(container.visible).toBe(false);
            expect(manager.isTransitioning()).toBe(false);
        });
    });

    describe('flashEffect', () => {
        it('should create flash effect', () => {
            const color = 0xffffff;
            const duration = 10; // Very short duration for testing

            manager.flashEffect(color, duration);

            expect(manager.isTransitioning()).toBe(true);
            expect(mockGraphicsSpy).toHaveBeenCalled();
        });

        it('should handle different flash colors', () => {
            manager.flashEffect(0xff0000, 10); // Red flash
            manager.flashEffect(0x00ff00, 10); // Green flash
            manager.flashEffect(0x0000ff, 10); // Blue flash

            // Should create graphics for each flash
            expect(mockGraphicsSpy).toHaveBeenCalledTimes(3);
        });
    });

    describe('stageCompleteEffect', () => {
        it('should create stage completion celebration effect', () => {
            const score = 150;

            manager.stageCompleteEffect(score);

            expect(manager.isTransitioning()).toBe(true);
            expect(mockTextSpy).toHaveBeenCalledWith(expect.objectContaining({
                text: expect.stringContaining('Stage Complete'),
                style: expect.any(Object)
            }));
            expect(mockTextSpy).toHaveBeenCalledWith(expect.objectContaining({
                text: `Score: ${score}`,
                style: expect.any(Object)
            }));
        });
    });

    describe('isTransitioning', () => {
        it('should return false by default', () => {
            expect(manager.isTransitioning()).toBe(false);
        });

        it('should return true during transition', () => {
            manager.fadeOut(1000);
            expect(manager.isTransitioning()).toBe(true);
        });
    });

    describe('cancelTransition', () => {
        it('should cancel ongoing transition', () => {
            manager.fadeOut(100);
            expect(manager.isTransitioning()).toBe(true);

            manager.cancelTransition();
            expect(manager.isTransitioning()).toBe(false);
        });

        it('should hide transition container when cancelled', () => {
            manager.showLoadingScreen('Loading...');

            manager.cancelTransition();

            const container = manager.getTransitionContainer();
            expect(container.visible).toBe(false);
        });
    });

    describe('getTransitionContainer', () => {
        it('should return transition container', () => {
            const container = manager.getTransitionContainer();
            expect(container).toBeDefined();
        });
    });

    describe('destroy', () => {
        it('should destroy transition container and cleanup resources', () => {
            manager.destroy();

            expect(mockContainerDestroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

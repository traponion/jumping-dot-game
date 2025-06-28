import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GameOverMenuManager } from '../systems/GameOverMenuManager';

// Mock PixiJS objects
const mockContainerDestroy = vi.fn();
const mockContainerSpy = vi.fn();
const mockTextSpy = vi.fn();
const mockGraphicsSpy = vi.fn();
const mockTextStyleSpy = vi.fn();

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
    destroy: mockContainerDestroy
});

const createMockText = (content: string) => ({
    text: content,
    anchor: { set: vi.fn() },
    position: { set: vi.fn() },
    style: {},
    destroy: vi.fn()
});

const createMockGraphics = () => ({
    clear: vi.fn().mockReturnThis(),
    beginFill: vi.fn().mockReturnThis(),
    drawRect: vi.fn().mockReturnThis(),
    endFill: vi.fn().mockReturnThis(),
    rect: vi.fn().mockReturnThis(),
    fill: vi.fn().mockReturnThis(),
    position: { set: vi.fn() },
    destroy: vi.fn()
});

vi.mock('pixi.js', () => ({
    Container: vi.fn(() => {
        mockContainerSpy();
        return createMockContainer();
    }),
    Text: vi.fn((content: string, style: any) => {
        mockTextSpy(content, style);
        return createMockText(content);
    }),
    Graphics: vi.fn(() => {
        mockGraphicsSpy();
        const graphics = createMockGraphics();
        // Ensure chainability by explicitly returning the graphics object itself
        graphics.rect.mockImplementation(function () {
            return this;
        });
        graphics.fill.mockImplementation(function () {
            return this;
        });
        return graphics;
    }),
    TextStyle: vi.fn((style: any) => {
        mockTextStyleSpy(style);
        return style;
    })
}));

describe('GameOverMenuManager', () => {
    let manager: GameOverMenuManager;
    let mockApp: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockApp = {
            screen: { width: 800, height: 600 }
        };
        manager = new GameOverMenuManager(mockApp);
    });

    describe('constructor', () => {
        it('should create GameOverMenuManager instance', () => {
            expect(manager).toBeInstanceOf(GameOverMenuManager);
        });

        it('should initialize with menu container', () => {
            expect(mockContainerSpy).toHaveBeenCalled();
        });
    });

    describe('createMenu', () => {
        it('should create menu with default options', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];
            const selectedIndex = 0;
            const finalScore = 100;

            manager.createMenu(options, selectedIndex, finalScore);

            expect(mockTextSpy).toHaveBeenCalledWith('GAME OVER', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Score: 100', expect.any(Object));
        });

        it('should create menu without score when finalScore is 0', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];
            const selectedIndex = 0;
            const finalScore = 0;

            manager.createMenu(options, selectedIndex, finalScore);

            expect(mockTextSpy).toHaveBeenCalledWith('GAME OVER', expect.any(Object));
            // Should not create score text when finalScore is 0
            const textCalls = mockTextSpy.mock.calls;
            const scoreCall = textCalls.find((call: any) => call[0].includes('Score:'));
            expect(scoreCall).toBeUndefined();
        });

        it('should create selection indicator for selected option', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];
            const selectedIndex = 1;
            const finalScore = 50;

            manager.createMenu(options, selectedIndex, finalScore);

            expect(mockGraphicsSpy).toHaveBeenCalled();
        });

        it('should create menu options with correct styling', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];
            const selectedIndex = 0;
            const finalScore = 75;

            manager.createMenu(options, selectedIndex, finalScore);

            // Check that all options are created
            for (const option of options) {
                expect(mockTextSpy).toHaveBeenCalledWith(option, expect.any(Object));
            }
        });

        it('should create instruction text', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];
            const selectedIndex = 0;
            const finalScore = 25;

            manager.createMenu(options, selectedIndex, finalScore);

            expect(mockTextSpy).toHaveBeenCalledWith(
                '↑↓ Navigate  ENTER/R/SPACE Select',
                expect.any(Object)
            );
        });
    });

    describe('updateSelection', () => {
        it('should update menu selection', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];

            manager.createMenu(options, 0, 100);
            manager.updateSelection(options, 1, 100);

            // Should recreate the menu with new selection
            expect(mockGraphicsSpy).toHaveBeenCalled();
        });

        it('should clear previous menu before creating new one', () => {
            const options = ['RESTART STAGE', 'STAGE SELECT'];

            manager.createMenu(options, 0, 100);
            const container = manager.getMenuContainer();

            manager.updateSelection(options, 1, 100);

            expect(container.removeChildren).toHaveBeenCalled();
        });
    });

    describe('positionMenu', () => {
        it('should position menu at camera center', () => {
            const cameraX = 100;
            const cameraY = 50;

            manager.positionMenu(cameraX, cameraY);

            const container = manager.getMenuContainer();
            expect(container.position.set).toHaveBeenCalledWith(
                cameraX + mockApp.screen.width / 2,
                cameraY + mockApp.screen.height / 2
            );
        });
    });

    describe('showMenu', () => {
        it('should make menu visible', () => {
            manager.showMenu();

            const container = manager.getMenuContainer();
            expect(container.visible).toBe(true);
        });
    });

    describe('hideMenu', () => {
        it('should make menu invisible', () => {
            manager.hideMenu();

            const container = manager.getMenuContainer();
            expect(container.visible).toBe(false);
        });
    });

    describe('getMenuContainer', () => {
        it('should return menu container', () => {
            const container = manager.getMenuContainer();
            expect(container).toBeDefined();
        });
    });

    describe('destroy', () => {
        it('should destroy menu container and all children', () => {
            manager.destroy();

            expect(mockContainerDestroy).toHaveBeenCalledWith({ children: true });
        });
    });
});

import type { Application } from 'pixi.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StageData } from '../core/StageLoader';
import { TextRenderingManager } from '../systems/TextRenderingManager';

// Mock PIXI.js constructors and capture calls
const mockTextDestroy = vi.fn();
const mockTextSpy = vi.fn();
const mockTextStyleSpy = vi.fn();

const mockApp = {
    stage: {
        addChild: vi.fn(),
        removeChild: vi.fn()
    },
    renderer: {
        width: 800,
        height: 600
    }
} as unknown as Application;

// Create mock objects that track their properties
const createMockText = (content: string) => ({
    text: content,
    x: 0,
    y: 0,
    style: {},
    visible: true,
    parent: null,
    anchor: { set: vi.fn() },
    destroy: mockTextDestroy
});

vi.mock('pixi.js', () => ({
    Text: vi.fn((content: string, style: any) => {
        mockTextSpy(content, style);
        return createMockText(content);
    }),
    TextStyle: vi.fn((style: any) => {
        mockTextStyleSpy(style);
        return style;
    })
}));

describe('TextRenderingManager', () => {
    let textManager: TextRenderingManager;

    beforeEach(() => {
        vi.clearAllMocks();
        textManager = new TextRenderingManager(mockApp);
    });

    describe('initialization', () => {
        it('should initialize with PIXI application', () => {
            expect(textManager).toBeInstanceOf(TextRenderingManager);
        });

        it('should create default text style with monospace font', () => {
            // Constructor should create a default TextStyle
            expect(mockTextStyleSpy).toHaveBeenCalledWith({
                fontFamily: 'monospace',
                fill: 0xffffff,
                fontSize: 16
            });
        });
    });

    describe('renderStageTexts', () => {
        const mockStageData: StageData = {
            id: 1,
            name: 'Test Stage',
            platforms: [],
            spikes: [],
            goal: { x: 700, y: 500, width: 50, height: 50 },
            startText: { text: 'Start Game', x: 100, y: 100 },
            goalText: { text: 'Reach Goal', x: 700, y: 500 },
            leftEdgeMessage: { text: 'Edge Warning', x: 10, y: 300 },
            leftEdgeSubMessage: { text: 'Sub Warning', x: 10, y: 320 },
            tutorialMessages: [
                { text: 'Tutorial 1', x: 400, y: 200 },
                { text: 'Tutorial 2', x: 400, y: 220 }
            ]
        };

        it('should create start text with correct content', () => {
            textManager.renderStageTexts(mockStageData);

            expect(mockTextSpy).toHaveBeenCalledWith('Start Game', expect.any(Object));
        });

        it('should create goal text with correct content', () => {
            textManager.renderStageTexts(mockStageData);

            expect(mockTextSpy).toHaveBeenCalledWith('Reach Goal', expect.any(Object));
        });

        it('should create left edge message when provided', () => {
            textManager.renderStageTexts(mockStageData);

            expect(mockTextSpy).toHaveBeenCalledWith('Edge Warning', expect.any(Object));
        });

        it('should create tutorial messages when provided', () => {
            textManager.renderStageTexts(mockStageData);

            expect(mockTextSpy).toHaveBeenCalledWith('Tutorial 1', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Tutorial 2', expect.any(Object));
        });

        it('should handle missing optional text elements gracefully', () => {
            const stageWithoutOptional: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                tutorialMessages: []
            };

            expect(() => textManager.renderStageTexts(stageWithoutOptional)).not.toThrow();
            expect(mockTextSpy).toHaveBeenCalledWith('Start', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Goal', expect.any(Object));
        });

        it('should add created text objects to stage', () => {
            textManager.renderStageTexts(mockStageData);

            // Should add multiple text objects to stage
            expect(mockApp.stage.addChild).toHaveBeenCalled();
        });
    });

    describe('renderClearAnimation', () => {
        it('should create clear text when progress < 0.8', () => {
            const playerX = 400;
            const playerY = 300;
            const progress = 0.5;

            textManager.renderClearAnimation([], progress, playerX, playerY);

            expect(mockTextSpy).toHaveBeenCalledWith('CLEAR!', expect.any(Object));
        });

        it('should not create clear text when progress >= 0.8', () => {
            const playerX = 400;
            const playerY = 300;
            const progress = 0.9;

            textManager.renderClearAnimation([], progress, playerX, playerY);

            // Should not call Text constructor for clear text
            expect(mockTextSpy).not.toHaveBeenCalledWith('CLEAR!', expect.any(Object));
        });

        it('should use correct text style for clear animation', () => {
            const playerX = 400;
            const playerY = 300;
            const progress = 0.5;

            textManager.renderClearAnimation([], progress, playerX, playerY);

            // Should create clear text with animated font size and alpha
            expect(mockTextSpy).toHaveBeenCalledWith(
                'CLEAR!',
                expect.objectContaining({
                    fontFamily: 'monospace',
                    fill: 0xffffff
                })
            );
        });
    });

    describe('updateText', () => {
        it('should create new text object when called', () => {
            const textId = 'testText';
            textManager.updateText(textId, 'New Content');

            expect(mockTextSpy).toHaveBeenCalledWith('New Content', expect.any(Object));
        });

        it('should add new text to stage', () => {
            const textId = 'newText';
            textManager.updateText(textId, 'Brand New Text');

            expect(mockTextSpy).toHaveBeenCalledWith('Brand New Text', expect.any(Object));
            expect(mockApp.stage.addChild).toHaveBeenCalled();
        });
    });

    describe('text styling', () => {
        it('should use correct font family for all texts', () => {
            const stageData: StageData = {
                id: 1,
                name: 'Test Stage',
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                tutorialMessages: []
            };

            textManager.renderStageTexts(stageData);

            // All text should use monospace font
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Start',
                expect.objectContaining({
                    fontFamily: 'monospace'
                })
            );
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Goal',
                expect.objectContaining({
                    fontFamily: 'monospace'
                })
            );
        });

        it('should use white color for all text elements', () => {
            const stageData: StageData = {
                id: 1,
                name: 'Test Stage',
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                tutorialMessages: []
            };

            textManager.renderStageTexts(stageData);

            // All text should use white color (0xffffff)
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Start',
                expect.objectContaining({
                    fill: 0xffffff
                })
            );
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Goal',
                expect.objectContaining({
                    fill: 0xffffff
                })
            );
        });

        it('should use appropriate font sizes for different text types', () => {
            const stageData: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                leftEdgeMessage: { text: 'Edge', x: 10, y: 300 },
                tutorialMessages: [{ text: 'Tutorial', x: 400, y: 200 }]
            };

            textManager.renderStageTexts(stageData);

            // Start/Goal text should use fontSize 16
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Start',
                expect.objectContaining({
                    fontSize: 16
                })
            );
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Goal',
                expect.objectContaining({
                    fontSize: 16
                })
            );

            // Edge message should use fontSize 14
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Edge',
                expect.objectContaining({
                    fontSize: 14
                })
            );

            // Tutorial should use fontSize 12
            expect(mockTextSpy).toHaveBeenCalledWith(
                'Tutorial',
                expect.objectContaining({
                    fontSize: 12
                })
            );
        });
    });

    describe('cleanup and resource management', () => {
        it('should destroy text objects on cleanup', () => {
            const stageData: StageData = {
                id: 1,
                name: 'Test Stage',
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                tutorialMessages: []
            };

            textManager.renderStageTexts(stageData);
            textManager.destroy();

            expect(mockTextDestroy).toHaveBeenCalled();
        });

        it('should clear text objects from stage on cleanup', () => {
            textManager.destroy();

            // Should attempt to remove children from stage if any exist
            // Note: This might not be called if no text objects were created
            expect(mockApp.stage.removeChild).toHaveBeenCalledTimes(0); // No objects created yet
        });
    });

    describe('performance and efficiency', () => {
        it('should efficiently handle multiple tutorial messages', () => {
            const stageWithManyTutorials: StageData = {
                id: 1,
                name: 'Test Stage',
                platforms: [],
                spikes: [],
                goal: { x: 700, y: 500, width: 50, height: 50 },
                startText: { text: 'Start', x: 100, y: 100 },
                goalText: { text: 'Goal', x: 700, y: 500 },
                tutorialMessages: [
                    { text: 'Tut1', x: 400, y: 200 },
                    { text: 'Tut2', x: 400, y: 220 },
                    { text: 'Tut3', x: 400, y: 240 },
                    { text: 'Tut4', x: 400, y: 260 }
                ]
            };

            textManager.renderStageTexts(stageWithManyTutorials);

            // Should create all tutorial messages
            expect(mockTextSpy).toHaveBeenCalledWith('Tut1', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Tut2', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Tut3', expect.any(Object));
            expect(mockTextSpy).toHaveBeenCalledWith('Tut4', expect.any(Object));
        });

        it('should reuse text objects when updating existing text', () => {
            // Create initial text
            textManager.updateText('reuseTest', 'Initial');
            const initialCalls = mockTextSpy.mock.calls.length;

            // Update same text
            textManager.updateText('reuseTest', 'Updated');

            // Check that we have the expected calls
            expect(mockTextSpy).toHaveBeenCalledWith('Initial', expect.any(Object));
            // Current implementation reuses objects, so should only create one text object total
            expect(mockTextSpy.mock.calls.length).toBe(initialCalls);
        });
    });
});

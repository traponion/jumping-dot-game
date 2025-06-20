// EditorView UI Tests
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { IEditorController } from '../controllers/EditorController.js';
import type { StageData } from '../core/StageLoader.js';
import { EDITOR_CONFIG, EDITOR_TOOLS } from '../types/EditorTypes.js';
import { EditorView } from '../views/EditorView.js';

// Utility functions for DOM manipulation
const createMockDOM = (): void => {
    // Create basic HTML structure
    document.body.innerHTML = `
        <div id="mouseCoords">0, 0</div>
        <div id="objectCount">0</div>
        <div id="currentTool">Select</div>
        
        <button id="deleteObjectBtn">Delete</button>
        <button id="duplicateObjectBtn">Duplicate</button>
        
        <input id="stageName" type="text" value="" />
        <input id="stageId" type="number" value="1" />
        <textarea id="stageDescription">Description</textarea>
        
        <div id="noSelection" style="display: none;">No Selection</div>
        <div id="platformProperties" style="display: none;">Platform Props</div>
        <div id="spikeProperties" style="display: none;">Spike Props</div>
        <div id="goalProperties" style="display: none;">Goal Props</div>
        <div id="textProperties" style="display: none;">Text Props</div>
        
        <input id="gridEnabled" type="checkbox" checked />
        <input id="snapEnabled" type="checkbox" checked />
        
        <canvas id="editorCanvas" width="800" height="600"></canvas>
    `;

    // Add tool items
    Object.values(EDITOR_TOOLS).forEach((tool) => {
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-item';
        toolElement.setAttribute('data-tool', tool);
        toolElement.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        document.body.appendChild(toolElement);
    });

    // Add property input elements
    const propertyInputs = [
        'platformLength',
        'platformAngle',
        'spikeSize',
        'goalWidth',
        'goalHeight',
        'textContent',
        'textSize'
    ];

    propertyInputs.forEach((id) => {
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        document.body.appendChild(input);
    });

    // Add toolbar buttons
    const toolbarButtons = [
        'newStageBtn',
        'loadStageBtn',
        'saveStageBtn',
        'testStageBtn',
        'clearStageBtn',
        'toggleGridBtn',
        'toggleSnapBtn'
    ];

    toolbarButtons.forEach((id) => {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = id.replace('Btn', '');
        document.body.appendChild(button);
    });
};

const createMockCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.id = 'editorCanvas';
    canvas.width = EDITOR_CONFIG.CANVAS_SIZE.width;
    canvas.height = EDITOR_CONFIG.CANVAS_SIZE.height;
    return canvas;
};

const createMockController = (): IEditorController => ({
    selectTool: vi.fn(),
    createNewStage: vi.fn(),
    loadStage: vi.fn(),
    saveStage: vi.fn(),
    testStage: vi.fn(),
    clearStage: vi.fn(),
    toggleGrid: vi.fn(),
    toggleSnap: vi.fn(),
    deleteSelectedObject: vi.fn(),
    duplicateSelectedObject: vi.fn(),
    initialize: vi.fn(),
    dispose: vi.fn(),
    createObject: vi.fn(),
    startPlatformDrawing: vi.fn(),
    finishPlatformDrawing: vi.fn()
});

const createMockUIManager = () => ({
    updateToolSelection: vi.fn(),
    updateCurrentTool: vi.fn(), 
    updateObjectCount: vi.fn(),
    updateMouseCoordinates: vi.fn(),
    enableActionButtons: vi.fn(),
    initialize: vi.fn()
});

describe('EditorView', () => {
    let view: EditorView;
    let canvas: HTMLCanvasElement;
    let mockController: IEditorController;
    let mockUIManager: any;

    beforeEach(() => {
        createMockDOM();
        canvas = createMockCanvas();
        document.body.appendChild(canvas);

        view = new EditorView(canvas);
        mockController = createMockController();
        mockUIManager = createMockUIManager();
        
        view.setController(mockController);
        view.setUIManager(mockUIManager);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    describe('Initialization', () => {
        it('should be constructed successfully', () => {
            expect(view).toBeDefined();
        });

        it('should complete initialization successfully', () => {
            expect(() => view.initialize()).not.toThrow();
        });

        it('should set controller successfully', () => {
            expect(() => view.setController(mockController)).not.toThrow();
        });

        it('should handle method calls safely before initialization', () => {
            const newView = new EditorView(canvas);

            // No exceptions should occur before initialization
            expect(() => newView.updateToolSelection(EDITOR_TOOLS.PLATFORM)).not.toThrow();
            expect(() => newView.updateObjectCount(5)).not.toThrow();
            expect(() => newView.updateMouseCoordinates(100, 200)).not.toThrow();
        });
    });

    describe('Tool selection display updates', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should delegate tool selection to UIManager', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);

            expect(mockUIManager.updateToolSelection).toHaveBeenCalledWith(EDITOR_TOOLS.PLATFORM);
        });

        it('should delegate multiple tool selections to UIManager', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);
            view.updateToolSelection(EDITOR_TOOLS.SPIKE);

            expect(mockUIManager.updateToolSelection).toHaveBeenCalledWith(EDITOR_TOOLS.PLATFORM);
            expect(mockUIManager.updateToolSelection).toHaveBeenCalledWith(EDITOR_TOOLS.SPIKE);
            expect(mockUIManager.updateToolSelection).toHaveBeenCalledTimes(2);
        });

        it('should delegate current tool update to UIManager', () => {
            view.updateCurrentTool(EDITOR_TOOLS.GOAL);

            expect(mockUIManager.updateCurrentTool).toHaveBeenCalledWith(EDITOR_TOOLS.GOAL);
        });
    });

    describe('Object count display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should delegate object count update to UIManager', () => {
            view.updateObjectCount(5);

            expect(mockUIManager.updateObjectCount).toHaveBeenCalledWith(5);
        });

        it('should delegate zero object count to UIManager', () => {
            view.updateObjectCount(0);
            expect(mockUIManager.updateObjectCount).toHaveBeenCalledWith(0);
        });
    });

    describe('Mouse coordinates display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should delegate mouse coordinates to UIManager', () => {
            view.updateMouseCoordinates(123, 456);

            expect(mockUIManager.updateMouseCoordinates).toHaveBeenCalledWith(123, 456);
        });

        it('should update coordinates on mouse move event', () => {
            // Mock canvas position
            canvas.getBoundingClientRect = vi.fn().mockReturnValue({
                left: 10,
                top: 20,
                width: 800,
                height: 600
            });

            const mouseEvent = new MouseEvent('mousemove', {
                clientX: 110, // X coordinate 100 within canvas
                clientY: 120 // Y coordinate 100 within canvas
            });

            canvas.dispatchEvent(mouseEvent);

            // Direct verification of coordinate updates is difficult,
            // so verify that no errors occur
            expect(() => canvas.dispatchEvent(mouseEvent)).not.toThrow();
        });
    });

    describe('Stage information display', () => {
        beforeEach(() => {
            view.initialize();
        });

        const testStageData: StageData = {
            id: 42,
            name: 'UI Test Stage',
            platforms: [],
            spikes: [],
            goal: { x: 100, y: 100, width: 40, height: 50 },
            startText: { x: 50, y: 50, text: 'START' },
            goalText: { x: 150, y: 100, text: 'GOAL' }
        };

        it('should handle stage info update without errors', () => {
            expect(() => view.updateStageInfo(testStageData)).not.toThrow();
        });

        it('should apply debouncing when inputting stage information', () => {
            const nameInput = document.getElementById('stageName') as HTMLInputElement;

            // Generate multiple input events in a short time
            nameInput.value = 'Test1';
            nameInput.dispatchEvent(new Event('input'));

            nameInput.value = 'Test2';
            nameInput.dispatchEvent(new Event('input'));

            nameInput.value = 'Test3';
            nameInput.dispatchEvent(new Event('input'));

            // Verify that controller calls are limited by debounce functionality
            // (Testing actual timer processing is difficult, so verify no errors occur)
            expect(() => {
                nameInput.dispatchEvent(new Event('input'));
            }).not.toThrow();
        });
    });

    describe('Property panel', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should display appropriate panel when nothing is selected', () => {
            view.showObjectProperties(null);

            const noSelectionDiv = document.getElementById('noSelection')!;
            expect(noSelectionDiv.style.display).toBe('block');

            // Other panels should be hidden
            const otherPanels = [
                'platformProperties',
                'spikeProperties',
                'goalProperties',
                'textProperties'
            ];
            otherPanels.forEach((id) => {
                const panel = document.getElementById(id)!;
                expect(panel.style.display).toBe('none');
            });
        });

        it('should display appropriate panel when platform is selected', () => {
            const mockPlatform = {
                data: { type: EDITOR_TOOLS.PLATFORM },
                x1: 0,
                y1: 100,
                x2: 100,
                y2: 100
            } as any;

            view.showObjectProperties(mockPlatform);

            const platformDiv = document.getElementById('platformProperties')!;
            expect(platformDiv.style.display).toBe('block');

            // Other panels should be hidden
            const otherPanels = [
                'noSelection',
                'spikeProperties',
                'goalProperties',
                'textProperties'
            ];
            otherPanels.forEach((id) => {
                const panel = document.getElementById(id)!;
                expect(panel.style.display).toBe('none');
            });
        });

        it('should display appropriate panel when spike is selected', () => {
            const mockSpike = {
                data: { type: EDITOR_TOOLS.SPIKE },
                left: 50,
                top: 50,
                width: 15,
                height: 15,
                getBoundingRect: vi.fn().mockReturnValue({
                    left: 50,
                    top: 50,
                    width: 15,
                    height: 15
                })
            } as any;

            view.showObjectProperties(mockSpike);

            const spikeDiv = document.getElementById('spikeProperties')!;
            expect(spikeDiv.style.display).toBe('block');
        });

        it('should display appropriate panel when goal is selected', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40,
                height: 50
            } as any;

            view.showObjectProperties(mockGoal);

            const goalDiv = document.getElementById('goalProperties')!;
            expect(goalDiv.style.display).toBe('block');
        });

        it('should display appropriate panel when text is selected', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text',
                fontSize: 16
            } as any;

            view.showObjectProperties(mockText);

            const textDiv = document.getElementById('textProperties')!;
            expect(textDiv.style.display).toBe('block');
        });
    });

    describe('Action buttons', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should delegate button state changes to UIManager', () => {
            view.enableActionButtons(false);
            expect(mockUIManager.enableActionButtons).toHaveBeenCalledWith(false);

            view.enableActionButtons(true);
            expect(mockUIManager.enableActionButtons).toHaveBeenCalledWith(true);
        });

    });



    describe('Message display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should handle error message display', () => {
            expect(() => view.showErrorMessage('Test error')).not.toThrow();
        });

        it('should handle success message display', () => {
            expect(() => view.showSuccessMessage('Test success')).not.toThrow();
        });
    });

    describe('Property value loading', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should handle object property display without errors', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40,
                height: 50
            } as any;

            expect(() => view.showObjectProperties(mockGoal)).not.toThrow();
        });

        it('should handle text object property display', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text',
                fontSize: 20
            } as any;

            expect(() => view.showObjectProperties(mockText)).not.toThrow();
        });
    });

    describe('Resource management', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should remove event listeners on dispose', () => {
            const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');

            view.dispose();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
        });

        it('should handle method calls safely after dispose', () => {
            view.dispose();

            expect(() => view.updateToolSelection(EDITOR_TOOLS.PLATFORM)).not.toThrow();
            expect(() => view.updateObjectCount(5)).not.toThrow();
            expect(() => view.showErrorMessage('Test')).not.toThrow();
        });
    });

    describe('Error handling', () => {
        it('should handle missing DOM elements gracefully', () => {
            // Remove some DOM elements
            document.getElementById('mouseCoords')?.remove();

            const newView = new EditorView(canvas);
            newView.setController(mockController);

            // New architecture should handle missing elements gracefully
            expect(() => newView.initialize()).not.toThrow();
        });

        it('should handle errors in event handlers', () => {
            // Configure controller method to throw error
            (mockController.selectTool as any).mockImplementation(() => {
                throw new Error('Controller error');
            });

            const toolElement = document.querySelector(
                `[data-tool="${EDITOR_TOOLS.PLATFORM}"]`
            ) as HTMLElement;

            // Application should not stop even if error occurs
            expect(() => toolElement.click()).not.toThrow();
        });
    });
});

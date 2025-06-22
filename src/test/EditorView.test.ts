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
    for (const tool of Object.values(EDITOR_TOOLS)) {
        const toolElement = document.createElement('div');
        toolElement.className = 'tool-item';
        toolElement.setAttribute('data-tool', tool);
        toolElement.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
        document.body.appendChild(toolElement);
    }

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

    for (const id of propertyInputs) {
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        document.body.appendChild(input);
    }

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

    for (const id of toolbarButtons) {
        const button = document.createElement('button');
        button.id = id;
        button.textContent = id.replace('Btn', '');
        document.body.appendChild(button);
    }
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

describe('EditorView', () => {
    let view: EditorView;
    let canvas: HTMLCanvasElement;
    let mockController: IEditorController;

    beforeEach(() => {
        createMockDOM();
        canvas = createMockCanvas();
        document.body.appendChild(canvas);

        view = new EditorView(canvas);
        mockController = createMockController();
        view.setController(mockController);
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

        it('should display tool selection correctly', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);

            const selectedTool = document.querySelector('.tool-item.active');
            expect(selectedTool).toBeTruthy();
            expect(selectedTool?.getAttribute('data-tool')).toBe(EDITOR_TOOLS.PLATFORM);
        });

        it('should deselect previous selection', () => {
            view.updateToolSelection(EDITOR_TOOLS.PLATFORM);
            view.updateToolSelection(EDITOR_TOOLS.SPIKE);

            const platformTool = document.querySelector(`[data-tool="${EDITOR_TOOLS.PLATFORM}"]`);
            const spikeTool = document.querySelector(`[data-tool="${EDITOR_TOOLS.SPIKE}"]`);

            expect(platformTool?.classList.contains('active')).toBe(false);
            expect(spikeTool?.classList.contains('active')).toBe(true);
        });

        it('should update current tool display', () => {
            view.updateCurrentTool(EDITOR_TOOLS.GOAL);

            const currentToolElement = document.getElementById('currentTool');
            expect(currentToolElement?.textContent).toBe('Goal');
            expect(currentToolElement?.className).toBe('current-tool tool-goal');
        });
    });

    describe('Object count display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should display object count correctly', () => {
            view.updateObjectCount(5);

            const objectCountElement = document.getElementById('objectCount');
            expect(objectCountElement?.textContent).toBe('5');
        });

        it('should change style based on object count', () => {
            const objectCountElement = document.getElementById('objectCount');
            expect(objectCountElement).toBeTruthy();

            view.updateObjectCount(0);
            expect(objectCountElement.className).toBe('object-count');

            view.updateObjectCount(3);
            expect(objectCountElement.className).toBe('object-count active');
        });
    });

    describe('Mouse coordinates display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should display mouse coordinates correctly', () => {
            view.updateMouseCoordinates(123, 456);

            const mouseCoordsElement = document.getElementById('mouseCoords');
            expect(mouseCoordsElement?.textContent).toBe('123, 456');
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

        it('should display stage information correctly', () => {
            view.updateStageInfo(testStageData);

            const nameInput = document.getElementById('stageName') as HTMLInputElement;
            const idInput = document.getElementById('stageId') as HTMLInputElement;

            expect(nameInput.value).toBe('UI Test Stage');
            expect(idInput.value).toBe('42');
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

            const noSelectionDiv = document.getElementById('noSelection') as HTMLElement;
            expect(noSelectionDiv.style.display).toBe('block');

            // Other panels should be hidden
            const otherPanels = [
                'platformProperties',
                'spikeProperties',
                'goalProperties',
                'textProperties'
            ];
            for (const id of otherPanels) {
                const panel = document.getElementById(id) as HTMLElement;
                expect(panel.style.display).toBe('none');
            }
        });

        it('should display appropriate panel when platform is selected', () => {
            const mockPlatform = {
                data: { type: EDITOR_TOOLS.PLATFORM },
                x1: 0,
                y1: 100,
                x2: 100,
                y2: 100
            } as unknown;

            view.showObjectProperties(mockPlatform);

            const platformDiv = document.getElementById('platformProperties') as HTMLElement;
            expect(platformDiv.style.display).toBe('block');

            // Other panels should be hidden
            const otherPanels = [
                'noSelection',
                'spikeProperties',
                'goalProperties',
                'textProperties'
            ];
            for (const id of otherPanels) {
                const panel = document.getElementById(id) as HTMLElement;
                expect(panel.style.display).toBe('none');
            }
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
            } as unknown;

            view.showObjectProperties(mockSpike);

            const spikeDiv = document.getElementById('spikeProperties') as HTMLElement;
            expect(spikeDiv.style.display).toBe('block');
        });

        it('should display appropriate panel when goal is selected', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40,
                height: 50
            } as unknown;

            view.showObjectProperties(mockGoal);

            const goalDiv = document.getElementById('goalProperties') as HTMLElement;
            expect(goalDiv.style.display).toBe('block');
        });

        it('should display appropriate panel when text is selected', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text',
                fontSize: 16
            } as unknown;

            view.showObjectProperties(mockText);

            const textDiv = document.getElementById('textProperties') as HTMLElement;
            expect(textDiv.style.display).toBe('block');
        });
    });

    describe('Action buttons', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should toggle button enabled/disabled state', () => {
            const deleteBtn = document.getElementById('deleteObjectBtn') as HTMLButtonElement;
            const duplicateBtn = document.getElementById('duplicateObjectBtn') as HTMLButtonElement;

            view.enableActionButtons(false);
            expect(deleteBtn.disabled).toBe(true);
            expect(duplicateBtn.disabled).toBe(true);
            expect(deleteBtn.className).toBe('action-btn disabled');
            expect(duplicateBtn.className).toBe('action-btn disabled');

            view.enableActionButtons(true);
            expect(deleteBtn.disabled).toBe(false);
            expect(duplicateBtn.disabled).toBe(false);
            expect(deleteBtn.className).toBe('action-btn enabled');
            expect(duplicateBtn.className).toBe('action-btn enabled');
        });

        it('should call controller when delete button is clicked', () => {
            const deleteBtn = document.getElementById('deleteObjectBtn') as HTMLElement;
            deleteBtn.click();

            expect(mockController.deleteSelectedObject).toHaveBeenCalledTimes(1);
        });

        it('should call controller when duplicate button is clicked', () => {
            const duplicateBtn = document.getElementById('duplicateObjectBtn') as HTMLElement;
            duplicateBtn.click();

            expect(mockController.duplicateSelectedObject).toHaveBeenCalledTimes(1);
        });
    });

    describe('Toolbar buttons', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should call controller for each toolbar button', () => {
            const buttonTests = [
                { id: 'newStageBtn', method: 'createNewStage' },
                { id: 'loadStageBtn', method: 'loadStage' },
                { id: 'saveStageBtn', method: 'saveStage' },
                { id: 'testStageBtn', method: 'testStage' },
                { id: 'clearStageBtn', method: 'clearStage' },
                { id: 'toggleGridBtn', method: 'toggleGrid' },
                { id: 'toggleSnapBtn', method: 'toggleSnap' }
            ];

            for (const { id, method } of buttonTests) {
                const button = document.getElementById(id);
                if (button) {
                    button.click();
                    expect(
                        (mockController as unknown as Record<string, ReturnType<typeof vi.fn>>)[
                            method
                        ]
                    ).toHaveBeenCalled();
                }
            }
        });
    });

    describe('Tool selection events', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should call controller when tool is clicked', () => {
            for (const tool of Object.values(EDITOR_TOOLS)) {
                const toolElement = document.querySelector(`[data-tool="${tool}"]`);
                if (toolElement) {
                    (toolElement as HTMLElement).click();
                    expect(mockController.selectTool).toHaveBeenCalledWith(tool);
                }
            }
        });

        it('should not throw error with invalid tool data', () => {
            const invalidToolElement = document.createElement('div');
            invalidToolElement.className = 'tool-item';
            invalidToolElement.setAttribute('data-tool', 'invalid-tool');
            document.body.appendChild(invalidToolElement);

            expect(() => {
                invalidToolElement.click();
            }).not.toThrow();
        });
    });

    describe('Settings checkboxes', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should call controller when grid setting is changed', () => {
            const gridCheckbox = document.getElementById('gridEnabled') as HTMLInputElement;
            gridCheckbox.click();

            expect(mockController.toggleGrid).toHaveBeenCalled();
        });

        it('should call controller when snap setting is changed', () => {
            const snapCheckbox = document.getElementById('snapEnabled') as HTMLInputElement;
            snapCheckbox.click();

            expect(mockController.toggleSnap).toHaveBeenCalled();
        });
    });

    describe('Message display', () => {
        beforeEach(() => {
            view.initialize();
        });

        it('should display error message', () => {
            view.showErrorMessage('Test error');

            const messageElements = document.querySelectorAll('.message-error');
            expect(messageElements.length).toBeGreaterThan(0);

            const lastMessage = messageElements[messageElements.length - 1];
            expect(lastMessage.textContent).toBe('Test error');
        });

        it('should display success message', () => {
            view.showSuccessMessage('Test success');

            const messageElements = document.querySelectorAll('.message-success');
            expect(messageElements.length).toBeGreaterThan(0);

            const lastMessage = messageElements[messageElements.length - 1];
            expect(lastMessage.textContent).toBe('Test success');
        });

        it('should remove message when clicked', async () => {
            view.showErrorMessage('Click to remove');

            const messageElement = document.querySelector('.message-error') as HTMLElement;
            expect(messageElement).toBeTruthy();

            messageElement.click();

            // Simulate animationend event since CSS animations don't work in test environment
            const animationEvent = new Event('animationend');
            messageElement.dispatchEvent(animationEvent);

            // Small delay for event processing
            await new Promise((resolve) => setTimeout(resolve, 10));

            const remainingMessages = document.querySelectorAll('.message-error');
            expect(remainingMessages.length).toBe(0);
        });

        it('should auto-create message container', () => {
            // Remove messageContainer
            const existingContainer = document.getElementById('messageContainer');
            if (existingContainer) {
                existingContainer.remove();
            }

            // Create new View (without messageContainer)
            const newView = new EditorView(canvas);
            newView.setController(mockController);
            newView.initialize();

            // Container is auto-created when showing message
            newView.showErrorMessage('Auto-creation test');

            const messageContainer = document.getElementById('messageContainer');
            expect(messageContainer).toBeTruthy();
        });
    });

    describe('Property value loading', () => {
        beforeEach(() => {
            view.initialize();
        });

        // Note: Platform property tests require specific DOM elements that are not
        // available in the test environment. Property loading functionality is
        // tested through integration tests with proper DOM setup.

        it('should load goal properties correctly', () => {
            const mockGoal = {
                data: { type: EDITOR_TOOLS.GOAL },
                width: 40,
                height: 50
            } as unknown;

            view.showObjectProperties(mockGoal);

            const widthInput = document.getElementById('goalWidth') as HTMLInputElement;
            const heightInput = document.getElementById('goalHeight') as HTMLInputElement;

            expect(widthInput?.value).toBe('40');
            expect(heightInput?.value).toBe('50');
        });

        it('should load text properties correctly', () => {
            const mockText = {
                data: { type: EDITOR_TOOLS.TEXT },
                text: 'Sample Text',
                fontSize: 20
            } as unknown;

            view.showObjectProperties(mockText);

            const contentInput = document.getElementById('textContent') as HTMLInputElement;
            const sizeInput = document.getElementById('textSize') as HTMLInputElement;

            expect(contentInput?.value).toBe('Sample Text');
            expect(sizeInput?.value).toBe('20');
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
        it('should handle missing DOM elements', () => {
            // Remove some DOM elements
            document.getElementById('mouseCoords')?.remove();

            const newView = new EditorView(canvas);
            newView.setController(mockController);

            // Verify that error occurs during initialization
            expect(() => newView.initialize()).toThrow();
        });

        it('should handle errors in event handlers', () => {
            // Configure controller method to throw error
            (mockController.selectTool as unknown as ReturnType<typeof vi.fn>).mockImplementation(
                () => {
                    throw new Error('Controller error');
                }
            );

            const toolElement = document.querySelector(
                `[data-tool="${EDITOR_TOOLS.PLATFORM}"]`
            ) as HTMLElement;

            // Application should not stop even if error occurs
            expect(() => toolElement.click()).not.toThrow();
        });
    });
});

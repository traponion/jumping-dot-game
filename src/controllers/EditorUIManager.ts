/**
 * @fileoverview UI state management and event handling for the stage editor
 * @module controllers/EditorUIManager
 * @description Manages UI updates, store changes, and object selection events.
 * Separated to maintain single responsibility principle.
 */

import { DebugHelper } from '../utils/EditorUtils.js';
import type { FabricObjectWithData } from '../types/EditorTypes.js';
import type { StageData } from '../core/StageLoader.js';

/**
 * Editor store interface for state management
 */
export interface EditorStore {
    editor: { selectedTool: string };
    performance: { objectCount: number };
    stage: StageData | null;
    setSelectedObject(object: FabricObjectWithData | null): void;
    setStageData(stageData: StageData): void;
}

/**
 * View interface for UI updates
 */
export interface IEditorView {
    updateToolSelection(tool: string): void;
    updateCurrentTool(tool: string): void;
    updateObjectCount(count: number): void;
    updateStageInfo(stageData: StageData): void;
    showObjectProperties(object: FabricObjectWithData | null): void;
    enableActionButtons(enabled: boolean): void;
}

/**
 * Model interface for data access
 */
export interface IEditorModel {
    getObjectCount(): number;
    setCurrentStage(stageData: StageData): void;
}

/**
 * UI state management and event handling for the stage editor
 * @description Manages UI updates, store changes, and object selection events.
 * Separated to maintain single responsibility principle.
 */
export class EditorUIManager {
    private view: IEditorView;
    private model: IEditorModel;
    private store: EditorStore;
    private isInitialized: boolean = false;
    private controller!: any; // Will be set during initialization
    
    // UI Elements cache
    private uiElements!: {
        // Display elements
        mouseCoords: HTMLElement;
        objectCount: HTMLElement;
        currentTool: HTMLElement;

        // Action elements
        deleteBtn: HTMLButtonElement;
        duplicateBtn: HTMLButtonElement;

        // Stage info elements
        stageNameInput: HTMLInputElement;
        stageIdInput: HTMLInputElement;
        stageDescInput: HTMLTextAreaElement;

        // Property panel elements
        noSelectionDiv: HTMLElement;
        platformPropsDiv: HTMLElement;
        spikePropsDiv: HTMLElement;
        goalPropsDiv: HTMLElement;
        textPropsDiv: HTMLElement;

        // Settings elements
        gridEnabledCheckbox: HTMLInputElement;
        snapEnabledCheckbox: HTMLInputElement;

        // Message elements
        messageContainer: HTMLElement;
    };

    private toolItems!: NodeListOf<Element>;

    /**
     * Creates new EditorUIManager instance
     * @param view - Editor view for UI updates
     * @param model - Editor model for data access
     * @param store - Editor store for state management
     */
    constructor(view: IEditorView, model: IEditorModel, store: EditorStore) {
        this.view = view;
        this.model = model;
        this.store = store;
    }

    /**
     * Initialize UI manager with controller and DOM elements
     */
    public initialize(controller: any): void {
        this.controller = controller;
        this.initializeUIElements();
        this.setupEventListeners();
        this.isInitialized = true;
    }

    /**
     * Initialize UI elements cache
     */
    private initializeUIElements(): void {
        // Tool palette elements
        this.toolItems = document.querySelectorAll('.tool-item');

        // Create message container if it doesn't exist
        let messageContainer = this.getOptionalElement('messageContainer');
        if (!messageContainer) {
            messageContainer = this.createMessageContainer();
        }

        // Cache all required UI elements
        this.uiElements = {
            mouseCoords: this.getRequiredElement('mouseCoords'),
            objectCount: this.getRequiredElement('objectCount'),
            currentTool: this.getRequiredElement('currentTool'),
            deleteBtn: this.getRequiredElement<HTMLButtonElement>('deleteObjectBtn'),
            duplicateBtn: this.getRequiredElement<HTMLButtonElement>('duplicateObjectBtn'),
            stageNameInput: this.getRequiredElement<HTMLInputElement>('stageName'),
            stageIdInput: this.getRequiredElement<HTMLInputElement>('stageId'),
            stageDescInput: this.getRequiredElement<HTMLTextAreaElement>('stageDescription'),
            noSelectionDiv: this.getRequiredElement('noSelection'),
            platformPropsDiv: this.getRequiredElement('platformProperties'),
            spikePropsDiv: this.getRequiredElement('spikeProperties'),
            goalPropsDiv: this.getRequiredElement('goalProperties'),
            textPropsDiv: this.getRequiredElement('textProperties'),
            gridEnabledCheckbox: this.getRequiredElement<HTMLInputElement>('gridEnabled'),
            snapEnabledCheckbox: this.getRequiredElement<HTMLInputElement>('snapEnabled'),
            messageContainer
        };

        DebugHelper.log('UI elements initialized', {
            elementCount: Object.keys(this.uiElements).length,
            toolItemCount: this.toolItems.length
        });
    }

    /**
     * Setup all event listeners
     */
    private setupEventListeners(): void {
        this.setupToolSelectionEvents();
        this.setupToolbarEvents();
        this.setupObjectActionEvents();
        this.setupSettingsEvents();
        this.setupStageInfoEvents();
    }

    /**
     * Setup tool selection events
     */
    private setupToolSelectionEvents(): void {
        this.toolItems.forEach(item => {
            item.addEventListener('click', () => {
                const tool = item.getAttribute('data-tool');
                if (tool) {
                    this.controller.setSelectedTool(tool);
                }
            });
        });
    }

    /**
     * Setup toolbar events
     */
    private setupToolbarEvents(): void {
        const toolbarActions = {
            newStageBtn: () => this.controller.createNewStage(),
            loadStageBtn: () => this.controller.loadStage(),
            saveStageBtn: () => this.controller.saveStage(),
            testStageBtn: () => this.controller.testStage(),
            clearStageBtn: () => this.controller.clearStage(),
            toggleGridBtn: () => this.controller.toggleGrid(),
            toggleSnapBtn: () => this.controller.toggleSnap()
        };

        Object.entries(toolbarActions).forEach(([id, handler]) => {
            const element = this.getOptionalElement(id);
            element?.addEventListener('click', handler);
        });
    }

    /**
     * Setup object action events
     */
    private setupObjectActionEvents(): void {
        this.uiElements.deleteBtn.addEventListener('click', () => {
            this.controller.deleteSelectedObject();
        });

        this.uiElements.duplicateBtn.addEventListener('click', () => {
            this.controller.duplicateSelectedObject();
        });
    }

    /**
     * Setup settings events
     */
    private setupSettingsEvents(): void {
        this.uiElements.gridEnabledCheckbox.addEventListener('change', () => {
            this.controller.toggleGrid();
        });

        this.uiElements.snapEnabledCheckbox.addEventListener('change', () => {
            this.controller.toggleSnap();
        });
    }

    /**
     * Setup stage info events
     */
    private setupStageInfoEvents(): void {
        const debouncedUpdate = this.debounce(() => {
            this.updateStageInfoFromInputs();
        }, 300);

        [this.uiElements.stageNameInput, this.uiElements.stageIdInput, this.uiElements.stageDescInput]
            .forEach(input => input.addEventListener('input', debouncedUpdate));
    }

    /**
     * Update object count display
     */
    public updateObjectCount(count: number): void {
        if (!this.isInitialized) return;

        this.uiElements.objectCount.textContent = count.toString();
        this.uiElements.objectCount.className = count > 0 ? 'object-count active' : 'object-count';
    }

    /**
     * Update mouse coordinates display
     */
    public updateMouseCoordinates(x: number, y: number): void {
        if (!this.isInitialized) return;
        this.uiElements.mouseCoords.textContent = `(${x}, ${y})`;
    }

    /**
     * Update current tool display
     */
    public updateCurrentTool(tool: string): void {
        if (!this.isInitialized) return;
        this.uiElements.currentTool.textContent = tool;
    }

    /**
     * Update tool selection UI
     */
    public updateToolSelection(selectedTool: string): void {
        if (!this.isInitialized) return;

        this.toolItems.forEach(item => {
            const tool = item.getAttribute('data-tool');
            if (tool === selectedTool) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    /**
     * Enable/disable action buttons
     */
    public enableActionButtons(enabled: boolean): void {
        if (!this.isInitialized) return;

        this.uiElements.deleteBtn.disabled = !enabled;
        this.uiElements.duplicateBtn.disabled = !enabled;
    }

    /**
     * Create message container element
     */
    private createMessageContainer(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'messageContainer';
        container.className = 'message-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        return container;
    }

    /**
     * Helper method to get required DOM element
     */
    private getRequiredElement<T extends HTMLElement = HTMLElement>(id: string): T {
        const element = document.getElementById(id) as T;
        if (!element) {
            throw new Error(`Required element not found: ${id}`);
        }
        return element;
    }

    /**
     * Helper method to get optional DOM element
     */
    private getOptionalElement(id: string): HTMLElement | null {
        return document.getElementById(id);
    }

    /**
     * Debounce utility function
     */
    private debounce(func: Function, wait: number): Function {
        let timeout: NodeJS.Timeout;
        return function executedFunction(...args: any[]) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Update stage info from input fields
     */
    private updateStageInfoFromInputs(): void {
        const stageData = {
            name: this.uiElements.stageNameInput.value,
            id: this.uiElements.stageIdInput.value,
            description: this.uiElements.stageDescInput.value
        };
        
        this.controller.updateStageInfo(stageData);
    }

    /**
     * Handle store state changes
     */
    public handleStoreChange(state: EditorStore): void {
        if (this.view && this.isInitialized) {
            this.updateToolSelection(state.editor.selectedTool);
            this.updateCurrentTool(state.editor.selectedTool);
            this.updateObjectCount(state.performance.objectCount);

            if (state.stage) {
                this.view.updateStageInfo(state.stage);
            }
        }
    }

    /**
     * Handle object selection events
     */
    public handleObjectSelection(object: FabricObjectWithData | null): void {
        this.store.setSelectedObject(object);
        this.view.showObjectProperties(object);
        this.enableActionButtons(!!object);

        DebugHelper.log('Object selection handled', {
            hasObject: !!object,
            objectType: object ? (object as any).data?.type : null
        });
    }

    /**
     * Handle object modification events
     */
    public handleObjectModified(object: FabricObjectWithData, autoSaveCallback: () => void): void {
        this.updateUIFromModel();
        autoSaveCallback();

        DebugHelper.log('Object modification handled', {
            objectType: (object as any).data?.type
        });
    }

    /**
     * Handle stage modification events
     */
    public handleStageModified(stageData: StageData, autoSaveCallback: () => void): void {
        this.store.setStageData(stageData);
        this.model.setCurrentStage(stageData);
        this.updateUIFromModel();
        autoSaveCallback();

        DebugHelper.log('Stage modification handled', {
            objectCount: this.model.getObjectCount()
        });
    }

    /**
     * Update UI from model data
     */
    public updateUIFromModel(): void {
        const objectCount = this.model.getObjectCount();
        this.updateObjectCount(objectCount);
    }
}

import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
// Zustand-based Editor Store - Modern state management for the editor
import { createStore } from 'zustand/vanilla';
import type { StageData } from '../core/StageLoader.js';
import type { EditorState, FabricObjectWithData } from '../types/EditorTypes.js';

// UI State interface
interface UIState {
    isInitialized: boolean;
    isLoading: boolean;
    activeModal: string | null;
    lastError: string | null;
    lastSuccess: string | null;
    mousePosition: { x: number; y: number };
}

// Performance State interface
interface PerformanceState {
    objectCount: number;
    renderTime: number;
    lastOperation: string;
    operationTime: number;
}

// Complete Editor Store interface
export interface EditorStore {
    // State
    editor: EditorState;
    stage: StageData | null;
    ui: UIState;
    performance: PerformanceState;

    // Core Actions
    selectTool: (tool: string) => void;
    setStageData: (stage: StageData | null) => void;
    updateEditorState: (updates: Partial<EditorState>) => void;

    // Editor Actions
    toggleGrid: () => void;
    toggleSnap: () => void;
    setSelectedObject: (object: FabricObjectWithData | null) => void;
    setDrawingState: (isDrawing: boolean) => void;

    // UI Actions
    setInitialized: (initialized: boolean) => void;
    setLoading: (loading: boolean) => void;
    showModal: (modal: string) => void;
    hideModal: () => void;
    setError: (error: string) => void;
    setSuccess: (success: string) => void;
    clearMessages: () => void;
    updateMousePosition: (position: { x: number; y: number }) => void;

    // Performance Actions
    updatePerformance: (updates: Partial<PerformanceState>) => void;

    // Computed Getters (for test compatibility)
    getActiveTool: () => string;
    getCurrentStage: () => StageData | null;
    getObjectCount: () => number;
    getEditorState: () => EditorState;
    hasUnsavedChanges: () => boolean;
    isLoading: () => boolean;
    hasError: () => boolean;

    // Utility Actions
    reset: () => void;
}

// Initial state factory
const createInitialState = () => ({
    editor: {
        selectedTool: 'select' as const,
        selectedObject: null,
        isDrawing: false,
        gridEnabled: true,
        snapToGrid: true
    } as EditorState,
    stage: null as StageData | null,
    ui: {
        isInitialized: false,
        isLoading: false,
        activeModal: null,
        lastError: null,
        lastSuccess: null,
        mousePosition: { x: 0, y: 0 }
    } as UIState,
    performance: {
        objectCount: 0,
        renderTime: 0,
        lastOperation: '',
        operationTime: 0
    } as PerformanceState
});

// Create the Zustand store with middleware (vanilla version for non-React usage)
export const editorStore = createStore<EditorStore>()(
    devtools(
        immer((set, get) => ({
            // Initial State
            ...createInitialState(),

            // Core Actions
            selectTool: (tool: string) =>
                set((state) => {
                    state.editor.selectedTool = tool as any;
                }),

            setStageData: (stage: StageData | null) =>
                set((state) => {
                    state.stage = stage;
                    if (stage) {
                        state.performance.objectCount =
                            stage.platforms.length + stage.spikes.length + 1;
                    } else {
                        state.performance.objectCount = 0;
                    }
                }),

            updateEditorState: (updates: Partial<EditorState>) =>
                set((state) => {
                    Object.assign(state.editor, updates);
                }),

            // Editor Actions
            toggleGrid: () =>
                set((state) => {
                    state.editor.gridEnabled = !state.editor.gridEnabled;
                }),

            toggleSnap: () =>
                set((state) => {
                    state.editor.snapToGrid = !state.editor.snapToGrid;
                }),

            setSelectedObject: (object: FabricObjectWithData | null) =>
                set((state) => {
                    state.editor.selectedObject = object as any;
                }),

            setDrawingState: (isDrawing: boolean) =>
                set((state) => {
                    state.editor.isDrawing = isDrawing;
                }),

            // UI Actions
            setInitialized: (initialized: boolean) =>
                set((state) => {
                    state.ui.isInitialized = initialized;
                }),

            setLoading: (loading: boolean) =>
                set((state) => {
                    state.ui.isLoading = loading;
                }),

            showModal: (modal: string) =>
                set((state) => {
                    state.ui.activeModal = modal;
                }),

            hideModal: () =>
                set((state) => {
                    state.ui.activeModal = null;
                }),

            setError: (error: string) =>
                set((state) => {
                    state.ui.lastError = error;
                    state.ui.lastSuccess = null;
                }),

            setSuccess: (success: string) =>
                set((state) => {
                    state.ui.lastSuccess = success;
                    state.ui.lastError = null;
                }),

            clearMessages: () =>
                set((state) => {
                    state.ui.lastError = null;
                    state.ui.lastSuccess = null;
                }),

            updateMousePosition: (position: { x: number; y: number }) =>
                set((state) => {
                    state.ui.mousePosition = position;
                }),

            // Performance Actions
            updatePerformance: (updates: Partial<PerformanceState>) =>
                set((state) => {
                    Object.assign(state.performance, updates);
                }),

            // Computed Getters (for test compatibility)
            getActiveTool: () => get().editor.selectedTool,
            getCurrentStage: () => get().stage,
            getObjectCount: () => get().performance.objectCount,
            getEditorState: () => ({ ...get().editor }),
            hasUnsavedChanges: () => {
                const state = get();
                return state.stage !== null && !state.ui.lastSuccess;
            },
            isLoading: () => get().ui.isLoading,
            hasError: () => !!get().ui.lastError,

            // Utility Actions
            reset: () => set(() => createInitialState())
        })),
        {
            name: 'editor-store' // For Redux DevTools
        }
    )
);

// Create React-style hook for potential future React integration
export const useEditorStore = () => {
    throw new Error(
        'useEditorStore is only available in React components. Use getEditorStore() instead.'
    );
};

// Export store instance getter for non-React usage (e.g., Controllers)
export const getEditorStore = () => editorStore.getState();

// Export subscribe function for non-React usage
export const subscribeEditorStore = editorStore.subscribe;

// Type helper for store state
export type EditorStoreState = ReturnType<typeof editorStore.getState>;

// エディター機能の型定義
import * as fabric from 'fabric';
import type { StageData } from '../core/StageLoader.js';

// エディターツールの定数定義
export const EDITOR_TOOLS = {
    SELECT: 'select',
    PLATFORM: 'platform', 
    SPIKE: 'spike',
    GOAL: 'goal',
    TEXT: 'text'
} as const;

export type EditorTool = typeof EDITOR_TOOLS[keyof typeof EDITOR_TOOLS];

// エディター設定の定数
export const EDITOR_CONFIG = {
    GRID_SIZE: 20,
    OBJECT_SIZES: {
        SPIKE: { width: 15, height: 15 },
        GOAL: { width: 40, height: 50 }
    },
    CANVAS_SIZE: { width: 800, height: 600 },
    COLORS: {
        PLATFORM: 'white',
        SPIKE: 'white',
        GOAL: 'yellow',
        TEXT: 'white',
        GRID: 'rgba(255, 255, 255, 0.1)'
    },
    STROKE_WIDTH: {
        PLATFORM: 3,
        GOAL: 2,
        GRID: 1
    }
} as const;

// エディター状態の型定義
export interface EditorState {
    selectedTool: EditorTool;
    selectedObject: FabricObjectWithData | null;
    isDrawing: boolean;
    gridEnabled: boolean;
    snapToGrid: boolean;
}

// Fabric.jsオブジェクトにデータプロパティを追加した型
export interface FabricObjectWithData extends fabric.Object {
    data?: {
        type: EditorTool;
        isDrawing?: boolean;
        [key: string]: any;
    };
}

// エディターコールバックの型定義
export interface EditorCallbacks {
    onObjectSelected?: (object: FabricObjectWithData | null) => void;
    onObjectModified?: (object: FabricObjectWithData) => void;
    onStageModified?: (stageData: StageData) => void;
}

// オブジェクト作成パラメータの型定義
export interface ObjectCreationParams {
    position: { x: number; y: number };
    size?: { width: number; height: number };
    text?: string;
    color?: string;
}

// プラットフォーム描画の型定義
export interface PlatformDrawingState {
    isDrawing: boolean;
    startPoint: { x: number; y: number } | null;
    currentLine: fabric.Line | null;
}

// DOM要素IDマッピングの型定義
export interface EditorDOMElements {
    canvas: 'editorCanvas';
    tools: {
        select: 'selectTool';
        platform: 'platformTool';
        spike: 'spikeTool';
        goal: 'goalTool';
        text: 'textTool';
    };
    toolbar: {
        newStage: 'newStageBtn';
        loadStage: 'loadStageBtn';
        saveStage: 'saveStageBtn';
        testStage: 'testStageBtn';
        clearStage: 'clearStageBtn';
        toggleGrid: 'toggleGridBtn';
        toggleSnap: 'toggleSnapBtn';
    };
    display: {
        mouseCoords: 'mouseCoords';
        objectCount: 'objectCount';
        currentTool: 'currentTool';
    };
    actions: {
        deleteObject: 'deleteObjectBtn';
        duplicateObject: 'duplicateObjectBtn';
    };
    stageInfo: {
        name: 'stageName';
        id: 'stageId';
        description: 'stageDescription';
    };
    properties: {
        noSelection: 'noSelection';
        platform: 'platformProperties';
        spike: 'spikeProperties';
        goal: 'goalProperties';
        text: 'textProperties';
    };
    settings: {
        gridEnabled: 'gridEnabled';
        snapEnabled: 'snapEnabled';
    };
}

// プロパティマッピングの型定義
export interface PropertyMapping {
    platform: {
        length: 'platformLength';
        angle: 'platformAngle';
    };
    spike: {
        size: 'spikeSize';
    };
    goal: {
        width: 'goalWidth';
        height: 'goalHeight';
    };
    text: {
        content: 'textContent';
        fontSize: 'textSize';
    };
}

// キーボードショートカットマッピング
export const KEYBOARD_SHORTCUTS = {
    TOOLS: {
        '1': EDITOR_TOOLS.SELECT,
        '2': EDITOR_TOOLS.PLATFORM,
        '3': EDITOR_TOOLS.SPIKE,
        '4': EDITOR_TOOLS.GOAL,
        '5': EDITOR_TOOLS.TEXT
    },
    ACTIONS: {
        'Delete': 'deleteObject',
        'Backspace': 'deleteObject',
        'KeyG': 'toggleGrid',
        'KeyS': 'saveStage'
    }
} as const;

// Type Guards
export function isFabricObjectWithData(obj: fabric.Object): obj is FabricObjectWithData {
    return obj && typeof obj === 'object' && 'data' in obj;
}

export function isValidEditorTool(tool: string): tool is EditorTool {
    return Object.values(EDITOR_TOOLS).includes(tool as EditorTool);
}

export function isPlatformObject(obj: FabricObjectWithData): obj is FabricObjectWithData & { data: { type: 'platform' } } {
    return obj.data?.type === EDITOR_TOOLS.PLATFORM;
}

export function isSpikeObject(obj: FabricObjectWithData): obj is FabricObjectWithData & { data: { type: 'spike' } } {
    return obj.data?.type === EDITOR_TOOLS.SPIKE;
}

export function isGoalObject(obj: FabricObjectWithData): obj is FabricObjectWithData & { data: { type: 'goal' } } {
    return obj.data?.type === EDITOR_TOOLS.GOAL;
}

export function isTextObject(obj: FabricObjectWithData): obj is FabricObjectWithData & { data: { type: 'text' } } {
    return obj.data?.type === EDITOR_TOOLS.TEXT;
}

export function isGridObject(obj: FabricObjectWithData): obj is FabricObjectWithData & { data: { type: 'grid' } } {
    return (obj.data?.type as string) === 'grid';
}

// ユーティリティ型
export type ObjectType = EditorTool | 'grid';
export type MouseEventHandler = (e: fabric.TEvent<Event>) => void;
export type KeyboardEventHandler = (e: KeyboardEvent) => void;

// エラー型定義
export class EditorError extends Error {
    constructor(
        message: string,
        public readonly code: 'CANVAS_INIT_FAILED' | 'OBJECT_CREATION_FAILED' | 'INVALID_TOOL' | 'DOM_ELEMENT_NOT_FOUND',
        public readonly context?: any
    ) {
        super(message);
        this.name = 'EditorError';
    }
}
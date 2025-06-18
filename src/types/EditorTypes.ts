// エディター機能の型定義
import type * as fabric from 'fabric';
import type { StageData } from '../core/StageLoader.js';

// エディターツールの定数定義
export const EDITOR_TOOLS = {
    SELECT: 'select',
    PLATFORM: 'platform',
    SPIKE: 'spike',
    GOAL: 'goal',
    TEXT: 'text'
} as const;

export type EditorTool = (typeof EDITOR_TOOLS)[keyof typeof EDITOR_TOOLS];

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
        SPIKE_BORDER: 'gray',
        GOAL: 'yellow',
        GOAL_BORDER: 'orange',
        TEXT: 'white',
        GRID: 'rgba(255, 255, 255, 0.1)'
    },
    TEXT: {
        FONT_SIZE: 16,
        FONT_FAMILY: 'Arial'
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
        Delete: 'deleteObject',
        Backspace: 'deleteObject',
        KeyG: 'toggleGrid',
        KeyS: 'saveStage'
    }
} as const;

// Type Guards
export function isFabricObjectWithData(obj: fabric.Object): obj is FabricObjectWithData {
    return obj && typeof obj === 'object' && 'data' in obj;
}

export function isValidEditorTool(tool: string): tool is EditorTool {
    return Object.values(EDITOR_TOOLS).includes(tool as EditorTool);
}

export function isPlatformObject(
    obj: FabricObjectWithData
): obj is FabricObjectWithData & { data: { type: 'platform' } } {
    return obj.data?.type === EDITOR_TOOLS.PLATFORM;
}

export function isSpikeObject(
    obj: FabricObjectWithData
): obj is FabricObjectWithData & { data: { type: 'spike' } } {
    return obj.data?.type === EDITOR_TOOLS.SPIKE;
}

export function isGoalObject(
    obj: FabricObjectWithData
): obj is FabricObjectWithData & { data: { type: 'goal' } } {
    return obj.data?.type === EDITOR_TOOLS.GOAL;
}

export function isTextObject(
    obj: FabricObjectWithData
): obj is FabricObjectWithData & { data: { type: 'text' } } {
    return obj.data?.type === EDITOR_TOOLS.TEXT;
}

export function isGridObject(
    obj: FabricObjectWithData
): obj is FabricObjectWithData & { data: { type: 'grid' } } {
    return (obj.data?.type as string) === 'grid';
}

// ユーティリティ型
export type ObjectType = EditorTool | 'grid';
export type MouseEventHandler = (e: fabric.TEvent<Event>) => void;
export type KeyboardEventHandler = (e: KeyboardEvent) => void;

// エラー種別の定義
export const ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    IO: 'IO_ERROR',
    FABRIC: 'FABRIC_ERROR',
    PERFORMANCE: 'PERFORMANCE_ERROR',
    DOM: 'DOM_ERROR',
    NETWORK: 'NETWORK_ERROR',
    USER_INPUT: 'USER_INPUT_ERROR',
    SYSTEM: 'SYSTEM_ERROR',
    EDITOR: 'EDITOR_ERROR'
} as const;

export type ErrorType = (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES];

// エラーコードの定義
export const ERROR_CODES = {
    // キャンバス関連
    CANVAS_INIT_FAILED: 'CANVAS_INIT_FAILED',
    CANVAS_RENDER_FAILED: 'CANVAS_RENDER_FAILED',

    // オブジェクト関連
    OBJECT_CREATION_FAILED: 'OBJECT_CREATION_FAILED',
    OBJECT_MODIFICATION_FAILED: 'OBJECT_MODIFICATION_FAILED',
    INVALID_OBJECT_TYPE: 'INVALID_OBJECT_TYPE',

    // ツール関連
    INVALID_TOOL: 'INVALID_TOOL',
    TOOL_SWITCH_FAILED: 'TOOL_SWITCH_FAILED',

    // DOM関連
    DOM_ELEMENT_NOT_FOUND: 'DOM_ELEMENT_NOT_FOUND',
    DOM_EVENT_FAILED: 'DOM_EVENT_FAILED',

    // ステージ関連
    STAGE_LOAD_FAILED: 'STAGE_LOAD_FAILED',
    STAGE_SAVE_FAILED: 'STAGE_SAVE_FAILED',
    STAGE_EXPORT_FAILED: 'STAGE_EXPORT_FAILED',

    // キャンバス操作関連
    CANVAS_OPERATION_FAILED: 'CANVAS_OPERATION_FAILED',

    // 汎用操作関連
    UNSUPPORTED_OPERATION: 'UNSUPPORTED_OPERATION',
    STAGE_VALIDATION_FAILED: 'STAGE_VALIDATION_FAILED',

    // 入力関連
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_COORDINATES: 'INVALID_COORDINATES',

    // パフォーマンス関連
    MEMORY_LIMIT_EXCEEDED: 'MEMORY_LIMIT_EXCEEDED',
    RENDER_TIMEOUT: 'RENDER_TIMEOUT',

    // ネットワーク関連
    NETWORK_FAILED: 'NETWORK_FAILED',

    // システム関連
    UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * エラーハンドリング用のカスタムエラークラス
 */
export class EditorError extends Error {
    public readonly timestamp: Date;

    constructor(
        message: string,
        public readonly code: ErrorCode,
        public readonly type: ErrorType = ERROR_TYPES.SYSTEM,
        public readonly details?: any,
        public readonly recoverable: boolean = true
    ) {
        super(message);
        this.name = 'EditorError';
        this.timestamp = new Date();

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, EditorError);
        }
    }

    /**
     * エラーの詳細情報を構造化された形式で取得
     */
    public getDetails(): {
        message: string;
        code: ErrorCode;
        type: ErrorType;
        timestamp: string;
        recoverable: boolean;
        details?: any;
        stack?: string;
    } {
        const result: {
            message: string;
            code: ErrorCode;
            type: ErrorType;
            timestamp: string;
            recoverable: boolean;
            details?: any;
            stack?: string;
        } = {
            message: this.message,
            code: this.code,
            type: this.type,
            timestamp: this.timestamp.toISOString(),
            recoverable: this.recoverable
        };

        if (this.details !== undefined) {
            result.details = this.details;
        }

        if (this.stack) {
            result.stack = this.stack;
        }

        return result;
    }

    /**
     * ユーザー表示用のメッセージを取得
     */
    public getUserMessage(): string {
        switch (this.type) {
            case ERROR_TYPES.VALIDATION:
                return `入力データに問題があります: ${this.message}`;
            case ERROR_TYPES.IO:
                return `ファイル操作でエラーが発生しました: ${this.message}`;
            case ERROR_TYPES.FABRIC:
                return `描画処理でエラーが発生しました: ${this.message}`;
            case ERROR_TYPES.PERFORMANCE:
                return `パフォーマンスの問題が発生しました: ${this.message}`;
            case ERROR_TYPES.DOM:
                return `UI要素の操作でエラーが発生しました: ${this.message}`;
            case ERROR_TYPES.NETWORK:
                return `ネットワーク接続でエラーが発生しました: ${this.message}`;
            case ERROR_TYPES.USER_INPUT:
                return `入力内容を確認してください: ${this.message}`;
            default:
                return `予期しないエラーが発生しました: ${this.message}`;
        }
    }

    /**
     * 技術的な詳細を含む開発者向けメッセージを取得
     */
    public getDeveloperMessage(): string {
        return `[${this.type}:${this.code}] ${this.message} (${this.timestamp.toISOString()})`;
    }

    /**
     * エラーがリカバリ可能かどうかを判定
     */
    public isRecoverable(): boolean {
        return this.recoverable;
    }
}

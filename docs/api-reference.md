# 🔧 API Reference - Jumping Dot Game Editor

## 📋 目次
- [EditorController](#editorcontroller)
- [EditorView](#editorview)
- [EditorModel](#editormodel)
- [EditorRenderSystem](#editorrendersystem)
- [Types & Interfaces](#types--interfaces)
- [Utilities](#utilities)
- [Error Handling](#error-handling)

---

## EditorController

メインコントローラークラス。ユーザーアクションの調整とビジネスロジックを担当。

### Constructor
```typescript
constructor(
    canvas: HTMLCanvasElement,
    view: IEditorView,
    model: IEditorModel
)
```

### Public Methods

#### `initialize(): Promise<void>`
エディターを初期化します。

```typescript
const controller = new EditorController(canvas, view, model);
await controller.initialize();
```

#### `selectTool(tool: string): void`
編集ツールを選択します。

```typescript
controller.selectTool(EDITOR_TOOLS.PLATFORM);
controller.selectTool(EDITOR_TOOLS.SPIKE);
```

**Parameters:**
- `tool`: ツール名（`select` | `platform` | `spike` | `goal` | `text`）

#### `createNewStage(): void`
新しいステージを作成します。

```typescript
controller.createNewStage();
```

#### `loadStage(stageId?: number): Promise<void>`
指定されたIDのステージを読み込みます。

```typescript
await controller.loadStage(1);
// または対話的に選択
await controller.loadStage();
```

#### `saveStage(): void`
現在のステージをJSONファイルとして保存します。

```typescript
controller.saveStage();
```

#### `testStage(): void`
ステージをテストモードで開きます。

```typescript
controller.testStage();
```

#### `deleteSelectedObject(): void`
選択されたオブジェクトを削除します。

```typescript
controller.deleteSelectedObject();
```

#### `duplicateSelectedObject(): void`
選択されたオブジェクトを複製します。

```typescript
controller.duplicateSelectedObject();
```

#### `toggleGrid(): void`
グリッド表示を切り替えます。

```typescript
controller.toggleGrid();
```

#### `toggleSnap(): void`
グリッドスナップ機能を切り替えます。

```typescript
controller.toggleSnap();
```

### Extended API (テスト・統合用)

#### `createObject(event: any): void`
指定位置にオブジェクトを作成します。

```typescript
const event = {
    absolutePointer: { x: 100, y: 200 },
    pointer: { x: 100, y: 200 }
};
controller.createObject(event);
```

#### `startPlatformDrawing(event: any): void`
プラットフォーム描画を開始します。

```typescript
controller.startPlatformDrawing({
    absolutePointer: { x: 50, y: 100 },
    pointer: { x: 50, y: 100 }
});
```

#### `finishPlatformDrawing(event: any): void`
プラットフォーム描画を完了します。

```typescript
controller.finishPlatformDrawing({
    absolutePointer: { x: 150, y: 100 },
    pointer: { x: 150, y: 100 }
});
```

#### `getFabricCanvas(): fabric.Canvas`
Fabric.jsキャンバスインスタンスを取得します。

```typescript
const fabricCanvas = controller.getFabricCanvas();
```

---

## EditorView

UI管理を担当するViewクラス。

### Constructor
```typescript
constructor(canvas: HTMLCanvasElement)
```

### Public Methods

#### `initialize(): void`
ビューを初期化します。

```typescript
view.initialize();
```

#### `setController(controller: IEditorController): void`
コントローラー参照を設定します。

```typescript
view.setController(controller);
```

#### `updateToolSelection(tool: string): void`
ツール選択UIを更新します。

```typescript
view.updateToolSelection(EDITOR_TOOLS.SPIKE);
```

#### `updateObjectCount(count: number): void`
オブジェクト数表示を更新します。

```typescript
view.updateObjectCount(15);
```

#### `updateMouseCoordinates(x: number, y: number): void`
マウス座標表示を更新します。

```typescript
view.updateMouseCoordinates(120, 340);
```

#### `showObjectProperties(object: FabricObjectWithData | null): void`
オブジェクトプロパティパネルを表示します。

```typescript
view.showObjectProperties(selectedObject);
```

#### `showErrorMessage(message: string): void`
エラーメッセージを表示します。

```typescript
view.showErrorMessage('保存に失敗しました');
```

#### `showSuccessMessage(message: string): void`
成功メッセージを表示します。

```typescript
view.showSuccessMessage('ステージが保存されました');
```

---

## EditorModel

データ管理を担当するModelクラス。

### Public Methods

#### `getCurrentStage(): StageData | null`
現在のステージデータを取得します。

```typescript
const stage = model.getCurrentStage();
if (stage) {
    console.log(`Stage: ${stage.name} (ID: ${stage.id})`);
}
```

#### `setCurrentStage(stageData: StageData): void`
現在のステージを設定します。

```typescript
const newStage: StageData = {
    id: 1,
    name: 'Test Stage',
    platforms: [],
    spikes: [],
    goal: { x: 400, y: 300, width: 40, height: 50 },
    startText: { x: 50, y: 450, text: 'START' },
    goalText: { x: 420, y: 280, text: 'GOAL' }
};
model.setCurrentStage(newStage);
```

#### `getEditorState(): EditorState`
エディターの状態を取得します。

```typescript
const state = model.getEditorState();
console.log(`Selected tool: ${state.selectedTool}`);
console.log(`Grid enabled: ${state.gridEnabled}`);
```

#### `updateEditorState(updates: Partial<EditorState>): void`
エディター状態を更新します。

```typescript
model.updateEditorState({
    selectedTool: EDITOR_TOOLS.PLATFORM,
    gridEnabled: false
});
```

#### `validateStageData(stageData: StageData): boolean`
ステージデータの妥当性を検証します。

```typescript
if (model.validateStageData(stageData)) {
    console.log('Valid stage data');
} else {
    console.error('Invalid stage data');
}
```

#### `exportStageAsJson(): string`
ステージをJSON文字列として出力します。

```typescript
const json = model.exportStageAsJson();
localStorage.setItem('savedStage', json);
```

#### `importStageFromJson(json: string): StageData`
JSON文字列からステージをインポートします。

```typescript
const json = localStorage.getItem('savedStage');
if (json) {
    const stage = model.importStageFromJson(json);
    model.setCurrentStage(stage);
}
```

---

## EditorRenderSystem

Fabric.js統合レンダリングシステム。

### Constructor
```typescript
constructor(
    canvasElement: HTMLCanvasElement,
    callbacks: EditorCallbacks = {}
)
```

### Public Methods

#### `loadStageForEditing(stageData: StageData): void`
ステージを編集モードで読み込みます。

```typescript
renderSystem.loadStageForEditing(stageData);
```

#### `exportStageData(): StageData`
現在の編集内容をステージデータとして出力します。

```typescript
const currentStage = renderSystem.exportStageData();
```

#### `setSelectedTool(tool: string): void`
選択ツールを設定します。

```typescript
renderSystem.setSelectedTool(EDITOR_TOOLS.SPIKE);
```

#### `deleteSelectedObject(): void`
選択されたオブジェクトを削除します。

```typescript
renderSystem.deleteSelectedObject();
```

#### `toggleGrid(): void`
グリッド表示を切り替えます。

```typescript
renderSystem.toggleGrid();
```

#### `toggleSnapToGrid(): void`
グリッドスナップを切り替えます。

```typescript
renderSystem.toggleSnapToGrid();
```

#### `getEditorState(): EditorState`
エディターの状態を取得します。

```typescript
const state = renderSystem.getEditorState();
```

---

## Types & Interfaces

### Core Types

#### `StageData`
```typescript
interface StageData {
    id: number;
    name: string;
    platforms: Platform[];
    spikes: Spike[];
    goal: Goal;
    startText: TextElement;
    goalText: TextElement;
    leftEdgeMessage?: TextElement;
    leftEdgeSubMessage?: TextElement;
}
```

#### `Platform`
```typescript
interface Platform {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
```

#### `Spike`
```typescript
interface Spike {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

#### `Goal`
```typescript
interface Goal {
    x: number;
    y: number;
    width: number;
    height: number;
}
```

#### `TextElement`
```typescript
interface TextElement {
    x: number;
    y: number;
    text: string;
}
```

### Editor Types

#### `EditorState`
```typescript
interface EditorState {
    selectedTool: string;
    selectedObject: FabricObjectWithData | null;
    isDrawing: boolean;
    gridEnabled: boolean;
    snapToGrid: boolean;
}
```

#### `EditorCallbacks`
```typescript
interface EditorCallbacks {
    onObjectSelected?: (object: FabricObjectWithData | null) => void;
    onObjectModified?: (object: FabricObjectWithData) => void;
    onStageModified?: (stageData: StageData) => void;
}
```

#### `FabricObjectWithData`
```typescript
interface FabricObjectWithData extends fabric.Object {
    data?: {
        type: string;
        [key: string]: any;
    };
}
```

### Constants

#### `EDITOR_TOOLS`
```typescript
const EDITOR_TOOLS = {
    SELECT: 'select',
    PLATFORM: 'platform',
    SPIKE: 'spike',
    GOAL: 'goal',
    TEXT: 'text'
} as const;
```

#### `EDITOR_CONFIG`
```typescript
const EDITOR_CONFIG = {
    GRID_SIZE: 20,
    CANVAS_SIZE: {
        width: 800,
        height: 600
    },
    COLORS: {
        PLATFORM: '#00ff00',
        SPIKE: '#ff0000',
        GOAL: '#ffff00',
        GRID: '#333333'
    },
    OBJECT_SIZES: {
        SPIKE: { width: 15, height: 15 },
        GOAL: { width: 40, height: 50 }
    }
} as const;
```

---

## Utilities

### DebugHelper

#### `log(message: string, data?: any): void`
デバッグログを出力します。

```typescript
DebugHelper.log('Operation completed', { count: 5 });
```

#### `time<T>(label: string, operation: () => T): T`
処理時間を計測します。

```typescript
const result = DebugHelper.time('heavy-operation', () => {
    return heavyCalculation();
});
```

### TypeHelper

#### `safeParseInt(value: string, defaultValue: number): number`
安全な整数変換を行います。

```typescript
const id = TypeHelper.safeParseInt('123', 1); // 123
const invalid = TypeHelper.safeParseInt('abc', 1); // 1
```

#### `isStageData(data: unknown): data is StageData`
StageData型ガードです。

```typescript
if (TypeHelper.isStageData(data)) {
    // data は StageData 型として扱える
    console.log(data.name);
}
```

### EventHelper

#### `debounce<T extends (...args: any[]) => any>(func: T, delay: number): T`
デバウンス処理を適用します。

```typescript
const debouncedSave = EventHelper.debounce(() => {
    saveData();
}, 300);
```

#### `throttle<T extends (...args: any[]) => any>(func: T, delay: number): T`
スロットル処理を適用します。

```typescript
const throttledUpdate = EventHelper.throttle((e: MouseEvent) => {
    updatePosition(e);
}, 16);
```

### DOMHelper

#### `getRequiredElement<T extends HTMLElement>(id: string): T`
必須DOM要素を安全に取得します。

```typescript
const canvas = DOMHelper.getRequiredElement<HTMLCanvasElement>('editorCanvas');
```

#### `getOptionalElement<T extends HTMLElement>(id: string): T | null`
オプションDOM要素を取得します。

```typescript
const button = DOMHelper.getOptionalElement<HTMLButtonElement>('optionalBtn');
if (button) {
    button.click();
}
```

---

## Error Handling

### EditorError

#### Constructor
```typescript
constructor(
    message: string,
    code: ErrorCode,
    type: ErrorType = ERROR_TYPES.SYSTEM,
    details?: any,
    recoverable: boolean = true
)
```

#### 使用例
```typescript
throw new EditorError(
    'Failed to save stage',
    ERROR_CODES.STAGE_SAVE_FAILED,
    ERROR_TYPES.IO,
    { stageId: 1 },
    true
);
```

### GlobalErrorHandler

#### `handleError(error: Error | EditorError): void`
エラーを処理します。

```typescript
try {
    riskyOperation();
} catch (error) {
    globalErrorHandler.handleError(error);
}
```

#### `addReporter(reporter: ErrorReporter): void`
エラーレポーターを追加します。

```typescript
globalErrorHandler.addReporter({
    async reportError(error) {
        console.error('Custom error handling:', error);
    },
    async reportWarning(warning) {
        console.warn('Custom warning:', warning);
    },
    async reportInfo(info) {
        console.info('Custom info:', info);
    }
});
```

### Error Constants

#### `ERROR_CODES`
```typescript
const ERROR_CODES = {
    CANVAS_INIT_FAILED: 'CANVAS_INIT_FAILED',
    OBJECT_CREATION_FAILED: 'OBJECT_CREATION_FAILED',
    STAGE_SAVE_FAILED: 'STAGE_SAVE_FAILED',
    STAGE_LOAD_FAILED: 'STAGE_LOAD_FAILED',
    STAGE_VALIDATION_FAILED: 'STAGE_VALIDATION_FAILED'
} as const;
```

#### `ERROR_TYPES`
```typescript
const ERROR_TYPES = {
    VALIDATION: 'VALIDATION_ERROR',
    IO: 'IO_ERROR',
    FABRIC: 'FABRIC_ERROR',
    PERFORMANCE: 'PERFORMANCE_ERROR',
    DOM: 'DOM_ERROR',
    SYSTEM: 'SYSTEM_ERROR'
} as const;
```

---

## 使用例

### 基本的なエディター初期化
```typescript
// DOM要素取得
const canvas = document.getElementById('editorCanvas') as HTMLCanvasElement;

// MVCコンポーネント作成
const model = new EditorModel();
const view = new EditorView(canvas);
const controller = new EditorController(canvas, view, model);

// 初期化
await controller.initialize();

// ツール選択
controller.selectTool(EDITOR_TOOLS.PLATFORM);
```

### カスタムコールバック設定
```typescript
const callbacks: EditorCallbacks = {
    onObjectSelected: (object) => {
        console.log('Object selected:', object?.data?.type);
    },
    onObjectModified: (object) => {
        console.log('Object modified:', object.data?.type);
    },
    onStageModified: (stageData) => {
        console.log('Stage modified, objects:', stageData.platforms.length);
    }
};

const renderSystem = new EditorRenderSystem(canvas, callbacks);
```

### エラーハンドリング付きの操作
```typescript
async function safeStageOperation() {
    try {
        controller.selectTool(EDITOR_TOOLS.SPIKE);
        
        const event = {
            absolutePointer: { x: 100, y: 200 },
            pointer: { x: 100, y: 200 }
        };
        controller.createObject(event);
        
        controller.saveStage();
        
    } catch (error) {
        if (error instanceof EditorError) {
            console.error(`Editor Error [${error.code}]: ${error.message}`);
            if (error.recoverable) {
                // リトライ処理
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }
}
```

---

**🎯 このAPIリファレンスで開発がもっと楽になるよ〜♪ ⩌⩊⩌**
# API Reference - Jumping Dot Game Editor

## Table of Contents
- [EditorController](#editorcontroller)
- [EditorView](#editorview)
- [EditorModel](#editormodel)
- [EditorRenderSystem](#editorrendersystem)
- [Types & Interfaces](#types--interfaces)
- [Utilities](#utilities)
- [Error Handling](#error-handling)

---

## EditorController

Main controller class responsible for coordinating user actions and business logic.

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
Initializes the editor.

```typescript
const controller = new EditorController(canvas, view, model);
await controller.initialize();
```

#### `selectTool(tool: string): void`
Selects an editing tool.

```typescript
controller.selectTool(EDITOR_TOOLS.PLATFORM);
controller.selectTool(EDITOR_TOOLS.SPIKE);
```

**Parameters:**
- `tool`: Tool name (`select` | `platform` | `spike` | `goal` | `text`)

#### `createNewStage(): void`
Creates a new stage.

```typescript
controller.createNewStage();
```

#### `loadStage(stageId?: number): Promise<void>`
Loads a stage with the specified ID.

```typescript
await controller.loadStage(1);
// or interactive selection
await controller.loadStage();
```

#### `saveStage(): void`
Saves the current stage as a JSON file.

```typescript
controller.saveStage();
```

#### `testStage(): void`
Opens the stage in test mode.

```typescript
controller.testStage();
```

#### `deleteSelectedObject(): void`
Deletes the selected object.

```typescript
controller.deleteSelectedObject();
```

#### `duplicateSelectedObject(): void`
Duplicates the selected object.

```typescript
controller.duplicateSelectedObject();
```

#### `toggleGrid(): void`
Toggles grid display.

```typescript
controller.toggleGrid();
```

#### `toggleSnap(): void`
Toggles grid snap functionality.

```typescript
controller.toggleSnap();
```

### Extended API (Testing & Integration)

#### `createObject(event: any): void`
Creates an object at the specified position.

```typescript
const event = {
    absolutePointer: { x: 100, y: 200 },
    pointer: { x: 100, y: 200 }
};
controller.createObject(event);
```

#### `startPlatformDrawing(event: any): void`
Starts platform drawing.

```typescript
controller.startPlatformDrawing({
    absolutePointer: { x: 50, y: 100 },
    pointer: { x: 50, y: 100 }
});
```

#### `finishPlatformDrawing(event: any): void`
Completes platform drawing.

```typescript
controller.finishPlatformDrawing({
    absolutePointer: { x: 150, y: 100 },
    pointer: { x: 150, y: 100 }
});
```

#### `getFabricCanvas(): fabric.Canvas`
Gets the Fabric.js canvas instance.

```typescript
const fabricCanvas = controller.getFabricCanvas();
```

---

## EditorView

View class responsible for UI management.

### Constructor
```typescript
constructor(canvas: HTMLCanvasElement)
```

### Public Methods

#### `initialize(): void`
Initializes the view.

```typescript
view.initialize();
```

#### `setController(controller: IEditorController): void`
Sets the controller reference.

```typescript
view.setController(controller);
```

#### `updateToolSelection(tool: string): void`
Updates the tool selection UI.

```typescript
view.updateToolSelection(EDITOR_TOOLS.SPIKE);
```

#### `updateObjectCount(count: number): void`
Updates the object count display.

```typescript
view.updateObjectCount(15);
```

#### `updateMouseCoordinates(x: number, y: number): void`
Updates the mouse coordinate display.

```typescript
view.updateMouseCoordinates(120, 340);
```

#### `showObjectProperties(object: FabricObjectWithData | null): void`
Shows the object properties panel.

```typescript
view.showObjectProperties(selectedObject);
```

#### `showErrorMessage(message: string): void`
Displays an error message.

```typescript
view.showErrorMessage('Save failed');
```

#### `showSuccessMessage(message: string): void`
Displays a success message.

```typescript
view.showSuccessMessage('Stage saved successfully');
```

---

## EditorModel

Model class responsible for data management.

### Public Methods

#### `getCurrentStage(): StageData | null`
Gets the current stage data.

```typescript
const stage = model.getCurrentStage();
if (stage) {
    console.log(`Stage: ${stage.name} (ID: ${stage.id})`);
}
```

#### `setCurrentStage(stageData: StageData): void`
Sets the current stage.

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
Gets the editor state.

```typescript
const state = model.getEditorState();
console.log(`Selected tool: ${state.selectedTool}`);
console.log(`Grid enabled: ${state.gridEnabled}`);
```

#### `updateEditorState(updates: Partial<EditorState>): void`
Updates the editor state.

```typescript
model.updateEditorState({
    selectedTool: EDITOR_TOOLS.PLATFORM,
    gridEnabled: false
});
```

#### `validateStageData(stageData: StageData): boolean`
Validates stage data integrity.

```typescript
if (model.validateStageData(stageData)) {
    console.log('Valid stage data');
} else {
    console.error('Invalid stage data');
}
```

#### `exportStageAsJson(): string`
Exports the stage as a JSON string.

```typescript
const json = model.exportStageAsJson();
localStorage.setItem('savedStage', json);
```

#### `importStageFromJson(json: string): StageData`
Imports a stage from a JSON string.

```typescript
const json = localStorage.getItem('savedStage');
if (json) {
    const stage = model.importStageFromJson(json);
    model.setCurrentStage(stage);
}
```

---

## EditorRenderSystem

Fabric.js integrated rendering system.

### Constructor
```typescript
constructor(
    canvasElement: HTMLCanvasElement,
    callbacks: EditorCallbacks = {}
)
```

### Public Methods

#### `loadStageForEditing(stageData: StageData): void`
Loads a stage in editing mode.

```typescript
renderSystem.loadStageForEditing(stageData);
```

#### `exportStageData(): StageData`
Exports current editing content as stage data.

```typescript
const currentStage = renderSystem.exportStageData();
```

#### `setSelectedTool(tool: string): void`
Sets the selected tool.

```typescript
renderSystem.setSelectedTool(EDITOR_TOOLS.SPIKE);
```

#### `deleteSelectedObject(): void`
Deletes the selected object.

```typescript
renderSystem.deleteSelectedObject();
```

#### `toggleGrid(): void`
Toggles grid display.

```typescript
renderSystem.toggleGrid();
```

#### `toggleSnapToGrid(): void`
Toggles grid snap.

```typescript
renderSystem.toggleSnapToGrid();
```

#### `getEditorState(): EditorState`
Gets the editor state.

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
Outputs debug logs.

```typescript
DebugHelper.log('Operation completed', { count: 5 });
```

#### `time<T>(label: string, operation: () => T): T`
Measures execution time.

```typescript
const result = DebugHelper.time('heavy-operation', () => {
    return heavyCalculation();
});
```

### TypeHelper

#### `safeParseInt(value: string, defaultValue: number): number`
Performs safe integer conversion.

```typescript
const id = TypeHelper.safeParseInt('123', 1); // 123
const invalid = TypeHelper.safeParseInt('abc', 1); // 1
```

#### `isStageData(data: unknown): data is StageData`
StageData type guard.

```typescript
if (TypeHelper.isStageData(data)) {
    // data can be treated as StageData type
    console.log(data.name);
}
```

### EventHelper

#### `debounce<T extends (...args: any[]) => any>(func: T, delay: number): T`
Applies debounce processing.

```typescript
const debouncedSave = EventHelper.debounce(() => {
    saveData();
}, 300);
```

#### `throttle<T extends (...args: any[]) => any>(func: T, delay: number): T`
Applies throttle processing.

```typescript
const throttledUpdate = EventHelper.throttle((e: MouseEvent) => {
    updatePosition(e);
}, 16);
```

### DOMHelper

#### `getRequiredElement<T extends HTMLElement>(id: string): T`
Safely gets required DOM elements.

```typescript
const canvas = DOMHelper.getRequiredElement<HTMLCanvasElement>('editorCanvas');
```

#### `getOptionalElement<T extends HTMLElement>(id: string): T | null`
Gets optional DOM elements.

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

#### Usage Example
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
Handles errors.

```typescript
try {
    riskyOperation();
} catch (error) {
    globalErrorHandler.handleError(error);
}
```

#### `addReporter(reporter: ErrorReporter): void`
Adds error reporters.

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

## Usage Examples

### Basic Editor Initialization
```typescript
// Get DOM elements
const canvas = document.getElementById('editorCanvas') as HTMLCanvasElement;

// Create MVC components
const model = new EditorModel();
const view = new EditorView(canvas);
const controller = new EditorController(canvas, view, model);

// Initialize
await controller.initialize();

// Select tool
controller.selectTool(EDITOR_TOOLS.PLATFORM);
```

### Custom Callback Setup
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

### Operations with Error Handling
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
                // Retry logic
            }
        } else {
            console.error('Unexpected error:', error);
        }
    }
}
```
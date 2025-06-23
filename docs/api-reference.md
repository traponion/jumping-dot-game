# 🔧 API Reference - Jumping Dot Game

## 📋 Table of Contents
- [JumpingDotGame](#jumpingdotgame)
- [GameManager](#gamemanager)
- [GameLoop](#gameloop)
- [InputManager](#inputmanager)
- [FabricRenderSystem](#fabricrendersystem)
- [Types & Interfaces](#types--interfaces)
- [Utilities](#utilities)
- [Error Handling](#error-handling)

---

## JumpingDotGame

Main game class responsible for high-level game orchestration and lifecycle management.

### Constructor
```typescript
constructor()
```

### Public Methods

#### `initWithStage(stageId: number): Promise<void>`
Initializes the game with a specific stage.

```typescript
const game = new JumpingDotGame();
await game.initWithStage(1);
```

**Parameters:**
- `stageId`: Stage identifier (1 for basic tutorial, 2 for moving platforms)

#### `start(): void`
Starts the game loop and gameplay.

```typescript
game.start();
```

#### `pause(): void`
Pauses the game while preserving state.

```typescript
game.pause();
```

#### `resume(): void`
Resumes the game from paused state.

```typescript
game.resume();
```

#### `cleanup(): Promise<void>`
Cleans up resources and disposes of systems.

```typescript
await game.cleanup();
```

### Extended API (Internal/Testing)

#### `getGameManager(): GameManager`
Returns the game manager instance.

```typescript
const gameManager = game.getGameManager();
const player = gameManager.getPlayer();
```

#### `getInputManager(): InputManager`
Returns the input manager instance.

```typescript
const inputManager = game.getInputManager();
const currentInput = inputManager.getCurrentInputState();
```

---

## GameManager

Core game logic and state management system.

### Public Methods

#### `update(deltaTime: number): void`
Updates game physics and logic for one frame.

```typescript
gameManager.update(16.67); // ~60 FPS frame time
```

**Parameters:**
- `deltaTime`: Time elapsed since last update in milliseconds

#### `handleInput(inputState: InputState): void`
Processes input state and updates player accordingly.

```typescript
const inputState = {
    left: false,
    right: true,
    jump: true,
    restart: false
};
gameManager.handleInput(inputState);
```

#### `getPlayer(): Player`
Returns current player state.

```typescript
const player = gameManager.getPlayer();
console.log(`Player position: ${player.x}, ${player.y}`);
console.log(`Player velocity: ${player.velocity.x}, ${player.velocity.y}`);
```

#### `getCurrentStage(): StageData`
Returns current stage configuration.

```typescript
const stage = gameManager.getCurrentStage();
console.log(`Stage: ${stage.name} (${stage.platforms.length} platforms)`);
```

#### `getCamera(): Camera`
Returns current camera state.

```typescript
const camera = gameManager.getCamera();
console.log(`Camera position: ${camera.x}, ${camera.y}`);
```

#### `getGameState(): GameState`
Returns comprehensive game state.

```typescript
const gameState = gameManager.getGameState();
console.log(`Score: ${gameState.score}, Deaths: ${gameState.deathCount}`);
```

### Testing Methods

#### `testMovePlayerToGoal(): void`
Instantly moves player to goal position (testing only).

```typescript
gameManager.testMovePlayerToGoal();
```

#### `testResetPlayer(): void`
Resets player to starting position (testing only).

```typescript
gameManager.testResetPlayer();
```

---

## GameLoop

Fixed timestep game loop with interpolation for smooth rendering.

### Constructor
```typescript
constructor(
    updateCallback: (deltaTime: number) => void,
    renderCallback: (interpolation: number) => void
)
```

### Public Methods

#### `start(): void`
Starts the game loop.

```typescript
const loop = new GameLoop(
    (dt) => gameManager.update(dt),
    (interp) => renderSystem.render(interp)
);
loop.start();
```

#### `stop(): void`
Stops the game loop.

```typescript
loop.stop();
```

#### `getStats(): LoopStats`
Returns performance statistics.

```typescript
const stats = loop.getStats();
console.log(`FPS: ${stats.fps}, Frame time: ${stats.frameTime}ms`);
```

### Loop Configuration

#### `setTargetFPS(fps: number): void`
Sets target frame rate (default: 60).

```typescript
loop.setTargetFPS(30); // Lower FPS for battery saving
```

#### `setMaxFrameTime(ms: number): void`
Sets maximum allowed frame time to prevent spiral of death.

```typescript
loop.setMaxFrameTime(250); // 250ms max
```

---

## InputManager

Keyboard input handling and state management.

### Constructor
```typescript
constructor()
```

### Public Methods

#### `initialize(): void`
Sets up event listeners for keyboard input.

```typescript
const inputManager = new InputManager();
inputManager.initialize();
```

#### `getCurrentInputState(): InputState`
Returns current input state.

```typescript
const input = inputManager.getCurrentInputState();
if (input.jump) {
    console.log('Jump key is pressed');
}
```

#### `dispose(): void`
Removes event listeners and cleans up.

```typescript
inputManager.dispose();
```

### Input State Structure

```typescript
interface InputState {
    left: boolean;      // A or ← arrow key
    right: boolean;     // D or → arrow key  
    jump: boolean;      // W, ↑ arrow, or Space key
    restart: boolean;   // R key
}
```

---

## FabricRenderSystem

Fabric.js-based rendering system for game graphics.

### Constructor
```typescript
constructor(canvasElement: HTMLCanvasElement)
```

### Public Methods

#### `renderPlayer(player: Player): void`
Renders the player character.

```typescript
renderSystem.renderPlayer({
    x: 100,
    y: 200,
    radius: 10,
    velocity: { x: 5, y: -2 }
});
```

#### `renderStage(stage: StageData): void`
Renders all stage elements (platforms, spikes, goal).

```typescript
renderSystem.renderStage(stageData);
```

#### `renderTrail(trail: TrailPoint[], playerRadius: number): void`
Renders player movement trail.

```typescript
renderSystem.renderTrail([
    { x: 95, y: 205, age: 0.1 },
    { x: 90, y: 210, age: 0.2 },
    // ... more trail points
], 10);
```

#### `applyCameraTransform(camera: Camera): void`
Applies camera transformation to the canvas.

```typescript
renderSystem.applyCameraTransform({
    x: 200,
    y: 100
});
```

#### `clearCanvas(): void`
Clears the entire canvas.

```typescript
renderSystem.clearCanvas();
```

### Effect Rendering

#### `renderDeathAnimation(particles: Particle[]): void`
Renders death particle effects.

```typescript
renderSystem.renderDeathAnimation([
    { x: 100, y: 200, vx: 5, vy: -10, life: 1.0, size: 3 },
    // ... more particles
]);
```

#### `renderClearAnimation(particles: Particle[], progress: number, playerX: number, playerY: number): void`
Renders stage clear effects.

```typescript
renderSystem.renderClearAnimation(
    clearParticles,
    0.5, // 50% animation progress
    playerX,
    playerY
);
```

#### `renderGameOverMenu(options: string[], selectedIndex: number, finalScore: number): void`
Renders game over menu interface.

```typescript
renderSystem.renderGameOverMenu(
    ['Restart', 'Return to Menu'],
    0, // First option selected
    1250 // Final score
);
```

### Landing Prediction System

#### `setLandingPredictions(predictions: LandingPrediction[]): void`
Sets trajectory predictions for player landing points.

```typescript
renderSystem.setLandingPredictions([
    { x: 150, y: 400, confidence: 0.9, jumpNumber: 1 },
    { x: 200, y: 350, confidence: 0.7, jumpNumber: 2 }
]);
```

#### `addLandingHistory(x: number, y: number): void`
Adds a point to landing history visualization.

```typescript
renderSystem.addLandingHistory(playerX, playerY);
```

---

## Types & Interfaces

### Core Game Types

#### `Player`
```typescript
interface Player {
    x: number;
    y: number;
    radius: number;
    velocity: { x: number; y: number };
    jumpCount: number;
    maxJumps: number;
    isOnGround: boolean;
    isOnMovingPlatform: boolean;
}
```

#### `StageData`
```typescript
interface StageData {
    id: number;
    name: string;
    platforms: Platform[];
    movingPlatforms?: MovingPlatform[];
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

#### `MovingPlatform`
```typescript
interface MovingPlatform extends Platform {
    startX1: number;
    startY1: number;
    startX2: number;
    startY2: number;
    endX1: number;
    endY1: number;
    endX2: number;
    endY2: number;
    speed: number;
    direction: 1 | -1;
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

### Game State Types

#### `GameState`
```typescript
interface GameState {
    currentStage: number;
    gamePhase: 'playing' | 'paused' | 'gameOver' | 'cleared';
    score: number;
    timeElapsed: number;
    deathCount: number;
    player: Player;
    camera: Camera;
    deathMarks: DeathMark[];
}
```

#### `Camera`
```typescript
interface Camera {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    smoothing: number;
}
```

### Visual Effect Types

#### `Particle`
```typescript
interface Particle {
    x: number;
    y: number;
    vx: number;  // velocity x
    vy: number;  // velocity y
    life: number; // 0.0 to 1.0
    size: number;
}
```

#### `TrailPoint`
```typescript
interface TrailPoint {
    x: number;
    y: number;
    age: number; // time since creation
}
```

#### `DeathMark`
```typescript
interface DeathMark {
    x: number;
    y: number;
    timestamp: number;
}
```

#### `LandingPrediction`
```typescript
interface LandingPrediction {
    x: number;
    y: number;
    confidence: number; // 0-1, prediction accuracy
    jumpNumber: number; // Which jump (1, 2, 3...)
}
```

### Performance Types

#### `LoopStats`
```typescript
interface LoopStats {
    fps: number;
    frameTime: number;
    updateTime: number;
    renderTime: number;
    frameCount: number;
}
```

---

## Utilities

### MathHelper

#### `distance(p1: Point, p2: Point): number`
Calculates distance between two points.

```typescript
const dist = MathHelper.distance(
    { x: 0, y: 0 },
    { x: 3, y: 4 }
); // Returns 5
```

#### `clamp(value: number, min: number, max: number): number`
Constrains value within range.

```typescript
const clamped = MathHelper.clamp(150, 0, 100); // Returns 100
```

#### `lerp(a: number, b: number, t: number): number`
Linear interpolation between two values.

```typescript
const result = MathHelper.lerp(0, 100, 0.5); // Returns 50
```

### CollisionHelper

#### `pointInRect(point: Point, rect: Rectangle): boolean`
Tests if point is inside rectangle.

```typescript
const isInside = CollisionHelper.pointInRect(
    { x: 50, y: 50 },
    { x: 0, y: 0, width: 100, height: 100 }
); // Returns true
```

#### `circleRectCollision(circle: Circle, rect: Rectangle): boolean`
Tests collision between circle and rectangle.

```typescript
const collision = CollisionHelper.circleRectCollision(
    { x: 50, y: 50, radius: 10 },
    { x: 45, y: 45, width: 20, height: 20 }
); // Returns true
```

### TimingHelper

#### `debounce<T>(func: T, delay: number): T`
Creates debounced version of function.

```typescript
const debouncedSave = TimingHelper.debounce(() => {
    saveGameState();
}, 300);
```

#### `throttle<T>(func: T, delay: number): T`
Creates throttled version of function.

```typescript
const throttledUpdate = TimingHelper.throttle((pos: Point) => {
    updatePosition(pos);
}, 16); // ~60 FPS
```

### TypeHelper

#### `isStageData(data: unknown): data is StageData`
Type guard for StageData validation.

```typescript
if (TypeHelper.isStageData(loadedData)) {
    // loadedData is safely typed as StageData
    gameManager.loadStage(loadedData);
}
```

#### `safeParseFloat(value: string, defaultValue: number): number`
Safe float parsing with fallback.

```typescript
const speed = TypeHelper.safeParseFloat('2.5', 1.0); // Returns 2.5
const invalid = TypeHelper.safeParseFloat('abc', 1.0); // Returns 1.0
```

---

## Error Handling

### GameError

#### Constructor
```typescript
constructor(
    message: string,
    code: ErrorCode,
    recoverable: boolean = true,
    details?: any
)
```

#### Usage Example
```typescript
try {
    gameManager.loadStage(invalidStageData);
} catch (error) {
    if (error instanceof GameError) {
        console.error(`Game Error [${error.code}]: ${error.message}`);
        if (error.recoverable) {
            // Attempt recovery
            gameManager.resetToSafeState();
        }
    }
}
```

### Error Constants

#### `ERROR_CODES`
```typescript
const ERROR_CODES = {
    STAGE_LOAD_FAILED: 'STAGE_LOAD_FAILED',
    RENDER_SYSTEM_FAILED: 'RENDER_SYSTEM_FAILED',
    PHYSICS_CALCULATION_ERROR: 'PHYSICS_CALCULATION_ERROR',
    INPUT_SYSTEM_ERROR: 'INPUT_SYSTEM_ERROR',
    CANVAS_INITIALIZATION_FAILED: 'CANVAS_INITIALIZATION_FAILED'
} as const;
```

### ErrorHandler

#### `handleError(error: Error | GameError): void`
Global error handling.

```typescript
try {
    riskyGameOperation();
} catch (error) {
    globalErrorHandler.handleError(error);
}
```

#### `addErrorReporter(reporter: ErrorReporter): void`
Add custom error reporting.

```typescript
globalErrorHandler.addErrorReporter({
    reportError: async (error) => {
        console.error('Custom error handling:', error);
        // Send to analytics service
    },
    reportWarning: async (warning) => {
        console.warn('Custom warning:', warning);
    }
});
```

---

## Usage Examples

### Basic Game Setup
```typescript
// Create and initialize game
const game = new JumpingDotGame();
await game.initWithStage(1);

// Start gameplay
game.start();

// Handle errors
try {
    await game.initWithStage(2);
} catch (error) {
    console.error('Failed to load stage:', error);
}
```

### Custom Input Handling
```typescript
const inputManager = new InputManager();
inputManager.initialize();

// Custom input processing
setInterval(() => {
    const input = inputManager.getCurrentInputState();
    
    if (input.jump && input.right) {
        console.log('Jump-right combo detected');
    }
}, 16); // ~60 FPS
```

### Performance Monitoring
```typescript
const gameLoop = new GameLoop(
    (deltaTime) => gameManager.update(deltaTime),
    (interpolation) => renderSystem.render(interpolation)
);

gameLoop.start();

// Monitor performance
setInterval(() => {
    const stats = gameLoop.getStats();
    if (stats.fps < 55) {
        console.warn('Low FPS detected:', stats.fps);
    }
}, 1000);
```

### Advanced Rendering
```typescript
const renderSystem = new FabricRenderSystem(canvas);

// Set up landing predictions
renderSystem.setLandingPredictions([
    { x: 200, y: 400, confidence: 0.95, jumpNumber: 1 },
    { x: 350, y: 300, confidence: 0.8, jumpNumber: 2 }
]);

// Custom particle effects
const deathParticles = Array.from({ length: 20 }, (_, i) => ({
    x: playerX + Math.random() * 20 - 10,
    y: playerY + Math.random() * 20 - 10,
    vx: Math.random() * 10 - 5,
    vy: Math.random() * 10 - 15,
    life: 1.0,
    size: Math.random() * 3 + 1
}));

renderSystem.renderDeathAnimation(deathParticles);
```

---

**🎮 This API reference provides comprehensive documentation for building and extending the Jumping Dot Game!**
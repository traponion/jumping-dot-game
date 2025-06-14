# game-inputs Library Migration Guide

## Library Overview

**game-inputs** is a JavaScript library specifically designed for game development that abstracts keyboard and mouse input handling with advanced features for managing complex input scenarios.

### Key Features
- **Virtual Key Bindings**: Map multiple physical keys to single actions
- **Event Overlap Handling**: Automatically manages overlapping events from keys bound to the same action
- **Mouse Integration**: Tracks mouse/pointer events and scroll inputs within DOM elements
- **State Tracking**: Provides current state of bindings and counts of press/release events
- **TypeScript Support**: Built-in TypeScript declarations included

### Technical Specifications
- **Version**: 0.8.0 (latest)
- **License**: ISC
- **Maintainer**: Andy Hall
- **TypeScript**: Full support with type definitions
- **Bundle Size**: Lightweight (exact size TBD)
- **Dependencies**: Minimal external dependencies

## API Reference

### Basic Setup
```typescript
import { GameInputs } from 'game-inputs';

const inputs = new GameInputs(domElement, {
  preventDefaults: true,    // Prevent default browser behaviors
  allowContextMenu: false,  // Disable right-click context menu
});
```

### Key Binding
```typescript
// Single key binding
inputs.bind('move-left', 'ArrowLeft');
inputs.bind('move-left', 'KeyA');  // Multiple keys for same action

// Multiple key binding (array syntax)
inputs.bind('jump', ['Space', 'ArrowUp', 'KeyW']);
```

### Event Handling
```typescript
// Key down events
inputs.down.on('move-left', () => {
  player.startMovingLeft();
});

// Key up events  
inputs.up.on('move-left', () => {
  player.stopMovingLeft();
});

// State checking (polling in game loop)
if (inputs.state['move-left']) {
  player.moveLeft(deltaTime);
}

// Press count (useful for detecting multiple rapid presses)
const jumpPresses = inputs.presses['jump'];
```

### Mouse Integration
```typescript
// Mouse button bindings
inputs.bind('attack', 'mouse0');  // Left click
inputs.bind('defend', 'mouse2');  // Right click

// Mouse position
const mouseX = inputs.pointerX;
const mouseY = inputs.pointerY;

// Scroll events
inputs.bind('zoom-in', 'wheel-up');
inputs.bind('zoom-out', 'wheel-down');
```

## Migration Strategy

### Current System → game-inputs Mapping

#### Current InputSystem.ts Structure:
```typescript
// Current approach
class InputSystem {
  private keys: KeyState = {};
  private gameRunning = false;
  private gameOver = false;
  
  getKeys(): KeyState {
    return { ...this.keys };
  }
  
  setGameState(running: boolean, over: boolean): void {
    this.gameRunning = running;
    this.gameOver = over;
  }
}
```

#### New game-inputs Approach:
```typescript
// New simplified approach
class InputManager {
  private inputs: GameInputs;
  private gameContext: 'menu' | 'playing' | 'paused' = 'menu';
  
  constructor(canvas: HTMLCanvasElement) {
    this.inputs = new GameInputs(canvas, {
      preventDefaults: true,
      allowContextMenu: false
    });
    
    this.setupBindings();
  }
  
  private setupBindings(): void {
    // Movement
    this.inputs.bind('move-left', ['ArrowLeft', 'KeyA']);
    this.inputs.bind('move-right', ['ArrowRight', 'KeyD']);
    this.inputs.bind('jump', ['ArrowUp', 'KeyW', 'Space']);
    
    // Game control
    this.inputs.bind('start-game', 'Space');
    this.inputs.bind('restart', 'KeyR');
  }
  
  // Simple state queries
  isPressed(action: string): boolean {
    return this.inputs.state[action] || false;
  }
  
  wasJustPressed(action: string): boolean {
    return (this.inputs.presses[action] || 0) > 0;
  }
}
```

### Integration Points

#### 1. PlayerSystem Integration
```typescript
// Current (PlayerSystem.ts)
private handleInput(dtFactor: number): void {
  const leftInput = this.keys.ArrowLeft;
  const rightInput = this.keys.ArrowRight;
  // ...
}

// New approach
private handleInput(dtFactor: number, inputManager: InputManager): void {
  const leftInput = inputManager.isPressed('move-left');
  const rightInput = inputManager.isPressed('move-right');
  // ...
}
```

#### 2. Game Controller Integration
```typescript
// Current (Game.ts)
this.inputSystem = new InputSystem(this);

// New approach
this.inputManager = new InputManager(this.canvas);
this.inputManager.onAction('start-game', () => this.startGame());
this.inputManager.onAction('restart', () => this.init());
```

## Code Reduction Analysis

### Files to be Simplified/Removed:

#### src/systems/InputSystem.ts
- **Current**: 118 lines (including debug logs)
- **New**: ~30 lines (simplified wrapper)
- **Reduction**: 88 lines (75%)

#### src/test/InputSystem.test.ts  
- **Current**: 220 lines
- **New**: ~50 lines (testing wrapper only)
- **Reduction**: 170 lines (77%)

#### PlayerSystem integration
- **Current**: ~20 lines of key handling
- **New**: ~10 lines with cleaner API
- **Reduction**: 10 lines (50%)

### Total Reduction: ~268 lines (75% overall)

## Implementation Phases

### Phase 1: Library Setup & Testing (1-2 days)
1. Install game-inputs: `npm install game-inputs`
2. Create basic prototype InputManager
3. Test all current key bindings work correctly
4. Verify TypeScript integration
5. Performance baseline testing

### Phase 2: Core Migration (2-3 days)
1. Implement new InputManager class
2. Update PlayerSystem to use new API
3. Migrate game control logic (start/restart)
4. Remove dependencies on old InputSystem
5. Update Game.ts integration

### Phase 3: Testing & Validation (1-2 days)
1. Update test suite for new system
2. Comprehensive gameplay testing
3. Edge case validation (focus loss, key combinations)
4. Performance comparison with old system
5. Browser compatibility testing

### Phase 4: Cleanup & Documentation (1 day)
1. Remove old InputSystem files
2. Update README.md with new controls
3. Update API documentation
4. Final code quality checks
5. Deployment verification

## Benefits & Risks

### Expected Benefits:
- **Massive code reduction**: 75% fewer lines to maintain
- **Improved reliability**: Battle-tested library vs custom implementation
- **Enhanced features**: Key combinations, contexts, better mouse support
- **Future-proofing**: Easy to add advanced input features
- **Reduced testing burden**: Less custom input logic to test

### Potential Risks:
- **External dependency**: Adds new package dependency
- **Learning curve**: Team needs to understand new API
- **Migration bugs**: Potential issues during transition
- **Library maintenance**: Depends on external maintainer
- **Bundle size**: Small increase in application size

### Risk Mitigation:
- Thorough testing in development environment
- Gradual migration with rollback capability
- Complete documentation of new system
- Performance monitoring during migration
- Fallback plan to current system if needed

## Key Binding Reference

### Current System Mappings:
```
ArrowLeft, KeyA → move-left
ArrowRight, KeyD → move-right  
ArrowUp, KeyW, Space → jump
Space → start-game (when not playing)
KeyR → restart (when game over)
```

### New game-inputs Bindings:
```typescript
inputs.bind('move-left', ['ArrowLeft', 'KeyA']);
inputs.bind('move-right', ['ArrowRight', 'KeyD']);
inputs.bind('jump', ['ArrowUp', 'KeyW']);
inputs.bind('start-game', 'Space');
inputs.bind('restart', 'KeyR');
```

Note: Space key context will be handled by game state logic rather than key binding differences.

## Testing Strategy

### Unit Tests:
- InputManager wrapper functionality
- Key binding configuration
- State query methods
- Event handling integration

### Integration Tests:  
- PlayerSystem with new input system
- Game state transitions
- Keyboard event simulation
- Focus/blur behavior

### Manual Testing:
- All game controls in various browsers
- Key combinations and edge cases  
- Performance during intensive gameplay
- Mobile/touch device compatibility (if applicable)

## References

- [game-inputs NPM Package](https://www.npmjs.com/package/game-inputs)
- [GitHub Repository](https://github.com/andyhall/game-inputs)
- [Current InputSystem Implementation](../src/systems/InputSystem.ts)
- [Migration GitHub Issue](https://github.com/traponion/jumping-dot-game/issues/[issue-number])
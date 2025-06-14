# TypeScript Testing Reference

## Strict Mode Testing Patterns

### Core Principles
- ❌ `any` type usage prohibited
- ❌ `@ts-ignore` comments prohibited  
- ❌ Direct private method access prohibited
- ✅ Maintain encapsulation integrity
- ✅ Preserve 100% type safety
- ✅ Ensure testability

## Testing Patterns

### Private Method Testing
```typescript
// ❌ Incorrect approach
class Game {
    private update(deltaTime: number): void { /* ... */ }
}

const game = new Game();
(game as any).update(16); // Violates type safety

// ✅ Correct approach - Public test methods
class Game {
    private update(deltaTime: number): void { /* ... */ }
    
    // Public method for testing private logic
    public testUpdate(): void {
        this.update(16); // Test indirectly through public API
    }
}

const game = new Game();
game.testUpdate(); // Type-safe testing
```

### Mock Implementation
```typescript
// Type-safe mock creation
interface MockCanvas extends HTMLCanvasElement {
    getContext(contextId: '2d'): CanvasRenderingContext2D | null;
}

const mockCanvas: MockCanvas = {
    getContext: vi.fn(() => ({
        fillRect: vi.fn(),
        clearRect: vi.fn(),
        // ... other context methods
    })),
    width: 800,
    height: 600,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getAttribute: vi.fn(),
    setAttribute: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ 
        left: 0, top: 0, width: 800, height: 600 
    }))
} as unknown as HTMLCanvasElement;
```

### Type Guard Implementation
```typescript
// Safe type checking for external data
function isValidStageData(data: unknown): data is StageData {
    return typeof data === 'object' && 
           data !== null && 
           'platforms' in data && 
           Array.isArray((data as any).platforms);
}

// Usage in tests
it('should validate stage data correctly', () => {
    const validData = { platforms: [], spikes: [] };
    const invalidData = { invalid: true };
    
    expect(isValidStageData(validData)).toBe(true);
    expect(isValidStageData(invalidData)).toBe(false);
});
```

### Error Handling Testing
```typescript
// Type-safe error testing
class GameError extends Error {
    constructor(message: string, public code: string) {
        super(message);
        this.name = 'GameError';
    }
}

// Test implementation
it('should throw typed error for invalid state', () => {
    expect(() => {
        game.invalidOperation();
    }).toThrow(GameError);
    
    try {
        game.invalidOperation();
    } catch (error) {
        if (error instanceof GameError) {
            expect(error.code).toBe('INVALID_STATE');
        }
    }
});
```

### Async Operation Testing
```typescript
// Type-safe async testing
async function loadStage(id: number): Promise<StageData> {
    const response = await fetch(`/stages/stage${id}.json`);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data: unknown = await response.json();
    if (!isValidStageData(data)) {
        throw new Error('Invalid stage data');
    }
    
    return data;
}

// Test implementation
it('should load stage data correctly', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
            platforms: [],
            spikes: []
        })
    });
    
    global.fetch = mockFetch;
    
    const stage = await loadStage(1);
    expect(stage.platforms).toEqual([]);
});
```

### Generic Testing Utilities
```typescript
// Type-safe test utilities
function createMockSystem<T extends object>(
    implementation: Partial<T>
): T {
    return implementation as T;
}

// Usage
const mockPhysics = createMockSystem<PhysicsSystem>({
    updatePlayer: vi.fn(),
    applyGravity: vi.fn()
});
```

## Environment-Specific Patterns

### Test Environment Detection
```typescript
export function isTestEnvironment(): boolean {
    return typeof process !== 'undefined' && 
           (process.env.NODE_ENV === 'test' || 
            process.env.VITEST === 'true');
}

// Type-safe environment branching
export function createLogger(): Logger {
    if (isTestEnvironment()) {
        return new MockLogger();
    }
    return new ProductionLogger();
}
```

### Configuration Testing
```typescript
// Type-safe configuration validation
interface TestConfig {
    timeout: number;
    retries: number;
    environment: 'test' | 'ci' | 'local';
}

function validateTestConfig(config: unknown): TestConfig {
    if (typeof config !== 'object' || config === null) {
        throw new Error('Invalid config object');
    }
    
    const c = config as Record<string, unknown>;
    
    if (typeof c.timeout !== 'number') {
        throw new Error('Invalid timeout');
    }
    
    return config as TestConfig;
}
```

## Best Practices

### 1. Explicit Type Annotations
```typescript
// ✅ Explicit return types
function calculateScore(time: number, bonus: number): number {
    return Math.max(0, time + bonus);
}

// ✅ Explicit parameter types
const processResults = (results: TestResult[]): Summary => {
    return results.reduce(/* ... */);
};
```

### 2. Strict Null Checks
```typescript
// ✅ Handle potential null values
function getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    return element;
}
```

### 3. Union Type Testing
```typescript
// ✅ Test all union type branches
type GameState = 'menu' | 'playing' | 'paused' | 'over';

function handleStateChange(state: GameState): void {
    switch (state) {
        case 'menu':
            // Handle menu
            break;
        case 'playing':
            // Handle playing
            break;
        case 'paused':
            // Handle paused
            break;
        case 'over':
            // Handle game over
            break;
        default:
            // TypeScript ensures exhaustiveness
            const _exhaustive: never = state;
            throw new Error(`Unhandled state: ${_exhaustive}`);
    }
}
```

---

**Document Version**: 1.0  
**Last Updated**: June 14, 2025  
**Status**: TypeScript Testing Reference
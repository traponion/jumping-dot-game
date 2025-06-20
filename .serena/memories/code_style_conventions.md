# Code Style and Conventions

## TypeScript Configuration
- **Target**: ES2020
- **Module**: ESNext
- **Strict Mode**: Enabled
- **No Implicit Any**: Required
- **No Unused Variables**: Required
- **Exact Optional Properties**: Enabled

## Code Style (Biome Configuration)
- **Indent**: 4 spaces (not tabs)
- **Line Width**: 100 characters
- **Quote Style**: Single quotes
- **Semicolons**: Always required
- **Trailing Commas**: None

## Naming Conventions
- **Classes**: PascalCase (e.g., `GameManager`, `EditorController`)
- **Interfaces**: PascalCase with 'I' prefix (e.g., `IRenderAdapter`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `GAME_CONFIG`)
- **Functions/Variables**: camelCase (e.g., `getCurrentTime`)
- **Files**: PascalCase for classes, camelCase for utilities

## Documentation Standards
- **JSDoc**: Required for all public methods and classes
- **Type Annotations**: Explicit types for parameters and returns
- **Comments**: Meaningful comments for complex logic

## Architecture Patterns
- **MVC Pattern**: Controller, View, Model separation
- **Adapter Pattern**: For rendering system abstractions
- **Factory Pattern**: For object creation
- **Store Pattern**: Zustand for state management

## File Organization
- One main class per file
- Group related interfaces in type files
- Barrel exports (index.js) for modules
- Test files adjacent to source files
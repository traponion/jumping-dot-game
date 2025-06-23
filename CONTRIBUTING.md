# Contributing to Jumping Dot Game

Welcome to the Jumping Dot Game project! This is a platform-style jumping game with physics-based gameplay, built with high-quality architecture and Fabric.js for professional web game development.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Standards](#development-standards)
- [Testing Requirements](#testing-requirements)
- [Branch Strategy](#branch-strategy)
- [Submitting Changes](#submitting-changes)
- [Code Quality Standards](#code-quality-standards)
- [Architecture Guidelines](#architecture-guidelines)

## Getting Started

### Prerequisites

- Node.js (latest LTS version)
- npm package manager
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/traponion/jumping-dot-game.git
   cd jumping-dot-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm run test
   ```

5. **Type checking**
   ```bash
   npm run typecheck
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

### Project Structure

```
src/
├── controllers/     # MVC Controller layer
├── views/          # MVC View layer  
├── models/         # MVC Model layer
├── stores/         # Redux-style state management
├── systems/        # Rendering systems
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── performance/    # Performance optimization
├── test/           # Test suite
└── core/           # Core systems
```

## Development Standards

### TypeScript Strict Mode Compliance

This project maintains **100% TypeScript strict mode compliance**:

- **Type Safety**: `strict: true` with additional strict options enabled
- **Build-time Type Checking**: `npm run build` includes type checking
- **Prohibited Practices**:
  - ❌ `any` type usage
  - ❌ Excessive `as` type assertions
  - ❌ `// @ts-ignore` comments
  - ❌ Excessive non-null assertions (`!`)

### Code Quality Requirements

- **Coverage Requirements**:
  - Systems: 90%+ (critical systems)
  - Core: 80%+ (considering Facade pattern)
  - Utils: 95%+ (utility functions)
- **Architecture**: SOLID principles + ECS-inspired design
- **File Size**: Consider splitting files exceeding 150 lines

### Naming Conventions

- **Classes**: PascalCase (`PlayerSystem`, `AnimationSystem`)
- **Functions/Variables**: camelCase (`updatePlayer`, `deltaTime`)
- **Constants**: SCREAMING_SNAKE_CASE (`GAME_CONFIG`, `MAX_VELOCITY`)
- **Files**: PascalCase.ts (`GameTypes.ts`, `PlayerSystem.ts`)

## Testing Requirements

### Test-Driven Development (TDD)

This project follows **Test-Driven Development** methodology:

1. **Red**: Write a failing test first
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests passing

### Testing Standards

- **Test-First Approach**: Write tests before implementation
- **Mock Strategy**: Complete mocking of DOM, Canvas, and Browser APIs
- **Coverage Targets**: Maintain or improve existing coverage
- **Integration Focus**: Test public APIs rather than private methods

### Running Tests

```bash
# All tests
npm run test

# Specific test file
npm run test GameManager.test.ts

# With coverage
npm run test:coverage
```

## Branch Strategy

This project follows **GitHub Flow** with branch protection:

### Branch Structure
- `main` - Default and production-ready branch (protected)
- `feature/*` - Feature development branches
- `bugfix/*` - Bug fix branches
- `refactor/*` - Refactoring branches

### Starting Development

```bash
# Always start from the latest main branch
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

## Submitting Changes

### 1. Development Process

```bash
# Make your changes
git add .
git commit -m "feat: description of your feature"
git push -u origin feature/your-feature-name
```

### 2. Create Pull Request

```bash
gh pr create --base main --title "feat: Your Feature Title" --body "
## Summary
- Brief description of changes

## Test plan
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] CI/CD passing
"
```

### 3. Code Review Process

- Wait for at least 1 approval from another developer
- Address review comments if any
- Ensure all CI/CD checks pass
- Merge after approval

### Commit Message Format

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `docs:` - Documentation updates

## Code Quality Standards

### Pre-submission Checklist

- [ ] Zero TypeScript type errors (`npm run typecheck`)
- [ ] All tests pass (`npm run test`)
- [ ] Test coverage maintained/improved (`npm run test:coverage`)
- [ ] Build succeeds (`npm run build`)
- [ ] SOLID principles adherence
- [ ] Proper error handling implementation
- [ ] Complete JSDoc documentation for public methods

### Error Handling Standards

- **Explicit Error Processing**: Use try-catch with appropriate error messages
- **Type-based Safety**: Express error possibilities through types
- **Validation**: Validate external data before usage
- **Fail-Fast Principle**: Immediate error response for invalid states

### Good Example

```typescript
function isValidUser(data: unknown): data is User {
    return typeof data === 'object' && 
           data !== null && 
           'name' in data && 
           typeof (data as any).name === 'string';
}

if (isValidUser(response.data)) {
    const user = response.data;
    // Type-safe access available
}
```

## Architecture Guidelines

### Design Principles

- **MVC Architecture**: Clear separation of Model, View, and Controller
- **Dependency Inversion**: Use adapter pattern for external libraries
- **Component-Oriented**: Reusable and testable design
- **Error-First**: Robust error handling throughout

### Performance Optimization

- **Object Pooling**: Memory efficiency
- **Debounce/Throttle**: UI responsiveness
- **Lazy Loading**: Reduced initialization time

```typescript
// Object pool usage
const object = poolManager.acquire('spike');

// Debounce processing
const debouncedSave = EventHelper.debounce(save, 300);

// Memory cleanup
object.dispose();
poolManager.release(object);
```

## Development Tools

### Required Tools

- **Biome**: ESLint + Prettier integration
- **TypeScript**: Latest version with strict configuration
- **Vitest**: Test execution and coverage measurement
- **GitHub Actions**: CI/CD pipeline

### Available Scripts

```bash
npm run typecheck    # TypeScript type checking (mandatory)
npm run build        # Type checking + build
npm run test         # Test execution
npm run test:coverage # Coverage measurement
npm run lint         # Biome linting
npm run format       # Biome formatting
```

## Getting Help

- Check existing documentation in the `.claude/` directory
- Review test examples for implementation patterns
- Create an issue for questions or bug reports
- Join discussions in pull requests

## Documentation Standards

- **Language**: English for all official documentation
- **Format**: Markdown with consistent structure
- **Tone**: Professional, objective, technical
- **JSDoc**: Required for all public methods

Thank you for contributing to Jumping Dot Game! Your contributions help make this project better for everyone.
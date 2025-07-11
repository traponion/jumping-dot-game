# Development Guidelines - Jumping Dot Game

> **AI Assistant Instructions**: Simple, practical guidelines for AI-human collaboration

## Core Principles

### 1. Session Startup
```bash
# Check latest handover
ls -la .claude/

# Check project status
git status
gh issue list --state open

# Initialize Serena
mcp__serena__initial_instructions()
mcp__serena__list_memories()
```

### 2. Conservative SOLID
- **Single Responsibility**: One clear purpose per file
- **Open/Closed**: Extend through composition, not inheritance
- **Liskov Substitution**: Avoid inheritance complexity
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Simple factory patterns only

**Rule**: If it makes code harder to understand, don't do it.

### 3. Testing Strategy
- **Test what matters**: Business logic, not framework internals
- **TDD when valuable**: Red → Green → Refactor for complex logic
- **Skip when not valuable**: Simple getters/setters, framework wrappers
- **E2E for integration**: Real user scenarios, not unit test coverage

**t-wada principle**: "Write tests for code that can break in ways that matter"

### 4. AI-Friendly Architecture
- **File size limit**: 300 lines (break up larger files)
- **Related code together**: Don't scatter related functionality
- **Clear boundaries**: Each file has one obvious purpose
- **Minimal hierarchy**: Avoid deep folder structures

## Current Tech Stack

### Core Technologies
- **Frontend**: Pixi.js v8 (migrated from Fabric.js)
- **Build**: Vite
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest + Playwright
- **Quality**: Biome

### Architecture Status
- **Current**: Transitioning from complex to simple architecture
- **Goal**: AI-friendly file structure with conservative SOLID
- **Pattern**: Composition over inheritance, simple factory patterns

## Essential Commands

```bash
# Development
npm run dev                # Start dev server
npm run build             # Production build

# Quality (run before commit)
npm run quality           # format + lint + typecheck + test

# Testing
npm test                  # Unit tests
npx playwright test       # E2E tests

# Issue management
gh issue create           # Create new issue
gh pr create             # Create pull request
```

## Development Workflow

### 1. Issue-Driven Development
- Create issue before starting work
- Use conventional commit messages
- Update issue with progress

### 2. Branch Strategy
- Work on `feature/*` branches
- Target `main` branch for PRs
- Use GitHub Flow (simple)

### 3. Quality Gates
- Tests pass (unit + E2E)
- TypeScript compiles
- Biome formatting applied
- No lint errors

## File Management

### Handover Documents
- Location: `.claude/` directory
- Format: `*_handover.md`
- Content: Technical, objective, English only
- Purpose: Context for next AI session

### Code Organization
- Keep related functionality together
- Avoid over-abstraction
- Prefer composition over inheritance
- Simple factory patterns when needed

## Testing Guidelines

### When to Test
- **Do test**: Complex business logic, algorithms, state management
- **Skip testing**: Simple property access, framework wrappers
- **E2E test**: User workflows, integration scenarios

### Coverage Philosophy
- **Quality over quantity**: Better to have fewer meaningful tests
- **Don't chase numbers**: Coverage percentage is not a goal
- **Test behavior**: What the code does, not how it does it

### Framework Testing
```typescript
// ✅ Good: Test your logic
expect(gameState.isGameOver()).toBe(true);

// ❌ Bad: Test framework internals
expect(pixiApp.stage.children).toHaveLength(5);
```

## Architecture Principles

### Keep It Simple
- **Minimal interfaces**: Only what you actually need
- **Clear responsibilities**: Each file has one job
- **Avoid over-engineering**: YAGNI (You Ain't Gonna Need It)

### AI-Friendly Design
- **Context window awareness**: Keep files readable in one view
- **Explicit over implicit**: Clear naming and structure
- **Predictable patterns**: Consistent organization

---

**Remember**: The goal is working software, not perfect architecture. Keep it simple, keep it working, keep it maintainable.
# Development Guidelines for jumping-dot-game

> **AI Assistant Instructions**: This document contains development guidelines and workflow instructions for the jumping-dot-game project.

<claude-guidelines>

<session-initialization>
## Mandatory Session Startup Protocol

### STEP 0: Handover Document Check (REQUIRED FIRST)
**Before any coding work, Netsuki MUST check `.claude/` directory:**

```bash
# Required commands in this exact order:
ls -la .claude/
```

**Priority Reading Order:**
1. **Most recent `*_handover.md`** - Current work context
2. **`*_migration_guide.md`** - Specific task instructions  
3. **`session_startup_template.md`** - User instruction patterns
4. **`netsuki_auto_decision.md`** - Autonomous decision framework

### STEP 1: Project State Assessment (AUTO-EXECUTE)
```bash
git status                    # Working tree status
git fetch && git status      # Remote sync check  
gh issue list --state open  # Current priorities
```

### STEP 2: Serena Initialization (REQUIRED)
```bash
mcp__serena__initial_instructions()  # Load project context
mcp__serena__list_memories()        # Check existing knowledge
```

### STEP 3: Scope Auto-Detection (FOLLOW DECISION MATRIX)
- **Green Flag** → Auto-start with established patterns
- **Yellow Flag** → Ask ONE focused scope question
- **Red Flag** → Request detailed planning session

### STEP 4: Quality Standards (AUTO-APPLY)
- Conservative testing approach (don't break existing tests)
- Consistent implementation (follow established patterns)  
- Realistic scope (respect context window limits)
- Frequent commits (functional increments)

**Completion Requirement:** Update handover docs + commit + issue progress
</session-initialization>

<immutable-principles>
## Netsuki's Six Immutable Principles

### 1. Context7 Authority
- Always use Context7 for framework usage and latest documentation
- Trust official documentation over training data

### 2. No Self-Decision Policy
- Cannot make decisions independently (aware of tendency toward quick implementations)
- Must consult when uncertain ("What does Gemini think?")

### 3. Test-First Development
- Strict TDD: Create tests first, verify failure, then implement
- Coverage requirements are sacred: utils 95%, systems 90%, core 80%

### 4. Issue-Driven Development
- Mandatory issue creation before starting any work
- Real-time progress reporting via issue comments

### 5. Quality Automation
- Execute `npm run quality` before every commit
- Full compliance with Biome rules and TypeScript strict mode

### 6. Self-Reminder Protocol
- Must recite this entire CLAUDE.md in Netsuki's own words when significant steps are completed
- Prevents forgetting core principles during long development sessions
- Reinforces adherence to established workflows and quality standards
</immutable-principles>

<testing-guidelines>
## Testing Responsibility Separation

### Framework vs Application Testing
- **Never test framework implementation details** (e.g., Fabric.js internal behavior)
- **Only test application logic** (how you use the framework)
- **Mock framework interactions** without checking parameter details
- **Focus on your code's behavior**, not the framework's

### Examples
```typescript
// ✅ Good: Test application responsibility
expect(mockCanvas.add).toHaveBeenCalled();

// ❌ Bad: Test framework implementation
expect(mockCanvas.add).toHaveBeenCalledWith(
  expect.objectContaining({
    left: 100,
    top: 200,
    fill: 'white'
  })
);
```

### Coverage Thresholds (from vite.config.js)
- **Global**: 75% lines, 80% functions, 80% branches
- **src/utils/**: 95% lines, 100% functions, 95% branches
- **src/systems/**: 90% lines, 95% functions, 90% branches
- **src/core/**: 80% lines, 85% functions, 70% branches

### Test Setup
- Environment: jsdom
- Timeout: 120 seconds (for CI stability)
- Pool: forks with isolation enabled

### E2E Testing with Playwright
- **Platform Landing Test**: `tests/platform-landing.spec.ts`
- **Purpose**: Detects platform collision/fall-through bugs automatically
- **Usage**: `npx playwright test tests/platform-landing.spec.ts`
- **Detection**: 3-second survival check identifies immediate death scenarios
- **Evidence**: Automatic screenshot generation in `test-results/`
</testing-guidelines>

<project-stack>
## Current Project Stack

### Core Technologies
- **Frontend**: Fabric.js v6
- **Build Tool**: Vite
- **Language**: TypeScript (strict mode)
- **Testing**: Vitest with jsdom
- **Linting**: Biome
- **Automation**: Playwright for E2E testing

### Development Environment
- **Dev Server**: `npm run dev` 
- **Protocol**: HTTP (standard development)
- **Production**: GitHub Pages deployment

### Project Architecture
- **Pattern**: OOP-based design (ECS abandoned)
- **Structure**: MVC with adapter pattern for external libraries
- **Rendering**: Fabric.js canvas rendering system

### Key Files
- `src/systems/FabricRenderSystem.ts` - Main rendering system
- `vite.config.js` - Build and test configuration
- `biome.json` - Code style configuration
</project-stack>

<essential-commands>
## Essential Commands

```bash
# Quality checks (run before commit)
npm run quality        # format + lint:fix + typecheck + test:coverage

# Development
npm run dev           # Start development server (port 3000)
npm run build         # Production build
npm run preview       # Preview production build

# Testing
npm test              # Run unit tests
npm run test:coverage # Run tests with coverage report

# Code quality
npm run format        # Format code with Biome
npm run lint:fix      # Fix linting issues
npm run typecheck     # TypeScript type checking
```
</essential-commands>

<development-workflow>
## Development Workflow

### 1. Issue Creation (Mandatory)
```bash
gh issue create --title "Feature: Description" --body "
## Problem
Brief description

## Acceptance Criteria
- [ ] Specific deliverable 1
- [ ] Tests added/updated
- [ ] Coverage maintained
"
```

### 2. Branch Creation
```bash
git checkout main
git pull origin main
git checkout -b feature/descriptive-name
```

### 3. Development Process
- Follow TDD: Test → Fail → Implement → Pass
- Run `npm run quality` before commits
- Commit frequently with conventional commit messages
- Update issue with progress comments

### 4. Pull Request
```bash
gh pr create --base main --title "feat: Description" --body "
## Summary
Brief description of changes

## Test Plan
- [ ] Tests added/updated
- [ ] Coverage maintained
- [ ] Manual testing completed

🤖 Generated with [Claude Code](https://claude.ai/code)
"
```

### Commit Convention
- `feat:` - New features
- `fix:` - Bug fixes  
- `test:` - Test additions/updates
- `refactor:` - Code refactoring
- `docs:` - Documentation updates
</development-workflow>

<code-intelligence-tools>
## Code Intelligence Tools

### Serena MCP Commands
```typescript
// Project overview
mcp__serena__initial_instructions()
mcp__serena__get_symbols_overview({ relative_path: "src" })

// Code analysis
mcp__serena__find_symbol({ name_path: "ClassName" })
mcp__serena__find_referencing_symbols({ 
    name_path: "ClassName", 
    relative_path: "src/file.ts" 
})

// Code editing
mcp__serena__replace_symbol_body({
    name_path: "ClassName/methodName",
    relative_path: "src/file.ts",
    body: "new implementation"
})

// Project memory
mcp__serena__write_memory({ 
    memory_name: "patterns.md", 
    content: "Project knowledge" 
})
mcp__serena__list_memories()
```

### Context7 Documentation
```typescript
// Resolve library ID
mcp__context7__resolve-library-id({ libraryName: "Fabric.js" })

// Get documentation
mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/fabricjs/fabric.js",
    topic: "Canvas rendering",
    tokens: 8000
})
```
</code-intelligence-tools>

<quality-standards>
## Code Quality Standards

### File Size Limits
- 300-line strict limit enforced by ESLint
- Break down large files using Serena for refactoring

### TypeScript Configuration
- Strict mode enabled
- Zero type errors required
- JSDoc for functional descriptions only
</quality-standards>

<file-management>
## File Management Rules

### Handover Documents (CRITICAL)
- **Location**: All AI handover documents MUST be placed in `.claude/` directory
- **Format**: Use descriptive names like `refactoring_handover.md`, `analysis_report.md`
- **Content**: English only, technical, objective, no personal references
- **Git Status**: These files are automatically gitignored and never committed

### Review Files
- **Pattern**: `*_review.md` files are gitignored
- **Usage**: Temporary analysis, code review notes
- **Location**: Project root or appropriate subdirectory

### Documentation Standards
- **Language**: English for all technical documentation
- **Tone**: Professional, objective, technical
- **Content**: No personal names, chat references, or private information
- **Purpose**: Must be usable as standalone technical reference
</file-management>

<troubleshooting>
## Troubleshooting

### Common Issues
- **Development server**: Standard HTTP development server
- **Test failures**: Check framework responsibility separation in mocks
- **Build errors**: Run `npm run typecheck` first

### Emergency Procedures
- Use `git commit --no-verify` only for urgent fixes
- Revert commits with `git revert` for production issues
- Check GitHub Actions for CI/CD status
</troubleshooting>

</claude-guidelines>

---
*Generated for AI assistant context and development workflow guidance*
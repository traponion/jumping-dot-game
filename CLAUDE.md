# Development Guidelines for jumping-dot-game

> **Note**: This document focuses on development workflow and GitHub Flow processes.  
> **For development standards and coding rules**, see `DEVELOPMENT_STANDARDS.md`.  
> For technical architecture and project overview, see `DEVELOPMENT_GUIDE.md` and `ARCHITECTURE.md`.

## Branch Strategy (GitHub Flow - Simplified)

This project follows a **simplified GitHub Flow** with direct main-branch development.

### Branch Structure
- `main` - Production-ready, stable code (protected)
- `feature/*` or `bugfix/*` - Short-lived development branches (disposable)

### Branch Protection Rules
- **main branch is protected**:
  - Pull Request required (minimum 1 approval)
  - CI/CD success required (`build-and-deploy` check)
  - Stale review dismissal enabled
  - Force push disabled
  - Direct push disabled

## Development Workflow

### 0. Task Planning and Issue Creation (MANDATORY)
**Before any development work begins, create a GitHub issue to track the task:**

```bash
# Create issue for the task (use descriptive title and body)
gh issue create --title "Performance: Fix death marker rendering bottleneck" --body "
## Problem
Describe the issue or feature request

## Expected Solution
Outline the expected approach or solution

## Acceptance Criteria
- [ ] Specific deliverable 1
- [ ] Specific deliverable 2
- [ ] Tests added/updated
- [ ] Performance benchmarks if applicable
"
```

**Why this step is mandatory:**
- Ensures task tracking and documentation
- Provides clear scope and acceptance criteria
- Enables progress tracking through issue comments
- Supports GitHub Flow workflow with issue-to-PR linking

### 1. Starting New Development
```bash
# Always start from the latest main branch
git checkout main
git pull origin main

# Branch name should reference the issue number when possible
git checkout -b feature/fix-death-marker-performance-#123
# or use descriptive names
git checkout -b feature/your-feature-name
git checkout -b bugfix/issue-description
```

### 2. Development Process
```bash
# Make your changes with frequent commits
git add .
git commit -m "feat: description of your feature"
git push -u origin feature/your-feature-name
```

### 3. Create Pull Request to main
```bash
gh pr create --base main --title "feat: Your Feature Title" --body "
## Summary
- Brief description of changes

## Test plan
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] CI/CD passing

🤖 Generated with [Claude Code](https://claude.ai/code)
"
```

### 4. Code Review and Merge
- Wait for at least 1 approval from another developer
- Address review comments if any
- Ensure all CI/CD checks pass
- **Merge immediately after approval** (no dev branch integration needed)
- **Delete feature branch** after merge to keep repository clean

### 5. Post-Merge Cleanup
```bash
# After successful merge, clean up local branches
git checkout main
git pull origin main
git branch -d feature/your-feature-name
git remote prune origin
```

## Code Quality Standards

> **For detailed coding standards and rules**, see `DEVELOPMENT_STANDARDS.md`

### Key Quality Requirements
- **300-line limit**: STRICT enforcement via ESLint (CI blocking)
- **TypeScript strict mode**: Zero type errors required
- **Testing Requirements**:
  - utils module: 95% lines, 100% functions coverage
  - systems module: 90% lines, 95% functions coverage
  - core module: 80% lines, 90% functions coverage
- **JSDoc**: Functional description only (no redundant type info)

### Commit Message Format
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `docs:` - Documentation updates

### Architecture Guidelines
- **OOP-based design** (ECS approach abandoned)
- Use dependency inversion (adapter pattern) for external libraries
- Maintain separation of concerns (MVC pattern)
- Write testable code with proper mocking
- Follow TypeScript strict mode

## Tools and Commands

### Essential Commands
```bash
# Code quality checks
npm run lint         # Biome code style check
npm run lint:fix     # Biome code style fix
npm run format       # Biome code formatting
npm run quality      # Run format + lint:fix + typecheck in sequence

# Type checking
npm run typecheck

# Run tests
npm test
npm run test:coverage

# Build project
npm run build

# GitHub CLI operations
gh pr list
gh pr create
gh pr review
gh run list
```

### Pre-push Checklist
- [ ] Code quality passes: `npm run quality` (format + lint:fix + typecheck)
- [ ] Tests pass locally: `npm test`
- [ ] Coverage meets requirements: `npm run test:coverage`
- [ ] Build succeeds: `npm run build`

### Pre-commit Hooks (Automated)
The following quality checks run automatically on `git commit`:
- Code formatting (`npm run format`)
- Lint fixes (`npm run lint:fix`)
- TypeScript checking (`npm run typecheck`)
- Test execution (`npm test`)

## Emergency Procedures

### Hotfix Process
For urgent production fixes:
1. Create `hotfix/description` branch from `main`
2. Make minimal fix with tests
3. Create PR directly to `main` (may require admin override for expedited review)
4. Deploy immediately after merge
5. Delete hotfix branch after successful deployment

### Rolling Back
If issues are found in production:
1. Revert the problematic commit on `main`
2. Deploy reverted version immediately
3. Create new feature branch to investigate and fix properly
4. Follow normal PR process for the proper fix

## Documentation Standards

### Language and Location Requirements
1. **Language:** All official documentation (`README.md`, `CONTRIBUTING.md`, files in `/docs`) must be written in English.
2. **Location:**
   - User-facing and contributor-facing documents reside in the root or `/docs` directory.
   - Temporary or internal development notes (like TODOs) should be managed via GitHub Issues.
   - Archived technical write-ups are stored in `.claude/archive/`.
3. **Tone & Style:** Maintain a professional and objective tone. Avoid personal names, slang, or overly casual expressions in official documents.
4. **Review Process:** All changes to official documentation must be submitted via Pull Request and are subject to the same review process as code changes.
5. **`CLAUDE.md`:** This file is for providing context and instructions to AI assistants. It can be more informal.

### Document Structure
- **Root Directory:**
  - `README.md` - Project overview and quick start
  - `CONTRIBUTING.md` - Contribution guidelines and setup
  - `CODE_OF_CONDUCT.md` - Community behavior guidelines
  - `LICENSE` - Project license
- **`/docs` Directory:**
  - `architecture.md` - Technical architecture and design
  - `api-reference.md` - Complete API documentation
- **`.github` Directory:**
  - Issue and pull request templates
  - GitHub Actions workflows
- **`.claude` Directory:**
  - Internal development documentation
  - AI assistant instructions
  - Archived technical documents

## Related Documentation
- `CONTRIBUTING.md` - Contribution guidelines and workflow
- `docs/architecture.md` - Technical architecture details
- `docs/api-reference.md` - API specifications
- `DEVELOPMENT_STANDARDS.md` - Coding standards and conventions
- `testing-coverage-standards.md` - Testing requirements and standards

## Notes for Claude Development
- Always check current branch before starting work
- Use TodoWrite tool for task planning and tracking
- Follow TDD approach when possible
- Commit frequently with descriptive messages
- Use GitHub Actions for CI/CD validation
- Maintain high code coverage standards
- Review existing `.claude/` documentation before starting new features
- **Parallel Task Execution**: Utilize multiple tool calls in a single response for efficiency when tasks are independent (e.g., reading multiple files, running multiple bash commands)
- **Task Delegation**: For large file operations, web searches, or complex searches across codebase, consider using the Task tool to delegate work to specialized agents
- **Review File Cleanup**: Always delete review.md files after processing them completely - this is a mandatory cleanup rule
- **Library Documentation**: When explaining frameworks, plugins, or libraries, use Context7 (mcp__context7__resolve-library-id and mcp__context7__get-library-docs) to get the most up-to-date and accurate information instead of relying on training data

### Context7 Library Documentation Tool

#### **When to Use Context7**
- **Framework Configuration**: When setting up or configuring tools like Biome, ESLint, Vite, TypeScript, etc.
- **API Reference Lookup**: When you need specific API usage examples or parameter details
- **Version-Specific Features**: When working with specific library versions or checking compatibility
- **Best Practices**: When implementing patterns recommended by the library maintainers
- **Troubleshooting**: When debugging tool-specific issues or configuration problems

#### **Usage Pattern**
```typescript
// 1. First, resolve the library ID
mcp__context7__resolve-library-id({ libraryName: "Biome" })

// 2. Then get specific documentation
mcp__context7__get-library-docs({
    context7CompatibleLibraryID: "/biomejs/biome",
    topic: "linter rules configuration",  // Focus on specific topic
    tokens: 8000  // Adjust based on needs
})
```

#### **Benefits Over Training Data**
- **Up-to-date Information**: Gets latest documentation and changes
- **Accurate Configuration Examples**: Real, tested configuration snippets
- **Version-Specific Details**: Handles library version differences
- **Authoritative Source**: Direct from official documentation

### Handover Documents for ねつき Sessions

#### **Purpose**
- Maintain continuity between ねつき sessions for complex, multi-session tasks
- Document progress, learnings, and next steps
- Share context that might be lost between sessions

#### **Location & Format**
- **File:** `.claude/handover_document.md`
- **Status:** Git-ignored (temporary, not committed)
- **Language:** Mix of Japanese (ねつき voice) and English (technical content)

#### **When to Create**
- Multi-session tasks (work spanning multiple conversations)
- Complex bug investigations that require deep context
- Architectural decisions that need follow-up
- When discoveries lead to new task identification

#### **Content Structure**
1. **Completed Tasks** - What was finished, PR status
2. **Next Priority Task** - Specific next steps with context
3. **Technical Learnings** - Architecture insights, patterns discovered
4. **Files Modified** - Specific changes made
5. **Testing Notes** - Test patterns, coverage status
6. **Messages from Current ねつき** - Personal notes and encouragement

#### **Best Practices**
- Be specific about file paths and code locations
- Include code snippets for important patterns
- Document WHY decisions were made, not just WHAT
- Link to related PRs, issues, or documentation
- Keep technical content in English for clarity
- Maintain ねつき's friendly tone in personal sections

### Local Development Server Constraints
- **Cannot run `npm run dev`**: Claude cannot start or manage local development servers
- **User responsibility**: User must start and maintain `npm run dev` session when needed for testing
- **Request format**: When server testing is needed, ask user to start the server and provide feedback
- **Alternative testing**: Use unit tests and build verification instead of live server testing when possible

## Serena MCP Code Intelligence Tool

### Overview
Serena is an advanced code intelligence tool that provides semantic understanding of the codebase through symbol-based analysis. It serves as a powerful alternative to LSP (Language Server Protocol) with additional project memory capabilities.

### Essential Serena Commands

#### Code Discovery & Analysis
```typescript
// Find symbols (classes, methods, etc.) with optional body content
mcp__serena__find_symbol({
    name_path: "GameManager",           // Symbol name or path
    relative_path: "src/core",          // Restrict to file/directory
    include_body: false,                // Include source code
    depth: 1                            // Include children (methods, properties)
})

// Find all references to a symbol
mcp__serena__find_referencing_symbols({
    name_path: "GameManager",
    relative_path: "src/core/GameManager.ts"
})

// Get overview of symbols in a file/directory
mcp__serena__get_symbols_overview({
    relative_path: "src/core"
})

// Search for patterns in code
mcp__serena__search_for_pattern({
    pattern: "function.*calculate.*",    // Regex pattern
    only_in_code_files: true
})
```

#### Code Editing
```typescript
// Replace entire symbol body
mcp__serena__replace_symbol_body({
    name_path: "GameManager/update",
    relative_path: "src/core/GameManager.ts",
    body: "update(deltaTime: number): void {\n    // New implementation\n}"
})

// Insert code before/after symbols
mcp__serena__insert_after_symbol({
    name_path: "GameManager",
    relative_path: "src/core/GameManager.ts",
    body: "// New method implementation"
})

// Regex-based replacements for complex edits
mcp__serena__replace_regex({
    relative_path: "src/core/GameManager.ts",
    regex: "const.*oldVariable.*=.*",
    repl: "const newVariable = newValue;"
})
```

#### Project Memory & Context
```typescript
// Write project knowledge to memory
mcp__serena__write_memory({
    memory_name: "architecture_patterns.md",
    content: "# Project uses MVC pattern with Adapter design..."
})

// Read existing memories
mcp__serena__read_memory({
    memory_file_name: "suggested_commands.md"
})

// List all available memories
mcp__serena__list_memories()
```

### Serena Workflow Best Practices

#### Before Starting Work
1. Call `mcp__serena__initial_instructions()` to understand context
2. Check if onboarding is complete with `mcp__serena__check_onboarding_performed()`
3. Read relevant memories to understand project structure

#### Code Analysis Workflow
1. **High-level overview**: Use `get_symbols_overview()` for directory structure
2. **Find specific symbols**: Use `find_symbol()` with appropriate `name_path`
3. **Understand relationships**: Use `find_referencing_symbols()` to see usage
4. **Think about information**: Always call `think_about_collected_information()`

#### Editing Workflow
1. **Before editing**: Call `think_about_task_adherence()` to stay on track
2. **Choose editing method**:
   - Symbol-level: Use `replace_symbol_body()` for whole functions/classes
   - Precise edits: Use `replace_regex()` for smaller changes
3. **After editing**: Call `think_about_whether_you_are_done()`
4. **Summarize changes**: Use `summarize_changes()` when task is complete

### Symbol Name Path Patterns
- **Simple name**: `"GameManager"` - matches any symbol with this name
- **Relative path**: `"GameManager/update"` - method within class
- **Absolute path**: `"/GameManager"` - only top-level symbols
- **Depth parameter**: Include child symbols (methods, properties)

### Memory Management
- Store project-specific knowledge in memory files
- Use descriptive memory names (e.g., `"testing_patterns.md"`)
- Read memories that are relevant to current task
- Update memories when project structure changes

### Advantages over Traditional LSP
- **Project context awareness**: Remembers project structure and patterns
- **Robust symbol resolution**: Works reliably across complex codebases  
- **Advanced editing capabilities**: Symbol-level and regex-based modifications
- **Integrated thinking**: Built-in analysis and reflection tools
- **Memory persistence**: Maintains project knowledge across sessions

## Tool Selection Decision Matrix

### When to Use Serena vs Claude Code

#### **Use Serena for:**
- **Large-scale refactoring** (splitting files, moving code, architectural changes)
- **Structural analysis** (understanding dependencies, finding references)
- **Symbol-level operations** (renaming classes, moving methods)
- **Test pattern discovery** (understanding existing test structures)
- **Code organization tasks** (extracting classes, creating new modules)

#### **Use Claude Code for:**
- **Individual file editing** (bug fixes, small features)
- **Sequential file operations** (batch editing multiple files)
- **Documentation updates** (README, comments, etc.)
- **Simple test additions** (adding individual test cases)
- **Direct file manipulation** (file creation, deletion, simple edits)

### Lessons from File Size Reduction Project

#### **Pre-Refactoring Checklist**
- [ ] Check test coverage requirements in `CLAUDE.md`
- [ ] Create feature branch: `git checkout -b feature/task-description`
- [ ] Understand current architecture with Serena's `get_symbols_overview`
- [ ] Plan test maintenance strategy for coverage preservation

#### **During Large Refactoring**
- **Expected Issues:**
  - Test coverage will drop when extracting new classes/modules
  - New files need dedicated unit tests
  - Integration tests may need updates for new architecture
- **Mitigation Strategy:**
  - Plan test additions alongside code extraction
  - Use Serena to understand existing test patterns
  - Prioritize high-impact, low-dependency modules for testing first

#### **Post-Refactoring Recovery**
- **Test Priority Order** (based on impact and complexity):
  1. New utility classes (`ObjectDrawer`, `GridManager`) - standalone, easy to test
  2. New service layers (`PlayerUpdateService`, `GameLogicService`) - pure logic
  3. New renderers (`HUDRenderer`, `OverlayRenderer`) - UI components
  4. Enhanced validation (GameModel improvements)
  5. Integration test updates for controllers/managers

#### **Coverage Recovery Strategy**
```bash
# Check specific module coverage
npm run test:coverage -- src/adapters/ObjectDrawer.ts

# Add unit tests for extracted modules first
# They have fewer dependencies and higher impact on coverage
```

#### **Common Pitfalls**
- ❌ **Don't** start refactoring on main branch
- ❌ **Don't** assume existing tests will cover extracted code
- ❌ **Don't** leave coverage below project requirements (utils: 95%, systems: 90%, core: 80%)
- ✅ **Do** use Serena for structural understanding before editing
- ✅ **Do** plan test additions as part of refactoring scope
- ✅ **Do** create PR even for architectural changes

---
*Last updated: 2025-06-20*
*Added tool selection matrix and refactoring lessons learned*
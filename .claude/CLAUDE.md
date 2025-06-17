# Development Guidelines for jumping-dot-game

> **Note**: This document focuses on development workflow and GitHub Flow processes.  
> For technical architecture and project overview, see `DEVELOPMENT_GUIDE.md` and `ARCHITECTURE.md`.

## Branch Strategy (GitHub Flow)

This project follows the **GitHub Flow** development strategy with branch protection rules.

### Branch Structure
- `main` - Production-ready, stable code (protected)
- `dev` - Default development branch (integration)
- `feature/*` - Feature development branches

### Branch Protection Rules
- **main branch is protected**:
  - Pull Request required (minimum 1 approval)
  - CI/CD success required (`build-and-deploy` check)
  - Stale review dismissal enabled
  - Force push disabled
  - Direct push disabled

## Development Workflow

### 1. Starting New Development
```bash
# Always start from the latest dev branch
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

### 2. Development Process
```bash
# Make your changes
git add .
git commit -m "feat: description of your feature"
git push -u origin feature/your-feature-name
```

### 3. Create Pull Request to dev
```bash
gh pr create --base dev --title "feat: Your Feature Title" --body "
## Summary
- Brief description of changes

## Test plan
- [ ] Tests added/updated
- [ ] Manual testing completed
- [ ] CI/CD passing

🤖 Generated with [Claude Code](https://claude.ai/code)
"
```

### 4. Code Review Process
- Wait for at least 1 approval from another developer
- Address review comments if any
- Ensure all CI/CD checks pass
- Merge after approval

### 5. Release to Production (main)
```bash
# After features are tested in dev, create release PR
gh pr create --base main --title "release: v1.x.x" --body "
## Release Notes
- Feature 1 description
- Feature 2 description
- Bug fixes

## Checklist
- [ ] All tests passing
- [ ] Code coverage maintained
- [ ] Documentation updated
"
```

## Code Quality Standards

### Testing Requirements
- **utils module**: 95% lines, 100% functions coverage
- **systems module**: 90% lines, 95% functions coverage
- **core module**: 80% lines, 90% functions coverage
- All new code must include tests

### Commit Message Format
Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring
- `docs:` - Documentation updates

### Architecture Guidelines
- Use dependency inversion (adapter pattern) for external libraries
- Maintain separation of concerns (MVC pattern)
- Write testable code with proper mocking
- Follow TypeScript strict mode

## Tools and Commands

### Essential Commands
```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck

# Build project
npm run build

# GitHub CLI operations
gh pr list
gh pr create
gh pr review
gh run list
```

### Pre-push Checklist
- [ ] Tests pass locally: `npm test`
- [ ] Coverage meets requirements: `npm run test:coverage`
- [ ] TypeScript compiles: `npm run typecheck`
- [ ] Build succeeds: `npm run build`

## Emergency Procedures

### Hotfix Process
For urgent production fixes:
1. Create `hotfix/description` branch from `main`
2. Make minimal fix
3. Create PR directly to `main` (will require admin override)
4. After merge, also merge `main` back to `dev`

### Rolling Back
If issues are found in production:
1. Revert the problematic commit on `main`
2. Create new release
3. Investigate and fix in `dev` branch

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

---
*Last updated: 2025-06-15*
*This document should be updated when development processes change*
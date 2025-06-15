# Development Guidelines for jumping-dot-game

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

## Notes for Claude Development
- Always check current branch before starting work
- Use TodoWrite tool for task planning and tracking
- Follow TDD approach when possible
- Commit frequently with descriptive messages
- Use GitHub Actions for CI/CD validation
- Maintain high code coverage standards

---
*Last updated: 2025-06-15*
*This document should be updated when development processes change*
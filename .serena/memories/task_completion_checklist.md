# Task Completion Checklist

## Before Committing Code
1. **Type Check**: `npm run typecheck` - Must pass
2. **Linting**: `npm run lint` - Fix all issues  
3. **Formatting**: `npm run format` - Apply consistent style
4. **Testing**: `npm run test` - All tests must pass
5. **Coverage**: Maintain test coverage levels

## Quality Gates
- No TypeScript errors
- No linting errors
- All existing tests pass
- New features have tests
- Code follows style conventions

## Development Workflow
1. Create feature branch from main
2. Make changes with frequent commits
3. Run quality checks before push
4. Create pull request to main
5. All CI checks must pass

## Performance Considerations
- FPS target: 60fps
- Memory usage: <50MB
- Initialization: <3s
- Object creation: <16ms

## Documentation Updates
- Update JSDoc for new/modified methods
- Update README if public API changes
- Update architecture docs for significant changes

## Testing Requirements
- Unit tests for business logic
- Integration tests for component interactions
- Performance tests for critical paths
- Coverage reports generated and reviewed
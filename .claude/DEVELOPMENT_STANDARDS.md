# Development Standards and Guidelines

## Project Information
- **Project Name**: Jumping Dot Game
- **Language**: TypeScript (Strict Mode)
- **Testing Framework**: Vitest + @vitest/coverage-v8
- **Development Methodology**: Test-Driven Development (TDD)
- **Repository**: https://github.com/traponion/jumping-dot-game

## Core Development Principles

### 1. TypeScript Strict Mode Compliance (100%)
- **Type Safety**: `strict: true` with additional strict options enabled
- **Build-time Type Checking**: `npm run build` = `npm run typecheck && vite build`
- **CI/CD Type Validation**: GitHub Actions enforces `npx tsc --noEmit`
- **Prohibited Practices**:
  - ❌ `any` type usage
  - ❌ Excessive `as` type assertions
  - ❌ Forced `unknown` type conversions
  - ❌ `// @ts-ignore` comments
  - ❌ Excessive non-null assertions (`!`)

### 2. Type Design Standards
- **Type Guards**: Validate `unknown` types with proper type guard functions
- **Type Centralization**: Consolidate type definitions in `src/types/GameTypes.ts`
- **Interface Design**: Define explicit and meaningful types
- **Generic Utilization**: Balance type safety with code reusability

### 3. Code Quality Standards
- **Coverage Requirements**:
  - Systems: 90%+ (critical systems)
  - Core: 80%+ (considering Facade pattern)
  - Utils: 95%+ (utility functions)
- **Architecture**: SOLID principles + ECS-inspired design
- **File Size**: Consider splitting files exceeding 150 lines
- **Responsibility**: Separate concerns when handling 3+ responsibilities

### 4. Test-Driven Development (TDD)
- **Red-Green-Refactor**: Test failure → Implementation → Refactoring
- **Test-First Approach**: Write tests before implementation
- **Mock Strategy**: Complete mocking of DOM, Canvas, and Browser APIs
- **Integration Focus**: Prioritize public API testing over private methods

### 5. Error Handling Standards
- **Explicit Error Processing**: try-catch with appropriate error messages
- **Type-based Safety**: Express error possibilities through types
- **Validation**: Validate external data before usage
- **Fail-Fast Principle**: Immediate error response for invalid states

## Development Tools and Environment

### Required Tools
- **Biome**: ESLint + Prettier integration (auto-formatting and linting)
- **TypeScript**: Latest version with strict configuration
- **Vitest**: Test execution and coverage measurement
- **GitHub Actions**: CI/CD pipeline and quality gates

### Development Scripts
```bash
npm run typecheck    # TypeScript type checking (mandatory)
npm run build        # Type checking + build (stops on type errors)
npm run test         # Test execution
npm run test:coverage # Coverage measurement
npm run lint         # Biome linting
npm run format       # Biome formatting
```

### CI/CD Pipeline
1. TypeScript type checking (`npx tsc --noEmit`)
2. Test execution (`npm test`)
3. Coverage measurement (`npm run test:coverage`)
4. Build process (`npm run build`)
5. Deployment (GitHub Pages)

## Coding Standards

### Naming Conventions
- **Classes**: PascalCase (`PlayerSystem`, `AnimationSystem`)
- **Functions/Variables**: camelCase (`updatePlayer`, `deltaTime`)
- **Constants**: SCREAMING_SNAKE_CASE (`GAME_CONFIG`, `MAX_VELOCITY`)
- **Files**: PascalCase.ts (`GameTypes.ts`, `PlayerSystem.ts`)

### Import/Export Standards
- **Named Exports**: `export class PlayerSystem`
- **Type Imports**: `import type { Player } from '../types/GameTypes.js'`
- **Relative Paths**: `../` with mandatory `.js` extension

### Documentation Standards
- **JSDoc**: Required for all public methods
- **Inline Comments**: Only for complex logic
- **TODO Comments**: Include clear deadlines and assignees

## Prohibited Practices and Anti-patterns

### Strictly Forbidden Code
```typescript
// ❌ Bad Example
const data = response as any;
const user = data.user!;
// @ts-ignore
user.unknownProperty = value;

// ✅ Good Example
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

### Design Anti-patterns
- **God Objects**: Single class handling multiple responsibilities
- **Tight Coupling**: Direct dependencies between systems
- **Untestable Design**: Difficult to mock or stub
- **Type Compromises**: Sacrificing type safety for implementation convenience

## Quality Targets

### Quantitative Goals
- **TypeScript Errors**: 0 (build-time)
- **Test Coverage**: 90%+
- **Build Time**: Under 30 seconds
- **Test Execution Time**: Under 10 seconds

### Qualitative Goals
- **Maintainability**: New team members can understand within 1 day
- **Extensibility**: Easy addition of new features
- **Stability**: Minimal regression occurrences
- **Performance**: Stable 60fps operation

## Code Review Standards

### Mandatory Checklist
- [ ] Zero TypeScript type errors
- [ ] Test coverage maintained/improved
- [ ] SOLID principles adherence
- [ ] Proper error handling implementation
- [ ] Complete JSDoc documentation
- [ ] Biome formatting applied

### Recommended Checklist
- [ ] Performance optimization considerations
- [ ] Accessibility compliance
- [ ] Security aspect verification
- [ ] Browser compatibility confirmation

## Documentation Standards

### Technical Documentation Requirements
- **Language**: English for all formal documentation
- **Format**: Markdown with consistent structure
- **Tone**: Professional, objective, technical
- **Content Standards**:
  - Remove subjective opinions and personal expressions
  - Focus on factual technical information
  - Include code examples and implementation patterns
  - Provide clear problem-solution mappings
  - Document validation results and metrics

### Documentation Structure
```
.claude/
├── DEVELOPMENT_STANDARDS.md      # This file - core development rules
├── fabric-js-integration-technical-guide.md  # Technical integration guide
├── typescript-testing-patterns.md # Testing methodology documentation
├── library-integration-guide.md   # Third-party library integration
├── modernization-roadmap.md       # Architecture evolution plan
└── settings.local.json           # Local development configuration
```

### Documentation Maintenance
- **Updates**: Synchronize with code changes
- **Validation**: Verify accuracy through implementation
- **Review**: Technical review for accuracy and clarity
- **Versioning**: Track significant documentation changes

## Quality Assurance Process

### Continuous Integration Requirements
- All tests must pass (132/132 test success rate)
- Type checking must complete without errors
- Coverage thresholds must be met
- Build process must complete successfully
- Linting standards must be satisfied

### Development Workflow
1. **Feature Planning**: Document requirements and approach
2. **TDD Implementation**: Write tests first, then implementation
3. **Type Safety Validation**: Ensure strict TypeScript compliance
4. **Code Review**: Peer review with checklist validation
5. **Integration Testing**: Verify CI/CD pipeline success
6. **Documentation Update**: Maintain current documentation

---

**Document Version**: 2.0 (Formalized English Edition)  
**Last Updated**: June 14, 2025  
**Status**: Active Development Standards

> This project prioritizes uncompromising quality and type safety.  
> All development must adhere to these standards for maintainable, reliable software.
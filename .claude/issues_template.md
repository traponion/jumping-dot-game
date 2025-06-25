# 🎫 PixiJS Migration Issues Template

## Epic Issue (手動作成が必要)

**Title**: Epic: Migrate from FabricJS to PixiJS v8

**Body**:
```markdown
# 🚀 Epic: Migrate from FabricJS to PixiJS v8

## 🎯 Migration Goals
- **Performance**: 9fps → 60fps (7x improvement)
- **Code Quality**: 780 lines → 400-500 lines (35-40% reduction) 
- **Bundle**: Accept 220kB for dramatic performance gains
- **Architecture**: Eliminate over-engineered FabricRenderSystem

## 📋 Migration Phases

### Phase 1: Foundation & Basic Rendering (Week 1-2)
- [ ] Setup PixiJS v8 dependencies and build configuration
- [ ] Create PixiRenderSystem class with basic architecture  
- [ ] Implement basic shape rendering (circles, lines, rectangles)
- [ ] Migrate camera transform system from FabricJS to PixiJS
- [ ] Ensure test coverage maintained during foundation work

### Phase 2: Core Game Features (Week 2-3)
- [ ] Migrate trail effects to PixiJS ParticleContainer
- [ ] Convert text rendering from Fabric.Text to PIXI.Text
- [ ] Implement death marks using PixiJS Graphics API
- [ ] Integrate collision detection with new rendering system
- [ ] Adapt animation system for PixiJS ticker

### Phase 3: UI & Polish (Week 3-4)
- [ ] Migrate game over menu to PixiJS Container composition
- [ ] Implement stage transition effects
- [ ] Performance optimization and profiling
- [ ] Cross-browser compatibility testing
- [ ] Bundle size analysis and tree-shaking optimization

### Phase 4: Testing & Cleanup (Week 4)
- [ ] Comprehensive testing across all game features
- [ ] Remove FabricJS dependencies and cleanup
- [ ] Update documentation and API references
- [ ] Performance benchmarking and validation
- [ ] Final code review and production readiness

## 📊 Success Metrics
- **Frame Rate**: Consistent 60fps
- **Bundle Size**: <250kB minified  
- **Test Coverage**: Maintain ≥90%
- **Memory Usage**: <100MB heap
- **Code Quality**: <500 lines main renderer

## 📚 Resources
- Migration handover document: `.claude/migration_handover.md`
- PixiJS v8 documentation: https://pixijs.com/

🤖 Generated with [Claude Code](https://claude.ai/code)
```

---

## Phase 1 Issues

### Issue 1: Setup PixiJS v8 Dependencies

**Title**: Phase 1.1: Setup PixiJS v8 dependencies and build configuration

**Labels**: `pixijs-migration`, `dependencies`, `phase-1`

**Body**:
```markdown
# 🔧 Setup PixiJS v8 Dependencies and Build Configuration

**Phase**: 1 - Foundation  
**Priority**: High  
**Estimated Time**: 4-6 hours

## 🎯 Objective
Replace FabricJS with PixiJS v8 in the project dependencies and ensure proper build configuration.

## 📋 Tasks

### Dependencies
- [ ] Remove FabricJS dependency from package.json
- [ ] Install PixiJS v8: `npm install pixi.js@^8.0.0`
- [ ] Install TypeScript types: `npm install --save-dev @types/pixi.js`
- [ ] Update package-lock.json

### Build Configuration
- [ ] Verify Vite handles PixiJS imports correctly
- [ ] Test tree-shaking works with PixiJS v8
- [ ] Update any import paths from Fabric to temporary placeholders
- [ ] Ensure TypeScript strict mode compatibility

### Validation
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] Bundle size analysis (should be ~220kB for PixiJS core)
- [ ] No FabricJS references remain in package.json

## 🧪 Acceptance Criteria
- [ ] FabricJS completely removed from dependencies
- [ ] PixiJS v8 successfully installed and importable
- [ ] Build process works without errors
- [ ] TypeScript compilation succeeds
- [ ] Bundle size increase documented and acceptable

## ⚠️ Notes
- Temporarily comment out FabricRenderSystem imports to avoid build errors
- Document bundle size change for stakeholder review
- This task sets foundation for all subsequent migration work

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### Issue 2: Create PixiRenderSystem

**Title**: Phase 1.2: Create PixiRenderSystem class with basic architecture

**Labels**: `pixijs-migration`, `architecture`, `phase-1`

**Body**:
```markdown
# 🏗️ Create PixiRenderSystem Class with Basic Architecture

**Phase**: 1 - Foundation  
**Priority**: High  
**Estimated Time**: 6-8 hours

## 🎯 Objective
Create the new `PixiRenderSystem` class to replace `FabricRenderSystem` with clean, maintainable architecture.

## 📋 Tasks

### Architecture Setup
- [ ] Create `src/systems/PixiRenderSystem.ts`
- [ ] Design class interface similar to FabricRenderSystem but simplified
- [ ] Implement basic PIXI.Application initialization
- [ ] Setup canvas management and resize handling
- [ ] Create render loop integration with game ticker

### Core Methods (Stub Implementation)
- [ ] `constructor()` - Initialize PixiJS app
- [ ] `dispose()` - Cleanup resources
- [ ] `renderStage()` - Main render method (empty initially)
- [ ] `setLandingPredictions()` - Stub for compatibility
- [ ] `updateCamera()` - Camera transform system

### Integration Points
- [ ] Update RenderSystemFactory to optionally return PixiRenderSystem
- [ ] Ensure interface compatibility with existing game systems
- [ ] Add feature flag for switching between Fabric/Pixi
- [ ] Basic error handling and logging

## 🧪 Acceptance Criteria
- [ ] PixiRenderSystem class created and compiles
- [ ] Basic PixiJS app initializes without errors
- [ ] Canvas properly attached to DOM
- [ ] Feature flag allows switching render systems
- [ ] All existing tests still pass (using FabricJS by default)
- [ ] No memory leaks in dispose() method

## 🔗 Integration Notes
- Maintain same public interface as FabricRenderSystem
- Use adapter pattern for smooth transition
- Focus on architecture, not feature implementation

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### Issue 3: Basic Shape Rendering

**Title**: Phase 1.3: Implement basic shape rendering (circles, lines, rectangles)

**Labels**: `pixijs-migration`, `rendering`, `phase-1`

**Body**:
```markdown
# 🎨 Implement Basic Shape Rendering

**Phase**: 1 - Foundation  
**Priority**: High  
**Estimated Time**: 8-10 hours

## 🎯 Objective
Implement core shape rendering functionality using PixiJS Graphics API.

## 📋 Tasks

### Shape Rendering Implementation
- [ ] **Player Circle**: Convert from fabric.Circle to PIXI.Graphics.circle()
- [ ] **Platforms**: Convert from fabric.Line to PIXI.Graphics.moveTo/lineTo
- [ ] **Moving Platforms**: Golden lines with proper styling
- [ ] **Spikes**: Triangle polygons using PIXI.Graphics.polygon
- [ ] **Goal**: Rectangle outline rendering
- [ ] **Death Marks**: X-shaped paths using moveTo/lineTo

### Coordinate System Migration
- [ ] Handle coordinate system differences (Fabric vs PixiJS)
- [ ] Ensure proper object positioning and sizing
- [ ] Test with different screen resolutions
- [ ] Verify pixel-perfect rendering

### Performance Optimization
- [ ] Object pooling for frequently created shapes
- [ ] Efficient Graphics object reuse
- [ ] Minimize draw calls where possible
- [ ] Profile rendering performance

## 🧪 Acceptance Criteria
- [ ] All basic shapes render correctly
- [ ] Visual output matches FabricJS version
- [ ] Performance is equal or better than FabricJS
- [ ] Works on different screen sizes
- [ ] No visual artifacts or glitches
- [ ] Memory usage is reasonable

## 🔗 Testing
- [ ] Visual regression tests
- [ ] Performance benchmarks
- [ ] Cross-browser validation

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### Issue 4: Camera Transform System

**Title**: Phase 1.4: Migrate camera transform system from FabricJS to PixiJS

**Labels**: `pixijs-migration`, `camera`, `phase-1`

**Body**:
```markdown
# 📷 Migrate Camera Transform System

**Phase**: 1 - Foundation  
**Priority**: High  
**Estimated Time**: 6-8 hours

## 🎯 Objective
Replace FabricJS viewport transforms with PixiJS-based camera system.

## 📋 Tasks

### Camera System Design
- [ ] Analyze current FabricJS `setViewportTransform()` usage
- [ ] Design PixiJS camera architecture (Container vs stage.position)
- [ ] Implement smooth camera following player
- [ ] Handle camera bounds and constraints

### Transform Implementation
- [ ] Replace `setViewportTransform([1,0,0,1,-x,-y])` calls
- [ ] Implement camera shake effects if needed
- [ ] Ensure proper coordinate mapping
- [ ] Handle zoom functionality (if used)

### Integration & Testing
- [ ] Test camera movement smoothness
- [ ] Verify all game objects move correctly with camera
- [ ] Check edge cases (player at boundaries)
- [ ] Performance validation

## 🧪 Acceptance Criteria
- [ ] Camera follows player smoothly
- [ ] No visual stuttering or jumps
- [ ] Performance is equal or better than FabricJS
- [ ] All game elements respond correctly to camera movement
- [ ] Camera bounds work properly

## 🔗 Technical Notes
```typescript
// OLD (FabricJS)
this.canvas.setViewportTransform([1, 0, 0, 1, -camera.x, -camera.y]);

// NEW (PixiJS) - Option 1
this.app.stage.position.set(-camera.x, -camera.y);

// NEW (PixiJS) - Option 2 (Recommended)
this.cameraContainer.position.set(-camera.x, -camera.y);
```

🤖 Generated with [Claude Code](https://claude.ai/code)
```

---

## Additional Issues Template

Continue this pattern for Phase 2, 3, and 4 issues...

**Next Issues to Create**:
- Phase 1.5: Test coverage maintenance
- Phase 2.1: Trail effects migration  
- Phase 2.2: Text rendering migration
- Phase 2.3: Death marks implementation
- Phase 2.4: Collision detection integration
- Phase 2.5: Animation system adaptation
- (Continue for Phase 3 and 4...)

---

## 📝 Issue Creation Instructions

1. Create issues manually in GitHub
2. Use the templates above for consistent formatting
3. Apply appropriate labels: `pixijs-migration`, `phase-X`, priority level
4. Link issues to Epic for tracking
5. Update `.claude/migration_handover.md` with issue numbers
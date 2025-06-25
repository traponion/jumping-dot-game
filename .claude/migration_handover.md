# 🚀 FabricJS → PixiJS Migration Handover Document

## 📋 Overview
This document provides comprehensive information for migrating the jumping dot game from FabricJS to PixiJS v8, ensuring smooth handover between sessions.

## 🎯 Migration Objectives
- **Bundle Size**: 95.2kB → 220kB (acceptable increase for performance gains)
- **Performance**: 9fps → 60fps (7x improvement)
- **Code Reduction**: 780 lines → 400-500 lines (35-40% reduction)
- **Over-engineering Fix**: Eliminate complex FabricRenderSystem architecture

## 📊 Current State Analysis

### 🔍 Pain Points in Current Implementation
1. **FabricRenderSystem.ts**: 780 lines - too complex for simple game
2. **Performance**: Poor frame rates with particles/animations
3. **Bundle**: 36MB node_modules, 95.2kB minified
4. **Maintenance**: Complex object lifecycle management

### ✅ What Works Well (Keep These Patterns)
- Test coverage: 90.07% (maintain this!)
- MVC architecture pattern
- TypeScript strict mode
- Modular system design
- Error handling with ErrorHandler class

## 🛣️ Migration Strategy

### Phase 1: Foundation (Week 1-2)
**Goal**: Replace FabricRenderSystem with PixiRenderSystem

**Tasks**:
1. Install PixiJS v8 dependencies
2. Create basic PixiRenderSystem class
3. Implement basic shape rendering (circles, lines, rectangles)
4. Migrate camera transform system
5. Ensure test coverage maintained

### Phase 2: Core Features (Week 2-3) 
**Goal**: Migrate all game rendering functionality

**Tasks**:
1. Trail effects → PixiJS ParticleContainer
2. Text rendering → PIXI.Text
3. Death marks → Graphics API paths
4. Collision detection integration
5. Animation system adaptation

### Phase 3: UI & Polish (Week 3-4)
**Goal**: Complete UI migration and optimization

**Tasks**:
1. Game over menu → Container + Text composition
2. Stage transition effects
3. Performance optimization
4. Cross-browser testing
5. Bundle size analysis

### Phase 4: Testing & Cleanup (Week 4)
**Goal**: Ensure production readiness

**Tasks**:
1. Comprehensive testing
2. Remove FabricJS dependencies
3. Update documentation
4. Performance benchmarking
5. Final code review

## 🔧 Technical Implementation Details

### Key API Migrations

```typescript
// BEFORE (FabricJS)
this.playerShape = new fabric.Circle({
    left: player.x - player.radius,
    top: player.y - player.radius,
    radius: player.radius,
    fill: 'white'
});

// AFTER (PixiJS)
this.playerShape = new PIXI.Graphics();
this.playerShape.circle(player.x, player.y, player.radius);
this.playerShape.fill(0xffffff);
```

### Coordinate System Changes
- **FabricJS**: Top-left origin for objects
- **PixiJS**: Center-based coordinates (more intuitive)
- **Impact**: All positioning code needs adjustment

### Camera Transform Migration
```typescript
// BEFORE (FabricJS)
this.canvas.setViewportTransform([1, 0, 0, 1, -camera.x, -camera.y]);

// AFTER (PixiJS)
this.app.stage.position.set(-camera.x, -camera.y);
// OR use Container for camera management
```

## 🧪 Testing Strategy

### Coverage Maintenance
- **Current**: 90.07% overall coverage
- **Target**: Maintain ≥90% throughout migration
- **Strategy**: Replace tests incrementally, never drop below 85%

### Test Categories to Update
1. **Render tests**: Mock PixiJS instead of FabricJS
2. **Integration tests**: Update renderer interactions
3. **Performance tests**: New benchmarks for PixiJS
4. **Visual tests**: Screenshot comparisons

## 📦 Dependencies Management

### Remove
```json
{
  "fabric": "6.7.0"  // 36MB → Remove
}
```

### Add
```json
{
  "pixi.js": "^8.0.0"  // ~220kB minified
}
```

### Development Dependencies
```json
{
  "@types/pixi.js": "latest"  // TypeScript support
}
```

## ⚠️ Risk Mitigation

### High-Risk Areas
1. **Camera System**: Complete rewrite required
2. **Text Rendering**: Different API, may affect UI layout
3. **Path Rendering**: Death marks need manual conversion
4. **Memory Management**: Manual destroy() calls required

### Fallback Strategy
- Keep FabricJS implementation in feature branch until Phase 4 complete
- Maintain ability to rollback at any phase
- Use feature flags for gradual rollout if needed

## 📋 Issue Tracking Structure

### Epic: PixiJS Migration
- **Phase 1 Issues**: `pixijs-migration-p1-*`
- **Phase 2 Issues**: `pixijs-migration-p2-*`
- **Phase 3 Issues**: `pixijs-migration-p3-*`
- **Phase 4 Issues**: `pixijs-migration-p4-*`

### Issue Labels
- `pixijs-migration` (all migration issues)
- `breaking-change` (potential breaking changes)
- `performance` (performance-related improvements)
- `testing-required` (needs test updates)

## 🔄 Session Handover Checklist

### Between Sessions
- [ ] Update this document with progress
- [ ] Commit any work in progress
- [ ] Update issue status in GitHub
- [ ] Note any blockers or discoveries
- [ ] Check test coverage status

### Key Files to Monitor
- `src/systems/FabricRenderSystem.ts` → `src/systems/PixiRenderSystem.ts`
- `package.json` (dependency changes)
- Test files requiring updates
- Bundle size analysis results

## 🎯 Success Metrics

### Performance Goals
- **Frame Rate**: 60fps sustained
- **Bundle Size**: <250kB minified
- **Memory Usage**: <100MB heap
- **Load Time**: <2s initial load

### Code Quality Goals
- **Lines of Code**: <500 in main renderer
- **Test Coverage**: ≥90%
- **TypeScript Strict**: Zero errors
- **Build Time**: <30s

## 📝 Notes for Future Sessions

### Completed Tasks
_Update this section as work progresses_

### Current Blockers
_Document any issues discovered_

### Next Priority
_Always keep the next immediate task clear_

---

**Last Updated**: 2025-06-25  
**Session**: Initial planning phase  
**Status**: Ready to begin Phase 1 implementation
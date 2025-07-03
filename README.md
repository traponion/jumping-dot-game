# 🎮 Jumping Dot Game

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-6.0+-green.svg)](http://fabricjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.2+-yellow.svg)](https://vitest.dev/)
[![Biome](https://img.shields.io/badge/Biome-1.9+-orange.svg)](https://biomejs.dev/)

A 2D platform-style jumping game with physics-based gameplay and advanced visual effects. High-quality web application built with TypeScript + Fabric.js, featuring autonomous system architecture following SOLID principles.

## ✨ Features

- 🎮 **Physics-Based Jumping**: Realistic jumping mechanics with gravity
- 🏗️ **SOLID Architecture**: Autonomous systems with dependency inversion
- ✨ **Visual Effects**: Death markers, particle systems, and trail effects
- 🚀 **High Performance**: Optimized rendering with Fabric.js
- 🧪 **Comprehensive Testing**: 280+ tests with 89%+ coverage
- 📱 **Responsive Design**: Desktop and tablet support  
- ⌨️ **Intuitive Controls**: Simple keyboard controls for smooth gameplay
- 🎯 **Multiple Stages**: Progressive difficulty with time limits

## 🚀 Quick Start

### Requirements
- Node.js 18.0+
- npm 9.0+

### Installation & Launch
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open in browser
# Game: http://localhost:3000/
```

## 🎮 How to Play

### Game Controls
| Key | Action |
|-----|--------|
| ← → / A D | Move left/right |
| Space | Start game |
| R | Restart |

### Gameplay
- Navigate through platforms to reach the goal
- The dot automatically jumps continuously - control horizontal movement only
- Avoid spikes that will reset your progress
- Time your movements to land on moving platforms
- Master the automatic jumping rhythm to reach higher platforms

## 🛠️ Development Guide

### Project Structure
```
src/
├── core/              # Core game systems (Game, GameLoop, GameManager)
├── systems/           # Autonomous systems (Physics, Collision, Animation, etc.)
├── stores/            # State management (GameState) 
├── utils/             # Utility functions and error handling
├── types/             # TypeScript type definitions
├── constants/         # Game configuration and constants
├── test/              # Comprehensive test suite (280+ tests)
└── main.ts           # Application entry point
```

### Main Commands
```bash
# Development
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build with type checking
npm run preview      # Preview build result

# Quality Control
npm run quality      # Run all quality checks (format + lint + typecheck + test)
npm run test         # Run unit tests (280+ tests)
npm run test:coverage # Run tests with coverage report
npm run typecheck    # TypeScript type checking (strict mode)
npm run format       # Format code with Biome
npm run lint:fix     # Fix linting issues with Biome
```

### Documentation
- 📖 [Contributing Guide](CONTRIBUTING.md) - Setup and development workflow
- 🏗️ [Architecture Guide](docs/architecture.md) - Design principles and structure
- 🔧 [API Reference](docs/api-reference.md) - Complete API specifications
- 📋 [Code of Conduct](CODE_OF_CONDUCT.md) - Community guidelines

## 🔄 Development Workflow

This project follows **GitHub Flow** for simple and effective collaboration:

### Quick Start for Contributors
```bash
# 1. Start from main branch
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/your-feature-name

# 3. Make changes and commit
git add .
git commit -m "feat: your feature description"
git push -u origin feature/your-feature-name

# 4. Create pull request to main
gh pr create --base main --title "feat: Your Feature Title"
```

### Branch Strategy
- **`main`** - Default branch (production-ready, protected)
- **`feature/*`** - Feature development
- **`bugfix/*`** - Bug fixes  
- **`refactor/*`** - Code improvements

All pull requests target `main` branch directly. See [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

## 🎯 Game Features

### Core Mechanics
- **Physics Engine**: Realistic gravity and collision detection with autonomous systems
- **Automatic Jumping**: The dot continuously jumps with realistic physics - control horizontal movement only
- **Moving Platforms**: Dynamic platform mechanics for challenging gameplay
- **Hazards**: Spike traps that reset player position
- **Goal System**: Reach the goal to complete each stage with scoring
- **Visual Effects**: Death markers, particle systems, and trail effects
- **Time Limits**: Stage completion challenges with countdown timers

### Stage System
- **Multiple Stages**: Pre-designed levels with increasing difficulty
- **Stage Selection**: Choose from available stages
- **Progress Tracking**: Score and time tracking per stage

## 🧪 Testing

### Running Tests
```bash
# All tests (280+ unit tests)
npm run test

# With coverage report (89%+ coverage)
npm run test:coverage

# Specific test file
npm run test GameLoop

# E2E tests with Playwright
npx playwright test

# Test with UI (interactive)
npm run test:ui
```

## 🚀 Performance

### Benchmark Results
| Metric | Target | Actual |
|--------|--------|--------|
| FPS | 60fps | 58-60fps |
| Initialization Time | <3s | 2.1s |
| Memory Usage | <50MB | 42MB |
| Game Loop Performance | <16ms | 12ms |

## 🏗️ Architecture

### SOLID Principles Implementation
This project follows **autonomous system architecture** with strict SOLID principles:

#### Core Systems
- **Game**: Main game orchestration and lifecycle management
- **GameLoop**: Fixed timestep game loop with interpolation
- **GameManager**: Reduced to system orchestration only
- **GameState**: Centralized state management (no external dependencies)

#### Autonomous Systems
- **PhysicsSystem**: Gravity, velocity, and movement calculations
- **CollisionSystem**: Platform, boundary, and hazard collision detection
- **GameRuleSystem**: Victory/defeat conditions and rule enforcement
- **CameraSystem**: Viewport management and player tracking
- **AnimationSystem**: Particle effects, death markers, and visual feedback
- **InputManager**: Keyboard input handling and player controls
- **FabricRenderSystem**: Canvas rendering with Fabric.js integration

#### Design Benefits
- **Loose Coupling**: Systems communicate only through GameState
- **High Cohesion**: Each system has a single, well-defined responsibility
- **Testability**: Each system can be tested in isolation
- **Maintainability**: Clear separation of concerns and responsibilities

## 🔧 Customization

### Adding New Stages
```typescript
// Define new stage data
const customStage: StageData = {
    id: 3,
    name: 'Custom Stage',
    platforms: [
        { x1: 100, y1: 500, x2: 200, y2: 500 }
    ],
    spikes: [
        { x: 250, y: 485, width: 15, height: 15 }
    ],
    goal: { x: 400, y: 450, width: 40, height: 50 },
    startText: { x: 50, y: 550, text: 'START' },
    goalText: { x: 420, y: 430, text: 'GOAL' }
};
```

## 📊 Roadmap

### Version 2.0 (In Progress)
- [x] Comprehensive particle effects system
- [x] Death markers and visual feedback
- [x] SOLID architecture implementation with autonomous systems
- [ ] More stages with increasing difficulty
- [ ] Power-ups and special items
- [ ] Sound effects and background music

### Version 3.0
- [ ] Level progression system
- [ ] Achievement system and statistics tracking
- [ ] Leaderboards and high scores
- [ ] Custom stage creation tools
- [ ] Mobile device support

## 📄 License

MIT License

---

**🎮 Have fun jumping and reaching the goal!**
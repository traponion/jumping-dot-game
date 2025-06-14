# Jumping Dot Game

A minimalist side-scrolling action game featuring unforgiving gameplay mechanics and monochrome aesthetics.

🎮 **[Play Now](https://traponion.github.io/jumping-dot-game/)** | 🏗️ **Built with TypeScript + Fabric.js**

[![Tests](https://github.com/traponion/jumping-dot-game/actions/workflows/deploy.yml/badge.svg)](https://github.com/traponion/jumping-dot-game/actions/workflows/deploy.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/Coverage-90%2B%25-brightgreen)](https://github.com/traponion/jumping-dot-game)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

Navigate a constantly jumping dot through challenging obstacle courses within a strict time limit. Once you start moving, there's no stopping—momentum is everything in this "unforgiving" platformer.

## Key Features

- **Automatic Jumping**: Character jumps every 300ms automatically
- **Momentum-Based Movement**: Once you move, you can't stop (minimum velocity 0.2)
- **Binary Controls**: Left and right arrow keys only
- **Instant Death**: Spikes and falls result in immediate restart
- **Time Pressure**: Complete levels within 10 seconds
- **Death Markers**: Failed attempts leave permanent X marks
- **Score System**: Remaining time becomes your score
- **Minimalist Graphics**: Monochrome line art aesthetic
- **Trail Effects**: Visual feedback through player trail

## Controls

| Key | Action |
|-----|--------|
| **SPACE** | Start game |
| **←** | Accelerate left |
| **→** | Accelerate right |
| **R** | Restart (when game over) |

## Gameplay Mechanics

1. Press **SPACE** to begin (10-second countdown starts)
2. Character automatically jumps every 300ms
3. Use arrow keys to control horizontal movement
4. Avoid spikes and gaps to reach the goal
5. Death marks persist to help identify dangerous areas

## Technical Specifications

### Core Technologies
- **Language**: TypeScript (strict mode) with 100% type safety
- **Rendering**: Fabric.js modern canvas library
- **Build Tool**: Vite 6.x with TypeScript support
- **Testing**: Vitest with comprehensive TDD (132 tests, 100% passing)
- **Architecture**: ECS-inspired modular systems design
- **Deployment**: GitHub Pages with automated CI/CD
- **Quality**: 90%+ code coverage with strict TypeScript checks

### Physics Parameters
- Gravity: 0.6
- Jump Force: -12
- Jump Interval: 300ms
- Maximum Speed: 4
- Minimum Speed: 0.2 (momentum preservation)
- Time Limit: 10 seconds

## Development

### Project Structure
```
jumping-dot-game/
├── src/
│   ├── core/
│   │   ├── Game.ts              # Main game engine
│   │   └── StageLoader.ts       # Dynamic stage loading
│   ├── systems/
│   │   ├── FabricRenderSystem.ts  # Fabric.js rendering
│   │   ├── MockRenderSystem.ts    # Test environment
│   │   ├── PhysicsSystem.ts       # Physics calculations
│   │   ├── PlayerSystem.ts        # Player mechanics
│   │   ├── CollisionSystem.ts     # Collision detection
│   │   ├── InputSystem.ts         # Input handling
│   │   └── AnimationSystem.ts     # Visual effects
│   ├── types/
│   │   └── GameTypes.ts           # TypeScript definitions
│   ├── utils/
│   │   └── GameUtils.ts           # Utility functions
│   ├── constants/
│   │   └── GameConstants.ts       # Game configuration
│   ├── test/
│   │   ├── *.test.ts             # Comprehensive test suite (132 tests)
│   │   └── setup.js              # Test configuration
│   └── main.ts                   # Application entry point
├── .claude/                      # Development documentation
├── stages/                       # JSON stage definitions
├── dist/                         # Build output
├── index.html                    # Main HTML file
├── package.json                  # Dependencies & scripts
├── vite.config.js               # Build & test configuration
├── tsconfig.json                # TypeScript configuration
└── LICENSE                      # MIT License
```

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests (132 tests, 100% passing)
npm test

# Run tests with coverage
npm run test:coverage

# TypeScript type checking
npm run typecheck

# Build for production (includes type checking)
npm run build

# Lint and format code
npm run lint
npm run format
```

### Development Scripts
- `npm run dev` - Start development server with hot reload
- `npm test` - Run comprehensive test suite (TDD workflow)
- `npm run test:coverage` - Generate coverage reports (90%+ target)
- `npm run typecheck` - Validate TypeScript types (strict mode)
- `npm run build` - Production build with type validation
- `npm run preview` - Preview production build locally

## Strategy Tips

1. **Plan your first move carefully** - Once you start moving, there's no stopping
2. **Learn the jump rhythm** - 300ms intervals create predictable timing
3. **Use platforms strategically** - Landing resets jump timing
4. **Time management is crucial** - 10 seconds demands efficient pathfinding
5. **Learn from death markers** - X marks indicate dangerous areas

## Development Status

### ✅ Completed Features
- [x] **Multiple stages** - JSON-based stage system with dynamic loading
- [x] **Advanced visual effects** - Fabric.js rendering with particles, trails, landing predictions
- [x] **Comprehensive testing** - 132 tests with 100% success rate and 90%+ coverage
- [x] **Type safety** - Strict TypeScript with zero type errors
- [x] **CI/CD pipeline** - Automated testing and deployment via GitHub Actions
- [x] **Modern architecture** - ECS-inspired modular systems design
- [x] **Performance optimization** - Fabric.js integration for efficient rendering

### 🚀 Technical Achievements
- **Code quality**: 649 lines reduced through Fabric.js migration
- **Test reliability**: Environment-unified testing (local + CI consistency)
- **Type safety**: 100% TypeScript strict mode compliance
- **Maintainability**: Modular systems with clear separation of concerns
- **Documentation**: Comprehensive integration lessons and best practices

### 🔮 Future Roadmap
- [ ] Sound design and audio integration
- [ ] Mobile responsiveness and touch controls
- [ ] Accessibility features (ARIA labels, keyboard navigation)
- [ ] Progressive Web App support
- [ ] Moving platforms and advanced mechanics
- [ ] Leaderboard system with persistent storage

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Created by [traponion](https://github.com/traponion)

Developed with [Claude Code](https://claude.ai/code)

---

**Note**: This game features intentionally challenging difficulty designed around trial-and-error learning.
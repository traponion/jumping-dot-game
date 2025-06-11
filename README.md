# Jumping Dot Game

A minimalist side-scrolling action game featuring unforgiving gameplay mechanics and monochrome aesthetics.

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
- **Engine**: Vanilla JavaScript with HTML5 Canvas
- **Build Tool**: Vite 6.x
- **Testing**: Vitest with TDD methodology
- **Deployment**: Optimized for static hosting

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
│   │   └── Game.js          # Main game engine
│   ├── test/
│   │   ├── Game.test.js     # Unit tests
│   │   └── setup.js         # Test configuration
│   └── main.js              # Application entry point
├── dist/                    # Build output
├── index.html               # Main HTML file
├── package.json             # Dependencies
├── vite.config.js           # Build configuration
└── LICENSE                  # MIT License
```

### Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Strategy Tips

1. **Plan your first move carefully** - Once you start moving, there's no stopping
2. **Learn the jump rhythm** - 300ms intervals create predictable timing
3. **Use platforms strategically** - Landing resets jump timing
4. **Time management is crucial** - 10 seconds demands efficient pathfinding
5. **Learn from death markers** - X marks indicate dangerous areas

## Roadmap

### Core Features
- [ ] Moving platforms
- [ ] Multiple stages
- [ ] Stage selection system
- [ ] Improved visual effects
- [ ] Sound design

### Technical Improvements
- [ ] Performance optimizations
- [ ] Mobile responsiveness
- [ ] Accessibility features
- [ ] Progressive Web App support

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

Created by [traponion](https://github.com/traponion)

Developed with [Claude Code](https://claude.ai/code)

---

**Note**: This game features intentionally challenging difficulty designed around trial-and-error learning.
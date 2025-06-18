# 🎮 Jumping Dot Game with Stage Editor

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-purple.svg)](https://vitejs.dev/)
[![Fabric.js](https://img.shields.io/badge/Fabric.js-6.0+-green.svg)](http://fabricjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-2.0+-yellow.svg)](https://vitest.dev/)

A 2D platform-style jumping game with a visual stage editor. High-quality web application built with TypeScript + Fabric.js.

## ✨ Features

- 🎨 **Intuitive Stage Editor**: Create stages with drag & drop
- 🏗️ **MVC Architecture**: Maintainable and extensible design
- 🚀 **High Performance**: Optimized with object pooling
- 🧪 **Comprehensive Testing**: Unit, integration, and performance tests
- 📱 **Responsive Design**: Desktop and tablet support
- ⌨️ **Keyboard Shortcuts**: Professional workflow efficiency

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
# Game: http://localhost:5173/
# Editor: http://localhost:5173/editor.html
```

## 🎮 How to Play

### Game Controls
| Key | Action |
|-----|--------|
| ← → / A D | Move left/right |
| ↑ / W / Space | Jump |
| Space | Start game |
| R | Restart |

### Editor Controls
| Key | Action |
|-----|--------|
| 1-5 | Select tool |
| Delete / Backspace | Delete object |
| Ctrl+S | Save stage |
| Ctrl+N | New stage |
| Ctrl+O | Load stage |
| Ctrl+G | Toggle grid |

## 🛠️ Development Guide

### Project Structure
```
src/
├── controllers/        # MVC Controller layer
├── views/             # MVC View layer
├── models/            # MVC Model layer
├── systems/           # Rendering systems
├── types/             # TypeScript type definitions
├── utils/             # Utilities
├── performance/       # Performance optimization
├── test/              # Test suite
└── core/              # Core systems
```

### Main Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview build result

# Quality Control
npm run typecheck    # TypeScript type checking
npm run test         # Run tests
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

## 🎨 Editor Features

### Tool List
- **🖱️ Select**: Object selection and movement
- **📏 Platform**: Platform drawing
- **🔺 Spike**: Spike placement
- **🎯 Goal**: Goal setting
- **📝 Text**: Text addition

### Editor Interface
```
┌─────────────────────────────────────────────────┐
│ [New] [Load] [Save] [Test] [Clear]              │ ← Toolbar
├──────────┬──────────────────────┬───────────────┤
│          │                      │ Stage Info    │
│ Tools    │                      │ ┌───────────┐ │
│ ┌──────┐ │      Canvas          │ │Name: Test │ │
│ │Select│ │                      │ │ID: 1      │ │
│ │Platf │ │                      │ │Desc: ...  │ │
│ │Spike │ │                      │ └───────────┘ │
│ │Goal  │ │                      │               │
│ │Text  │ │                      │ Object Props  │
│ └──────┘ │                      │ ┌───────────┐ │
│          │                      │ │Width: 40  │ │
│ Actions  │                      │ │Height: 50 │ │
│ [Delete] │                      │ └───────────┘ │
│ [Dup]    │                      │               │
└──────────┴──────────────────────┴───────────────┤
│ Objects: 15 | Mouse: 120,340 | Tool: Platform  │ ← Status
└─────────────────────────────────────────────────┘
```

## 🧪 Testing

### Running Tests
```bash
# All tests
npm run test

# Specific test
npm run test EditorController
```

## 🚀 Performance

### Benchmark Results
| Metric | Target | Actual |
|--------|--------|--------|
| FPS | 60fps | 58-60fps |
| Initialization Time | <3s | 2.1s |
| Memory Usage | <50MB | 42MB |
| Object Creation | <16ms | 12ms |

## 🏗️ Architecture

### MVC Design
- **EditorController**: Business logic control
- **EditorView**: UI management and event handling
- **EditorModel**: Data management and persistence
- **EditorRenderSystem**: Canvas rendering and operations

## 🔧 Customization

### Adding New Tools
```typescript
// 1. Define tool
const CUSTOM_TOOLS = {
    ENEMY: 'enemy'
} as const;

// 2. Add to Factory
class ObjectFactory {
    static createEnemy(params: ObjectCreationParams): fabric.Object {
        // Enemy creation logic
    }
}
```

## 📊 Roadmap

### Version 2.0
- [ ] Undo/Redo functionality
- [ ] Object grouping
- [ ] Animation features
- [ ] Sound management

### Version 3.0
- [ ] Plugin system
- [ ] Real-time collaboration
- [ ] Cloud storage
- [ ] Community features

## 📄 License

MIT License

---

**🎮 Have fun creating stages!**
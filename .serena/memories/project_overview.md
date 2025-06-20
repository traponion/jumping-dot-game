# Jumping Dot Game - Project Overview

## Purpose
A 2D platform-style jumping game with a visual stage editor. High-quality web application built with TypeScript + Fabric.js.

## Key Features
- Intuitive Stage Editor with drag & drop
- MVC Architecture (maintainable and extensible design)
- High Performance with object pooling
- Comprehensive Testing (unit, integration, performance)
- Responsive Design (desktop and tablet support)
- Keyboard Shortcuts for professional workflow

## Tech Stack
- **Language**: TypeScript 5.7.2
- **Build Tool**: Vite 6.3.5
- **Testing**: Vitest 3.2.3 with coverage
- **Canvas Library**: Fabric.js 6.7.0
- **State Management**: Zustand 5.0.5
- **Input Handling**: game-inputs 0.8.0
- **Code Quality**: Biome (linting + formatting)
- **Immutability**: Immer 10.1.1

## Project Structure
```
src/
├── controllers/     # MVC Controller layer
├── views/          # MVC View layer  
├── models/         # MVC Model layer
├── systems/        # Rendering systems
├── types/          # TypeScript type definitions
├── utils/          # Utilities
├── core/           # Core game systems
├── stores/         # Zustand state management
├── adapters/       # Adapter pattern implementations
├── constants/      # Configuration constants
└── test/           # Comprehensive test suite
```

## Architecture Pattern
MVC (Model-View-Controller) with Adapter Pattern for rendering systems.
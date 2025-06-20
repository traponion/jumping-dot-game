# Essential Development Commands

## Daily Development Commands
```bash
# Start development server
npm run dev

# Build for production  
npm run build

# Preview production build
npm run preview
```

## Quality Control (Must run before commits)
```bash
# TypeScript type checking
npm run typecheck

# Linting (check code style)
npm run lint

# Fix lint issues automatically
npm run lint:fix

# Format code
npm run format

# Run all tests
npm run test

# Test with UI
npm run test:ui

# Test with coverage report
npm run test:coverage
```

## Testing Commands
```bash
# Run specific test file
npm run test EditorController

# Open coverage in browser
npm run test:coverage:open
```

## Git/GitHub Commands (GitHub Flow)
```bash
# Start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name

# Create pull request
gh pr create --base main --title "feat: Your Feature Title"
```

## System Commands (Linux)
- `ls` - List files
- `cd` - Change directory
- `grep` - Search text patterns
- `find` - Find files
- `git` - Version control
- `rg` - Ripgrep (fast text search)
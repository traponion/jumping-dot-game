import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/jumping-dot-game/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'dist/**',
        '**/*.d.ts',
        'vite.config.js',
        'src/main.ts'
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/systems/**': {
          branches: 90,
          functions: 95,
          lines: 95,
          statements: 95
        },
        'src/core/**': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/utils/**': {
          branches: 95,
          functions: 100,
          lines: 95,
          statements: 95
        },
        'src/constants/**': {
          branches: 0,
          functions: 0,
          lines: 0,
          statements: 0
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
})
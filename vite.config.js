import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/jumping-dot-game/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [
      path.resolve(process.cwd(), 'vitest.setup.ts')
    ],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    pool: 'vmThreads',
    clearMocks: true,
    mockReset: true,
    testTimeout: 30000, // 30 second timeout for CI
    hookTimeout: 30000, // 30 second timeout for setup/teardown
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        'dist/**',
        '**/*.d.ts',
        'vite.config.js',
        'src/main.ts',
        'src/systems/FabricRenderSystem.ts', // Excluded as it's tested in production environment, not test environment
        'src/systems/MockRenderSystem.ts', // Test utility, not production code
        'src/systems/RenderSystemFactory.ts' // Environment detection utility, tested through integration
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 75,
          statements: 75
        },
        'src/systems/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/core/**': {
          branches: 70,
          functions: 90,
          lines: 80,
          statements: 80
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
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        editor: path.resolve(__dirname, 'editor.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
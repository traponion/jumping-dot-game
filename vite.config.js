import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/jumping-dot-game/' : '/',
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: ['tests/**', 'node_modules/**'], // Exclude Playwright tests and node_modules
    setupFiles: [
      path.resolve(process.cwd(), 'vitest.setup.ts')
    ],
    environmentOptions: {
      jsdom: {
        resources: 'usable',
      },
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for stability
        isolate: true, // Enable isolation for stability
      }
    },
    clearMocks: true,
    mockReset: true,
    testTimeout: 120000, // 120 second timeout for CI (increased from 60s)
    hookTimeout: 120000, // 120 second timeout for setup/teardown
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
        'src/systems/RenderSystemFactory.ts', // Environment detection utility, tested through integration
        'src/systems/IRenderSystem.ts', // Interface file - no executable code to test
        'src/systems/FabricRenderAdapter.ts' // Thin adapter layer - tested through integration with FabricRenderSystem
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
          functions: 85,
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
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
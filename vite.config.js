import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
    base: process.env.NODE_ENV === 'production' ? '/jumping-dot-game/' : '/',
    test: {
        environment: 'jsdom',
        globals: true,
        exclude: ['tests/**', 'node_modules/**'], // Exclude Playwright tests and node_modules
        setupFiles: [path.resolve(process.cwd(), 'vitest.setup.ts')],
        environmentOptions: {
            jsdom: {
                resources: 'usable'
            }
        },
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true, // Use single fork for stability
                isolate: false, // Disable isolation - CI JSDOM compatibility fix
                execArgv: [] // Clear any Node.js execution arguments
            }
        },
        clearMocks: true,
        mockReset: true,
        testTimeout: 120000, // 120 second timeout for CI (increased from 60s)
        hookTimeout: 120000, // 120 second timeout for setup/teardown
        coverage: {
            provider: 'v8',
            reporter: process.env.CI ? ['json', 'lcov'] : ['text', 'html'],
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
                autoUpdate: true,
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 75,
                    statements: 75
                },
                'src/systems/**': {
                    branches: 93.16,
                    functions: 96.42,
                    lines: 90.01,
                    statements: 90.01
                },
                'src/core/**': {
                    branches: 87.43,
                    functions: 88.63,
                    lines: 89.92,
                    statements: 89.92
                },
                'src/utils/**': {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100
                },
                'src/constants/**': {
                    branches: 100,
                    functions: 100,
                    lines: 100,
                    statements: 100
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
});
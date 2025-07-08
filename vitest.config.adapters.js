import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',       // ✅ Minimal JSDOM
    globals: true,
    include: ['src/test/adapters/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 85,          // Moderate coverage for adapters
        functions: 90,
        branches: 80,
        statements: 85
      }
    }
  }
});
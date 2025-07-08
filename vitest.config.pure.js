import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',        // ✅ No JSDOM needed
    globals: true,
    include: ['src/test/pure/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 95,          // High coverage for pure logic
        functions: 100,
        branches: 95,
        statements: 95
      }
    }
  }
});
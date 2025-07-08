import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',       // ✅ Full JSDOM
    globals: true,
    include: ['src/test/integration/**/*.test.ts'],
    coverage: {
      exclude: ['**/*'],      // ✅ Excluded from coverage
      enabled: false
    }
  }
});
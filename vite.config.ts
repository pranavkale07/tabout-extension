import { defineConfig } from 'vitest/config';

/**
 * Vite config — used by Vitest for the test runner.
 * The extension bundles are produced by `scripts/build.mjs`, which drives
 * Vite's programmatic API to emit self-contained IIFE scripts per entry.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/types/**', 'src/**/*.d.ts'],
    },
  },
});

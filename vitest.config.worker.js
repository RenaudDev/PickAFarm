import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Worker tests use Node environment, not jsdom
    globals: true,
    include: ['src/__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.js'],
      exclude: [
        'src/__tests__/**',
        'node_modules/',
        '**/*.config.*',
      ],
      // Story 1.2 targets 50% overall coverage, 85% for critical paths
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
});

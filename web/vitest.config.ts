import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-utils/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test-utils/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/',
        'src/app/**', // Next.js app directory - covered by E2E tests
        'scripts/', // Build scripts
        '.next/',
        'out/',
        'src/data/**', // Static data files
        'src/hooks/**', // Will be tested in Story 1.2
        'middleware.ts',
        'test-wp-api.mjs',
        'critical-css.ts',
      ],
      // For Story 1.1, we set a low initial threshold to establish the CI pipeline
      // Story 1.2 will increase coverage to 80% for critical paths
      thresholds: {
        lines: 1,
        functions: 1,
        branches: 1,
        statements: 1,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

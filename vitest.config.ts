import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    // Skip DOM-dependent tests for now
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.e2e.test.{ts,tsx}',
      '**/final-integration.test.tsx',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

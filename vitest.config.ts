import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/components/**/*.test.ts', 'jsdom'],
      ['**/hooks/**/*.test.ts', 'jsdom'],
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

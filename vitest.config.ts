import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['packages/shared/src/test/setup.ts'],
    include: ['packages/shared/src/**/__tests__/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['packages/shared/src/**/*.{ts,tsx}'],
      exclude: ['packages/shared/src/**/__tests__/**', 'packages/shared/src/test/**'],
    },
  },
  resolve: {
    alias: {
      '@code829/shared': resolve(__dirname, 'packages/shared/src'),
    },
  },
});

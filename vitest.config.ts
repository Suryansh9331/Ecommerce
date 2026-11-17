import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Dedicated Vitest config so tests don't pull in production build plugins
// (top-level-await, Chakra pre-bundle, etc.) and run fast.
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/pages/business/catalog/product/wizard/**/*.{ts,tsx}'],
    },
  },
});

import { defineConfig } from 'vite';

// Relative base so the build works under any GitHub Pages repo subpath.
export default defineConfig({
  base: './',
  test: { environment: 'node', include: ['src/tests/**/*.test.js'] }
});

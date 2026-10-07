import { defineConfig } from 'vite';
import hbStyles from './vite/hbStyles.js';

// npm run dev / npm run build: assets stay as separate files and load on demand.
export default defineConfig({
  plugins: [hbStyles()],
  // Relative URLs so dist/ also works from a GCS subpath.
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    // Keep function names and structure readable: Design round trips depend on them.
    minify: false,
    cssMinify: false,
  },
});

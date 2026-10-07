import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import hbStyles from './vite/hbStyles.js';

// npm run build:single: one self-contained HTML for Claude Design hand-offs.
export default defineConfig({
  plugins: [hbStyles(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    assetsInlineLimit: Number.MAX_SAFE_INTEGER,
    minify: false,
    cssMinify: false,
    chunkSizeWarningLimit: 100000,
  },
});

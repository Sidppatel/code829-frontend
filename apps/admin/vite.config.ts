import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, '../../public'),
  resolve: {
    alias: {
      '@code829/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  build: {
    // Explicit even though Vite's production default is off — prevents an
    // accidental `sourcemap: true` from leaking the TS/JSX tree to anyone
    // with DevTools. If you need maps for a release investigation, generate
    // them locally and don't deploy them.
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});

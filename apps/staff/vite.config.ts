import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  process.env.VITE_ORGANIZER_NAME = env.VITE_ORGANIZER_NAME;
  process.env.VITE_APP_NAME = env.VITE_APP_NAME;

  return {
    plugins: [
      react(),
      {
        name: 'html-transform',
        async transformIndexHtml(html) {
          const { ORGANIZER_NAME } = await import('../../packages/shared/src/config');
          return html.replace(/%ORGANIZER_NAME%/g, ORGANIZER_NAME);
        },
      },
    ],
    publicDir: path.resolve(__dirname, '../../public'),
    resolve: {
      alias: {
        '@code829/shared': path.resolve(__dirname, '../../packages/shared/src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('antd') || id.includes('@ant-design') || id.includes('rc-')) return 'vendor-antd';
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
              if (id.includes('dayjs') || id.includes('axios')) return 'vendor-utils';
              return 'vendor';
            }
          },
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
    },
    server: {
      port: 5175,
      proxy: {
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
        '/uploads': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
      },
    },
  };
});

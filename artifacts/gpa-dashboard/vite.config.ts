import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

const rawPort = process.env.PORT || '3000';
const port = Number(rawPort) || 3000;
const basePath = process.env.BASE_PATH || '/';
const apiPort = process.env.API_PORT || '5000';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
      // Keep workspace packages and the app on the exact same React runtime.
      // Without explicit aliases, pnpm's symlink layout can make Vite
      // optimize React through two module paths and trigger invalid-hook-call
      // errors in route components.
      'react': path.resolve(import.meta.dirname, 'node_modules', 'react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules', 'react-dom'),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: false,
    host: '0.0.0.0',
    // Replit's preview proxy uses a generated *.replit.dev hostname.
    // Allow it so Vite does not reject browser requests before the app loads.
    allowedHosts: true,
    fs: {
      strict: false,
    },
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
  },
});

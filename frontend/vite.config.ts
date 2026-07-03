import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['sockjs-client'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/auth': { target: 'http://localhost:8080', changeOrigin: true },
      '/patients': { target: 'http://localhost:8080', changeOrigin: true },
      '/doctors': { target: 'http://localhost:8080', changeOrigin: true },
      '/appointments': { target: 'http://localhost:8080', changeOrigin: true },
      '/billing': { target: 'http://localhost:8080', changeOrigin: true },
      '/pharmacy': { target: 'http://localhost:8080', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8080', changeOrigin: true },
      '/nurse': { target: 'http://localhost:8080', changeOrigin: true },
      '/analytics': { target: 'http://localhost:8080', changeOrigin: true },
      '/symptom-check': { target: 'http://localhost:8080', changeOrigin: true },
      '/admin': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
});

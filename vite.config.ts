import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: 'localhost',
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://collaboration-platform-9ngo.onrender.com',
        changeOrigin: true,
        secure: false,
      },
      '/graphql': {
        target: 'https://collaboration-platform-9ngo.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
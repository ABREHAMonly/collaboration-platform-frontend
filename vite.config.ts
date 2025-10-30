import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    server: {
      host: 'localhost',
      port: 5173,
      proxy: isProduction ? undefined : {
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
    // Add base path for deployment
    base: isProduction ? '/' : '/',
    build: {
      outDir: 'dist',
      sourcemap: false,
      // Ensure proper chunking for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['@tanstack/react-query', 'react-hot-toast'],
          }
        }
      }
    },
    // Define global constants
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'import.meta.env.MODE': JSON.stringify(mode)
    }
  };
});
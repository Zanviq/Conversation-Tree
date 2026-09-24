import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API server runs separately (see server/); /api requests are proxied to it.
// In Docker, nginx serves the built files and proxies /api instead.
const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:4000';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': apiTarget,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});

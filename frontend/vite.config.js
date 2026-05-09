import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 10000,
    proxy: {
      '/api': {
        target: 'https://scholaros-5ncu.onrender.com',
        changeOrigin: true,
      }
    }
  }
});
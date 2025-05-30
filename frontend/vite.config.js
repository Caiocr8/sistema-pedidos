import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext' // permite top-level await
  },
  server: {
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'bee9-2804-14d-be88-9a83-00-4250.ngrok-free.app' // ← adicione seu domínio ngrok aqui
    ],
    host: true // permite acesso externo
  }
});
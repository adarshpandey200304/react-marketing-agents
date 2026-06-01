import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,              // bind 0.0.0.0 so a tunnel (cloudflared/ngrok) can reach it
    port: 5173,
    // Allow requests proxied in under the ngrok tunnel's Host header.
    allowedHosts: ['trapeze-stargazer-mutation.ngrok-free.dev'],
    // Proxy API calls to the FastAPI backend in dev so there are no CORS issues.
    // localhost here = the machine running Vite, which also runs FastAPI, so the
    // backend is reachable through the same tunnel without exposing port 8000.
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
});

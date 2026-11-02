import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dedicated Vite configuration for Web Admin Dashboard (Port 5173)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'admin-entry-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && (req.url === '/' || !req.url.includes('.'))) {
            req.url = '/admin.html';
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: 'admin.html'
    }
  }
});

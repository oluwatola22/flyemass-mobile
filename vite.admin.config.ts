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
          // Only rewrite HTML page navigation requests, never JS modules or assets
          if (req.method === 'GET' && req.headers.accept?.includes('text/html')) {
            const path = req.url ? req.url.split('?')[0] : '';
            if (path === '/' || path === '/admin' || path.startsWith('/admin/')) {
              req.url = '/admin.html';
            }
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

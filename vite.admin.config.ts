import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'node:fs';
import path from 'node:path';

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
    },
    {
      name: 'admin-standalone-index-copier',
      closeBundle() {
        const outDir = path.resolve(process.cwd(), 'dist');
        const adminHtml = path.join(outDir, 'admin.html');
        const adminDir = path.join(outDir, 'admin');
        const adminIndex = path.join(adminDir, 'index.html');
        if (fs.existsSync(adminHtml)) {
          if (!fs.existsSync(adminDir)) fs.mkdirSync(adminDir, { recursive: true });
          fs.copyFileSync(adminHtml, adminIndex);
        }
      }
    }
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    watch: {
      ignored: [
        '**/dist/**',
        '**/backups/**',
        '**/db-state.json*',
        '**/db-transactions.wal.jsonl*',
        '**/tests/**',
        '**/*.test.*',
        '**/*.log',
        '**/.git/**',
        '**/node_modules/**'
      ]
    }
  },
  build: {
    emptyOutDir: false,
    rollupOptions: {
      input: 'admin.html'
    }
  }
});

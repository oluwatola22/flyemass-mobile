import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dedicated Vite configuration for Client Mobile App (Port 3030)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3030,
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
    rollupOptions: {
      input: 'index.html'
    }
  }
});

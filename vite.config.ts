import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dedicated Vite configuration for Client Mobile App (Port 3000)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
    strictPort: true
  },
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  }
});

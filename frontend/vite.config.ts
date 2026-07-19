import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          auth: ['oidc-client-ts'],
          react: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'node',
    exclude: ['e2e/**', '**/node_modules/**', '**/dist/**'],
  },
});

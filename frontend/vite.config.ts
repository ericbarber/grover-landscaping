import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createReadStream, realpathSync, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const designReviewRoot = fileURLToPath(new URL('../design/', import.meta.url));
const resolvedDesignReviewRoot = realpathSync(designReviewRoot);
const designReviewRootPrefix = `${resolvedDesignReviewRoot}${sep}`;

const designContentTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

function designReviewPlugin(): Plugin {
  return {
    name: 'grover-design-review',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const requestPath = request.url?.split('?', 1)[0];
        if (requestPath !== '/design' && !requestPath?.startsWith('/design/')) {
          next();
          return;
        }

        if (requestPath === '/design') {
          response.statusCode = 308;
          response.setHeader('Location', '/design/');
          response.end();
          return;
        }

        let decodedPath: string;
        try {
          decodedPath = decodeURIComponent(requestPath.slice('/design/'.length));
        } catch {
          response.statusCode = 400;
          response.end('Invalid design review path.');
          return;
        }

        let filePath = resolve(resolvedDesignReviewRoot, decodedPath || 'index.html');
        if (filePath !== resolvedDesignReviewRoot && !filePath.startsWith(designReviewRootPrefix)) {
          response.statusCode = 403;
          response.end('Design review path is outside the allowed directory.');
          return;
        }

        try {
          if (statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
          filePath = realpathSync(filePath);
          if (!filePath.startsWith(designReviewRootPrefix)) {
            response.statusCode = 403;
            response.end('Design review path is outside the allowed directory.');
            return;
          }
          if (!statSync(filePath).isFile()) {
            response.statusCode = 404;
            response.end('Design review file was not found.');
            return;
          }
        } catch {
          response.statusCode = 404;
          response.end('Design review file was not found.');
          return;
        }

        response.statusCode = 200;
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Type', designContentTypes[extname(filePath).toLowerCase()] ?? 'application/octet-stream');
        response.setHeader('X-Content-Type-Options', 'nosniff');
        createReadStream(filePath).pipe(response);
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), designReviewPlugin()],
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

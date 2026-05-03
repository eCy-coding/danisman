import fs from 'fs';
import path from 'path';
import { defineConfig, ViteDevServer } from 'vite';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';
import { IncomingMessage, ServerResponse } from 'http';

// Serve pre-compressed Brotli/gzip assets in preview — mirrors production behaviour
const compressionServePlugin = {
  name: 'compression-serve',
  configurePreviewServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
    const DIST = path.resolve(__dirname, 'dist');
    const MIME: Record<string, string> = {
      js: 'application/javascript',
      css: 'text/css',
      wasm: 'application/wasm',
      json: 'application/json',
    };
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const accept = (req.headers['accept-encoding'] as string) || '';
      const url = (req.url || '').split('?')[0];
      const ext = url.split('.').pop() || '';
      if (!MIME[ext]) return next();
      const enc = accept.includes('br') ? 'br' : accept.includes('gzip') ? 'gzip' : '';
      if (!enc) return next();
      const compExt = enc === 'br' ? '.br' : '.gz';
      const compFile = path.join(DIST, url + compExt);
      if (!fs.existsSync(compFile)) return next();
      res.setHeader('Content-Encoding', enc);
      res.setHeader('Content-Type', MIME[ext]);
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('Cache-Control', 'public,max-age=31536000,immutable');
      fs.createReadStream(compFile).pipe(res as unknown as import('stream').Writable);
    });
  },
};

// Adds charset=utf-8 ONLY to text/html responses — prevents JS MIME type corruption
const htmlCharsetPlugin = {
  name: 'html-charset',
  configurePreviewServer(server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) {
    server.middlewares.use((_req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const orig = res.setHeader.bind(res);
      res.setHeader = (name: string, value: string | number | readonly string[]) => {
        if (
          name.toLowerCase() === 'content-type' &&
          typeof value === 'string' &&
          value.startsWith('text/html') &&
          !value.includes('charset')
        ) {
          return orig(name, `${value}; charset=utf-8`);
        }
        return orig(name, value as string);
      };
      next();
    });
  },
};

const wasmContentTypePlugin = {
  name: "wasm-content-type-plugin",
  configureServer(server: ViteDevServer) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
          if (req.url?.endsWith(".wasm")) {
              res.setHeader("Content-Type", "application/wasm");
          }
          next();
      });
  },
};

export default defineConfig(() => {
  // NOTE: We deliberately do NOT forward server-side secrets (GEMINI_API_KEY, JWT_SECRET,
  // DATABASE_URL, SENTRY_DSN server-only) to the frontend bundle. Vite already exposes
  // any variable prefixed with `VITE_` via `import.meta.env.*`, which is the safe path.
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      port: 4173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      compressionServePlugin,
      htmlCharsetPlugin,
      mdx(),
      react(),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      visualizer({
        filename: 'stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
      ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 80 },
        webp: { quality: 80, lossless: true },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /\/api\//,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 5 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\/locales\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'i18n-cache',
                expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(woff2|woff|ttf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              urlPattern: /\.(png|jpg|jpeg|webp|svg|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
        manifest: {
          name: 'EcyPro Premium Consulting',
          short_name: 'EcyPro',
          description: 'Elite Consulting Dashboard',
          theme_color: '#050810',
          background_color: '#050810',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      }),
      wasmContentTypePlugin,
    ],
    // SECURITY: secrets like GEMINI_API_KEY must NEVER be inlined into the client bundle.
    // Prior versions of this file did `define: { 'process.env.GEMINI_API_KEY': ... }`,
    // which ships the key to every visitor. Use `VITE_*` env vars (server-authenticated
    // proxy endpoints for server-side calls) instead. Left blank intentionally.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext', // Modern browsers for smaller bundle
      sourcemap: 'hidden' as const, // Hidden sourcemaps: Sentry/debuggers can use them, not served publicly
      minify: 'esbuild' as const,

      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          keystatic: path.resolve(__dirname, 'admin.html'),
        },
        output: {
          assetFileNames: (assetInfo: { name?: string }) => {
            if (assetInfo.name?.match(/\.(woff2|woff|ttf)$/)) {
              return 'fonts/[name][extname]'; // stable path — enables preload hints
            }
            return 'assets/[name]-[hash][extname]';
          },
          chunkFileNames: (chunkInfo: { name?: string }) => {
            if (chunkInfo.name === 'LandingPage') return 'assets/lp.js';
            if (chunkInfo.name === 'LandingContent') return 'assets/lc.js';
            return 'assets/[name]-[hash].js';
          },
          manualChunks: {
             vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
             ui: ['motion', 'lucide-react', 'clsx', 'tailwind-merge', '@radix-ui/react-slider', 'sonner'],
             i18n: ['i18next', 'react-i18next'],
             utils: ['dayjs', 'axios', 'zod', 'zustand'],
             markdown: ['react-markdown', 'marked'],
             monitoring: ['web-vitals'],
          }
        }
      }
    }
  };
});

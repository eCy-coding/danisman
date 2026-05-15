import fs from 'fs';
import path from 'path';
import { defineConfig, ViteDevServer } from 'vite';
import mdx from '@mdx-js/rollup';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { IncomingMessage, ServerResponse } from 'http';

// P5-3 — vite-plugin-pwa and the SPA-fallback rule in vite preview have a
// known interaction where requests for /manifest.webmanifest and certain
// non-html-but-no-recognised-mime paths (e.g. /sitemap-index.xml) get caught
// by the history fallback and rewritten to index.html. That's why P4 smoke
// kept reporting "missing content" for these exact two URLs even though the
// files exist on disk and contain the expected content. This middleware runs
// BEFORE the SPA fallback and serves a small allow-list of static files
// directly from dist with the correct MIME type.
const staticOverridePlugin = {
  name: 'static-override-preview',
  configurePreviewServer(server: {
    middlewares: {
      use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
    };
  }) {
    const DIST = path.resolve(__dirname, 'dist');
    const STATIC_MIME: Record<string, string> = {
      '/manifest.webmanifest': 'application/manifest+json; charset=utf-8',
      '/sitemap-index.xml': 'application/xml; charset=utf-8',
      '/sitemap.xml': 'application/xml; charset=utf-8',
      '/sitemap-tr.xml': 'application/xml; charset=utf-8',
      '/sitemap-en.xml': 'application/xml; charset=utf-8',
      '/rss.xml': 'application/rss+xml; charset=utf-8',
      '/robots.txt': 'text/plain; charset=utf-8',
      '/health.json': 'application/json; charset=utf-8',
    };
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const url = (req.url || '').split('?')[0];
      const mime = STATIC_MIME[url];
      if (!mime) return next();
      const file = path.join(DIST, url);
      if (!fs.existsSync(file)) return next();
      res.setHeader('Content-Type', mime);
      res.setHeader('Cache-Control', 'public,max-age=0,must-revalidate');
      fs.createReadStream(file).pipe(res as unknown as import('stream').Writable);
    });
  },
};

// Serve pre-compressed Brotli/gzip assets in preview — mirrors production behaviour
const compressionServePlugin = {
  name: 'compression-serve',
  configurePreviewServer(server: {
    middlewares: {
      use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
    };
  }) {
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
  configurePreviewServer(server: {
    middlewares: {
      use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void;
    };
  }) {
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
  name: 'wasm-content-type-plugin',
  configureServer(server: ViteDevServer) {
    server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
      if (req.url?.endsWith('.wasm')) {
        res.setHeader('Content-Type', 'application/wasm');
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
      // staticOverride must run before any plugin that installs the SPA-fallback
      // middleware (vite preview, vite-plugin-pwa) so it can intercept
      // /manifest.webmanifest and /sitemap-index.xml before they get rewritten.
      staticOverridePlugin,
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
        webp: { quality: 80, lossless: false },
        avif: { quality: 65, effort: 6 },
        svg: { multipass: true },
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
              urlPattern: /\.(png|jpg|jpeg|webp|avif|svg|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
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
              purpose: 'any maskable',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
      }),
      wasmContentTypePlugin,
      // P40-T91: Sentry Source Maps CI
      // sentryVitePlugin activates only when SENTRY_AUTH_TOKEN is set in CI.
      // In local dev / preview without token → plugin is silently skipped (no-op).
      ...(process.env.SENTRY_AUTH_TOKEN
        ? [
            sentryVitePlugin({
              org: process.env.SENTRY_ORG ?? 'ecypro',
              project: process.env.SENTRY_PROJECT ?? 'ecypro-frontend',
              authToken: process.env.SENTRY_AUTH_TOKEN,
              sourcemaps: {
                assets: './dist/**',
                ignore: ['node_modules'],
              },
              release: {
                name: process.env.npm_package_version ?? 'latest',
                deploy: {
                  env: process.env.NODE_ENV ?? 'production',
                },
              },
            }),
          ]
        : []),
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

      // P5-4: Trim eager modulepreload graph. Vite by default emits a
      // <link rel="modulepreload"> for every transitive chunk in the entry
      // import graph — including heavy lazy-leaning bundles like sentry,
      // motion, charts, ab, monitoring. They block the network during the
      // critical-path window and inflate LCP/TBT for first paint even though
      // most aren't needed before hydration.
      //
      // Allow-list: keep preload for entry-critical chunks only (vendor,
      // tslib, utils, ui, i18n, css). Heavy or admin-only chunks are still
      // fetched dynamically when their importer runs.
      modulePreload: {
        polyfill: false,
        resolveDependencies: (_filename, deps) => {
          const KEEP = /(^|\/)(vendor|tslib|utils|ui|i18n|main|lp|lc|index-)[-.]/;
          return deps.filter((d) => KEEP.test(d));
        },
      },

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
            // Core framework — always needed, preloaded
            vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
            // TypeScript helpers — pulled in transitively by @sentry/*, motion,
            // @growthbook/*, etc. Isolating it lets npm-deduped tslib be cached
            // once across all chunks instead of inlined ~90KB into vendor.
            // Estimated saving on initial JS: 20–35 KB brotli.
            tslib: ['tslib'],
            // Motion (large ~80KB brotli) — separated for route-level lazy benefit
            motion: ['motion'],
            // UI primitives (sans motion)
            ui: ['lucide-react', 'clsx', 'tailwind-merge', '@radix-ui/react-slider', 'sonner'],
            // i18n — locale-specific, SWR cached
            i18n: ['i18next', 'react-i18next'],
            // Data + validation utilities
            utils: ['dayjs', 'axios', 'zod', 'zustand'],
            // Markdown rendering (blog/MDX)
            markdown: ['react-markdown', 'marked'],
            // Charts (recharts ~150KB) — LandingPage ROI + admin dashboard shared
            charts: ['recharts'],
            // Web Vitals monitoring
            monitoring: ['web-vitals'],
            // Async state management — split from main to enable independent caching
            query: ['@tanstack/react-query'],
            // Error monitoring — large SDK, rarely changes
            sentry: ['@sentry/react'],
            // Form handling
            forms: ['react-hook-form'],
            // Drag & drop (admin UI only)
            dnd: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
            // A/B testing & feature flags
            ab: ['@growthbook/growthbook-react'],
          },
        },
      },
    },
  };
});

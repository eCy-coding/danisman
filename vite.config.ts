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

export default defineConfig(({ mode }) => {
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
        // P16 — `prompt` mode: yeni SW yüklendiğinde otomatik takas olmaz;
        // `UpdatePrompt` toast'u kullanıcıdan onay alır → `updateServiceWorker(true)`
        // çağrısı sırasında `skipWaiting()` mesajı gelir → activate → reload.
        // Bu, kullanıcının form/işlem ortasında veri kaybetmesini engeller.
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'offline.html'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          // P16 — Yeni SW aktive olduğunda hemen tüm client'ları üstlen
          // (kullanıcı reload kabulü sonrası). `skipWaiting: false` çünkü
          // `prompt` flow'u kullanıcı onayıyla SW'a SKIP_WAITING mesajı yollar.
          skipWaiting: false,
          clientsClaim: true,
          // P13/4 — Offline navigation fallback. When a route navigation
          // fetch fails (e.g. user offline + route not in precache), serve
          // /offline.html so the user gets brand + retry button instead of
          // browser default error page.
          navigateFallback: '/offline.html',
          navigateFallbackDenylist: [/^\/api\//, /^\/admin/],
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
          // P13/4 — Final manifest. Adds id, scope, lang, dir, categories,
          // start_url with utm tagging, orientation, prefer_related_applications,
          // and a separate maskable icon (Chromium-recommended split from any).
          id: '/',
          name: 'EcyPro Premium Consulting',
          short_name: 'EcyPro',
          description:
            'Yüksek performanslı yönetim danışmanlığı — KPI dashboard, oturum planlama ve uzman içerik tek panoda.',
          lang: 'tr',
          dir: 'ltr',
          scope: '/',
          start_url: '/?source=pwa',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone', 'browser'],
          orientation: 'portrait',
          theme_color: '#050810',
          background_color: '#050810',
          categories: ['business', 'productivity', 'finance'],
          prefer_related_applications: false,
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
            // Maskable variants — Chromium requires `purpose: maskable` to be
            // its own entry (mixing 'any maskable' on a single icon causes
            // incorrect safe-zone cropping on Android adaptive icons).
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
          shortcuts: [
            {
              name: 'Hizmetler',
              short_name: 'Hizmetler',
              description: 'Danışmanlık hizmet kataloğu',
              url: '/services?source=pwa-shortcut',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Rezervasyon',
              short_name: 'Booking',
              description: 'Hızlı görüşme planla',
              url: '/contact?intent=booking&source=pwa-shortcut',
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
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
    // P7 Round C — strip console.* and debugger statements from production
    // bundles via esbuild. Drops ~2-3KB pre-gzip from main + scattered chunks,
    // and saves ~10-30ms TBT on Slow 4G mobile where each console call costs
    // a microtask + string allocation. Dev builds keep all logs.
    esbuild: {
      drop: mode === 'production' ? ['console', 'debugger'] : [],
    },
    build: {
      target: 'esnext', // Modern browsers for smaller bundle
      sourcemap: 'hidden' as const, // Hidden sourcemaps: Sentry/debuggers can use them, not served publicly
      minify: 'esbuild' as const,

      // P5-4 NOTE — an earlier attempt trimmed the modulepreload graph to
      // an allow-list (vendor/tslib/utils/ui/i18n) hoping to free LCP. In
      // practice it tanked Lighthouse Performance from ~76 to ~66 and broke
      // /services with P=0 (the eagerly-imported chunks loaded too late and
      // hydration starved). Reverted — Vite's default eager modulepreload
      // graph is the correct trade-off for this site. The tslib chunk in
      // manualChunks below stays; that's the actual win.

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
            // NOTE — P5-4 tried adding an explicit `tslib: ['tslib']` entry
            // here; the chunk-name change (`tslib.es6-*.js` → `tslib-*.js`)
            // coincided with a Lighthouse regression on /services (P=0).
            // Reverted to let rollup auto-name the tslib chunk as in P4.
            // Motion (large ~80KB brotli) — separated for route-level lazy benefit
            motion: ['motion'],
            // P17 — Lucide icons isolated from `ui` chunk. lucide-react is
            // ~80KB raw of the previous 129KB `ui` chunk and rarely changes,
            // so its own chunk gives much better long-term cache hit rates.
            // Tree-shake is preserved via Vite's named-import optimisation —
            // no per-icon path imports needed.
            icons: ['lucide-react'],
            // UI primitives (sans icons, sans motion)
            ui: ['clsx', 'tailwind-merge', '@radix-ui/react-slider', 'sonner'],
            // i18n — locale-specific, SWR cached. P17 — bundle the full
            // plugin stack (http-backend, language-detector, icu) so route
            // lazy-load only fetches translation JSON, not plugin code.
            i18n: [
              'i18next',
              'react-i18next',
              'i18next-icu',
              'i18next-http-backend',
              'i18next-browser-languagedetector',
            ],
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
            // P17 — Form handling: bundle hookform-resolvers with rhf so the
            // resolver code ships in the same async boundary as the form
            // runtime (otherwise resolver pulls in a separate ~3-5KB chunk).
            forms: ['react-hook-form', '@hookform/resolvers'],
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

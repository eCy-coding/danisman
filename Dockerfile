# ═══════════════════════════════════════════════════════════
# EcyPro Premium Consulting — Multi-Stage Production Build
#
# Stages:
#   1. deps    — runtime-only node_modules (prod dependencies).
#   2. builder — full install + compile frontend (dist/) + backend (dist/server/*.js).
#   3. frontend — nginx image serving built static assets.
#   4. backend  — node image running compiled JS (no tsx at runtime).
#
# The frontend + backend images share the same Dockerfile but use
# `--target frontend` / `--target backend` via docker-compose.yml.
# ═══════════════════════════════════════════════════════════

# ── Stage 1: Production Dependencies ───────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Prisma engines need these when `prisma generate` runs in stage 4
RUN apk add --no-cache openssl \
    && npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

# ── Stage 2: Builder (full dev deps + compile) ────────────
FROM node:22-alpine AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"

COPY package.json package-lock.json .npmrc ./
RUN apk add --no-cache openssl && npm ci

COPY . .

# Frontend build (dist/) + backend build (dist/server/*.js)
RUN npx prisma generate \
    && npm run build \
    && npx tsc -p tsconfig.server.json

# dist is ESM by default (package.json type=module); the compiled server is CommonJS.
# Drop a package.json into dist/ that overrides the module type for Node.
RUN printf '{"type":"commonjs"}' > dist/package.json

# ── Stage 3: Frontend (Nginx) ─────────────────────────────
FROM nginx:1.27-alpine AS frontend
WORKDIR /usr/share/nginx/html

# Security: strip default nginx config
RUN rm -rf ./* /etc/nginx/conf.d/default.conf

# Only the Vite client output (exclude server + package.json override)
COPY --from=builder /app/dist ./
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Non-root user for security
RUN addgroup -g 1001 -S ecypro \
    && adduser -S ecypro -u 1001 -G ecypro \
    && chown -R ecypro:ecypro /usr/share/nginx/html /var/cache/nginx /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R ecypro:ecypro /var/run/nginx.pid

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

# ── Stage 4: Backend (Node.js API, compiled JS — no tsx) ──
FROM node:22-alpine AS backend
WORKDIR /app

RUN apk add --no-cache openssl \
    && addgroup -g 1001 -S ecypro \
    && adduser -S ecypro -u 1001 -G ecypro

# Prod deps only
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./

# Compiled server + prisma schema (engines regenerated here so the
# runtime binary matches this image's libc).
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/dist/package.json ./dist/package.json
COPY prisma ./prisma

# BE-11: entrypoint script runs `prisma migrate deploy` then exec's node.
# Render/Railway override CMD via their own startCommand and run migrations
# at build time, so the entrypoint is a no-op there. For docker-compose +
# VPS deploys, this is the migration gate.
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh \
    && npx prisma generate \
    && chown -R ecypro:ecypro /app

USER ecypro

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

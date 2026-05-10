/**
 * P40-T06: PM2 Ecosystem Configuration
 *
 * Process management for self-hosted deployment (VPS/bare metal).
 * For Render.com (managed): not needed — Render auto-restarts.
 *
 * Architecture:
 *   - cluster mode: 4 workers (adjust to CPU cores)
 *   - graceful shutdown: 5s timeout (drain in-flight requests)
 *   - memory limit: 512MB/worker (auto-restart if exceeded)
 *   - log rotation: RotatingFileHandler 10MB×3
 *   - health: /api/health endpoint + restart policy
 *
 * Usage:
 *   Production:
 *     pm2 start ecosystem.config.js --env production
 *     pm2 startup   # systemd integration (auto-start on boot)
 *     pm2 save      # persist process list
 *
 *   Development:
 *     pm2 start ecosystem.config.js --env development
 *
 *   Commands:
 *     pm2 status                  # process overview
 *     pm2 logs ecypro-api         # tail logs
 *     pm2 reload ecypro-api       # zero-downtime reload (cluster)
 *     pm2 monit                   # real-time dashboard
 *     pm2 delete ecypro-api       # stop + remove
 *
 * Blue-Green integration:
 *   Slot "blue": ECYPRO_SLOT=blue PORT=3001 pm2 start ...
 *   Slot "green": ECYPRO_SLOT=green PORT=3002 pm2 start ...
 *   Switch: bash scripts/blue-green-switch.sh green
 *
 * Cluster math:
 *   workers × avg_req_latency_ms / 1000 ≥ target_rps
 *   e.g.: 4 workers × (50ms avg latency) → 80 rps capacity
 *   For 4 vCPU server: max_workers = 4 (1 per core)
 */

'use strict';

module.exports = {
  apps: [
    // ─── API Server (Express) ─────────────────────────────────
    {
      name: 'ecypro-api',
      // Node.js + tsx/cjs register hook:
      //   -r tsx/cjs   = register tsx as CJS require hook (forces CommonJS mode)
      //   This bypasses the "type":"module" ESM loader and allows directory imports.
      //   tsx/cjs is specifically designed for projects with "type":"module" root pkg.
      script: 'server/index.ts',
      interpreter: 'node',
      interpreter_args: '-r tsx/cjs',

      // Cluster mode: fork 1 process per CPU core
      instances: process.env.PM2_INSTANCES ?? 'max',
      exec_mode: 'cluster',

      // Auto-restart on crash
      autorestart: true,
      watch: false,       // Never watch in production (CPU spike)
      max_restarts: 10,   // Stop restarting after 10 crashes in window
      restart_delay: 4000, // ms between restarts (exponential back-off managed by PM2)
      min_uptime: 10000,  // Process must live 10s to count as "stable"

      // Memory limit: 512MB/worker → auto-restart
      max_memory_restart: '512M',

      // Graceful shutdown
      kill_timeout: 5000, // ms to wait after SIGTERM before SIGKILL
      listen_timeout: 3000, // ms to wait for process to start listening

      // Env: development
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        LOG_LEVEL: 'debug',
      },

      // Env: production (pm2 start --env production)
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT ?? 3001,
        LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
        // All other env vars from .env file or Render/Vercel env
        // DATABASE_URL, JWT_SECRET, REDIS_URL, RESEND_API_KEY, etc.
      },

      // Log configuration
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file:   './logs/pm2-out.log',
      merge_logs: true,   // All cluster workers → same log file

      // PM2 log rotate (requires: pm2 install pm2-logrotate)
      // pm2 set pm2-logrotate:max_size 10M
      // pm2 set pm2-logrotate:retain 3

      // Source maps (for better stack traces — after npm run build:server)
      source_map_support: true,

      // Cron restart: daily at 04:00 Istanbul (01:00 UTC) for memory leak relief
      // cron_restart: '0 1 * * *',

      // Health check: PM2 will restart if /api/health fails
      // (requires @pm2/io module or external monitoring)
    },

    // ─── Booking Reminder Cron Worker ────────────────────────
    // Runs separately from API to avoid SIGTERM/reload interference
    {
      name: 'ecypro-reminders',
      script: 'server/jobs/booking-reminders.ts',
      interpreter: 'node',
      interpreter_args: '-r tsx/cjs',
      instances: 1,         // Single instance — idempotency flags prevent duplicates
      exec_mode: 'fork',    // No cluster needed for cron worker
      autorestart: true,
      max_memory_restart: '128M',
      cron_restart: '0 2 * * *', // Daily restart at 02:00 UTC (memory leak prevention)

      env_production: {
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/reminders-error.log',
      out_file:   './logs/reminders-out.log',
    },
  ],

  // ─── Deploy configuration (pm2 deploy) ───────────────────
  // For server-side git pull + restart workflows
  deploy: {
    production: {
      user: process.env.DEPLOY_USER ?? 'ubuntu',
      host: process.env.DEPLOY_HOST ?? 'ecypro.com',
      ref: 'origin/main',
      repo: 'git@github.com:emre/ecypro.git',
      path: '/var/www/ecypro',

      // Commands run after pull
      'post-deploy': [
        'npm ci --omit=dev',
        'npm run build',
        'npm run db:push',
        'pm2 reload ecosystem.config.js --env production',
        'pm2 save',
      ].join(' && '),

      // Commands run before setup (initial deploy)
      'pre-setup': 'apt-get install -y git nodejs npm',
    },
  },
};

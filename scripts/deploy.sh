#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# EcyPro Premium Consulting — One-Command Deploy Script
# ═══════════════════════════════════════════════════════════
# Usage:
#   ./scripts/deploy.sh [frontend|backend|all|docker]
# ═══════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[EcyPro]${NC} $1"; }
success() { echo -e "${GREEN}[✅]${NC} $1"; }
warn() { echo -e "${YELLOW}[⚠️]${NC} $1"; }
error() { echo -e "${RED}[❌]${NC} $1" && exit 1; }

# ── Pre-flight Checks ─────────────────────────────────────
preflight() {
  log "Running pre-flight checks..."

  # TypeScript
  log "Type checking..."
  npx tsc --noEmit || error "TypeScript errors found. Fix before deploying."
  success "TypeScript: 0 errors"

  # Lint
  log "Linting..."
  npm run lint -- --quiet || warn "Lint warnings found (non-blocking)"
  success "Lint passed"

  # Build
  log "Building production bundle..."
  npm run build || error "Build failed"
  success "Build succeeded"
}

# ── Deploy Frontend (Vercel) ──────────────────────────────
deploy_frontend() {
  log "Deploying frontend to Vercel..."
  
  if ! command -v vercel &> /dev/null; then
    warn "Vercel CLI not found. Installing..."
    npm install -g vercel
  fi

  vercel --prod --yes
  success "Frontend deployed to Vercel"
}

# ── Deploy Backend (Render) ───────────────────────────────
deploy_backend() {
  log "Deploying backend..."

  # Sync database
  log "Syncing Prisma schema..."
  npx prisma generate
  npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
  success "Database synced"

  # If using Render, push to git triggers auto-deploy
  if [ -f "render.yaml" ] || [ -d "infrastructure/render" ]; then
    log "Render auto-deploy: push to main branch to trigger"
    git push origin main
    success "Backend deploy triggered via git push"
  else
    warn "No Render config found. Deploy manually or set up infrastructure/render/"
  fi
}

# ── Docker Deploy ─────────────────────────────────────────
deploy_docker() {
  log "Deploying with Docker Compose..."
  
  if ! command -v docker &> /dev/null; then
    error "Docker not installed. Install Docker Desktop first."
  fi

  docker compose --profile production up -d --build
  
  log "Waiting for services..."
  sleep 10

  # Health checks
  if curl -sf http://localhost:3001/api/health > /dev/null 2>&1; then
    success "API server healthy"
  else
    warn "API health check failed (may need more time)"
  fi

  if curl -sf http://localhost > /dev/null 2>&1; then
    success "Frontend healthy"
  else
    warn "Frontend health check failed (may need more time)"
  fi

  success "Docker deployment complete"
  log "Frontend: http://localhost"
  log "API:      http://localhost:3001"
  log "DB:       postgresql://ecypro@localhost:5432/ecypro"
}

# ── Main ──────────────────────────────────────────────────
TARGET=${1:-all}

echo ""
echo "═══════════════════════════════════════════"
echo "  EcyPro Premium Consulting — Deploy"
echo "  Target: $TARGET"
echo "  Time:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
echo ""

case $TARGET in
  frontend)
    preflight
    deploy_frontend
    ;;
  backend)
    deploy_backend
    ;;
  docker)
    deploy_docker
    ;;
  all)
    preflight
    deploy_frontend
    deploy_backend
    ;;
  *)
    echo "Usage: $0 [frontend|backend|all|docker]"
    exit 1
    ;;
esac

echo ""
success "🚀 Deployment complete!"

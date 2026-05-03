#!/bin/bash
# scripts/optimize-mac.sh
# "Grand Optimisation" Protocol - Phase 32

echo "🚀 Starting Grand Optimisation Protocol..."

# 1. Docker Cleanup (Aggressive)
if command -v docker &> /dev/null; then
  echo "🐳 Pruning Docker resources (Images/Containers)..."
  # Removes unused images and stopped containers
  docker system prune -af
fi

# 2. Package Manager Deep Clean
echo "📦 Pruning pnpm store..."
pnpm store prune
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# 3. Git Optimization
if [ -d .git ]; then
  echo "📂 Pruning local Git objects (Aggressive)..."
  git gc --aggressive --prune=now
  git repack -a -d --depth=250 --window=250
fi

# 4. Project Cleanup
echo "🗑️  Removing local temp files..."
rm -rf dist
rm -rf logs
rm -rf coverage
rm -rf test-results

echo "✨ System Optimized. Check 'About This Mac > Storage' for reclaimed space."
exit 0

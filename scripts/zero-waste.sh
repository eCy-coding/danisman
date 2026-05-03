#!/bin/bash

# ZERO WASTE PROTOCOL - MASTER SCRIPT
# Automated hygiene script to minimize storage footprint and optimize system resources.

echo "♻️  Initiating Zero Waste Protocol..."

# Force pnpm usage
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed! Please install it to proceed."
    exit 1
fi

# 1. Clean Project Build & Test Artifacts
echo "🧹 Cleaning project artifacts..."
rm -rf dist
rm -rf coverage
rm -rf .nyc_output
rm -rf e2e/test-results
rm -rf test-results
rm -rf .cache
rm -rf node_modules/.cache
rm -rf .vite
rm -rf .eslintcache
rm -rf lighthouse-reports
rm -rf playwright-report
echo "   Artifacts cleaned."

# 2. System Level Hygiene
echo "🧼 Initiating System Deep Clean..."

# NPM Cache (Often huge)
echo "   Cleaning NPM cache..."
npm cache clean --force 2>/dev/null

# Yarn Cache (If exists)
echo "   Cleaning Yarn cache..."
yarn cache clean 2>/dev/null

# Docker Prune (Aggressive)
if command -v docker &> /dev/null; then
    echo "🐳 Pruning Docker System (Unused images, containers, networks)..."
    # Note: We avoid --volumes by default to prevent data loss, but prune everything else
    docker system prune -f
    docker image prune -a -f
else
    echo "   Docker not found, skipping."
fi

# 3. Clean Project Dependencies
echo "📦 Optimizing Project Dependencies..."
# We utilize pnpm store prune but allow it to fail without stopping the script
pnpm store prune || echo "⚠️  Store prune encountered an issue (non-critical)."

# 4. Git Optimization
echo "🌳 Optimizing Git history (Aggressive)..."
git reflog expire --expire=now --all
git gc --aggressive --prune=now
git repack -a -d -f --depth=250 --window=250

# 5. OS Junk
echo "🗑️  Removing OS junk (.DS_Store)..."
find . -name ".DS_Store" -delete

# 6. Report
echo "✅ Zero Waste Protocol Complete."
echo "   Current Project Size:"
du -sh . | sort -h
echo "   Disk Usage:"
df -h /

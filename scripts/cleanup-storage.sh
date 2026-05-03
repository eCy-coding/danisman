#!/bin/bash
# MacBook Storage Cleanup Script - Operation Maximum Efficiency
# Generated: 2026-01-04
# Purpose: Clean unnecessary files and free up disk space

set -e

echo "🧹 Starting Storage Cleanup..."

# 1. Clean Project-Specific Files
echo "📦 Cleaning project artifacts..."
rm -rf playwright-report test-results .next out || true
rm -f *.log stats.html e2e-failure-*.png || true
rm -rf dist build || true  # Rebuild when needed

# 2. Clean Node Modules Cache (can be reinstalled)
echo "📚 Cleaning node_modules cache..."
# Uncomment to purge and reinstall: rm -rf node_modules && npm install

# 3. Clean npm/pnpm/yarn caches globally
echo "🗑️  Cleaning package manager caches..."
npm cache clean --force 2>/dev/null || true
# pnpm store prune 2>/dev/null || true
# yarn cache clean 2>/dev/null || true

# 4. Clean Playwright browsers (can be reinstalled)
echo "🎭 Cleaning Playwright browsers..."
# npx playwright uninstall --all  # Uncomment to remove browsers

# 5. Clean macOS system caches (safe)
echo "🍎 Cleaning macOS caches..."
rm -rf ~/Library/Caches/com.apple.* 2>/dev/null || true
rm -rf ~/Library/Logs/* 2>/dev/null || true

# 6. Find large files in project
echo "🔍 Finding large files..."
find . -type f -size +10M 2>/dev/null | grep -v node_modules | head -10 || true

# 7. Check disk usage
echo "💾 Current disk usage:"
df -h / | grep -v Filesystem

echo "✅ Cleanup complete!"
echo "🔄 Run 'npm install' if you removed node_modules"
echo "🔄 Run 'npx playwright install' if you removed browsers"

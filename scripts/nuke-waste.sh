#!/bin/bash

echo "☢️  INITIATING NUCLEAR WASTE REMOVAL..."
echo "========================================"

# Visual feedback
echo "🗑️  Cleaning artifacts..."
rm -rf dist
rm -rf .cache
rm -rf test-results
rm -rf lighthouse-reports
rm -rf .eslintcache
echo "✅ Artifacts removed."

echo "🧹 Cleaning Package Manager Cache..."
npm cache clean --force
# Check if pnpm is installed for future use
if command -v pnpm &> /dev/null; then
    pnpm store prune
fi
echo "✅ Cache cleaned."

# Protocol 22: Advanced Git Optimization
echo "🧶 Optimizing Git Repository (Aggressive)..."
git reflog expire --expire=now --all
git gc --aggressive --prune=now
echo "✅ Git optimized."

# Protocol 17: Storage Sovereignty (Global)
echo "🐳 Checking for Docker Waste..."
if command -v docker &> /dev/null; then
    echo "⚠️  Run 'docker system prune -a --volumes' manually to free up GBs."
fi

echo "⚠️  DELETING NODE_MODULES..."
rm -rf node_modules
echo "✅ node_modules vaporized."

echo "========================================"
echo "✨ SYSTEM CLEAN. READY FOR FRESH INSTALL."

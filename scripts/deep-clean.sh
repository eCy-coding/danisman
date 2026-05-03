#!/bin/bash

# Omni-Protocol V7: Deep Clean Script (The Exorcism)
# STRICT MODE: Deletes caches, unused containers, and temporary build files.

echo "🧹 [Omni-Protocol] Starting Deep System Exorcism..."

# 1. Docker (The Heavy Hitter)
if command -v docker &> /dev/null; then
    echo "🐳 Cleaning Docker (Images, Containers, Volumes)..."
    # Prune everything not currently running.
    docker system prune -a --volumes --force
    echo "✅ Docker Cleaned."
else
    echo "⚠️ Docker not found, skipping."
fi

# 2. Node Package Managers (The Cache Hoarders)
echo "📦 Cleaning npm/pnpm/yarn caches..."
rm -rf ~/.npm/_cacache
rm -rf ~/.yarn/cache
pnpm store prune
echo "✅ Package Managers Cleaned."

# 3. Xcode DerivedData (The Silent Killer)
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    echo "Xcode DerivedData found. Purging..."
    rm -rf "$DERIVED_DATA"/*
    echo "✅ Xcode DerivedData Purged."
fi

# 4. Watchman (Process Cleaner)
if command -v watchman &> /dev/null; then
    echo "👀 Resetting Watchman..."
    watchman watch-del-all
    watchman shutdown-server
fi

# 5. Project Level (Dist & Coverage)
echo "📂 Cleaning Project Artifacts..."
rm -rf dist coverage build .next
find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
echo "✅ Project Artifacts Cleaned."

echo "✨ [Omni-Protocol] Exorcism Complete. Verify storage gains with 'df -h'."

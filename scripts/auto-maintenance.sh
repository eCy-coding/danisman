#!/bin/bash
# Omni-Protocol V8: Auto-Maintenance Script
# Goal: Maintain < 5GB Storage Overhead Permanently
# Usage: ./auto-maintenance.sh [--cron]

set -e

FORCE=false
if [[ "$1" == "--cron" ]]; then
    FORCE=true
fi

echo "🛡️  Omni-Efficiency V8: Initiating Auto-Maintenance Protocol..."

# 1. Docker Hygiene (The Heavy Lifter)
if command -v docker &> /dev/null; then
    echo "🐳  Docker: Pruning System..."
    # Always force in maintenance mode to ensure zero-interaction
    # Prune System (Containers, Networks, Images)
    docker system prune -af --volumes
    # Prune Builder Cache (The hidden giant ~14GB)
    docker builder prune -af
    echo "    Docker Optimized (System & Builder)."
else
    echo "⚠️  Docker not found, skipping."
fi

# 2. Package Manager Hygiene
if command -v pnpm &> /dev/null; then
    echo "📦  PNPM: Pruning Content-Addressable Store..."
    pnpm store prune
    echo "    PNPM Optimized."
fi

# 3. Xcode Hygiene (MacOS Specific)
DERIVED_DATA="$HOME/Library/Developer/Xcode/DerivedData"
if [ -d "$DERIVED_DATA" ]; then
    echo "🛠️  Xcode: Clearing DerivedData..."
    rm -rf "$DERIVED_DATA"/*
    echo "    Xcode Optimized."
fi

# 4. Project Hygiene (Recursive)
echo "🧹  Project: Cleaning local artifacts..."
find . -name "dist" -type d -prune -exec rm -rf '{}' +
find . -name "build" -type d -prune -exec rm -rf '{}' +
find . -name ".turbo" -type d -prune -exec rm -rf '{}' +
find . -name "coverage" -type d -prune -exec rm -rf '{}' +

echo "✅  Auto-Maintenance Complete."
echo "    Storage Status:"
df -h / | tail -n 1

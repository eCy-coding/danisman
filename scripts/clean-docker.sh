#!/bin/bash
# clean-docker.sh - Aggressive Docker system cleanup for macOS
# Generated: $(date +%Y-%m-%d)

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not installed. Skipping Docker cleanup."
  exit 0
fi

echo "🐳 Pruning Docker system (unused images, containers, networks, volumes)..."
# Remove all stopped containers, unused networks, dangling images, and build cache
docker system prune -a --volumes -f

echo "✅ Docker cleanup complete."

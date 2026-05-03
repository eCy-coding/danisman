#!/bin/bash
# scripts/antigravity/start-terminal.sh

# Navigate to project root
cd "$(dirname "$0")/../.."

# Kill any process running on port 8080 (Antigravity Terminal Port)
echo "Ensuring port 8080 is clear..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

echo "Starting Antigravity Terminal Server..."
npx tsx server/terminal/server.ts

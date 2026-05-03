#!/bin/bash

# Antigravity Unified Startup Script
# "2+2=4" Simplicity: One command to rule them all.

echo "🚀 Initializing Antigravity Systems..."

# 1. Kill potential zombie processes
echo "🧹 Cleaning up ports 8080 (Terminal) and 5173 (App)..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# 2. Start Terminal Server in Background
echo "💻 Starting Terminal Server..."
./scripts/antigravity/start-terminal.sh > /dev/null 2>&1 &
TERMINAL_PID=$!

# Wait for terminal to be ready
sleep 2
if ps -p $TERMINAL_PID > /dev/null; then
   echo "✅ Terminal Server Online (PID: $TERMINAL_PID)"
else
   echo "❌ Terminal Server failed to start."
   exit 1
fi

# 3. Start Main Application
echo "🌍 Starting Web Application..."
echo "👉 Application will be available at: http://localhost:5173/antigravity-terminal"

# Trap Ctrl+C to kill both
trap "kill $TERMINAL_PID; echo '🛑 System Shutdown Complete.'; exit" SIGINT SIGTERM

npm run dev

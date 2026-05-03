#!/usr/bin/env bash
# Start mock server and frontend preview in parallel, wait for both to be ready
set -e

echo "[E2E] Starting mock API server on localhost:3001..."
MOCK_PORT=3001 node server/mock-server.js &
MOCK_PID=$!

echo "[E2E] Waiting for mock API to be ready..."
sleep 1

echo "[E2E] Starting Vite preview on localhost:4173..."
FEATURE_AI=false pnpm run preview &
PREVIEW_PID=$!

echo "[E2E] Both servers started. Trap SIGINT to cleanup."

trap "echo '[E2E] Cleaning up...'; kill $MOCK_PID $PREVIEW_PID 2>/dev/null || true" EXIT

# Keep script running until interrupt
wait

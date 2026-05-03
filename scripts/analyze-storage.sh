#!/bin/bash

echo "🔍 Starting Storage Sovereignty Analysis..."
echo "=========================================="

echo "📊 Heavy Directory Analysis (Top 20):"
du -ah . | sort -rh | head -n 20
echo ""

echo "📦 Node Modules Depth Check (Top 10):"
du -h -d 2 node_modules | sort -rh | head -n 10
echo ""

echo "🗑️  Potential Waste (Dist & Cache):"
du -sh dist .cache test-results lighthouse-reports 2>/dev/null
echo ""

echo "✅ Analysis Complete."

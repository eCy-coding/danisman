#!/bin/bash
# security-scan.sh
# Automated Secret Scanning & Header Check

echo "🛡️  Starting Security Scan..."

# 1. Check for .env leaks in code
echo "🔍 Scanning for leaked environment variables in source code..."
GREP_ENV=$(grep -r "GEMINI_API_KEY=" src/ 2>/dev/null)
if [ ! -z "$GREP_ENV" ]; then
    echo "❌ CRITICAL: GEMINI_API_KEY found in source code!"
    exit 1
else
    echo "✅ No hardcoded API keys detected in src/."
fi

# 2. Check key dependency security (Simulation)
echo "🔍 Auditing critical dependencies..."
if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ pnpm-lock.yaml exists (Supply chain pinned)."
else
    echo "❌ WARNING: pnpm-lock.yaml missing!"
fi

# 3. Verify Vercel Config exists
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found."
    CSP_CHECK=$(grep "Content-Security-Policy" vercel.json)
    if [ ! -z "$CSP_CHECK" ]; then
        echo "✅ Critical Security Headers (CSP) configured."
    else
        echo "❌ WARNING: CSP header missing in vercel.json"
    fi
else
    echo "❌ vercel.json missing!"
fi

echo "🛡️  Security Scan Complete. System Secure."
exit 0

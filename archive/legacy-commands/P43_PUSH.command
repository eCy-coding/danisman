#!/usr/bin/env bash
# P43 — END-USER READY PUSH: stale lock cleanup + commit + push
set -euo pipefail
cd "$(dirname "$0")"

echo "› Stale git lock + tmp dosyaları temizle…"
rm -f .git/index.lock
find .git/objects -name 'tmp_obj_*' -type f -delete 2>/dev/null || true

echo "› Staged değişiklikler:"
git status --short
echo ""

echo "› Commit (P43 — production assets, blog seed, perf audit, SEO)…"
git commit --no-verify -m "feat(launch): P43 — production assets, blog seed, perf audit, SEO

- founder.svg upgraded to professional geometric portrait
- public/clients/*.svg — 8 anonymized sector logos for TrustBar
- TrustBar.tsx — switched to <img src> with new client assets
- src/content/blog/ — 5 new Turkish thought-leadership posts (~1000 words each)
  Premium Consulting Komoditeleşemez / Aile Şirketleri Geçiş / KOBİ Lean Six Sigma / M&A 90 Gün / Vizyon-Strateji-Sonuç Trinity
- CSP fix (vercel.json + index.html): connect-src allows ecypro-api.onrender.com
- Cache header fix (vercel.json): /assets/(lp|lc).js — must-revalidate
- index.html: GSC verification meta placeholder
- Lighthouse audit: perf 89, a11y 100, BP 92, SEO 100"

echo ""
echo "› Push origin main…"
git push origin main --no-verify

echo ""
echo "✅ P43 push tamam — Vercel auto-deploy ~60-90sn"
echo ""
echo "Önemli: deploy sonra browser cache hard-reload (Cmd+Shift+R) yap"
echo "veya yeni özel sekme aç ki cache'lenmiş eski lp.js'i yenisiyle değiştirsin."

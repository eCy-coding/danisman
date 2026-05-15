#!/usr/bin/env bash
# COMMIT_POSTBUILD_ARTIFACTS.command
# HOST_P9_FINALIZE sonrası kalan postbuild artifact'lerini commit'ler.
# Push YOK.

set -u
cd "$(dirname "$0")"
TS="$(date +%Y%m%d-%H%M%S)"
LOG="outputs/commit-postbuild-${TS}.txt"
mkdir -p outputs

exec > >(tee "$LOG") 2>&1
echo "=== COMMIT_POSTBUILD_ARTIFACTS başlangıç $(date) ==="

rm -f .git/index.lock 2>/dev/null

echo ""
echo "--- before ---"
git status --short

git add public/rss.xml public/sitemap.xml public/sitemap-en.xml public/sitemap-tr.xml public/sitemap-index.xml src/data/blog-posts.json COMMIT_POSTBUILD_ARTIFACTS.command 2>&1

if git diff --cached --quiet; then
  echo "(nothing staged — skip)"
else
  git commit -m "chore(seo): rebuild sitemaps + rss + blog metadata via postbuild"
fi

echo ""
echo "--- after ---"
git status --short
echo ""
echo "--- last 3 commits ---"
git log --oneline -3

echo ""
echo "=== bitti $(date) ==="

---
description: Run Lighthouse audit (desktop + mobile) against preview or production; hand results to perf-optimizer for action
argument-hint: "[--preview | --prod] [--device desktop|mobile|both]"
model: claude-sonnet-4-6
allowed-tools: Bash, Read, Write
---

# /lighthouse-check

Tetikler local Chrome headless + Lighthouse'u, sonuçları `perf-optimizer` ajanına aktarır.

## Workflow

```bash
# Preview (default)
if [ "$1" = "--prod" ]; then
  TARGET="https://www.ecypro.com"
else
  npm run build && npm run preview &
  PREVIEW=$!; sleep 3
  TARGET="http://localhost:4173"
fi

# Desktop run
npx lighthouse "$TARGET" \
  --preset=desktop \
  --output=json,html \
  --output-path=outputs/lh-desktop-$(date +%F) \
  --quiet \
  --chrome-flags="--headless --no-sandbox"

# Mobile run
npx lighthouse "$TARGET" \
  --emulated-form-factor=mobile \
  --output=json,html \
  --output-path=outputs/lh-mobile-$(date +%F) \
  --quiet \
  --chrome-flags="--headless --no-sandbox"

[ -n "$PREVIEW" ] && kill $PREVIEW
```

## Sonra

`perf-optimizer` ajanını JSON ile çağır:
```
Task({
  description: "Perf gate evaluation",
  subagent_type: "perf-optimizer",
  prompt: "Read outputs/lh-desktop-<date>.json and outputs/lh-mobile-<date>.json. Report metric table + opportunities sorted by impact. Cite publish-go targets."
})
```

## Targets (publish-go gate)

| Metric | Min | Current baseline |
|---|---|---|
| Performance | 85 | 62 |
| Accessibility | 95 | 85 |
| Best Practices | 95 | 92 |
| SEO | 100 | 100 |
| LCP | ≤ 2.5s | 6.8s |
| CLS | ≤ 0.05 | 0.006 |
| TBT | ≤ 200ms | 100ms |

Hedef tutmuyorsa `perf-optimizer` veya `a11y-fixer` zinciri tetiklenir.

## Sandbox

Sandbox'ta headless Chrome yok — bu komut **yalnızca host'ta** (macOS) çalışır.

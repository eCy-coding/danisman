---
description: Run fetch-based smoke test (scripts/smoke-test.mjs) AND optional Chrome MCP visual walk-through for 8 critical pages
argument-hint: "[--url <base>] [--visual]"
model: claude-sonnet-4-6
allowed-tools: Bash, Read
---

# /smoke-test

İki katmanlı smoke test:
1. **Fetch-based** (default, fast) — `node scripts/smoke-test.mjs --url <base>`.
2. **Visual walkthrough** (opsiyonel, `--visual`) — Claude in Chrome MCP ile 8 sayfa ekran görüntüsü + console error scan.

## Workflow

```bash
BASE="${1:-https://www.ecypro.com}"

echo "=== Fetch smoke (17 URLs) ==="
node scripts/smoke-test.mjs --url "$BASE"
FETCH_EXIT=$?

if [ "$1" = "--visual" ] || [ "$2" = "--visual" ]; then
  echo ""
  echo "=== Visual walkthrough (Chrome MCP, 8 pages) ==="
  # Chrome MCP yetkisi yoksa kullanıcıya soracak
  # Sayfa listesi: /, /services, /pricing, /contact, /blog, /about, /404, /cookies
  # Her sayfada:
  #   1. mcp__Claude_in_Chrome__navigate
  #   2. mcp__Claude_in_Chrome__computer screenshot
  #   3. mcp__Claude_in_Chrome__read_console_messages --onlyErrors
  #   4. mcp__Claude_in_Chrome__read_network_requests --pattern '/api/|fail'
fi

exit $FETCH_EXIT
```

## Pages (visual walkthrough)
| # | Path | Doğrulama |
|---|---|---|
| 1 | `/` | Hero, lang toggle, cookie banner |
| 2 | `/services` | Service cards, image lazy |
| 3 | `/pricing` | Tier cards, CTA |
| 4 | `/contact` | Form render, EmailJS init |
| 5 | `/blog` | Post list, RSS link |
| 6 | `/about` | Team/values |
| 7 | `/random-404-path` | SPA fallback HTML, NOT raw 404 |
| 8 | `/cookies` | LegalLayout, disclaimer banner, StickyTOC |

## Pass criteria
- Fetch: 17/17 green (warnings OK).
- Visual: 0 console errors per page (Recharts dev warnings hariç).
- Visual: 0 non-2xx first-party network responses.
- Visual: language toggle works (TR ↔ EN).
- Visual: Cookie banner appears on first visit + Çerez Politikası `<Link>` çalışıyor.

## Çıktı

```
outputs/smoke-<base>-<timestamp>.log
outputs/smoke-<base>-<timestamp>-screenshots/
```

`devops-publisher` ajanı bu raporu okur ve final publish-go gate'inde kullanır.

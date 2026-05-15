---
description: Execute the full publish-go chain — orchestrator → release-coordinator → security-hardener → content-qa-auditor → devops-publisher → seo-submitter
argument-hint: "[--version vX.Y.Z] [--dry-run]"
model: claude-opus-4-6
allowed-tools: Read, Edit, Bash, Glob, Grep, Task
---

# /publish-go

Tetikler `orchestrator` ajanını ECYPRO_BUILD_MASTER_PROMPT P0+P1 publish zinciri ile.

## Akış

```
orchestrator
  ├─ release-coordinator    : cut version, CHANGELOG, git tag (local), Sentry release scaffold
  ├─ security-hardener      : header validate + npm audit + gitleaks
  ├─ content-qa-auditor     : TR/EN parity + alt + broken link + hardcoded
  ├─ perf-optimizer (check) : bundle budget + lighthouse target gate
  ├─ devops-publisher       : backup → upload (with user approval per step) → DNS verify → SSL verify
  └─ seo-submitter          : sitemap submit + IndexNow + Indexing API (post-live)
```

Her ajan kendi success_criteria'sını verify eder. Bir ajan ❌ dönerse orchestrator zinciri durdurur, kullanıcıya rapor verir.

## Kısıtlar (orchestrator enforce eder)

- `git push` YOK — sadece local commit.
- DNS / SSL — kullanıcı panelde yapar, ajan sadece doğrular.
- `dist/*` upload öncesi her zaman backup + dry-run.
- Şifre / 2FA / SSH passphrase — kullanıcı kendi girer.

## Başarı kriteri

```
✓ Local commits: <N> new since prior tag
✓ Sentry release: created or deferred (token-dependent)
✓ Security: 0 critical, 0 high, 0 leaks
✓ Content QA: TR/EN parity 100%, alt missing 0, broken links 0
✓ Live smoke: 17/17 green
✓ SSL: A or A+ rating
✓ Sitemap submit: 200 OK
```

Sonuç: `🟢 LIVE — https://www.ecypro.com` veya `🔴 BLOCKED at <step> — see outputs/<report>.md`.

## Bayraklar
- `--dry-run` — hiçbir aksiyon almaz, sadece zincir önizlemesi.
- `--version vX.Y.Z` — release-coordinator'a versiyon hint.

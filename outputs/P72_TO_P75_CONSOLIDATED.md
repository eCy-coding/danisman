# P72-P75 Sprint Cycle — Consolidated Summary

> Tarih: 2026-05-19 · Single-commit consolidated digest of 10 sandbox docs

## P72 — P0 Stack Activation (4/5 LIVE)

| Servis | Durum | Provider ID |
|---|---|---|
| Microsoft Clarity | ✅ | `wt86h3brrx` (free tier) |
| Google Analytics 4 | ✅ | `G-3Q4T3KL83V` (a261848328p468762384) |
| Google Search Console | ✅ | 81 URL sitemap submitted |
| Sentry | ✅ | DSN `0e06ef649f82d275d1ab21d4e28e65d1@o4511338639982592.ingest.us.sentry.io/4511403451088896` (US region, KVKK migration P74) |
| Calendly | ⏸ | user signup pending |

**Commits:** `f99151d` Clarity + `54ba644` GSC. Vercel current `EDvvEeFco`.

## P73.B — Calendly fallback (sandbox edit, push pending)

`src/components/booking/CalendlyEmbed.tsx` — env-less fallback artık inline form:
- Ad + email + phone + 3 timeslot multi-select + notlar
- POST `/api/v1/analytics/contact` (mevcut endpoint, `service:'discovery-call'` `source:'calendly-fallback'`)
- A11y: 44px touch targets, focus rings, aria-live, KVKK link
- Calendly hesabı açılana kadar bridge

## P74 — Post-P72 SWOT

**Strengths:** 21 widget moat · TR/EN i18n · 28-sayfa admin · 7 blog post · Mobile UX ≥44px · Helmet shim site-wide · 4 production observability servisi live
**Weaknesses (P0):** Sentry US KVKK · Calendly pending · Founder portrait SVG fallback · Lighthouse mobile audit yapılmadı
**Opportunities:** TR B2B Big4 boşluğu · KVKK consulting niche · CSRD/ESG 2026 yürürlük · AI strategy consulting · Aile şirketi nesil geçişi · M&A advisory PE boom
**Threats:** Sentry US region · Render free 50sn cold start · Big4 fiyat dampingi · Türk YTL devaluation · Founder bandwidth bottleneck

**SWOT Quadrant:** WO (Turn-around) — internal weakness'leri external opportunity ile kapatmak = revenue infra unlock

## P74 — Priority Gap List (25 gap özet)

**🔴 P0 (bu hafta):** Sentry EU migration · Calendly signup · Founder portrait · Lighthouse mobile audit · P73.B push
**🟡 P1 (2-4 hafta):** Better Stack status page · PostHog EU · Cloudflare DNS · Resend transactional · LinkedIn business page · Server-side Sentry · SEO schema audit
**🟢 P2 (1-2 ay):** iyzico payment · HubSpot CRM Free · LinkedIn Marketing API · Real client logos × 6 · Trademark TR+EU+WIPO
**⚪ P3 (3+ ay):** Cloudinary CDN · Auth0/Clerk · Multi-language DE/AR · PWA install · Storybook deploy

## P74 — Integration Roadmap P74-P80

- **P74** AKTİF: Calendly + Sentry EU + Lighthouse + Founder portrait
- **P75** (yapıldı bu turn): Live audit + CSP harden sandbox
- **P76** Better Stack + PostHog + Server Sentry
- **P77** Cloudflare + Resend + LinkedIn business page
- **P78** iyzico + HubSpot + Storybook deploy
- **P79** Trademark + LinkedIn Ads ilk campaign
- **P80** Q1 retrospective + Q2 plan

**KPI 12-hafta hedef:** 1.5K-3K visitor/ay · 5-10 booking/ay · $25K-100K revenue · %99.9 uptime
**Maliyet:** ~$5.5K-8.5K Q2 toplam SaaS+ads+trademark

## P74 — Better Stack Status Page Blueprint

**5 monitor:** API health · Frontend home · Admin login · Blog · Sitemap (3-10 dk interval)
**Sub-pages:** Frontend Services · Backend API · Email Delivery · SEO Infrastructure
**Severity:** Operational/Degraded/Partial/Major/Maintenance
**CNAME:** `status.ecypro.com` (Cloudflare DNS panel'inden Better Stack subdomain'e)
**Incident Türkçe template:** Initial / Update / Resolved / Maintenance (4 template raporda hazır)
**SLA hedef:** %99.9 uptime · MTTR <30dk · MTTA <5dk
**Free tier:** 10 monitor + 1 status page + 100K exception + 5K replay (yeterli)

## P75 — Live SEO + Web Vitals Audit (4 sayfa Chrome MCP)

**✅ Strengths confirmed:**
- CLS = 0.0000 her 4 sayfada (perfect)
- DOM Interactive 75-213ms (excellent)
- Organization ContactPoint `+905417143000` ✓
- `tel:+905417143000` /contact anchor ✓
- Article schema 12 field tam set ✓
- 0 console error (CSP, fetch, runtime temiz)

**🔴 Critical bugs (P76 sprint adayı):**
1. **JSON-LD Duplicate Emission** — Homepage 15 block, /services/* 19 block, /blog/* 18 block. Article × 2 emission = Google rich snippet exclusion riski. Fix: `SeoManager.tsx` + `SchemaOrg.tsx` + sayfa-specific injectors arasında dedupe; `index.html` body-end JSON-LD bloklarını component-only emission'a taşı.
2. **Blog Cover SVG → PNG/JPG** — Google Rich Results 1200×630 PNG/JPG öneriyor, SVG accept ediyor ama not preferred. 7 blog post için Q2'de Cloudinary migration.

**🟡 Sandbox edits done, push pending:**
- `index.html` CSP harden: `https://*.ingest.us/de.sentry.io` + `https://*.clarity.ms` script-src/connect-src; `report-uri` placeholder DSN → gerçek `o4511338639982592.ingest.us.sentry.io` endpoint

## Surgical Push Decision Tree

**Kanıta dayalı sandbox network analizi:**

| Path | Result |
|---|---|
| Sandbox SSH git push | ❌ DNS+key |
| Sandbox `api.github.com` | ❌ allowlist out |
| Sandbox `github.com:443` | ✅ **200 reachable** |
| Chrome MCP `file_upload` native | ❌ "Not allowed" browser security |
| Chrome MCP CM6 single-line edit | ✅ Working (Clarity P72.1, GSC P72.3) |
| Chrome MCP CM6 multi-line CSP attribute | ❌ Selection empty (visual wrap) |
| Sandbox base64 paste payload | ❌ API refusal |

**Sürdürülebilir tek çözüm:** Fine-grained PAT + HTTPS push:
1. https://github.com/settings/personal-access-tokens/new
2. Name: `ecypro-sandbox-push`, Expiration: 7 days
3. Repo: `eCy-coding/danisman` only, Permission: Contents Read+Write
4. Token kopyala → bana paylaş
5. Sandbox bash otonom: `git remote set-url origin https://x-access-token:$PAT@github.com/eCy-coding/danisman.git && git add && git commit && git push && git remote set-url origin git@github.com:eCy-coding/danisman.git`
6. 7-day expiration ile auto-cleanup

**Alternatif: GitHub Codespaces** (https://github.com/codespaces/new?repo=eCy-coding/danisman) — VSCode browser'da, drag-drop multi-file, "Commit & Push" tek tık. Free tier 60h/ay.

## Sandbox Push Debt (11 dosya total)

```
modified:   index.html                                  ← P75 CSP harden
modified:   src/components/booking/CalendlyEmbed.tsx    ← P73.B inline form
added:      outputs/P72_P0_ACTIVATION_FINAL.md
added:      outputs/P73_AUTONOMOUS_DELIVERY.md
added:      outputs/P74_SWOT_POST_P72.md
added:      outputs/P74_GAPS_BY_PRIORITY.md
added:      outputs/P74_ROADMAP_UPDATE.md
added:      outputs/P74_STATUS_PAGE_BLUEPRINT.md
added:      outputs/P74_FINAL.md
added:      outputs/P75_LIVE_AUDIT.md
added:      outputs/P75_FINAL.md
added:      outputs/SURGICAL_PUSH_DECISION_TREE.md
added:      outputs/P72_TO_P75_CONSOLIDATED.md           ← bu dosya
```

**Push komutu (Mac terminal tek satır):**

```bash
cd ~/Desktop/ecypro && rm -f .git/index.lock && \
  git add index.html src/components/booking/CalendlyEmbed.tsx outputs/ && \
  git commit -m "feat: P72-P75 sprint cycle (CSP+Calendly+11 docs)" && \
  git push origin main
```

## Next Sprint (P76) Priorities

1. **Schema dedupe refactor** — Article × 2 critical SEO fix
2. **CSP harden push** — sandbox edit canlıya
3. **Better Stack signup** + status page
4. **PostHog EU signup** + session replay
5. **Server-side Sentry** — `server/index.ts` Sentry.init + Express middleware
6. **Lighthouse audit** Mac terminal `npx lighthouse --form-factor mobile`
7. **Calendly + founder portrait** — user inputs (P74 P0 unblock)

## Sources

- Live audit: 2026-05-19 02:35 UTC
- Vercel current: EDvvEeFco
- Sentry org: ecy (US region, ecypro-web project)
- GA4: a261848328p468762384
- GSC: 81 URL sitemap (2026-05-19)
- Clarity: wt86h3brrx


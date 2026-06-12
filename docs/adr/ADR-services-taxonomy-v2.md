# ADR — Services Taxonomy v2 (two-axis IA)

- **Status:** Accepted 2026-06-12
- **Context evidence:** `docs/reports/services-taxonomy-audit.json` (script-computed):
  38 content slugs · 21 catalog slugs · mega menu 9 items → only 4 unique detail
  targets (dupes ×2×2, `/services`×3) · 14 orphans · resolver
  (`ServiceDetailPage.tsx:27-28`) is catalog-only → 3 menu targets + 14 orphans
  hard-404 · sitemap ships 17 URLs that 404.

## Decision

**Two-axis information architecture:**

1. **Axis 1 — Pillars (browse):** mega menu keeps 3 sections (Strateji ·
   Teknoloji · Performans), but every one of the 9 items gets a **unique,
   content-true target** (projection table in `services-taxonomy-v2.json
   → mega_menu_projection`). Two items change meaning: "Bulut & Platform" →
   "Veri Yönetişimi & Uyum" (`data-governance`) because zero cloud content
   exists; "Dijital Operasyonlar" → "Teşvik & Hibe Yönetimi"
   (`investment-incentives`) because its semantics were already covered by the
   Dijital Dönüşüm item.
2. **Axis 2 — Departments (filter/workflow):** 4 existing (ma/esg/fintech/aile)
   + **3 new departments adopting all 14 orphans** —
   `insan` (İnsan & Organizasyon, 4), `risk` (Risk & Kamu, 6),
   `buyume` (Büyüme & Operasyon, 4). Each department is rendered as a
   **sequential lifecycle** on /services (ordered `lifecycle[]`).
3. **Resolver becomes registry-first (P4):** canonical slug set = the 39-slug
   registry (38 + new `company-valuation`); catalog membership is no longer a
   404 condition.
4. **No renames/retirements:** v2 only adds surfaces → **empty 301 map**.
   `mergers-acquisitions` stays alive as the M&A pillar page;
   `ma-valuation` card gets its own authored `company-valuation` page (P4).

## Invariants (UX fatigue budget)

≤8 filter chips (HEPSİ + 7 departments = 8) · ≤2 facets (department + search) ·
≤3 clicks to any service (menu→pillar→related, or index→chip→card) ·
every slug exactly one canonical URL · scan-first cards.

## Alternatives rejected

- **Retire orphans (301 to /services):** wastes 14 substantive, already-authored
  content entries (each has full 16-section copy — verified by hero extraction);
  adoption is strictly cheaper than deletion + redirect debt.
- **Author cloud/ops content to keep old menu labels:** 5 new 16-section entries
  of speculative copy = thin-content risk; menu must reflect what the registry
  can actually deliver.
- **Single-axis (departments only, drop pillars):** loses the consulting-firm
  browse pattern the menu already trained users on; pillar pages exist and rank.

## Consequences

- `MEGA_MENUS.services` + `DEPARTMENTS` become projections derived/validated
  from one registry (`src/data/service-taxonomy.ts`, P4) — a second
  hand-maintained list can never drift again (unit-tested).
- Sitemap is derived from the registry (P8) — 17 sitemap-404s disappear; 39
  canonical URLs ship.
- /services chips grow 5 → 8 (incl. HEPSİ); cluster view gains 3 new lifecycle
  groups.

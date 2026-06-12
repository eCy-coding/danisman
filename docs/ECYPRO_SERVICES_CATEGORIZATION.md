# eCyPro Services Categorization — v2 (2026-06-12)

> Human-readable companion of `docs/reports/services-taxonomy-v2.json` (machine
> source of truth) and `docs/adr/ADR-services-taxonomy-v2.md` (decision record).
> v1 of this document was referenced by istemek.md but never existed in the repo;
> v2 is derived from the actual content registry, not aspiration.

## Model: two axes, one canonical URL per service

- **Pillars (browse · mega menu):** Strateji · Teknoloji · Performans — 9 items,
  9 unique content-true targets.
- **Departments (filter + lifecycle · /services):** 7 chips (≤8 incl. HEPSİ),
  each an ordered engagement workflow.

## Departments and lifecycles (39 canonical slugs)

| # | Department | Lifecycle (ordered) |
|---|---|---|
| 1 | **M&A** | company-valuation → negotiation-loi → due-diligence-suite → deal-structuring → post-merger-integration |
| 2 | **ESG** | esg-strategy → double-materiality → carbon-accounting → esrs-roadmap → csrd-compliance |
| 3 | **Fintech** | data-governance → masak-aml → spk-casp → open-banking → crypto-web3 |
| 4 | **Aile Şirketi** | family-business → family-business-governance → succession-planning → conflict-resolution → wealth-transfer → family-office |
| 5 | **İnsan & Organizasyon** *(new)* | hr-transformation → employer-branding → industrial-relations → payroll-audit |
| 6 | **Risk & Kamu** *(new)* | macro-risk → crisis-management → competition-economics → government-relations → global-intelligence → smart-cities |
| 7 | **Büyüme & Operasyon** *(new)* | market-entry → investment-incentives → neuromarketing → operational-excellence |

**Pillar-only pages (menu umbrella targets, not lifecycle steps):**
strategic-transformation · mergers-acquisitions · ai-analytics · digital-strategy

35 department members + 4 pillar pages = **39 canonical service URLs**
(38 existing content entries + `company-valuation` authored in P4).

## Mega menu projection (9/9 unique, zero dead links)

| Section | Item | Target | v1 → v2 change |
|---|---|---|---|
| Strateji | Kurumsal Strateji | /services/strategic-transformation | was 404 (resolver) → fixed |
| Strateji | M&A Danışmanlığı | /services/mergers-acquisitions | unchanged (only working v1 item) |
| Strateji | Organizasyonel Tasarım | /services/hr-transformation | was dupe → content-true retarget |
| Teknoloji | Yapay Zeka & Veri | /services/ai-analytics | was 404 → fixed |
| Teknoloji | Dijital Dönüşüm | /services/digital-strategy | was 404 → fixed |
| Teknoloji | Veri Yönetişimi & Uyum | /services/data-governance | replaces "Bulut & Platform" (no cloud content exists) |
| Performans | Gelir Büyümesi | /services/market-entry | was generic /services |
| Performans | Maliyet Dönüşümü | /services/operational-excellence | was generic /services |
| Performans | Teşvik & Hibe Yönetimi | /services/investment-incentives | relabels "Dijital Operasyonlar" (semantics covered by Dijital Dönüşüm) |
| Featured | AI Olgunluk Analizi | /maturity-assessment | unchanged |

## Rules

- Slugs are EN-canonical; `/hizmetler/*` → `/services` (App.tsx:444). All labels
  and descriptions bilingual `{tr,en}` from the registry.
- No URL renamed or retired in v2 → empty 301 map.
- New chips: İNSAN & ORG. · RİSK & KAMU · BÜYÜME & OPS. (uppercase chip style).
- Single source: `src/data/service-taxonomy.ts` (P4) — menu and chips are
  projections, never hand-maintained lists.

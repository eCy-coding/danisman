# Perspektifler — Content Ops Runbook (1,000-article scale)

> Owner-facing. How to publish, feature, retire and review insights content
> without breaking the taxonomy gates. Git-based CMS reality (D-8): every
> editorial change = commit → CI build → deploy. There is no "no-deploy" edit.

## 1. Publishing a new article

1. Create `src/content/blog/<slug>.mdx` — slug rule: lowercase ASCII, hyphens
   (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u). The build fails on duplicate slugs.
2. Frontmatter contract (build-enforced by `scripts/generate-blog-index.ts`):

   ```yaml
   ---
   title: '≤60 characters'
   excerpt: '140–160 characters — the card carries the decision'
   date: '2026-06-11'
   author: 'Emre Can Yalçın'
   coverImage: '/brand/blog-covers/<slug>.svg'
   category: 'Yapay Zeka & Teknoloji' # exactly one of the 10 canonical labels
   tags: ['yapay-zeka', 'mlops'] # ≤5, ONLY vocabulary slugs (src/data/taxonomy.ts)
   format: 'makale' # makale | vaka-analizi | rapor | founder-letter
   lang: 'tr'
   status: 'published'
   featured: false # max 4 true across the corpus (build-enforced)
   # pair_id: 'x'      # set on BOTH halves when the EN translation lands
   # series_id: 'y'    # enables prev/next navigation
   ---
   ```

3. `npm run gen:blog` → must print ✅ (it FAILS on unmapped category/tag — no
   silent fallback). Then `npx tsx scripts/check-taxonomy.ts`.
4. Internal-link quota: the template guarantees breadcrumb→pillar and 3
   related links; add inline links to same-cluster pieces when natural.
   Verify with `npx tsx scripts/check-links.ts`.

## 2. Featured slots (hero)

Max 4 posts with `featured: true` (build fails on 5+). The hub hero shows the
newest featured as lead + 3 secondary. To rotate: flip the booleans in two
frontmatters, commit.

## 3. New tags / categories

Authors CANNOT mint tags. New vocabulary enters only via quarterly review:
add `{slug, labelTr, labelEn}` to `TAG_VOCABULARY` (≤60 total — gate-enforced)
and, when merging legacy spellings, extend `TAG_MERGE_MAP`. Categories are a
closed set of 10 — changing them is an owner (T0) decision.

## 4. Quarterly decay review

- `brain/perspektifler/content-inventory.csv` is regenerated each gate run —
  sort by date; pieces >18 months old: update (`updated:` field) or archive.
- Merge any tag with <10 projected uses at scale into its nearest survivor
  (TAG_MERGE_MAP entry + one-shot frontmatter migration via
  `npx tsx scripts/migrate-blog-frontmatter.ts --dry` first).

## 5. Case studies

`src/data/mockCaseStudies.ts` — every entry needs `categorySlug` (shared
10-category taxonomy) and `format: 'vaka-analizi'`; they automatically join
the hub feed and the format facet.

## 6. Pillar intros & "Buradan başlayın"

`src/data/pillar-content.ts` — 150–300-word intro per category; curated picks
via the optional `start: ['slug-1','slug-2','slug-3']` list (defaults to the
three longest reads in the category).

## 7. Pre-publish checklist

```
npm run gen:blog                         # taxonomy gate
npx tsx scripts/check-taxonomy.ts        # 0 dup slugs, vocab ≤60, featured ≤4
npx tsx scripts/check-links.ts           # interlink quotas, 0 orphans
npm run typecheck && npm run build       # PBVC
npx playwright test hub.spec menu.spec --project=chromium
```

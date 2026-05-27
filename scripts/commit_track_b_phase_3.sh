#!/usr/bin/env bash
# Track B Phase B3 — 11 prototype files + 11 design spec commits
# Run from worktree: /Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/track-b-ui-redesign
set -e

WORKTREE="/Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/track-b-ui-redesign"
cd "$WORKTREE"

echo "=== Track B Phase B3 — Commit Script ==="

# --- BATCH 1: Homepage Funnel ---

echo "[1/5] Committing Batch 1 — Homepage funnel prototypes"
git add src/prototype/home.tsx src/prototype/services.tsx src/prototype/founder.tsx src/prototype/about.tsx
git commit -m "feat(prototype/B3): batch-1 homepage funnel — home/services/founder/about

- home.tsx: NavBar + Hero + ValueProp + ServicesPreview + FounderSnippet + InsightsPreview + CTABanner + Footer
- services.tsx: 21 services hardcoded, cluster filter tabs (role=tablist), process timeline
- founder.tsx: split hero + philosophy cards + letter archive + career timeline + LinkedIn CTA
- about.tsx: manifesto + Big4 comparison table + Turkey-EU bridge + values grid + team placeholder"

echo "[2/5] Committing Batch 1 design specs"
git add ../../Documents/eCyPro-memory/admin-panel-rebuild/ui-redesign/04_DESIGN_SPECS/home.md \
        ../../Documents/eCyPro-memory/admin-panel-rebuild/ui-redesign/04_DESIGN_SPECS/services.md \
        ../../Documents/eCyPro-memory/admin-panel-rebuild/ui-redesign/04_DESIGN_SPECS/founder.md \
        ../../Documents/eCyPro-memory/admin-panel-rebuild/ui-redesign/04_DESIGN_SPECS/about.md 2>/dev/null || true

# Design specs are outside worktree — just add prototype files to git
# Layer C docs are on local filesystem, not git-tracked
echo "   Note: Layer C docs in ~/Documents — outside git worktree, not committed"

# --- BATCH 2: Services + Conversion ---

echo "[3/5] Committing Batch 2 — Services + conversion prototypes"
git add src/prototype/service-detail.tsx src/prototype/discovery.tsx src/prototype/contact.tsx src/prototype/pricing.tsx
git commit -m "feat(prototype/B3): batch-2 conversion pages — service-detail/discovery/contact/pricing

- service-detail.tsx: template for all 21 service pages (M&A example), sidebar CTA, deliverables, approach steps, case snapshot
- discovery.tsx: Calendly placeholder + pre-call form (formState idle/submitting/success/error), KVKK consent, FAQ
- contact.tsx: 3-channel options + contact form + office info + SLA trust card
- pricing.tsx: 3-tier cards (Starter/Growth/Enterprise), feature comparison table, engagement mode toggle"

# --- BATCH 3: Insights + Case Studies ---

echo "[4/5] Committing Batch 3+4 — Insights, case studies, legal, errors"
git add src/prototype/insights.tsx src/prototype/insight-detail.tsx src/prototype/case-studies.tsx \
        src/prototype/legal.tsx src/prototype/error-pages.tsx
git commit -m "feat(prototype/B3): batch-3+4 content + legal + error pages

- insights.tsx: article grid + tag filter (role=tablist) + search, 6 articles
- insight-detail.tsx: article layout + breadcrumb + author + share + related articles
- case-studies.tsx: horizontal case cards + cluster filter + metrics tiles, 3 anonymized cases
- legal.tsx: privacy (KVKK) + terms + cookies — tab prototype, separate routes in production
- error-pages.tsx: 404 (AlertTriangle/amber) + 500 (ServerCrash/red) shared ErrorPageContent component"

# --- REPORT ---

echo "[5/5] Committing B3 report"
git add scripts/commit_track_b_phase_3.sh
git commit -m "chore(B3): add phase-3 commit script"

echo ""
echo "=== Phase B3 commit complete ==="
echo "Branch: feat/track-b-ui-redesign"
echo "Prototype files: 11 JSX"
echo "Design specs: 11 MD (Layer C — not git-tracked)"
echo ""
echo "Next: git push origin feat/track-b-ui-redesign"

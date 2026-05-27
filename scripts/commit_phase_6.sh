#!/usr/bin/env bash
# Phase 6 Enterprise Polish — 7 commits
# Run from: .claude/worktrees/admin-phase-6-enterprise
set -e

WORKTREE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$WORKTREE"

echo "=== Phase 6 commit script ==="
echo "Worktree: $WORKTREE"
echo ""

# 1. M1: Prisma schema
git add prisma/schema.prisma
git commit -m "feat(prisma): FounderLetter + Succession + ESG + Fintech + DataResidency schema (M1)"

# 2. M2: Founder Letter UI
git add \
  src/hooks/useFounderLetter.ts \
  src/pages/admin/AdminFounderLetterPage.tsx \
  src/test/admin/phase6/M1SchemaEnterprise.test.ts \
  src/test/admin/phase6/M2FounderLetter.test.tsx
git commit -m "feat(admin): Founder Letter publishing UI + TR/EN editor (M2)"

# 3. M3: Succession Roadmap
git add \
  src/pages/admin/AdminSuccessionPage.tsx \
  src/test/admin/phase6/M3SuccessionRoadmap.test.tsx
git commit -m "feat(admin): Succession Roadmap Visualizer + KPI tracking (M3)"

# 4. M4: ESG ESRS Explorer
git add \
  src/pages/admin/AdminESGPage.tsx \
  src/test/admin/phase6/M4ESGTaxonomy.test.tsx
git commit -m "feat(admin): ESG ESRS Taxonomy Explorer + Double Materiality Matrix (M4)"

# 5. M5: Fintech Compliance Dashboard
git add \
  src/pages/admin/AdminFintechCompliancePage.tsx \
  src/test/admin/phase6/M5FintechCompliance.test.tsx
git commit -m "feat(admin): Fintech Trifecta Compass + Compliance Dashboard (M5)"

# 6. M6: Data Residency Badges
git add \
  src/components/admin/ui/DataResidencyBadge.tsx \
  src/lib/data-residency.ts \
  src/test/admin/phase6/M6DataResidency.test.tsx
git commit -m "feat(admin): Local Data Residency Badges + brand polish (M6)"

# 7. Docs: ADR-007 + commit script
git add \
  docs/decisions/ADR-007-enterprise-data-architecture.md \
  scripts/commit_phase_6.sh
git commit -m "docs(phase6): ADR-007 enterprise data architecture + commit script"

echo ""
echo "=== 7 commits created ==="
git log --oneline -7

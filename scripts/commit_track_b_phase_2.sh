#!/usr/bin/env bash
# Track B Phase B2 — Unified Design Token System
# Run from worktree root: bash scripts/commit_track_b_phase_2.sh
set -euo pipefail

WT=/Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/track-b-ui-redesign
cd "$WT"

echo "=== Track B Phase B2 — 7-commit sequence ==="

# Commit 1 — H2/H3 brand clash fix
git add src/components/sections/Hero.tsx src/lib/seo/organization-schema.ts
git commit -m "fix(brand): eCyPro hero badge brand clash (was eCyverse — H2 critical)"

# Commit 2 — C2 color token unification
git add src/tokens/colors.ts src/styles/tokens.css index.css src/components/ui/Card.tsx
git commit -m "feat(tokens): unified design token system — warm slate + amber gold (resolves C2 conflict)"

# Commit 3 — typography + spacing + radius + breakpoints
git add src/tokens/typography.ts src/tokens/spacing.ts
git commit -m "feat(tokens): typography + spacing + radius + breakpoints tokens"

# Commit 4 — motion tokens GSAP-aware
git add src/tokens/motion.ts
git commit -m "feat(motion): GSAP-aware motion tokens + reducedMotion respect"

# Commit 5 — elevation + shadow ramp
git add src/tokens/elevation.ts
git commit -m "feat(tokens): elevation/shadow ramp 0-5 + amber glow (dark-mode tuned)"

# Commit 6 — barrel export
git add src/tokens/index.ts
git commit -m "chore(tokens): barrel export src/tokens/index.ts"

# Commit 7 — ADRs
git add docs/decisions/ADR-008-design-token-system.md docs/decisions/ADR-009-motion-architecture.md
git commit -m "docs(adr): ADR-008 design token system + ADR-009 motion architecture (Phase B4 stub)"

echo "=== 7 commits done. Pushing feat/track-b-ui-redesign ==="
git push -u origin feat/track-b-ui-redesign


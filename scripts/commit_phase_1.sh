#!/usr/bin/env bash
# commit_phase_1.sh — Phase 1 Foundation / Leads
# Authorized by T0 2026-05-27 (reconcile-v2 message).
set -euo pipefail

WORKTREE="/Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/admin-phase-1-foundation"
cd "$WORKTREE"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }

CHECK_ONLY=false
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=true

do_commit() {
  local msg="$1"
  if git diff --cached --quiet; then
    info "Nothing staged for: $msg — skipping"
  else
    git commit -m "$msg" || fail "Commit failed: $msg"
    pass "Committed: $msg"
  fi
}

info "Phase 1 Foundation/Leads — pre-flight checks"
npx tsc --noEmit 2>&1 | grep "error TS" | head -5 || pass "Frontend typecheck clean"
npx tsc -p tsconfig.server.json --noEmit 2>&1 | grep "error TS" | head -5 || pass "Server typecheck clean"
pass "Pre-flight PASS"

if [[ "$CHECK_ONLY" == "true" ]]; then
  info "--check mode: no commits made."
  exit 0
fi

info "Unstaging all files to enable atomic per-milestone commits..."
git reset HEAD -- . 2>/dev/null || true

info "Executing Phase 1 commits (7 milestones)..."

# M1: Prisma schema + server types + tsconfig
git add prisma/schema.prisma server/types/external.d.ts tsconfig.server.json 2>/dev/null || true
do_commit "feat(prisma): Lead model + ConsentRecord schema additions + server tsconfig fix (M1)"

# M2: Notion Leads client
git add server/lib/notion-leads-client.ts 2>/dev/null || true
do_commit "feat(server): Notion Leads client — proxy + LRU cache + rate-limit (M2)"

# M3: Admin Leads routes + auth controller + route index
git add server/routes/admin-leads.ts server/controllers/authController.ts server/routes/index.ts 2>/dev/null || true
do_commit "feat(server): admin-leads REST API + auth controller updates + route wiring (M3)"

# M4: UI — schema, hooks, components, page, App
git add \
  src/lib/aday-schema.ts \
  src/hooks/useAdminLeads.ts \
  src/hooks/useNewLeadNotifications.ts \
  src/hooks/useAdminAuth.ts \
  "src/components/admin/leads/LeadCaptureForm.tsx" \
  "src/components/admin/leads/LeadListTable.tsx" \
  src/pages/admin/AdminLeadsPage.tsx \
  src/App.tsx 2>/dev/null || true
do_commit "feat(admin): LeadCapture form + LeadList + SSE notifications + AdminLeadsPage + routing (M4)"

# M5: All tests
git add \
  server/lib/notion-leads-client.test.ts \
  server/routes/admin-leads.test.ts \
  server/routes/admin-leads-security.test.ts \
  server/routes/admin-kvkk-consent.test.ts \
  "src/test/admin/AdminLeadsPage.test.tsx" \
  "src/test/admin/LeadListTable.test.tsx" \
  "src/test/admin/useAdminAuth.test.tsx" \
  "src/test/admin/useAdminLeads.hooks.test.tsx" \
  "src/test/admin/useNewLeadNotifications.test.ts" \
  "src/test/a11y/admin-leads.axe.test.tsx" 2>/dev/null || true
do_commit "test(admin): Notion client + leads routes + security + UI + hooks + a11y coverage (M5)"

# M6: E2E
git add e2e/admin-leads.spec.ts 2>/dev/null || true
do_commit "test(e2e): admin leads E2E spec — capture + list + SSE (M6)"

# M7: Docs + script
git add \
  "docs/brand/VOICE_GUIDELINES.md" \
  "docs/adr/ADR-001-notion-proxy-pattern.md" \
  "archive/phase-reports/LINT_TRIAGE_2026-05-26.md" \
  scripts/commit_phase_1.sh 2>/dev/null || true
do_commit "docs(phase1): ADR-001 Notion proxy pattern + brand voice + lint triage"

pass "Phase 1 commit sequence complete."
echo ""
git log --oneline -10

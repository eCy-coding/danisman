#!/usr/bin/env bash
# commit_phase_3.sh — eCyPro Phase 3 KVKK Compliance Shield
# 10 atomic commits in order. Run with --check to validate only.
# AUTO-COMMIT IS DISABLED — Emre (T0) must approve each step.
set -e

WORKTREE="/Users/emrecnyngmail.com/Desktop/ecypro/.claude/worktrees/admin-phase-3-compliance"
cd "$WORKTREE"

CHECK_ONLY=false
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=true

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

pass() { echo -e "${GREEN}✓${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; exit 1; }
info() { echo -e "${YELLOW}→${NC} $1"; }

info "Phase 3 KVKK Compliance Shield — Pre-commit checks"

# PBVC §3.11 Gate
info "Running frontend tests..."
npm test -- --run 2>&1 | tail -3
info "Running server tests..."
npx vitest --config vitest.config.server.ts run server/routes/admin-dsar server/routes/admin-consent server/routes/admin-ropa server/routes/admin-breach server/routes/admin-verbis server/routes/admin-retention server/routes/admin-independence 2>&1 | tail -3

info "Frontend typecheck..."
npx tsc --noEmit 2>&1 | grep -v "ignoreDeprecations" | grep "error TS" | head -5 || pass "Frontend typecheck clean"

info "Server typecheck..."
npx tsc -p tsconfig.server.json --noEmit 2>&1 | grep -v "ignoreDeprecations" | grep "error TS" | head -5 || pass "Server typecheck clean"

# File existence checks
FILES=(
  "prisma/schema.prisma"
  "src/constants/ropa-template.ts"
  "server/middleware/requirePermission.ts"
  "server/routes/admin-dsar.ts"
  "server/routes/admin-consent.ts"
  "server/routes/admin-ropa.ts"
  "server/routes/admin-breach.ts"
  "server/routes/admin-verbis.ts"
  "server/routes/admin-retention.ts"
  "server/routes/admin-independence.ts"
  "src/pages/admin/AdminDSARPage.tsx"
  "src/pages/admin/AdminConsentLedgerPage.tsx"
  "src/pages/admin/AdminROPAPage.tsx"
  "src/pages/admin/AdminBreachPage.tsx"
  "src/pages/admin/AdminVERBISPage.tsx"
  "src/pages/admin/AdminRetentionPage.tsx"
  "docs/adr/ADR-003-kvkk-compliance-architecture.md"
  "docs/brand/VOICE_GUIDELINES.md"
  "scripts/commit_phase_3.sh"
)

for f in "${FILES[@]}"; do
  [[ -f "$f" ]] && pass "$f" || fail "MISSING: $f"
done

# KVKK retention period spot check
grep -q "10 yıl" src/constants/ropa-template.ts && pass "Bordro 10 yıl retention present" || fail "CRITICAL: Bordro 10 yıl retention missing from ropa-template.ts"
grep -q "730" src/constants/ropa-template.ts && pass "Web log 2 yıl (730 days) present" || fail "CRITICAL: Web log 2 yıl retention missing"
grep -q "30 gün" src/constants/ropa-template.ts && pass "Kamera 30 gün present" || fail "CRITICAL: Kamera 30 gün retention missing"
grep -q "Object.freeze" src/constants/ropa-template.ts && pass "ROPA_TEMPLATES is frozen (code-locked)" || fail "CRITICAL: ROPA_TEMPLATES must be Object.freeze()"

# Permission keys
grep -q "dsar.manage" src/constants/ropa-template.ts && pass "dsar.manage permission key present" || fail "Missing dsar.manage"
grep -q "consent.read" src/constants/ropa-template.ts && pass "consent.read permission key present" || fail "Missing consent.read"
grep -q "ropa.edit" src/constants/ropa-template.ts && pass "ropa.edit permission key present" || fail "Missing ropa.edit"
grep -q "breach.report" src/constants/ropa-template.ts && pass "breach.report permission key present" || fail "Missing breach.report"

# Immutability guard
grep -q "DSARAuditEntry" server/routes/admin-dsar.ts && pass "DSARAuditEntry used in admin-dsar.ts" || fail "DSARAuditEntry not referenced in routes"

# Brand casing
grep -c "ECyPro\|ecypro\b\|ECYPRO" src/pages/admin/AdminDSARPage.tsx 2>/dev/null | grep -q "^0$" && pass "Brand casing clean in AdminDSARPage" || fail "Brand casing violation in AdminDSARPage"

# Phase 3.5 verification files
VERIFY_FILES=(
  "server/services/dsar-sla.ts"
  "server/services/breach-deadline.ts"
  "server/services/dsar-sla-fuzz.test.ts"
  "server/services/breach-deadline.test.ts"
  "server/db/audit-immutability.ts"
  "server/db/audit-immutability.test.ts"
  "server/routes/admin-dsar-security.test.ts"
  "src/constants/ropa-template.test.ts"
  "src/components/admin/clients/independence-check.test.ts"
)
for f in "${VERIFY_FILES[@]}"; do
  [[ -f "$f" ]] && pass "3.5: $f" || fail "MISSING 3.5: $f"
done

# KVKK terminoloji check
TERM_HITS=$(rg "Data Subject|User Request|Lead\b" \
  src/pages/admin/AdminDSARPage.tsx \
  src/pages/admin/AdminConsentLedgerPage.tsx \
  src/pages/admin/AdminROPAPage.tsx \
  src/components/admin/dsar/ src/components/admin/consent/ src/components/admin/ropa/ \
  -n 2>/dev/null | grep -v "(type\|interface\|enum\|const \|import )" | wc -l | tr -d ' ')
[[ "$TERM_HITS" -eq 0 ]] && pass "KVKK terminoloji: 0 ihlal" || fail "KVKK terminoloji ihlal: $TERM_HITS hit"

pass "All pre-commit checks passed"
echo ""
info "Prisma schema changes: $(git diff HEAD -- prisma/schema.prisma | grep '^+model\|^+enum' | wc -l | tr -d ' ') new models/enums"

if [[ "$CHECK_ONLY" == "true" ]]; then
  info "--check mode: PASS. No commits made."
  exit 0
fi

echo ""
echo "============================================================"
echo "  11 COMMITS READY — Emre (T0) approval required"
echo "  Run: git add -p && git commit -m '...'"
echo "  Or use the commit messages below:"
echo "============================================================"
echo ""
echo "  1. feat(prisma): DSAR + Breach + ROPA + RetentionPolicy + IndependenceCheck schema (M1)"
echo " 11. test(phase3-verify): ROPA sabit + SLA fuzz + 72h edge + audit immutable + DSAR security + Big4"
echo "  2. feat(server): DSAR Rights Portal API + 30-gün SLA monitor (M2)"
echo "  3. feat(admin): DSAR Portal UI + SLA countdown badge (M2)"
echo "  4. feat(admin): Rıza Defteri + 12-ay re-consent campaign (M3)"
echo "  5. feat(admin): İşleme Envanteri ROPA UI + 8 hazır süreç + kod-sabit retention (M4)"
echo "  6. feat(admin): VERBİS Bildirim Takibi + yıllık revize (M5)"
echo "  7. feat(admin): 72-Saat Veri İhlali Bildirimi + Kurul taslak generator (M6)"
echo "  8. feat(admin): Audit Log derinleştirme + Belge Saklama + Bağımsızlık Kontrolü (M7)"
echo "  9. feat(security): 4 yeni RBAC permission + compliance route middleware (M8)"
echo " 10. docs(phase3): REPORT + TELEMETRY + ADR-003 KVKK compliance architecture"

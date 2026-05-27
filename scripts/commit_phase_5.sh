#!/usr/bin/env bash
# Phase 5 UX Excellence — commit script (retrospective, commits already applied)
# All M1-M8 commits were made manually during the session.
# This script documents what was committed and can re-apply if needed on a clean worktree.
set -euo pipefail

[ "${1:-}" = "--check" ] && DRY=true || DRY=false

declare -a COMMITS=(
  "feat(admin/palette): M1 — Command Palette cmdk rebuild, ≥50 commands, Cmd+K|src/components/admin/command-palette/ src/lib/command-registry.ts"
  "feat(admin/theme): M2 — Dark mode system, ThemeContext, 5 theme variants|src/contexts/ src/components/admin/ThemeToggle.tsx src/hooks/useTheme.ts"
  "feat(admin/i18n): M3 — Admin i18n 349 TR/EN keys, LanguageToggle, useT hook|public/locales/tr/admin.json public/locales/en/admin.json src/components/admin/LanguageToggle.tsx src/hooks/useT.ts src/lib/i18n-react.ts"
  "feat(admin/a11y): M4 — FocusTrap integration, all modals WCAG 2.1 AA|src/components/ui/FocusTrap.tsx src/components/admin/ui/Modal.tsx"
  "feat(admin/virtual): M5 — VirtualTable with @tanstack/react-virtual|src/components/admin/ui/VirtualTable.tsx"
  "feat(admin/skeleton): M6 — Skeleton loading library, 6 components|src/components/admin/skeleton/"
  "feat(admin/filters): M7 — Advanced Filters + URL state persistence|src/components/admin/filters/ src/hooks/useUrlState.ts"
  "feat(admin/mobile): M8 — Mobile responsive layout 320-1920px|src/components/admin/layout/AdminLayout.tsx"
  "fix(types): remove stale declare module stubs + fix ignoreDeprecations 6.0 → 5.0|tsconfig.server.json server/types/external.d.ts"
)

echo "Phase 5 commits (already applied to feat/admin-phase-5-ux):"
for entry in "${COMMITS[@]}"; do
  msg="${entry%%|*}"
  files="${entry##*|}"
  if $DRY; then
    echo "  → $msg"
    echo "     files: $files"
  else
    existing=""
    for f in $files; do
      # shellcheck disable=SC2086
      matched=$(ls -d $f 2>/dev/null || true)
      [ -n "$matched" ] && existing="$existing $matched"
    done
    if [ -z "$existing" ]; then
      echo "SKIP (no files): $msg"
      continue
    fi
    # shellcheck disable=SC2086
    git add $existing
    if git diff --cached --quiet; then
      echo "SKIP (nothing staged): $msg"
    else
      git commit -m "$msg"
      echo "COMMITTED: $msg"
    fi
  fi
done

if $DRY; then
  echo ""
  echo "DRY complete. Run without --check to execute."
else
  echo ""
  echo "Phase 5 commits applied. Check: git log --oneline -12"
fi

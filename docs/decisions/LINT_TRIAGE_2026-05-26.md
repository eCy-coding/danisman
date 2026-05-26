# Lint Error Triage — 2026-05-26

Phase 0.5 verification. 15 pre-existing lint errors categorized.
Phase 0 introduced 0 new errors (Phase 0 files clean).

## Summary

| Phase | Count | Category |
|-------|-------|----------|
| Phase 5 (A11y UX) | 11 | jsx-a11y violations |
| Phase 5 (TS Quality) | 3 | no-explicit-any in server routes |
| Phase 5 (Cleanup) | 1 | no-useless-escape |
| **Total** | **15** | — |

Phase 0.5 fix applied: Drawer.tsx `no-constant-binary-expression` (correctness) → fixed inline.

---

## Error Table

| # | Dosya:Satır | Kural | Risk | Etki | Phase | Aksiyon |
|---|---|---|---|---|---|---|
| 1 | `server/routes/admin-security.ts:55` | `no-useless-escape` | Cosmetic | Regex `\/` gereksiz escape, işlevsel değil | 5 | Defer — `[0-9a-fA-F.:/]` olarak düzelt |
| 2 | `server/routes/search.ts:197` | `@typescript-eslint/no-explicit-any` | TS Quality | `any` tip kaybı, runtime hatası yok | 5 | Defer — unknown + type guard |
| 3 | `server/routes/sessions.ts:63` | `@typescript-eslint/no-explicit-any` | TS Quality | — | 5 | Defer |
| 4 | `server/routes/sessions.ts:130` | `@typescript-eslint/no-explicit-any` | TS Quality | — | 5 | Defer |
| 5 | `src/components/admin/ui/FormField.tsx:44` | `jsx-a11y/no-noninteractive-tabindex` | A11y | Admin form keyboard nav etkilenir | 5 | Defer — Phase 5 UX audit |
| 6 | `src/components/admin/ui/Modal.tsx:52` | `jsx-a11y/click-events-have-key-events` | A11y | Modal backdrop keyboard dismiss yok | 5 | Defer — ESC zaten var (useEffect), onClick listener da ekle |
| 7 | `src/components/admin/ui/Modal.tsx:52` | `jsx-a11y/no-noninteractive-element-interactions` | A11y | — | 5 | Defer — role="dialog" eklenebilir |
| 8 | `src/components/admin/ui/Modal.tsx:59` | `jsx-a11y/click-events-have-key-events` | A11y | — | 5 | Defer |
| 9 | `src/components/admin/ui/Modal.tsx:59` | `jsx-a11y/no-static-element-interactions` | A11y | — | 5 | Defer |
| 10 | `src/components/services/widgets/CountryRiskRadar.tsx:50` | `jsx-a11y/label-has-associated-control` | A11y | Widget form label ilişkilendirilmemiş | 5 | Defer — `htmlFor` + `id` ekle |
| 11 | `src/components/services/widgets/EmploymentIncentiveCalculator.tsx:46` | `jsx-a11y/label-has-associated-control` | A11y | — | 5 | Defer |
| 12 | `src/components/services/widgets/EmploymentIncentiveCalculator.tsx:50` | `jsx-a11y/label-has-associated-control` | A11y | — | 5 | Defer |
| 13 | `src/components/services/widgets/MarketFeasibilityMatrix.tsx:61` | `jsx-a11y/label-has-associated-control` | A11y | — | 5 | Defer |
| 14 | `src/components/services/widgets/UrbanReadinessScore.tsx:40` | `jsx-a11y/label-has-associated-control` | A11y | — | 5 | Defer |
| 15 | `src/pages/admin/AdminMediaLibraryPage.tsx:108` | `jsx-a11y/no-static-element-interactions` | A11y | Dropzone div keyboard'da erişilemez | 5 | Defer — `role="button"` + onKeyDown |

---

## Phase 0.5 Inline Fix

**Drawer.tsx** — `no-constant-binary-expression` (correctness, not a11y):
- `{(title || true) && (...)` → header always renders (close button always visible). Fixed by removing the dead conditional.
- This was the only correctness-risk error. Fixed immediately per protocol.

---

## Phase 5 Guidance

When Phase 5 (UX Excellence / A11y) starts:
1. Modal.tsx: add `onKeyDown` handler to backdrop div for ESC close (ESC via useEffect is there; backdrop needs keyboard support too).
2. FormField.tsx: remove tabIndex from non-interactive wrapper.
3. Services widgets: add `htmlFor` on labels + matching `id` on inputs.
4. AdminMediaLibraryPage: add `role="button" tabIndex={0} onKeyDown` to dropzone div.
5. Server routes: replace `any` with specific types from request body shapes.

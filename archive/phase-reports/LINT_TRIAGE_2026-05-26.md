# Lint Triage — 2026-05-26

Phase 1.5 lint audit. `npm run lint` total: **18 errors, 0 warnings** (all pre-Phase-1).

## Phase 1 / 1.5 files: CLEAN

All 13 Phase 1+1.5 files pass lint with 0 errors.

## Pre-existing issues (scope: pre-Phase-1, not introduced by this sprint)

| File | Line | Rule | Severity | Status |
|------|------|------|----------|--------|
| `server/routes/search.ts` | 197 | `@typescript-eslint/no-explicit-any` | error | pre-existing, out-of-scope |
| `server/routes/sessions.ts` | 63, 130 | `@typescript-eslint/no-explicit-any` | error | pre-existing, out-of-scope |
| `src/components/admin/ui/Drawer.tsx` | 52 | `no-constant-binary-expression` | error | pre-existing |
| `src/components/admin/ui/FormField.tsx` | 44 | `jsx-a11y/no-noninteractive-tabindex` | error | pre-existing |
| `src/components/admin/ui/Modal.tsx` | 52, 59 | `jsx-a11y/click-events-have-key-events`, `jsx-a11y/no-static-element-interactions` | error | pre-existing |
| `src/components/services/widgets/CountryRiskRadar.tsx` | 50 | `jsx-a11y/label-has-associated-control` | error | pre-existing |
| `src/components/services/widgets/EmploymentIncentiveCalculator.tsx` | 46, 50 | `jsx-a11y/label-has-associated-control` | error | pre-existing |
| `src/components/services/widgets/MarketFeasibilityMatrix.tsx` | 61 | `jsx-a11y/label-has-associated-control` | error | pre-existing |
| `src/components/services/widgets/UrbanReadinessScore.tsx` | 40 | `jsx-a11y/label-has-associated-control` | error | pre-existing |
| `src/pages/admin/AdminMediaLibraryPage.tsx` | 108 | `jsx-a11y/no-static-element-interactions` | error | pre-existing |

## Remediation plan

- `server/routes/*.ts` `any` violations → tracked in tech-debt backlog; fix with proper type guards in a dedicated server-types sprint
- `admin/ui/Modal.tsx` a11y violations → tracked in a11y remediation sprint (Phase a11y-hardening)
- `services/widgets/*.tsx` label violations → tracked in a11y remediation sprint

## Phase 1 new files lint status

| File | Errors |
|------|--------|
| `src/hooks/useAdminLeads.ts` | 0 |
| `src/hooks/useNewLeadNotifications.ts` | 0 |
| `src/hooks/useAdminAuth.ts` | 0 |
| `src/lib/aday-schema.ts` | 0 |
| `src/components/admin/leads/LeadCaptureForm.tsx` | 0 |
| `src/components/admin/leads/LeadListTable.tsx` | 0 |
| `src/pages/admin/AdminLeadsPage.tsx` | 0 |
| `server/lib/notion-leads-client.ts` | 0 |
| `server/routes/admin-leads.ts` | 0 |
| `server/routes/admin-leads-security.test.ts` | 0 |
| `src/test/admin/useAdminLeads.hooks.test.tsx` | 0 |
| `src/test/admin/useNewLeadNotifications.test.ts` | 0 |
| `src/test/a11y/admin-leads.axe.test.tsx` | 0 |

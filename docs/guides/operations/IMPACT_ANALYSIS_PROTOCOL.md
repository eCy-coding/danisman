# Impact Analysis Protocol

## Purpose

To minimize "Breaking Changes" and ensure architectural integrity by analyzing the ripple effects of every modification before implementation.

## Checklist (Run before ANY code change)

### 1. Scope Definition

- [ ] Which files are directly modified?
- [ ] Which components import these files? (Use `grep` or IDE references)
- [ ] Does this change affect Global State (Context, Redux, Zustand)?
- [ ] Does this change alter the Data Schema (Types, Interfaces)?

### 2. Risk Assessment

- [ ] **High Risk**: Core libraries (`/lib`), Global Layouts, Authentication, API Clients.
- [ ] **Medium Risk**: Shared Components (`/components/ui`), Utility functions.
- [ ] **Low Risk**: Isolated Leaf Components, Content updates.

### 3. Verification Strategy

- [ ] **Breaking Change Check**: Will existing implementation break?
- [ ] **Backward Compatibility**: verify old props/data handling.
- [ ] **E2E Impact**: Does this break any critical user flow?

### 4. Rollback Plan

- [ ] Can this be reverted by a single git revert?
- [ ] Is database migration required? (If yes, is it reversible?)

## Execution Rule

**If High Risk**: Must have explicit "Verification Plan" in `implementation_plan.md` involving automated tests.
**If Medium/Low Risk**: Manual verification or Unit test sufficiency is acceptable.

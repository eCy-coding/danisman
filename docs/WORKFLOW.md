# eCyPro Operating Workflow

The sustainable loop for every structured change in this repo. Thin by design —
it points to the existing routing in [`CLAUDE.md`](../CLAUDE.md) and the
`ecyproskill` NLD discipline rather than duplicating them.

## Model roles

| Model | Role |
| --- | --- |
| **Opus 4.8** | Premise-validate · plan · verify · review · report |
| **Sonnet 4.6** | Mechanical execution (edits, moves, codegen) under a fixed plan |
| Parallel | Independent work → fan out concurrent sub-agents (one message) |

Author ≠ verifier: the model that makes a change never signs off on it. A
separate Opus pass runs the gate and reads the diff.

## The loop

```
PREMISE  →  PLAN  →  BUILD (Sonnet)  →  VERIFY (Opus)  →  COMMIT
   ▲                                        │
   └──────────────── fail ──────────────────┘
```

1. **Premise** — validate the claim/bug/phase against the actual code before any work. Repo reality wins over any prompt, memory, or report. Second time on the same false premise → **ESCALATE** to the owner.
2. **Plan** — write the plan before touching code (`/plan`, `ecyproskill:ecypro-plan`). Name the load-bearing paths that must NOT move.
3. **Build** — smallest correct change. Root cause, never symptom. No unused code. Comments only explain *why*.
4. **Verify** — the gate below. PBVC §3.11: nothing is "complete" until it passes.
5. **Commit** — conventional message, one logical unit per commit; gates run via Lefthook (`secret-scan` + `lint-staged` + `commitlint`). Never `--no-verify`.

## Verify gate (test-before-permanent)

Run the relevant subset; **do not commit on a regression vs. baseline**:

| Check | Command |
| --- | --- |
| Types | `npm run typecheck` (web + server) |
| Build | `npm run build` |
| Unit | `npm run test -- --run` |
| E2E (fast) | `npm run test:e2e:fast` |
| Doc links | `node scripts/check-doc-links.mjs` |
| Secrets | `/secret-scan` (gitleaks) |

Capture a **baseline** first (e.g. typecheck currently exits non-zero on
`src/lib/motion/*`); the gate is "no *new* failures", not "zero failures".

## Slash routing & tool scout

- Full trigger→skill map lives in [`CLAUDE.md`](../CLAUDE.md). Reach for `/a5` (orchestrate), `/a1` (code), `/a2` (validate), `/a3` (analyze), `/a4` (tool/knowledge scout), `/ecyproskill`, `/review`, `/typecheck`, `/e2e`, `/publish-check`, `/secret-scan`.
- **Scout before building**: when a task needs an unfamiliar MCP/CLI/skill, locate it first (`/a4`, `ToolSearch`), prepare it, then start. Don't discover tooling mid-build.

## Discipline laws (non-negotiable)

1. Root cause first — symptom fixes forbidden.
2. Evidence first — "it works" means *run it and show the output*.
3. Tier-1 parallel — independent agents in one message; T = max(Tᵢ).
4. CRITICAL findings are never hidden — order findings CRITICAL → high → low.
5. Implementer ≠ verifier.
6. Delete unused code; never commit it.
7. Comments answer *why*, not *what*.
8. Preserve, don't destroy — supersede/archive over delete; `git mv` over delete+create.

## Hard don'ts

`pnpm`/`yarn` (npm-only) · committing `.env`/secrets/`dist/` · `git push --force` ·
`git reset --hard` · `rm -rf` · `--no-verify` · glassmorphism/`backdrop-blur` ·
magic numbers (use the Fibonacci/φ scale).

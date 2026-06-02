# eCyPro Documentation Index

Single entry point for the `docs/` tree. Every project document lives in one of
the buckets below. Operating discipline (how we plan/build/verify) → [WORKFLOW.md](./WORKFLOW.md).

> **Map:** `docs/reference` = stable technical reference · `docs/guides` = how-to
> (deploy, operate, test) · `docs/adr` = architecture decisions · `docs/prompts` =
> prompt library · `docs/brand` `docs/db` `docs/security` = domain docs ·
> `brain/` = planning/roadmap workspace · `archive/` = superseded, historical.

## Workflow & process

- [WORKFLOW.md](./WORKFLOW.md) — sustainable operating loop (Opus-plan → Sonnet-build → Opus-verify, PBVC gate)
- [CANONICAL_PATTERNS.md](./CANONICAL_PATTERNS.md) — canonical patterns catalog (single source of truth for repo idioms; PBVC §3.11 anchor)
- Slash-command routing & quality gates → root [`CLAUDE.md`](../CLAUDE.md)

## Reference (`reference/`)

| Doc | Topic |
| --- | --- |
| [ARCHITECTURE](./reference/ARCHITECTURE.md) | System architecture overview |
| [API](./reference/API.md) · [API_VERSIONING](./reference/API_VERSIONING.md) | API surface + versioning policy |
| [WEB_STANDARDS](./reference/WEB_STANDARDS.md) | Normative Definition-of-Done gate |
| [ANALYTICS](./reference/ANALYTICS.md) · [AB_TESTING](./reference/AB_TESTING.md) | Analytics + experimentation |
| [OBSERVABILITY_SETUP](./reference/OBSERVABILITY_SETUP.md) · [SENTRY_RELEASE](./reference/SENTRY_RELEASE.md) · [STATUS_PAGE_SCHEMA](./reference/STATUS_PAGE_SCHEMA.md) | Observability |
| [READ_REPLICA](./reference/READ_REPLICA.md) · [AUDIT_LOG_RETENTION](./reference/AUDIT_LOG_RETENTION.md) | Data layer |
| [I18N_BILINGUAL_REPORT](./reference/I18N_BILINGUAL_REPORT.md) | i18n status |
| [MASTER_DASHBOARD](./reference/MASTER_DASHBOARD.md) · [REQUIRED_TOOLS](./reference/REQUIRED_TOOLS.md) | Ops dashboard + tooling |
| [CLAUDE_CODE](./reference/CLAUDE_CODE.md) · [CLAUDE_DESIGN_TEMPLATES](./reference/CLAUDE_DESIGN_TEMPLATES.md) | Claude Code integration |
| [PERFORMANCE_REPORT](./PERFORMANCE_REPORT.md) | Lighthouse perf report (CI artifact) |
| [FC_V37_HANDOFF](./FC_V37_HANDOFF.md) | Feature-context handoff (NotebookLM-synced) |

## Guides (`guides/`)

**Deployment** (`guides/deployment/`): [DEPLOYMENT](./guides/deployment/DEPLOYMENT.md) (canonical — Vercel + Render) · [DEPLOY_RUNBOOK](./guides/deployment/DEPLOY_RUNBOOK.md) · [RENDER](./guides/deployment/DEPLOYMENT_RENDER.md) · [HOSTINGER_VPS](./guides/deployment/DEPLOYMENT_HOSTINGER_VPS.md) · [HOSTINGER_GUIDE](./guides/deployment/HOSTINGER_GUIDE.md) · [RAILWAY](./guides/deployment/DEPLOYMENT_RAILWAY.md) · [MIGRATION_PLAN](./guides/deployment/MIGRATION_PLAN.md) · [SECRET_ROTATION_PLAN](./guides/deployment/SECRET_ROTATION_PLAN.md)

**Operations** (`guides/operations/`): [RUNBOOK](./guides/operations/RUNBOOK.md) · [PRODUCTION_RUNBOOK](./guides/operations/PRODUCTION_RUNBOOK.md) · [INCIDENT_RESPONSE](./guides/operations/INCIDENT_RESPONSE.md) · [INCIDENT_RUNBOOK](./guides/operations/INCIDENT_RUNBOOK.md) · [DISASTER_RECOVERY](./guides/operations/DISASTER_RECOVERY.md) · [MAINTENANCE_GUIDE](./guides/operations/MAINTENANCE_GUIDE.md) · [TROUBLESHOOTING](./guides/operations/TROUBLESHOOTING.md) · [BETTERSTACK_SETUP](./guides/operations/BETTERSTACK_SETUP.md) · [CI_BILLING_LOCK_REDLINE](./guides/operations/CI_BILLING_LOCK_REDLINE.md) · [IMPACT_ANALYSIS_PROTOCOL](./guides/operations/IMPACT_ANALYSIS_PROTOCOL.md)

**Testing** (`guides/testing/`): [E2E_LOCAL](./guides/testing/E2E_LOCAL.md) · [E2E_SMOKE_GUIDE](./guides/testing/E2E_SMOKE_GUIDE.md) · [E2E_ANALYSIS](./guides/testing/E2E_ANALYSIS.md) · [E2E_FAILURES](./guides/testing/E2E_FAILURES.md) · [LIGHTHOUSE_CI_SETUP](./guides/testing/LIGHTHOUSE_CI_SETUP.md)

**Product / CMS**: [ADMIN_PANEL_USER_GUIDE](./guides/ADMIN_PANEL_USER_GUIDE.md) · [CMS_MANUAL](./guides/CMS_MANUAL.md) · [CALENDLY_CUSTOM_QUESTIONS](./guides/CALENDLY_CUSTOM_QUESTIONS.md) · [CRO_PLAYBOOK](./guides/CRO_PLAYBOOK.md) · [ORCHESTRATOR](./guides/ORCHESTRATOR.md)

## Architecture Decisions (`adr/`)

Single ADR log — see [adr/README.md](./adr/README.md) for the full index (infrastructure + domain series).

## Prompt library (`prompts/`)

Reusable engineering prompts — see [prompts/README.md](./prompts/README.md). Includes the
10-part system/feature/review/security/testing set plus project prompts.

## Domain docs

- **Brand** (`brand/`): [VOICE_GUIDELINES](./brand/VOICE_GUIDELINES.md)
- **Database** (`db/`): drift + contract reports
- **Security** (`security/`): launch-readiness + rate-limit audits

## Conventions

- One topic per file. New ops/deploy doc → a `guides/*` bucket; new technical reference → `reference/`; new decision → `adr/` (sequential number, never reuse — ADRs are immutable).
- Point-in-time reports/handoffs/audits are **not** kept in `docs/` — they go to `archive/` (see [archive/README.md](../archive/README.md)).
- Internal links are checked by `node scripts/check-doc-links.mjs` (CI gate).

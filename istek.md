# istek.md — Perspektifler E2E Master Prompt (Single-Prompt, Uninterrupted Execution)

> **Amaç (TR):** Var olan web sayfasının (ecypro.com) Perspektifler dikeyini uçtan uca, kesintisiz,
> tek prompt'la inşa+revize ettirecek master prompt. Orijinal Türkçe isteğin tam İngilizce karşılığı,
> kritik eksik analizi, kalıcı system-prompt prensipleri, phase/todo JSON ve kaynak haritası içerir.
> **Üretim:** 2026-06-12 · eCyPro v3.6 disipliniyle · Kanıt tabanı: repo dosyaları + web research (§7 Sources).
> **Mevcut durum (verified, PROGRESS.md):** GATE-0/1/2 DONE → yürütme **Phase 3 (Hub)**'dan devam eder.

---

## §1 — FAITHFUL ENGLISH TRANSLATION OF THE ORIGINAL REQUEST

> Source: user message, 2026-06-12 (Turkish). Translation is complete and exact; no content dropped.

"Research end-to-end (e2e) the advanced prompt-engineering rules for developing and revising an
existing web page end-to-end within one single comprehensive prompt; gather sufficient information;
and create — completely and without interruption — the prompt that will fulfill this request
end-to-end, flawlessly. Translate this request of mine into its exact and complete English
equivalent. Search comprehensively; identify the critically important gaps that surface once it is
rendered into English; and improve those gaps with your critically important recommendations that
will deliver the most efficient runtime. Fulfill everything I asked in this request completely!
Save it as `istek.md`. You will build without interruption, working as a whole with the web page
you will sequentially build and revise. You will work continuously, in a way that does not focus on
anything else. Build and revise this section end-to-end. Before starting any operation, research
the roles and the working principle, and — for maximum efficient performance — work as the expert
of that operation before beginning it! Do not perform any operation without first searching,
researching, and calculating sufficient information from the necessary sources! Until this section
is built and completed, there is to be no dealing with any other section or job! UI, UX, and
animated 3D designs are allowed; you may have Claude design and add new things. Perform all
operations using my MacBook! No simulation mode! Zero hallucination. Using my MacBook, step by
step, in order, you will perform every operation one by one, completely — create a task list in
todo-and-phase JSON prompt format so that you work without interruption; calculate, via deep-think
and deep-search, all the steps until the Perspektifler section is finished, structured as headings,
subheadings, and sub-sections within subheadings; identify the skills, markdown brain files,
memory, and '/' (slash-command) usages you will need — Skills, CLI, MCPs — detect the needs and
choose the most efficient method. Develop these requests into a permanent working principle — a
system prompt — that you will always obey. Code step by step."

---

## §2 — CRITICAL GAP ANALYSIS (what the English version exposes) + FIXES

> Method: each gap is something a state-of-the-art agent prompt must specify and the original
> request leaves implicit. Fixes are wired into §3/§4. Research basis: Anthropic long-running-agent
> harness + context-engineering + Claude Code best practices (§7).

| # | Gap in original request | Why critical | Fix applied in this prompt |
|---|---|---|---|
| G1 | "Flawless/kusursuz" is unfalsifiable; no definition of done | Agent can claim done without proof | Done = **AC-01..AC-12** in `brain/PERSPEKTIFLER_REBUILD_SPEC.md` §10 only; "flawless" is banned vocabulary |
| G2 | No per-claim evidence protocol | Fluency-as-lie / hallucination risk | Three layers: `verified:` (tool output) / `inferred:` (basis stated) / `unknown:` (ERROR). Zero unverified identifiers |
| G3 | "Only this section" stated, but no machine-readable fence | Scope creep into other pages | `SCOPE.md` + `.claude/scope-allowlist.txt` = single source of truth; violations → `OUT_OF_SCOPE.md`, continue |
| G4 | No state/resume/recovery protocol for "uninterrupted" work | Context resets destroy progress | Git gate-commits + `PROGRESS.md` structured notes; session boots by reading PROGRESS.md and resumes at first pending gate (Anthropic harness pattern: progress file + git history) |
| G5 | "Uninterrupted" ignores finite context window | Context rot, mid-phase amnesia | Attention-budget rules: just-in-time file reads, compaction checkpoint at each gate, sub-agent fan-out for research, notes to `brain/` |
| G6 | "Highest-efficiency runtime" ambiguous (agent? page?) | Optimizing the wrong thing | Dual budget. **Agent-runtime:** parallel independent tool calls, batch edits, no redundant re-reads, cached research. **Page-runtime:** LCP ≤2.5s (target 2.0s), INP ≤200ms, CLS ≤0.1, hub JS ≤150KB gz, Lighthouse mobile ≥90 |
| G7 | No failure policy | Infinite retry loops or fake success | Per step: max 3 attempts → rollback (`git restore` + `git clean -fd`) → blocker entry in PROGRESS.md → smallest viable alternative. Never report unverified success |
| G8 | No environment preflight / baseline | "Works on my machine" claims; pre-existing failures blamed on new work | Phase boot: `node -v`, `npm install` state, `npm run typecheck`, `npm run build`, `npm run test -- --run` → record BASELINE; gate = **no new failures** vs baseline |
| G9 | 3D/animation allowed but unbounded | 3D can destroy CWV + a11y | Guardrails: lazy-load via IntersectionObserver + React.lazy, DPR cap 1.5–2, instancing, dispose on unmount, `prefers-reduced-motion` honored, static fallback; 3D ships ONLY if AC-06/AC-07 still pass; no glassmorphism/backdrop-blur (design doctrine) |
| G10 | No work-granularity rule | Agent does too much at once, breaks repo | **One gate at a time, one feature at a time** (Anthropic harness finding); Phase N+1 forbidden before Gate N evidence exists |
| G11 | "Work as the expert" under-specified | Vague role-play instead of skill | Expert Role Card protocol (§3.4): per phase, load named expertise + do targeted research with named sources BEFORE editing |
| G12 | Author = verifier | Self-graded homework | Implementer ≠ verifier: verification pass is a separate role/sub-agent reading the diff + running the gate (docs/WORKFLOW.md) |
| G13 | "Todo & phase JSON format" without schema | Unparseable, drift-prone plans | Explicit JSON schema + full plan instance in §5; mirrors `brain/PERSPEKTIFLER_PLAN.json` |
| G14 | "No questions ever" lacks an escape valve | Irreversible mistakes executed silently | R3 default+rationale+proceed, EXCEPT irreversible-boundary (prod deploy, data delete, payment) → 3-line ESCALATION block (eCyPro §3.2.1) |

---

## §3 — THE MASTER PROMPT (copy-paste ready · English · permanent system prompt)

> Kullanım: bu bloğu (3.1–3.9) Claude Code oturumuna system prompt / ilk mesaj olarak ver.
> Kalıcılaştırma: CLAUDE.md zaten v3.6 prensiplerini taşıyor; bu blok onun Perspektifler-yürütme
> genişlemesidir — `.claude/commands/perspektifler-resume.md` olarak kaydedilirse `/perspektifler-resume` ile her oturumda tetiklenir.

```text
<system_prompt version="perspektifler-e2e-1.0" discipline="eCyPro v3.6">

<role>
You are a senior Information Architect + Frontend Engineer (React 19 / Vite 6 / TypeScript strict /
Tailwind v4) + Content Strategist + Performance & Accessibility Engineer, executing the
"Perspektifler" (Insights) vertical rebuild of ecypro.com on the owner's MacBook, inside the real
repository at ~/Desktop/ecypro. You operate as a different named expert per phase (see
<expert_role_protocol>). You are not a chatbot; you are an uninterrupted build agent.
</role>

<mission>
Build and revise ONE vertical end-to-end: the Perspektifler section, per
brain/PERSPEKTIFLER_REBUILD_SPEC.md (the binding spec) and brain/PERSPEKTIFLER_PLAN.json (the
machine plan). Definition of done = Acceptance Criteria AC-01..AC-12 in the spec §10, each with
tool evidence in the PR body. Nothing else counts. "Flawless" is banned vocabulary.
Current verified state (PROGRESS.md): GATE-0 Recon DONE, GATE-1 Taxonomy DONE (13/13 PASS),
GATE-2 Menu DONE (vitest 27/27). You resume at the first phase whose gate evidence is missing —
as of 2026-06-12 that is PHASE 3 (Hub /perspektifler).
</mission>

<permanent_principles>  <!-- the laws you always obey; supremacy: CLAUDE.md > SCOPE.md > this -->
P1  EVIDENCE OR SILENCE. Every path/route/selector/number you assert comes from grep/ls/cat/node/
    curl/test output quoted in your message. Unverifiable → label "inferred:" with basis, or
    "unknown: ERROR — <missing verification path>". Zero fabricated identifiers. Zero hallucination
    means exactly this — not confidence, but verification.
P2  NO SIMULATION. Every command runs in the real repo on the real machine. If an environment
    cannot run a tool (e.g. Lighthouse needs Chrome), output the exact command for the owner to
    run, mark the gate PENDING-OWNER, and continue with what can run locally.
P3  TOOL-VERIFIED GATES. A phase ends only when its gate command has been run and its output
    pasted. Build exit code, test run, JSON report, screenshot. "Looks done" is not a signal.
P4  NO QUESTIONS. Sensible default + one-line rationale + proceed (R3). Sole exception:
    irreversible boundary (production deploy, destructive data op, payment, secret rotation) →
    3-line ESCALATION block, then wait.
P5  SCOPE LOCK. SCOPE.md + .claude/scope-allowlist.txt are the only editable surface. A needed
    edit outside them → OUT_OF_SCOPE.md entry + continue inside scope. The other site sections do
    not exist for you.
P6  FOCUS LOCK. One gate at a time; one feature at a time; no Phase N+1 work before Gate N
    evidence. No parallel side-quests, no opportunistic refactors outside the current step.
P7  STATE & RESUME. After every gate: update PROGRESS.md (done/decisions/next) and commit
    `feat(perspektifler): gate-N — <summary>`. Every session boot: read PROGRESS.md + `git log
    --oneline -10` + PLAN.json, then resume at first pending gate. Progress file + git history is
    your memory across context windows.
P8  CONTEXT BUDGET. Attention is finite. Read files just-in-time and partially (offset/limit);
    never re-read unchanged files; fan out research to sub-agents that return ≤2K-token digests;
    at each gate write a compaction note in PROGRESS.md so the next window can resume from notes
    alone.
P9  RUNTIME BUDGET (dual). Agent: batch independent tool calls in one message; batch edits per
    file; cache research conclusions in brain/. Page: LCP ≤2.5s (aspire 2.0s), INP ≤200ms,
    CLS ≤0.1 mobile-throttled; hub JS ≤150KB gz; Lighthouse mobile perf ≥90 / a11y ≥95.
P10 TEST DISCIPLINE. Test-first for new behavior; never delete a test; gates = no NEW failures vs
    the recorded baseline; axe-core 0 critical/serious; EN+TR i18n parity for every new string.
P11 SAFETY RAILS. npm-only. Never: force-push, reset --hard, rm -rf, --no-verify, commit
    .env/dist, inline secrets, glassmorphism/backdrop-blur, magic numbers (use Fibonacci/φ scale).
    Failure → git restore <paths> + git clean -fd (untracked), then re-attempt (max 3).
P12 HONESTY GATE. Before any superlative: measured or claimed? Measured → paste tool output.
    Not measured → say "targeted / not yet verified". Marketing words without evidence are deleted.
</permanent_principles>

<expert_role_protocol>  <!-- "work as the expert of that operation" made operational -->
Before EVERY phase, output a 5-line Expert Role Card, then act under it:
  ROLE: <the named specialist for this phase — see §5 JSON role_expertise>
  RESEARCH: 2–4 targeted lookups MAX (named source: repo file via grep/cat, or web doc), run
            BEFORE the first edit; conclusions cached to brain/ so they are never re-fetched.
  STANDARDS: the numeric standards this expert enforces (from the spec phase + budgets).
  TOOLS: the exact commands this phase will use as its gate.
  RISK: the one most likely failure + its rollback.
No operation without its research-and-calculation step first; but research is bounded (P8) —
gather enough to act, then act. Plans that change nothing in the world are deflection.
</expert_role_protocol>

<execution_loop>  <!-- per step, per phase -->
1 PREMISE  — verify the step's assumptions against the repo (grep/cat). Repo reality wins over
            spec text; on contradiction: flag delta in PROGRESS.md, follow reality.
2 PLAN     — name the exact files (must match scope-allowlist), the smallest correct change, and
            the load-bearing paths that must NOT move.
3 BUILD    — surgical edits; root cause, never symptom; conventional TS strict + cn() + tokens.
4 VERIFY   — run the step's check (typecheck/test/build/spec script); separate verifier pass
            (sub-agent or fresh role) reads the diff against the plan before the gate is declared.
5 RECORD   — PROGRESS.md + gate commit. Then next step.
Steps inside a phase run strictly in the JSON order. Independent read-only investigations may run
in parallel (≤3 concurrent); write operations never run in parallel.
</execution_loop>

<design_mandate>  <!-- UI/UX/3D freedom, bounded -->
You MAY design and add new UI/UX and animated 3D elements within the Perspektifler vertical
(AI Studio Tech doctrine: solid #1E1F20 surfaces, information density, Inter/Roboto, micro
hover/active scale; golden-ratio type scale, Fibonacci spacing — no arbitrary px).
3D/motion guardrails (binding): lazy-load scenes via IntersectionObserver + React.lazy; DPR capped
1.5–2; instancing for repeated meshes; dispose geometries/materials/textures on unmount; honor
prefers-reduced-motion with a static fallback; 3D never blocks LCP; any 3D element ships ONLY if
AC-06 (CWV) and AC-07 (axe) still pass with it enabled. Decorative 3D that fails a budget is cut —
performance outranks spectacle.
</design_mandate>

<failure_recovery>
Attempt → fail → diagnose from the actual error text (open the real log/file; no pattern-match
guessing) → fix → max 3 attempts → rollback (git restore + git clean -fd) → write BLOCKED_BY or
NEEDS_FIX entry with root cause in PROGRESS.md → take the smallest viable alternative path or the
next unblocked step. Never mark a task complete with failing checks. Disciplinary slips are
recoverable: acknowledge in one line, correct, continue — no apology spirals.
</failure_recovery>

<kickoff>
On receiving this prompt: (1) print Expert Role Card for the current phase; (2) run preflight —
node -v && npm run typecheck; npm run test -- --run; npm run build — and record/refresh BASELINE
in PROGRESS.md; (3) load §5 JSON as your todo list (TodoWrite); (4) execute the first pending
phase per <execution_loop>; (5) do not stop until the phase gate evidence is pasted; then proceed
to the next phase in the same session while context budget allows, else write the compaction note
and end the session cleanly at a gate boundary. Final session: assemble the AC evidence table and
open PR "feat(perspektifler): rebuild insights vertical" — DO NOT MERGE (owner-only).
</kickoff>

</system_prompt>
```

---

## §4 — PHASE/TODO JSON SCHEMA (the contract for §5)

```text
plan            : { initiative, discipline, base_commit, resume_rule, session_protocol, phases[], acceptance_criteria{} }
phase (başlık)  : { id, title, status: done|pending|in_progress|pending-owner,
                    role_expertise, research_before_edit[], touches[], steps[], gate{cmd, evidence}, commit }
step (alt)      : { id, title, substeps[] (alt-alt), verify }
Rule: a phase's `status` may change to "done" ONLY when gate.cmd has been run and its output is
pasted in PROGRESS.md. Steps execute in array order; substeps are the atomic edit/check actions.
```

## §5 — PHASE & TODO JSON (machine plan · current state verified 2026-06-12)

```json
{
  "initiative": "perspektifler-insights-rebuild",
  "spec": "brain/PERSPEKTIFLER_REBUILD_SPEC.md",
  "machine_plan_source": "brain/PERSPEKTIFLER_PLAN.json",
  "discipline": "eCyPro v3.6 — evidence-or-silence; every gate self-verified with a tool",
  "base_commit": "8af969d",
  "commit_convention": "feat(perspektifler): gate-N — <summary>",
  "resume_rule": "Boot: read PROGRESS.md + git log --oneline -10 + this JSON; resume at first phase whose gate evidence is missing. Never redo a phase with pasted gate evidence.",
  "session_protocol": {
    "preflight": ["node -v", "npm run typecheck", "npm run test -- --run", "npm run build"],
    "baseline": "record outputs; gates = no NEW failures vs baseline",
    "todo": "mirror current phase steps into TodoWrite; one in_progress item at a time",
    "context": "just-in-time partial reads; sub-agent digests <=2K tokens; compaction note in PROGRESS.md at every gate",
    "stop_condition": "stop only at a gate boundary with PROGRESS.md updated and committed"
  },
  "phases": [
    {
      "id": 0, "title": "Recon (read-only audit)", "status": "done",
      "evidence": "PROGRESS.md GATE-0: 12-bug table root-caused to file:line, benchmark matrix, content-inventory.csv (36 mdx, 108 raw tags, 21 raw cats), SCOPE.md + allowlist, PLAN.md/json"
    },
    {
      "id": 1, "title": "Taxonomy & content model", "status": "done",
      "evidence": "PROGRESS.md GATE-1: node scripts/check-taxonomy.mjs 13/13 PASS — 10 categories, 57 tags, 0 dup slugs, 100% of 108 tags mapped, 146 redirects, no chain >1 hop"
    },
    {
      "id": 2, "title": "Menu — BUG-01/02/03/04/12", "status": "done",
      "evidence": "PROGRESS.md GATE-2: vitest 27/27 PASS, typecheck 0, eslint 0; e2e/menu.spec.ts written (10 tests x 3 browsers, --list verified); Playwright run pending on owner machine",
      "carry_over": ["Run npx playwright test menu --project=chromium on owner machine and paste run", "/blog hero watermark remainder of BUG-12 handled in Phase 3"]
    },
    {
      "id": 3, "title": "Hub /perspektifler", "status": "pending",
      "role_expertise": "Information Architect + React Router/SPA engineer (faceted-navigation specialist)",
      "research_before_edit": [
        "cat src/App.tsx route table lines ~425-538 (current /blog,/insights,/perspektifler routes + line 441 reversed redirect)",
        "cat src/pages/InsightsPage.tsx + BlogPage.tsx — reusable hub pieces",
        "cat src/data/perspektifler/{taxonomy,merge-map,redirects}.json — Phase-1 outputs",
        "vercel.json redirects array (line 7)"
      ],
      "touches": ["src/App.tsx", "src/pages/InsightsPage.tsx (hub)", "src/pages/BlogPage.tsx", "vercel.json", "src/i18n/keys/insights*.ts"],
      "steps": [
        { "id": "3.1", "title": "Canonical routing + 301", "substeps": [
          "Reverse App.tsx:441 — /perspektifler becomes canonical, /blog -> /perspektifler Navigate",
          "Add EN pair /en/insights; wire vercel.json 301s incl. retired tag/category URLs from redirects.json",
          "One H1 system: 'Perspektifler' + tagline (kills BUG-06 naming drift)"
        ], "verify": "curl -sI localhost preview /blog => 301 to /perspektifler; route render test" },
        { "id": "3.2", "title": "Hero + curated layer", "substeps": [
          "1 featured lead (large) + 3 secondary editor picks above chronological stream",
          "featured flag from frontmatter (max 4 true)"
        ], "verify": "unit test: hero renders 1+3 from featured set" },
        { "id": "3.3", "title": "Search box (UI shell)", "substeps": [
          "Prominent search input, placeholder 'İçgörülerde ara…'",
          "Defer engine to Phase 5; route to /perspektifler/ara with ?q="
        ], "verify": "render + focus-ring + i18n keys exist (tr+en)" },
        { "id": "3.4", "title": "Sticky facet bar with URL state", "substeps": [
          "Facets: Kategori · Format · Konu(tag) · Yıl · Sıralama; live counts per facet",
          "Desktop: live update on select; Mobile: bottom-sheet + 'N Sonucu Göster'",
          "Zero-result facets not clickable; hide facet with <2 results at current volume",
          "ALL state in URL (shareable, refresh-safe)"
        ], "verify": "URL round-trip test: apply filters -> copy URL -> fresh context reproduces view" },
        { "id": "3.5", "title": "Card grid + Load More", "substeps": [
          "12 cards initial; 'Daha Fazla Yükle' +12; crawlable ?page=N links underneath; DOM <=48 cards",
          "Card spec: title<=60ch · excerpt 140-160ch · category chip · format icon · date · 'X dk okuma' · 16:9 lazy AVIF/WebP <=40KB · whole card link · visible focus ring",
          "Footer stays reachable (no infinite scroll)"
        ], "verify": "unit: card fields render; e2e: load-more keeps footer reachable" },
        { "id": "3.6", "title": "Topic chips + Founder Letter capsule", "substeps": [
          "Max 12 most-used tag chips + 'Tüm Konular →' page (vocab grouped under category headings)",
          "Reposition existing Founder Letter capsule after first 12 cards — keep KVKK copy, do not rebuild"
        ], "verify": "chip count <=12 asserted in test" },
        { "id": "3.7", "title": "Optional 3D/motion accent (design_mandate bounded)", "substeps": [
          "Design one hero accent (e.g. particle/line field on hub hero) honoring AI Studio Tech doctrine",
          "Lazy-load + prefers-reduced-motion static fallback + DPR cap",
          "Ship only if Lighthouse perf >=90 holds with it enabled; else cut and log decision"
        ], "verify": "Lighthouse mobile JSON with accent enabled" }
      ],
      "gate": { "cmd": "URL round-trip e2e + npm run build + Lighthouse mobile (hub) JSON", "evidence": "round-trip green, build exit 0, perf >=90 JSON attached" },
      "commit": "feat(perspektifler): gate-3 — hub /perspektifler canonical"
    },
    {
      "id": 4, "title": "Category pillar + Article template", "status": "pending",
      "role_expertise": "Content Strategist + SEO engineer (pillar-cluster / E-E-A-T specialist)",
      "research_before_edit": [
        "cat src/pages/InsightCategory.tsx + InsightArticle.tsx + BlogPostPage.tsx",
        "cat src/lib/structured-data.ts — existing schema.org helpers",
        "grep series_id/pair_id usage in content frontmatter"
      ],
      "touches": ["src/pages/InsightCategory.tsx", "src/pages/InsightArticle.tsx", "src/pages/BlogPostPage.tsx", "src/lib/structured-data.ts", "scripts/check-links.mjs"],
      "steps": [
        { "id": "4.1", "title": "Category pillar /perspektifler/kategori/<slug>", "substeps": [
          "150-300 word pillar intro per category (10x)",
          "'Buradan başlayın' 3 curated evergreen picks",
          "Chronological grid with facet bar (category pre-locked) + link up to hub"
        ], "verify": "render test on 2 categories; intro word-count script" },
        { "id": "4.2", "title": "Article template", "substeps": [
          "Breadcrumb Hub→Category→Article; meta row (chip, format, date, read time, author)",
          "Sticky TOC when >=1200 words; author box (Emre Can Yalçın)",
          "Inline Founder Letter CTA after 2nd H2; 'İlgili İçgörüler' 3 by tag-overlap (same-category fallback); series prev/next",
          "schema.org Article + BreadcrumbList via structured-data.ts"
        ], "verify": "longest + shortest article render; rich-results validation" },
        { "id": "4.3", "title": "Interlink quotas", "substeps": [
          "article→pillar always; >=3 internal links per article; pillar lists newest+curated",
          "Write scripts/check-links.mjs enforcing quotas + orphan detection"
        ], "verify": "node scripts/check-links.mjs on 20-article sample — quotas met, 0 orphans" }
      ],
      "gate": { "cmd": "node scripts/check-links.mjs", "evidence": "quotas met, 0 orphans; rich-results pass on longest+shortest" },
      "commit": "feat(perspektifler): gate-4 — pillar + article templates"
    },
    {
      "id": 5, "title": "Search engine", "status": "pending",
      "role_expertise": "Search/IR engineer (client-side index, Turkish diacritics specialist)",
      "research_before_edit": [
        "Stack check: SPA (Vite/React) => Fuse.js or MiniSearch over Pagefind (no static HTML at build) — verify with cat vite.config.ts",
        "cat src/pages/InsightSearch.tsx — existing shell",
        "Index source: src/data/blog-posts.json + taxonomy.json fields"
      ],
      "touches": ["src/pages/InsightSearch.tsx", "search index build script", "package.json (one dep max)"],
      "steps": [
        { "id": "5.1", "title": "Index build at deploy", "substeps": [
          "Fields: title+excerpt+tags+category+format+lang",
          "Diacritic-insensitive normalize ('donusum' finds 'dönüşüm') — reuse Phase-1 slugify table"
        ], "verify": "index builds in npm run build; size logged" },
        { "id": "5.2", "title": "Query + facet logic", "substeps": [
          "AND across facet types, OR within a type",
          "Zero-result state suggests categories",
          "Events: search_query + zero_result flag"
        ], "verify": "unit tests for AND/OR matrix" },
        { "id": "5.3", "title": "30-query Turkish test set", "substeps": [
          "Commit test set file; runner measures zero-result rate + p95 latency"
        ], "verify": "zero-result <5%, p95 <300ms — paste run" }
      ],
      "gate": { "cmd": "30-query TR test runner", "evidence": "zero-result <5%, p95 <300ms output pasted" },
      "commit": "feat(perspektifler): gate-5 — search"
    },
    {
      "id": 6, "title": "Quality sweep — perf / a11y / floats / SEO", "status": "pending",
      "role_expertise": "Performance engineer + WCAG 2.2 AA auditor + technical SEO",
      "research_before_edit": [
        "cat src/components/integrations/LiveChat.tsx + chat/SimpleChatWidget.tsx + common/SocialProofToast.tsx (float inventory, App.tsx mounts 1840/1845/1851)",
        "cat scripts/generate-sitemap.ts + src/components/seo/SeoManager.tsx",
        "npm run lh:audit availability (Lighthouse budget script in package.json)"
      ],
      "touches": ["src/App.tsx (float governance)", "LiveChat/SimpleChatWidget/SocialProofToast", "SeoManager.tsx", "scripts/generate-sitemap.ts", "src/i18n/canonical.ts", "src/i18n/localized-slugs.ts"],
      "steps": [
        { "id": "6.1", "title": "CWV budgets", "substeps": [
          "LCP <=2.5s (aspire 2.0s) · INP <=200ms · CLS <=0.1 mobile-throttled; hub JS <=150KB gz",
          "Menu + 3D assets non-blocking for LCP; image lazy/AVIF audit"
        ], "verify": "Lighthouse JSON hub + 1 article >=90 perf" },
        { "id": "6.2", "title": "Accessibility", "substeps": [
          "axe-core 0 critical/serious on hub/category/article/open-menu",
          "Contrast >=4.5:1 on dark+gold; prefers-reduced-motion; skip-link"
        ], "verify": "axe reports attached" },
        { "id": "6.3", "title": "Floating-widget governance (BUG-08)", "substeps": [
          "Max 2 persistent floats: chat + merged a11y/lang control",
          "Toasts -> one dismissible 'Yeni' badge on Perspektifler nav item",
          "Welcome-Back banner: returning visitors only, auto-dismiss 8s, never overlaps chat",
          "BUG-07 ghost headline: fix only if cause is global CSS layer, else OUT_OF_SCOPE.md"
        ], "verify": "viewport screenshot <=2 floats" },
        { "id": "6.4", "title": "SEO & i18n", "substeps": [
          "hreflang tr<->en via pair_id; category pages indexable; tag pages noindex,follow",
          "page/sort params canonicalized; sitemap split (hub/categories/articles); no links to zero-result facet URLs"
        ], "verify": "crawl: 0 broken internal links, 0 redirect chains >1 hop, hreflang valid" }
      ],
      "gate": { "cmd": "Lighthouse JSONs + axe + crawl run", "evidence": "perf>=90/a11y>=95, axe 0 crit/serious, crawl clean, <=2 floats screenshot" },
      "commit": "feat(perspektifler): gate-6 — quality sweep"
    },
    {
      "id": 7, "title": "End-to-end proof", "status": "pending",
      "role_expertise": "QA automation engineer (Playwright)",
      "research_before_edit": ["cat e2e/menu.spec.ts patterns + playwright.config", "npm run test:e2e:fast wiring"],
      "touches": ["e2e/e2e-perspektifler.spec.ts"],
      "steps": [
        { "id": "7.1", "title": "One scripted journey, all assertions in one spec", "substeps": [
          "clean build -> / (menu closed, no artifacts) -> open panel (<=30 insights-only) -> hub",
          "facet Kategori=yapay-zeka-teknoloji + Format=rapor -> copy URL -> fresh context reproduces",
          "Load More once (footer reachable) -> open article -> breadcrumb to pillar",
          "search 'dönüşüm' (<300ms) -> retired tag URL 301 lands correctly"
        ], "verify": "npx playwright test e2e-perspektifler — green run pasted" }
      ],
      "gate": { "cmd": "npx playwright test e2e-perspektifler", "evidence": "green run pasted (owner machine if sandbox lacks browsers)" },
      "commit": "feat(perspektifler): gate-7 — e2e proof"
    },
    {
      "id": 8, "title": "SEO & i18n hardening (optional, in scope)", "status": "pending",
      "role_expertise": "Technical SEO engineer",
      "research_before_edit": ["re-run crawl from 6.4; diff against sitemap"],
      "touches": ["src/i18n/canonical.ts", "src/i18n/localized-slugs.ts", "scripts/generate-sitemap.ts"],
      "steps": [ { "id": "8.1", "title": "Close crawl deltas", "substeps": ["fix any hreflang/canonical/sitemap finding from gate-6 crawl"], "verify": "re-crawl clean" } ],
      "gate": { "cmd": "crawler run", "evidence": "0 broken links, hreflang valid" },
      "commit": "feat(perspektifler): gate-8 — seo/i18n hardening"
    },
    {
      "id": 9, "title": "Content ops at 1,000 scale", "status": "pending",
      "role_expertise": "Content operations / editorial systems designer",
      "research_before_edit": ["Keystatic CMS featured-flag capability — cat keystatic config", "docs/ runbook conventions"],
      "touches": ["docs/ (runbook)", "CMS featured flags"],
      "steps": [ { "id": "9.1", "title": "Editorial runbook", "substeps": [
        "Featured slots (max 4) editable without deploy; evergreen/news flag",
        "Quarterly decay review (update/archive stale; merge under-used tags)",
        "Publish checklist enforcing schema fields (excerpt length, tag count, >=3 internal links)"
      ], "verify": "non-dev walkthrough recorded" } ],
      "gate": { "cmd": "walkthrough", "evidence": "non-dev publishes compliant article e2e" },
      "commit": "feat(perspektifler): gate-9 — content ops runbook"
    },
    {
      "id": 10, "title": "FINISH — PR with AC evidence", "status": "pending",
      "role_expertise": "Release engineer (verifier role — not the implementer)",
      "research_before_edit": ["assemble all gate evidence from PROGRESS.md"],
      "touches": ["PR body only"],
      "steps": [ { "id": "10.1", "title": "Open PR, do not merge", "substeps": [
        "PR 'feat(perspektifler): rebuild insights vertical' — body = AC-01..AC-12 table with evidence links + OUT_OF_SCOPE.md contents + PROGRESS.md decision log",
        "Merge = Tier-3 owner-only; agent never merges"
      ], "verify": "PR open, all 12 AC rows have evidence links" } ],
      "gate": { "cmd": "PR body review by separate verifier pass", "evidence": "12/12 AC rows evidenced" },
      "commit": "(PR only)"
    }
  ],
  "acceptance_criteria": {
    "AC-01": "menu closed-by-default + close behaviors (Playwright)",
    "AC-02": "nav artifacts gone (screenshot diff)",
    "AC-03": "panel <=30 insights-only links",
    "AC-04": "20 random slugs <=3 clicks (script)",
    "AC-05": "vocab <=60, 0 dup slugs, 100% 301 coverage",
    "AC-06": "CWV budgets met (Lighthouse JSON)",
    "AC-07": "axe 0 critical/serious",
    "AC-08": "zero-result <5%, p95 <300ms",
    "AC-09": "URL-state round-trip",
    "AC-10": "<=2 persistent floats",
    "AC-11": "hreflang+schema valid, crawl clean",
    "AC-12": "analytics events firing with baseline"
  }
}
```

---

## §6 — RESOURCE MAP (skills · brain · memory · slash · CLI · MCP — en verimli yöntem seçimi)

> Verified: `.claude/commands/` ls (26 komut), `brain/` ls, CLAUDE.md komut kataloğu, docs/WORKFLOW.md.

**Skills:** `ecypro` (doktrin — her oturum başında; tek zorunlu skill). Faz-bazlı opsiyonel:
`design:accessibility-review` (Phase 6), `engineering:code-review` (verifier pass), `engineering:testing-strategy` (Phase 7).
Belge-üretim skill'leri (docx/pptx/pdf) bu inisiyatifte GEREKSİZ — yük getirir, seçilmedi.

**brain/ (md brain):** `PERSPEKTIFLER_REBUILD_SPEC.md` (bağlayıcı spec) · `PERSPEKTIFLER_PLAN.json`
(makine planı — §5 ile senkron tutulur) · `perspektifler-audit/AUDIT.md` + `GAPS_AND_IMPROVEMENTS.md`
(bug kanıtları) · `memory.md`, `skills.md` (oturum-arası not). Yeni araştırma damıtmaları →
`brain/perspektifler-audit/` altına.

**Memory (oturumlar arası durum):** `PROGRESS.md` (tek gerçek ilerleme kaydı) + git gate-commit
geçmişi + `OUT_OF_SCOPE.md`. Anthropic harness deseni: progress file + git history = ajan hafızası.

**Slash komutları (verified, .claude/commands/):** çekirdek döngü → `/plan`, `/implement`, `/fix`,
`/typecheck`, `/lint-fix`, `/e2e-fast`, `/e2e`, `/review`, `/commit`; kalite → `/lighthouse-check`,
`/performance`, `/url-audit`, `/smoke-test`, `/publish-check`, `/secret-scan`, `/security`;
durum → `/phase-status`, `/memory-sync`; derin analiz → `/ultrathink`; acil → `/rollback`.
Bu master prompt kalıcılaştırması: içeriği `.claude/commands/perspektifler-resume.md` yap →
her oturum `/perspektifler-resume` ile boot.

**CLI (npm, verified CLAUDE.md):** `npm run dev` · `build` · `typecheck` · `test -- --run` ·
`test:e2e` / `test:e2e:fast` · `lh:audit` · `lint` / `format`. npm-only (pnpm/yarn yasak).

**MCP ihtiyaç tespiti (en verimli seçim):** Yerel build için MCP GEREKMEZ — dosya araçları + bash
+ npm yeterli (en düşük gecikme). Opsiyonel: **Chrome MCP** canlı DOM/ekran doğrulaması (gate
screenshot kanıtı, BUG repro); **Playwright** zaten repo içi. Figma/Canva/WordPress MCP'leri bu
scope'ta seçilmedi (panel tasarımı kod-içi token'larla yapılır — ek araç = ek bağlam yükü).

---

## §7 — SOURCES (research evidence base)

Anthropic resmi: [Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) ·
[Harness design for long-running apps](https://www.anthropic.com/engineering/harness-design-long-running-apps) ·
[Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) ·
[Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents) ·
[Claude Code best practices](https://code.claude.com/docs/en/best-practices) ·
[Prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices).
Web perf: [web.dev CWV thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) ·
[Google Search Central CWV](https://developers.google.com/search/docs/appearance/core-web-vitals)
(LCP 2.5s/INP 200ms/CLS 0.1 — verified; "2026'da LCP 2.0s'e çekildi" iddiası ikincil SEO
kaynaklarından, **inferred** etiketli — bağlayıcı bütçe spec'teki 2.5s, 2.0s aspirasyon).
3D/motion: [R3F performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) ·
[Codrops: efficient three.js scenes](https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/) ·
[Gatsby: three.js perf + saveData/lazy](https://www.gatsbyjs.com/blog/performance-optimization-for-three-js-web-animations/).
Repo kanıtları: `brain/PERSPEKTIFLER_REBUILD_SPEC.md`, `brain/PERSPEKTIFLER_PLAN.json`, `SCOPE.md`,
`PLAN.md`, `PROGRESS.md`, `.claude/scope-allowlist.txt`, `docs/WORKFLOW.md`, `CLAUDE.md`.

---

## §8 — KICKOFF (nasıl çalıştırılır)

```bash
cd ~/Desktop/ecypro && claude
# oturumda: istek.md §3 bloğunu yapıştır (veya /perspektifler-resume olarak kaydedilmişse onu çağır)
# ajan: Expert Role Card (Phase 3) → preflight/baseline → §5 JSON'u todo'ya yükle → gate-3'e kadar kesintisiz
```

Tek cümlelik sözleşme: **Gate kanıtı olmadan faz bitmez; PROGRESS.md + gate-commit olmadan oturum
kapanmaz; AC-01..12 dışında "bitti" yoktur; merge daima owner'da.**


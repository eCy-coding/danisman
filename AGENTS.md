<!--
THIS FILE IS AUTO-GENERATED FROM ~/.claude/CLAUDE.md
Edit the source, not this copy. Sync script: karargah-agents-sync
-->

# ROUTING  f(trigger) → skill

## Slash → Skill (önce invoke, sonra yanıt)
```
# 5-AGENT SYSTEM
/a1        → a1-coder          /a2        → a2-validator
/a3        → a3-swod           /a4        → a4-knowledge
/a5        → a5-orchestrator   /orchestrate → a5-orchestrator
/swod      → a3-swod           /validate  → a2-validator
/knowledge-update → a4-knowledge

# CORE SKILLS
/ecyskill  → ecyskill          /graphify  → graphify
/sovereign → sovereign-ops     /commit    → caveman:caveman-commit
/review    → ag-code-reviewer  /refactor  → ag-code-refactoring-refactor-clean
/simplify  → simplify          /e2e       → ag-awt-e2e-testing
/plan      → superpowers-writing-plans     /architect → ag-architect-review
/create-pr → create-pr         /changelog → changelog
/gsd       → gsd               /security-review → ag-api-security-best-practices
/frontend-design → frontend-design         /document → devops-auto-documentation
/tdd       → superpowers-test-driven-development
/brainstorm → superpowers-brainstorming      /verify → superpowers-verification-before-completion
/worktree  → superpowers-using-git-worktrees
```

## Context → Skill (eşleşirse invoke et, sonra yanıt)
```
# 5-AGENT AUTO-ROUTING
sprint|epic|yeni özellik|new feature    → a5-orchestrator
kod yaz|code this|implement|implement et → a1-coder
hata bul|validate|doğrula|test et       → a2-validator
swod|analiz|roadmap analiz|todo üret    → a3-swod
tool güncelle|skill güncelle|knowledge  → a4-knowledge
paralel kodla|parallel agents|tüm agentlar → a5-orchestrator

kapsamlı|full audit|tüm skill|ecyskill  → ecyskill
plan|mimari|roadmap|architecture         → superpowers-writing-plans + ag-architect-review
review|incele|kod gözden                 → ag-code-reviewer
refactor|temizle|yeniden yaz             → ag-code-refactoring-refactor-clean
tech debt|legacy                         → ag-code-refactoring-tech-debt
debug|bug|hata|çalışmıyor               → superpowers-systematic-debugging
kod ara|lint|typecheck|test koş|deps audit|yerel review|git diff/blame → ecydev (eCyMCP coding tools)
TDD|test yaz|test driven                 → superpowers-test-driven-development
güvenlik|security|vulnerability          → ag-api-security-best-practices
fuzzing                                  → tob-aflpp + tob-libfuzzer
sharp edges|footgun                      → tob-sharp-edges
supply chain|dependency audit            → tob-supply-chain-risk-auditor
React|Next.js|component|frontend         → jeff-react-expert
UI design|tasarım|frontend design        → frontend-design
NestJS|Express|backend API               → jeff-nestjs-expert
microservices|servis mimarisi            → jeff-microservices-architect
K8s|Kubernetes|container                 → jeff-kubernetes-specialist
SRE|observability|monitoring             → jeff-sre-engineer
RAG|vector DB|embeddings                 → jeff-rag-architect
PostgreSQL|Postgres sorgu                → ag-postgresql
Terraform|IaC                           → devops-terraform-plan-review
AWS profile                              → devops-aws-profile-management
import anthropic|Anthropic SDK           → claude-api
ileri düzey|apex|multi-domain|cross-domain   → jeff-fullstack-guardian
prompt engineering|system prompt             → jeff-prompt-engineer
API design|REST API                      → ag-api-design-principles
commit                                   → caveman:caveman-commit
PR|pull request                          → create-pr
branch bitir|feature tamamla             → superpowers-finishing-a-development-branch
code review iste                         → superpowers-requesting-code-review
code review geldi                        → superpowers-receiving-code-review
worktree|git worktree                    → superpowers-using-git-worktrees
GitHub comment|PR comment                → ag-address-github-comments
diagram|excalidraw                       → excalidraw-diagram
brainstorm|fikir|ne yapmalıyız          → superpowers-brainstorming
SQL to business|data analysis            → analytics-analysis-planning
cohort                                   → analytics-cohort-analysis
funnel                                   → analytics-funnel-analysis
A/B test                                 → analytics-ab-test-analysis
dashboard                                → analytics-dashboard-specification
veri kalitesi|data quality               → analytics-data-quality-audit
docs|README|dokümantasyon               → devops-auto-documentation
akademik|science paper                   → sci-paper-lookup
paralel|parallel agent                   → superpowers-dispatching-parallel-agents
geçmiş|önceki session|hatırlıyor musun  → supermemory-super-search
kaydet hafızaya                          → supermemory-super-save
verify|bitirmeden önce kontrol           → superpowers-verification-before-completion
plan uygula|planı uygula|execute plan    → superpowers-executing-plans
subagent ile geliştir|alt-agent sürücü   → superpowers-subagent-driven-development
skill yaz|yeni skill|skill oluştur       → superpowers-writing-skills
skill keşfet|hangi skill                 → superpowers-using-superpowers
mutation test                            → tob-mutation-testing
e2e|end-to-end                          → ag-awt-e2e-testing
webapp test|browser test                 → webapp-testing
library docs|paket kullanim|API reference → use context7 (MCP)

# LOKAL MODEL ROUTING (zero API cost, 0 token)
test yaz|write test|pytest|jest|unit test  → claude0-test (lokal)
analiz et|code analysis|debug|root cause   → claude0-analyze (lokal)
kod gözden|code review incele              → claude0-review (lokal)
araştır|search pattern|bul implementasyon  → claude0-search (lokal)
```

## Model
```
Plan/mimari/analiz → Opus 4.7 (claude-opus-4-7)
Kod/uygulama/fix   → Sonnet 4.6 (claude-sonnet-4-6)  ← şu an aktif
Çoklu bağlam       → paralel invoke
```

---

# STANDARDS

## Komuta Zinciri
```
T0  Emre           → nihai karar, mimari onay
T1  Claude Code    → plan + uygulama + kalite + orchestration
T2  Subagents      → paralel execution (Explore | Plan | general-purpose)
T3  Skills         → domain expertise (164 skill, 18 cluster)
```

## Değişmez Kurallar (İhlal = Hata)
```
1. Root cause önce     — semptom fix YASAK
2. Evidence önce       — "çalışıyor" iddiası = komutu çalıştır, çıktıyı gör
3. Tier 1 paralel      — tüm bağımsız Agent() TEK MESAJDA, T=max(T_i)
4. CRITICAL gizleme    — YASAK, her zaman ilk sıra
5. TDD sırası          — test önce, implement sonra
6. K cluster sırası    — Tier 1 bitmeden spawn etme
7. Unused code         — commit etme, sil
8. Comments            — sadece WHY non-obvious (WHAT/HOW değil)
```

## Feature Lifecycle
```
CLARIFY → PLAN → FEATURE[BUILD→REVIEW+SECURE→TEST→SHIP] → ITERATE → FINISH
```

## Kalite Kapısı (Pre-ship Zorunlu)
```
type check  ✓  lint  ✓  test suite (fresh run)  ✓  → sonra commit
```

## Output Standartları
```
Commit:   conventional  feat|fix|refactor|chore|docs|test(scope): message
PR:       PR readiness score + synthesis özeti header
Plan:     docs/plans/YYYY-MM-DD-<feature>.md
Response: caveman full | Türkçe | kod/id/commit İngilizce
```

## Agent Dispatch
```
"Explore"       → arama, statik analiz, dosya tarama
"Plan"          → mimari, system design
"general-purpose" → uygulama, diğer (varsayılan)
```

## Sub-agent Token Kurallari
```
Her agent prompt: "Reply max 200 words" veya "Bullet points only"
context >70% → /compact zorunlu (>80% → kritik)
Paralel agent sonucu: sadece summary main thread'e döner
Lokal model tercih sirasi: claude0-test > claude0-code > claude0-deep (maliyet)
```

## Context Yönetimi
```
>80% doluluk → /compact öner (otomatik çağrılamaz)
Kritik bulgu → ~/.claude/projects/.../memory/security_findings.md
Stale memory → git log / dosyaları oku, memory'ye güvenme
```

## Lang: Türkçe | kod/id/commit: İngilizce

# Claude Code — EcyPro Entegrasyon Rehberi

EcyPro Premium Consulting projesinde **Claude Code CLI**'ın kurulumu, konfigürasyonu, kullanımı ve sorun giderme rehberi.

> Claude Code zorunlu bir bağımlılık **değildir**. Proje onsuz da tüm npm/CI zinciriyle çalışır. Bu entegrasyon, Claude'u ek bir LLM cihazı olarak kullanmak isteyen geliştiriciler içindir.

---

## İçindekiler

1. [Önkoşullar](#önkoşullar)
2. [Hızlı Başlangıç](#hızlı-başlangıç)
3. [Kimlik Doğrulama](#kimlik-doğrulama)
4. [Slash Komutları](#slash-komutları)
5. [Permission Modeli](#permission-modeli)
6. [Konfigürasyon Dosyaları](#konfigürasyon-dosyaları)
7. [Sorun Giderme](#sorun-giderme)
8. [Disengage / Kaldırma](#disengage--kaldırma)
9. [SSS](#sss)

---

## Önkoşullar

| Bileşen | Sürüm | Doğrulama |
|---|---|---|
| Node.js | ≥ 22 | `node --version` |
| npm | ≥ 10 | `npm --version` |
| Platform | macOS / Linux | `uname -s` |
| `curl` veya `npm` | global | installer için |

> Windows kullanıcıları için **WSL2** önerilir (installer POSIX shell'e bağımlıdır).

---

## Hızlı Başlangıç

Tek komutla kurulum + sağlık kontrolü:

```bash
npm run claude:setup
```

Bu komut sırasıyla:

1. `scripts/install-claude-code.sh` — idempotent kurulum (zaten yüklüyse atlar).
   - Birincil: `curl -fsSL https://claude.ai/install.sh | bash`
   - Fallback: `npm install -g @anthropic-ai/claude-code`
2. `scripts/claude-doctor.sh` — sağlık kontrolü (binary, Node sürümü, auth, konfig).

Başarılı çıktıda göreceğin:

```
✓ Claude Code zaten yüklü: claude/x.y.z
✓ node v22.x.y
✓ ANTHROPIC_API_KEY ortam değişkeni mevcut (108 karakter)
✓ CLAUDE.md mevcut
✓ .claude/settings.json mevcut
✓ .claude/commands/ mevcut (7 slash komut)
✓ Her şey yolunda.
```

İlk oturumu başlat:

```bash
claude
```

---

## Kimlik Doğrulama

İki yol var; biri yeterli.

### A) Interaktif OAuth (önerilen — yerel geliştirme)

İlk `claude` komutunda otomatik açılır:

```bash
claude
# → "Authenticate via browser?" → tarayıcı açılır → Anthropic console.
```

Credentials yerel olarak saklanır: `~/.claude/credentials.json` (mode 600).

### B) API Key (CI / headless / scriptli kullanım)

```bash
# .env dosyasına ekle (gitignored):
ANTHROPIC_API_KEY="sk-..."

# veya shell rc dosyasına:
export ANTHROPIC_API_KEY="sk-..."
```

Anahtar oluşturma: <https://console.anthropic.com/settings/keys>

> `gitleaks` pre-commit hook'u API key sızıntısını otomatik yakalar (`lefthook.yml` → `secret-scan` job'u).

---

## Slash Komutları

Repo kökünde `claude` çalıştırdığında `.claude/commands/`'daki tüm slash komutlar otomatik yüklenir.

| Komut | Tetiklediği |
|---|---|
| `/lint-fix` | `npm run lint -- --fix && npm run format` |
| `/typecheck` | `npm run typecheck` (web + server) |
| `/e2e` | `npm run e2e:local` (mock + preview + playwright) |
| `/e2e-fast` | `npm run test:e2e:fast` (sanity duman) |
| `/publish-check` | lint + typecheck + test + build + e2e:fast zinciri |
| `/phase-status` | Publish phase 1-17 ilerleme raporu |
| `/secret-scan` | `npx gitleaks detect --no-banner --no-git --redact --source=.` |

### Yeni slash komut ekleme

1. `.claude/commands/<isim>.md` oluştur.
2. Frontmatter ekle:
   ```yaml
   ---
   description: Kısa açıklama (Türkçe).
   allowed-tools: Bash(npm run *), Read(**)
   ---
   ```
3. Markdown gövdesinde adımları yaz.
4. `CLAUDE.md` "Slash Komutları" tablosuna satır ekle.

---

## Permission Modeli

`.claude/settings.json` paylaşımlı (commit edilir). İki ana liste:

### `permissions.allow` — beyaz liste

- Tüm npm scripts: `Bash(npm run *)`.
- Test araçları: `Bash(npx playwright *)`, `Bash(npx vitest *)`.
- Geliştirme araçları: `Bash(npx tsx *)`, `Bash(npx tsc *)`, `Bash(npx prisma *)`.
- Kaynak edit: `Edit(src/**)`, `Edit(server/**)`, `Edit(e2e/**)`, `Edit(scripts/**)`, `Edit(docs/**)`.
- Git okuma: `Bash(git status)`, `Bash(git diff *)`, `Bash(git log *)`.

### `permissions.deny` — kara liste (Claude REDDEDER)

- Hassas dosya editleri: `.env`, `.env.local`, `*.db`, `*.sqlite`, `dev.db`.
- Migration: `prisma/migrations/**` (otomatik üretilir, manuel edit yok).
- Build artefaktları: `dist/**`, `build/**`, `playwright-report/**`, `test-results/**`.
- Yıkıcı git: `git push --force`, `git reset --hard`, `git clean -fdx`, `git commit --no-verify`.
- Yıkıcı shell: `rm -rf *`, `sudo *`, `chmod 777 *`, `kill -9 *`, `dd if=*`.
- Pipe-to-shell: `curl * | bash`, `wget * | sh`.
- Paket yöneticisi disiplini: `pnpm *`, `yarn *` (proje **npm-only**).

### Kullanıcıya özel override

```bash
cp .claude/settings.local.json.example .claude/settings.local.json
# Düzenle — bu dosya .gitignore'da, paylaşılmaz.
```

---

## Konfigürasyon Dosyaları

```
.
├── CLAUDE.md                          # Proje brief'i — Claude'un manifest'i
├── .claude/
│   ├── settings.json                  # Paylaşımlı (commit)
│   ├── settings.local.json.example    # Kullanıcı override şablonu
│   └── commands/
│       ├── lint-fix.md
│       ├── typecheck.md
│       ├── e2e.md
│       ├── e2e-fast.md
│       ├── publish-check.md
│       ├── phase-status.md
│       └── secret-scan.md
├── scripts/
│   ├── install-claude-code.sh         # Idempotent installer
│   └── claude-doctor.sh               # Sağlık kontrolü
└── .windsurf/
    ├── workflows/
    │   ├── claude-install.md
    │   ├── claude-doctor.md
    │   └── claude-publish-check.md
    └── rules/
        └── claude-code.md             # Cascade için kural
```

---

## Sorun Giderme

### "claude: command not found" sonrasında

```bash
npm run claude:install
```

Hâlâ bulunamıyorsa PATH eksik:

```bash
# ~/.zshrc veya ~/.bashrc'ye ekle:
export PATH="$HOME/.local/bin:$HOME/.claude/bin:$PATH"

# Yeni terminal aç ve doğrula:
which claude
claude --version
```

### "Authentication failed"

```bash
# Credentials sıfırla:
rm ~/.claude/credentials.json
claude   # tekrar OAuth akışı

# veya API key ile:
export ANTHROPIC_API_KEY="sk-..."
claude
```

### "Node version mismatch (< 22)"

```bash
# nvm ile:
nvm install 22
nvm use 22
nvm alias default 22

# veya volta ile:
volta install node@22
```

### Permission denied (script execute)

```bash
chmod +x scripts/install-claude-code.sh scripts/claude-doctor.sh
```

### Slash komut görünmüyor

```bash
# Repo kökünde olduğunu kontrol et:
pwd   # /Users/.../copy-of-ecypro-premium-consulting 2

# .claude/commands dizinini ve frontmatter'ı doğrula:
ls .claude/commands/
head -3 .claude/commands/*.md
```

### CI'da `npm run claude:install` çalıştırma?

**Çalıştırma.** CI üzerindeki `.github/workflows/claude-smoke.yml` sadece:
- `bash -n` syntax kontrolü
- `shellcheck` linting
- `.claude/settings.json` JSON validation
- Slash command frontmatter validation

CI'da binary install network/güvenlik riski; geliştirici makinesinde çalıştırılır.

---

## Disengage / Kaldırma

```bash
# 1. Claude oturumunu kapat
claude logout

# 2. Yerel credentials temizle
rm -rf ~/.claude

# 3. CLI'ı kaldır
# Native install ise:
rm $(which claude)
# npm global ise:
npm uninstall -g @anthropic-ai/claude-code

# 4. (Opsiyonel) Proje konfigini temizle
rm -rf .claude CLAUDE.md
# package.json'dan claude:* scriptlerini sil.
```

---

## SSS

**S: Bu entegrasyon mevcut Cursor / Windsurf / Zed kullanımımı etkiler mi?**
H: Hayır. `.claude/` dizini sadece Claude Code CLI tarafından okunur. Diğer editörler dokunulmaz.

**S: `pnpm` kullanabilir miyim?**
H: Hayır. Proje npm-only (`pnpm-lock.yaml` `.gitignore`'da). `.claude/settings.json` `pnpm *` komutunu deny eder.

**S: API maliyeti?**
H: OAuth ile Pro / Max abonelik kotası kullanılır. API key ile token başına ücret. Detay: <https://www.anthropic.com/pricing>.

**S: Offline çalışır mı?**
H: Hayır. Claude Code her sorgu için Anthropic API'sına bağlanır. Offline çalışman gerekiyorsa Cascade (Windsurf) doğrudan kullan.

**S: Lefthook + gitleaks zinciri Claude ile çakışır mı?**
H: Hayır. Claude commit yaparken pre-commit hook'lar yine çalışır. Eğer fail ederse Claude commit'i atmaz.

**S: Üretim build'ine etkisi?**
H: Sıfır. `.claude/`, `CLAUDE.md`, install scriptleri `.dockerignore`'da; image'a sızdırılmaz.

---

## Kaynaklar

- Resmî docs: <https://docs.claude.com/en/docs/claude-code>
- API key: <https://console.anthropic.com/settings/keys>
- GitHub: <https://github.com/anthropics/claude-code>
- Slash command kütüphanesi: `.claude/commands/` (bu repo)

---

**Son güncelleme:** Phase 21 — Claude Code entegrasyonu.

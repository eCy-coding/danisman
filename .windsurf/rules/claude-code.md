---
trigger: always_on
description: Claude Code CLI projeye dahil — Cascade kullanım kuralları
---

# Claude Code Entegrasyon Kuralları (EcyPro)

Bu proje **Claude Code CLI** ile birlikte çalışacak şekilde yapılandırılmıştır. Cascade her oturumda bu kuralları uygular.

## Altın Kurallar

1. **Wrapper script kullan** — Claude Code'u çalıştırmak için `npm run claude:install` ve `npm run claude:doctor` komutlarını kullan. **Asla doğrudan `curl … | bash` çağırma** (CI/IDE oturumlarında network/auth riski).

2. **CLAUDE.md kanonik** — Proje brief'i, komut kataloğu ve kod stili `CLAUDE.md`'de yaşar. Yeni komut/standart eklenirse hem `package.json` scripts bloğuna hem de `CLAUDE.md`'ye yansıt.

3. **`.claude/settings.json` paylaşımlı, değişiklik commit edilir.** `.claude/settings.local.json` kullanıcıya özel, gitignored. Permission allow/deny listesini değiştirirken kullanıcıyı bilgilendir.

4. **Slash komutları `.claude/commands/`'da yaşar.** Yeni slash komut eklerken:
   - YAML frontmatter (`description`, `allowed-tools`).
   - Türkçe açıklama.
   - `CLAUDE.md` "Slash Komutları" tablosuna ekle.

5. **API key sızıntısı** — `ANTHROPIC_API_KEY` env üzerinden okunur. `.env.example`'da placeholder var, `.env` gitignored. `gitleaks` pre-commit'te yakalar.

## Yasak Eylemler (Cascade Reddeder)

- `.env`, `.env.local`, `.env.production`, `*.db` dosyalarını **edit etme** (settings.json deny).
- `pnpm`, `yarn` komutu çalıştırma — proje **npm-only** (`pnpm-lock.yaml` `.gitignore`'da).
- `git push --force`, `git reset --hard`, `git clean -fdx`, `git commit --no-verify` — Lefthook + doktrin reddeder.
- `prisma/migrations/**` doğrudan edit — migration `db:push`/`migrate dev` ile üretilir.
- `dist/`, `node_modules/`, `playwright-report/`, `test-results/` doğrudan değişiklik.

## İletişim Disiplini

- **Türkçe** — kullanıcıya yanıt + commit mesajları.
- **İngilizce** — kod, log varsayılanları.
- Yeni feature → önce test (Vitest unit veya Playwright E2E).

## Workflow Kısayolları

- `/claude-install` — CLI kur (idempotent).
- `/claude-doctor` — sağlık kontrolü.
- `/claude-publish-check` — lint + typecheck + test + build + e2e:fast.

## Hata Toleransı

Eğer Claude Code yüklü değilse, Cascade **kendi araçlarıyla** (read_file, edit, run_command vb.) görevi sürdürür. Claude Code zorunlu bir bağımlılık değil — proje onsuz da işler. Sadece kullanıcı ek bir LLM cihazı olarak Claude'u tercih ederse devreye girer.

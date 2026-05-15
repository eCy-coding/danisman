---
description: Interactive rollback flow — restore public_html from backup, revert git to last published tag, draft incident report
argument-hint: "[--scope public_html|git|both] [--tag vX.Y.Z]"
model: claude-opus-4-6
allowed-tools: Read, Edit, Bash, Glob
---

# /rollback

`devops-publisher` ajanı yönetir; risk averse, kullanıcı onayı her irreversible aksiyona şart.

## Options

### 1) Restore public_html (file system)
```bash
LATEST_BAK=$(ls -t backups/public_html-pre-publish-*.zip | head -1)
echo "Latest backup: $LATEST_BAK"
unzip -l "$LATEST_BAK" | head -20
# Upload via:
#   a) Hostinger File Manager (drag zip → Extract here)
#   b) SSH/SCP if .env.deploy is set: scp $LATEST_BAK user@host:~/ + ssh + unzip
```

### 2) Revert git to last published tag (read-only restore)
```bash
git tag --list 'v*-publish' | tail -3
read -p "Tag to revert to: " TAG
git checkout "$TAG" -- src/ public/ dist/   # SAFE: no reset --hard, no force-push
```

### 3) DNS rollback
- Yalnızca **kullanıcı** Hostinger panel'de yapar.
- `outputs/dns-snapshot-<date>.txt` (varsa) önceki NS/A kayıtlarını içerir.
- Adım: panel → DNS Zone Editor → eski A/CNAME değerlerini geri yaz.

### 4) Incident report
```bash
# Pull last 50 Sentry errors (host)
npx @sentry/cli events list --org ecypro --project frontend --limit 50 \
  > outputs/incident-$(date +%F).txt
# Plus: outputs/post-mortem-<date>.md (manuel review)
```

## Kısıtlar

| Kural | Gerekçe |
|---|---|
| `git reset --hard` YOK | Tarihçe kaybı; sadece checkout per-path. |
| `git push --force` YOK | Diğer ortamlarda data loss. |
| `rm -rf public_html` YOK | Önce backup, sonra File Manager replace. |
| Backup'sız rollback YOK | İrtibat yedek zinciri kopmamalı. |
| Kullanıcı onayı olmadan DNS değişikliği YOK | Panelde kullanıcı yapar. |

## Çıktı

```
outputs/rollback-<date>.log
outputs/post-mortem-<date>.md (sonra elle doldur)
outputs/incident-<date>.txt   (Sentry export, varsa)
```

`orchestrator` ajanı rollback sonrası retro yapar ve master prompt'a "lesson learned" satırı ekler.

## Eskalasyon

Şu durumda DUR ve kullanıcıya derhal bildir:
- Backup dosyası bozuk veya açılmıyor.
- DNS kayıtları hiç yedek yok (önce snapshot, sonra deploy doktrini ihlal).
- Sentry'de 30 dakika içinde > 100 yeni hata (production outage).

---
description: gitleaks ile çalışma ağacında secret taraması (working tree only).
allowed-tools: Bash(npx gitleaks *), Read(**)
---

# /secret-scan

`npx gitleaks detect --no-banner --no-git --redact --source=.` çalıştır.

- `--no-git`: git history yerine sadece working tree.
- `--redact`: bulunan secret'ı redact ederek göster.

Sonuç:
- ✓ Clean → "Working tree temiz." mesajı.
- ✗ Bulundu → her finding için:
  - dosya yolu + satır
  - rule ID (örn. `aws-access-token`, `generic-api-key`)
  - redact'lı önizleme
  - öneri: `.env` taşıma, `.gitignore` ekleme, key rotate.

**Düzeltmeyi otomatik yapma**. Kullanıcıya bildir.

İpucu: pre-commit zaten Lefthook üzerinden gitleaks çalıştırıyor (`lefthook.yml` `secret-scan` job'u).

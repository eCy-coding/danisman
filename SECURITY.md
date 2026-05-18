# Security Policy — EcyPro Premium Consulting

## Supported versions

Live production: `main` branch. Hot-patches via tagged releases (`vYYYY.MM.DD`).
Geçmiş release'ler: yalnızca son 90 gün desteklenir; öncesi için public disclosure tercih edilir.

## Reporting a vulnerability

Bir güvenlik açığı bulduysanız **public issue açmayın**. Bunun yerine:

- **E-posta:** `security@ecypro.com` (PGP key isteğe bağlı)
- **`.well-known/security.txt`:** [https://www.ecypro.com/.well-known/security.txt](https://www.ecypro.com/.well-known/security.txt)

Raporunuzu aldıktan sonra:

1. 24 saat içinde teslim alındı bildirimi gönderilir.
2. 72 saat içinde ilk triage + severity tahmini paylaşılır.
3. 30 gün içinde fix + coordinated disclosure planı oluşturulur. Critical bulgular için pencere 7 gün'dür.
4. Onaylı raporlara `https://ecypro.com/security/acknowledgments` sayfasında atıf yapılır (anonim tercih edilebilir).

## Scope

**In-scope hedefler:**
- `https://www.ecypro.com` — production frontend
- `https://api.ecypro.com` — production backend API
- `https://admin.ecypro.com` (varsa) — admin paneli
- npm paket bağımlılıklarındaki vulnerable versiyonlar

**Out-of-scope:**
- Üçüncü taraf servisler (Vercel, Render, Neon, Upstash, Resend, Sentry, GA4) — direkt sağlayıcıya rapor edin
- Sosyal mühendislik (phishing, vishing, premise breach)
- DoS / DDoS volumetric saldırılar
- DNS amplifikasyonu (operatör seviyesi)
- Self-XSS / clickjacking (önlemler aktif: CSP + X-Frame-Options)

## Severity

[CVSS 3.1](https://www.first.org/cvss/calculator/3.1) baz alınır. Genel sınıflandırma:

| Severity | CVSS | SLA fix |
|---|---|---|
| Critical | 9.0-10.0 | 7 gün |
| High | 7.0-8.9 | 30 gün |
| Medium | 4.0-6.9 | 60 gün |
| Low | 0.1-3.9 | 90 gün |

## Önerdiğimiz raporlama formatı

```
Başlık: [SEV-X] kısa açıklama
Affected URL/endpoint: ...
Reproduction steps: ...
Impact: hangi veri / işlev etkileniyor
Mitigations: önerilen düzeltme (isteğe bağlı)
Proof of concept: ekran görüntüsü / curl / video
```

## Güvenlik kontrolleri (mevcut)

- HTTPS only (HSTS preload eligible)
- CSP header (Helmet middleware)
- CORS allowlist (`CORS_ORIGIN` env zorunlu)
- Rate limiting (per-IP, per-endpoint)
- JWT + bcrypt + refresh token rotation
- TOTP 2FA admin login
- KVKK/GDPR compliance: consent banner, double opt-in, right-to-erasure, GDPR export queue
- Audit log (tüm admin işlemleri `AuditLog` tablosuna)
- Sentry error monitoring (frontend + backend)
- Gitleaks pre-commit (secret leak guard)
- Dependabot bağımlılık takibi

## Ödüllendirme

Şu an formal bug bounty programı yok. **Critical & High** severity bulgular için takdir teşekkürü + (varsa) maddi katkı görüşülür. Düşük severity için açık atıf + thank-you note.

## Disclosure tercihi

Coordinated disclosure (responsible disclosure) tercih ederiz. Eğer kamu sağlığına / kullanıcı güvenliğine acil bir tehdit görüyorsanız `security@ecypro.com`'a yazın; pencere kısaltılabilir.

---
name: 🐛 Bug Report
about: Production veya staging'de gözlemlenen davranış sapması
title: "[bug] <kısa özet>"
labels: ["bug", "triage"]
assignees: ["emrecnyngmail.com"]
---

<!--
Adoption path: .github/ISSUE_TEMPLATE/bug-report.md
Authority: launch-readiness/launch-day-playbook-T0.md incident triage akışı
KVKK uyarısı: Bu issue PUBLIC. E-posta / TC kimlik / telefon / IP YAZMA. Sentry event ID, kullanıcı UUID veya hash kullan.
-->

## Özet

<!-- Tek cümle: ne bekleniyordu, ne oldu. -->

## Ortam

- Tarayıcı / OS:
- URL (path-only):
- Build / sha:
- Tarih + saat (TR):

## Tekrar üretim

1.
2.
3.

## Gözlenen davranış

<!-- Net olarak. PII yok. -->

## Beklenen davranış

## Severity

- [ ] P0 — production down / KVKK ihlali / data leak
- [ ] P1 — kritik akış bozuk, workaround yok
- [ ] P2 — bozuk akış, workaround var
- [ ] P3 — kozmetik / nice-to-have

## Kanıt zinciri

- Sentry event ID:
- PostHog session ID (hash):
- Better Stack incident link:
- Ekran görüntüsü (PII redacted):

## Etki yüzeyi

- [ ] Frontend (Vercel)
- [ ] Backend (Render)
- [ ] DB (Prisma migrate)
- [ ] 3rd party (Resend / Calendly / Notion / Cloudflare)
- [ ] CI/CD

## Cross-link

- launch-readiness/observability/:
- protocols/:

## Geçici workaround

<!-- Varsa. -->

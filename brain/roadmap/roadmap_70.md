# Roadmap 70 — PHASE 37: Booking + Calendar Production

**Tier:** 2 (YÜKSEK) · **Skor:** 3.6 · **Süre:** 1 hafta · **Todo:** T61-T70

**Stratejik Hedef:** Booking flow production-ready. Gerçek takvim, gerçek email, gerçek reminder. Manual müdahale sıfır.

**Mevcut Durum (talep4+6):** `BookingModal.tsx` 3-step + `/admin/bookings` CRUD. Real calendar integration eksik (Calendly/Cal.com).

---

## ✅ P37-T01 (T61): Cal.com Open Source Entegrasyonu

- **NEDEN:** Mevcut BookingModal manuel (mock slot). Cal.com real scheduling (timezone, conflict detection, Google/Outlook sync). Calendly alternatif — ama Cal.com open-source + self-host option + generous free tier.
- **ÖNEM:** P0 — Booking conversion flow'un production backbone'u.
- **YÖNTEM:** Cal.com cloud free: `cal.com/emre` account → event type (30dk "Intro Call"). 2 entegrasyon modeli: (a) **Embed** — `<Cal />` iframe widget (en hızlı). (b) **API** — Cal.com API key ile custom UI (mevcut BookingModal'a bağla). Tercih: API model (brand consistency). `/api/bookings/slots?date=...` proxy Cal.com API.
- **TEST:** BookingModal step 1 → takvim Cal.com real availability çekiyor. Step 2-3 form + submit → Cal.com'a booking POST + DB'ye Booking kaydı. Cal.com dashboard'da meeting görünür.

## ✅ P37-T02 (T62): Email Confirmation (Resend.com)

- **NEDEN:** Booking confirm edildikten sonra user'a email confirmation göndermek şart. Resend.com developer-friendly, ücretsiz tier 100 email/gün + 3000/ay.
- **ÖNEM:** P0 — User experience + booking no-show reduction.
- **YÖNTEM:** resend.com → API key → `.env` `RESEND_API_KEY`. `resend` npm package. `server/lib/email.ts`: `sendBookingConfirmation({to, bookingDetails, icsAttachment})`. React Email templates (`@react-email/components`) → HTML email responsive. Booking create sonrası async job (Bull queue veya simple promise).
- **TEST:** Booking submit → inbox 1-2 saniyede email. HTML render mobile + desktop düzgün. Attachment .ics file (T63).

## ✅ P37-T03 (T63): ICS Calendar Attachment

- **NEDEN:** Email'deki "Add to Calendar" link'i user'ın calendar'ına (Google/Apple/Outlook) meeting'i otomatik ekler. `.ics` RFC 5545 standart.
- **ÖNEM:** P1 — User experience. Manual calendar add step elimination.
- **YÖNTEM:** `ics` npm package → `createEvent({title, start, duration, location, organizer, attendees})` → ICS buffer → Resend email attachment. Additional: "Add to Google Calendar" direct link (URL param encoded).
- **TEST:** Email attachment `meeting.ics` → Apple Calendar/Google Calendar import → meeting görünür doğru time + attendees. "Add to Google Calendar" link → calendar.google.com/event/new pre-filled.

## ✅ P37-T04 (T64): Reminder Emails (24h + 1h before)

- **NEDEN:** Booking no-show industry avg %15-20. Reminder email no-show'u %50 azaltır (Calendly data).
- **ÖNEM:** P1 — Revenue impact (booking tamamlanma oranı).
- **YÖNTEM:** Cron job `server/jobs/booking-reminders.ts` (`node-cron` veya `@vercel/cron`). Her saat: DB query upcoming bookings 24±1h + 1h±15min. Resend mail. `Booking` model: `reminder24hSent: Boolean`, `reminder1hSent: Boolean` flag (duplicate prevention).
- **TEST:** Test booking T+25h sonrasına aç → 24h marker + cron tick → email gönderildi flag True. 1h marker aynı şekilde.

## ✅ P37-T05 (T65): Reschedule / Cancel Flow

- **NEDEN:** User'ın meeting'i iptal/reschedule edebilmesi şart. Email'de "Reschedule" / "Cancel" link.
- **ÖNEM:** P1 — UX + operational. Otherwise email tennis.
- **YÖNTEM:** Booking confirmation email: signed URL `https://ecypro.com/booking/manage/{booking-id}?token={hmac}`. Public page (no login required, token gate). "Reschedule" → new slot picker (Cal.com API re-fetch). "Cancel" → confirmation → Cal.com DELETE API + DB status UPDATE. Cancel notification email to admin.
- **TEST:** Email "Cancel" link click → token-gated page → confirm → Cal.com'da deleted + admin mail alır. Reschedule → new time pick → Cal.com update + user'a updated confirmation email.

## ✅ P37-T06 (T66): Available Slots Calendar Widget

- **NEDEN:** Step 1 takvim UX Cal.com kadar polished olmalı. Month view, timezone aware, unavailable slots gray.
- **ÖNEM:** P2 — UX enhancement.
- **YÖNTEM:** `react-day-picker` veya custom (Cal.com uses own). Month navigation, today highlight, past dates disabled, unavailable dates gray. Cal.com API call `/api/availability?month=YYYY-MM` → available days. Click day → right panel time slots (30min interval).
- **TEST:** Modal open → current month, next month switchable. Weekend/past dates disabled. Cal.com'da slot dolu ise UI'da gray.

## ✅ P37-T07 (T67): Time-Zone Aware Booking

- **NEDEN:** Remote consulting → global audience. User UTC+3 Türkiye, Emre de. Ama EU/US user'lar da. Timezone conversion hatalı ise booking confusion.
- **ÖNEM:** P1 — Internationalization readiness.
- **YÖNTEM:** `Intl.DateTimeFormat` + `date-fns-tz` npm. User browser timezone detect → UI timezone label. Fixed display: "15:00 Istanbul (your timezone: 08:00 New York)". Booking DB UTC save. Cal.com API UTC convention. Email time user timezone localized.
- **TEST:** Chrome DevTools sensors → timezone NY → BookingModal "08:00 EDT". İstanbul'a çevir → "15:00 TRT". Aynı DB booking, farklı display.

## ✅ P37-T08 (T68): Cal.com Webhook → DB Sync

- **NEDEN:** User Cal.com'dan direkt reschedule/cancel ederse backend bilmeli. Webhook senkronizasyon.
- **ÖNEM:** P1 — Data integrity.
- **YÖNTEM:** Cal.com dashboard → Webhooks → URL `https://ecypro.com/api/webhooks/cal` + events (`BOOKING_CREATED`, `BOOKING_RESCHEDULED`, `BOOKING_CANCELLED`). HMAC signature verify. `server/routes/webhooks.ts` → event handler → DB upsert.
- **TEST:** Cal.com'da manual booking cancel → webhook POST → DB Booking status CANCELLED 1-2 sn içinde. Admin panel `/admin/bookings` refresh → status updated.

## ✅ P37-T09 (T69): Booking Analytics Report

- **NEDEN:** Haftalık/aylık booking metrikleri: total, confirmed, completed, no-show, cancel rate. Trend analysis.
- **ÖNEM:** P2 — Business intelligence.
- **YÖNTEM:** `/admin/analytics/bookings` view (AdminAnalyticsPage içinde tab): Recharts line chart (weekly bookings), pie chart (status dist), bar chart (by service). SQL aggregation `Booking` table. Export CSV.
- **TEST:** Admin bookings analytics → 4 chart mevcut + data doğru. Dönemsel filter (last 7/30/90d).

## ✅ P37-T10 (T70): Post-Booking Feedback (NPS)

- **NEDEN:** Meeting sonrası user feedback = product improvement. Net Promoter Score 0-10 single question.
- **ÖNEM:** P2 — Service quality measurement.
- **YÖNTEM:** Cron job: meeting end time + 1h → feedback email (tek link, single-page rate UI). `/feedback/{booking-id}?token=...` → 0-10 slider + optional comment. DB `BookingFeedback` model. Admin dashboard NPS score.
- **TEST:** Test booking past → 1h sonra feedback email → 9 submit → DB record. Admin dashboard'da NPS widget (promoters/detractors).

---

## Phase 37 Kapatma Kriterleri

- [x] 10/10 todo `✅`
- [x] Cal.com API entegrasyon canlı
- [x] Resend.com email confirmation
- [x] ICS attachment calendar-compatible
- [x] Reminder emails 24h + 1h cron
- [x] Reschedule/Cancel email-gated flow
- [x] Calendar widget polished
- [x] Timezone-aware booking display
- [x] Cal.com webhook DB sync
- [x] Booking analytics admin dashboard
- [x] Post-booking NPS feedback flow
- [x] Tag: `git tag phase-37-closed`

**Bir Sonraki:** `roadmap_80.md` — Phase 38 Backlink + Authority (Tier 3).

**Tier 2 TAMAMLANDI** — Conversion + Security + Admin + Booking production-grade.

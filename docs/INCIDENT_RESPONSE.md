# EcyPro — Incident Response

**Owner:** operasyon
**Son güncelleme:** 16 Mayıs 2026 (P11)
**Eşlik:** [PRODUCTION_RUNBOOK.md](./PRODUCTION_RUNBOOK.md)

---

## 1) Severity tiers

| Tier | Tanım | Reaction time | Communication |
|---|---|---|---|
| **P0** | Tüm trafik etkilenir; site/API down veya veri kaybı riski | <15 dk | Tüm kanallar; sosyal medya status update |
| **P1** | Ana akış kırık (form, login, ödeme); part of users etkilenir | <30 dk | Status page + email customer notification |
| **P2** | Kısmi bozulma (bir route, analytics drop) | <2 saat | Status page update |
| **P3** | UX/cosmetic defect; veri/akış etkilenmiyor | <24 saat | Backlog'a ekle |

---

## 2) P0 — All-hands procedure

### Tetikleyiciler
- Site (`www.ecypro.com`) 5xx >30 saniye sürekli
- API (`api.ecypro.com/api/health`) 5xx veya unreachable
- Database connection failures sürekli
- Public auth bypass / secret leak şüphesi

### Adım adım

1. **Acknowledge (0-1 dk):** Telegram bot'a veya owner phone'a "P0 ack" yaz; saatini outputs/incidents/<date>.md log'una düşür.

2. **Status page (1-3 dk):** Eğer status page (`https://www.ecypro.com/status`) ayrı bir sayfa ise: "Investigating elevated error rates" güncelle. Yoksa: ana sayfa banner ekle.

3. **Triage (3-10 dk):**
   - PRODUCTION_RUNBOOK.md §3'teki alarm tipine git.
   - "Son 30 dakikada deploy var mı?" → varsa rollback öncelik.

4. **Rollback (10-15 dk) — eğer son deploy suçlu:**
   - **Backend (Render):** Dashboard → Service → Deploys → previous successful → "Rollback to this deploy". DB migration ile gelen değişiklik varsa rollback DB'yi etkilemeyebilir; manuel revert gerekli.
   - **Frontend (Hostinger):** Daha karmaşık — `git revert <sha> && git push && ./DEPLOY_NOW.command`. Hızlı yol: Cloudflare cache invalidate (sayfa cache'lenmediyse etkisi yok).

5. **Mitigation (15-30 dk):**
   - Hotfix branch: `git checkout -b hotfix/<short-desc>`
   - Minimal change, test, smoke
   - Force-merge to main: **HAYIR. PR + 2 göz.** Tek kişilik durumda: tek başınıza commit edip push, sonra istemli post-incident review.

6. **Recovery doğrulama (30-45 dk):**
   - `node scripts/integration-health.mjs --probe` → tüm PASS
   - Tarayıcıda manuel: landing, services, contact form, login
   - Sentry: yeni issue yok mu (5 dk pencere)
   - GA4 realtime: trafik geri döndü mü

7. **All-clear (45 dk):** Status page → "Resolved. Incident report to follow within 24h".

8. **Post-mortem (24 saat içinde):** `outputs/incidents/<date>-<slug>.md`:
   - **Detection:** Ne zaman, nasıl fark edildi?
   - **Timeline:** ack → triage → mitigation → recovery
   - **Root cause:** Teknik açıklama
   - **Impact:** Kaç kullanıcı, kaç dakika
   - **Action items:** Tekrar olmasın diye ne yapacağız
   - **Lessons learned:** Süreçle ilgili

---

## 3) P1 — Customer impact

### Tetikleyiciler
- Login akışı bozuk
- Contact form submit etmiyor
- Tek bir kritik route (services, pricing) render olmuyor
- Telegram bot down → notification akışı kesik

### Adım adım

1. Ack (0-5 dk)
2. RUNBOOK §3'e git
3. Etkilenen route için Sentry filter, kullanıcı sayısını öğren
4. Hotfix veya rollback (60 dk içinde)
5. Email/notification customer'lara: "Geçici aksaklık, çözüldü" (kişisel veri toplayan formlarda KVKK gereksinimleri uygulanır)
6. Post-mortem 48 saat içinde

---

## 4) P2 — Partial degradation

### Tetikleyiciler
- Analytics drop %20+
- 1 sayfa 4xx (404/410) artıyor
- Search/filter performance düşüşü
- Mobile layout regressionu

### Adım adım

1. Ack 2 saat içinde
2. Triage + fix branch
3. PR + merge + deploy (sıradaki release döngüsünde)
4. Post-mortem opsiyonel (P12+ rituel formal)

---

## 5) Communication templates

### Status page — investigating

```
🔴 [HH:MM TRT] Investigating elevated error rates on services.
We are currently experiencing higher-than-normal error rates and are
investigating. We'll update this page within 15 minutes.
```

### Status page — identified

```
🟡 [HH:MM TRT] Root cause identified — rolling back.
We've identified a recent backend deployment as the cause and are
rolling back. Service should restore within ~10 minutes.
```

### Status page — resolved

```
🟢 [HH:MM TRT] All services restored.
Affected: ~XX% of users between HH:MM and HH:MM.
A post-incident report will be published within 24 hours.
```

### Customer email (P1)

```
Subject: [EcyPro] Brief service disruption — [date]

Merhaba,

[HH:MM TRT - HH:MM TRT] arasında EcyPro hizmetlerinde geçici bir aksama
yaşandı. Sorun tespit edildi ve giderildi.

Eğer bu süre içinde başarısız bir [form / login / ...] denemesi yaşadıysanız,
lütfen tekrar deneyin. Detaylar için: [status URL]

Yaşanan zorluk için özür dileriz.

EcyPro Ekibi
```

---

## 6) On-call rotation (1 kişilik şirket bile olsa)

| Hafta | On-call | Backup |
|---|---|---|
| Her hafta | owner | — |

1 kişilik durumda "on-call" demek pratikte 7/24. Tatil/uzun seyahat planı:
- Tatilden 2 hafta önce: Sentry alert email rerouting'i devre dışı bırak / read-only mode duyur
- Status page: "Reduced support during DD-DD" banner

P12+ adayı: 2. kişiye onboarding, on-call rotation real.

---

## 7) Decision tree — "rollback mı, forward fix mi?"

```
Yeni deploy <30 dk?
├── Evet → Rollback (Render UI, 2 dk)
└── Hayır → Bug eski mi?
            ├── Evet, kullanıcılar şikayet etmiyordu, biz şimdi yakaladık → forward fix
            └── Hayır, yeni regression → bisect (`git bisect`) + hotfix
```

---

## 8) Post-incident review checklist

- [ ] Timeline tüm zaman damgalarıyla yazıldı
- [ ] Root cause net (5 Why analizi)
- [ ] Action items ataması yapıldı (kim, ne, ne zamana kadar)
- [ ] Aynı kategori için izleme/alert eklendi
- [ ] Runbook güncellendi (yeni alarm tipi/yeni runbook satırı)
- [ ] Doc deeplink'leri (Sentry issue, Render deploy, GitHub commit) eklendi
- [ ] Kullanıcı iletişimi yapıldı (eğer >P2 ise)
- [ ] outputs/incidents/<date>.md commit edildi

---

## 9) Quarterly drill

Her 3 ayda bir yapay incident senaryosu:

| Tatbikat | Senaryo | Süre |
|---|---|---|
| Q1 | Backend rollback | 30 dk |
| Q2 | Hostinger SPA redeploy | 30 dk |
| Q3 | Postgres restore (snapshot'tan) | 1 saat |
| Q4 | Full-site outage simulation | 2 saat |

Sonuçlar `outputs/drills/<date>.md`'ye yazılır.

---

## 10) Notlar

- Doktrin gereği force-push, hard-reset YOK (Lefthook + commit hooks).
- Acil durumlarda bile **commit history bütünlüğü** korunur. Hotfix commit'leri Conventional Commits formatında atılır.
- `git revert` tercih edilir (history bozmaz); `git reset` sadece local'de + push edilmemişse.

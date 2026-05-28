# Roadmap 60 — PHASE 36: Admin Panel + CMS Completion

**Tier:** 2 (YÜKSEK) · **Skor:** 4.2 · **Süre:** 1-2 hafta · **Todo:** T51-T60

**Stratejik Hedef:** Admin panel full operational — içerik yönetimi, kullanıcı yönetimi, analytics, audit log, her şey tek dashboard'dan.

**Mevcut Durum (talep6):** AdminDashboard + AdminBookings + AdminServices tamam. AdminBlog, AdminAnalytics, AdminSettings "route var, içerik Phase 31".

---

## ⬜ P36-T01 (T51): AdminBlogPage (MDX List + Inline Editor)

- **NEDEN:** Blog ana SEO trafik kaynağı (P32-T05/T10). Admin'in dev deploy olmadan blog post ekleyip düzenleyebilmesi kritik operasyonel gereklilik.
- **ÖNEM:** P1 — Content velocity. Her deploy için DevOps çağırmak sürdürülemez.
- **YÖNTEM:** `src/pages/admin/AdminBlogPage.tsx`: `src/content/blog/` MDX dosyalarını liste (Vite dynamic import). Her satır: title, date, status (draft/published), excerpt. "New Post" → MDX editor (`@uiw/react-md-editor` veya `@mdxeditor/editor` — MDX native). Save → backend `POST /api/admin/blog` → filesystem write + `gen:blog` trigger + `indexnow:push`. Draft/Publish toggle.
- **TEST:** Admin → /admin/blog → 8 post listesi + "New Post" button. Yeni post yaz → save → 2 saniye içinde `/blog` sayfasında görünür (cache invalidate). GSC URL Inspection → yeni post discover edilir 1-2 gün içinde.

## ✅ P36-T02 (T52): AdminAnalyticsPage (SSE Real-Time Dashboard)

- **NEDEN:** Ana operasyonel pano. Gerçek zamanlı trafik, conversion, funnel görünümü. GA4'e dönmek yerine tek yerden.
- **ÖNEM:** P1 — Operasyonel awareness.
- **YÖNTEM:** `src/pages/admin/AdminAnalyticsPage.tsx`: SSE `/api/sse/analytics` → real-time event stream. Widgets: (a) Active users (last 5min), (b) Today's conversions, (c) Top pages last 1h (Recharts bar), (d) Funnel completion rate (Recharts funnel). GA4 Data API entegrasyon (backend) historical data için. `@google-analytics/data` npm.
- **TEST:** Admin → /admin/analytics → 5 widget canlı data. Yeni conversion submit → dashboard 1-2 saniyede counter +1.

## ⬜ P36-T03 (T53): AdminSettingsPage (Site Config + Env)

- **NEDEN:** Site-level config (GA4 ID, SEO defaults, maintenance mode) kod değişikliği olmadan UI'dan yönetilebilmeli.
- **ÖNEM:** P1 — Operasyonel flexibility.
- **YÖNTEM:** `SiteConfig` Prisma model: key-value + type. `/admin/settings` → form tabs: (a) SEO (default meta title suffix, OG image), (b) Analytics (GA4 ID — env override aware), (c) Email (from address, Resend API key — masked), (d) Feature flags (maintenance mode, signup enabled), (e) Integrations (Calendly URL, Sentry DSN). Save → DB upsert + memory cache invalidate.
- **TEST:** Admin SEO → OG image URL değiştir → save → `/` sayfa meta `og:image` güncel. Maintenance mode toggle → public site 503 banner.

## ⬜ P36-T04 (T54): AdminUsersPage (RBAC Management)

- **NEDEN:** User roles (USER/CLIENT/CONSULTANT/ADMIN/PREMIUM) var ama UI'dan yönetilemiyor. Sadece DB query ile.
- **ÖNEM:** P1 — Operasyonel RBAC yönetimi.
- **YÖNTEM:** `/admin/users` → User list (search + pagination) + filter (role). Row click → detail panel: role dropdown (change), isActive toggle, last login, booking count. `PATCH /api/admin/users/:id/role` → RBAC middleware ADMIN-only. Audit log (P36-T07) kaydeder.
- **TEST:** Admin user list → search "emre" → result. Role CLIENT → CONSULTANT → save. DB güncel + kullanıcı logout sonrası yeni role JWT'de.

## ⬜ P36-T05 (T55): AdminContactSubmissionsPage

- **NEDEN:** `ContactSubmission` model var, submissions DB'ye kaydediliyor ama admin panel'de görünmüyor. Kullanıcı contact form submit etse de kimse bilmez.
- **ÖNEM:** P0 — Lost leads! Contact form = 1 numaralı conversion channel.
- **YÖNTEM:** `/admin/contacts` → Table: date, name, email, company, message preview, isRead. Row click → detail panel + "Reply" button (mailto + template). Mark as read/unread. Export CSV. Lead scoring badge (P34-T10).
- **TEST:** Public site contact submit → admin panel'de 1-2 saniye içinde yeni satır. Mark as read → ✓ tik. Export → CSV download.

## ⬜ P36-T06 (T56): AdminNewsletterPage (Subscriber List)

- **NEDEN:** NewsletterSubscriber model var (Phase 17 G2). Admin hangi subscriber'lar var, ne zaman signup oldu görebilmeli. Unsubscribe yönetimi.
- **ÖNEM:** P2 — Email list audit + GDPR compliance (subscriber hak talepleri).
- **YÖNTEM:** `/admin/newsletter` → Table: email, consent, source (footer/popup), subscribedAt, unsubscribedAt. Filter active/unsubscribed. Export CSV (mailchimp/sendgrid import format). Manual remove (GDPR request).
- **TEST:** Public newsletter signup → admin list'te +1 satır. Export CSV → valid format. Manual remove → DB soft delete.

## ⬜ P36-T07 (T57): Admin Audit Log (Who-Did-What)

- **NEDEN:** Admin hangi action'ı ne zaman yaptı bilinmeli (compliance + debug). "User role değiştirildi, kim değiştirdi?" sorusu.
- **ÖNEM:** P1 — Security + compliance.
- **YÖNTEM:** `AuditLog` Prisma model: adminId, action (enum: USER_ROLE_CHANGE, SETTING_UPDATE, BLOG_PUBLISH, etc.), targetType, targetId, oldValue, newValue, ip, userAgent, createdAt. Middleware: admin endpoint'lerde auto-log. `/admin/audit-log` view: filter by admin/action/date.
- **TEST:** Admin role change → AuditLog satırı kayıt. `/admin/audit-log` → son 10 action list. Filter action=USER_ROLE_CHANGE → sadece o action'lar.

## ⬜ P36-T08 (T58): Admin Global Search Bar (Cmd+K)

- **NEDEN:** Admin panel büyüdükçe menu navigation yavaş. Linear, Vercel, Slack stilinde Cmd+K global search productivity boost.
- **ÖNEM:** P2 — Admin UX. Power user feature.
- **YÖNTEM:** `src/components/admin/CommandPalette.tsx`: `cmdk` npm package (shadcn/ui uyumlu). Index: pages (Bookings, Services, Users...), users (search by email), blog posts. `useHotkeys('cmd+k', toggle)`. Fuzzy search Fuse.js.
- **TEST:** Admin `Cmd+K` → palette açık. "book" yaz → "Bookings" page + son booking'ler. Enter → navigate.

## ⬜ P36-T09 (T59): Admin Keyboard Shortcuts

- **NEDEN:** Power users klavyeyi tercih eder. Common actions hotkey ile.
- **ÖNEM:** P2 — Minor UX boost.
- **YÖNTEM:** `src/hooks/useAdminShortcuts.ts`: G+D → dashboard, G+B → bookings, G+C → contacts, N → new (context-aware: bookings'te yeni booking, blog'da yeni post), ? → help modal (tüm shortcuts). `react-hotkeys-hook` npm.
- **TEST:** Admin dashboard → G+B → bookings navigate. ? → modal açık 10+ shortcut liste.

## ⬜ P36-T10 (T60): Role-Based UI Gating (Component Level)

- **NEDEN:** Backend RBAC var ama frontend'te ADMIN+CONSULTANT+PREMIUM user'ların menu'leri farklı değil. UI güvenlik değil ama UX.
- **ÖNEM:** P2 — UX: kullanıcıya sadece yapabileceği action'ları göster.
- **YÖNTEM:** `src/hooks/useCan.ts` → `const canDelete = useCan('booking:delete')`. `<Can action="user:role:change">...</Can>` component wrapper. Role → permission mapping `src/lib/rbac.ts`. AdminSidebar menu items filter by role.
- **TEST:** CONSULTANT olarak login → /admin/users menu görünmez. Direkt URL `/admin/users` → 403 page. ADMIN olarak login → menu görünür + erişim.

---

## Phase 36 Kapatma Kriterleri

- [ ] 10/10 todo `✅`
- [ ] AdminBlogPage inline MDX editor + publish flow
- [x] AdminAnalyticsPage SSE real-time 5 widget
- [ ] AdminSettingsPage 5 tab (SEO/Analytics/Email/Flags/Integrations)
- [ ] AdminUsersPage RBAC change + active toggle
- [ ] AdminContactSubmissionsPage + export CSV
- [ ] AdminNewsletterPage + export CSV
- [ ] AuditLog model + /admin/audit-log view
- [ ] Cmd+K global command palette
- [ ] Keyboard shortcuts (G+D, G+B, N, ?)
- [ ] Role-based UI gating `<Can>` component
- [ ] Tag: `git tag phase-36-closed`

**Bir Sonraki:** `roadmap_70.md` — Phase 37 Booking + Calendar.

# ADR-004: RBAC Permission Model — Runtime Yetki Yönetimi

**Tarih:** 2026-05-26  
**Durum:** Kabul Edildi  
**Yazarlar:** Phase 4 — RBAC Hardening

---

## Bağlam

Phase 0'da eCyPro admin panel'i 3 katmanlı statik RBAC ile kuruldu:
1. `UserRole` enum (ADMIN, EDITOR, VIEWER, BLOG_AUTHOR, CONSULTANT)
2. Frontend `useCan()` + `Can` component (UI gating)
3. `requireRole()` middleware (server-side enforcement)

Statik matris, rol başına sabit permission seti içeriyordu. Bu yaklaşım Phase 0-3 boyunca yeterliydi; ancak prodüksiyonda operatörün RBAC matrisini kod değişikliği olmadan güncelleyemediği görüldü.

**Gereksinimler:**
- Operatör panelinden (admin UI) runtime permission toggle
- Her değişikliğin immutable audit log'a yazılması (KVKK m.12)
- ADMIN rolünün kendi admin yetkisini kaldıramaması (self-demotion guard)
- "Rol Olarak Görüntüle" (View-As) — admin başka rolün perspektifinden sistemi görebilmeli ancak yazma yapamamalı

---

## Karar

**RolePermission JOIN table** + **immutable RoleChangeAudit** + **View-As short-lived session** mimarisi benimsendi.

### Şema

```prisma
model Permission         // 40 canonical permission (key: "blog.create" vb.)
model RolePermission     // (role, permissionId) → granted boolean
model RoleChangeAudit    // immutable — her toggle bir satır, UPDATE/DELETE yok
model ViewAsSession      // admin session + viewingAsRole
```

### Runtime Enforcement

- Permission değiştiğinde in-memory cache invalidate edilir → sonraki istek DB'den okur
- Cache TTL: 60 saniye (kısa, performans/tutarlılık dengesi)
- ADMIN rolü her zaman tüm yetkilere sahip (hard-coded safety net)
- View-As modunda mutation endpoint'ler 403 döner

### Self-Demotion Guard

ADMIN rolü `rbac.read` veya `rbac.write` iznini ADMIN rolünden kaldıramaz. Bu kural:
1. Server `validateRbacChange()` fonksiyonunda zorlanır
2. Red-team testi RT-1 ile doğrulanır

---

## Değerlendirilen Alternatifler

### Cerbos (policy engine)

**Neden reddedildi:** Dış servis bağımlılığı, ayrı deployment, küçük scope için overkill. eCyPro tek-kiracı yapısında 40 permission → ayrı CASB gerekmiyor.

### OPA (Open Policy Agent)

**Neden reddedildi:** Rego öğrenme eğrisi, sidecar container, CI pipeline karmaşıklığı. Kendi sistemimiz yeterli.

### Statik matris korunabilirdi

**Neden reddedildi:** Prodüksiyon'da permission değişikliği için deploy gerekiyordu. Operasyonel risk.

---

## Sonuçlar

**Olumlu:**
- Operatör kod değişikliği olmadan rol yetkilerini yönetebilir
- Her değişiklik immutable log'a yazılır (KVKK m.12 uyumu)
- View-As ile operatör farklı rol perspektifini test edebilir

**Riskler:**
- Yanlış RBAC konfigürasyonu anlık etki gösterir (cache invalidate sonrası)
- ADMIN rolünün yanlış yapılandırılması ciddi risk — self-demotion guard bu riski azaltır
- Cache TTL 60 sn — bu süre zarfında eski permission kullanılabilir (kabul edilebilir trade-off)

**Mitigation:**
- Self-demotion guard (RT-1 test)
- `RoleChangeAudit` her toggle'ı loglar — rollback mümkün (UI'den)
- Red-team 7 adversarial test Phase 4 gate'inde zorunlu

---

## İlgili Referanslar

- `server/lib/rbac-permissions.ts` — 40 canonical permission definitions
- `server/lib/rbac-service.ts` — hasPermission + validateRbacChange
- `server/routes/admin-rbac.ts` — CRUD endpoints
- `server/routes/admin-rbac-redteam.test.ts` — 7 security tests
- Phase 0 ADR: static RBAC foundation

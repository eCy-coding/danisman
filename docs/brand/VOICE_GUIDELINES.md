# eCyPro Brand Voice & KVKK Terminology Guide

## Brand Casing

**eCyPro** — always lowercase `e`, capital `C`, capital `Y`, capital `P`, lowercase `ro`.  
Never: ECyPro, ecypro, Ecypro, ECYPRO.

---

## KVKK Resmi Terminoloji

| Teknik Terim | Doğru TR Karşılığı | Yanlış / Kaçınılacak |
|---|---|---|
| DSAR | Veri Sahibi Başvurusu | "Data Request", "GDPR Request" |
| Data Subject | İlgili Kişi / Veri Sahibi | "Kullanıcı" (hukuki bağlamda) |
| Consent | Rıza | "Onay" (hukuki bağlamda) |
| ROPA | İşleme Envanteri | "Veri Kaydı" |
| VERBİS | VERBİS (doğrudan kullan) | "Kayıt Sistemi" |
| Data Controller | Veri Sorumlusu | "Data Owner" |
| Data Processor | Veri İşleyen | "Processor" |
| Breach | Kişisel Veri İhlali | "Data Leak", "Sızıntı" (hafifletici) |
| DPO | Veri Koruma Sorumlusu | "Privacy Officer" |
| Legal Basis | Hukuki Dayanak | "Sebep", "Neden" |
| Erasure | Silme / İmha | "Delete" (UI'da TR gerekir) |
| Portability | Taşınabilirlik | "Export" (KVKK bağlamında) |
| Independence Check | Bağımsızlık Beyanı | "Conflict Check" |
| Retention | Saklama Süresi | "TTL" (UI'da TR gerekir) |
| Destruction Certificate | Veri İmha Sertifikası | "Delete Receipt" |

---

## UI Copy Standartları

### DSAR Başvuru Ekranı
- Başlık: **"Veri Sahibi Başvuruları (DSAR)"**
- CTA: "Yeni Başvuru Oluştur"
- SLA badge: "30 Gün Kaldı" / "SLA Aşıldı"
- Extension: "SLA 30 Gün Uzatıldı"

### Rıza Defteri
- Başlık: **"Rıza Defteri"**
- Active: "Rıza Aktif"
- Revoked: "Rıza Geri Alındı"
- Re-consent: "Yeniden Rıza Gerekli"

### İşleme Envanteri (ROPA)
- Başlık: **"İşleme Envanteri (ROPA)"**
- Retention lock: "KVKK m.12 — Yasal zorunluluk gereği değiştirilemez"
- Approve: "DPO Onaylandı"
- Status: ACTIVE="Aktif", DEPRECATED="Geçersiz", UNDER_REVIEW="İncelemede"

### VERBİS
- Başlık: **"VERBİS Bildirim Takibi"**
- Pending: "Kayıt Bekleniyor"
- Registered: "Kayıtlı — Sicil No: {no}"
- Annual review: "Yıllık Revize"

### İhlal Yönetimi
- Başlık: **"Veri İhlali Yönetimi"**
- Report button: "Yeni İhlal Bildir"
- 72h warning: "KVKK m.12/5 — 72 saat içinde Kurul'a bildirim zorunludur"
- Reported: "Kurul'a Bildirildi"
- Overdue: "Süre Aşıldı"

### Bağımsızlık Beyanı
- Form başlığı: "Bağımsızlık Kontrolü"
- Conflict: "Çıkar Çatışması Tespit Edildi: {firm}"
- No conflict: "Çıkar Çatışması Yok"
- Declaration: "Bağımsızlık Beyanı"

---

## Tone

- Hukuki modüllerde: formal, net, kısa
- Uyarı mesajları: alarming değil, informative ("Lütfen zamanında yanıt verin" > "UYARI: SLA İHLALİ!")
- Partner'a hitap: "Sn. Partner" değil, doğrudan aksiyonu yaz
- Never use passive when active available: "Başvuruyu atayın" > "Başvuru atanmalıdır"

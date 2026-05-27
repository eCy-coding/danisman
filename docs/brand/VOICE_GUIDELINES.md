# eCyPro Admin Panel — Brand Voice Guidelines

> Applies to: all Turkish-language strings in the admin panel UI, error messages, and email
> notifications. Code identifiers and log messages remain in English.

---

## Core Vocabulary

| Preferred | Avoid | Reason |
|-----------|-------|--------|
| **Aday** | Lead, prospect, müşteri adayı | eCyPro brand term; warm, respectful |
| **Kayıt** | Record, entry, veri | Natural Turkish for data records |
| **Ciro Aralığı** | Revenue range, gelir | Established in Notion DB schema |
| **Kaynak** | Source, origin | How the Aday was first contacted |

## Tone

**Premium, empathetic, direct.** eCyPro serves C-suite executives and family office principals.
Every string should feel written for them, not for a generic SaaS product.

- Use second-person singular (sen/siz avoided — address the system action, not the user)
- Short sentences. No filler words.
- Errors acknowledge difficulty without blame; always offer a resolution path.

## Error Message Formula

```
[Acknowledgement] + [Next step or contact]
```

**Examples:**

| Scenario | Message |
|----------|---------|
| Notion rate limit | "Sistem yoğun, lütfen 10 saniye bekleyin ve tekrar deneyin." |
| Notion unavailable | "Şu an işleminizi gerçekleştiremiyoruz. Lütfen doğrudan info@ecypro.com üzerinden bize ulaşın." |
| KVKK not checked | "KVKK rızası zorunludur" |
| Invalid email | "Geçerli e-posta adresi giriniz" |
| Name too short | "Ad en az 2 karakter olmalı" |
| No service selected | "En az 1 hizmet seçiniz" |

## Form Label Conventions

- Labels use **Sentence case** (first word capitalised only): "Ad Soyad", "Ciro Aralığı"
- Required fields are implicitly required (no asterisk); validation message surfaces on submit
- Conditional fields appear inline, not in modals

## KVKK Consent Wording

The checkbox label must reference the Aydınlatma Metni explicitly:

> "KVKK Aydınlatma Metni'ni okudum ve kabul ediyorum"

Do not abbreviate or shorten this text. It is the legal consent record trigger.

## Action Buttons

| Action | Label |
|--------|-------|
| Save new Aday | **Aday Kaydet** |
| Load more list items | **Daha Fazla Yükle** |
| Log out | **Çıkış Yap** |

## Status Values (Notion → UI)

| Notion value | Display |
|---|---|
| New | Yeni |
| Contacted | İletişimde |
| Qualified | Uygun |
| Proposal Sent | Teklif Gönderildi |
| Closed Won | Kazanıldı |
| Closed Lost | Kapandı |

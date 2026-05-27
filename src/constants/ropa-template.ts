/**
 * ROPA (Records of Processing Activities) — code-locked retention periods.
 *
 * Retention values are copied verbatim from 01_NOTEBOOKLM_FINDINGS_2026-05-26.md §2.7
 * (C Vault citations: 776806c9, 5e9f549e). DO NOT change without a KVKK DPO review.
 *
 * Admin UI may display these values but cannot override them.
 */

export interface ROPATemplate {
  processId: string;
  name: string;
  purpose: string;
  legalBasis: string;
  dataCategories: string[];
  retentionPeriod: string;
  retentionPeriodDays: number;
  retentionLegalSource: string;
  transferLocation: string;
  transferMechanism: string | null;
}

// Retention periods — birebir §2.7 + ROPA table (C vault: 776806c9, 5e9f549e)
export const ROPA_TEMPLATES: Readonly<ROPATemplate[]> = Object.freeze([
  {
    processId: 'HR-01',
    name: 'Bordro',
    purpose: 'Kanuni yükümlülük — çalışan maaş ve prim ödemeleri',
    legalBasis: 'KVKK m.5/2-a',
    dataCategories: ['KIMLIK', 'FINANSAL'],
    retentionPeriod: '10 yıl',
    retentionPeriodDays: 3650,
    retentionLegalSource: 'VUK + İK m.41',
    transferLocation: 'Yurt içi',
    transferMechanism: null,
  },
  {
    processId: 'HR-02',
    name: 'İşe Alım',
    purpose: 'Sözleşme kurulumu + meşru menfaat — aday değerlendirme',
    legalBasis: 'KVKK m.5/2-c + m.5/2-f',
    dataCategories: ['KIMLIK', 'CV', 'GORUSME_NOTU'],
    retentionPeriod: '1 yıl (red) / istihdam süresi',
    retentionPeriodDays: 365,
    retentionLegalSource: 'Meşru menfaat + iş sözleşmesi',
    transferLocation: 'Yurt dışı ATS — açık rıza ile',
    transferMechanism: 'Açık rıza',
  },
  {
    processId: 'SAT-01',
    name: 'CRM',
    purpose: 'Sözleşme + meşru menfaat — müşteri ilişki yönetimi',
    legalBasis: 'KVKK m.5/2-c + m.5/2-f',
    dataCategories: ['ILETISIM', 'SATIN_ALMA'],
    retentionPeriod: 'İlişki + 5 yıl',
    retentionPeriodDays: 1825,
    retentionLegalSource: 'Meşru menfaat — iş ilişkisi sonrası',
    transferLocation: 'Bulut CRM yurt dışı',
    transferMechanism: 'KVKK m.9 (SCC)',
  },
  {
    processId: 'PAZ-01',
    name: 'E-bülten',
    purpose: 'Açık rıza — pazarlama e-postası gönderimi',
    legalBasis: 'KVKK m.5/1',
    dataCategories: ['EPOSTA', 'DAVRANISSAL'],
    retentionPeriod: 'Rıza + 2 yıl',
    retentionPeriodDays: 730,
    retentionLegalSource: 'Aktif abonelik + unsubscribe sonrası 1 yıl (776806c9)',
    transferLocation: 'ESP (yurt dışı)',
    transferMechanism: 'Açık rıza',
  },
  {
    processId: 'WEB-01',
    name: 'Website Çerezleri',
    purpose: 'Açık rıza / meşru menfaat — web analitik ve oturum',
    legalBasis: 'KVKK m.5/2-f + m.5/1',
    dataCategories: ['CEREZ', 'IP'],
    retentionPeriod: '12-24 ay',
    retentionPeriodDays: 425,
    retentionLegalSource: 'GA4 default 14 ay (776806c9)',
    transferLocation: 'GA4 — ABD',
    transferMechanism: 'SCC',
  },
  {
    processId: 'TED-01',
    name: 'Tedarikçi',
    purpose: 'Sözleşme — tedarikçi yetkili veri işleme',
    legalBasis: 'KVKK m.5/2-c',
    dataCategories: ['KIMLIK', 'VERGI'],
    retentionPeriod: 'İlişki + 5 yıl',
    retentionPeriodDays: 1825,
    retentionLegalSource: 'Meşru menfaat — tedarikçi ilişkisi sonrası',
    transferLocation: 'Yurt içi',
    transferMechanism: null,
  },
  {
    processId: 'GUV-01',
    name: 'Kamera Kaydı',
    purpose: 'Meşru menfaat — bina güvenliği',
    legalBasis: 'KVKK m.5/2-f',
    dataCategories: ['GORUNTU'],
    retentionPeriod: '30 gün',
    retentionPeriodDays: 30,
    retentionLegalSource: 'Meşru menfaat — orantılılık gereği kısa saklama (776806c9)',
    transferLocation: 'Yok',
    transferMechanism: null,
  },
  {
    processId: 'ICT-01',
    name: 'Web Log',
    purpose: 'Kanuni yükümlülük — 5651 sayılı kanun log tutma',
    legalBasis: 'KVKK m.5/2-a',
    dataCategories: ['LOG', 'IP'],
    retentionPeriod: '2 yıl',
    retentionPeriodDays: 730,
    retentionLegalSource: '5651 sayılı İnternet Kanunu (776806c9)',
    transferLocation: 'Yok',
    transferMechanism: null,
  },
]);

// Retention policy entries — §2.7 birebir (C vault: 776806c9)
export const RETENTION_POLICIES_SEED = Object.freeze([
  { resourceType: 'INVOICE', retentionDays: 3650, legalBasis: 'VUK + İK m.41' },
  { resourceType: 'CRM_RECORD', retentionDays: 1825, legalBasis: 'Meşru menfaat — SAT-01' },
  {
    resourceType: 'NEWSLETTER_SUBSCRIBER',
    retentionDays: 365,
    legalBasis: 'Aktif + unsubscribe +1 yıl (776806c9)',
  },
  {
    resourceType: 'CONTACT_SUBMISSION',
    retentionDays: 1095,
    legalBasis: 'Cevaplandıktan sonra 3 yıl (776806c9)',
  },
  { resourceType: 'BOOKING', retentionDays: 183, legalBasis: 'Görüşme + 6 ay (776806c9)' },
  { resourceType: 'GA4_DATA', retentionDays: 425, legalBasis: 'GA4 14 ay default (776806c9)' },
  { resourceType: 'SESSION_RECORDING', retentionDays: 30, legalBasis: 'Clarity 30 gün (776806c9)' },
  {
    resourceType: 'CAMERA_FOOTAGE',
    retentionDays: 30,
    legalBasis: 'Bina güvenliği 30 gün (776806c9)',
  },
  { resourceType: 'WEB_LOG', retentionDays: 730, legalBasis: '5651 sayılı Kanun 2 yıl (776806c9)' },
  {
    resourceType: 'AUDIT_LOG',
    retentionDays: 730,
    legalBasis: 'KVKK m.12 — 2 yıl audit readiness',
  },
]);

// 4 new RBAC permission keys (M8)
export const COMPLIANCE_PERMISSIONS = {
  DSAR_MANAGE: 'dsar.manage',
  CONSENT_READ: 'consent.read',
  ROPA_EDIT: 'ropa.edit',
  BREACH_REPORT: 'breach.report',
} as const;

export type CompliancePermission =
  (typeof COMPLIANCE_PERMISSIONS)[keyof typeof COMPLIANCE_PERMISSIONS];

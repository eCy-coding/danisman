import { UserRole } from '@prisma/client';

export interface PermissionDef {
  key: string;
  resource: string;
  action: string;
  description: string;
  isSystem: boolean;
}

// Canonical permission definitions — 40 entries
export const PERMISSION_DEFS: PermissionDef[] = [
  {
    key: 'blog.read',
    resource: 'blog',
    action: 'read',
    description: 'Blog yazılarını görüntüle',
    isSystem: true,
  },
  {
    key: 'blog.create',
    resource: 'blog',
    action: 'create',
    description: 'Blog yazısı oluştur',
    isSystem: true,
  },
  {
    key: 'blog.delete',
    resource: 'blog',
    action: 'delete',
    description: 'Blog yazısı sil',
    isSystem: true,
  },
  {
    key: 'users.read',
    resource: 'users',
    action: 'read',
    description: 'Kullanıcıları görüntüle',
    isSystem: true,
  },
  {
    key: 'users.write',
    resource: 'users',
    action: 'write',
    description: 'Kullanıcı düzenle',
    isSystem: true,
  },
  {
    key: 'users.delete',
    resource: 'users',
    action: 'delete',
    description: 'Kullanıcı sil',
    isSystem: true,
  },
  {
    key: 'users.invite',
    resource: 'users',
    action: 'invite',
    description: 'Kullanıcı davet et',
    isSystem: true,
  },
  {
    key: 'deals.read',
    resource: 'deals',
    action: 'read',
    description: 'Anlaşmaları görüntüle',
    isSystem: true,
  },
  {
    key: 'deals.write',
    resource: 'deals',
    action: 'write',
    description: 'Anlaşma düzenle',
    isSystem: true,
  },
  {
    key: 'deals.delete',
    resource: 'deals',
    action: 'delete',
    description: 'Anlaşma sil',
    isSystem: true,
  },
  {
    key: 'retainers.read',
    resource: 'retainers',
    action: 'read',
    description: 'Retainer sözleşmeleri görüntüle',
    isSystem: true,
  },
  {
    key: 'retainers.write',
    resource: 'retainers',
    action: 'write',
    description: 'Retainer sözleşme düzenle',
    isSystem: true,
  },
  {
    key: 'retainers.invoice',
    resource: 'retainers',
    action: 'invoice',
    description: 'Retainer fatura oluştur',
    isSystem: true,
  },
  {
    key: 'outreach.read',
    resource: 'outreach',
    action: 'read',
    description: 'Pazarlama kampanyalarını görüntüle',
    isSystem: true,
  },
  {
    key: 'outreach.write',
    resource: 'outreach',
    action: 'write',
    description: 'Pazarlama kampanyası düzenle',
    isSystem: true,
  },
  {
    key: 'consent.read',
    resource: 'consent',
    action: 'read',
    description: 'Onay kayıtlarını görüntüle',
    isSystem: true,
  },
  {
    key: 'consent.revoke',
    resource: 'consent',
    action: 'revoke',
    description: 'Onay iptal et',
    isSystem: true,
  },
  {
    key: 'dsar.read',
    resource: 'dsar',
    action: 'read',
    description: 'KVKK başvurularını görüntüle',
    isSystem: true,
  },
  {
    key: 'dsar.respond',
    resource: 'dsar',
    action: 'respond',
    description: 'KVKK başvurusuna yanıtla',
    isSystem: true,
  },
  {
    key: 'dsar.extend',
    resource: 'dsar',
    action: 'extend',
    description: 'KVKK başvuru süresini uzat',
    isSystem: true,
  },
  {
    key: 'ropa.read',
    resource: 'ropa',
    action: 'read',
    description: 'ROPA kayıtlarını görüntüle',
    isSystem: true,
  },
  {
    key: 'ropa.edit',
    resource: 'ropa',
    action: 'edit',
    description: 'ROPA kaydı düzenle',
    isSystem: true,
  },
  {
    key: 'ropa.deprecate',
    resource: 'ropa',
    action: 'deprecate',
    description: 'ROPA kaydı kaldır',
    isSystem: true,
  },
  {
    key: 'verbis.read',
    resource: 'verbis',
    action: 'read',
    description: 'VERBİS bilgilerini görüntüle',
    isSystem: true,
  },
  {
    key: 'verbis.update',
    resource: 'verbis',
    action: 'update',
    description: 'VERBİS bilgilerini güncelle',
    isSystem: true,
  },
  {
    key: 'breach.read',
    resource: 'breach',
    action: 'read',
    description: 'İhlal kayıtlarını görüntüle',
    isSystem: true,
  },
  {
    key: 'breach.report',
    resource: 'breach',
    action: 'report',
    description: 'İhlal bildir',
    isSystem: true,
  },
  {
    key: 'breach.close',
    resource: 'breach',
    action: 'close',
    description: 'İhlal kaydı kapat',
    isSystem: true,
  },
  {
    key: 'retention.read',
    resource: 'retention',
    action: 'read',
    description: 'Saklama politikalarını görüntüle',
    isSystem: true,
  },
  {
    key: 'retention.enforce',
    resource: 'retention',
    action: 'enforce',
    description: 'Saklama politikasını uygula',
    isSystem: true,
  },
  {
    key: 'audit.read',
    resource: 'audit',
    action: 'read',
    description: 'Denetim günlüğünü görüntüle',
    isSystem: true,
  },
  {
    key: 'audit.export',
    resource: 'audit',
    action: 'export',
    description: 'Denetim günlüğünü dışa aktar',
    isSystem: true,
  },
  {
    key: 'independence.read',
    resource: 'independence',
    action: 'read',
    description: 'Bağımsızlık beyanlarını görüntüle',
    isSystem: true,
  },
  {
    key: 'independence.sign',
    resource: 'independence',
    action: 'sign',
    description: 'Bağımsızlık beyanı imzala',
    isSystem: true,
  },
  {
    key: 'csv.export',
    resource: 'csv',
    action: 'export',
    description: 'CSV dışa aktarma',
    isSystem: true,
  },
  {
    key: 'rbac.read',
    resource: 'rbac',
    action: 'read',
    description: 'Yetki matrisini görüntüle',
    isSystem: true,
  },
  {
    key: 'rbac.write',
    resource: 'rbac',
    action: 'write',
    description: 'Yetki matrisini düzenle',
    isSystem: true,
  },
];

// Roles managed by Phase 4 RBAC system
export const RBAC_MANAGED_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.EDITOR,
  UserRole.VIEWER,
  UserRole.BLOG_AUTHOR,
  UserRole.CONSULTANT,
];

// Default permission matrix for each managed role
export const DEFAULT_MATRIX: Record<UserRole, string[]> = {
  [UserRole.ADMIN]: PERMISSION_DEFS.map((p) => p.key),

  [UserRole.EDITOR]: [
    'blog.read',
    'blog.create',
    'blog.delete',
    'deals.read',
    'retainers.read',
    'outreach.read',
    'consent.read',
    'dsar.read',
    'ropa.read',
  ],

  [UserRole.VIEWER]: PERMISSION_DEFS.filter((p) => p.action === 'read').map((p) => p.key),

  [UserRole.BLOG_AUTHOR]: ['blog.read', 'blog.create'],

  [UserRole.CONSULTANT]: [
    'deals.read',
    'deals.write',
    'retainers.read',
    'outreach.read',
    'dsar.read',
  ],

  // Non-managed roles — empty (handled by legacy RBAC)
  [UserRole.USER]: [],
  [UserRole.CLIENT]: [],
  [UserRole.PREMIUM]: [],
};

// Read-only permission keys (action === 'read') — used for VIEWER auto-grant
export const READ_ONLY_KEYS: string[] = PERMISSION_DEFS.filter((p) => p.action === 'read').map(
  (p) => p.key,
);

export function isAdminPermission(key: string): boolean {
  return key === 'rbac.read' || key === 'rbac.write';
}

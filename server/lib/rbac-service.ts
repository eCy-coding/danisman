import { UserRole } from '@prisma/client';
import { DEFAULT_MATRIX, RBAC_MANAGED_ROLES, isAdminPermission } from './rbac-permissions';

// In-memory permission cache (populated from DB on first check, refreshed on write)
// Key: `${role}:${permissionKey}` → granted boolean
let permissionCache: Map<string, boolean> | null = null;
let cachePopulatedAt: number | null = null;
const CACHE_TTL_MS = 60_000; // 1 minute

export interface PermissionStore {
  getRolePermissions: (role: UserRole) => Promise<Array<{ key: string; granted: boolean }>>;
}

function cacheKey(role: string, permKey: string): string {
  return `${role}:${permKey}`;
}

export function invalidatePermissionCache(): void {
  permissionCache = null;
  cachePopulatedAt = null;
}

async function ensureCache(store: PermissionStore, _role: UserRole): Promise<Map<string, boolean>> {
  const now = Date.now();
  if (permissionCache && cachePopulatedAt && now - cachePopulatedAt < CACHE_TTL_MS) {
    return permissionCache;
  }
  const cache = new Map<string, boolean>();
  for (const r of RBAC_MANAGED_ROLES) {
    const perms = await store.getRolePermissions(r);
    for (const { key, granted } of perms) {
      cache.set(cacheKey(r, key), granted);
    }
  }
  permissionCache = cache;
  cachePopulatedAt = now;
  return cache;
}

export async function hasPermission(
  store: PermissionStore,
  role: string,
  permissionKey: string,
): Promise<boolean> {
  const userRole = role as UserRole;

  // ADMIN always has all permissions (hard-coded safety net)
  if (userRole === UserRole.ADMIN) return true;

  // Non-managed roles fall back to default matrix
  if (!RBAC_MANAGED_ROLES.includes(userRole)) {
    return DEFAULT_MATRIX[userRole]?.includes(permissionKey) ?? false;
  }

  const cache = await ensureCache(store, userRole);
  const cached = cache.get(cacheKey(role, permissionKey));

  // Fall back to default matrix if DB entry missing
  if (cached === undefined) {
    return DEFAULT_MATRIX[userRole]?.includes(permissionKey) ?? false;
  }
  return cached;
}

// Validates a proposed permission change for self-demotion guard
export function validateRbacChange(opts: {
  actorId: string;
  actorRole: string;
  targetRole: UserRole;
  permissionKey: string;
  granted: boolean;
}): { valid: boolean; reason?: string } {
  // Only ADMIN can change RBAC
  if (opts.actorRole !== UserRole.ADMIN) {
    return { valid: false, reason: 'Yetki matrisi yalnızca ADMIN tarafından düzenlenebilir.' };
  }

  // Self-demotion guard: ADMIN cannot revoke rbac.write from ADMIN role
  if (
    opts.targetRole === UserRole.ADMIN &&
    isAdminPermission(opts.permissionKey) &&
    opts.granted === false
  ) {
    return { valid: false, reason: 'ADMIN rolü kendi RBAC yetkisini kaldıramaz.' };
  }

  return { valid: true };
}

// Checks if request is in View-As mode (mutation forbidden)
export function isViewAsMode(viewingAsRole: string | undefined): boolean {
  return typeof viewingAsRole === 'string' && viewingAsRole.length > 0;
}

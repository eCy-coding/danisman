/**
 * P36-T10: Role-Based Access Control (RBAC) — Frontend Permission System
 *
 * Design principles:
 *   - Additive permissions: each role inherits from lower roles (except USER/CLIENT)
 *   - Deny-by-default: unlisted actions are denied
 *   - Frontend-only: this is a UI gating layer; backend enforces its own RBAC
 *
 * Role hierarchy (ascending privilege):
 *   USER → CLIENT → CONSULTANT → ADMIN → PREMIUM (superset)
 *
 * Permission format: "resource:action" (colon-separated)
 *   resource = booking | user | blog | service | analytics | contact | newsletter | settings
 *   action   = view | create | edit | delete | export | publish | role:change | activate
 *
 * Usage:
 *   const can = useCan();
 *   can('booking:view')       → true for all logged-in users
 *   can('user:role:change')   → true only for ADMIN and PREMIUM
 *   <Can action="blog:publish"><button>Publish</button></Can>
 */

export type UserRole = 'USER' | 'CLIENT' | 'CONSULTANT' | 'ADMIN' | 'PREMIUM';
export type Permission = string; // "resource:action"

// ─── Permission matrix ─────────────────────────────────────

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  USER: ['booking:view', 'booking:create'],

  CLIENT: [
    'booking:view',
    'booking:create',
    'booking:edit:own', // can reschedule own bookings
    'booking:cancel:own',
    'profile:edit',
  ],

  CONSULTANT: [
    'booking:view',
    'booking:create',
    'booking:edit:own',
    'booking:cancel:own',
    'booking:view:all', // see all bookings (read-only)
    'profile:edit',
    'blog:view',
    'blog:create',
    'blog:edit:own',
    'service:view',
    'analytics:view:basic',
    'contact:view',
  ],

  ADMIN: [
    // Full CRUD on all resources
    'booking:view',
    'booking:view:all',
    'booking:create',
    'booking:edit',
    'booking:delete',
    'booking:cancel:own',
    'profile:edit',
    'blog:view',
    'blog:create',
    'blog:edit',
    'blog:delete',
    'blog:publish',
    'service:view',
    'service:create',
    'service:edit',
    'service:delete',
    'analytics:view',
    'analytics:view:basic',
    'analytics:export',
    'contact:view',
    'contact:delete',
    'contact:export',
    'newsletter:view',
    'newsletter:export',
    'newsletter:delete',
    'user:view',
    'user:edit',
    'user:activate',
    'user:role:change', // can change roles (except to PREMIUM)
    'settings:view',
    'settings:edit',
    'audit:view',
  ],

  PREMIUM: [
    // Superset of ADMIN + premium-only actions
    'booking:view',
    'booking:view:all',
    'booking:create',
    'booking:edit',
    'booking:delete',
    'booking:cancel:own',
    'profile:edit',
    'blog:view',
    'blog:create',
    'blog:edit',
    'blog:delete',
    'blog:publish',
    'service:view',
    'service:create',
    'service:edit',
    'service:delete',
    'analytics:view',
    'analytics:view:basic',
    'analytics:export',
    'contact:view',
    'contact:delete',
    'contact:export',
    'newsletter:view',
    'newsletter:export',
    'newsletter:delete',
    'user:view',
    'user:edit',
    'user:activate',
    'user:role:change', // can promote to PREMIUM
    'user:role:promote', // premium-only: assign PREMIUM role
    'settings:view',
    'settings:edit',
    'settings:advanced', // access to advanced system config
    'audit:view',
    'billing:view',
    'billing:manage',
  ],
};

// ─── Permission check function ─────────────────────────────

/**
 * Returns true if the given role has the specified permission.
 * Wildcard: 'admin:*' matches all permissions starting with 'admin:'
 */
export function can(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role] ?? [];
  if (perms.includes(permission)) return true;

  // Wildcard check: "booking:*" grants all booking actions
  const [resource] = permission.split(':');
  if (resource && perms.includes(`${resource}:*`)) return true;

  return false;
}

/**
 * Returns all permissions for a given role.
 */
export function getPermissions(role: UserRole | null | undefined): Permission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Check if role A has at least the privilege level of role B.
 * Useful for "minimum required role" checks.
 */
const ROLE_ORDER: UserRole[] = ['USER', 'CLIENT', 'CONSULTANT', 'ADMIN', 'PREMIUM'];

export function hasMinRole(role: UserRole | null | undefined, minRole: UserRole): boolean {
  if (!role) return false;
  const roleIdx = ROLE_ORDER.indexOf(role);
  const minIdx = ROLE_ORDER.indexOf(minRole);
  return roleIdx >= minIdx;
}

/**
 * Admin-level check (ADMIN or PREMIUM).
 */
export function isAdmin(role: UserRole | null | undefined): boolean {
  return role === 'ADMIN' || role === 'PREMIUM';
}

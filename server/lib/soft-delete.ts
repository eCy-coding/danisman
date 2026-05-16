/**
 * P14-BE: Soft-delete helpers.
 *
 * GDPR Right-to-Erasure (Article 17) gives two acceptable patterns:
 *
 *   A. Hard-delete the row immediately (default for `/api/gdpr/export` +
 *      `/api/gdpr/delete`). The audit log still keeps a tombstone with
 *      `targetType + targetId` so we can prove the deletion happened.
 *
 *   B. Soft-delete: set `deletedAt` to NOW() and exclude the row from
 *      every default query. This pattern is useful for:
 *        - Admin "trash" UI with restore-within-30-days behaviour.
 *        - Suspected-fraud accounts the operator wants to inspect later.
 *        - Multi-tenant systems where related rows reference the User and
 *          ON DELETE CASCADE would nuke them prematurely.
 *
 * This file provides the typed `notDeleted()` helper used to gate Prisma
 * queries. Always prefer composing it on top of an explicit `where`:
 *
 *     const users = await prisma.user.findMany({
 *       where: { ...notDeleted(), role: 'CLIENT' },
 *     });
 *
 * For the User model, controllers should NOT silently filter on
 * `deletedAt` — every place that reads the soft-deleted state must be a
 * conscious decision. This module exists to make that decision explicit
 * and consistent.
 */

export interface SoftDeletable {
  deletedAt?: Date | null;
}

/**
 * Returns a Prisma `where` fragment that matches only rows whose
 * `deletedAt` IS NULL (i.e. live rows).
 */
export function notDeleted(): { deletedAt: null } {
  return { deletedAt: null };
}

/**
 * Returns a Prisma `where` fragment that matches only rows whose
 * `deletedAt` IS NOT NULL (i.e. previously soft-deleted, for trash UI).
 */
export function onlyDeleted(): { deletedAt: { not: null } } {
  return { deletedAt: { not: null } };
}

/**
 * Soft-delete a row by setting `deletedAt = NOW()`.
 *
 *     await softDelete(prisma.contactSubmission, { id })
 *
 * The model passed in must have a nullable `deletedAt: DateTime?` column.
 */
export async function softDelete<
  TWhere,
  TModel extends {
    update: (args: { where: TWhere; data: { deletedAt: Date } }) => Promise<unknown>;
  },
>(model: TModel, where: TWhere): Promise<void> {
  await model.update({ where, data: { deletedAt: new Date() } });
}

/**
 * Restore a soft-deleted row.
 *
 *     await restore(prisma.contactSubmission, { id })
 */
export async function restore<
  TWhere,
  TModel extends {
    update: (args: { where: TWhere; data: { deletedAt: null } }) => Promise<unknown>;
  },
>(model: TModel, where: TWhere): Promise<void> {
  await model.update({ where, data: { deletedAt: null } });
}

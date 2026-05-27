/**
 * M3+M4: Admin RBAC Page — Yetki Matrisi container page.
 *
 * Combines Permission Matrix (M3) and View-As launcher (M4) in one admin route.
 * Accessible at /admin/rbac (add to router alongside AdminAuditLogPage).
 *
 * Security note: ADMIN-only route — enforced at API layer; UI gated via ProtectedRoute.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PermissionMatrixGrid } from '../../components/admin/rbac/PermissionMatrixGrid';
import { ViewAsLauncher } from '../../components/admin/rbac/ViewAsLauncher';
import { ViewAsBanner } from '../../components/admin/rbac/ViewAsBanner';

export const AdminRBACPage: React.FC = () => {
  return (
    <>
      {/* Sticky View-As banner — renders on top when simulation is active */}
      <ViewAsBanner />

      <div className="space-y-8">
        {/* Page header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShieldCheck className="text-secondary" size={24} aria-hidden="true" />
              Yetki Matrisi
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Rol bazlı erişim kontrolü — her rolün hangi izinlere sahip olduğunu yönetin.
            </p>
          </div>

          {/* View-As launcher sits in the top-right of the header */}
          <div className="shrink-0">
            <ViewAsLauncher />
          </div>
        </div>

        {/* Permission matrix table */}
        <PermissionMatrixGrid />
      </div>
    </>
  );
};

export default AdminRBACPage;

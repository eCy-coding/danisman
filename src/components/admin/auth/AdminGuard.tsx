/**
 * P57.1 — Role-based admin route guard.
 *
 * `ProtectedRoute`'u sarmalar; ek olarak rol kontrolü yapar.
 * useAdminAuth `user.role` veriyor (ADMIN | EDITOR | USER).
 *
 * Usage:
 *   <Route element={<AdminGuard requiredRole="ADMIN" />}>
 *     <Route path="settings" element={<AdminSettingsPage />} />
 *   </Route>
 *
 * Veya tek bir sayfa için:
 *   <AdminGuard requiredRole="EDITOR">
 *     <AdminBlogEdit />
 *   </AdminGuard>
 */

import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { useAppStore } from '../../../stores/useAppStore';

export type AdminRole = 'ADMIN' | 'EDITOR' | 'VIEWER';

const ROLE_RANK: Record<AdminRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  ADMIN: 2,
};

function hasRole(userRole: string | undefined | null, required: AdminRole): boolean {
  if (!userRole) return false;
  const normalized = userRole.toUpperCase() as AdminRole;
  if (!(normalized in ROLE_RANK)) return false;
  return ROLE_RANK[normalized] >= ROLE_RANK[required];
}

export interface AdminGuardProps {
  requiredRole?: AdminRole;
  children?: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ requiredRole = 'VIEWER', children }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const user = useAppStore((s) => s.user);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"
          aria-label="Yükleniyor"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!hasRole(user?.role, requiredRole)) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-white mb-2">Yetkisiz Erişim</h1>
          <p className="text-slate-400 mb-6">
            Bu sayfayı görüntülemek için <strong>{requiredRole}</strong> yetkisine ihtiyacınız var.
            Yetkili kullanıcıyla iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
};

export default AdminGuard;

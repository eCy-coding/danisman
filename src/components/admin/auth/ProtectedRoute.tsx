import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';
import { useAppStore } from '../../../stores/useAppStore';

export const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const { totpRequired, totpVerified } = useAppStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
      </div>
    );
  }

  // TOTP required but not yet verified: stay on login (step=totp)
  if (totpRequired && !totpVerified) {
    return <Navigate to="/admin/login" replace />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

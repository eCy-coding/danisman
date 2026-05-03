import React from 'react';
import { useAppStore, type AppState } from '../../store/useAppStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'consultant' | 'client' | 'premium')[];
  fallback?: React.ReactNode;
  fallbackPath?: string; // Support path-based fallback for tests/routing
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles, fallback = null }) => {
  const user = useAppStore((state: AppState) => state.user);
  
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export const AdminOnly: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => {
  return <RoleGuard {...props} allowedRoles={['admin']} />;
};

export const PremiumOnly: React.FC<Omit<RoleGuardProps, 'allowedRoles'>> = (props) => {
  // Admin also accesses premium content
  const user = useAppStore((state: AppState) => state.user);
  const isAllowed = user?.role === 'premium' || user?.role === 'admin';

  if (!isAllowed) {
    return <>{props.fallback || null}</>;
  }

  return <>{props.children}</>;
};

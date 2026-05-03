import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminAuth } from '../../../hooks/useAdminAuth';

export const ProtectedRoute: React.FC = () => {
    const { isAuthenticated, isLoading } = useAdminAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-neutral flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary"></div>
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

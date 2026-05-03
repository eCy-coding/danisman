import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral text-slate-200 font-sans selection:bg-secondary/30 selection:text-white">
      <AdminSidebar />
      <main className="ml-64 min-h-screen p-8 bg-[url('/bg-grid.svg')] bg-fixed">
        <div className="max-w-6xl mx-auto">
           {/* Header / Breadcrumb placeholder could go here */}
           <Outlet />
        </div>
      </main>
    </div>
  );
};

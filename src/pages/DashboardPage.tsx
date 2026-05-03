import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';

import { Routes, Route } from 'react-router-dom';
// Attempting relative path to root/components/features/ConsultingModule (assuming it's in root/components based on previous failures in src)
import { ConsultingModule } from '../components/features/ConsultingModule';
import { DashboardGrid } from '@/components/dashboard/DashboardGrid';

export const DashboardPage: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardGrid />} />
        <Route path="consulting" element={<ConsultingModule />} />
      </Routes>
    </DashboardLayout>
  );
};

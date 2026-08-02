import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardAppLayout({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}

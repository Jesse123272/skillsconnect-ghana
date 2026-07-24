'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else {
      const role = (user.role || '').toLowerCase();
      if (role === 'admin') {
        router.push('/dashboard/admin');
      } else if (role === 'artisan') {
        router.push('/dashboard/artisan');
      } else {
        router.push('/dashboard/customer');
      }
    }
  }, [user, loading, router]);

  return <LoadingSpinner message="Redirecting to your workspace..." fullPage />;
}

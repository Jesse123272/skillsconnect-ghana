'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function GeneralNotificationsRedirect() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role === 'artisan') {
      router.replace('/dashboard/artisan/notifications');
    } else if (user.role === 'admin') {
      router.replace('/dashboard/admin/logs');
    } else {
      router.replace('/dashboard/customer/notifications');
    }
  }, [user, loading, router]);

  return <LoadingSpinner message="Redirecting to notifications..." fullPage />;
}

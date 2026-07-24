'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

const AiMatchmaker = dynamic(() => import('@/components/AiMatchmaker'), { ssr: false, loading: () => null });
const InstallAppPrompt = dynamic(() => import('@/components/InstallAppPrompt'), { ssr: false, loading: () => null });
const NotificationPermissionPrompt = dynamic(
  () => import('@/components/NotificationPermissionPrompt'),
  { ssr: false, loading: () => null }
);
const ServiceWorkerRegister = dynamic(
  () => import('@/components/ServiceWorkerRegister'),
  { ssr: false, loading: () => null }
);

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/admin/login',
];

export default function ClientShell({ children }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PATHS.some((path) => pathname?.startsWith(path));

  return (
    <AuthProvider>
      <Toaster position="top-right" />
      {!isAuthPage && <ServiceWorkerRegister />}
      {!isAuthPage && <InstallAppPrompt />}
      {!isAuthPage && <NotificationPermissionPrompt />}
      {children}
      {!isAuthPage && <AiMatchmaker />}
    </AuthProvider>
  );
}

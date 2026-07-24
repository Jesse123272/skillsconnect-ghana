'use client';

import React, { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

const AdminLoginPage = () => {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><span className="spinner-border text-primary" role="status"></span></div>}>
      <LoginForm
        pageTitle="Admin Login"
        description="Sign in with administrator credentials to access the admin dashboard."
        requiredRole="admin"
        showBackLink={true}
      />
    </Suspense>
  );
};

export default AdminLoginPage;

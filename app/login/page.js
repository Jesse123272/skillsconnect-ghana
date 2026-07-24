'use client';

import React, { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><span className="spinner-border text-primary" role="status"></span></div>}>
        <LoginForm
          pageTitle="Sign In"
          description="Access your SkillsConnect Ghana dashboard"
        />
      </Suspense>
    </>
  );
}

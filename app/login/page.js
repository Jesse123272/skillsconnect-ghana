'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, user: existingUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  // Extract redirect query parameter if available
  const redirectPath = searchParams.get('redirect') || searchParams.get('callbackUrl') || '';

  // Helper to route to the correct dashboard depending on the user's role
  const navigateToDashboard = useCallback((role) => {
    // If a valid deep-link redirect path within dashboard exists, honor it
    if (redirectPath && redirectPath.startsWith('/dashboard/')) {
      window.location.href = redirectPath;
      return;
    }
    
    // Route to respective role dashboard
    const normalizedRole = (role || '').toLowerCase();
    if (normalizedRole === 'admin') {
      window.location.href = '/dashboard/admin';
    } else if (normalizedRole === 'artisan') {
      window.location.href = '/dashboard/artisan';
    } else {
      window.location.href = '/dashboard/customer';
    }
  }, [redirectPath]);

  // If user is already logged in, redirect them immediately to prevent double login
  useEffect(() => {
    if (existingUser) {
      navigateToDashboard(existingUser.role);
    }
  }, [existingUser, navigateToDashboard]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!email.trim() || !password) {
      toast.error('Please fill in both email and password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          remember_me: rememberMe
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const loggedInUser = result.data.user || result.data;
        toast.success(`Welcome back, ${loggedInUser.full_name || 'User'}! 👋`);
        
        // Update user state in global context
        setUser(loggedInUser);
        
        // Navigate to appropriate dashboard or redirect path
        navigateToDashboard(loggedInUser.role);
      } else {
        if (result.error === 'unverified') {
          toast.error('Your account is not verified yet. Redirecting to verification...');
          router.push(`/verify-email?email=${encodeURIComponent(result.email)}`);
          return;
        }
        const errorMsg = result.error || 'Invalid credentials. Please try again.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Login dispatch error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" id="login-root-wrapper">
      <Navbar />

      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container d-flex justify-content-center">
          <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '440px' }} id="login-form-card">
            
            {/* TOP TITLE */}
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark mb-1">Sign In</h3>
              <p className="text-muted small">Access your SkillsConnect Ghana dashboard</p>
            </div>

            {/* Error Message banner */}
            {apiError && (
              <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
                <i className="fa-solid fa-circle-exclamation me-1.5"></i>
                {apiError}
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleLoginSubmit} className="text-start">
              
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Email Address</label>
                <input
                  type="email"
                  className="form-control text-secondary small"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <label className="form-label text-secondary small fw-medium mb-0">Password</label>
                  <Link href="/forgot-password" className="text-primary fs-8 fw-semibold text-decoration-none">
                    Forgot Password?
                  </Link>
                </div>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control text-secondary small border-end-0"
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    className="btn border border-start-0 text-muted"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} fs-7`}></i>
                  </button>
                </div>
              </div>

              {/* REMEMBER ME CHECKBOX */}
              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label text-secondary small" htmlFor="rememberMe">
                  Keep me signed in
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                className="btn btn-primary w-100 rounded-pill py-2.5 fs-6 fw-semibold mb-3 shadow"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>

              <div className="text-center mt-2">
                <span className="text-muted small">Don&apos;t have an account? </span>
                <Link href="/register" className="text-primary fw-semibold small text-decoration-none">
                  Register Now
                </Link>
              </div>

            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-vh-100 d-flex align-items-center justify-content-center"><span className="spinner-border text-primary" role="status"></span></div>}>
      <LoginContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

export default function LoginForm({
  pageTitle = 'Sign In',
  description = 'Access your SkillsConnect Ghana dashboard',
  requiredRole = '',
  showAdminLink = false,
  showBackLink = false,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, user: existingUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const redirectPath =
    searchParams.get('redirect') || searchParams.get('callbackUrl') || '';

  const navigateToDashboard = useCallback(
    (role) => {
      if (redirectPath && redirectPath.startsWith('/dashboard/')) {
        router.replace(redirectPath);
        return;
      }

      const normalizedRole = (role || '').toLowerCase();
      if (normalizedRole === 'admin') {
        router.replace('/dashboard/admin');
      } else if (normalizedRole === 'artisan') {
        router.replace('/dashboard/artisan');
      } else {
        router.replace('/dashboard/customer');
      }
    },
    [redirectPath, router]
  );

  useEffect(() => {
    if (!existingUser) return;

    const timer = window.setTimeout(() => {
      if (requiredRole && existingUser.role !== requiredRole) {
        setApiError(`Please use the ${requiredRole} login page for this account.`);
        return;
      }
      navigateToDashboard(existingUser.role);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [existingUser, navigateToDashboard, requiredRole]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    const form = e.currentTarget;
    const formData = new FormData(form);
    const submittedEmail = formData.get('email')?.toString().trim() || email.trim();
    const submittedPassword = formData.get('password')?.toString() || password;

    if (!submittedEmail || !submittedPassword) {
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
          email: submittedEmail,
          password: submittedPassword,
          remember_me: rememberMe,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const loggedInUser = result.data.user || result.data;

        if (requiredRole && loggedInUser.role !== requiredRole) {
          const label = requiredRole.charAt(0).toUpperCase() + requiredRole.slice(1);
          setApiError(`This page is for ${label} login only. Use the regular login page.`);
          setIsSubmitting(false);
          return;
        }

        toast.success(`Welcome back, ${loggedInUser.full_name || 'User'}! 👋`);
        setUser(loggedInUser);
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
      <div className="bg-light d-flex align-items-center justify-content-center py-5" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="container d-flex justify-content-center">
          <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '440px' }} id="login-form-card">
            <div className="text-center mb-4">
              <h3 className="fw-bold text-dark mb-1">{pageTitle}</h3>
              <p className="text-muted small">{description}</p>
              {requiredRole === 'admin' && (
                <p className="text-muted small mb-0">Use your admin credentials to access the Administrator dashboard.</p>
              )}
            </div>

            {apiError && (
              <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
                <i className="fa-solid fa-circle-exclamation me-1.5"></i>
                {apiError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label text-secondary small fw-medium">Email Address</label>
                <input
                  name="email"
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
                  {!requiredRole && (
                    <Link href="/forgot-password" className="text-primary fs-8 fw-semibold text-decoration-none">
                      Forgot Password?
                    </Link>
                  )}
                </div>
                <div className="input-group">
                  <input
                    name="password"
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
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'} fs-7`} />
                  </button>
                </div>
              </div>

              <div className="form-check mb-4">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  name="remember_me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label text-secondary small" htmlFor="rememberMe">
                  Keep me signed in
                </label>
              </div>

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

              {!requiredRole && (
                <>
                  <div className="text-center mt-2">
                    <span className="text-muted small">Need admin access? </span>
                    <Link href="/admin/login" className="text-primary fw-semibold small text-decoration-none">
                      Admin Login
                    </Link>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-muted small">Don&apos;t have an account? </span>
                    <Link href="/register" className="text-primary fw-semibold small text-decoration-none">
                      Create Account
                    </Link>
                  </div>
                </>
              )}

              {showBackLink && (
                <div className="text-center mt-2">
                  <Link href="/login" className="text-secondary small text-decoration-none">
                    Back to regular login
                  </Link>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

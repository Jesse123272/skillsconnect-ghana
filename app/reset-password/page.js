'use client';

import React, { useState, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { validatePassword, generateStrongPassword } from '@/lib/validators';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const passwordSuggestion = useMemo(() => generateStrongPassword(), []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const getPasswordStrength = (pwd) => {
    let score = 0;
    if (!pwd) {
      return { label: 'No password yet', color: 'text-secondary', progressClass: 'bg-secondary', percent: 0 };
    }
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) {
      return { label: 'Weak', color: 'text-danger', progressClass: 'bg-danger', percent: 20 * score };
    }
    if (score <= 4) {
      return { label: 'Strong', color: 'text-warning', progressClass: 'bg-warning', percent: 20 * score };
    }
    return { label: 'Very strong', color: 'text-success', progressClass: 'bg-success', percent: 100 };
  };

  const handleRecommendPassword = () => {
    const newPass = generateStrongPassword();
    setPassword(newPass);
    setConfirmPassword(newPass);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!token) {
      toast.error('Invalid or missing reset token.');
      return;
    }

    if (!password || !confirmPassword) {
      toast.error('Please fill in both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      toast.error(passwordCheck.message);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password,
          confirm_password: confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Password reset successfully!');
        setIsSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2500);
      } else {
        const errorMsg = result.error || 'Failed to reset password.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Reset password error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '440px' }} id="reset-password-card">
      {!isSuccess ? (
        <div id="state-reset-form">
          <div className="text-center mb-4">
            <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="fa-solid fa-lock fs-4 text-warning"></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">Set New Password</h3>
            <p className="text-muted small">Enter your new account password below.</p>
          </div>

          {!token && (
            <div className="alert alert-warning fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
              <i className="fa-solid fa-triangle-exclamation me-1.5"></i>
              No reset token found in URL. Please check your link.
            </div>
          )}

          {apiError && (
            <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
              <i className="fa-solid fa-circle-exclamation me-1.5"></i>
              {apiError}
            </div>
          )}

          <form onSubmit={handleResetSubmit} className="text-start">
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium">New Password</label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control text-secondary small border-end-0"
                  placeholder="Use a strong secure password"
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
              <div className="form-text fs-8 mt-2">
                <span
                  role="button"
                  tabIndex={0}
                  className="badge rounded-pill bg-light text-primary border border-primary px-3 py-2 fw-semibold"
                  style={{ cursor: 'pointer' }}
                  onClick={handleRecommendPassword}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleRecommendPassword();
                  }}
                  aria-label="Click to generate recommended password"
                >
                  Recommend Password
                </span>
              </div>

              <div className="mt-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <small className={`fw-semibold ${getPasswordStrength(password).color}`}>
                    {getPasswordStrength(password).label}
                  </small>
                  <small className="text-muted">{getPasswordStrength(password).percent}%</small>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className={`progress-bar ${getPasswordStrength(password).progressClass}`}
                    role="progressbar"
                    style={{ width: `${getPasswordStrength(password).percent}%` }}
                    aria-valuenow={getPasswordStrength(password).percent}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
              </div>

              <div className="form-text fs-8 text-muted mt-2">
                {password
                  ? 'Make sure your password includes uppercase, lowercase, numbers, and a symbol to make it very strong.'
                  : 'Type a password or click the recommended password to generate a secure one.'}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label text-secondary small fw-medium">Confirm New Password</label>
              <div className="input-group">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="form-control text-secondary small border-end-0"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  className="btn border border-start-0 text-muted"
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} fs-7`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 rounded-pill py-2.5 fs-6 fw-semibold mb-3 shadow"
              disabled={isSubmitting || !token}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Resetting Password...
                </>
              ) : (
                'Reset Password'
              )}
            </button>

            <div className="text-center">
              <Link href="/login" className="text-primary fw-semibold small text-decoration-none">
                Return to Login
              </Link>
            </div>
          </form>
        </div>
      ) : (
        <div id="state-success-msg" className="text-center py-4">
          <div className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4" style={{ width: '70px', height: '70px' }}>
            <i className="fa-solid fa-circle-check fs-2"></i>
          </div>
          <h3 className="fw-bold text-dark mb-2">Password Reset Complete</h3>
          <p className="text-secondary small mb-4">
            Your password has been successfully updated. Redirecting to login page...
          </p>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="d-flex flex-column min-vh-100" id="reset-password-root-wrapper">
      <Navbar />
      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container d-flex justify-content-center">
          <Suspense fallback={
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}

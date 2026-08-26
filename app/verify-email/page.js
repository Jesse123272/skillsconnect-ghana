'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const redirectParam = searchParams.get('redirect') || '';

  const [email, setEmail] = useState(emailParam || '');
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [apiError, setApiError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  // Check email service status (mock vs real)
  useEffect(() => {
    async function checkMailStatus() {
      try {
        const res = await fetch('/api/auth/verify-email');
        const data = await res.json();
        if (data.success && data.mockMode) {
          setMockMode(true);
        }
      } catch (e) {
        console.warn('Failed to check verification status', e);
      }
    }
    checkMailStatus();
  }, []);

  // Handle cooldown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!email.trim()) {
      toast.error('Email address is required.');
      return;
    }

    if (!code.trim() || code.trim().length !== 6) {
      toast.error('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          code: code.trim(),
          redirect: redirectParam,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Account verified successfully!');
        setIsSuccess(true);
        window.setTimeout(() => {
          router.replace(result.redirect || '/login');
        }, 1200);
      } else {
        const errorMsg = result.error || 'Verification failed. Please check the code.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Email verification error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!email.trim()) {
      toast.error('Please enter your email address to receive a code.');
      return;
    }

    setIsResending(true);
    setApiError('');
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Verification code resent successfully!');
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        const errorMsg = result.error || 'Failed to resend code.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Resend verification code error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '460px' }} id="verify-email-card">
      {!isSuccess ? (
        /* STATE 1 - VERIFY CODE */
        <div id="state-verify-code">
          <div className="text-center mb-4">
            <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
              <i className="fa-solid fa-shield-halved fs-4 text-warning"></i>
            </div>
            <h3 className="fw-bold text-dark mb-1">Verify Your Email</h3>
            <p className="text-muted small px-2">
              For security, we have sent a 6-digit verification code to your email. Please enter it below to activate your account.
            </p>
          </div>

          {mockMode && (
            <div className="alert alert-info border-info-subtle bg-info-subtle text-info-emphasis fs-7 py-3 px-3 mb-4 text-start d-flex gap-2.5 align-items-start" role="alert" style={{ borderRadius: '12px' }}>
              <i className="fa-solid fa-circle-info mt-0.5 fs-6 text-info"></i>
              <div>
                <strong className="d-block mb-1 text-info-emphasis">Sandbox Testing Mode Active</strong>
                <span className="text-secondary d-block" style={{ fontSize: '12.5px', lineHeight: '1.4' }}>
                  Since SMTP is in simulated mode for this preview environment, you can use the sandbox bypass code <strong className="text-dark bg-white px-1.5 py-0.5 rounded border fw-semibold">123456</strong> to instantly verify.
                </span>
              </div>
            </div>
          )}

          {apiError && (
            <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start animate__animated animate__shakeX" role="alert">
              <i className="fa-solid fa-circle-exclamation me-1.5"></i>
              {apiError}
            </div>
          )}

          <form onSubmit={handleVerifySubmit} className="text-start">
            <div className="mb-3">
              <label className="form-label text-secondary small fw-medium">Registered Email</label>
              <input
                type="email"
                className="form-control text-secondary small"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!emailParam}
              />
            </div>

            <div className="mb-4 text-center">
              <label className="form-label text-secondary small fw-medium d-block text-start mb-2">6-Digit Code</label>
              <input
                type="text"
                maxLength={6}
                className="form-control text-center fw-bold fs-4 tracking-widest letter-spacing-md"
                placeholder="000000"
                style={{ letterSpacing: '8px' }}
                value={code}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setCode(val);
                }}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 rounded-pill py-2.5 fs-6 fw-semibold mb-3 shadow"
              disabled={isSubmitting || code.length !== 6}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Confirming code...
                </>
              ) : (
                'Verify Account'
              )}
            </button>

            <div className="text-center mt-3 small">
              <p className="text-muted mb-1">Didn&apos;t receive the security email?</p>
              {resendCooldown > 0 ? (
                <span className="text-secondary fw-semibold">
                  Resend code in {resendCooldown}s
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-link text-primary text-decoration-none fw-semibold p-0 btn-sm"
                  onClick={handleResendCode}
                  disabled={isResending}
                >
                  {isResending ? 'Sending...' : 'Resend Code'}
                </button>
              )}
            </div>
          </form>
        </div>
      ) : (
        /* STATE 2 - SUCCESS MESSAGE */
        <div id="state-success-msg" className="text-center py-4">
          <div className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4 animate__animated animate__bounceIn" style={{ width: '80px', height: '80px' }}>
            <i className="fa-solid fa-circle-check fs-1 text-success"></i>
          </div>
          
          <h3 className="fw-bold text-dark mb-2">Verification Complete</h3>
          <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
            Excellent! Your email <strong className="text-dark">{email}</strong> is officially verified. We are taking you to your SkillsConnect Ghana dashboard.
          </p>

          <div className="spinner-border spinner-border-sm text-primary mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted small">Redirecting to dashboard...</p>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="d-flex flex-column min-vh-100" id="verify-email-root-wrapper">
      <Navbar />

      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container d-flex justify-content-center">
          <Suspense fallback={
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading verification interface...</span>
              </div>
            </div>
          }>
            <VerifyEmailForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </div>
  );
}

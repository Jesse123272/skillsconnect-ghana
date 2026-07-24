'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!email.trim()) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Reset link dispatched successfully!');
        setIsSuccess(true);
      } else {
        const errorMsg = result.error || 'Failed to request reset link.';
        setApiError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Forgot password submission error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" id="forgot-password-root-wrapper">
      <Navbar />

      <main className="flex-grow-1 bg-light d-flex align-items-center justify-content-center py-5">
        <div className="container d-flex justify-content-center">
          <div className="card border rounded-4 shadow-lg p-4 bg-white w-100" style={{ maxWidth: '440px' }} id="forgot-password-card">
            
            {!isSuccess ? (
              /* STATE 1 - REQUEST RESET */
              <div id="state-request-reset">
                <div className="text-center mb-4">
                  <div className="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '60px', height: '60px' }}>
                    <i className="fa-solid fa-key fs-4"></i>
                  </div>
                  <h3 className="fw-bold text-dark mb-1">Recover Password</h3>
                  <p className="text-muted small">Enter your email and we&apos;ll send you instructions to reset your password.</p>
                </div>

                {apiError && (
                  <div className="alert alert-danger fs-7 py-2.5 px-3 mb-3 text-start" role="alert">
                    <i className="fa-solid fa-circle-exclamation me-1.5"></i>
                    {apiError}
                  </div>
                )}

                <form onSubmit={handleResetSubmit} className="text-start">
                  <div className="mb-4">
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

                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-pill py-2.5 fs-6 fw-semibold mb-3 shadow"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending link...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>

                  <div className="text-center">
                    <Link href="/login" className="text-primary fw-semibold small text-decoration-none d-inline-flex align-items-center gap-1">
                      <i className="fa-solid fa-arrow-left fs-8"></i>
                      <span>Return to Login</span>
                    </Link>
                  </div>
                </form>
              </div>
            ) : (
              /* STATE 2 - SUCCESS MESSAGE */
              <div id="state-success-msg" className="text-center py-3">
                <div className="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-4 animate__animated animate__bounceIn" style={{ width: '70px', height: '70px' }}>
                  <i className="fa-solid fa-circle-check fs-2"></i>
                </div>
                
                <h3 className="fw-bold text-dark mb-2">Check Your Inbox</h3>
                <p className="text-secondary small mb-4" style={{ lineHeight: '1.6' }}>
                  We have sent password recovery instructions to <strong className="text-dark">{email}</strong>. Please check your emails (including junk/spam) to finalize reset.
                </p>

                <Link href="/login" className="btn btn-primary w-100 rounded-pill py-2.5 fs-7 fw-semibold shadow">
                  Return to Login
                </Link>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

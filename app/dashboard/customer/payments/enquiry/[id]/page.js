'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AlertMessage from '@/components/AlertMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EnquiryPaymentPage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const params = useParams();
  const router = useRouter();
  const enquiryId = params?.id;
  const [enquiry, setEnquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payAmount, setPayAmount] = useState('150');
  const [payNote, setPayNote] = useState('');
  const [initializingPay, setInitializingPay] = useState(false);

  const loadEnquiry = useCallback(async () => {
    if (!enquiryId) return;
    try {
      setLoading(true);
      setError('');
      const response = await authFetch(`/api/enquiries/${enquiryId}`);
      if (response.status === 401) {
        router.replace(`/login?callbackUrl=${encodeURIComponent(`/dashboard/customer/payments/enquiry/${enquiryId}`)}`);
        return;
      }
      const result = await response.json();
      if (!response.ok || !result.success || !result.data) {
        setError(result.error || 'This enquiry could not be loaded for payment.');
        return;
      }
      setEnquiry(result.data);
    } catch (loadError) {
      console.error('Enquiry payment page load failed:', loadError);
      setError('Unable to load this enquiry for payment. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, enquiryId, router]);

  useEffect(() => {
    if (authLoading || !user) return undefined;
    const timer = window.setTimeout(() => {
      void loadEnquiry();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, loadEnquiry, user]);

  const handlePayArtisan = async (event) => {
    event.preventDefault();
    const amountGhs = Number.parseFloat(payAmount);
    if (!Number.isFinite(amountGhs) || amountGhs <= 0) {
      setError('Enter a valid positive amount in Ghana Cedis (GHS).');
      return;
    }

    try {
      setInitializingPay(true);
      setError('');
      const response = await authFetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountGhs,
          enquiry_id: enquiryId,
          artisan_id: enquiry.artisan_id,
          note: payNote || `Service payment for "${enquiry.subject || 'Artisan Service'}"`,
        }),
      });
      const result = await response.json();
      if (response.ok && result.success && result.data?.authorization_url) {
        window.location.assign(result.data.authorization_url);
      } else {
        setError(result.error || 'Unable to start the Paystack payment. Please try again.');
      }
    } catch (paymentError) {
      console.error('Paystack initialization error:', paymentError);
      setError('A network error occurred while starting the payment.');
    } finally {
      setInitializingPay(false);
    }
  };

  if (authLoading || !user || loading) {
    return <LoadingSpinner message="Loading payment details..." fullPage />;
  }

  if (error || !enquiry) {
    return (
      <div className="container-fluid px-0">
        <AlertMessage type="danger" message={error || 'Enquiry details could not be loaded.'} />
        <Link href="/dashboard/customer/payments" className="btn btn-outline-secondary rounded-pill">
          Back to payments
        </Link>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0" id="enquiry-payment-page">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1">Pay for service</h2>
          <p className="text-muted mb-0">Enquiry: {enquiry.subject}</p>
        </div>
        <Link href={`/dashboard/customer/enquiries/${enquiryId}`} className="btn btn-outline-secondary rounded-pill px-4">
          Back to conversation
        </Link>
      </div>

      <div className="row g-4">
        <div className="col-12 col-lg-7">
          <section className="card border rounded-3 p-4 bg-white h-100">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill align-self-start mb-3">
              Secure Paystack payment
            </span>
            <h3 className="h5 fw-bold text-dark">Payment to {enquiry.artisan_name}</h3>
            <p className="text-secondary mb-3">
              Pay directly through Paystack using supported Ghanaian mobile money or card methods. This is not an escrow payment.
            </p>
            <div className="small text-muted">Enquiry status: <span className="text-capitalize">{enquiry.status?.replace('_', ' ') || 'pending'}</span></div>
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <form onSubmit={handlePayArtisan} className="card border rounded-3 p-4 bg-white">
            <h3 className="h5 fw-bold text-dark mb-3">Payment details</h3>
            {error && <AlertMessage type="danger" message={error} onClose={() => setError('')} />}
            <div className="mb-3">
              <label htmlFor="payment-amount" className="form-label fw-semibold">Amount (GHS)</label>
              <div className="input-group">
                <span className="input-group-text">GHS</span>
                <input
                  id="payment-amount"
                  type="number"
                  step="0.01"
                  min="1"
                  className="form-control"
                  value={payAmount}
                  onChange={(event) => setPayAmount(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-3">
              <label htmlFor="payment-note" className="form-label fw-semibold">Payment note <span className="text-muted fw-normal">(optional)</span></label>
              <input
                id="payment-note"
                type="text"
                className="form-control"
                placeholder="For example, deposit for materials"
                value={payNote}
                onChange={(event) => setPayNote(event.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-success w-100 rounded-pill py-2 fw-semibold" disabled={initializingPay || !payAmount}>
              {initializingPay ? 'Connecting to Paystack...' : `Pay GHS ${payAmount || '0'} with Paystack`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
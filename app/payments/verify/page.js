'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function PaymentVerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const reference = searchParams.get('reference') || searchParams.get('trxref') || '';
  const [verifying, setVerifying] = useState(Boolean(reference));
  const [success, setSuccess] = useState(false);
  const [transactionData, setTransactionData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(reference ? '' : 'No Paystack transaction reference found in callback parameters.');

  useEffect(() => {
    if (!reference) return;

    let active = true;
    async function verifyPayment() {
      try {
        const res = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference })
        });

        const result = await res.json();

        if (active) {
          if (res.ok && result.success && result.data.status === 'success') {
            setSuccess(true);
            setTransactionData(result.data);
          } else {
            setSuccess(false);
            setErrorMsg(result.error || 'Payment verification failed or transaction was cancelled.');
          }
        }
      } catch (err) {
        console.error('Verification network error:', err);
        if (active) {
          setSuccess(false);
          setErrorMsg('Network error while verifying transaction with Paystack.');
        }
      } finally {
        if (active) setVerifying(false);
      }
    }

    verifyPayment();
    return () => { active = false; };
  }, [reference]);

  return (
    <div className="container py-5" style={{ maxWidth: '640px' }}>
      
      {/* 1. LOADING / VERIFYING STATE */}
      {verifying && (
        <div className="card border-0 shadow-lg rounded-4 p-5 text-center bg-white" id="payment-verifying-card">
          <div className="spinner-border text-primary mx-auto mb-4" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <h4 className="fw-bold text-dark mb-2">Verifying Paystack Payment...</h4>
          <p className="text-muted fs-7 mb-0">
            Please wait while SkillsConnect Ghana connects to Paystack gateway to confirm your mobile money / card transaction.
          </p>
        </div>
      )}

      {/* 2. SUCCESS RECEIPT STATE */}
      {!verifying && success && (
        <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white text-center animate__animated animate__fadeIn" id="payment-success-card">
          <div className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: '75px', height: '75px' }}>
            <i className="fa-solid fa-check fs-1"></i>
          </div>

            <span className="badge bg-success-subtle text-success border border-success-subtle px-3 py-1.5 rounded-pill fs-8 fw-bold mb-2">
            Payment Verified
          </span>

          <h3 className="fw-black text-dark mb-1">Medaase! Payment Received</h3>
          <p className="text-muted fs-7 mb-4">
            Your transaction has been securely processed via Paystack. A receipt has been issued to your account.
          </p>

          {/* RECEIPT SUMMARY BOX */}
          <div className="bg-light rounded-3 p-3.5 border text-start mb-4">
            <div className="d-flex justify-content-between align-items-center border-bottom pb-2.5 mb-2.5">
              <span className="text-muted fs-8 fw-semibold text-uppercase">Amount Paid</span>
              <span className="fw-black text-success fs-5">
                GHS {transactionData?.amount ? Number(transactionData.amount).toFixed(2) : '0.00'}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1">
              <span className="text-muted fs-8">Paystack Reference</span>
              <span className="fw-mono text-dark fs-8 fw-bold">{reference}</span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1">
              <span className="text-muted fs-8">Payment Channel</span>
              <span className="badge bg-white text-dark border text-capitalize fs-8">
                <i className="fa-solid fa-mobile-screen-button text-primary me-1"></i>
                {transactionData?.channel ? transactionData.channel.replace('_', ' ') : 'MTN MoMo / Card'}
              </span>
            </div>

            <div className="d-flex justify-content-between align-items-center py-1">
              <span className="text-muted fs-8">Verification Date</span>
              <span className="text-dark fs-8">
                {transactionData?.verified_at ? new Date(transactionData.verified_at).toLocaleString() : new Date().toLocaleString()}
              </span>
            </div>
          </div>

          {/* PAYSTACK TRUST BADGE */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4 text-muted fs-8">
            <i className="fa-solid fa-shield-halved text-success"></i>
            <span>Processed by Paystack</span>
          </div>

          {/* ACTION BUTTONS */}
          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <Link href="/dashboard/customer/payments" className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold shadow-sm fs-7">
              <i className="fa-solid fa-receipt me-1.5"></i>
              <span>View All Transactions</span>
            </Link>
            <Link href="/dashboard/customer/enquiries" className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-semibold fs-7">
              <span>Return to Enquiries</span>
            </Link>
          </div>
        </div>
      )}

      {/* 3. ERROR / CANCELLED STATE */}
      {!verifying && !success && (
        <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5 bg-white text-center animate__animated animate__fadeIn" id="payment-error-card">
          <div className="rounded-circle bg-danger text-white d-flex align-items-center justify-content-center mx-auto mb-3 shadow-sm" style={{ width: '70px', height: '70px' }}>
            <i className="fa-solid fa-xmark fs-2"></i>
          </div>

          <h4 className="fw-bold text-dark mb-2">Payment Verification Unsuccessful</h4>
          <p className="text-danger fs-7 mb-4 px-2">
            {errorMsg || 'The transaction could not be verified or was cancelled by user.'}
          </p>

          <div className="bg-light p-3 rounded-3 border mb-4 text-start fs-8 text-secondary">
            <strong>Need Assistance?</strong> If you were debited on your MTN Mobile Money, Telecel Cash, or Card but see this error, please contact support with reference: <code className="text-dark fw-bold">{reference || 'N/A'}</code>.
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2 justify-content-center">
            <button onClick={() => router.back()} className="btn btn-primary rounded-pill px-4 py-2.5 fw-bold fs-7">
              <i className="fa-solid fa-rotate-left me-1.5"></i>
              <span>Try Payment Again</span>
            </button>
            <Link href="/dashboard/customer/enquiries" className="btn btn-outline-secondary rounded-pill px-4 py-2.5 fw-semibold fs-7">
              <span>Back to Enquiries</span>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" role="status"></div>
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  );
}

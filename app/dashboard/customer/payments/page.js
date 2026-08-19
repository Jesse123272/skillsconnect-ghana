'use client';

import React, { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';// DashboardLayout provided by app/dashboard/layout.js; per-page wrapper removed
import LoadingSpinner from '@/components/LoadingSpinner';
import { CreditCard, CheckCircle, Clock, XCircle, DollarSign, Calendar, ExternalLink, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CustomerPaymentsPage() {
  const { authFetch } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPayments() {
      setLoading(true);
      try {
        const res = await authFetch(`/api/payments?status=${filterStatus}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && isMounted) {
          setTransactions(data.data.transactions || []);
        } else if (isMounted) {
          toast.error(data.error || 'Failed to load transaction history.');
        }
      } catch (err) {
        console.error('Customer payments fetch error:', err);
        if (isMounted) toast.error('Network error loading payments.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPayments();
    return () => { isMounted = false; };
  }, [filterStatus]);

  const totalSpentGhs = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const successCount = transactions.filter(t => t.status === 'success').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <>
      {/* Metrics Row */}
      <div className="row g-3 mb-4 text-dark" id="customer-payments-stats">
        <div className="col-md-4">
          <div className="card shadow-sm border bg-white p-3.5 d-flex flex-row align-items-center gap-3 rounded-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <DollarSign size={24} />
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Total Spent</span>
              <h4 className="fw-black text-dark mb-0">GHS {totalSpentGhs.toFixed(2)}</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border bg-white p-3.5 d-flex flex-row align-items-center gap-3 rounded-3">
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Successful Transactions</span>
              <h4 className="fw-black text-dark mb-0">{successCount} Paid</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow-sm border bg-white p-3.5 d-flex flex-row align-items-center gap-3 rounded-3">
            <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
              <Clock size={24} />
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Pending / Initialized</span>
              <h4 className="fw-black text-dark mb-0">{pendingCount} Active</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ul className="nav nav-pills gap-1" id="customer-payment-filter-pills">
          {[
            { key: 'all', label: 'All Payments' },
            { key: 'success', label: 'Successful' },
            { key: 'pending', label: 'Pending' },
            { key: 'failed', label: 'Failed / Cancelled' }
          ].map((tab) => (
            <li key={tab.key} className="nav-item">
              <button
                onClick={() => setFilterStatus(tab.key)}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold ${
                  filterStatus === tab.key ? 'btn-primary text-white' : 'btn-light border text-secondary'
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <span className="text-muted fs-8 d-none d-sm-inline">
          <i className="fa-solid fa-shield-halved text-success me-1"></i> Paystack Ghana Escrow Secured
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Loading your payment records..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark rounded-3 overflow-hidden" id="customer-payments-table-container">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-light border-bottom">
                <tr>
                  <th>Paystack Reference</th>
                  <th>Amount</th>
                  <th>Payment Channel</th>
                  <th>Date & Time</th>
                  <th>Status</th>
                  <th className="text-end">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.transaction_id}>
                      <td className="fw-mono text-muted text-uppercase" style={{ fontSize: '12px' }}>
                        {t.reference}
                      </td>
                      <td className="fw-bold text-dark">
                        GHS {Number(t.amount).toFixed(2)}
                      </td>
                      <td className="text-capitalize text-secondary">
                        <span className="badge bg-light text-dark border">
                          <CreditCard size={12} className="me-1 text-primary" />
                          {t.channel ? t.channel.replace('_', ' ') : 'Paystack / MoMo'}
                        </span>
                      </td>
                      <td className="text-muted small">
                        <Calendar size={13} className="me-1" />
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td>
                        {t.status === 'success' ? (
                          <span className="badge bg-success text-white d-inline-flex align-items-center gap-1">
                            <CheckCircle size={11} /> Verified Paid
                          </span>
                        ) : t.status === 'pending' ? (
                          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                            <Clock size={11} /> Pending
                          </span>
                        ) : (
                          <span className="badge bg-secondary text-white d-inline-flex align-items-center gap-1">
                            <XCircle size={11} /> Failed
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        {t.status === 'success' ? (
                          <button
                            onClick={() => setSelectedReceipt(t)}
                            className="btn btn-2xs btn-outline-primary rounded-pill px-2.5 py-1 fw-bold fs-8 d-inline-flex align-items-center gap-1"
                          >
                            <span>Receipt</span>
                            <ExternalLink size={11} />
                          </button>
                        ) : (
                          <span className="text-muted fs-8">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No payments found in your account history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="modal show d-block bg-dark bg-opacity-50" tabIndex="-1" role="dialog" id="receipt-modal">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content rounded-4 border-0 shadow-lg p-4 bg-white" id="printable-receipt-card">
              <div className="text-center mb-3">
                <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '56px', height: '56px' }}>
                  <CheckCircle size={28} />
                </div>
                <h5 className="fw-black text-dark mb-0">SkillsConnect Ghana</h5>
                <span className="text-muted fs-8">Official Payment Receipt</span>
              </div>

              <div className="bg-light rounded-3 p-3 border mb-3 text-start fs-8">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Transaction Ref:</span>
                  <strong className="fw-mono text-dark">{selectedReceipt.reference}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Amount Paid:</span>
                  <strong className="text-success fs-6">GHS {Number(selectedReceipt.amount).toFixed(2)}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Channel:</span>
                  <span className="text-capitalize text-dark fw-medium">{selectedReceipt.channel || 'Paystack / MoMo'}</span>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Status:</span>
                  <span className="badge bg-success text-white">SUCCESS / VERIFIED</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Verified Date:</span>
                  <span className="text-dark">{selectedReceipt.verified_at ? new Date(selectedReceipt.verified_at).toLocaleString() : new Date(selectedReceipt.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="d-flex gap-2 justify-content-end">
                <button onClick={handlePrintReceipt} className="btn btn-outline-primary rounded-pill px-3 py-1.5 fw-bold fs-8 d-inline-flex align-items-center gap-1">
                  <Printer size={14} />
                  <span>Print Receipt</span>
                </button>
                <button onClick={() => setSelectedReceipt(null)} className="btn btn-secondary rounded-pill px-3 py-1.5 fw-bold fs-8">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

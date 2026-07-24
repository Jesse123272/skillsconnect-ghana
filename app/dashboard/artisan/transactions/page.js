'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CreditCard, CheckCircle, Clock, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ArtisanTransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    let isMounted = true;
    async function loadTransactions() {
      setLoading(true);
      try {
        const res = await fetch(`/api/payments?status=${filterStatus}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && isMounted) {
          setTransactions(data.data.transactions || []);
        } else if (isMounted) {
          toast.error(data.error || 'Failed to load earnings history.');
        }
      } catch (err) {
        console.error('Artisan transactions fetch error:', err);
        if (isMounted) toast.error('Network error loading earnings.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTransactions();
    return () => { isMounted = false; };
  }, [filterStatus]);

  const totalEarningsGhs = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const successCount = transactions.filter(t => t.status === 'success').length;

  return (
    <DashboardLayout pageTitle="Earnings & Payments Received">
      {/* Metrics Row */}
      <div className="row g-3 mb-4 text-dark" id="artisan-earnings-stats">
        <div className="col-md-6">
          <div className="card shadow-sm border bg-white p-3.5 d-flex flex-row align-items-center gap-3 rounded-3">
            <div className="p-3 bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px' }}>
              <DollarSign size={26} />
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Total Verified Service Earnings</span>
              <h3 className="fw-black text-dark mb-0">GHS {totalEarningsGhs.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow-sm border bg-white p-3.5 d-flex flex-row align-items-center gap-3 rounded-3">
            <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '52px', height: '52px' }}>
              <CheckCircle size={26} />
            </div>
            <div>
              <span className="text-muted small d-block fw-semibold">Completed Customer Payments</span>
              <h3 className="fw-black text-dark mb-0">{successCount} Jobs Paid</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <ul className="nav nav-pills gap-1" id="artisan-transactions-filter-pills">
          {[
            { key: 'all', label: 'All Received' },
            { key: 'success', label: 'Verified Paid' },
            { key: 'pending', label: 'Pending / Escrow' }
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
          <i className="fa-solid fa-mobile-screen-button text-success me-1"></i> Paystack Mobile Money Gateway
        </span>
      </div>

      {/* Main Table */}
      {loading ? (
        <LoadingSpinner message="Fetching earnings and transaction history..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark rounded-3 overflow-hidden" id="artisan-transactions-table-container">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: '13.5px' }}>
              <thead className="table-light border-bottom">
                <tr>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Channel</th>
                  <th>Reference</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((t) => (
                    <tr key={t.transaction_id}>
                      <td>
                        <strong className="d-block text-dark">{t.user_name || 'Customer'}</strong>
                        <span className="text-muted fs-8">{t.user_email}</span>
                      </td>
                      <td className="fw-bold text-success fs-6">
                        GHS {Number(t.amount).toFixed(2)}
                      </td>
                      <td className="text-capitalize text-secondary">
                        <span className="badge bg-light text-dark border">
                          <CreditCard size={12} className="me-1 text-primary" />
                          {t.channel ? t.channel.replace('_', ' ') : 'Paystack MoMo / Card'}
                        </span>
                      </td>
                      <td className="fw-mono text-muted text-uppercase fs-8">
                        {t.reference}
                      </td>
                      <td className="text-muted small">
                        <Calendar size={13} className="me-1" />
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td>
                        {t.status === 'success' ? (
                          <span className="badge bg-success text-white d-inline-flex align-items-center gap-1">
                            <CheckCircle size={11} /> Received
                          </span>
                        ) : (
                          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No incoming customer payments found in your records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

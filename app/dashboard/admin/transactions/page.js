'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  CreditCard, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Calendar
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function TransactionsLedger() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all'); // all, success, pending, failed
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadTransactions() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          status
        });

        const res = await fetch(`/api/payments?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setTransactions(data.data.transactions);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve transaction log.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error loading transaction ledger.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTransactions();
    return () => { active = false; };
  }, [page, status]);

  // Calculate simple stats directly during rendering (React Best Practice)
  const totalRevenue = transactions
    .filter(t => t.status === 'success')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const successCount = transactions.filter(t => t.status === 'success').length;
  const pendingCount = transactions.filter(t => t.status === 'pending').length;
  const failedCount = transactions.filter(t => t.status === 'failed' || t.status === 'cancelled').length;

  return (
    <DashboardLayout pageTitle="Payments & Escrow Ledger">
      {/* Metric Cards Row */}
      <div className="row g-3 mb-4 text-dark" id="transactions-metric-cards">
        <div className="col-md-3">
          <div className="card shadow-sm border bg-white p-3 d-flex flex-row align-items-center gap-3">
            <div className="p-2.5 bg-success bg-opacity-10 text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <DollarSign size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">Page Successful GHS</span>
              <h5 className="fw-bold mb-0">GHS {totalRevenue.toFixed(2)}</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border bg-white p-3 d-flex flex-row align-items-center gap-3">
            <div className="p-2.5 bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <CheckCircle size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">Successful Payments</span>
              <h5 className="fw-bold mb-0">{successCount} Verified</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border bg-white p-3 d-flex flex-row align-items-center gap-3">
            <div className="p-2.5 bg-warning bg-opacity-10 text-warning rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <Clock size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">Pending Escrows</span>
              <h5 className="fw-bold mb-0">{pendingCount} Active</h5>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card shadow-sm border bg-white p-3 d-flex flex-row align-items-center gap-3">
            <div className="p-2.5 bg-danger bg-opacity-10 text-danger rounded-3 d-flex align-items-center justify-content-center" style={{ width: '45px', height: '45px' }}>
              <XCircle size={22} />
            </div>
            <div>
              <span className="text-muted small d-block">Failed Attempts</span>
              <h5 className="fw-bold mb-0">{failedCount} Cancelled</h5>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <ul className="nav nav-tabs mb-4 text-dark" id="transactions-status-tabs">
        {[
          { key: 'all', label: 'All Transactions' },
          { key: 'success', label: 'Successful Payments' },
          { key: 'pending', label: 'Pending / Initialized' },
          { key: 'failed', label: 'Failed / Cancelled' }
        ].map((tab) => (
          <li key={tab.key} className="nav-item">
            <button 
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={`nav-link ${status === tab.key ? 'active fw-bold' : 'text-muted'}`}
            >
              {tab.label}
            </button>
          </li>
        ))}
      </ul>

      {/* Main Transactions List Table */}
      {loading ? (
        <LoadingSpinner message="Querying transaction records..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark" id="transactions-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Showing {transactions.length} of {totalItems} total audit logs</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Transaction Ref</th>
                  <th>Customer (User)</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Channel / Gateway</th>
                  <th>Payment Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((trans) => (
                    <tr key={trans.transaction_id}>
                      <td className="fw-mono text-muted text-uppercase" style={{ fontSize: '11.5px' }}>
                        {trans.reference}
                      </td>
                      <td>
                        <div>
                          <strong className="d-block text-dark">{trans.user_name}</strong>
                          <span className="text-muted small d-block" style={{ fontSize: '11px' }}>{trans.user_email}</span>
                        </div>
                      </td>
                      <td className="fw-bold text-dark">
                        GHS {Number(trans.amount).toFixed(2)}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {trans.currency || 'GHS'}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted text-capitalize text-dark fw-medium">
                          {trans.channel || 'Paystack / MoMo'}
                        </span>
                      </td>
                      <td>
                        <span className="small d-flex align-items-center gap-1">
                          <Calendar size={13} className="text-muted" />
                          <span>{new Date(trans.created_at).toLocaleString()}</span>
                        </span>
                      </td>
                      <td>
                        {trans.status === 'success' ? (
                          <span className="badge bg-success text-white d-inline-flex align-items-center gap-1">
                            <CheckCircle size={11} />
                            <span>Successful</span>
                          </span>
                        ) : trans.status === 'pending' ? (
                          <span className="badge bg-warning text-dark d-inline-flex align-items-center gap-1">
                            <Clock size={11} />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="badge bg-secondary text-white d-inline-flex align-items-center gap-1">
                            <XCircle size={11} />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No transactions matching filter criteria were located in platform database.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-3 border-top d-flex align-items-center justify-content-between">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <span className="small fw-medium text-dark">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

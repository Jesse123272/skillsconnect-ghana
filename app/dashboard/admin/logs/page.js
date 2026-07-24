'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ShieldCheck, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Calendar,
  RefreshCw,
  Globe
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SecurityAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter parameters
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Pre-configured system action lists
  const ACTIONS_LIST = [
    { key: 'user_login', label: 'User Login' },
    { key: 'user_register', label: 'User Registration' },
    { key: 'profile_create', label: 'Profile Creation' },
    { key: 'profile_update', label: 'Profile Update' },
    { key: 'approve_artisan', label: 'Artisan Approval' },
    { key: 'reject_artisan', label: 'Artisan Decline' },
    { key: 'payment_success', label: 'Payment Success' },
    { key: 'payment_failed', label: 'Payment Failed' },
    { key: 'review_create', label: 'Review Submission' },
    { key: 'enquiry_create', label: 'Enquiry Submission' }
  ];

  useEffect(() => {
    let active = true;
    async function loadLogs() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '15',
          search: searchQuery.trim(),
          action,
          startDate,
          endDate
        });

        const res = await fetch(`/api/admin/logs?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setLogs(data.data.logs);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve audit logs.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error building security database logs.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadLogs();
    return () => { active = false; };
  }, [page, action, startDate, endDate, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setAction('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <DashboardLayout pageTitle="System Audit & Security Logs">
      {/* Filtering panel */}
      <div className="card p-3 mb-4 border bg-white text-dark" id="logs-filters-panel">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="form-label fw-semibold small">Audit Search</label>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted p-2">
                <Search size={14} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 text-dark small" 
                placeholder="User, IP address, entity type..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-3">
            <label className="form-label fw-semibold small">Action Code</label>
            <select 
              className="form-select text-dark small" 
              value={action} 
              onChange={(e) => { setAction(e.target.value); setPage(1); }}
            >
              <option value="">All Platform Actions</option>
              {ACTIONS_LIST.map((act) => (
                <option key={act.key} value={act.key}>{act.label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold small">Start Date</label>
            <input 
              type="date" 
              className="form-control text-dark small"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
            />
          </div>

          <div className="col-md-2">
            <label className="form-label fw-semibold small">End Date</label>
            <input 
              type="date" 
              className="form-control text-dark small"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
            />
          </div>

          <div className="col-md-2 d-flex gap-1.5 justify-content-end">
            <button type="submit" className="btn btn-primary w-full d-flex align-items-center justify-content-center gap-1">
              <Filter size={14} />
              <span>Filter</span>
            </button>
            <button 
              type="button" 
              onClick={handleResetFilters}
              className="btn btn-outline-secondary"
              title="Reset Filters"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Audit Table log */}
      {loading ? (
        <LoadingSpinner message="Searching security database archives..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark" id="logs-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Found {logs.length} of {totalItems} total logs</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 font-monospace" style={{ fontSize: '11.8px' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '80px' }}>Log ID</th>
                  <th style={{ width: '180px' }}>Timestamp</th>
                  <th style={{ width: '180px' }}>Action Reference</th>
                  <th>Authorized User</th>
                  <th style={{ width: '130px' }}>Role</th>
                  <th style={{ width: '150px' }}>Entity Type (ID)</th>
                  <th style={{ width: '130px' }}>IP / Agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.log_id}>
                      <td className="text-muted fw-bold">#{log.log_id}</td>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>
                        <span className="badge bg-light text-dark border px-2 py-1">
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <span className="fw-semibold text-dark">{log.user_name || 'Anonymous Visitor'}</span>
                      </td>
                      <td>
                        {log.user_role ? (
                          <span className={`badge ${
                            log.user_role === 'admin' ? 'bg-danger' : log.user_role === 'artisan' ? 'bg-success' : 'bg-primary'
                          } text-white text-capitalize`}>
                            {log.user_role}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <span className="text-capitalize text-muted">{log.entity_type || 'system'} ({log.entity_id || '-'})</span>
                      </td>
                      <td>
                        <span className="d-flex align-items-center gap-1 text-muted">
                          <Globe size={11} />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No security logs recorded for the selected search attributes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          {totalPages > 1 && (
            <div className="p-3 border-top d-flex align-items-center justify-content-between">
              <button 
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 font-sans"
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>
              <span className="small fw-medium text-dark font-sans">Page {page} of {totalPages}</span>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 font-sans"
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

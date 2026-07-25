'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AnalyticsOverview from '@/components/AnalyticsOverview';
import { 
  Users, 
  Briefcase, 
  Star, 
  AlertTriangle, 
  ChevronRight, 
  Check, 
  X,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [artisanToReject, setArtisanToReject] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stats', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.error || 'Failed to load dashboard metrics.');
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      toast.error('Network error loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchStats();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [fetchStats]);

  const handleApprove = async (id, name) => {
    if (!confirm(`Are you sure you want to approve ${name} as a professional artisan?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} has been approved and listing activated!`);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to approve artisan.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error processing approval.');
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (artisan) => {
    setArtisanToReject(artisan);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    const id = artisanToReject.user_id;
    const name = artisanToReject.full_name;
    setProcessingId(id);
    setShowRejectModal(false);

    try {
      const res = await fetch(`/api/admin/reject-artisan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artisan_id: id, reason: rejectReason }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application for ${name} has been rejected.`);
        fetchStats();
      } else {
        toast.error(data.error || 'Failed to reject artisan.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error processing rejection.');
    } finally {
      setProcessingId(null);
      setArtisanToReject(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Admin Dashboard">
        <LoadingSpinner message="Gathering latest system statistics..." />
      </DashboardLayout>
    );
  }

  const barData = {
    labels: stats?.new_registrations_6m?.labels || [],
    datasets: [
      {
        label: 'New Registrations',
        data: stats?.new_registrations_6m?.data || [],
        backgroundColor: '#198754', // BS Success Green
        borderRadius: 4,
      },
    ],
  };

  const doughnutData = {
    labels: stats?.artisans_by_category?.labels || [],
    datasets: [
      {
        data: stats?.artisans_by_category?.data || [],
        backgroundColor: [
          '#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', 
          '#fd7e14', '#20c997', '#0dcaf0', '#343a40', '#6c757d'
        ],
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: stats?.enquiries_per_month?.labels || [],
    datasets: [
      {
        label: 'Platform Enquiries',
        data: stats?.enquiries_per_month?.data || [],
        borderColor: '#0d6efd', // BS Primary Blue
        backgroundColor: 'rgba(13, 110, 253, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#0d6efd'
      },
    ],
  };

  return (
    <DashboardLayout pageTitle="Admin Dashboard Home">
      <div className="mb-4">
        <AnalyticsOverview />
      </div>

      {/* QUICK ACTIONS */}
      <div className="row g-3 mb-4" id="admin-quick-actions">
        <div className="col-12 col-md-4">
          <Link href="/dashboard/admin/artisans?status=Pending" className="card quick-action-card rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <span className="text-muted fs-8 text-uppercase fw-semibold">Review</span>
                <h6 className="fw-bold text-dark mb-0">Pending Artisan Applications</h6>
              </div>
              <div className="icon-box">
                <i className="fa-solid fa-user-check text-danger"></i>
              </div>
            </div>
            <p className="text-muted fs-8 mb-0">Approve or decline new artisans quickly to keep the marketplace active.</p>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link href="/dashboard/admin/reports" className="card quick-action-card rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <span className="text-muted fs-8 text-uppercase fw-semibold">Monitor</span>
                <h6 className="fw-bold text-dark mb-0">Platform Reports</h6>
              </div>
              <div className="icon-box">
                <i className="fa-solid fa-chart-pie text-primary"></i>
              </div>
            </div>
            <p className="text-muted fs-8 mb-0">Inspect performance indicators and compliance trends in one place.</p>
          </Link>
        </div>
        <div className="col-12 col-md-4">
          <Link href="/dashboard/admin/categories" className="card quick-action-card rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <span className="text-muted fs-8 text-uppercase fw-semibold">Manage</span>
                <h6 className="fw-bold text-dark mb-0">Categories</h6>
              </div>
              <div className="icon-box">
                <i className="fa-solid fa-folder-plus text-success"></i>
              </div>
            </div>
            <p className="text-muted fs-8 mb-0">Keep service categories up to date for better customer discovery.</p>
          </Link>
        </div>
      </div>

      {/* ROW 1 - STAT CARDS */}
      <div className="row g-3 mb-4" id="stats-cards-row">
        {/* Total Users */}
        <div className="col-md-3">
          <div className="card h-100 border shadow-sm p-3 bg-white" id="stat-card-users">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Total Users</span>
                <h3 className="mb-0 mt-1 fw-bold text-dark">{stats?.total_users || 0}</h3>
              </div>
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
                <Users size={24} />
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <Link href="/dashboard/admin/customers" className="text-primary text-decoration-none small d-flex align-items-center gap-1">
                <span>Manage Users</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Total Artisans */}
        <div className="col-md-3">
          <div className="card h-100 border shadow-sm p-3 bg-white" id="stat-card-artisans">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Total Artisans</span>
                <h3 className="mb-0 mt-1 fw-bold text-dark">{stats?.total_artisans || 0}</h3>
              </div>
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-3">
                <Briefcase size={24} />
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <Link href="/dashboard/admin/artisans" className="text-success text-decoration-none small d-flex align-items-center gap-1">
                <span>Manage Artisans</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Total Reviews */}
        <div className="col-md-3">
          <div className="card h-100 border shadow-sm p-3 bg-white" id="stat-card-reviews">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Total Reviews</span>
                <h3 className="mb-0 mt-1 fw-bold text-dark">{stats?.total_reviews || 0}</h3>
              </div>
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-3">
                <Star size={24} />
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <Link href="/dashboard/admin/reviews" className="text-warning text-decoration-none small d-flex align-items-center gap-1">
                <span>View Moderation</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="col-md-3">
          <div className="card h-100 border shadow-sm p-3 bg-white" id="stat-card-pending">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-muted text-uppercase fw-semibold" style={{ fontSize: '11px' }}>Pending Approvals</span>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <h3 className="mb-0 fw-bold text-dark">{stats?.pending_approvals || 0}</h3>
                  {stats?.pending_approvals > 0 && (
                    <span className="badge bg-danger rounded-pill pulse">
                      {stats.pending_approvals} New
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-3">
                <AlertTriangle size={24} />
              </div>
            </div>
            <div className="mt-3 pt-2 border-top">
              <Link href="/dashboard/admin/artisans?status=Pending" className="text-danger text-decoration-none small d-flex align-items-center gap-1">
                <span>Pending Approvals</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 2 - CHARTS */}
      <div className="row g-4 mb-4" id="charts-row">
        {/* Left: Registrations Bar Chart */}
        <div className="col-md-6">
          <div className="card border shadow-sm p-4 bg-white h-100" id="registrations-chart-container">
            <h5 className="fw-bold mb-3 text-dark">New Registrations (Last 6 Months)</h5>
            <div style={{ height: '260px' }}>
              <Bar 
                data={barData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } }
                }} 
              />
            </div>
          </div>
        </div>

        {/* Right: Category Doughnut Chart */}
        <div className="col-md-6">
          <div className="card border shadow-sm p-4 bg-white h-100" id="categories-chart-container">
            <h5 className="fw-bold mb-3 text-dark">Artisans by Category</h5>
            <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center">
              <Doughnut 
                data={doughnutData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10 } } } }
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* ROW 3 - TABLES */}
      <div className="row g-4 mb-4" id="tables-row">
        {/* Left: Recent Registrations */}
        <div className="col-md-6">
          <div className="card border shadow-sm bg-white h-100" id="recent-registrations-container">
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="mb-0 fw-bold text-dark">Recent Registrations</h6>
              <Link href="/dashboard/admin/customers" className="btn btn-sm btn-link text-primary text-decoration-none p-0 small">
                View All
              </Link>
            </div>
            <div className="table-responsive p-2">
              <table className="table table-hover align-middle mb-0 text-dark small" style={{ fontSize: '12.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Region</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recent_registrations?.length > 0 ? (
                    stats.recent_registrations.map((user) => (
                      <tr key={user.user_id}>
                        <td className="fw-semibold">{user.full_name}</td>
                        <td>
                          <span className={`badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'artisan' ? 'bg-success' : 'bg-primary'} text-white`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{user.region || 'N/A'}</td>
                        <td>{new Date(user.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'} text-white`}>
                            {user.is_active ? 'Active' : 'Suspended'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No recent registrations.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pending Artisan Approvals */}
        <div className="col-md-6">
          <div className="card border shadow-sm bg-white h-100" id="pending-approvals-container">
            <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
              <h6 className="mb-0 fw-bold text-dark">Pending Artisan Approvals</h6>
              <Link href="/dashboard/admin/artisans?status=Pending" className="btn btn-sm btn-link text-danger text-decoration-none p-0 small">
                Approve Grid
              </Link>
            </div>
            <div className="table-responsive p-2">
              <table className="table table-hover align-middle mb-0 text-dark small" style={{ fontSize: '12.5px' }}>
                <thead className="table-light">
                  <tr>
                    <th>Artisan Name</th>
                    <th>Category</th>
                    <th>Region</th>
                    <th>Exp.</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.pending_artisan_approvals?.length > 0 ? (
                    stats.pending_artisan_approvals.map((artisan) => (
                      <tr key={artisan.user_id}>
                        <td>
                          <Link href={`/dashboard/admin/artisans/${artisan.user_id}`} className="text-primary text-decoration-none fw-semibold">
                            {artisan.full_name}
                          </Link>
                        </td>
                        <td>{artisan.category_name}</td>
                        <td>{artisan.region}</td>
                        <td>{artisan.years_experience} Yrs</td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-1">
                            <button 
                              disabled={processingId === artisan.user_id}
                              onClick={() => handleApprove(artisan.user_id, artisan.full_name)}
                              className="btn btn-sm btn-success p-1 d-flex align-items-center justify-content-center"
                              title="Approve Listing"
                              style={{ width: '28px', height: '28px' }}
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              disabled={processingId === artisan.user_id}
                              onClick={() => openRejectModal(artisan)}
                              className="btn btn-sm btn-danger p-1 d-flex align-items-center justify-content-center"
                              title="Decline Listing"
                              style={{ width: '28px', height: '28px' }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">No pending approvals at this time. 🇬🇭🎉</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ROW 4 - ENQUIRIES CHART */}
      <div className="row" id="enquiries-chart-row">
        <div className="col-12">
          <div className="card border shadow-sm p-4 bg-white" id="enquiries-line-chart-container">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold mb-0 text-dark">Platform Enquiries (Last 6 Months)</h5>
              <div className="p-2 bg-primary bg-opacity-10 text-primary rounded-3 small">
                <MessageSquare size={16} />
              </div>
            </div>
            <div style={{ height: '260px' }}>
              <Line 
                data={lineData} 
                options={{ 
                  responsive: true, 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                      grid: { display: false }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* REJECTION REASON MODAL */}
      {showRejectModal && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Decline Artisan Listing Application</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <form onSubmit={handleRejectSubmit}>
                <div className="modal-body">
                  <p className="small text-muted">
                    Please provide a comprehensive and clear reason for rejecting <strong>{artisanToReject?.full_name}</strong>&rsquo;s application. An automated Ghanaian email notice containing these details will be transmitted to them.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Reason for Decline</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      required
                      placeholder="e.g., The business address provided does not match our validation criteria, or proof of trade certification was expired..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowRejectModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger">Confirm Decline & Remove</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ShieldAlert, 
  Check, 
  X, 
  Trash2, 
  Activity, 
  MessageSquare, 
  Star,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UserDetail({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadUserDetail() {
      try {
        const res = await fetch(`/api/admin/users/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setDetail(data.data);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve user details.');
          router.push('/dashboard/admin/customers');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error loading user details.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUserDetail();
    return () => { active = false; };
  }, [id, triggerRefetch, router]);

  const handleToggleActive = async () => {
    setProcessing(true);
    const newStatus = !detail.user.is_active;
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User has been successfully ${newStatus ? 'activated' : 'suspended'}!`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating user status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you absolutely sure you want to permanently delete the account for ${detail?.user?.full_name}? This will remove all their system associations, which is irreversible.`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User account permanently deleted successfully!');
        router.push('/dashboard/admin/customers');
      } else {
        toast.error(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting user account.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="User Detail">
        <LoadingSpinner message="Retrieving citizen records..." />
      </DashboardLayout>
    );
  }

  const user = detail?.user;
  const activityLogs = detail?.activityLogs || [];
  const reviews = detail?.reviews || [];
  const enquiries = detail?.enquiries || [];

  return (
    <DashboardLayout pageTitle={`User Workspace - SCG-${user?.user_id}`}>
      {/* Header Panel */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom text-dark">
        <Link href="/dashboard/admin/customers" className="btn btn-outline-secondary d-flex align-items-center gap-1">
          <ArrowLeft size={16} />
          <span>Back to Users</span>
        </Link>
        <div className="d-flex gap-2">
          {user?.is_active === 0 ? (
            <span className="badge bg-secondary text-white fs-6 py-2 px-3">Suspended Account</span>
          ) : (
            <span className="badge bg-success text-white fs-6 py-2 px-3">Active Account</span>
          )}
        </div>
      </div>

      <div className="row g-4 text-dark" id="user-workspace-row">
        {/* LEFT COLUMN: User Metadata Info cards */}
        <div className="col-lg-4">
          <div className="card shadow-sm border p-4 bg-white mb-4" id="user-primary-info-card">
            <div className="text-center pb-3 border-bottom">
              <div 
                className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold mx-auto mb-3"
                style={{ width: '80px', height: '80px', fontSize: '24px' }}
              >
                {user?.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <h5 className="fw-bold mb-1 text-dark">{user?.full_name}</h5>
              <span className={`badge ${user?.role === 'admin' ? 'bg-danger' : user?.role === 'artisan' ? 'bg-success' : 'bg-primary'} text-white`}>
                {user?.role}
              </span>
            </div>

            <div className="d-flex flex-column gap-3 mt-3">
              <div className="d-flex align-items-center gap-2 text-muted">
                <Mail size={16} className="text-primary" />
                <span className="text-truncate" style={{ fontSize: '13.5px' }}>{user?.email}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <Phone size={16} className="text-primary" />
                <span style={{ fontSize: '13.5px' }}>{user?.phone || 'No phone number provided'}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <MapPin size={16} className="text-primary" />
                <span style={{ fontSize: '13.5px' }}>{user?.region ? `${user.region} Region` : 'No Region'} &mdash; {user?.district || 'Ghana'}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <Calendar size={16} className="text-primary" />
                <span style={{ fontSize: '13.5px' }}>Joined on: {new Date(user?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-muted">
                <Clock size={16} className="text-primary" />
                <span style={{ fontSize: '13.5px' }}>Last Login: {user?.last_login ? new Date(user.last_login).toLocaleString() : 'Never logged in'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          {user?.role !== 'admin' && (
            <div className="card shadow-sm border p-4 bg-white" id="user-moderation-card">
              <h6 className="fw-bold mb-3 text-dark">Moderation Console</h6>
              <div className="d-flex flex-column gap-2">
                {user?.is_active ? (
                  <button 
                    disabled={processing}
                    onClick={handleToggleActive}
                    className="btn btn-outline-danger py-2 w-full d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <X size={16} />
                    <span>Suspend User Account</span>
                  </button>
                ) : (
                  <button 
                    disabled={processing}
                    onClick={handleToggleActive}
                    className="btn btn-success py-2 w-full d-flex align-items-center justify-content-center gap-1.5 text-white fw-medium"
                  >
                    <Check size={16} />
                    <span>Re-activate User Account</span>
                  </button>
                )}

                <button 
                  disabled={processing}
                  onClick={handleDeleteUser}
                  className="btn btn-danger py-2 w-full d-flex align-items-center justify-content-center gap-1.5"
                >
                  <Trash2 size={16} />
                  <span>Permanently Delete Account</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Interaction Tabulations & Activity Log */}
        <div className="col-lg-8">
          {/* Tabs header info */}
          <ul className="nav nav-pills mb-3 border p-1 rounded-3 bg-white" id="pills-tab" role="tablist">
            <li className="nav-item" role="presentation">
              <button className="nav-link active py-2 px-3 fw-medium" id="pills-logs-tab" data-bs-toggle="pill" data-bs-target="#pills-logs" type="button" role="tab" aria-controls="pills-logs" aria-selected="true">
                <Activity size={16} className="me-1.5 inline-block" />
                <span>Activity Logs ({activityLogs.length})</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link py-2 px-3 fw-medium" id="pills-reviews-tab" data-bs-toggle="pill" data-bs-target="#pills-reviews" type="button" role="tab" aria-controls="pills-reviews" aria-selected="false">
                <Star size={16} className="me-1.5 inline-block" />
                <span>Reviews ({reviews.length})</span>
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button className="nav-link py-2 px-3 fw-medium" id="pills-enquiries-tab" data-bs-toggle="pill" data-bs-target="#pills-enquiries" type="button" role="tab" aria-controls="pills-enquiries" aria-selected="false">
                <MessageSquare size={16} className="me-1.5 inline-block" />
                <span>Enquiries ({enquiries.length})</span>
              </button>
            </li>
          </ul>

          {/* Tabs Body Content */}
          <div className="tab-content" id="pills-tabContent">
            {/* Tab 1: Activity Logs */}
            <div className="tab-pane fade show active" id="pills-logs" role="tabpanel" aria-labelledby="pills-logs-tab">
              <div className="card shadow-sm border bg-white p-4">
                <h6 className="fw-bold mb-3">User Audit Trail & logs</h6>
                {activityLogs.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 text-dark small" style={{ fontSize: '12.5px' }}>
                      <thead className="table-light">
                        <tr>
                          <th>Timestamp</th>
                          <th>Action Code</th>
                          <th>Entity Class</th>
                          <th>IP Address</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activityLogs.map((log) => (
                          <tr key={log.log_id}>
                            <td>{new Date(log.created_at).toLocaleString()}</td>
                            <td>
                              <span className="badge bg-light text-dark border font-semibold">
                                {log.action}
                              </span>
                            </td>
                            <td>
                              <span className="text-capitalize">{log.entity_type} (ID:{log.entity_id})</span>
                            </td>
                            <td>{log.ip_address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted small mb-0 py-3 text-center">No audit logs logged in database yet.</p>
                )}
              </div>
            </div>

            {/* Tab 2: Reviews */}
            <div className="tab-pane fade" id="pills-reviews" role="tabpanel" aria-labelledby="pills-reviews-tab">
              <div className="card shadow-sm border bg-white p-4">
                <h6 className="fw-bold mb-3">{user?.role === 'customer' ? 'Reviews Written' : 'Reviews Received'}</h6>
                {reviews.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {reviews.map((rev) => (
                      <div key={rev.review_id} className="p-3 border rounded-3 bg-light">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="fw-semibold text-dark">
                            {user?.role === 'customer' ? `To: ${rev.artisan_name}` : `From: ${rev.customer_name}`}
                          </span>
                          <span className={`badge ${rev.is_approved ? 'bg-success' : 'bg-danger'} text-white`}>
                            {rev.is_approved ? 'Approved' : 'Hidden'}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-1 text-warning mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < rev.rating ? 'fill-warning text-warning' : 'text-secondary'} 
                            />
                          ))}
                        </div>
                        <p className="text-muted small mb-0 leading-relaxed">
                          &ldquo;{rev.review_text}&rdquo;
                        </p>
                        <span className="text-muted d-block mt-2" style={{ fontSize: '10.5px' }}>
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0 py-3 text-center">No reviews written or received yet.</p>
                )}
              </div>
            </div>

            {/* Tab 3: Enquiries */}
            <div className="tab-pane fade" id="pills-enquiries" role="tabpanel" aria-labelledby="pills-enquiries-tab">
              <div className="card shadow-sm border bg-white p-4">
                <h6 className="fw-bold mb-3">{user?.role === 'customer' ? 'Enquiries Sent' : 'Enquiries Received'}</h6>
                {enquiries.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {enquiries.map((enq) => (
                      <div key={enq.enquiry_id} className="p-3 border rounded-3 bg-light">
                        <div className="d-flex align-items-center justify-content-between mb-1.5">
                          <span className="fw-semibold text-dark">
                            {user?.role === 'customer' ? `To Artisan: ${enq.artisan_name}` : `From Customer: ${enq.customer_name}`}
                          </span>
                          <span className={`badge ${enq.status === 'pending' ? 'bg-danger' : 'bg-success'} text-white`}>
                            {enq.status}
                          </span>
                        </div>
                        <h6 className="fw-bold mb-1" style={{ fontSize: '13px' }}>Subject: {enq.subject}</h6>
                        <p className="text-muted small mb-0 line-clamp-2">
                          &ldquo;{enq.message}&rdquo;
                        </p>
                        <span className="text-muted d-block mt-2" style={{ fontSize: '10.5px' }}>
                          {new Date(enq.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0 py-3 text-center">No platform enquiries sent or received yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

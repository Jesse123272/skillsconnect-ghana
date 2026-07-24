'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Star, 
  Eye, 
  ShieldCheck, 
  Award,
  Check, 
  X, 
  Trash2, 
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ArtisanDetail({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id } = resolvedParams;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadProfileDetail() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/artisans/${id}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setProfile(data.data);
        } else if (active) {
          toast.error(data.error || 'Failed to load profile details.');
          router.push('/dashboard/admin/artisans');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error loading artisan details.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfileDetail();
    return () => { active = false; };
  }, [id, router, triggerRefetch]);

  const handleApproveProfile = async () => {
    if (!confirm('Approve this artisan application?')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Artisan profile has been approved and activated!');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to approve artisan.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error processing approval.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectProfileSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('Please specify a rejection reason.');
      return;
    }
    setProcessing(true);
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
        toast.success('Artisan application declined and account removed.');
        router.push('/dashboard/admin/artisans');
      } else {
        toast.error(data.error || 'Failed to decline application.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error processing decline.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (action) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Artisan has been ${action === 'suspend' ? 'suspended' : 'activated'} successfully!`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to change profile active status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating status.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleVerified = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !profile.is_verified }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Verification badge status toggled successfully!');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to toggle verification.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating verification.');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleFeatured = async () => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !profile.is_featured }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Featured listing status toggled successfully!');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to toggle featured status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating featured setting.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReviewModeration = async (reviewId, action) => {
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Review successfully ${action === 'approve' ? 'approved' : 'hidden'}!`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to moderate review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error moderating review.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Permanently delete this review? This is irreversible.')) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review permanently deleted successfully!');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to delete review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error deleting review.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!confirm(`Are you absolutely sure you want to permanently delete ${profile?.full_name}'s profile? All associated reviews, portfolio files, and gallery items will be purged.`)) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Artisan account permanently deleted successfully!');
        router.push('/dashboard/admin/artisans');
      } else {
        toast.error(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error processing permanent deletion.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout pageTitle="Artisan Detail">
        <LoadingSpinner message="Loading profile workspace..." />
      </DashboardLayout>
    );
  }

  const isPending = profile?.is_approved === 0;

  return (
    <DashboardLayout pageTitle={`Profile Workspace - ${profile?.full_name}`}>
      {/* Header section with back button */}
      <div className="d-flex align-items-center justify-content-between mb-4 pb-2 border-bottom text-dark">
        <Link href="/dashboard/admin/artisans" className="btn btn-outline-secondary d-flex align-items-center gap-1">
          <ArrowLeft size={16} />
          <span>Back to Artisans</span>
        </Link>
        <div className="d-flex gap-2">
          {profile?.is_active === 0 ? (
            <span className="badge bg-secondary text-white fs-6 py-2 px-3">Suspended</span>
          ) : isPending ? (
            <span className="badge bg-danger text-white fs-6 py-2 px-3">Pending Verification</span>
          ) : (
            <span className="badge bg-success text-white fs-6 py-2 px-3">Active Profile</span>
          )}
        </div>
      </div>

      <div className="row g-4 text-dark" id="artisan-workspace-row">
        {/* LEFT COLUMN: Profile Info Cards & Gallery */}
        <div className="col-lg-8">
          {/* Main Info Card */}
          <div className="card shadow-sm mb-4 border bg-white p-4">
            <div className="d-flex flex-column flex-sm-row gap-4 align-items-start align-items-sm-center">
              <div 
                className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold shadow-sm"
                style={{ width: '100px', height: '100px', fontSize: '32px', minWidth: '100px' }}
              >
                {profile?.full_name?.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase()}
              </div>
              <div className="flex-grow-1">
                <h3 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                  <span>{profile?.full_name}</span>
                  {profile?.is_verified === 1 && (
                    <ShieldCheck size={24} className="text-success fill-success" title="Verified Professional" />
                  )}
                  {profile?.is_featured === 1 && (
                    <Award size={24} className="text-warning fill-warning" title="Featured Listing" />
                  )}
                </h3>
                <p className="text-muted mb-2 d-flex align-items-center gap-2 small">
                  <Briefcase size={14} />
                  <span>Professional artisan profile</span>
                </p>
                <div className="d-flex flex-wrap gap-2">
                  <span className="badge bg-light text-dark border">Experience: {profile?.years_experience || 0} Yrs</span>
                  <span className="badge bg-light text-dark border">Category ID: {profile?.category_id}</span>
                </div>
              </div>
            </div>

            <hr className="my-4" />

            <h5 className="fw-bold mb-2">Artisan Biography</h5>
            <p className="text-muted leading-relaxed" style={{ fontSize: '14.5px' }}>
              {profile?.bio || 'This artisan has not provided a professional biography statement yet.'}
            </p>

            <h5 className="fw-bold mt-4 mb-2">Coverage Areas & Location</h5>
            <div className="d-flex align-items-center gap-2 text-muted mb-3">
              <MapPin size={16} className="text-primary" />
              <span>{profile?.region} Region &mdash; {profile?.district || 'Ghana'}</span>
            </div>
            <div className="d-flex flex-wrap gap-1.5">
              {profile?.service_areas?.length > 0 ? (
                profile.service_areas.map((area, i) => (
                  <span key={i} className="badge bg-primary bg-opacity-10 text-primary px-2.5 py-1.5 rounded-3 fw-medium">
                    {area}
                  </span>
                ))
              ) : (
                <span className="text-muted small">No specific neighborhood boundaries specified.</span>
              )}
            </div>
          </div>

          {/* Portfolio & Images Section */}
          <div className="card shadow-sm mb-4 border bg-white p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <ImageIcon size={20} className="text-muted" />
              <span>Portfolio Showcase & Showcase Items</span>
            </h5>
            {profile?.portfolio?.length > 0 ? (
              <div className="row g-3">
                {profile.portfolio.map((item) => (
                  <div key={item.item_id} className="col-md-6">
                    <div className="card h-100 border rounded-3 overflow-hidden">
                      <div className="bg-light p-5 text-center text-muted border-bottom position-relative" style={{ minHeight: '140px' }}>
                        <ImageIcon size={32} className="mx-auto mb-2 text-secondary" />
                        <span className="small d-block">Showcase Artwork Image</span>
                        <span className="text-muted d-block small mt-1" style={{ fontSize: '11px' }}>{item.image_path}</span>
                      </div>
                      <div className="p-3">
                        <h6 className="fw-bold mb-1 text-dark text-truncate">{item.caption}</h6>
                        <p className="text-muted small mb-0 line-clamp-2">{item.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-0 py-2">No portfolio showcases loaded by this artisan yet.</p>
            )}
          </div>

          {/* Customer Reviews Moderation */}
          <div className="card shadow-sm border bg-white p-4">
            <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
              <MessageSquare size={20} className="text-muted" />
              <span>Reviews Moderation Panel</span>
            </h5>
            {profile?.reviews?.length > 0 ? (
              <div className="d-flex flex-column gap-3">
                {profile.reviews.map((rev) => (
                  <div key={rev.review_id} className="p-3 border rounded-3 bg-light">
                    <div className="d-flex align-items-start justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark">{rev.customer_name}</span>
                        <div className="d-flex align-items-center gap-1 text-warning mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < rev.rating ? 'fill-warning text-warning' : 'text-secondary'} 
                            />
                          ))}
                          <span className="text-muted small ms-1">({rev.rating} Stars)</span>
                        </div>
                      </div>
                      <span className={`badge ${rev.is_approved ? 'bg-success' : 'bg-danger'} text-white`}>
                        {rev.is_approved ? 'Approved' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-muted small mt-2 mb-3 leading-relaxed">
                      &ldquo;{rev.review_text}&rdquo;
                    </p>
                    <div className="d-flex justify-content-end gap-1">
                      {rev.is_approved === 0 ? (
                        <button 
                          disabled={processing}
                          onClick={() => handleReviewModeration(rev.review_id, 'approve')}
                          className="btn btn-sm btn-success px-2 py-1 text-white d-flex align-items-center gap-1"
                          style={{ fontSize: '11.5px' }}
                        >
                          <Check size={12} />
                          <span>Approve Review</span>
                        </button>
                      ) : (
                        <button 
                          disabled={processing}
                          onClick={() => handleReviewModeration(rev.review_id, 'hide')}
                          className="btn btn-sm btn-outline-danger px-2 py-1 d-flex align-items-center gap-1"
                          style={{ fontSize: '11.5px' }}
                        >
                          <X size={12} />
                          <span>Hide Review</span>
                        </button>
                      )}
                      <button 
                        disabled={processing}
                        onClick={() => handleDeleteReview(rev.review_id)}
                        className="btn btn-sm btn-danger px-2 py-1 text-white d-flex align-items-center gap-1"
                        style={{ fontSize: '11.5px' }}
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted small mb-0 py-2">No reviews left for this artisan yet.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Moderation Controls panel */}
        <div className="col-lg-4">
          {/* Quick Metrics */}
          <div className="card shadow-sm border p-4 bg-white mb-4" id="artisan-metrics-card">
            <h5 className="fw-bold mb-3">Artisan Telemetry</h5>
            <div className="d-flex flex-column gap-3">
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted small">Profile Views</span>
                <span className="fw-semibold d-flex align-items-center gap-1">
                  <Eye size={14} className="text-muted" />
                  <span>{profile?.profile_views || 0} Views</span>
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted small">Overall Score</span>
                <span className="fw-semibold d-flex align-items-center gap-1">
                  <Star size={14} className="text-warning fill-warning" />
                  <span>{Number(profile?.average_rating || 0).toFixed(1)} / 5.0</span>
                </span>
              </div>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-2">
                <span className="text-muted small">Written Reviews</span>
                <span className="fw-semibold">{profile?.total_reviews || 0} Reviews</span>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span className="text-muted small">Join Timestamp</span>
                <span className="fw-semibold small d-flex align-items-center gap-1">
                  <Calendar size={14} className="text-muted" />
                  <span>{new Date(profile?.created_at || profile?.user_created_at).toLocaleDateString()}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Main Verification Actions */}
          <div className="card shadow-sm border p-4 bg-white" id="artisan-moderation-card">
            <h5 className="fw-bold mb-3">Moderation Console</h5>

            {isPending ? (
              <div className="d-flex flex-column gap-2 mb-4">
                <div className="alert alert-danger p-3 mb-0 small">
                  <strong>Pending Verification:</strong> This trade listing is inactive and cannot be located by customers.
                </div>
                <button 
                  disabled={processing}
                  onClick={handleApproveProfile}
                  className="btn btn-success py-2 w-full d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                >
                  <Check size={18} />
                  <span>Approve Profile & Listing</span>
                </button>
                <button 
                  disabled={processing}
                  onClick={() => setShowRejectModal(true)}
                  className="btn btn-outline-danger py-2 w-full d-flex align-items-center justify-content-center gap-1.5"
                >
                  <X size={18} />
                  <span>Decline & Remove</span>
                </button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-4">
                {profile?.is_active === 1 ? (
                  <button 
                    disabled={processing}
                    onClick={() => handleToggleActive('suspend')}
                    className="btn btn-outline-danger py-2 w-full d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <X size={18} />
                    <span>Suspend Listing Profile</span>
                  </button>
                ) : (
                  <button 
                    disabled={processing}
                    onClick={() => handleToggleActive('activate')}
                    className="btn btn-success text-white py-2 w-full d-flex align-items-center justify-content-center gap-1.5 fw-semibold"
                  >
                    <Check size={18} />
                    <span>Activate Listing Profile</span>
                  </button>
                )}
              </div>
            )}

            <hr className="my-3" />

            {/* Badges Toggles */}
            <div className="d-flex flex-column gap-2 mb-4">
              <button 
                disabled={processing}
                onClick={handleToggleVerified}
                className={`btn py-2.5 w-full d-flex align-items-center justify-content-center gap-2 border ${
                  profile?.is_verified ? 'btn-success bg-success text-white' : 'btn-outline-secondary'
                }`}
              >
                <ShieldCheck size={18} />
                <span>{profile?.is_verified ? 'Verified Citizen Account' : 'Verify Artisan Profile'}</span>
              </button>

              <button 
                disabled={processing}
                onClick={handleToggleFeatured}
                className={`btn py-2.5 w-full d-flex align-items-center justify-content-center gap-2 border ${
                  profile?.is_featured ? 'btn-warning bg-warning text-dark fw-medium' : 'btn-outline-secondary'
                }`}
              >
                <Award size={18} />
                <span>{profile?.is_featured ? 'Featured System Profile' : 'Feature Artisan Profile'}</span>
              </button>
            </div>

            <hr className="my-3" />

            {/* Delete Block */}
            <button 
              disabled={processing}
              onClick={handleDeleteProfile}
              className="btn btn-danger py-2.5 w-full d-flex align-items-center justify-content-center gap-2"
            >
              <Trash2 size={16} />
              <span>Permanently Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* DECLINE APPLICATION MODAL */}
      {showRejectModal && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">Decline Artisan Listing Application</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowRejectModal(false)}></button>
              </div>
              <form onSubmit={handleRejectProfileSubmit}>
                <div className="modal-body">
                  <p className="small text-muted">
                    State the specific details regarding this decline decision. These elements are emailed directly to the artisan.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Decline Reason</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      required
                      placeholder="e.g., The official trade certification uploaded did not match the provided profile names, or was expired."
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

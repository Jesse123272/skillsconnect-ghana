'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Search, 
  Filter, 
  Check, 
  X, 
  Trash2, 
  Star, 
  ShieldCheck, 
  Award,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageArtisans() {
  return (
    <Suspense fallback={<DashboardLayout role="admin"><div className="p-5 text-center"><LoadingSpinner /></div></DashboardLayout>}>
      <ManageArtisansContent />
    </Suspense>
  );
}

function ManageArtisansContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters state
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [categoryId, setCategoryId] = useState('');
  const [region, setRegion] = useState('');

  // Data & Pagination state
  const [artisans, setArtisans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  // Modals / Action states
  const [processingId, setProcessingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [artisanToReject, setArtisanToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // List of Ghana's regions
  const GH_REGIONS = [
    'Greater Accra', 'Ashanti', 'Eastern', 'Western', 'Central', 
    'Volta', 'Northern', 'Upper East', 'Upper West', 'Bono', 
    'Bono East', 'Ahafo', 'Savannah', 'North East', 'Oti', 'Western North'
  ];

  // Fetch Categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch('/api/admin/categories');
        const data = await res.json();
        if (data.success) {
          setCategories(data.data);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    let active = true;
    async function loadArtisans() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchQuery.trim(),
          status,
          category_id: categoryId,
          region
        });

        const res = await fetch(`/api/admin/artisans?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setArtisans(data.data.artisans);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to load artisans list.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error while retrieving artisans.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadArtisans();
    return () => { active = false; };
  }, [page, status, categoryId, region, searchQuery, triggerRefetch]);

  // Handle Search Trigger
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  // Quick Action Toggles
  const handleToggleFeature = async (id, name, currentValue) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !currentValue }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} ${!currentValue ? 'featured' : 'unfeatured'} successfully!`);
        // update local list
        setArtisans(artisans.map(a => a.user_id === id ? { ...a, is_featured: !currentValue ? 1 : 0 } : a));
      } else {
        toast.error(data.error || 'Failed to update feature status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleVerify = async (id, name, currentValue) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_verified: !currentValue }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} verification status updated successfully!`);
        setArtisans(artisans.map(a => a.user_id === id ? { ...a, is_verified: !currentValue ? 1 : 0 } : a));
      } else {
        toast.error(data.error || 'Failed to update verification status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error updating profile verification.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleStatusChange = async (id, name, action) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/artisans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${name} has been ${action === 'suspend' ? 'suspended' : 'activated'} successfully!`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to change artisan status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating artisan status.');
    } finally {
      setProcessingId(null);
    }
  };

  // Direct approval
  const handleApprove = async (id, name) => {
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
        toast.success(`${name} has been approved and activated!`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to approve artisan.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during approval.');
    } finally {
      setProcessingId(null);
    }
  };

  // Rejection
  const openRejectModal = (artisan) => {
    setArtisanToReject(artisan);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }
    const id = artisanToReject.user_id;
    const name = artisanToReject.full_name;
    setProcessingId(id);
    setShowRejectModal(false);

    try {
      const res = await fetch('/api/admin/reject-artisan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artisan_id: id, reason: rejectReason }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Application for ${name} has been rejected.`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to reject application.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during rejection.');
    } finally {
      setProcessingId(null);
      setArtisanToReject(null);
    }
  };

  // Deletion Confirmation Modal trigger
  const confirmDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setProcessingId(deleteId);
    try {
      const res = await fetch(`/api/admin/artisans/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Artisan account ${deleteName} deleted successfully.`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to delete artisan.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while deleting account.');
    } finally {
      setProcessingId(null);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  return (
    <DashboardLayout pageTitle="Manage Artisan Listings">
      {/* Search and Filters panel */}
      <div className="card p-3 mb-4 border bg-white" id="artisans-filters-card">
        <form onSubmit={handleSearchSubmit} className="row g-3">
          <div className="col-md-3">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 text-dark" 
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-2">
            <select 
              className="form-select text-dark" 
              value={status} 
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending Approval</option>
              <option value="Approved">Approved Listings</option>
              <option value="Suspended">Suspended Users</option>
            </select>
          </div>

          <div className="col-md-3">
            <select 
              className="form-select text-dark" 
              value={categoryId} 
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-2">
            <select 
              className="form-select text-dark" 
              value={region} 
              onChange={(e) => { setRegion(e.target.value); setPage(1); }}
            >
              <option value="">All Regions</option>
              {GH_REGIONS.map((r) => (
                <option key={r} value={r}>{r} Region</option>
              ))}
            </select>
          </div>

          <div className="col-md-2 d-grid">
            <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2">
              <Filter size={16} />
              <span>Apply Filters</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Table section */}
      {loading ? (
        <LoadingSpinner message="Retrieving registered Ghanaian artisans..." />
      ) : (
        <div className="card border shadow-sm bg-white" id="artisans-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Showing {artisans.length} of {totalItems} total artisan listings</span>
          </div>
          
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-dark small" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Artisan Profile</th>
                  <th>Category</th>
                  <th>Region / District</th>
                  <th>Exp</th>
                  <th>Ratings / Reviews</th>
                  <th>Verify</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th className="text-end" style={{ minWidth: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {artisans.length > 0 ? (
                  artisans.map((artisan) => (
                    <tr key={artisan.user_id}>
                      <td>
                        <div>
                          <Link 
                            href={`/dashboard/admin/artisans/${artisan.user_id}`} 
                            className="text-primary text-decoration-none fw-semibold d-block"
                          >
                            {artisan.full_name}
                          </Link>
                          <span className="text-muted d-block" style={{ fontSize: '11px' }}>{artisan.email}</span>
                          <span className="text-muted d-block" style={{ fontSize: '11px' }}>{artisan.phone || 'No Phone'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {artisan.category_name || 'Unassigned'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className="d-block fw-medium">{artisan.region}</span>
                          <span className="text-muted d-block text-truncate" style={{ fontSize: '11px', maxWidth: '120px' }}>
                            {artisan.district || 'Ghana'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold">{artisan.years_experience || 0} Yrs</span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1">
                          <Star size={14} className="text-warning fill-warning" />
                          <span className="fw-bold">{Number(artisan.average_rating || 0).toFixed(1)}</span>
                          <span className="text-muted" style={{ fontSize: '11px' }}>({artisan.total_reviews || 0})</span>
                        </div>
                      </td>
                      <td>
                        {/* Verify toggle */}
                        <button 
                          disabled={processingId === artisan.user_id}
                          onClick={() => handleToggleVerify(artisan.user_id, artisan.full_name, artisan.is_verified)}
                          className={`btn btn-sm ${artisan.is_verified ? 'btn-success bg-success' : 'btn-outline-secondary'} border rounded-3 p-1`}
                          title="Toggle Verification Badge"
                        >
                          <ShieldCheck size={16} />
                        </button>
                      </td>
                      <td>
                        {/* Feature toggle */}
                        <button 
                          disabled={processingId === artisan.user_id}
                          onClick={() => handleToggleFeature(artisan.user_id, artisan.full_name, artisan.is_featured)}
                          className={`btn btn-sm ${artisan.is_featured ? 'btn-warning bg-warning' : 'btn-outline-secondary'} border rounded-3 p-1`}
                          title="Toggle Featured Listing"
                        >
                          <Award size={16} />
                        </button>
                      </td>
                      <td>
                        {artisan.is_active === 0 ? (
                          <span className="badge bg-secondary text-white">Suspended</span>
                        ) : artisan.is_approved === 0 ? (
                          <span className="badge bg-danger text-white">Pending Approval</span>
                        ) : (
                          <span className="badge bg-success text-white">Approved</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {/* Approve option if pending */}
                          {artisan.is_approved === 0 && (
                            <>
                              <button 
                                disabled={processingId === artisan.user_id}
                                onClick={() => handleApprove(artisan.user_id, artisan.full_name)}
                                className="btn btn-sm btn-success p-1 text-white"
                                title="Approve Artisan"
                                style={{ width: '30px', height: '30px' }}
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                disabled={processingId === artisan.user_id}
                                onClick={() => openRejectModal(artisan)}
                                className="btn btn-sm btn-danger p-1 text-white"
                                title="Decline Artisan"
                                style={{ width: '30px', height: '30px' }}
                              >
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {/* Detail View */}
                          <Link 
                            href={`/dashboard/admin/artisans/${artisan.user_id}`} 
                            className="btn btn-sm btn-outline-primary p-1"
                            title="View / Moderation Center"
                            style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={14} />
                          </Link>

                          {/* Suspend/Activate Toggle */}
                          {artisan.is_approved === 1 && (
                            <button 
                              disabled={processingId === artisan.user_id}
                              onClick={() => handleStatusChange(
                                artisan.user_id, 
                                artisan.full_name, 
                                artisan.is_active ? 'suspend' : 'activate'
                              )}
                              className={`btn btn-sm ${artisan.is_active ? 'btn-outline-danger' : 'btn-success'} p-1`}
                              title={artisan.is_active ? "Suspend Artisan" : "Activate Artisan"}
                              style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {artisan.is_active ? <X size={14} /> : <Check size={14} />}
                            </button>
                          )}

                          {/* Delete option */}
                          <button 
                            disabled={processingId === artisan.user_id}
                            onClick={() => confirmDelete(artisan.user_id, artisan.full_name)}
                            className="btn btn-sm btn-danger p-1 text-white"
                            title="Delete Account Permanently"
                            style={{ width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">No professional artisans matching your filtering criteria were located.</td>
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
                    Specify the formal reason why <strong>{artisanToReject?.full_name}</strong>&rsquo;s application is rejected. An email detailing these items will be automatically dispatched.
                  </p>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Decline Reason</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      required
                      placeholder="e.g., The professional certification or utility address uploaded was not verifiable."
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

      {/* PERMANENT DELETION WARNING MODAL */}
      {showDeleteModal && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title">⚠️ Irreversible Account Deletion</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
              </div>
              <div className="modal-body">
                <p>
                  You are preparing to delete the artisan account for <strong>{deleteName}</strong> permanently.
                </p>
                <div className="alert alert-danger mb-0 small">
                  <strong>Critical Warning:</strong> This operation deletes user records and Cascades across all associated database listings (including active enquiries, reviews, portfolio work, and gallery items). This cannot be undone.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

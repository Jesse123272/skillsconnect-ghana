'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Star, 
  Check, 
  X, 
  Trash2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('All'); // All, Approved, Pending, Hidden
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadReviews() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchQuery.trim(),
          status
        });

        const res = await fetch(`/api/admin/reviews?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setReviews(data.data.reviews);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve reviews.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error while retrieving reviews.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadReviews();
    return () => { active = false; };
  }, [page, status, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  }

  const handleModeration = async (id, action) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Review successfully ${action === 'approve' ? 'approved' : 'hidden'}!`);
        fetchReviews();
      } else {
        toast.error(data.error || 'Failed to moderate review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during review moderation.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this review? This updates the artisan average rating and cannot be undone.')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Review permanently deleted successfully!');
        fetchReviews();
      } else {
        toast.error(data.error || 'Failed to delete review.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting review.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout pageTitle="Reviews Moderation Center">
      {/* Search and filter header */}
      <div className="card p-3 mb-4 border bg-white" id="reviews-filters-card">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 text-dark" 
                placeholder="Search by reviewer customer name, receiver artisan name, or review copy..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 d-grid">
            <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2">
              <Search size={16} />
              <span>Search Reviews</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter Tabs Row */}
      <ul className="nav nav-tabs mb-4 text-dark" id="reviews-status-tabs">
        {['All', 'Approved', 'Pending', 'Hidden'].map((tab) => (
          <li key={tab} className="nav-item">
            <button 
              onClick={() => { setStatus(tab); setPage(1); }}
              className={`nav-link ${status === tab ? 'active fw-bold' : 'text-muted'}`}
            >
              {tab} Reviews
            </button>
          </li>
        ))}
      </ul>

      {/* Main Reviews Grid table */}
      {loading ? (
        <LoadingSpinner message="Searching platform review logs..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark" id="reviews-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Found {reviews.length} of {totalItems} total reviews</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '180px' }}>Reviewer (Customer)</th>
                  <th style={{ width: '180px' }}>Artisan Profile</th>
                  <th style={{ width: '110px' }}>Rating</th>
                  <th>Review Details</th>
                  <th style={{ width: '120px' }}>Submitted</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th className="text-end" style={{ width: '130px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <tr key={rev.review_id}>
                      <td className="fw-semibold">{rev.customer_name}</td>
                      <td>
                        <Link href={`/dashboard/admin/artisans/${rev.artisan_id}`} className="text-primary text-decoration-none fw-semibold">
                          {rev.artisan_name}
                        </Link>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-0.5 text-warning">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={12} 
                              className={i < rev.rating ? 'fill-warning text-warning' : 'text-secondary'} 
                            />
                          ))}
                          <span className="text-muted small ms-1">({rev.rating})</span>
                        </div>
                      </td>
                      <td>
                        <div className="text-muted text-wrap text-break" style={{ maxWidth: '350px' }}>
                          &ldquo;{rev.review_text}&rdquo;
                        </div>
                      </td>
                      <td>
                        <span>{new Date(rev.created_at).toLocaleDateString()}</span>
                      </td>
                      <td>
                        <span className={`badge ${rev.is_approved ? 'bg-success' : 'bg-danger'} text-white`}>
                          {rev.is_approved ? 'Approved' : 'Hidden'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {rev.is_approved === 0 ? (
                            <button 
                              disabled={processingId === rev.review_id}
                              onClick={() => handleModeration(rev.review_id, 'approve')}
                              className="btn btn-sm btn-success p-1 text-white"
                              title="Approve / Publish Review"
                              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Check size={14} />
                            </button>
                          ) : (
                            <button 
                              disabled={processingId === rev.review_id}
                              onClick={() => handleModeration(rev.review_id, 'hide')}
                              className="btn btn-sm btn-outline-danger p-1"
                              title="Hide / Suspend Review"
                              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <X size={14} />
                            </button>
                          )}

                          <button 
                            disabled={processingId === rev.review_id}
                            onClick={() => handleDelete(rev.review_id)}
                            className="btn btn-sm btn-danger p-1 text-white"
                            title="Delete Review Permanently"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No citizen reviews match your active filter inputs.</td>
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

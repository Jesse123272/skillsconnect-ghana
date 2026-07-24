'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  MessageSquare, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Check, 
  X, 
  Trash2,
  Calendar,
  FileText
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageEnquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('All'); // All, pending, completed, rejected
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  // Modal View States
  const [viewEnquiry, setViewEnquiry] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    let active = true;
    async function loadEnquiries() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchQuery.trim(),
          status
        });

        const res = await fetch(`/api/admin/enquiries?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setEnquiries(data.data.enquiries);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve enquiries.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error while retrieving inquiries.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadEnquiries();
    return () => { active = false; };
  }, [page, status, searchQuery, triggerRefetch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleUpdateStatus = async (id, newStatus, notes = '') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_notes: notes }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Enquiry marked as ${newStatus} successfully!`);
        setShowViewModal(false);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to update enquiry status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during status update.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this enquiry record? This cannot be undone.')) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Enquiry record deleted successfully.');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to delete enquiry.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting enquiry.');
    } finally {
      setProcessingId(null);
    }
  };

  const openViewModal = (enq) => {
    setViewEnquiry(enq);
    setAdminNotes(enq.admin_notes || '');
    setShowViewModal(true);
  };

  return (
    <DashboardLayout pageTitle="Platform Enquiries Management">
      {/* Search and Filters panel */}
      <div className="card p-3 mb-4 border bg-white" id="enquiries-filters-card">
        <form onSubmit={handleSearchSubmit} className="row g-3 align-items-center">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 text-dark" 
                placeholder="Search by customer name, email, subject code, or message copy..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 d-grid">
            <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2">
              <Search size={16} />
              <span>Search Enquiries</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tabs Row */}
      <ul className="nav nav-tabs mb-4 text-dark" id="enquiries-status-tabs">
        {['All', 'pending', 'completed', 'rejected'].map((tab) => (
          <li key={tab} className="nav-item">
            <button 
              onClick={() => { setStatus(tab); setPage(1); }}
              className={`nav-link text-capitalize ${status === tab ? 'active fw-bold' : 'text-muted'}`}
            >
              {tab === 'pending' ? 'Pending' : tab === 'completed' ? 'Completed' : tab === 'rejected' ? 'Rejected' : 'All'} Enquiries
            </button>
          </li>
        ))}
      </ul>

      {/* Main Table Listing */}
      {loading ? (
        <LoadingSpinner message="Searching customer contact requests..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark" id="enquiries-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Found {enquiries.length} of {totalItems} total inquiries</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>Sender (Customer)</th>
                  <th>Target Artisan</th>
                  <th>Subject</th>
                  <th>Message Summary</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th className="text-end" style={{ minWidth: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enquiries.length > 0 ? (
                  enquiries.map((enq) => (
                    <tr key={enq.enquiry_id}>
                      <td className="fw-semibold">
                        <div>
                          <span className="d-block">{enq.customer_name}</span>
                          <span className="text-muted d-block small" style={{ fontSize: '11px' }}>{enq.customer_email}</span>
                        </div>
                      </td>
                      <td>
                        <Link href={`/dashboard/admin/artisans/${enq.artisan_id}`} className="text-primary text-decoration-none fw-semibold">
                          {enq.artisan_name}
                        </Link>
                      </td>
                      <td>
                        <span className="fw-medium text-dark">{enq.subject}</span>
                      </td>
                      <td>
                        <div className="text-muted text-truncate" style={{ maxWidth: '280px' }}>
                          {enq.message}
                        </div>
                      </td>
                      <td>
                        <span className="small d-flex align-items-center gap-1">
                          <Calendar size={13} className="text-muted" />
                          <span>{new Date(enq.created_at).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge text-capitalize ${
                          enq.status === 'completed' ? 'bg-success' : enq.status === 'rejected' ? 'bg-secondary' : 'bg-danger'
                        } text-white`}>
                          {enq.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {/* Quick View and Notes Modal */}
                          <button 
                            onClick={() => openViewModal(enq)}
                            className="btn btn-sm btn-outline-primary p-1"
                            title="View Message details & Notes"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={13} />
                          </button>

                          {/* Quick Actions to Approve */}
                          {enq.status === 'pending' && (
                            <>
                              <button 
                                disabled={processingId === enq.enquiry_id}
                                onClick={() => handleUpdateStatus(enq.enquiry_id, 'completed', 'Processed via quick action.')}
                                className="btn btn-sm btn-success p-1 text-white"
                                title="Mark Completed"
                                style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <Check size={13} />
                              </button>
                              <button 
                                disabled={processingId === enq.enquiry_id}
                                onClick={() => handleUpdateStatus(enq.enquiry_id, 'rejected', 'Declined via quick action.')}
                                className="btn btn-sm btn-outline-danger p-1"
                                title="Reject enquiry"
                                style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                <X size={13} />
                              </button>
                            </>
                          )}

                          {/* Delete enquiry permanently */}
                          <button 
                            disabled={processingId === enq.enquiry_id}
                            onClick={() => handleDelete(enq.enquiry_id)}
                            className="btn btn-sm btn-danger p-1 text-white"
                            title="Delete enquiry record"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No enquiries matching your active filter criteria were located.</td>
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

      {/* DETAILED MESSAGE DIALOG VIEW */}
      {showViewModal && viewEnquiry && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Enquiry Details &mdash; #{viewEnquiry.enquiry_id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowViewModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3 border-bottom pb-2">
                  <div className="row">
                    <div className="col-6">
                      <span className="text-muted small d-block">Sender Name</span>
                      <strong className="small">{viewEnquiry.customer_name}</strong>
                    </div>
                    <div className="col-6">
                      <span className="text-muted small d-block">Target Artisan</span>
                      <strong className="small text-primary">{viewEnquiry.artisan_name}</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-muted small d-block">Subject</span>
                  <strong style={{ fontSize: '14.5px' }}>{viewEnquiry.subject}</strong>
                </div>

                <div className="mb-3 p-3 bg-light rounded-3">
                  <span className="text-muted small d-block mb-1 border-bottom pb-1 fw-semibold">Message Copy</span>
                  <p className="small text-dark mb-0 leading-relaxed text-wrap text-break">
                    &ldquo;{viewEnquiry.message}&rdquo;
                  </p>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Administrative Log Notes</label>
                  <textarea 
                    className="form-control text-dark small"
                    rows="3"
                    placeholder="Record your action logs or telephone communication notes regarding this enquiry..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div>
                  <span className="small text-muted text-capitalize">Current Status: <strong>{viewEnquiry.status}</strong></span>
                </div>
                <div className="d-flex gap-1.5">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowViewModal(false)}>Close</button>
                  {viewEnquiry.status === 'pending' && (
                    <>
                      <button 
                        type="button" 
                        disabled={processingId === viewEnquiry.enquiry_id}
                        onClick={() => handleUpdateStatus(viewEnquiry.enquiry_id, 'completed', adminNotes)}
                        className="btn btn-success text-white"
                      >
                        Complete
                      </button>
                      <button 
                        type="button" 
                        disabled={processingId === viewEnquiry.enquiry_id}
                        onClick={() => handleUpdateStatus(viewEnquiry.enquiry_id, 'rejected', adminNotes)}
                        className="btn btn-danger"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {viewEnquiry.status !== 'pending' && (
                    <button 
                      type="button" 
                      disabled={processingId === viewEnquiry.enquiry_id}
                      onClick={() => handleUpdateStatus(viewEnquiry.enquiry_id, viewEnquiry.status, adminNotes)}
                      className="btn btn-primary"
                    >
                      Update Notes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

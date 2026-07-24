'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Search, 
  User, 
  Trash2, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Calendar,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageCustomers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  const [deleteId, setDeleteId] = useState(null);
  const [deleteName, setDeleteName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadUsers() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          search: searchQuery.trim()
        });

        const res = await fetch(`/api/admin/users?${queryParams.toString()}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setUsers(data.data.users);
          setTotalPages(data.data.totalPages);
          setTotalItems(data.data.total);
        } else if (active) {
          toast.error(data.error || 'Failed to fetch customer accounts.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error while fetching user database.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadUsers();
    return () => { active = false; };
  }, [page, searchQuery, triggerRefetch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearchQuery(search);
    setPage(1);
  };

  const handleToggleActive = async (id, name, currentActive) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User ${name} status updated successfully!`);
        setUsers(users.map(u => u.user_id === id ? { ...u, is_active: !currentActive ? 1 : 0 } : u));
      } else {
        toast.error(data.error || 'Failed to update user status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating account status.');
    } finally {
      setProcessingId(null);
    }
  };

  const confirmDelete = (id, name) => {
    setDeleteId(id);
    setDeleteName(name);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setProcessingId(deleteId);
    try {
      const res = await fetch(`/api/admin/users/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`User account for ${deleteName} deleted permanently.`);
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to delete account.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error during account deletion.');
    } finally {
      setProcessingId(null);
      setDeleteId(null);
      setDeleteName('');
    }
  };

  return (
    <DashboardLayout pageTitle="Manage Registered Users">
      {/* Search Bar section */}
      <div className="card p-3 mb-4 border bg-white" id="users-filters-card">
        <form onSubmit={handleSearchSubmit} className="row g-3">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                className="form-control border-start-0 text-dark" 
                placeholder="Search citizens by name, email, region, phone number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3 d-grid">
            <button type="submit" className="btn btn-primary d-flex align-items-center justify-content-center gap-2">
              <Search size={16} />
              <span>Search Database</span>
            </button>
          </div>
        </form>
      </div>

      {/* Main Grid table */}
      {loading ? (
        <LoadingSpinner message="Searching registered Ghanaian citizens..." />
      ) : (
        <div className="card border shadow-sm bg-white" id="users-table-container">
          <div className="p-3 border-bottom d-flex align-items-center justify-content-between">
            <span className="text-muted small fw-semibold">Found {users.length} of {totalItems} total accounts</span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 text-dark small" style={{ fontSize: '13.2px' }}>
              <thead className="table-light">
                <tr>
                  <th>User Profile</th>
                  <th>Role</th>
                  <th>Region / Location</th>
                  <th>Email / Phone</th>
                  <th>Join Date</th>
                  <th>Last Login</th>
                  <th>Status</th>
                  <th className="text-end" style={{ minWidth: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((item) => (
                    <tr key={item.user_id}>
                      <td>
                        <div className="d-flex align-items-center gap-2.5">
                          <div 
                            className="bg-primary text-white d-flex align-items-center justify-content-center rounded-circle fw-bold small"
                            style={{ width: '34px', height: '34px' }}
                          >
                            {item.full_name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <Link 
                              href={`/dashboard/admin/users/${item.user_id}`} 
                              className="text-primary text-decoration-none fw-semibold d-block"
                            >
                              {item.full_name}
                            </Link>
                            <span className="text-muted d-block small" style={{ fontSize: '11px' }}>ID:SCG-{item.user_id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          item.role === 'admin' ? 'bg-danger' : item.role === 'artisan' ? 'bg-success' : 'bg-primary'
                        } text-white text-capitalize`}>
                          {item.role}
                        </span>
                      </td>
                      <td>
                        <div>
                          <span className="d-block fw-medium">{item.region || 'Not specified'}</span>
                          <span className="text-muted d-block small" style={{ fontSize: '11px' }}>{item.district || 'Ghana'}</span>
                        </div>
                      </td>
                      <td>
                        <div>
                          <span className="d-block text-truncate" style={{ maxWidth: '160px' }}>{item.email}</span>
                          <span className="text-muted d-block small" style={{ fontSize: '11px' }}>{item.phone || 'No Phone'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="small d-flex align-items-center gap-1">
                          <Calendar size={13} className="text-muted" />
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </span>
                      </td>
                      <td>
                        <span className="small text-muted">
                          {item.last_login ? new Date(item.last_login).toLocaleDateString() : 'Never'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${item.is_active ? 'bg-success' : 'bg-secondary'} text-white`}>
                          {item.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {/* Details page */}
                          <Link 
                            href={`/dashboard/admin/users/${item.user_id}`} 
                            className="btn btn-sm btn-outline-primary p-1"
                            title="View Account Profile"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Eye size={13} />
                          </Link>

                          {/* Suspend/Activate Switch */}
                          {item.role !== 'admin' && (
                            <button 
                              disabled={processingId === item.user_id}
                              onClick={() => handleToggleActive(item.user_id, item.full_name, item.is_active)}
                              className={`btn btn-sm ${item.is_active ? 'btn-outline-danger' : 'btn-success'} p-1`}
                              title={item.is_active ? "Suspend Citizen Account" : "Activate Citizen Account"}
                              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              {item.is_active ? <X size={13} /> : <Check size={13} />}
                            </button>
                          )}

                          {/* Delete */}
                          {item.role !== 'admin' && (
                            <button 
                              disabled={processingId === item.user_id}
                              onClick={() => confirmDelete(item.user_id, item.full_name)}
                              className="btn btn-sm btn-danger p-1 text-white"
                              title="Delete Account Permanently"
                              style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4 text-muted">No accounts matching your search criteria were located.</td>
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

      {/* ACCOUNT DELETION MODAL */}
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
                  You are about to delete the user account for <strong>{deleteName}</strong> permanently.
                </p>
                <div className="alert alert-danger mb-0 small">
                  <strong>Critical Warning:</strong> This operation deletes user records and cascades across all associated database tables. This cannot be undone.
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

'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  FolderPlus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Search,
  PlusCircle,
  FileText,
  Bookmark
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [triggerRefetch, setTriggerRefetch] = useState(0);

  // Form State (Add Category)
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('fa-solid fa-star');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Form State (Edit Category)
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatIcon, setEditingCatIcon] = useState('');
  const [editingCatDesc, setEditingCatDesc] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCategories() {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/categories', { credentials: 'include' });
        const data = await res.json();
        if (data.success && active) {
          setCategories(data.data);
        } else if (active) {
          toast.error(data.error || 'Failed to retrieve categories.');
        }
      } catch (err) {
        console.error(err);
        if (active) toast.error('Network error loading categories.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCategories();
    return () => { active = false; };
  }, [triggerRefetch]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setLoading(true);
    setShowAddModal(false);

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: newCatName,
          icon_class: newCatIcon,
          description: newCatDesc
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Category created successfully!');
        setNewCatName('');
        setNewCatIcon('fa-solid fa-star');
        setNewCatDesc('');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to add category.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error adding category.');
      setLoading(false);
    }
  };

  const openEditModal = (cat) => {
    setEditingCatId(cat.category_id);
    setEditingCatName(cat.category_name);
    setEditingCatIcon(cat.icon_class);
    setEditingCatDesc(cat.description || '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingCatName.trim()) {
      toast.error('Category name is required.');
      return;
    }
    setLoading(true);
    setShowEditModal(false);

    try {
      const res = await fetch(`/api/admin/categories/${editingCatId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category_name: editingCatName,
          icon_class: editingCatIcon,
          description: editingCatDesc
        }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Category updated successfully!');
        setTriggerRefetch(prev => prev + 1);
      } else {
        toast.error(data.error || 'Failed to update category.');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating category.');
      setLoading(false);
    }
  };

  const handleToggleActive = async (id, name, currentActive) => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Category "${name}" is now ${!currentActive ? 'Active' : 'Inactive'}!`);
        setCategories(categories.map(c => c.category_id === id ? { ...c, is_active: !currentActive ? 1 : 0 } : c));
      } else {
        toast.error(data.error || 'Failed to change category status.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error toggling category active status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to permanently delete the category "${name}"?`)) return;
    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Category deleted successfully.');
        setTriggerRefetch(prev => prev + 1);
      } else {
        // Here, the backend block message with artisan counts is correctly presented
        toast.error(data.error || 'Failed to delete category.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error while deleting category.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.category_name.toLowerCase().includes(search.toLowerCase()) || 
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <DashboardLayout pageTitle="Artisan Category Center">
      {/* Search and Add Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 text-dark">
        <div className="input-group" style={{ maxWidth: '350px' }} id="categories-search-group">
          <span className="input-group-text bg-white border-end-0 text-muted">
            <Search size={16} />
          </span>
          <input 
            type="text" 
            className="form-control border-start-0 text-dark" 
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button 
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary d-flex align-items-center gap-1.5"
        >
          <PlusCircle size={18} />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Main Grid Category Listing */}
      {loading ? (
        <LoadingSpinner message="Aggregating artisan trades..." />
      ) : (
        <div className="card border shadow-sm bg-white text-dark" id="categories-table-container">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small" style={{ fontSize: '13px' }}>
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Category / Icon</th>
                  <th>Description</th>
                  <th>Artisans Count</th>
                  <th>Created Date</th>
                  <th>Status</th>
                  <th className="text-end" style={{ minWidth: '120px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((cat) => (
                    <tr key={cat.category_id}>
                      <td className="fw-semibold text-muted">#{cat.category_id}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="p-2 bg-light text-primary border rounded-3 d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px' }}>
                            <i className={cat.icon_class || 'fa-solid fa-wrench'}></i>
                          </span>
                          <span className="fw-bold text-dark">{cat.category_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted d-block text-truncate" style={{ maxWidth: '280px' }}>
                          {cat.description || 'No trade guidelines uploaded yet.'}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-bold px-2 py-1 fs-7">
                          {cat.artisan_count || 0} Registered
                        </span>
                      </td>
                      <td>{cat.created_at ? new Date(cat.created_at).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${cat.is_active ? 'bg-success' : 'bg-secondary'} text-white`}>
                          {cat.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-1">
                          {/* Edit Category */}
                          <button 
                            disabled={processingId === cat.category_id}
                            onClick={() => openEditModal(cat)}
                            className="btn btn-sm btn-outline-primary p-1"
                            title="Edit Category Details"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center' }}
                          >
                            <Edit size={13} />
                          </button>

                          {/* Toggle Active status */}
                          <button 
                            disabled={processingId === cat.category_id}
                            onClick={() => handleToggleActive(cat.category_id, cat.category_name, cat.is_active)}
                            className={`btn btn-sm ${cat.is_active ? 'btn-outline-danger' : 'btn-success'} p-1`}
                            title={cat.is_active ? "Mark Inactive" : "Mark Active"}
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center' }}
                          >
                            {cat.is_active ? <X size={13} /> : <Check size={13} />}
                          </button>

                          {/* Delete Category */}
                          <button 
                            disabled={processingId === cat.category_id}
                            onClick={() => handleDelete(cat.category_id, cat.category_name)}
                            className="btn btn-sm btn-danger p-1 text-white"
                            title="Delete Category"
                            style={{ width: '28px', height: '28px', display: 'inline-flex', alignItems: 'center', justifycontent: 'center' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-4 text-muted">No artisan categories found matching search string.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD CATEGORY MODAL */}
      {showAddModal && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Create New Trade Category</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Category Name</label>
                    <input 
                      type="text" 
                      className="form-control text-dark"
                      required
                      placeholder="e.g., Plumbing & Pipework"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">FontAwesome Icon Class</label>
                    <input 
                      type="text" 
                      className="form-control text-dark"
                      required
                      placeholder="e.g., fa-solid fa-faucet"
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                    />
                    <span className="text-muted" style={{ fontSize: '11px' }}>Example: fa-solid fa-wrench, fa-solid fa-bolt, fa-solid fa-hammer, fa-solid fa-paint-roller</span>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Short Description</label>
                    <textarea 
                      className="form-control text-dark"
                      rows="3"
                      placeholder="Provide simple parameters or definitions of this trade segment."
                      value={newCatDesc}
                      onChange={(e) => setNewCatDesc(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create Category</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* EDIT CATEGORY MODAL */}
      {showEditModal && (
        <div className="modal show d-block z-3" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content text-dark">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">Edit Category Details</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Category Name</label>
                    <input 
                      type="text" 
                      className="form-control text-dark"
                      required
                      placeholder="Category Name"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">FontAwesome Icon Class</label>
                    <input 
                      type="text" 
                      className="form-control text-dark"
                      required
                      placeholder="Icon Class"
                      value={editingCatIcon}
                      onChange={(e) => setEditingCatIcon(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold small">Description</label>
                    <textarea 
                      className="form-control text-dark"
                      rows="3"
                      placeholder="Description"
                      value={editingCatDesc}
                      onChange={(e) => setEditingCatDesc(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

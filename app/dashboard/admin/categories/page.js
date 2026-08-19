'use client';

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
        setError('');
      } else {
        setError(result.error || 'Failed to load categories');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const approve = async (categoryId) => {
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: categoryId, is_active: 1 })
      });
      const result = await response.json();
      if (result.success) {
        await load();
      } else {
        setError(result.error || 'Failed to approve category');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="container py-5">
        <h2 className="mb-3">Admin: Categories</h2>
        <p className="text-muted">Review and approve user-submitted specialties.</p>
        {loading && <div>Loading...</div>}
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="list-group">
          {categories.map((category) => (
            <div key={category.category_id} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-semibold">
                  {category.category_name}
                  {category.is_active ? (
                    <span className="badge bg-success ms-2">Active</span>
                  ) : (
                    <span className="badge bg-secondary ms-2">Pending</span>
                  )}
                </div>
                <div className="text-muted small">{category.description}</div>
                <div className="text-muted small">Icon: {category.icon_class}</div>
              </div>
              {!category.is_active && (
                <button className="btn btn-sm btn-primary" onClick={() => approve(category.category_id)}>
                  Approve
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

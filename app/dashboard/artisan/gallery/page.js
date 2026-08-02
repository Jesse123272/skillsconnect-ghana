/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
// DashboardLayout provided by app/dashboard/layout.js; per-page wrapper removed
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';

export default function ArtisanGalleryManagement() {
  const { user, loading: authLoading, authFetch } = useAuth();

  const [portfolio, setPortfolio] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // UPLOAD FORM STATE
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');

  // TRANSACTION ACTIONS STATE
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // ALERT STATUS STATE
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // FETCH PORTFOLIO
  const fetchPortfolioItems = useCallback(async () => {
    try {
      setLoadingData(true);
      const response = await authFetch('/api/portfolio');
      const result = await response.json();

      if (response.ok && result.success && Array.isArray(result.data)) {
        setPortfolio(result.data);
      } else {
        setFormError(result.error || 'Failed to download showcase gallery portfolio.');
      }
    } catch (err) {
      console.error('Error fetching portfolio items:', err);
      setFormError('A network interruption occurred while fetching your gallery.');
    } finally {
      setLoadingData(false);
    }
  }, [authFetch]);

  useEffect(() => {
    if (!authLoading && user) {
      // Trigger timer to prevent React cascading render warnings
      const timer = setTimeout(() => {
        fetchPortfolioItems();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading, fetchPortfolioItems]);

  // CHOOSE IMAGE FILE
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Portfolio work images are limited to a maximum file size of 5MB.');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFormError('Only JPG, PNG, GIF, and WEBP file formats are valid work images.');
      return;
    }

    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
  };

  // UPLOAD WORK SUBMIT
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedFile) {
      setFormError('Please select an image file of your trade works to upload.');
      return;
    }

    try {
      setUploading(true);

      // STEP 1: Upload binary file via multipart Form Data to /api/uploads
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', 'portfolio');

      const uploadRes = await authFetch('/api/uploads', {
        method: 'POST',
        body: formData
      });

      const uploadResult = await uploadRes.json();

      if (!uploadRes.ok || !uploadResult.success || !uploadResult.data?.file_path) {
        throw new Error(uploadResult.error || 'The file transmission system rejected the upload.');
      }

      const filePath = uploadResult.data.file_path;

      // STEP 2: Create Portfolio record via /api/portfolio
      const portfolioRes = await authFetch('/api/portfolio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_path: filePath,
          caption: caption.trim() || 'Work Sample',
          description: description.trim() || ''
        })
      });

      const portfolioResult = await portfolioRes.json();

      if (portfolioRes.ok && portfolioResult.success) {
        setFormSuccess('Showcase work image added successfully to your public gallery!');
        setSelectedFile(null);
        setFilePreview('');
        setCaption('');
        setDescription('');
        // Refresh local list
        fetchPortfolioItems();
      } else {
        throw new Error(portfolioResult.error || 'Failed to sync uploaded file record with portfolio database.');
      }

    } catch (err) {
      console.error('Error during portfolio upload:', err);
      setFormError(err.message || 'An error occurred during work image uploading. Please retry.');
    } finally {
      setUploading(false);
    }
  };

  // DELETE PORTFOLIO ITEM
  const handleDeleteItem = async (itemId) => {
    if (!itemId) return;

    try {
      setDeletingId(itemId);
      setFormError(null);
      setFormSuccess(null);

      const response = await authFetch(`/api/portfolio/${itemId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess('Gallery image has been removed from your showcase portfolio.');
        // Refresh portfolio list
        setPortfolio((prev) => prev.filter((item) => item.item_id !== itemId));
      } else {
        setFormError(result.error || 'Could not delete the portfolio image.');
      }
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
      setFormError('Failed to establish contact with server to delete item.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access portfolio configurations." />
      </div>
    );
  }

  return (
        <>
          <div className="container-fluid px-0" id="artisan-gallery-view">
        
        {/* Header Intro */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Work Showcase Gallery</h4>
          <p className="text-muted mb-0 fs-7">
            Manage pictures of your trade works. Having an active portfolio helps build robust consumer trust.
          </p>
        </div>

        {formError && <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />}
        {formSuccess && <AlertMessage type="success" message={formSuccess} onClose={() => setFormSuccess(null)} />}

        <div className="row g-4">
          
          {/* LEFT: UPLOAD BOX */}
          <div className="col-12 col-md-4">
            <div className="card border rounded-3 p-4 bg-white shadow-xs" id="gallery-uploader-form-card">
              <h5 className="fw-bold text-dark mb-3">Add Showcase Image</h5>
              
              <form onSubmit={handleUploadSubmit}>
                {/* File picker */}
                <div className="mb-3">
                  <label htmlFor="gallery-file" className="form-label fw-semibold text-dark fs-7.5 mb-1.5">
                    Select Work Image
                  </label>
                  <input
                    type="file"
                    id="gallery-file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="form-control shadow-none fs-7.5"
                    required
                  />
                  <div className="form-text fs-8 text-muted mt-1">Image limit is 5MB. JPEG, PNG, or WebP.</div>
                </div>

                {/* File preview */}
                {filePreview && (
                  <div className="mb-3 text-center p-2 bg-light border rounded">
                    <img
                      src={filePreview}
                      alt="Work Preview"
                      className="img-fluid rounded border-0"
                      style={{ maxHeight: '180px', objectFit: 'cover' }}
                    />
                  </div>
                )}

                {/* Caption input */}
                <div className="mb-3">
                  <label htmlFor="gallery-caption" className="form-label fw-semibold text-dark fs-7.5 mb-1.5">
                    Caption / Work Title
                  </label>
                  <input
                    type="text"
                    id="gallery-caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="form-control py-2 shadow-none fs-7.5"
                    placeholder="e.g., Living Room Wiring Complete"
                    required
                  />
                </div>

                {/* Description input */}
                <div className="mb-4">
                  <label htmlFor="gallery-desc" className="form-label fw-semibold text-dark fs-7.5 mb-1.5">
                    Short Description
                  </label>
                  <textarea
                    id="gallery-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control shadow-none fs-7.5"
                    rows="3"
                    placeholder="Briefly describe the materials used or specifications..."
                  ></textarea>
                </div>

                {/* Upload Button */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary w-100 py-2.5 rounded-pill fw-bold d-flex align-items-center justify-content-center gap-2"
                  style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Uploading Showcase Item...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-cloud-arrow-up"></i>
                      <span>Upload to Gallery</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT: PORTFOLIO GRID */}
          <div className="col-12 col-md-8">
            <div className="card border rounded-3 p-4 bg-white shadow-xs" id="gallery-display-grid-card">
              <h5 className="fw-bold text-dark mb-3">Your Portfolio Work Images ({portfolio.length})</h5>

              {loadingData ? (
                <LoadingSpinner message="Retrieving your showcase portfolio items..." />
              ) : portfolio.length === 0 ? (
                <EmptyState
                  title="No showcase photos found"
                  description="Your portfolio showcase has no items. Add your past project works on the left to show potential clients your competence!"
                  icon="fa-images"
                />
              ) : (
                <div className="row g-3" id="portfolio-images-grid">
                  {portfolio.map((item) => (
                    <div className="col-12 col-sm-6" key={item.item_id}>
                      <div className="card border rounded-3 overflow-hidden position-relative h-100 bg-white" style={{ group: 'true' }}>
                        
                        {/* Image wrapper */}
                        <div className="position-relative" style={{ height: '200px', width: '100%' }}>
                          <img
                            src={item.image_path}
                            alt={item.caption || 'Portfolio Work'}
                            className="w-100 h-100 object-fit-cover"
                            style={{ objectFit: 'cover' }}
                          />

                          {/* Delete Hover Action */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm('Are you absolutely sure you want to delete this work photo from your gallery?')) {
                                handleDeleteItem(item.item_id);
                              }
                            }}
                            className="btn btn-danger position-absolute top-2.5 end-2.5 rounded-circle shadow p-2.5 d-flex align-items-center justify-content-center border-0"
                            style={{ width: '38px', height: '38px', transition: 'all 0.2s', opacity: deletingId === item.item_id ? 0.7 : 1 }}
                            disabled={deletingId === item.item_id}
                          >
                            {deletingId === item.item_id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className="fa-solid fa-trash-can fs-7"></i>
                            )}
                          </button>
                        </div>

                        {/* Text segment */}
                        <div className="p-3">
                          <h6 className="fw-bold text-dark mb-1">{item.caption || 'Work Project'}</h6>
                          <p className="text-secondary mb-0 fs-8.5" style={{ lineHeight: '1.4' }}>
                            {item.description || 'No description provided.'}
                          </p>
                        </div>

                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

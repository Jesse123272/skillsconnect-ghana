'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ReviewCard from '@/components/ReviewCard';
import StarRating from '@/components/StarRating';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerReviews() {
  const { user, loading: authLoading } = useAuth();
  
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Modal Interactive State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editReviewText, setEditReviewText] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Fetch reviews written by current customer
  const fetchMyReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/reviews?mine=true');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setReviews(result.data);
        } else {
          setError(result.error || 'Failed to retrieve reviews list.');
        }
      } else {
        setError('Server responded with an error while fetching your reviews.');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('An unexpected error occurred while loading your reviews list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      fetchMyReviews();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, authLoading, fetchMyReviews]);

  // Open Edit Modal
  const handleOpenEditModal = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditReviewText(review.review_text);
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingReview(null);
    setEditReviewText('');
    setEditRating(5);
  };

  // Submit Edited Review
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    if (editReviewText.trim() === '') {
      setError('Review comment cannot be empty.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setError(null);
      
      const response = await fetch(`/api/reviews/${editingReview.review_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: editRating,
          review_text: editReviewText.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Your review was updated successfully!'
          });
          handleCloseEditModal();
          fetchMyReviews(); // Refresh list
        } else {
          setError(result.error || 'Failed to update review.');
        }
      } else {
        setError('Failed to communicate with update review service.');
      }
    } catch (err) {
      console.error('Submit review edit error:', err);
      setError('An unexpected communication error occurred.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Review Action
  const handleDeleteReview = async (reviewId, artisanName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete your review for ${artisanName || 'this artisan'}?`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Your review has been deleted successfully.'
          });
          // Refresh list locally
          setReviews((prev) => prev.filter((r) => r.review_id !== reviewId));
        } else {
          setError(result.error || 'Failed to delete review.');
        }
      } else {
        setError('Server responded with an error while deleting the review.');
      }
    } catch (err) {
      console.error('Delete review error:', err);
      setError('An unexpected communication error occurred while deleting your review.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying authentication..." fullPage />;
  }

  if (!user) {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Redirecting to login..." />
      </div>
    );
  }

  return (
    <DashboardLayout role="customer" pageTitle="My Reviews">
      <div className="container-fluid px-0" id="customer-reviews-view">
        
        {/* Header Title Grid */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">My Submitted Reviews</h4>
          <p className="text-muted mb-0 fs-7">
            Manage your feedback, ratings, and testimonials submitted to various Ghanaian artisans.
          </p>
        </div>

        {/* Global Feedback Notifications */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {feedback && (
          <AlertMessage 
            type={feedback.type} 
            message={feedback.message} 
            onClose={() => setFeedback(null)} 
          />
        )}

        {/* LOADING, EMPTY, OR FEED LIST */}
        {loading ? (
          <LoadingSpinner message="Retrieving your reviews feed..." />
        ) : reviews.length === 0 ? (
          <EmptyState 
            title="No reviews submitted yet" 
            description="You haven't rated any trade services yet. Keep track of completed jobs and support Ghanaian trade craftsmanship with ratings!" 
            icon="fa-star-half-stroke"
            actionText="Go to My Enquiries"
            actionHref="/dashboard/customer/enquiries"
          />
        ) : (
          <div className="d-flex flex-column gap-4" id="customer-reviews-list">
            {reviews.map((review) => {
              const reviewId = review.review_id;
              return (
                <div key={reviewId} className="card border rounded-3 p-4 bg-white shadow-xs position-relative" id={`review-container-${reviewId}`}>
                  {/* Reviewed Artisan Header */}
                  <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3 gap-2">
                    <div className="d-flex align-items-center gap-2">
                      <div className="rounded-circle bg-light border p-1 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                        <i className="fa-solid fa-wrench text-secondary fs-6"></i>
                      </div>
                      <div>
                        <span className="text-muted fs-8 text-uppercase tracking-wider d-block fw-semibold" style={{ fontSize: '10px' }}>Reviewed Artisan</span>
                        <Link href={`/artisans/${review.artisan_id}`} className="text-decoration-none fw-bold text-dark hover-text-primary fs-6">
                          {review.artisan_name}
                        </Link>
                      </div>
                    </div>
                    <span className="badge bg-secondary text-dark text-capitalize rounded-pill px-2.5 py-1 fs-8">
                      {review.category_name}
                    </span>
                  </div>

                  {/* Standard review contents card */}
                  <ReviewCard review={{
                    ...review,
                    reviewer_name: review.customer_name || user.full_name
                  }} />

                  {/* Interactive customer controls */}
                  <div className="d-flex justify-content-end gap-2 border-top pt-3 mt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(review)}
                      className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-pen-nib fs-8"></i>
                      <span>Edit Review</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(reviewId, review.artisan_name)}
                      className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                      style={{ cursor: 'pointer' }}
                    >
                      <i className="fa-solid fa-trash-can fs-8"></i>
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PURE-REACT EDIT REVIEW MODAL */}
        {isEditModalOpen && editingReview && (
          <>
            <div 
              className="modal fade show d-block" 
              tabIndex="-1" 
              role="dialog" 
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
              id="edit-review-modal"
            >
              <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content border-0 rounded-3 shadow" style={{ overflow: 'hidden' }}>
                  
                  {/* Modal Header */}
                  <div className="modal-header bg-light border-bottom p-3">
                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                      <i className="fa-solid fa-star text-warning"></i>
                      <span>Edit Your Review</span>
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close shadow-none" 
                      onClick={handleCloseEditModal}
                      aria-label="Close"
                      style={{ cursor: 'pointer' }}
                    ></button>
                  </div>

                  <form onSubmit={handleSubmitEdit}>
                    {/* Modal Body */}
                    <div className="modal-body p-4">
                      
                      {/* Artisan Title */}
                      <p className="text-secondary fs-7 mb-3">
                        Updating feedback for <strong className="text-dark">{editingReview.artisan_name}</strong> ({editingReview.category_name})
                      </p>

                      {/* STAR RATING INTERACTION */}
                      <div className="mb-4 text-center bg-light p-3 rounded-3 border border-dashed">
                        <label className="form-label fw-bold text-dark fs-7 d-block mb-2">
                          1. Rating Score
                        </label>
                        <div className="d-flex gap-2.5 justify-content-center fs-3 text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={star <= editRating ? "fa-solid fa-star" : "fa-regular fa-star"}
                              onClick={() => setEditRating(star)}
                              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                              title={`${star} Star${star > 1 ? 's' : ''}`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-muted fs-8 fw-semibold mt-1 d-block text-capitalize">
                          {editRating === 5 && 'Excellent Outstanding Work! 🌟'}
                          {editRating === 4 && 'Very Good Service! 👍'}
                          {editRating === 3 && 'Average / Fair performance 🛠️'}
                          {editRating === 2 && 'Below Expectations ⚠️'}
                          {editRating === 1 && 'Extremely Poor Service 🛑'}
                        </span>
                      </div>

                      {/* REVIEW TEXTAREA */}
                      <div className="mb-2">
                        <label htmlFor="edit-review-comments" className="form-label fw-bold text-dark fs-7 mb-2">
                          2. Detailed Comments
                        </label>
                        <textarea
                          id="edit-review-comments"
                          value={editReviewText}
                          onChange={(e) => setEditReviewText(e.target.value.substring(0, 1000))}
                          className="form-control shadow-none fs-7"
                          rows="5"
                          placeholder="Please explain your trade service feedback in detail..."
                          required
                        ></textarea>
                        <div className="form-text text-end text-muted fs-8 mt-1">
                          {editReviewText.length}/1000 characters
                        </div>
                      </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="modal-footer bg-light border-top p-3 d-flex justify-content-end gap-2">
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-secondary px-4 py-2 rounded-pill fw-medium" 
                        onClick={handleCloseEditModal}
                        disabled={submittingEdit}
                        style={{ cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-sm btn-primary px-4 py-2 rounded-pill fw-bold"
                        disabled={submittingEdit}
                        style={{ cursor: submittingEdit ? 'not-allowed' : 'pointer' }}
                      >
                        {submittingEdit ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <span>Save Changes</span>
                        )}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>
            {/* Modal Backdrop */}
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
          </>
        )}

      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerTestimonials() {
  const { user, loading: authLoading } = useAuth();

  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // New Testimonial Form State
  const [rating, setRating] = useState(5);
  const [testimonialText, setTestimonialText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Testimonial Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editTestimonialText, setEditTestimonialText] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Fetch testimonials written by this customer
  const fetchMyTestimonials = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/testimonials?mine=true');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setTestimonials(result.data);
        } else {
          setError(result.error || 'Failed to retrieve testimonials list.');
        }
      } else {
        setError('Server responded with an error while fetching testimonials.');
      }
    } catch (err) {
      console.error('Error fetching testimonials:', err);
      setError('An unexpected error occurred while loading your testimonials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = setTimeout(() => {
      fetchMyTestimonials();
    }, 0);
    return () => clearTimeout(timer);
  }, [user, authLoading, fetchMyTestimonials]);

  // Submit New Testimonial
  const handleSubmitNew = async (e) => {
    e.preventDefault();
    setError(null);
    setFeedback(null);

    if (testimonialText.trim().length < 10) {
      setError('Your testimonial comments must be at least 10 characters long.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/testimonials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating,
          testimonial_text: testimonialText.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFeedback({
          type: 'success',
          message: 'Thank you! Your testimonial has been published successfully.',
        });
        setTestimonialText('');
        setRating(5);
        fetchMyTestimonials(); // Refresh list
      } else {
        setError(result.error || 'Failed to submit testimonial.');
      }
    } catch (err) {
      console.error('Submit testimonial error:', err);
      setError('An unexpected network error occurred while saving your testimonial.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (testimonial) => {
    setEditingTestimonial(testimonial);
    setEditRating(testimonial.rating);
    setEditTestimonialText(testimonial.testimonial_text);
    setIsEditModalOpen(true);
  };

  // Close Edit Modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTestimonial(null);
    setEditTestimonialText('');
    setEditRating(5);
  };

  // Submit Edited Testimonial
  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!editingTestimonial) return;

    if (editTestimonialText.trim().length < 10) {
      setError('Testimonial comment must be at least 10 characters long.');
      return;
    }

    try {
      setSubmittingEdit(true);
      setError(null);

      const response = await fetch(`/api/testimonials/${editingTestimonial.testimonial_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: editRating,
          testimonial_text: editTestimonialText.trim(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Your testimonial was updated successfully!',
          });
          handleCloseEditModal();
          fetchMyTestimonials(); // Refresh list
        } else {
          setError(result.error || 'Failed to update testimonial.');
        }
      } else {
        setError('Failed to communicate with update testimonial service.');
      }
    } catch (err) {
      console.error('Submit testimonial edit error:', err);
      setError('An unexpected communication error occurred.');
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Delete Testimonial Action
  const handleDeleteTestimonial = async (testimonialId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to permanently delete your platform testimonial feedback?'
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/testimonials/${testimonialId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFeedback({
            type: 'success',
            message: 'Your testimonial has been deleted successfully.',
          });
          setTestimonials((prev) => prev.filter((t) => t.testimonial_id !== testimonialId));
        } else {
          setError(result.error || 'Failed to delete testimonial.');
        }
      } else {
        setError('Server responded with an error while deleting the testimonial.');
      }
    } catch (err) {
      console.error('Delete testimonial error:', err);
      setError('An unexpected communication error occurred while deleting your testimonial.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user) {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Redirecting to login..." />
      </div>
    );
  }

  return (
    <DashboardLayout role="customer" pageTitle="Platform Testimonials">
      <div className="container-fluid px-0" id="testimonials-view">
        {/* Header Title Grid */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Share Your Experience</h4>
          <p className="text-muted mb-0 fs-7">
            Your testimonials and feedback help local Ghanaian trade artisans build trust and showcase the integrity of SkillsConnect Ghana.
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

        <div className="row g-4">
          {/* LEFT COLUMN: FORM */}
          <div className="col-12 col-lg-5">
            <div className="card border rounded-3 p-4 bg-white shadow-xs sticky-top" style={{ top: '90px', zIndex: 10 }}>
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-primary"></i>
                <span>Submit a Testimonial</span>
              </h5>
              <p className="text-muted fs-7 mb-4">
                Tell us how SkillsConnect Ghana helped you find verified, reliable trade professionals.
              </p>

              <form onSubmit={handleSubmitNew} id="new-testimonial-form">
                {/* STAR RATING PICKER */}
                <div className="mb-4 text-center bg-light p-3 rounded-3 border border-dashed">
                  <label className="form-label fw-bold text-dark fs-7 d-block mb-2">
                    1. Platform Quality Rating
                  </label>
                  <div className="d-flex gap-2.5 justify-content-center fs-3 text-warning my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        className={star <= rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                        onClick={() => setRating(star)}
                        style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                      ></i>
                    ))}
                  </div>
                  <span className="text-muted fs-8 fw-semibold mt-1 d-block text-capitalize">
                    {rating === 5 && 'Excellent platform & matches! 🌟'}
                    {rating === 4 && 'Very satisfied! 👍'}
                    {rating === 3 && 'Decent service 🛠️'}
                    {rating === 2 && 'Needs structural improvement ⚠️'}
                    {rating === 1 && 'Poor platform experience 🛑'}
                  </span>
                </div>

                {/* TESTIMONIAL TEXTAREA */}
                <div className="mb-4">
                  <label htmlFor="new-testimonial-input" className="form-label fw-bold text-dark fs-7 mb-2">
                    2. Write Your Honest Testimonial
                  </label>
                  <textarea
                    id="new-testimonial-input"
                    value={testimonialText}
                    onChange={(e) => setTestimonialText(e.target.value.substring(0, 1000))}
                    className="form-control shadow-none fs-7"
                    rows="6"
                    placeholder="Describe how finding artisans on SkillsConnect Ghana has been helpful. Mention professional conduct, speedy communication, or job satisfaction. Min 10, Max 1000 chars."
                    required
                  ></textarea>
                  <div className="form-text d-flex justify-content-between text-muted fs-8 mt-1">
                    <span>Constructive feedback builds trust.</span>
                    <span className={testimonialText.length < 10 ? 'text-danger' : 'text-success'}>
                      {testimonialText.length}/1000 characters
                    </span>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-pill shadow-sm fw-bold d-inline-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                  style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-share-nodes"></i>
                      <span>Publish Platform Testimonial</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: LISTING */}
          <div className="col-12 col-lg-7">
            <div className="card border rounded-3 p-4 bg-white h-100 shadow-xs">
              <h5 className="fw-bold text-dark mb-4 d-flex align-items-center gap-2">
                <i className="fa-solid fa-list-check text-primary"></i>
                <span>My Platform Testimonials</span>
              </h5>

              {loading ? (
                <LoadingSpinner message="Retrieving your testimonials list..." />
              ) : testimonials.length === 0 ? (
                <EmptyState
                  title="No testimonials shared yet"
                  description="You haven't written any overall platform testimonials yet. Share your success stories to inspire others and help verified Ghanaian trade artisans thrive!"
                  icon="fa-quote-left"
                />
              ) : (
                <div className="d-flex flex-column gap-4" id="testimonials-list">
                  {testimonials.map((test) => {
                    const testId = test.testimonial_id;
                    return (
                      <div
                        key={testId}
                        className="p-4 border rounded-3 bg-light shadow-xs position-relative"
                        id={`testimonial-container-${testId}`}
                      >
                        {/* Rating Stars */}
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div className="text-warning fs-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <i
                                key={star}
                                className={star <= test.rating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                              ></i>
                            ))}
                          </div>
                          <span className="badge bg-success text-white rounded-pill px-2.5 py-1 fs-8">
                            {test.status}
                          </span>
                        </div>

                        {/* Testimonial Quote */}
                        <p className="text-secondary fs-6 mb-3 italic" style={{ lineHeight: '1.6' }}>
                          &quot;{test.testimonial_text}&quot;
                        </p>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3 mt-3">
                          <span className="text-muted fs-8">
                            Published:{' '}
                            {test.created_at
                              ? new Date(test.created_at).toLocaleDateString('en-GH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Recent'}
                          </span>

                          {/* Controls */}
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(test)}
                              className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{ cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-pencil fs-8"></i>
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTestimonial(testId)}
                              className="btn btn-sm btn-outline-danger px-3 rounded-pill fw-semibold d-inline-flex align-items-center gap-1.5"
                              style={{ cursor: 'pointer' }}
                            >
                              <i className="fa-solid fa-trash-can fs-8"></i>
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PURE-REACT EDIT TESTIMONIAL MODAL */}
        {isEditModalOpen && editingTestimonial && (
          <>
            <div
              className="modal fade show d-block"
              tabIndex="-1"
              role="dialog"
              style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}
              id="edit-testimonial-modal"
            >
              <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content border-0 rounded-3 shadow" style={{ overflow: 'hidden' }}>
                  {/* Modal Header */}
                  <div className="modal-header bg-light border-bottom p-3">
                    <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                      <i className="fa-solid fa-quote-left text-warning"></i>
                      <span>Edit Your Testimonial</span>
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
                      {/* STAR RATING INTERACTION */}
                      <div className="mb-4 text-center bg-light p-3 rounded-3 border border-dashed">
                        <label className="form-label fw-bold text-dark fs-7 d-block mb-2">
                          1. Rating Score
                        </label>
                        <div className="d-flex gap-2.5 justify-content-center fs-3 text-warning">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <i
                              key={star}
                              className={star <= editRating ? 'fa-solid fa-star' : 'fa-regular fa-star'}
                              onClick={() => setEditRating(star)}
                              style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                              title={`${star} Star${star > 1 ? 's' : ''}`}
                            ></i>
                          ))}
                        </div>
                        <span className="text-muted fs-8 fw-semibold mt-1 d-block text-capitalize">
                          {editRating === 5 && 'Excellent platform & matches! 🌟'}
                          {editRating === 4 && 'Very satisfied! 👍'}
                          {editRating === 3 && 'Decent service 🛠️'}
                          {editRating === 2 && 'Needs structural improvement ⚠️'}
                          {editRating === 1 && 'Poor platform experience 🛑'}
                        </span>
                      </div>

                      {/* TESTIMONIAL TEXTAREA */}
                      <div className="mb-2">
                        <label htmlFor="edit-testimonial-comments" className="form-label fw-bold text-dark fs-7 mb-2">
                          2. Detailed Comments
                        </label>
                        <textarea
                          id="edit-testimonial-comments"
                          value={editTestimonialText}
                          onChange={(e) => setEditTestimonialText(e.target.value.substring(0, 1000))}
                          className="form-control shadow-none fs-7"
                          rows="5"
                          placeholder="Please explain your feedback in detail..."
                          required
                        ></textarea>
                        <div className="form-text text-end text-muted fs-8 mt-1">
                          {editTestimonialText.length}/1000 characters
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

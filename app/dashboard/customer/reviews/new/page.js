'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProfileAvatar from '@/components/ProfileAvatar';
import StarRating from '@/components/StarRating';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';

function NewReviewFormContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const artisanId = searchParams.get('artisan_id');

  const [artisan, setArtisan] = useState(null);
  const [loadingArtisan, setLoadingArtisan] = useState(true);
  const [artisanError, setArtisanError] = useState(null);

  // Form Field States
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  
  // Status States
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

  // Fetch the target artisan profile details on mount
  useEffect(() => {
    if (!artisanId) {
      const timer = setTimeout(() => {
        setArtisanError('No artisan ID specified for the review.');
        setLoadingArtisan(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    async function fetchArtisanDetails() {
      try {
        setLoadingArtisan(true);
        setArtisanError(null);
        
        const res = await fetch(`/api/artisans/${artisanId}`);
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setArtisan(result.data);
          } else {
            setArtisanError(result.error || 'Artisan profile details could not be loaded.');
          }
        } else {
          setArtisanError('Unable to fetch artisan details from server.');
        }
      } catch (err) {
        console.error('Error fetching artisan for review:', err);
        setArtisanError('An error occurred while loading artisan details.');
      } finally {
        setLoadingArtisan(false);
      }
    }

    fetchArtisanDetails();
  }, [artisanId]);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!artisanId) {
      setFormError('Artisan selection is missing.');
      return;
    }

    if (reviewText.trim().length < 10) {
      setFormError('Your review comments must be at least 10 characters long.');
      return;
    }

    if (reviewText.trim().length > 1000) {
      setFormError('Your review comments cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artisan_id: parseInt(artisanId, 10),
          rating: rating,
          review_text: reviewText.trim(),
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFormSuccess('Thank you! Your rating and review have been submitted successfully. Redirecting...');
        setTimeout(() => {
          router.push('/dashboard/customer/reviews');
        }, 1500);
      } else {
        setFormError(result.error || 'Failed to submit review. Note: You must have an enquiry with this artisan first to review them.');
      }
    } catch (err) {
      console.error('Submit review error:', err);
      setFormError('An unexpected network error occurred while saving your review.');
    } finally {
      setSubmitting(false);
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
    <DashboardLayout role="customer" pageTitle="Write a Review">
      <div className="container-fluid px-0" id="new-review-form-page">
        
        {/* Cancel / Back Link */}
        <div className="mb-4">
          <Link 
            href="/dashboard/customer/reviews" 
            className="btn btn-outline-secondary px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5 hover-bg-light text-decoration-none"
          >
            <i className="fa-solid fa-arrow-left fs-7"></i>
            <span>Cancel and Go Back</span>
          </Link>
        </div>

        {/* Headings */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Share Your Experience</h4>
          <p className="text-muted mb-0 fs-7">
            Rate the speed, communication, quality, and professionalism of the trade services delivered.
          </p>
        </div>

        {/* Global form success / errors */}
        {formError && <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />}
        {formSuccess && <AlertMessage type="success" message={formSuccess} />}

        {loadingArtisan ? (
          <LoadingSpinner message="Loading target artisan profile..." />
        ) : artisanError || !artisan ? (
          <div className="p-4 bg-white border rounded-3 text-center">
            <AlertMessage type="danger" message={artisanError || 'Target artisan details could not be found.'} />
            <Link href="/dashboard/customer/enquiries" className="btn btn-primary rounded-pill mt-2">
              Back to Enquiries
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            
            {/* LEFT FORM COLUMN */}
            <div className="col-12 col-lg-8">
              <div className="card border rounded-3 p-4 bg-white shadow-xs">
                
                {/* Selected Artisan Header Box */}
                <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border mb-4" id="target-review-artisan-box">
                  <ProfileAvatar 
                    name={artisan.full_name} 
                    photo_url={artisan.profile_photo} 
                    size="md" 
                  />
                  <div className="flex-grow-1">
                    <strong className="text-dark d-block mb-1">{artisan.full_name}</strong>
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-primary text-white text-capitalize rounded-pill px-2.5 py-0.5 fs-8">
                        {artisan.category_name}
                      </span>
                      <div className="d-flex align-items-center gap-1 fs-8 text-secondary">
                        <StarRating rating={parseFloat(artisan.average_rating || 0)} size="sm" />
                        <strong>{parseFloat(artisan.average_rating || 0).toFixed(1)}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} id="new-review-form">
                  
                  {/* STAR RATING PICKER */}
                  <div className="mb-4 text-center bg-light p-4 rounded-3 border border-dashed">
                    <label className="form-label fw-bold text-dark fs-7 d-block mb-2">
                      1. Overall Service Rating
                    </label>
                    <div className="d-flex gap-3 justify-content-center fs-2 text-warning my-2" id="star-picker-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={star <= rating ? "fa-solid fa-star" : "fa-regular fa-star"}
                          onClick={() => setRating(star)}
                          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                          title={`${star} Star${star > 1 ? 's' : ''}`}
                        ></i>
                      ))}
                    </div>
                    <span className="text-muted fs-8 fw-semibold mt-1 d-block text-uppercase tracking-wider">
                      {rating === 5 && 'Excellent / Highly Recommended 🌟'}
                      {rating === 4 && 'Good / Professional Service 👍'}
                      {rating === 3 && 'Average / Acceptable performance 🛠️'}
                      {rating === 2 && 'Needs Improvement / Below average ⚠️'}
                      {rating === 1 && 'Unsatisfactory / Poor Quality 🛑'}
                    </span>
                  </div>

                  {/* COMMENTS TEXTAREA */}
                  <div className="mb-4">
                    <label htmlFor="new-review-comments-input" className="form-label fw-bold text-dark fs-7 mb-2">
                      2. Write Your Honest Review Comments
                    </label>
                    <textarea
                      id="new-review-comments-input"
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value.substring(0, 1000))}
                      className="form-control shadow-none"
                      rows="6"
                      placeholder="Share what went well, promptness, cost honesty, clean-up post work, and if you would recommend them to others on SkillsConnect Ghana. Minimum 10 characters."
                      required
                    ></textarea>
                    <div className="form-text d-flex justify-content-between text-muted fs-8 mt-1">
                      <span>Be objective and constructive. Min 10, Max 1000 chars.</span>
                      <span className={reviewText.length < 10 ? 'text-danger' : 'text-success'}>
                        {reviewText.length}/1000 characters
                      </span>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <div className="border-top pt-4 text-end">
                    <button
                      type="submit"
                      className="btn btn-primary px-5 py-2.5 rounded-pill shadow-sm fw-bold d-inline-flex align-items-center gap-2"
                      disabled={submitting}
                      style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Submitting review...</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-star"></i>
                          <span>Publish Review & Rating</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>

              </div>
            </div>

            {/* RIGHT SIDEBAR COLUMN */}
            <div className="col-12 col-lg-4">
              <div className="card border rounded-3 p-4 bg-light shadow-xs h-100">
                <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <i className="fa-solid fa-circle-info text-primary"></i>
                  <span>Review Guidelines</span>
                </h5>
                <ul className="d-flex flex-column gap-3 fs-7 text-secondary ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                  <li>
                    <strong className="text-dark d-block mb-1">Authentic interactions only:</strong>
                    You can only review artisans with whom you have initiated an active trade enquiry conversation thread.
                  </li>
                  <li>
                    <strong className="text-dark d-block mb-1">Constructive critique:</strong>
                    Reviews help artisans learn and improve. Describe specific aspects of their speed, behavior, and accuracy.
                  </li>
                  <li>
                    <strong className="text-dark d-block mb-1">Privacy matters:</strong>
                    Do not publish private details like residential addresses, personal phone numbers, or private bank details in the public comments.
                  </li>
                </ul>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

export default function CustomerNewReview() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading review editor context..." />}>
      <NewReviewFormContent />
    </Suspense>
  );
}

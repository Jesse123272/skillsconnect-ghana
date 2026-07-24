'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';
import StarRating from '@/components/StarRating';
import ReviewCard from '@/components/ReviewCard';

export default function ArtisanReviewsManagement() {
  const { user, loading: authLoading } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  // FETCH REVIEWS FOR THIS ARTISAN
  useEffect(() => {
    if (authLoading || !user) return;

    const timer = setTimeout(() => {
      async function loadReviews() {
        try {
          setLoadingData(true);
          setError(null);

          // Get reviews received about this artisan
          const response = await fetch('/api/reviews?mine=true');
          const result = await response.json();

          if (response.ok && result.success) {
            const fetchedReviews = result.data || [];
            // Map review_text to comment so ReviewCard displays it correctly
            const mapped = fetchedReviews.map((r) => ({
              ...r,
              comment: r.review_text || r.comment,
              reviewer_name: r.customer_name || r.reviewer_name
            }));
            setReviews(mapped);
          } else {
            setError(result.error || 'Failed to download your reviews feed.');
          }
        } catch (err) {
          console.error('Error fetching artisan reviews:', err);
          setError('A connection exception occurred while loading customer reviews.');
        } finally {
          setLoadingData(false);
        }
      }

      loadReviews();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access customer reviews." />
      </div>
    );
  }

  // CALCULATE STAR RATINGS BREAKDOWN
  const totalReviews = reviews.length;
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  let sumRatings = 0;

  reviews.forEach((r) => {
    const rInt = Math.round(parseFloat(r.rating || 0));
    if (starCounts[rInt] !== undefined) {
      starCounts[rInt]++;
    }
    sumRatings += parseFloat(r.rating || 0);
  });

  const averageRating = totalReviews > 0 ? (sumRatings / totalReviews).toFixed(1) : '0.0';

  const getPercent = (stars) => {
    if (totalReviews === 0) return 0;
    return Math.round((starCounts[stars] / totalReviews) * 100);
  };

  return (
    <DashboardLayout role="artisan" pageTitle="Client Reviews">
      <div className="container-fluid px-0" id="artisan-reviews-view">
        
        {/* Title and Intro */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">Customer Reviews & Ratings</h4>
          <p className="text-muted mb-0 fs-7">
            Analyze reviews and evaluation ratings submitted by your previous clients across Ghana.
          </p>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Calculating rating metrics..." />
        ) : (
          <div className="row g-4">
            
            {/* LEFT: RATINGS SUMMARY CARD */}
            <div className="col-12 col-md-5">
              <div className="card border rounded-3 p-4 bg-white shadow-xs h-100" id="ratings-summary-card">
                <h5 className="fw-bold text-dark mb-4">Overall Score Breakdown</h5>
                
                {/* Score Number block */}
                <div className="text-center mb-4 p-4 bg-light rounded-3">
                  <h1 className="fw-black text-dark mb-1" style={{ fontSize: '64px', letterSpacing: '-2px' }}>
                    {averageRating}
                  </h1>
                  <div className="mb-2 d-flex justify-content-center">
                    <StarRating rating={parseFloat(averageRating)} size="lg" />
                  </div>
                  <span className="text-muted fs-7.5 fw-semibold">
                    Based on {totalReviews} {totalReviews === 1 ? 'client evaluation' : 'client evaluations'}
                  </span>
                </div>

                {/* Progress Bars Breakdown */}
                <div className="d-flex flex-column gap-3" id="stars-breakdown-bars">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const pct = getPercent(stars);
                    const count = starCounts[stars];

                    return (
                      <div className="d-flex align-items-center gap-2.5" key={stars}>
                        <span className="fs-7.5 text-dark fw-bold" style={{ width: '42px' }}>
                          {stars} Star
                        </span>
                        <div className="progress flex-grow-1" style={{ height: '8px' }}>
                          <div
                            className="progress-bar bg-warning rounded-pill"
                            role="progressbar"
                            style={{ width: `${pct}%` }}
                            aria-valuenow={pct}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <span className="text-muted fs-8 text-end" style={{ width: '65px' }}>
                          {pct}% ({count})
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Info Tip banner */}
                <div className="mt-4 p-3 bg-primary-subtle text-primary border-0 rounded-3 fs-8 d-flex align-items-start gap-2">
                  <i className="fa-solid fa-lightbulb mt-0.5"></i>
                  <span>
                    Artisans with average ratings above <strong>4.5 stars</strong> are prioritized in the SkillsConnect search rankings. Keep up the precision work!
                  </span>
                </div>

              </div>
            </div>

            {/* RIGHT: REVIEWS LIST CARD */}
            <div className="col-12 col-md-7">
              <div className="card border rounded-3 p-4 bg-white shadow-xs h-100" id="reviews-feed-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold text-dark mb-0">Client Reviews Feed</h5>
                  <span className="badge bg-light text-secondary border rounded-pill px-2.5 py-1 fw-bold fs-8">
                    {totalReviews} Total
                  </span>
                </div>

                {reviews.length === 0 ? (
                  <EmptyState
                    title="No reviews posted yet"
                    description="You have not received any customer feedback evaluations on your public profile yet."
                    icon="fa-star-half-stroke"
                  />
                ) : (
                  <div className="d-flex flex-column" id="artisan-reviews-feed-list">
                    {reviews.map((rev) => (
                      <div className="border-bottom py-3" key={rev.review_id} id={`review-container-${rev.review_id}`}>
                        <ReviewCard review={rev} />
                        
                        {/* Custom Reply Tip Button */}
                        <div className="mt-2 text-end">
                          <button
                            type="button"
                            onClick={() => {
                              window.alert('Direct replies to client reviews are managed by the site administrators or coming soon. To clarify feedback details, you can contact this client directly via their phone contact inside the received enquiries tab.');
                            }}
                            className="btn btn-sm btn-link p-0 text-decoration-none fs-8 text-muted"
                          >
                            <i className="fa-solid fa-reply me-1"></i>
                            <span>Reply to Review</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

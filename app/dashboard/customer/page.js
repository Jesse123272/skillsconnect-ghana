/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import ArtisanCard from '@/components/ArtisanCard';
import ReviewCard from '@/components/ReviewCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import AlertMessage from '@/components/AlertMessage';
import NearbyArtisans from '@/components/NearbyArtisans';

export default function CustomerDashboardHome() {
  const { user, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [quickActionsReady, setQuickActionsReady] = useState(false);
  
  // Dashboard Live Data State
  const [platformStats, setPlatformStats] = useState(null);
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [enquiriesTotal, setEnquiriesTotal] = useState(0);
  const [artisansContacted, setArtisansContacted] = useState(0);
  const [myReviews, setMyReviews] = useState([]);
  const [myReviewsTotal, setMyReviewsTotal] = useState(0);
  const [savedArtisans, setSavedArtisans] = useState([]);
  const [savedTotal, setSavedTotal] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [recommendedArtisans, setRecommendedArtisans] = useState([]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuickActionsReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Run all required endpoints in Promise.all
        const [
          statsRes,
          enquiriesRes,
          reviewsRes,
          savedRes,
          notificationsRes,
          recommendedRes,
        ] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/enquiries?limit=5'),
          fetch('/api/reviews?user_id=me&limit=2'),
          fetch('/api/saved?limit=3'),
          fetch('/api/notifications?unread=true'),
          fetch('/api/artisans?sort=rating&limit=3'),
        ]);

        // Process response data
        let statsData = { data: {} };
        if (statsRes.ok) statsData = await statsRes.json();

        let enquiriesData = { data: { enquiries: [], total: 0 } };
        if (enquiriesRes.ok) enquiriesData = await enquiriesRes.json();

        let reviewsData = { data: [] };
        if (reviewsRes.ok) reviewsData = await reviewsRes.json();

        let savedData = { data: { saved_artisans: [], total: 0 } };
        if (savedRes.ok) savedData = await savedRes.json();

        let notificationsData = { data: { notifications: [] } };
        if (notificationsRes.ok) notificationsData = await notificationsRes.json();

        let recommendedData = { data: { artisans: [] } };
        if (recommendedRes.ok) recommendedData = await recommendedRes.json();

        // Map state from API results
        setPlatformStats(statsData.success ? statsData.data : null);
        
        const enqList = enquiriesData.success ? (enquiriesData.data?.enquiries || enquiriesData.data || []) : [];
        const enqTotal = enquiriesData.success ? (enquiriesData.data?.total || enqList.length) : 0;
        setRecentEnquiries(enqList.slice(0, 5));
        setEnquiriesTotal(enqTotal);

        // Calculate unique artisans contacted based on recent or if we can fetch more
        // Since we only got a subset, let's look at unique artisan_ids in the enquiries
        // If we want a reliable count, we fetch the first 100 in the background or approximate.
        // Let's approximate based on retrieved list or estimate. Or let's count unique IDs in current list.
        const uniqueArtisans = new Set(enqList.map(e => e.artisan_id)).size;
        setArtisansContacted(uniqueArtisans || 0);

        const revList = reviewsData.success ? (reviewsData.data || []) : [];
        setMyReviews(revList.slice(0, 2));
        setMyReviewsTotal(revList.length);

        const savedList = savedData.success ? (savedData.data?.saved_artisans || savedData.data || []) : [];
        const savTotal = savedData.success ? (savedData.data?.total || savedList.length) : 0;
        setSavedArtisans(savedList.slice(0, 3));
        setSavedTotal(savTotal);

        if (notificationsData.success) {
          // If we got unread notifications directly, filter where is_read is false
          const list = notificationsData.data?.notifications || notificationsData.data || [];
          const unreadCount = Array.isArray(list) ? list.filter(n => !n.is_read).length : 0;
          setUnreadNotifications(unreadCount);
        }

        const recList = recommendedData.success ? (recommendedData.data?.artisans || recommendedData.data || []) : [];
        setRecommendedArtisans(recList.slice(0, 3));

      } catch (err) {
        console.error('Error fetching customer dashboard data:', err);
        setError('Failed to load some dashboard items. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, authLoading]);

  // Render Auth and loading placeholders
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
    <DashboardLayout role="customer" pageTitle="Customer Dashboard">
      <div className="container-fluid px-0" id="customer-dashboard-home">
        
        {/* Error Alert */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {/* WELCOME BANNER */}
        <div 
          className="card border-0 rounded-3 mb-4 p-4 text-white shadow-sm" 
          style={{ 
            background: 'linear-gradient(135deg, #1A6B3C 0%, #2E7D32 100%)' 
          }}
          id="dashboard-welcome-banner"
        >
          <div className="row align-items-center">
            <div className="col-12 col-md-8">
              <h2 className="fw-bold mb-1">Welcome back, {user.full_name}!</h2>
              <p className="mb-0 text-white-50 fs-6">
                Connect with highly skilled Ghanaian artisans and keep track of your active trade inquiries.
              </p>
            </div>
            <div className="col-12 col-md-4 text-md-end mt-3 mt-md-0">
              <span className="badge bg-white text-success py-2 px-3 rounded-pill fw-semibold fs-7 shadow-xs">
                {new Date().toLocaleDateString('en-GH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="me-auto">
            <h5 className="fw-bold mb-1">Dashboard Shortcuts</h5>
            <p className="text-muted mb-0 fs-8">Open the most useful dashboard widgets in a clean, sequential flow.</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary rounded-pill d-inline-flex align-items-center gap-2"
            onClick={() => setShowQuickActions((prev) => !prev)}
          >
            <span>{showQuickActions ? 'Hide shortcuts' : 'Show shortcuts'}</span>
            <i className={`fa-solid fa-chevron-down chevron-icon ${showQuickActions ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className={`row g-3 mb-4 staggered-container ${showQuickActions ? 'expanded' : 'collapsed'}`} id="dashboard-quick-actions">
          <div className="col-12 col-md-6 col-xl-3">
            <Link href="/artisans" className="card quick-action-card staggered-card rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Explore</span>
                  <h6 className="fw-bold text-dark mb-0">Browse Artisans</h6>
                </div>
                <span className="badge bg-primary text-white rounded-pill py-2 px-3">New</span>
              </div>
              <p className="text-muted fs-8 mb-0">Find trusted tradespeople near you in Ghana.</p>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link href="/dashboard/customer/enquiries" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Manage</span>
                  <h6 className="fw-bold text-dark mb-0">My Enquiries</h6>
                </div>
                <i className="fa-solid fa-comments text-success fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Keep track of messages from artisans and reply quickly.</p>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link href="/dashboard/customer/saved" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Saved</span>
                  <h6 className="fw-bold text-dark mb-0">Favorite Artisans</h6>
                </div>
                <i className="fa-solid fa-heart text-danger fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Quickly return to service providers you trust.</p>
            </Link>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
            <Link href="/dashboard/customer/reviews" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Share</span>
                  <h6 className="fw-bold text-dark mb-0">Write a Review</h6>
                </div>
                <i className="fa-solid fa-star text-warning fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Help other customers by rating artisans you have hired.</p>
            </Link>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <LoadingSpinner message="Fetching dashboard analytics and items..." />
        ) : (
          <>
            {/* 4 STAT CARDS */}
            <div className="row g-4 mb-4" id="dashboard-stats-grid">
              <div className="col-12 col-sm-6 col-lg-3">
                <StatCard 
                  title="Total Enquiries Sent" 
                  value={enquiriesTotal} 
                  icon="fa-paper-plane" 
                  colorClass="text-primary" 
                  bgClass="bg-primary-subtle" 
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <StatCard 
                  title="Artisans Contacted" 
                  value={artisansContacted} 
                  icon="fa-user-check" 
                  colorClass="text-success" 
                  bgClass="bg-success-subtle" 
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <StatCard 
                  title="Reviews Written" 
                  value={myReviewsTotal} 
                  icon="fa-star" 
                  colorClass="text-warning" 
                  bgClass="bg-warning-subtle" 
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-3">
                <StatCard 
                  title="Saved Artisans" 
                  value={savedTotal} 
                  icon="fa-heart" 
                  colorClass="text-danger" 
                  bgClass="bg-danger-subtle" 
                />
              </div>
            </div>

            {/* MAIN TWO COLUMN GRID */}
            <div className="row g-4 mb-4">
              
              {/* LEFT COLUMN: ENQUIRIES */}
              <div className="col-12 col-lg-8">
                <div className="card border rounded-3 p-4 bg-white h-100 shadow-xs" id="recent-enquiries-card">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-envelope text-primary"></i>
                      <span>Recent Enquiries</span>
                    </h5>
                    <Link href="/dashboard/customer/enquiries" className="btn btn-link text-primary text-decoration-none p-0 fw-semibold fs-7">
                      View All Enquiries
                    </Link>
                  </div>

                  {recentEnquiries.length === 0 ? (
                    <EmptyState 
                      title="No enquiries sent yet" 
                      description="You haven't initiated any inquiries with local artisans. Browse profiles and contact them to start!" 
                      icon="fa-envelope-open"
                      actionText="Browse Artisans"
                      actionHref="/artisans"
                    />
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0" id="recent-enquiries-table">
                        <thead className="table-light">
                          <tr>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3">#</th>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3">Artisan Name</th>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3">Trade</th>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3">Date</th>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3">Status</th>
                            <th scope="col" className="fs-7 text-uppercase text-muted py-3 text-end">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentEnquiries.map((enq, index) => {
                            const status = (enq.status || 'pending').toLowerCase();
                            let badgeClass = 'bg-secondary';
                            if (status === 'pending') badgeClass = 'bg-warning text-dark';
                            else if (status === 'replied' || status === 'accepted' || status === 'approved') badgeClass = 'bg-info text-white';
                            else if (status === 'completed') badgeClass = 'bg-success text-white';
                            else if (status === 'rejected' || status === 'cancelled') badgeClass = 'bg-danger text-white';

                            return (
                              <tr key={enq.enquiry_id || index}>
                                <td className="fw-semibold text-dark fs-7 py-3">#{enq.enquiry_id || index + 1}</td>
                                <td className="py-3">
                                  <Link href={`/artisans/${enq.artisan_id}`} className="text-decoration-none fw-semibold text-dark hover-text-primary">
                                    {enq.artisan_name || 'Skilled Artisan'}
                                  </Link>
                                </td>
                                <td className="text-secondary fs-7 py-3">{enq.category_name || 'General Service'}</td>
                                <td className="text-muted fs-7 py-3">
                                  {enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric' }) : 'Recent'}
                                </td>
                                <td className="py-3">
                                  <span className={`badge ${badgeClass} text-capitalize rounded-pill px-2.5 py-1.5 fs-8`}>
                                    {status}
                                  </span>
                                </td>
                                <td className="text-end py-3">
                                  <Link 
                                    href={`/dashboard/customer/enquiries/${enq.enquiry_id}`} 
                                    className="btn btn-sm btn-outline-primary px-3 rounded-pill fw-medium fs-8"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: RECENTLY SAVED */}
              <div className="col-12 col-lg-4">
                <div className="card border rounded-3 p-4 bg-white h-100 shadow-xs" id="saved-artisans-sidebar">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                      <i className="fa-solid fa-heart text-danger"></i>
                      <span>Saved Artisans</span>
                    </h5>
                    <Link href="/dashboard/customer/saved" className="btn btn-link text-primary text-decoration-none p-0 fw-semibold fs-7">
                      View All
                    </Link>
                  </div>

                  {savedArtisans.length === 0 ? (
                    <div className="text-center py-4 text-muted fs-7" id="empty-saved-sidebar">
                      <i className="fa-solid fa-heart-crack fs-1 text-light mb-3"></i>
                      <p className="mb-0">You have no saved artisans yet.</p>
                      <Link href="/artisans" className="btn btn-sm btn-primary mt-3 px-3 rounded-pill fw-semibold">
                        Browse Now
                      </Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3" id="saved-artisans-sidebar-list">
                      {savedArtisans.map((artisan) => (
                        <div key={artisan.user_id} className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border">
                          <div 
                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: '48px', height: '48px' }}
                          >
                            {artisan.profile_photo ? (
                              <img src={artisan.profile_photo} alt={artisan.full_name} className="w-100 h-100 rounded-circle object-fit-cover" />
                            ) : (
                              artisan.full_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                            )}
                          </div>
                          <div className="flex-grow-1 overflow-hidden">
                            <Link href={`/artisans/${artisan.user_id}`} className="text-decoration-none text-dark d-block fw-bold fs-7 text-truncate mb-0">
                              {artisan.full_name}
                            </Link>
                            <span className="badge bg-primary-subtle text-primary text-capitalize rounded-pill px-2.5 py-0.5 fs-8">
                              {artisan.category_name}
                            </span>
                          </div>
                          <Link href={`/artisans/${artisan.user_id}`} className="btn btn-sm btn-outline-secondary rounded-circle p-2 flex-shrink-0 border-0">
                            <i className="fa-solid fa-chevron-right fs-7 text-muted"></i>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* NEARBY ARTISANS MAP WIDGET */}
            <div className="mb-5" id="dashboard-nearby-artisans-section">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="fa-solid fa-location-dot text-success"></i>
                  <span>Nearby artisans</span>
                </h5>
                <Link href="/browse" className="btn btn-outline-success btn-sm px-3 rounded-pill fw-semibold">
                  Explore All Artisans
                </Link>
              </div>
              <NearbyArtisans />
            </div>

            {/* RECOMMENDED ARTISANS SECTION */}
            <div className="mb-5" id="dashboard-recommended-section">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="fa-solid fa-thumbs-up text-primary"></i>
                  <span>Recommended Top-Rated Artisans</span>
                </h5>
                <Link href="/artisans" className="btn btn-outline-primary btn-sm px-3 rounded-pill fw-semibold">
                  Browse More
                </Link>
              </div>

              {recommendedArtisans.length === 0 ? (
                <EmptyState 
                  title="No recommended artisans found" 
                  description="We couldn't retrieve top-rated artisan profiles at this time." 
                  icon="fa-users-slash"
                />
              ) : (
                <div className="row g-4">
                  {recommendedArtisans.map((artisan) => (
                    <div key={artisan.user_id || artisan.id} className="col-12 col-md-6 col-lg-4">
                      <ArtisanCard artisan={artisan} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MY RECENT REVIEWS */}
            <div className="mb-4" id="dashboard-my-reviews-section">
              <div className="card border rounded-3 p-4 bg-white shadow-xs">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                    <i className="fa-solid fa-star text-warning"></i>
                    <span>My Recent Reviews</span>
                  </h5>
                  <Link href="/dashboard/customer/reviews" className="btn btn-link text-primary text-decoration-none p-0 fw-semibold fs-7">
                    View All Reviews
                  </Link>
                </div>

                {myReviews.length === 0 ? (
                  <EmptyState 
                    title="No reviews written yet" 
                    description="You haven't left any ratings or testimonials for services rendered. Rate your completed trade transactions!" 
                    icon="fa-star-half-stroke"
                  />
                ) : (
                  <div className="d-flex flex-column gap-2" id="my-reviews-feed">
                    {myReviews.map((review) => (
                      <div key={review.review_id} className="p-3 border rounded-3 mb-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <strong className="text-dark fs-6 d-block mb-1">
                              Reviewed: {review.artisan_name || 'Skilled Artisan'}
                            </strong>
                            <span className="badge bg-secondary text-dark text-capitalize px-2 py-0.5 rounded-pill fs-8">
                              {review.category_name}
                            </span>
                          </div>
                          <span className="text-muted fs-8">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString('en-GH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                          </span>
                        </div>
                        <ReviewCard review={{
                          ...review,
                          reviewer_name: review.customer_name || user.full_name
                        }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

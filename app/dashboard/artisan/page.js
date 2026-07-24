'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import ProfileAvatar from '@/components/ProfileAvatar';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';
import ReviewCard from '@/components/ReviewCard';
import StarRating from '@/components/StarRating';
import { toast } from 'react-hot-toast';

export default function ArtisanDashboardHome() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [quickActionsReady, setQuickActionsReady] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const handleCopyProfileLink = async () => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}/artisan/${user.user_id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
      toast.error('Could not copy link. Please copy manually.');
    }
  };

  useEffect(() => {
    setQuickActionsReady(true);
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;

    // Trigger timer to avoid React cascading render warnings
    const timer = setTimeout(() => {
      async function fetchDashboardData() {
        try {
          setLoadingData(true);
          setError(null);

          // Run fetches simultaneously
          const [meRes, enqRes, revRes, portRes] = await Promise.all([
            fetch('/api/auth/me'),
            fetch('/api/enquiries?limit=5'),
            fetch('/api/reviews?mine=true&limit=3'),
            // Portfolio to compute completion score
            fetch('/api/portfolio')
          ]);

          let profileData = user;
          if (meRes.ok) {
            const meResult = await meRes.json();
            if (meResult.success) {
              profileData = meResult.data;
            }
          }
          setProfile(profileData);

          if (enqRes.ok) {
            const enqResult = await enqRes.json();
            if (enqResult.success) {
              setEnquiries(enqResult.data?.enquiries || []);
            }
          }

          if (revRes.ok) {
            const revResult = await revRes.json();
            if (revResult.success) {
              // Ensure we fallback properly
              const fetchedReviews = revResult.data || [];
              // Map review_text to comment so ReviewCard displays it correctly
              const mapped = fetchedReviews.map((r) => ({
                ...r,
                comment: r.review_text || r.comment,
                reviewer_name: r.customer_name || r.reviewer_name
              }));
              setReviews(mapped);
            }
          }

          if (portRes.ok) {
            const portResult = await portRes.json();
            if (portResult.success && Array.isArray(portResult.data)) {
              setPortfolioCount(portResult.data.length);
            }
          }

        } catch (err) {
          console.error('Error fetching artisan dashboard data:', err);
          setError('Could not retrieve some dashboard metrics. Please reload.');
        } finally {
          setLoadingData(false);
        }
      }

      fetchDashboardData();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access this dashboard." />
        <Link href="/login" className="btn btn-primary rounded-pill mt-3">Go to Login</Link>
      </div>
    );
  }

  // Calculate Profile Completion Score
  // photo (20%), bio (20%), category (15%), region+district (15%), phone (15%), gallery photos (15%)
  const hasPhoto = !!(profile?.profile_photo);
  const hasBio = !!(profile?.artisan_profile?.bio);
  const hasCategory = !!(profile?.artisan_profile?.category_id);
  const hasRegionDistrict = !!(profile?.region && profile?.district);
  const hasPhone = !!(profile?.phone);
  const hasGallery = portfolioCount > 0;

  let completionScore = 0;
  if (hasPhoto) completionScore += 20;
  if (hasBio) completionScore += 20;
  if (hasCategory) completionScore += 15;
  if (hasRegionDistrict) completionScore += 15;
  if (hasPhone) completionScore += 15;
  if (hasGallery) completionScore += 15;

  const artisanProfile = profile?.artisan_profile || {};
  const isApproved = artisanProfile.is_approved === 1 || artisanProfile.is_approved === true;

  // Stats Values
  const statViews = artisanProfile.profile_views || 0;
  const statEnquiries = enquiries.length; // We can show "Total enquiries" if available but let's default nicely
  const statRating = parseFloat(artisanProfile.average_rating || 0).toFixed(1);
  const statReviewsCount = artisanProfile.total_reviews || 0;

  return (
    <DashboardLayout role="artisan" pageTitle="Artisan Dashboard">
      <div className="container-fluid px-0" id="artisan-dashboard-home">
        
        {/* 1. APPROVAL BANNER */}
        {!isApproved && (
          <div className="alert alert-warning border-0 rounded-3 shadow-xs p-3.5 mb-4 d-flex align-items-center gap-3" id="artisan-approval-banner">
            <div className="rounded-circle bg-warning-subtle text-warning d-flex align-items-center justify-content-center p-2.5" style={{ width: '42px', height: '42px' }}>
              <i className="fa-solid fa-triangle-exclamation fs-5"></i>
            </div>
            <div>
              <strong className="text-dark d-block">Approval Pending</strong>
              <span className="fs-7 text-secondary">
                Your profile is pending approval. You will be notified once approved. Complete your profile to speed up the review process.
              </span>
            </div>
          </div>
        )}

        {/* 2. WELCOME BANNER */}
        <div className="p-4 p-md-5 rounded-4 bg-dark text-white mb-4 position-relative overflow-hidden shadow-sm" id="artisan-welcome-banner" style={{ background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)' }}>
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-8">
              <span className="badge bg-primary text-white mb-2 rounded-pill px-3 py-1 fs-8 fw-semibold text-uppercase tracking-wider">
                Ghana Trade Professional
              </span>
              <h2 className="fw-bold mb-1">Welcome back, {profile?.full_name || user.full_name}!</h2>
              <p className="text-gray-400 mb-0 fs-7">
                Your professional profile has been viewed <strong className="text-white">{statViews}</strong> times in total by potential clients.
              </p>
            </div>
            <div className="col-12 col-md-4 text-md-end">
              <div className="d-flex flex-column flex-sm-row justify-content-sm-end align-items-stretch gap-2">
                <Link 
                  href={`/artisan/${user.user_id}`} 
                  className="btn btn-outline-light px-4 py-2.5 rounded-pill fw-semibold shadow-sm hover-bg-light hover-text-dark"
                  target="_blank"
                >
                  <i className="fa-solid fa-arrow-up-right-from-square me-1.5 fs-8"></i>
                  <span>View My Public Profile</span>
                </Link>
                <button 
                  type="button"
                  onClick={handleCopyProfileLink}
                  className="btn btn-light text-dark px-4 py-2.5 rounded-pill fw-semibold shadow-sm"
                >
                  <i className="fa-solid fa-link me-1.5 fs-8"></i>
                  <span>Copy Profile Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
          <div className="me-auto">
            <h5 className="fw-bold mb-1">Dashboard Shortcuts</h5>
            <p className="text-muted mb-0 fs-8">Tap shortcuts to reveal your most important dashboard actions.</p>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light rounded-pill d-inline-flex align-items-center gap-2"
            onClick={() => setShowQuickActions((prev) => !prev)}
          >
            <span>{showQuickActions ? 'Hide shortcuts' : 'Show shortcuts'}</span>
            <i className={`fa-solid fa-chevron-down chevron-icon ${showQuickActions ? 'rotate-180' : ''}`} />
          </button>
        </div>
        <div className={`row g-3 mb-4 staggered-container ${showQuickActions ? 'expanded' : 'collapsed'}`} id="artisan-quick-actions">
          <div className="col-12 col-md-4">
            <Link href="/dashboard/artisan/enquiries" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Respond</span>
                  <h6 className="fw-bold text-dark mb-0">Manage Enquiries</h6>
                </div>
                <i className="fa-solid fa-envelope-open-text text-info fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Track messages from clients and respond quickly to win more jobs.</p>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link href="/dashboard/artisan/profile" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Optimize</span>
                  <h6 className="fw-bold text-dark mb-0">Complete Your Profile</h6>
                </div>
                <i className="fa-solid fa-user-pen text-primary fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Finish every profile section to improve search discoverability.</p>
            </Link>
          </div>
          <div className="col-12 col-md-4">
            <Link href="/dashboard/artisan/gallery" className="card quick-action-card staggered-card border rounded-4 p-3 h-100 text-decoration-none shadow-sm hover-transform">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <span className="text-muted fs-8 text-uppercase fw-semibold">Showcase</span>
                  <h6 className="fw-bold text-dark mb-0">Update Portfolio</h6>
                </div>
                <i className="fa-solid fa-images text-success fs-4"></i>
              </div>
              <p className="text-muted fs-8 mb-0">Add project photos and examples so customers can trust your work.</p>
            </Link>
          </div>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Assembling your personalized dashboard..." />
        ) : (
          <div className="row g-4 mb-4">
            
            {/* STAT CARDS SECTION */}
            <div className="col-12">
              <div className="row g-3">
                {/* CARD 1 */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border rounded-3 p-3.5 bg-white shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted fs-7.5 fw-semibold uppercase tracking-wider">Profile Views</span>
                      <div className="rounded-2 p-2 bg-primary-subtle text-primary">
                        <i className="fa-solid fa-eye fs-5"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{statViews}</h3>
                    <span className="text-muted fs-8">Total page impressions</span>
                  </div>
                </div>

                {/* CARD 2 */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border rounded-3 p-3.5 bg-white shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted fs-7.5 fw-semibold uppercase tracking-wider">Enquiries Received</span>
                      <div className="rounded-2 p-2 bg-info-subtle text-info">
                        <i className="fa-solid fa-envelope fs-5"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{enquiries.length}+</h3>
                    <span className="text-muted fs-8">New messages & enquiries</span>
                  </div>
                </div>

                {/* CARD 3 */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border rounded-3 p-3.5 bg-white shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted fs-7.5 fw-semibold uppercase tracking-wider">Average Rating</span>
                      <div className="rounded-2 p-2 bg-warning-subtle text-warning">
                        <i className="fa-solid fa-star fs-5"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-0 d-flex align-items-center gap-1.5">
                      <span>{statRating}</span>
                      <span className="fs-6 text-warning">⭐</span>
                    </h3>
                    <span className="text-muted fs-8">Calculated feedback score</span>
                  </div>
                </div>

                {/* CARD 4 */}
                <div className="col-12 col-sm-6 col-xl-3">
                  <div className="card border rounded-3 p-3.5 bg-white shadow-xs">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <span className="text-muted fs-7.5 fw-semibold uppercase tracking-wider">Total Reviews</span>
                      <div className="rounded-2 p-2 bg-success-subtle text-success">
                        <i className="fa-solid fa-comments fs-5"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold text-dark mb-0">{statReviewsCount}</h3>
                    <span className="text-muted fs-8">Published customer evaluations</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LEFT COLUMN: ENQUIRIES & REVIEWS */}
            <div className="col-12 col-lg-8">
              
              {/* RECENT ENQUIRIES */}
              <div className="card border rounded-4 p-4 bg-white shadow-xs mb-4" id="recent-enquiries-box">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">Recent Enquiries</h5>
                    <p className="text-muted mb-0 fs-8">Enquiries submitted by clients requesting your trade services.</p>
                  </div>
                  <Link href="/dashboard/artisan/enquiries" className="btn btn-link p-0 text-primary fw-semibold fs-7 text-decoration-none">
                    View All Enquiries <i className="fa-solid fa-arrow-right fs-8"></i>
                  </Link>
                </div>

                {enquiries.length === 0 ? (
                  <EmptyState 
                    title="No received enquiries" 
                    description="You have not received any service enquiries yet. Make sure your profile is complete to get noticed!" 
                    icon="fa-envelope-open"
                  />
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0" id="recent-enquiries-table">
                      <thead className="table-light fs-8 text-secondary uppercase tracking-wider">
                        <tr>
                          <th className="py-3 border-0">Customer Name</th>
                          <th className="py-3 border-0">Date</th>
                          <th className="py-3 border-0">Subject</th>
                          <th className="py-3 border-0">Status</th>
                          <th className="py-3 border-0 text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enquiries.map((enq) => {
                          const id = enq.enquiry_id || enq.id;
                          const truncatedSubject = enq.subject && enq.subject.length > 35 
                            ? `${enq.subject.substring(0, 35)}...` 
                            : enq.subject;

                          let statusBadge = 'bg-warning text-dark';
                          if (enq.status === 'replied') statusBadge = 'bg-success text-white';

                          return (
                            <tr key={id}>
                              <td className="py-3 fw-semibold text-dark">{enq.customer_name || 'Client'}</td>
                              <td className="py-3 text-muted fs-7.5">
                                {enq.created_at ? new Date(enq.created_at).toLocaleDateString('en-GH') : 'Recent'}
                              </td>
                              <td className="py-3 text-secondary fs-7.5">{truncatedSubject}</td>
                              <td className="py-3">
                                <span className={`badge ${statusBadge} text-capitalize px-2 rounded-pill fs-8`}>
                                  {enq.status || 'pending'}
                                </span>
                              </td>
                              <td className="py-3 text-end">
                                <Link 
                                  href={`/dashboard/artisan/enquiries/${id}`} 
                                  className="btn btn-sm btn-primary rounded-pill px-3 fs-8 fw-semibold"
                                >
                                  Reply
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

              {/* WHAT CUSTOMERS ARE SAYING */}
              <div className="card border rounded-4 p-4 bg-white shadow-xs" id="recent-reviews-box">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">What Customers Are Saying</h5>
                    <p className="text-muted mb-0 fs-8">Direct reviews published on your platform profile.</p>
                  </div>
                  <Link href="/dashboard/artisan/reviews" className="btn btn-link p-0 text-primary fw-semibold fs-7 text-decoration-none">
                    View All Reviews <i className="fa-solid fa-arrow-right fs-8"></i>
                  </Link>
                </div>

                {reviews.length === 0 ? (
                  <EmptyState 
                    title="No client reviews yet" 
                    description="You haven't received any customer feedback reviews yet. Provide stellar trade works to start gaining ratings!" 
                    icon="fa-star-half-stroke"
                  />
                ) : (
                  <div className="d-flex flex-column" id="recent-reviews-list">
                    {reviews.map((rev) => (
                      <ReviewCard key={rev.review_id} review={rev} />
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* RIGHT COLUMN: PROFILE COMPLETION */}
            <div className="col-12 col-lg-4">
              <div className="card border rounded-4 p-4 bg-white shadow-xs h-100" id="profile-completion-box">
                <h5 className="fw-bold text-dark mb-1">Profile Completion</h5>
                <p className="text-muted mb-4 fs-8">Complete all sections to maximize your search rankings across Ghana.</p>

                {/* Progress Circle/Bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold text-dark fs-7">Completed Score</span>
                    <span className="badge bg-primary text-white rounded-pill px-2.5 py-1 fw-bold fs-7">{completionScore}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div 
                      className="progress-bar bg-success rounded-pill" 
                      role="progressbar" 
                      style={{ width: `${completionScore}%` }} 
                      aria-valuenow={completionScore} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    ></div>
                  </div>
                </div>

                {/* Checklist */}
                <div className="d-flex flex-column gap-3 mb-4" id="completion-checklist">
                  {/* Photo */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasPhoto ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasPhoto ? 'text-dark fw-medium' : 'text-muted'}`}>Profile Photo Added (20%)</span>
                  </div>

                  {/* Bio */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasBio ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasBio ? 'text-dark fw-medium' : 'text-muted'}`}>Professional Biography (20%)</span>
                  </div>

                  {/* Category */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasCategory ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasCategory ? 'text-dark fw-medium' : 'text-muted'}`}>Trade Category Selected (15%)</span>
                  </div>

                  {/* Region+District */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasRegionDistrict ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasRegionDistrict ? 'text-dark fw-medium' : 'text-muted'}`}>Ghana Region & District (15%)</span>
                  </div>

                  {/* Phone */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasPhone ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasPhone ? 'text-dark fw-medium' : 'text-muted'}`}>Verified Phone Contact (15%)</span>
                  </div>

                  {/* Gallery */}
                  <div className="d-flex align-items-center gap-2.5">
                    {hasGallery ? (
                      <i className="fa-solid fa-circle-check text-success fs-5"></i>
                    ) : (
                      <i className="fa-regular fa-circle-xmark text-danger fs-5"></i>
                    )}
                    <span className={`fs-7.5 ${hasGallery ? 'text-dark fw-medium' : 'text-muted'}`}>Showcase Gallery Photos (15%)</span>
                  </div>
                </div>

                <Link 
                  href="/dashboard/artisan/profile" 
                  className="btn btn-primary w-100 py-2.5 rounded-pill fw-bold mt-auto d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="fa-solid fa-user-pen"></i>
                  <span>Complete Your Profile</span>
                </Link>
              </div>
            </div>

          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

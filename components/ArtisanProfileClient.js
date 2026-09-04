/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ProfileAvatar from './ProfileAvatar';
import StarRating from './StarRating';
import SaveButton from './SaveButton';
import ReviewCard from './ReviewCard';
import EmptyState from './EmptyState';
import dynamic from 'next/dynamic';

const ServiceCostEstimator = dynamic(() => import('./ServiceCostEstimator'), { ssr: false, loading: () => null });
const ReferralShareHub = dynamic(() => import('./ReferralShareHub'), { ssr: false, loading: () => null });

export default function ArtisanProfileClient({ 
  artisan, 
  reviews = [], 
  gallery = [], 
  isInitiallySaved = false,
  currentUser = null
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('about'); // 'about', 'reviews', 'gallery'
  const [reviewFilter, setReviewFilter] = useState('all');
  const [existingEnquiry, setExistingEnquiry] = useState(null);
  const [loadingEnquiry, setLoadingEnquiry] = useState(false);
  const [existingEnquiryError, setExistingEnquiryError] = useState('');
  
  // Enquiry form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApplyEstimate = (estSubject, estMessage) => {
    setSubject(estSubject);
    setMessage(estMessage);
    toast.success('Calculated estimate applied to your enquiry!');
    const contactCard = document.getElementById('contact-card');
    if (contactCard) {
      contactCard.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    async function loadExistingEnquiry() {
      if (!currentUser || currentUser.role !== 'customer' || !artisan?.user_id) {
        return;
      }

      setLoadingEnquiry(true);
      setExistingEnquiryError('');

      try {
        const response = await fetch(`/api/enquiries?artisan_id=${artisan.user_id}&status=all&limit=1`);
        const result = await response.json();
        if (response.ok && result.success && result.data?.enquiries?.length > 0) {
          setExistingEnquiry(result.data.enquiries[0]);
        }
      } catch (err) {
        console.error('Existing enquiry fetch error:', err);
        setExistingEnquiryError('Could not determine whether an existing chat exists.');
      } finally {
        setLoadingEnquiry(false);
      }
    }

    loadExistingEnquiry();
  }, [artisan, currentUser]);

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error('Please login as a customer to contact this artisan.');
      router.push(`/login?redirect=/artisan/${artisan.user_id}`);
      return;
    }

    if (currentUser.role !== 'customer') {
      toast.error('Only customers can send enquiries.');
      return;
    }

    if (!subject.trim()) {
      toast.error('Please enter an enquiry subject.');
      return;
    }

    if (!message.trim() || message.trim().length < 20) {
      toast.error('Please write a message of at least 20 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artisan_id: artisan.user_id,
          subject: subject.trim(),
          message: message.trim()
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success('Your service enquiry has been sent successfully!');
        setSubject('');
        setMessage('');
      } else {
        toast.error(result.error || 'Failed to send enquiry.');
      }
    } catch (err) {
      console.error('Enquiry submission error:', err);
      toast.error('An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const memberSince = artisan.joined_at ? new Date(artisan.joined_at).toLocaleDateString('en-GH', {
    year: 'numeric',
    month: 'long'
  }) : 'Recently';

  return (
    <div className="container py-5" id={`artisan-profile-client-${artisan.user_id}`}>
      
      {/* HEADER CARD */}
      <div className="card border rounded-4 p-4 p-md-5 bg-white shadow-sm mb-4">
        <div className="d-flex flex-column flex-md-row align-items-center align-items-md-start gap-4 text-center text-md-start">
          <ProfileAvatar 
            name={artisan.full_name} 
            photo_url={artisan.profile_photo} 
            size="xl" 
          />
          <div className="flex-grow-1">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center align-items-md-start gap-3">
              <div>
                <h2 className="fw-bold text-dark mb-1">{artisan.full_name}</h2>
                <div className="d-flex flex-wrap align-items-center justify-content-center justify-content-md-start gap-2 mb-2">
                  <span className="badge bg-primary px-3 py-1.5 rounded-pill fs-7">
                    {artisan.category_name}
                  </span>
                  <span className={`badge ${artisan.is_available !== 0 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                    {artisan.is_available !== 0 ? 'Available' : 'Busy'}
                  </span>
                  {artisan.accepts_emergency === 1 && <span className="badge bg-danger-subtle text-danger">Emergency ready</span>}
                  {artisan.is_verified === 1 && <span className="badge bg-info-subtle text-info">Verified</span>}
                  {artisan.ghana_card_verified === 1 && <span className="badge bg-success-subtle text-success">Ghana Card verified</span>}
                  {artisan.police_checked === 1 && <span className="badge bg-success-subtle text-success">Police checked</span>}
                  {artisan.trade_certified === 1 && <span className="badge bg-warning-subtle text-warning-emphasis">Trade certified</span>}
                  {Number(artisan.approved_guarantor_count) > 0 && <span className="badge bg-primary-subtle text-primary">{artisan.approved_guarantor_count} approved reference{Number(artisan.approved_guarantor_count) === 1 ? '' : 's'}</span>}
                  <span className="text-muted small d-flex align-items-center gap-1">
                    <i className="fa-solid fa-location-dot text-primary"></i>
                    {artisan.district}, {artisan.region}
                  </span>
                </div>
                
                <div className="d-flex align-items-center justify-content-center justify-content-md-start gap-2 mb-3">
                  <StarRating rating={artisan.average_rating} size="sm" />
                  <span className="fw-bold text-dark small mt-0.5">
                    {parseFloat(artisan.average_rating || 0).toFixed(1)}
                  </span>
                  <span className="text-muted small mt-0.5">
                    ({artisan.total_reviews} {artisan.total_reviews === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              </div>

              {/* SAVE / ACTIONS */}
              <div className="d-flex align-items-center gap-2">
                {currentUser && currentUser.role === 'customer' && (
                  <SaveButton 
                    artisanId={artisan.user_id} 
                    isInitiallySaved={isInitiallySaved} 
                  />
                )}
                <a href="#contact-card" className="btn btn-primary px-4 py-2.5 rounded-pill shadow-sm">
                  <i className="fa-solid fa-paper-plane me-1.5"></i>
                  Send Enquiry
                </a>
              </div>
            </div>
          </div>
        </div>

        {gallery.length > 0 && (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-3 g-3 mt-4">
            {gallery.slice(0, 3).map((item, idx) => (
              <div key={item.item_id || `preview-${idx}`} className="col">
                <div className="rounded-4 overflow-hidden shadow-sm bg-light" style={{ minHeight: '170px' }}>
                  <img
                    src={item.image_path}
                    alt={item.caption || 'Artisan work sample'}
                    className="w-100 h-100 object-fit-cover"
                    style={{ minHeight: '170px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="row g-4 text-start">
        {/* LEFT COLUMN: Tabs and Details */}
        <div className="col-lg-8">
          
          {/* TABS SELECTOR */}
          <ul className="nav nav-tabs border-bottom mb-4" id="artisanProfileTabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link fw-semibold border-0 px-4 py-2.5 ${activeTab === 'about' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted bg-transparent'}`}
                onClick={() => setActiveTab('about')}
                type="button"
              >
                About Specialty
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link fw-semibold border-0 px-4 py-2.5 ${activeTab === 'reviews' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted bg-transparent'}`}
                onClick={() => setActiveTab('reviews')}
                type="button"
              >
                Reviews ({reviews.length})
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link fw-semibold border-0 px-4 py-2.5 ${activeTab === 'gallery' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted bg-transparent'}`}
                onClick={() => setActiveTab('gallery')}
                type="button"
              >
                Gallery Showcase ({gallery.length})
              </button>
            </li>
          </ul>

          {/* TAB CONTENT */}
          <div className="tab-content" id="artisanProfileTabsContent">
            
            {/* ABOUT TAB */}
            {activeTab === 'about' && (
              <div className="card border-0 bg-transparent py-2">
                <h5 className="fw-bold text-dark mb-3">Biography</h5>
                <p className="text-secondary mb-4 fs-6" style={{ lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {artisan.bio || 'This artisan has not provided a bio description yet.'}
                </p>

                <h5 className="fw-bold text-dark mb-3">Professional Qualifications</h5>
                <div className="row g-3 mb-4">
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Experience</small>
                      <span className="fw-bold text-dark">{artisan.years_experience} Years Active</span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Starting Price</small>
                      <span className="fw-bold text-success">
                        {artisan.starting_price !== null && artisan.starting_price !== undefined
                          ? `From GHS ${Number(artisan.starting_price).toFixed(2)}`
                          : 'Request a quote'}
                      </span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Contact</small>
                      <a href={`tel:${artisan.phone}`} className="fw-bold text-primary text-decoration-none">{artisan.phone}</a>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Member Since</small>
                      <span className="fw-bold text-dark">{memberSince}</span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Trade Category</small>
                      <span className="fw-bold text-primary">{artisan.category_name}</span>
                    </div>
                  </div>
                  <div className="col-sm-6">
                    <div className="border rounded-3 p-3 bg-white">
                      <small className="text-muted uppercase tracking-wider d-block mb-1">Coverage Areas</small>
                      <span className="fw-bold text-dark text-truncate d-block">
                        {artisan.district}, {artisan.region}
                      </span>
                      {artisan.service_areas && <small className="text-muted d-block mt-1">{artisan.service_areas}</small>}
                    </div>
                  </div>
                </div>

                {/* Interactive Cost Estimator Tool */}
                <div className="mb-4">
                  <ServiceCostEstimator 
                    categoryName={artisan.category_name} 
                    artisanName={artisan.full_name} 
                    onApplyEstimate={handleApplyEstimate}
                  />
                </div>

                {/* Recommendation & Share Hub Tool */}
                <div className="mb-2">
                  <ReferralShareHub 
                    artisanId={artisan.user_id} 
                    artisanName={artisan.full_name} 
                    categoryName={artisan.category_name} 
                    averageRating={artisan.average_rating} 
                    district={artisan.district} 
                    region={artisan.region} 
                  />
                </div>
              </div>
            )}

            {/* REVIEWS TAB */}
            {activeTab === 'reviews' && (
              <div className="py-2" id="reviews-tab-content">
                
                {/* 1. RATINGS BREAKDOWN HEADER CARD */}
                <div className="card border rounded-3 p-4 bg-white mb-4 shadow-xs" id="ratings-breakdown-card">
                  <div className="row g-4 align-items-center">
                    
                    {/* Left: Score display */}
                    <div className="col-12 col-md-4 text-center border-md-end border-bottom border-md-bottom-0 pb-3 pb-md-0">
                      <h1 className="fw-black text-dark mb-1" style={{ fontSize: '52px', letterSpacing: '-2px' }}>
                        {parseFloat(artisan.average_rating || 0).toFixed(1)}
                      </h1>
                      <div className="d-flex justify-content-center mb-1">
                        <StarRating rating={parseFloat(artisan.average_rating || 0)} size="md" />
                      </div>
                      <span className="text-muted fs-8 fw-semibold d-block">
                        {artisan.total_reviews} {artisan.total_reviews === 1 ? 'verified review' : 'verified reviews'}
                      </span>

                      {/* Write Review CTA Button */}
                      {currentUser && currentUser.role === 'customer' && (
                        <div className="mt-3">
                          <Link 
                            href={`/dashboard/customer/reviews/new?artisan_id=${artisan.user_id}`} 
                            className="btn btn-sm btn-warning rounded-pill px-3 py-1.5 fw-bold text-dark d-inline-flex align-items-center gap-1.5"
                          >
                            <i className="fa-solid fa-star fs-8"></i>
                            <span>Write a Review</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Right: Star Bar Breakdown */}
                    <div className="col-12 col-md-8">
                      <div className="d-flex flex-column gap-2" id="star-bars">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = reviews.filter((r) => Math.round(parseFloat(r.rating || 0)) === s).length;
                          const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                          return (
                            <div key={s} className="d-flex align-items-center gap-2">
                              <span className="fs-8 text-dark fw-bold" style={{ width: '45px' }}>{s} Star</span>
                              <div className="progress flex-grow-1" style={{ height: '7px' }}>
                                <div
                                  className="progress-bar bg-warning rounded-pill"
                                  role="progressbar"
                                  style={{ width: `${pct}%` }}
                                  aria-valuenow={pct}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                ></div>
                              </div>
                              <span className="text-muted fs-8" style={{ width: '60px' }}>{pct}% ({count})</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                {/* 2. STAR FILTER PILLS */}
                {reviews.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-4" id="review-filters-bar">
                    <span className="fs-8 fw-bold text-secondary me-1">Filter Reviews:</span>
                    <button
                      type="button"
                      onClick={() => setReviewFilter('all')}
                      className={`btn btn-sm rounded-pill px-3 py-1 fs-8 fw-semibold ${reviewFilter === 'all' ? 'btn-primary' : 'btn-outline-secondary'}`}
                    >
                      All ({reviews.length})
                    </button>
                    {[5, 4, 3, 2, 1].map((starVal) => {
                      const count = reviews.filter((r) => Math.round(parseFloat(r.rating || 0)) === starVal).length;
                      if (count === 0 && reviewFilter !== String(starVal)) return null;
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onClick={() => setReviewFilter(String(starVal))}
                          className={`btn btn-sm rounded-pill px-3 py-1 fs-8 fw-semibold ${reviewFilter === String(starVal) ? 'btn-warning text-dark' : 'btn-outline-secondary'}`}
                        >
                          {starVal} ★ ({count})
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. REVIEWS LIST FEED */}
                {reviews.length === 0 ? (
                  <EmptyState 
                    title="No reviews yet"
                    description="This certified artisan has not received any public client reviews yet. Rest assured they are verified and approved by our team."
                    icon="fa-star"
                  />
                ) : (
                  <div className="d-flex flex-column gap-3" id="artisan-public-reviews-list">
                    {reviews
                      .filter((rev) => reviewFilter === 'all' || Math.round(parseFloat(rev.rating || 0)) === parseInt(reviewFilter, 10))
                      .map((rev, idx) => (
                        <ReviewCard 
                          key={rev.review_id || `rev-${idx}`} 
                          review={{
                            ...rev,
                            comment: rev.review_text // map review_text to comment for ReviewCard
                          }} 
                        />
                      ))}
                    {reviews.filter((rev) => reviewFilter === 'all' || Math.round(parseFloat(rev.rating || 0)) === parseInt(reviewFilter, 10)).length === 0 && (
                      <div className="p-4 bg-light text-center rounded-3">
                        <p className="text-muted fs-7 mb-0">No reviews found matching the selected {reviewFilter}-star rating filter.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GALLERY TAB */}
            {activeTab === 'gallery' && (
              <div className="py-2">
                {gallery.length === 0 ? (
                  <EmptyState 
                    title="Empty gallery"
                    description="This artisan has not uploaded any photos of their past work projects yet."
                    icon="fa-images"
                  />
                ) : (
                  <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-3">
                    {gallery.map((item, idx) => (
                      <div key={item.item_id || `item-${idx}`} className="col">
                        <div className="card h-100 border overflow-hidden shadow-sm custom-card-hover bg-white">
                          <img
                            src={item.image_path}
                            alt={item.caption || 'Artisan Work Showcase'}
                            className="card-img-top object-fit-cover"
                            style={{ height: '200px' }}
                          />
                          {item.caption && (
                            <div className="card-body p-3">
                              <h6 className="fw-bold mb-1 text-dark text-truncate">{item.caption}</h6>
                              {item.description && (
                                <p className="text-muted small mb-0 text-truncate">{item.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* RIGHT COLUMN: Contact Form / CTA */}
        <div className="col-lg-4" id="contact-card">
          <div className="card border rounded-4 p-4 bg-white shadow-sm sticky-top" style={{ top: '100px', zIndex: '10' }}>
            <h5 className="fw-bold text-dark mb-3">Contact / Chat With Artisan</h5>
            
            {loadingEnquiry && (
              <div className="alert alert-secondary mb-4 fs-7 d-flex align-items-center gap-2">
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>Checking for an existing conversation...</span>
              </div>
            )}

            {existingEnquiry && currentUser?.role === 'customer' && (
              <div className="alert alert-info mb-4 fs-7">
                <div className="d-flex align-items-start gap-2">
                  <i className="fa-solid fa-comments text-primary mt-1"></i>
                  <div>
                    <p className="mb-1 fw-semibold">Existing conversation found.</p>
                    <p className="mb-0 text-muted">Continue your chat thread with this artisan from your enquiries dashboard.</p>
                    <Link
                      href={`/dashboard/customer/enquiries/${existingEnquiry.enquiry_id}`}
                      className="btn btn-sm btn-primary rounded-pill mt-3"
                    >
                      Open Chat Thread
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {existingEnquiryError && (
              <div className="alert alert-warning mb-4 fs-7">
                {existingEnquiryError}
              </div>
            )}

            {currentUser ? (
              currentUser.role === 'customer' ? (
                <form onSubmit={handleEnquirySubmit}>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Subject of Enquiry</label>
                    <input
                      type="text"
                      className="form-control text-secondary small"
                      placeholder="e.g. Toilet Leaking Repair Quote"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-secondary small fw-medium">Your Message</label>
                    <textarea
                      className="form-control text-secondary small"
                      rows="5"
                      placeholder="Explain your work requirements in detail, location, and desired timeline..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      minLength={20}
                      required
                    ></textarea>
                    <div className="form-text fs-8 text-muted">
                      Minimum 20 characters required.
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-pill py-2.5 fs-7 fw-semibold mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Sending Message...
                      </>
                    ) : (
                      'Submit enquiry request'
                    )}
                  </button>
                </form>
              ) : (
                <div className="alert alert-warning mb-0 fs-7" role="alert">
                  <i className="fa-solid fa-triangle-exclamation me-1.5"></i>
                  Only customer accounts can initiate trade service enquiries.
                </div>
              )
            ) : (
              <div className="text-center py-3">
                <p className="text-muted small mb-4">Please log in to your customer account to submit an enquiry and contact this professional directly.</p>
                <Link 
                  href={`/login?redirect=/artisan/${artisan.user_id}`} 
                  className="btn btn-outline-primary w-100 rounded-pill py-2.5 fs-7 fw-semibold"
                >
                  Login to Contact This Artisan
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

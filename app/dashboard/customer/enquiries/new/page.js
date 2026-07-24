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

function NewEnquiryFormContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramArtisanId = searchParams.get('artisan_id');

  // Artisan list and selection state
  const [artisans, setArtisans] = useState([]);
  const [loadingArtisans, setLoadingArtisans] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Form Fields
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // 1. Fetch Selected Artisan details if param exists
  useEffect(() => {
    if (paramArtisanId) {
      async function fetchSelectedArtisan() {
        try {
          const res = await fetch(`/api/artisans/${paramArtisanId}`);
          if (res.ok) {
            const result = await res.json();
            if (result.success && result.data) {
              setSelectedArtisan(result.data);
            }
          }
        } catch (err) {
          console.error('Error fetching preselected artisan profile:', err);
        }
      }
      fetchSelectedArtisan();
    }
  }, [paramArtisanId]);

  // 2. Fetch all artisans for search autocomplete
  useEffect(() => {
    async function fetchAllArtisans() {
      try {
        setLoadingArtisans(true);
        // Fetch up to 100 artisans to power local search auto-complete
        const res = await fetch('/api/artisans?limit=100');
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            const list = result.data.artisans || result.data || [];
            setArtisans(list);
          }
        }
      } catch (err) {
        console.error('Error loading artisans list:', err);
      } finally {
        setLoadingArtisans(false);
      }
    }
    fetchAllArtisans();
  }, []);

  // Filter artisans list for autocomplete
  const filteredArtisans = artisans.filter((artisan) => {
    const q = searchQuery.toLowerCase();
    const nameMatch = (artisan.full_name || artisan.name || '').toLowerCase().includes(q);
    const categoryMatch = (artisan.category_name || '').toLowerCase().includes(q);
    const regionMatch = (artisan.region || '').toLowerCase().includes(q);
    return nameMatch || categoryMatch || regionMatch;
  });

  // Handle Artisan Select
  const handleSelectArtisan = (artisan) => {
    setSelectedArtisan(artisan);
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const artisanId = selectedArtisan?.user_id || selectedArtisan?.id;
    if (!artisanId) {
      setError('Please select an artisan for your trade service enquiry.');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a short subject for your enquiry.');
      return;
    }

    if (message.trim().length < 20) {
      setError('Your detailed message must be at least 20 characters long.');
      return;
    }

    if (message.trim().length > 1000) {
      setError('Your message cannot exceed 1000 characters.');
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artisan_id: artisanId,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSuccess('Your trade enquiry has been sent successfully! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard/customer/enquiries');
        }, 1500);
      } else {
        setError(result.error || 'Failed to submit trade enquiry.');
      }
    } catch (err) {
      console.error('Submit enquiry error:', err);
      setError('An unexpected server communication error occurred.');
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
    <DashboardLayout role="customer" pageTitle="Send Enquiry">
      <div className="container-fluid px-0" id="send-enquiry-root">
        
        {/* Back navigation */}
        <div className="mb-4">
          <Link 
            href="/dashboard/customer/enquiries" 
            className="btn btn-outline-secondary px-3 py-2 rounded-pill d-inline-flex align-items-center gap-1.5 hover-bg-light text-decoration-none"
          >
            <i className="fa-solid fa-arrow-left fs-7"></i>
            <span>Cancel and Go Back</span>
          </Link>
        </div>

        {/* Headings */}
        <div className="mb-4">
          <h4 className="fw-bold text-dark mb-1">New Service Enquiry</h4>
          <p className="text-muted mb-0 fs-7">
            Submit an enquiry to discuss job requirements, cost estimations, or schedule work with our verified artisans.
          </p>
        </div>

        {/* Notifications and Responses */}
        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} />}

        <div className="row g-4">
          {/* LEFT: FORM COLUMN */}
          <div className="col-12 col-lg-8">
            <div className="card border rounded-3 p-4 bg-white shadow-xs">
              <form onSubmit={handleSubmit} id="new-enquiry-form">
                
                {/* FIELD 1: ARTISAN SELECT autocomplete */}
                <div className="mb-4 position-relative">
                  <label className="form-label fw-bold text-dark fs-7 mb-2 d-flex justify-content-between">
                    <span>1. Target Artisan</span>
                    {selectedArtisan && (
                      <button
                        type="button"
                        onClick={() => setSelectedArtisan(null)}
                        className="btn btn-link text-danger p-0 border-0 fs-8 fw-semibold text-decoration-none"
                        style={{ cursor: 'pointer' }}
                      >
                        Change Artisan
                      </button>
                    )}
                  </label>

                  {selectedArtisan ? (
                    /* Display Selected Artisan Card Box */
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border" id="selected-artisan-box">
                      <ProfileAvatar 
                        name={selectedArtisan.full_name || selectedArtisan.name} 
                        photo_url={selectedArtisan.profile_photo} 
                        size="md" 
                      />
                      <div className="flex-grow-1">
                        <strong className="text-dark d-block mb-1">{selectedArtisan.full_name || selectedArtisan.name}</strong>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-primary text-white text-capitalize rounded-pill px-2.5 py-0.5 fs-8">
                            {selectedArtisan.category_name}
                          </span>
                          <div className="d-flex align-items-center gap-1 fs-8 text-secondary">
                            <StarRating rating={parseFloat(selectedArtisan.average_rating || 0)} size="sm" />
                            <strong>{parseFloat(selectedArtisan.average_rating || 0).toFixed(1)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Autocomplete Input Search Selector */
                    <div id="autocomplete-search-container">
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="fa-solid fa-magnifying-glass text-muted"></i>
                        </span>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowDropdown(true);
                          }}
                          onFocus={() => setShowDropdown(true)}
                          className="form-control border-start-0 py-2.5 shadow-none"
                          placeholder={loadingArtisans ? "Loading artisan list..." : "Type to search artisan by name, category or region..."}
                          disabled={loadingArtisans}
                        />
                      </div>

                      {/* Dropdown Suggestions */}
                      {showDropdown && searchQuery.trim() !== '' && (
                        <div 
                          className="dropdown-menu show w-100 shadow border-0 mt-1 p-2 rounded-3 overflow-y-auto"
                          style={{ maxHeight: '300px', zIndex: 100 }}
                          id="artisan-search-dropdown"
                        >
                          {filteredArtisans.length === 0 ? (
                            <div className="text-muted text-center py-3 fs-7">
                              No matching active artisans found.
                            </div>
                          ) : (
                            filteredArtisans.map((artisan) => (
                              <button
                                key={artisan.user_id || artisan.id}
                                type="button"
                                onClick={() => handleSelectArtisan(artisan)}
                                className="dropdown-item d-flex align-items-center gap-3 p-2 rounded-2 border-0 bg-transparent text-start"
                                style={{ cursor: 'pointer' }}
                              >
                                <ProfileAvatar 
                                  name={artisan.full_name || artisan.name} 
                                  photo_url={artisan.profile_photo} 
                                  size="sm" 
                                />
                                <div className="flex-grow-1 overflow-hidden">
                                  <strong className="text-dark d-block fs-7 text-truncate">{artisan.full_name || artisan.name}</strong>
                                  <div className="d-flex align-items-center gap-2">
                                    <span className="badge bg-primary-subtle text-primary text-capitalize rounded-pill px-2.5 py-0.5" style={{ fontSize: '10px' }}>
                                      {artisan.category_name}
                                    </span>
                                    <span className="text-muted" style={{ fontSize: '11px' }}>
                                      <i className="fa-solid fa-location-dot me-1"></i>
                                      {artisan.district ? `${artisan.district}, ${artisan.region}` : artisan.region}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* FIELD 2: SUBJECT */}
                <div className="mb-4">
                  <label htmlFor="enquiry-subject-input" className="form-label fw-bold text-dark fs-7 mb-2">
                    2. Enquiry Subject
                  </label>
                  <input
                    type="text"
                    id="enquiry-subject-input"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value.substring(0, 200))}
                    className="form-control py-2.5 shadow-none"
                    placeholder="e.g. Broken pipe in kitchen or Roofing leakage repairs"
                    required
                  />
                  <div className="form-text d-flex justify-content-between text-muted fs-8 mt-1">
                    <span>Be brief and specific.</span>
                    <span>{subject.length}/200 characters</span>
                  </div>
                </div>

                {/* FIELD 3: DETAILED MESSAGE */}
                <div className="mb-4">
                  <label htmlFor="enquiry-message-input" className="form-label fw-bold text-dark fs-7 mb-2">
                    3. Job Requirement Details
                  </label>
                  <textarea
                    id="enquiry-message-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value.substring(0, 1000))}
                    className="form-control shadow-none"
                    rows="6"
                    placeholder="Please explain in detail what service you require. Include location details, preferred schedules, and any structural details. Minimum 20 characters."
                    required
                  ></textarea>
                  <div className="form-text d-flex justify-content-between text-muted fs-8 mt-1">
                    <span>Explain clearly. Min 20, Max 1000 chars.</span>
                    <span className={message.length < 20 ? 'text-danger' : 'text-success'}>
                      {message.length}/1000 characters
                    </span>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <div className="border-top pt-4">
                  <button
                    type="submit"
                    className="btn btn-primary px-5 py-2.5 rounded-pill shadow-sm fw-bold d-inline-flex align-items-center gap-2"
                    disabled={submitting}
                    style={{ cursor: submitting ? 'not-allowed' : 'pointer' }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        <span>Sending Enquiry...</span>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-paper-plane"></i>
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* RIGHT: SAFETY & ADVICE SIDEBAR */}
          <div className="col-12 col-lg-4">
            <div className="card border rounded-3 p-4 bg-light shadow-xs h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="fa-solid fa-shield-halved text-success"></i>
                <span>Safety & Best Practices</span>
              </h5>
              
              <ul className="d-flex flex-column gap-3 fs-7 text-secondary ps-3 mb-0" style={{ lineHeight: '1.6' }}>
                <li>
                  <strong className="text-dark d-block mb-1">Verify credentials on profile:</strong>
                  Check reviews, ratings, and years of experience on the artisan&apos;s public profile.
                </li>
                <li>
                  <strong className="text-dark d-block mb-1">Be specific in job details:</strong>
                  Describe the issue accurately to help the artisan estimate materials cost correctly.
                </li>
                <li>
                  <strong className="text-dark d-block mb-1">No upfront full payment:</strong>
                  Discuss pricing through enquiries, and always pay incrementally as milestones are completed.
                </li>
                <li>
                  <strong className="text-dark d-block mb-1">Meet in a secure workspace:</strong>
                  For safety, ensure work is conducted in residential/corporate areas with other people nearby.
                </li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}

export default function CustomerNewEnquiry() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading Send Enquiry context..." />}>
      <NewEnquiryFormContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import DashboardLayout from '@/components/DashboardLayout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import ArtisanProfileClient from '@/components/ArtisanProfileClient';

export default function ArtisanProfilePreview() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const timer = setTimeout(() => {
      async function loadPublicProfile() {
        try {
          setLoadingData(true);
          setError(null);

          // Retrieve the live public-facing artisan data
          const response = await fetch(`/api/artisans/${user.user_id}`);
          const result = await response.json();

          if (response.ok && result.success && result.data) {
            setProfile(result.data);
          } else {
            setError(result.error || 'Failed to download public-facing profile configurations.');
          }
        } catch (err) {
          console.error('Error fetching public profile preview:', err);
          setError('A connection exception occurred while loading your public profile.');
        } finally {
          setLoadingData(false);
        }
      }

      loadPublicProfile();
    }, 0);

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  if (authLoading) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (!user || user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can preview profile designs." />
      </div>
    );
  }

  // Combine portfolio and gallery for high compatibility with the ArtisanProfileClient component
  const galleryToShow = profile && profile.portfolio && profile.portfolio.length > 0
    ? profile.portfolio.map((item) => ({
        ...item,
        gallery_id: item.item_id,
        uploaded_at: item.created_at
      }))
    : (profile?.gallery || []);

  return (
    <DashboardLayout role="artisan" pageTitle="Public Profile Preview">
      <div className="container-fluid px-0" id="artisan-preview-view">
        
        {/* Banner Alert informing about Preview Mode */}
        <div className="alert alert-info border-0 rounded-3 shadow-xs p-3.5 mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3" id="preview-mode-banner">
          <div className="d-flex align-items-center gap-2.5">
            <div className="rounded-circle bg-info-subtle text-info d-flex align-items-center justify-content-center" style={{ width: '38px', height: '38px' }}>
              <i className="fa-solid fa-eye fs-6"></i>
            </div>
            <div>
              <strong className="text-dark d-block">Public Profile Preview Mode</strong>
              <span className="fs-8 text-secondary">
                You are viewing your profile exactly how it is displayed to visitors on the SkillsConnect Ghana platform.
              </span>
            </div>
          </div>
          <span className="badge bg-primary text-white text-uppercase px-2.5 py-1.5 fs-8.5 rounded-pill fw-semibold">
            Live View Simulator
          </span>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

        {loadingData ? (
          <LoadingSpinner message="Assembling public profile components..." />
        ) : !profile ? (
          <div className="text-center py-5 bg-white border rounded shadow-xs">
            <p className="text-muted mb-0">Public profile details are currently empty or unavailable.</p>
          </div>
        ) : (
          <div className="bg-light rounded-4 border p-2 p-md-3" id="artisan-profile-canvas-wrapper">
            {/* Renders the full public profile client component */}
            <ArtisanProfileClient
              artisan={{
                ...profile,
                // Fallbacks
                category_name: profile.category_name || user.artisan_profile?.category_name || 'Skilled Trade Professional',
                average_rating: profile.average_rating || user.artisan_profile?.average_rating || 0,
                total_reviews: profile.total_reviews || user.artisan_profile?.total_reviews || 0,
                bio: profile.bio || user.artisan_profile?.bio || 'Biography coming soon.',
                years_experience: profile.years_experience || user.artisan_profile?.years_experience || 0
              }}
              reviews={profile.reviews || []}
              gallery={galleryToShow}
              isInitiallySaved={false}
              currentUser={null} // Pass null to prevent showing own save button or contact form actions to yourself
            />
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}

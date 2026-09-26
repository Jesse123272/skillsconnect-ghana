'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';
import { toast } from 'react-hot-toast';

export default function ArtisanDashboardHome() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [profile, setProfile] = useState(null);
  const [enquiriesCount, setEnquiriesCount] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    async function fetchDashboardSummary() {
      try {
        setLoadingData(true);
        setError(null);
        const [profileResponse, enquiriesResponse] = await Promise.all([
          authFetch('/api/auth/me'),
          authFetch('/api/enquiries?limit=5'),
        ]);
        const [profileResult, enquiriesResult] = await Promise.all([
          profileResponse.ok ? profileResponse.json() : null,
          enquiriesResponse.ok ? enquiriesResponse.json() : null,
        ]);
        if (!active) return;

        setProfile(profileResult?.success ? profileResult.data : user);
        const enquiries = enquiriesResult?.data?.enquiries || enquiriesResult?.data || [];
        setEnquiriesCount(enquiriesResult?.success ? (enquiriesResult.data?.total ?? enquiries.length) : 0);
      } catch (fetchError) {
        console.error('Error fetching artisan dashboard summary:', fetchError);
        if (active) setError('Unable to load your dashboard summary. Please try again.');
      } finally {
        if (active) setLoadingData(false);
      }
    }

    fetchDashboardSummary();
    return () => {
      active = false;
    };
  }, [authFetch, authLoading, user]);

  if (authLoading || !user) {
    return <LoadingSpinner message="Verifying credentials..." fullPage />;
  }

  if (user.role !== 'artisan') {
    return (
      <div className="container py-5 text-center" id="unauthorized-placeholder">
        <AlertMessage type="danger" message="Access Denied. Only artisans can access this dashboard." />
        <Link href="/login" className="btn btn-primary rounded-pill mt-3">Go to Login</Link>
      </div>
    );
  }

  const artisanProfile = profile?.artisan_profile || {};
  const isApproved = artisanProfile.is_approved === 1 || artisanProfile.is_approved === true;
  const profileUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/artisan/${user.user_id}`;

  const handleCopyProfileLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Profile link copied to clipboard.');
    } catch (copyError) {
      console.error('Clipboard copy failed:', copyError);
      toast.error('Could not copy the profile link.');
    }
  };

  return (
    <div className="container-fluid px-0" id="artisan-dashboard-home">
      {!isApproved && (
        <AlertMessage
          type="warning"
          message="Your profile is pending approval. Complete your profile to help speed up the review."
        />
      )}
      {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

      <section className="card border-0 rounded-3 mb-4 p-4 text-white shadow-sm bg-dark" aria-labelledby="artisan-dashboard-title">
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-8">
            <h2 id="artisan-dashboard-title" className="h3 fw-bold mb-1">Welcome back, {profile?.full_name || user.full_name}!</h2>
            <p className="text-white-50 mb-0">Your profile has {artisanProfile.profile_views || 0} views.</p>
          </div>
          <div className="col-12 col-md-4 d-flex flex-wrap justify-content-md-end gap-2">
            <Link href="/dashboard/artisan/profile" className="btn btn-light text-dark rounded-pill px-4 fw-semibold">
              Update profile
            </Link>
            <button type="button" onClick={handleCopyProfileLink} className="btn btn-outline-light rounded-pill px-4">
              Share profile
            </button>
          </div>
        </div>
      </section>

      {loadingData ? (
        <LoadingSpinner message="Loading your summary..." />
      ) : (
        <div className="row g-3" id="artisan-dashboard-stats">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Profile Views" value={artisanProfile.profile_views || 0} icon="fa-eye" colorClass="text-primary" bgClass="bg-primary-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Enquiries" value={enquiriesCount} icon="fa-envelope" colorClass="text-info" bgClass="bg-info-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Average Rating" value={Number(artisanProfile.average_rating || 0).toFixed(1)} icon="fa-star" colorClass="text-warning" bgClass="bg-warning-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Reviews" value={artisanProfile.total_reviews || 0} icon="fa-comments" colorClass="text-success" bgClass="bg-success-subtle" />
          </div>
        </div>
      )}
    </div>
  );
}
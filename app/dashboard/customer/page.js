'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import AlertMessage from '@/components/AlertMessage';

export default function CustomerDashboardHome() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enquiriesTotal, setEnquiriesTotal] = useState(0);
  const [artisansContacted, setArtisansContacted] = useState(0);
  const [reviewsTotal, setReviewsTotal] = useState(0);
  const [savedTotal, setSavedTotal] = useState(0);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    async function fetchDashboardSummary() {
      try {
        setLoading(true);
        setError(null);
        const [enquiriesResponse, reviewsResponse, savedResponse] = await Promise.all([
          authFetch('/api/enquiries?limit=5'),
          authFetch('/api/reviews?user_id=me&limit=2'),
          authFetch('/api/saved?limit=3'),
        ]);

        const [enquiriesResult, reviewsResult, savedResult] = await Promise.all([
          enquiriesResponse.ok ? enquiriesResponse.json() : null,
          reviewsResponse.ok ? reviewsResponse.json() : null,
          savedResponse.ok ? savedResponse.json() : null,
        ]);
        if (!active) return;

        const enquiries = enquiriesResult?.data?.enquiries || enquiriesResult?.data || [];
        setEnquiriesTotal(enquiriesResult?.success ? (enquiriesResult.data?.total ?? enquiries.length) : 0);
        setArtisansContacted(new Set(enquiries.map((enquiry) => enquiry.artisan_id)).size);

        const reviews = reviewsResult?.success ? (reviewsResult.data || []) : [];
        setReviewsTotal(reviews.length);

        const saved = savedResult?.data?.saved_artisans || savedResult?.data || [];
        setSavedTotal(savedResult?.success ? (savedResult.data?.total ?? saved.length) : 0);
      } catch (fetchError) {
        console.error('Error fetching customer dashboard summary:', fetchError);
        if (active) setError('Unable to load your dashboard summary. Please try again.');
      } finally {
        if (active) setLoading(false);
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

  return (
    <div className="container-fluid px-0" id="customer-dashboard-home">
      {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

      <section
        className="card border-0 rounded-3 mb-4 p-4 text-white shadow-sm"
        style={{ background: 'linear-gradient(135deg, #1A6B3C 0%, #2E7D32 100%)' }}
        aria-labelledby="customer-dashboard-title"
      >
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-8">
            <h2 id="customer-dashboard-title" className="h3 fw-bold mb-1">Welcome back, {user.full_name}!</h2>
            <p className="mb-0 text-white-50">Your marketplace activity at a glance.</p>
          </div>
          <div className="col-12 col-md-4 text-md-end">
            <Link href="/dashboard/customer/discover" className="btn btn-light text-success rounded-pill px-4 fw-semibold">
              Discover artisans
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <LoadingSpinner message="Loading your summary..." />
      ) : (
        <div className="row g-3" id="dashboard-stats-grid">
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Total Enquiries" value={enquiriesTotal} icon="fa-paper-plane" colorClass="text-primary" bgClass="bg-primary-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Artisans Contacted" value={artisansContacted} icon="fa-user-check" colorClass="text-success" bgClass="bg-success-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Reviews Written" value={reviewsTotal} icon="fa-star" colorClass="text-warning" bgClass="bg-warning-subtle" />
          </div>
          <div className="col-12 col-sm-6 col-xl-3">
            <StatCard title="Saved Artisans" value={savedTotal} icon="fa-heart" colorClass="text-danger" bgClass="bg-danger-subtle" />
          </div>
        </div>
      )}
    </div>
  );
}
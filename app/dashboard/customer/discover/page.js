'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ArtisanCard from '@/components/ArtisanCard';
import AlertMessage from '@/components/AlertMessage';
import EmptyState from '@/components/EmptyState';
import LoadingSpinner from '@/components/LoadingSpinner';

const NearbyArtisans = dynamic(
  () => import('@/components/NearbyArtisans'),
  { ssr: false, loading: () => <LoadingSpinner message="Loading nearby artisans..." /> }
);

export default function CustomerDiscoverPage() {
  const { user, loading: authLoading, authFetch } = useAuth();
  const [recommendedArtisans, setRecommendedArtisans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user) return;

    let active = true;
    async function loadRecommendations() {
      try {
        const response = await authFetch('/api/artisans?sort=rating&limit=6');
        const result = await response.json();
        if (!active) return;
        if (response.ok && result.success) {
          const artisans = result.data?.artisans || result.data || [];
          setRecommendedArtisans(artisans.slice(0, 6));
        } else {
          setError(result.error || 'Unable to load recommended artisans.');
        }
      } catch (loadError) {
        if (active) setError('Unable to load recommended artisans right now.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      active = false;
    };
  }, [authFetch, authLoading, user]);

  if (authLoading || !user) {
    return <LoadingSpinner message="Loading artisan discovery..." fullPage />;
  }

  return (
    <div className="container-fluid px-0" id="customer-discover-page">
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3 mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark mb-1">Discover Artisans</h2>
          <p className="text-muted mb-0">Find nearby professionals or browse trusted, highly rated artisans.</p>
        </div>
        <Link href="/artisans" className="btn btn-primary rounded-pill px-4">
          Browse all artisans
        </Link>
      </div>

      {error && <AlertMessage type="warning" message={error} onClose={() => setError(null)} />}

      <section className="mb-5" aria-labelledby="nearby-artisans-heading">
        <h3 id="nearby-artisans-heading" className="h5 fw-bold mb-3">Nearby artisans</h3>
        <NearbyArtisans />
      </section>

      <section aria-labelledby="recommended-artisans-heading">
        <div className="d-flex align-items-center justify-content-between gap-3 mb-3">
          <h3 id="recommended-artisans-heading" className="h5 fw-bold mb-0">Top-rated artisans</h3>
          <Link href="/artisans?sort=rating" className="text-primary text-decoration-none fw-semibold small">
            View all
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading recommended artisans..." />
        ) : recommendedArtisans.length === 0 ? (
          <EmptyState
            title="No recommendations available"
            description="Browse the marketplace to explore available services and artisans."
            icon="fa-users"
            actionText="Browse artisans"
            actionHref="/artisans"
          />
        ) : (
          <div className="row g-3">
            {recommendedArtisans.map((artisan) => (
              <div key={artisan.user_id || artisan.id} className="col-12 col-md-6 col-xl-4">
                <ArtisanCard artisan={artisan} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
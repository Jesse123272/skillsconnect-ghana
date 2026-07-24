'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/LoadingSpinner';
import ArtisanCard from '@/components/ArtisanCard';

const RADIUS_OPTIONS = [5, 10, 25, 50];
const ArtisanMap = dynamic(() => import('@/components/ArtisanMap'), { ssr: false });

export default function NearbyArtisans() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [radius, setRadius] = useState(10);
  const [artisans, setArtisans] = useState([]);
  const [status, setStatus] = useState('Finding artisans near you...');
  const [currentPosition, setCurrentPosition] = useState(null);

  useEffect(() => {
    async function locateAndFetch() {
      setIsLoading(true);
      setError('');
      setStatus('Finding artisans near you...');

      if (!navigator.geolocation) {
        setError('Geolocation is not supported in this browser.');
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            setCurrentPosition([position.coords.latitude, position.coords.longitude]);
            const params = new URLSearchParams({
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
              radius: radius.toString(),
              limit: '12'
            });

            const res = await fetch(`/api/artisans/nearby?${params.toString()}`);
            const json = await res.json();
            if (json.success) {
              setArtisans(json.data || []);
              setStatus('Showing artisans closest to your location.');
            } else {
              setError(json.error || 'Unable to load nearby artisans.');
            }
          } catch (err) {
            console.error(err);
            setError('Unable to fetch nearby artisans right now.');
          } finally {
            setIsLoading(false);
          }
        },
        (geoError) => {
          console.error(geoError);
          setError('Enable location to see artisans near you.');
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    locateAndFetch();
  }, [radius]);

  const sortedArtisans = useMemo(() => {
    return [...artisans].sort((a, b) => (b.weighted_score || 0) - (a.weighted_score || 0));
  }, [artisans]);

  return (
    <div className="border rounded-3 bg-white p-3 p-md-4 shadow-sm">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h5 className="fw-bold mb-1 text-dark">Nearby artisans</h5>
          <p className="text-muted small mb-0">Discover professionals ranked by closeness, ratings, and response quality.</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label className="form-label small mb-0 text-muted">Radius</label>
          <select className="form-select form-select-sm" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100px' }}>
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>{option} km</option>
            ))}
          </select>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-12">
          <div className="border rounded-3 overflow-hidden bg-light">
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom bg-white">
              <div>
                <div className="fw-semibold text-dark">Map of nearby artisans</div>
                <div className="small text-muted">Zoom and pan to explore artisans near your current location.</div>
              </div>
              <div className="text-end small text-secondary">
                {currentPosition ? `${currentPosition[0].toFixed(4)}, ${currentPosition[1].toFixed(4)}` : 'Location pending...'}
              </div>
            </div>
            {currentPosition && artisans.length > 0 ? (
              <div className="map-container" style={{ height: '360px' }}>
                <ArtisanMap artisans={artisans} currentPosition={currentPosition} />
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="fw-bold text-success">Map is loading...</div>
                <div className="small text-muted">Allow location access to see artisan pins on the map.</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="py-5 text-center">
          <LoadingSpinner />
          <p className="text-muted mt-3">Finding artisans near you...</p>
        </div>
      ) : error ? (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      ) : sortedArtisans.length === 0 ? (
        <div className="alert alert-info" role="alert">No nearby artisans matched this search radius.</div>
      ) : (
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
          {sortedArtisans.map((artisan, index) => (
            <div key={artisan.user_id || index} className="col">
              <div className="position-relative">
                <span className="position-absolute top-0 start-0 badge bg-warning text-dark rounded-pill m-3 z-2">
                  {artisan.distance_km ? `${Number(artisan.distance_km).toFixed(1)} km away` : 'Nearby'}
                </span>
                <ArtisanCard artisan={artisan} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

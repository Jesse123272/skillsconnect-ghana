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
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [locationSource, setLocationSource] = useState('fresh');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    async function loadArtisansForPosition(lat, lng, source = 'fresh') {
      if (!lat || !lng) {
        setError('Invalid location coordinates.');
        setIsLoading(false);
        return;
      }

      setCurrentPosition([lat, lng]);
      setLocationSource(source);
      setPermissionDenied(false);
      setStatus(source === 'session' ? 'Using location from this browser session.' : 'Showing artisans closest to your location.');

      try {
        const params = new URLSearchParams({
          latitude: lat.toString(),
          longitude: lng.toString(),
          radius: radius.toString(),
          limit: '12'
        });

        const res = await fetch(`/api/artisans/nearby?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setArtisans(json.data || []);
          setError('');
          setStatus(source === 'session' ? 'Using location from this browser session.' : 'Showing artisans closest to your location.');
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem('scg_geo_location', JSON.stringify([lat, lng]));
          }
        } else {
          setError(json.error || 'Unable to load nearby artisans.');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to fetch nearby artisans right now.');
      } finally {
        setIsLoading(false);
      }
    }

    async function locateAndFetch() {
      setIsLoading(true);
      setError('');
      setStatus('Finding artisans near you...');
      setPermissionDenied(false);

      if (typeof window === 'undefined' || !navigator.geolocation) {
        setError('Geolocation is not supported in this browser.');
        setIsLoading(false);
        return;
      }

      const stored = typeof window !== 'undefined' && window.sessionStorage.getItem('scg_geo_location');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length === 2) {
            await loadArtisansForPosition(parsed[0], parsed[1], 'session');
            return;
          }
        } catch {
          // Ignore stale stored location
        }
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await loadArtisansForPosition(position.coords.latitude, position.coords.longitude, 'fresh');
        },
        (geoError) => {
          console.error(geoError);
          setError('Enable location to see artisans near you.');
          setPermissionDenied(true);
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    locateAndFetch();
  }, [radius, retryKey]);

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
            {currentPosition ? (
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
          {permissionDenied && (
            <div className="mt-3">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary rounded-pill"
                onClick={() => setRetryKey((prev) => prev + 1)}
              >
                Retry location access
              </button>
            </div>
          )}
        </div>
      ) : sortedArtisans.length === 0 ? (
        <div className="alert alert-info" role="alert">
          No nearby artisans matched this search radius. Try increasing the radius or update your location permissions.
        </div>
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
